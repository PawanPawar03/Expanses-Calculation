import os
from pathlib import Path
from django.contrib import admin
from django.urls import path, include, re_path
from django.http import JsonResponse, FileResponse, HttpResponse
from django.conf import settings
from django.utils import timezone
import pytz

def health_check(request):
    ist = pytz.timezone('Asia/Kolkata')
    now_ist = timezone.now().astimezone(ist)
    return JsonResponse({
        'status': 'healthy',
        'message': 'Whitehouse Expense Management API is live on AWS Elastic Beanstalk!',
        'database': 'Amazon RDS PostgreSQL',
        'ist_time': now_ist.strftime('%d %b %Y, %I:%M:%S %p IST'),
        'timezone': 'Asia/Kolkata',
    })

def serve_react_app(request):
    """Serve compiled React Web App directly from Django for 100% same-origin live sync"""
    index_file = settings.BASE_DIR / 'staticfiles' / 'client' / 'index.html'
    if index_file.exists():
        return FileResponse(open(index_file, 'rb'), content_type='text/html')
    return health_check(request)

def serve_react_asset(request, asset_path):
    """Serve React CSS/JS assets"""
    file_path = settings.BASE_DIR / 'staticfiles' / 'client' / 'assets' / asset_path
    if file_path.exists():
        content_type = 'text/javascript' if asset_path.endswith('.js') else ('text/css' if asset_path.endswith('.css') else 'application/octet-stream')
        return FileResponse(open(file_path, 'rb'), content_type=content_type)
    return HttpResponse(status=404)

urlpatterns = [
    # Health Check API
    path('api/health/', health_check, name='api_health_check'),
    path('api/health', health_check),

    # Django Admin
    path('admin/', admin.site.urls),

    # REST APIs
    path('api/auth/', include('apps.authentication.urls')),
    path('api/auth', include('apps.authentication.urls')),

    path('api/users/', include('apps.members.urls')),
    path('api/users', include('apps.members.urls')),

    path('api/categories/', include('apps.categories.urls')),
    path('api/categories', include('apps.categories.urls')),

    path('api/expenses/', include('apps.expenses.urls')),
    path('api/expenses', include('apps.expenses.urls')),

    path('api/reports/', include('apps.reports.urls')),
    path('api/reports', include('apps.reports.urls')),

    path('api/audit-logs/', include('apps.audit.urls')),
    path('api/audit-logs', include('apps.audit.urls')),

    path('api/settings/', include('apps.settings_app.urls')),
    path('api/settings', include('apps.settings_app.urls')),

    # React Static Assets
    path('assets/<str:asset_path>', serve_react_asset),

    # React Single Page App UI (Root and all frontend routes)
    path('', serve_react_app, name='react_root'),
]
