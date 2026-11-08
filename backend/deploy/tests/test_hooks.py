import os
from django.test import TestCase, override_settings
from django.urls import reverse
from rest_framework.test import APIClient


class WorkshopHookTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_health_ok(self):
        response = self.client.get('/health')
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body['status'], 'ok')
        self.assertIn('version', body)
        self.assertIn('deployment_type', body)

    def test_deploy_health_ok(self):
        response = self.client.get('/deploy/health')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['status'], 'ok')

    def test_orders_ok_by_default(self):
        response = self.client.get('/api/orders')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['status'], 'ok')

    def test_orders_fail_mode(self):
        with self.settings():
            os.environ['SMOKE_FAIL'] = '1'
            try:
                response = self.client.get('/api/orders')
                self.assertEqual(response.status_code, 500)
            finally:
                os.environ.pop('SMOKE_FAIL', None)

    def test_member_without_rewards_tier(self):
        os.environ.pop('DEMO_REWARDS_TIER', None)
        response = self.client.get('/deploy/member')
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertIn('first_name', body)
        self.assertIn('email', body)
        self.assertNotIn('rewards_tier', body)

    def test_member_with_demo_rewards_tier(self):
        os.environ['DEMO_REWARDS_TIER'] = 'Gold'
        try:
            response = self.client.get('/deploy/member')
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.json()['rewards_tier'], 'Gold')
        finally:
            os.environ.pop('DEMO_REWARDS_TIER', None)

    def test_check_release_contract(self):
        response = self.client.get('/deploy/check/release')
        self.assertEqual(response.status_code, 200)
        self.assertIn(response.json()['deployment_type'], ('canary', 'normal'))

    def test_execution_contract(self):
        response = self.client.get('/deploy/execution')
        self.assertEqual(response.status_code, 200)
        body = response.json()
        for key in ('service_name', 'last_execution_id', 'application_version', 'deployment_type'):
            self.assertIn(key, body)


class DistributionCreateTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    @override_settings(DEPLOYMENT_VARIABLE='backend-deployment-canary-abc', APPLICATION_VERSION='v2')
    def test_create_reports_canary_tier_and_version(self):
        response = self.client.post('/deploy/create', {'name': 'normal'}, format='json')
        self.assertEqual(response.status_code, 201)
        body = response.json()
        self.assertEqual(body['name'], 'canary')
        self.assertIn('created_at', body)
        self.assertEqual(body['deployment_type'], 'canary')
        self.assertIn('application_version', body)
        self.assertIn('pod', body)

    @override_settings(DEPLOYMENT_VARIABLE='backend-deployment-7f9c')
    def test_create_reports_normal_tier(self):
        response = self.client.post('/deploy/create', {'name': 'normal'}, format='json')
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()['name'], 'normal')
        self.assertEqual(response.json()['deployment_type'], 'normal')


class ExecutionDetailsTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_values_come_from_pipeline_env(self):
        from unittest import mock
        env = {
            'APPLICATION_VERSION': 'cut1hws274-43',
            'LAST_EXECUTION_ID': '43',
            'EXECUTION_URL': 'https://app.harness.io/ng/account/x/executions/abc',
            'SERVICE_NAME': 'backend',
            'HOSTNAME': 'backend-deployment-canary-5d8b',
        }
        with mock.patch.dict(os.environ, env):
            body = self.client.get('/deploy/execution').json()
        self.assertEqual(body['application_version'], 'cut1hws274-43')
        self.assertEqual(body['last_execution_id'], '43')
        self.assertEqual(body['execution_url'], env['EXECUTION_URL'])
        self.assertEqual(body['deployment_type'], 'canary')
        self.assertEqual(body['pod'], env['HOSTNAME'])

    def test_unset_or_unresolved_values_are_empty_not_faked(self):
        from unittest import mock
        env = {'APPLICATION_VERSION': '<+artifacts.primary.tag>', 'EXECUTION_URL': 'null',
               'LAST_EXECUTION_ID': '', 'HARNESS_BUILD': ''}
        with mock.patch.dict(os.environ, env):
            body = self.client.get('/deploy/execution').json()
        self.assertEqual(body['application_version'], '')
        self.assertEqual(body['execution_url'], '')
        self.assertEqual(body['last_execution_id'], '')


@override_settings(MEMBERS_DB_ALIAS='default')
class MemberFromUsersTableTests(TestCase):
    """The member endpoint reads the Liquibase `users` table (DB3 in the workshop;
    the default SQLite DB here) and degrades gracefully at every Lab 6-7 stage."""

    def setUp(self):
        self.client = APIClient()
        os.environ.pop('DEMO_REWARDS_TIER', None)

    def _sql(self, *statements):
        from django.db import connection
        with connection.cursor() as cursor:
            for sql in statements:
                cursor.execute(sql)

    def _create_users(self, with_tier):
        cols = "id int primary key, first_name varchar(100), last_name varchar(100), email varchar(255) not null"
        if with_tier:
            cols += ", rewards_tier varchar(50)"
        self._sql(f"CREATE TABLE users ({cols})")

    def tearDown(self):
        self._sql("DROP TABLE IF EXISTS users")

    def test_no_users_table_falls_back_to_built_in_member(self):
        body = self.client.get('/deploy/member').json()
        self.assertEqual(body['first_name'], 'Captain')
        self.assertEqual(body['source'], 'built-in')
        self.assertNotIn('rewards_tier', body)

    def test_empty_table_before_lab6_has_no_tier(self):
        self._create_users(with_tier=False)
        body = self.client.get('/deploy/member').json()
        self.assertEqual(body['source'], 'built-in')
        self.assertNotIn('rewards_tier', body)

    def test_row_without_tier_column(self):
        self._create_users(with_tier=False)
        self._sql("INSERT INTO users (id, first_name, last_name, email) "
                  "VALUES (1, 'Captain', 'Canary', 'captain.canary@example.com')")
        body = self.client.get('/deploy/member').json()
        self.assertEqual(body['source'], 'local')
        self.assertEqual(body['last_name'], 'Canary')
        self.assertNotIn('rewards_tier', body)

    def test_null_tier_is_omitted(self):
        self._create_users(with_tier=True)
        self._sql("INSERT INTO users (id, first_name, last_name, email) "
                  "VALUES (1, 'Captain', 'Canary', 'captain.canary@example.com')")
        body = self.client.get('/deploy/member').json()
        self.assertNotIn('rewards_tier', body)

    def test_lab6_seeded_row_shows_platinum(self):
        self._create_users(with_tier=True)
        self._sql("INSERT INTO users (id, first_name, last_name, email, rewards_tier) "
                  "VALUES (1, 'Captain', 'Canary', 'captain.canary@example.com', 'Platinum')")
        body = self.client.get('/deploy/member').json()
        self.assertEqual(body['rewards_tier'], 'Platinum')
        self.assertEqual(body['email'], 'captain.canary@example.com')
        self.assertEqual(body['card_last4'], '1005')

    def test_db_tier_wins_over_demo_tier(self):
        self._create_users(with_tier=True)
        self._sql("INSERT INTO users (id, first_name, last_name, email, rewards_tier) "
                  "VALUES (1, 'Captain', 'Canary', 'c@example.com', 'Platinum')")
        os.environ['DEMO_REWARDS_TIER'] = 'Gold'
        try:
            body = self.client.get('/deploy/member').json()
        finally:
            os.environ.pop('DEMO_REWARDS_TIER', None)
        self.assertEqual(body['rewards_tier'], 'Platinum')

    @override_settings(MEMBERS_DB_ALIAS='members')
    def test_unconfigured_members_alias_degrades(self):
        body = self.client.get('/deploy/member').json()
        self.assertEqual(body['first_name'], 'Captain')
        self.assertEqual(body['source'], 'built-in')


class MembersDbRouterTests(TestCase):
    def test_migrate_never_targets_db3(self):
        from backend.db_routers import MembersDbRouter
        router = MembersDbRouter()
        for app in ('deploy', 'auth', 'contenttypes', 'sessions', 'admin'):
            self.assertFalse(router.allow_migrate('members', app))
            self.assertIsNone(router.allow_migrate('default', app))

    def test_models_stay_on_default(self):
        from backend.db_routers import MembersDbRouter
        from deploy.models import RequestEntry
        router = MembersDbRouter()
        self.assertEqual(router.db_for_read(RequestEntry), 'default')
        self.assertEqual(router.db_for_write(RequestEntry), 'default')
