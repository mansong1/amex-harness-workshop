from django.utils import timezone
from django.shortcuts import render
from django.http import HttpResponse, JsonResponse
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework import generics, status
from django.conf import settings
from django.db import connections
from deploy.models import RequestEntry
from deploy.serializers import RequestEntrySerializerEdit,RequestEntrySerializerView
import os
from datetime import datetime
import random


def _env(name):
    """Env value, or '' when unset or when Harness left the expression unresolved."""
    value = (os.getenv(name) or '').strip()
    if not value or value.startswith('<+') or value.lower() in ('null', 'none'):
        return ''
    return value


def _deployment_type_from_hostname():
    host = os.getenv('HOSTNAME') or getattr(settings, 'DEPLOYMENT_VARIABLE', None) or ''
    if host and 'canary' in host:
        return 'canary'
    return 'normal'


def _application_version():
    return _env('APPLICATION_VERSION')


class ExecutionDetails(APIView):
    """Release facts for the dashboard. Every value comes from the pod's env, which
    harness-deploy/backend/values.yaml fills from the pipeline run. Unset values are
    returned as empty strings so the UI can say 'unknown' instead of inventing one."""
    permission_classes = [AllowAny]
    def get(self, request):
        payload = {
            "service_name": _env('SERVICE_NAME'),
            "last_execution_id": _env('LAST_EXECUTION_ID') or _env('HARNESS_BUILD'),
            "execution_url": _env('EXECUTION_URL'),
            "application_version": _application_version(),
            "deployment_type": _deployment_type_from_hostname(),
            "pod": _env('HOSTNAME'),
        }
        return JsonResponse(payload, safe=False)

class RequestEntryCreate(generics.CreateAPIView):
    permission_classes = [AllowAny]
    serializer_class = RequestEntrySerializerEdit

    def perform_create(self, serializer):
        # Customize creation behavior here
        # For example, generate a name based on some logic
        if hasattr(settings, 'DEPLOYMENT_VARIABLE') and settings.DEPLOYMENT_VARIABLE:
            if 'canary' in settings.DEPLOYMENT_VARIABLE:
                deployment_type = 'canary'
            else:
                deployment_type= 'normal'
        else:
            deployment_type= 'normal'

        deployment_type=deployment_type
        serializer.save(name=deployment_type)

    def create(self, request, *args, **kwargs):
        # Additive fields for the Distribution Test page: which tier/version/pod
        # answered. Existing 'name' and 'created_at' are unchanged.
        response = super().create(request, *args, **kwargs)
        response.data['deployment_type'] = response.data.get('name', 'normal')
        response.data['application_version'] = _application_version()
        response.data['pod'] = _env('HOSTNAME')
        return response


class ViewDiagram(generics.ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = RequestEntrySerializerView
    def list(self,request):
        start_timestamp = str(request.GET.get('start_timestamp'))
        end_timestamp = str(request.GET.get('end_timestamp'))
        # Convert timestamps to datetime objects
        start_datetime = datetime.strptime(start_timestamp, '%Y-%m-%dT%H:%M:%S.%fZ')
        end_datetime = datetime.strptime(end_timestamp, '%Y-%m-%dT%H:%M:%S.%fZ')
        start_datetime = timezone.make_aware(start_datetime)
        end_datetime =timezone.make_aware(end_datetime)

        data = RequestEntry.objects.filter(created_at__range=(str(start_datetime), str(end_datetime)))
        serialiser = RequestEntrySerializerView(data,many=True)
        return JsonResponse(serialiser.data,safe=False)


class ViewBarDiagram(generics.ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = RequestEntrySerializerView
    def list(self,request):
        start_timestamp = str(request.GET.get('start_timestamp'))
        end_timestamp = str(request.GET.get('end_timestamp'))
        # Convert timestamps to datetime objects
        start_datetime = datetime.strptime(start_timestamp, '%Y-%m-%dT%H:%M:%S.%fZ')
        end_datetime = datetime.strptime(end_timestamp, '%Y-%m-%dT%H:%M:%S.%fZ')
        start_datetime = timezone.make_aware(start_datetime)
        end_datetime =timezone.make_aware(end_datetime)

        data = list(RequestEntry.objects.filter(created_at__range=(str(start_datetime), str(end_datetime))).values('name','created_at'))



        serialiser = RequestEntrySerializerView(data,many=True)
        return JsonResponse(data,safe=False)





class checkRelease(APIView):
    permission_classes = [AllowAny]
    def get(self, request):
        if hasattr(settings, 'DEPLOYMENT_VARIABLE') and settings.DEPLOYMENT_VARIABLE:
            if 'canary' in settings.DEPLOYMENT_VARIABLE:
                deployment_type = 'canary'
            else:
                deployment_type= 'normal'
        else:
            deployment_type= 'normal'
        payload={
           "deployment_type": deployment_type
        }
        return JsonResponse(payload,safe=False)


class HealthCheck(APIView):
    """Post-deploy smoke endpoint. Always 200 when the process is up."""
    permission_classes = [AllowAny]

    def get(self, request):
        payload = {
            "status": "ok",
            "version": _application_version(),
            "deployment_type": _deployment_type_from_hostname(),
        }
        return JsonResponse(payload, safe=False)


class OrdersApi(APIView):
    """Lab 13 Canary Smoke Test target. Returns 500 when SMOKE_FAIL is set."""
    permission_classes = [AllowAny]

    def get(self, request):
        fail = os.getenv('SMOKE_FAIL', '').strip().lower() in ('1', 'true', 'yes')
        if fail:
            return JsonResponse(
                {"detail": "orders unavailable", "deployment_type": _deployment_type_from_hostname()},
                status=500,
                safe=False,
            )
        return JsonResponse(
            {
                "status": "ok",
                # Clearly fictional sample orders for the demo app.
                "orders": [
                    {"id": "ORD-1042", "merchant": "Northwind Outfitters", "item": "Trail running shoes",
                     "amount": 129.00, "status": "Shipped", "date": "2026-11-03"},
                    {"id": "ORD-1039", "merchant": "Bookshop on Main", "item": "2 paperbacks",
                     "amount": 31.48, "status": "Delivered", "date": "2026-10-30"},
                    {"id": "ORD-1031", "merchant": "Contoso Electronics", "item": "USB-C dock",
                     "amount": 89.99, "status": "Delivered", "date": "2026-10-24"},
                ],
                "deployment_type": _deployment_type_from_hostname(),
            },
            safe=False,
        )


def _read_member_row(alias):
    """First row of the Liquibase-owned `users` table, as a dict, or None.

    Tries with `rewards_tier` first (present after Lab 6), then without it (column
    missing, e.g. before Lab 6 or after a Lab 7 rollback). Returns None when the
    table is missing, empty, or the database is unreachable."""
    queries = (
        "SELECT id, first_name, last_name, email, rewards_tier FROM users ORDER BY id LIMIT 1",
        "SELECT id, first_name, last_name, email FROM users ORDER BY id LIMIT 1",
    )
    try:
        conn = connections[alias]
    except Exception:
        return None
    for sql in queries:
        try:
            with conn.cursor() as cursor:
                cursor.execute(sql)
                row = cursor.fetchone()
                columns = [col[0] for col in cursor.description]
        except Exception:
            # Each statement autocommits, so a failed query doesn't poison the next.
            try:
                conn.close()
            except Exception:
                pass
            continue
        return dict(zip(columns, row)) if row else None
    return None


class MemberProfile(APIView):
    """
    Member profile for the Account dashboard.

    Reads the first row of the `users` table that Liquibase manages on DB3 (when
    DB_HOST is set; SQLite otherwise). Includes rewards_tier only when that column
    exists and has a value, which is what Lab 6's changesets provide.
    DEMO_REWARDS_TIER fills the tier for local demos when the database has none.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        demo_tier = os.getenv('DEMO_REWARDS_TIER', '').strip()
        alias = getattr(settings, 'MEMBERS_DB_ALIAS', 'default')
        member = {
            "id": 1,
            "first_name": "Captain",
            "last_name": "Canary",
            "email": "captain.canary@example.com",
            "card_last4": "1005",
        }
        source = "built-in"

        row = _read_member_row(alias)
        if row:
            source = "db3" if alias == 'members' else "local"
            member.update({
                "id": row.get("id", member["id"]),
                "first_name": row.get("first_name") or member["first_name"],
                "last_name": row.get("last_name") or member["last_name"],
                "email": row.get("email") or member["email"],
            })
            tier = (row.get("rewards_tier") or '').strip() if row.get("rewards_tier") else ''
            if tier:
                member["rewards_tier"] = tier

        if demo_tier and "rewards_tier" not in member:
            member["rewards_tier"] = demo_tier

        member["source"] = source
        return JsonResponse(member, safe=False)
