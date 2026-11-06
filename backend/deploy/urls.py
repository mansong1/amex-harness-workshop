from django.urls import path

from deploy.views import (
    RequestEntryCreate,
    ViewDiagram,
    ViewBarDiagram,
    ExecutionDetails,
    checkRelease,
    HealthCheck,
    MemberProfile,
)

urlpatterns=[
    path('create',RequestEntryCreate.as_view(), name='createEntry'),
    path('execution',ExecutionDetails.as_view(), name='execution'),
    path('distribution',ViewDiagram.as_view(),name='distribution' ),
    path('distribution/bar', ViewBarDiagram.as_view(), name='distribution'),
    path('check/release', checkRelease.as_view(), name='release'),
    path('health', HealthCheck.as_view(), name='deploy-health'),
    path('member', MemberProfile.as_view(), name='member'),
]
