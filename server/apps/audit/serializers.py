from rest_framework import serializers
from .models import AuditLog

class AuditLogSerializer(serializers.ModelSerializer):
    created_at_ist = serializers.ReadOnlyField()

    class Meta:
        model = AuditLog
        fields = ['id', 'user_id', 'user_name', 'action', 'entity_type', 'entity_id', 'details', 'created_at', 'created_at_ist']
