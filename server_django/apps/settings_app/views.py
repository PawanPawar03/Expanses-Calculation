from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

from .models import AppSetting
from apps.audit.models import log_audit_event

class SettingsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        settings_objs = AppSetting.objects.all()
        settings_dict = {
            'websiteName': 'Whitehouse',
            'tagline': 'Simple. Transparent. Shared Expenses.',
            'currencySymbol': '₹',
            'allowMemberRegistration': 'true',
        }

        for s in settings_objs:
            settings_dict[s.key] = s.value

        return Response({
            'success': True,
            'settings': settings_dict
        }, status=status.HTTP_200_OK)

    def put(self, request):
        for key, value in request.data.items():
            AppSetting.objects.update_or_create(
                key=key,
                defaults={'value': str(value)}
            )

        log_audit_event(
            action='UPDATE_SETTINGS',
            details="System settings updated.",
            user=request.user,
            entity_type='Settings'
        )

        return Response({
            'success': True,
            'message': 'Settings saved successfully!'
        }, status=status.HTTP_200_OK)
