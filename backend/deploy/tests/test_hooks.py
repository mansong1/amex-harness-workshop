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
