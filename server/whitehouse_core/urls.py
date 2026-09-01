from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
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

urlpatterns = [
    # Root & Health Check
    path('', health_check, name='root_health_check'),
    path('health/', health_check, name='health_check_alt'),
    path('api/health/', health_check, name='api_health_check'),
    path('api/health', health_check),

    # Django Admin
    path('admin/', admin.site.urls),

    # App APIs
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
]
