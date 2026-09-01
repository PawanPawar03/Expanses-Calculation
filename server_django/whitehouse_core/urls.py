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
        'app': 'Whitehouse Expense Management API (Django REST Framework)',
        'ist_time': now_ist.strftime('%d %b %Y, %I:%M:%S %p IST'),
        'timezone': 'Asia/Kolkata',
    })

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health/', health_check, name='health_check'),
    path('api/health', health_check),

    # App URLs
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
