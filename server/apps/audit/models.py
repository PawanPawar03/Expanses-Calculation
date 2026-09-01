from django.db import models
from django.conf import settings
from django.utils import timezone
import pytz

class AuditLog(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_logs'
    )
    user_name = models.CharField(max_length=150, default='System')
    action = models.CharField(max_length=100)
    entity_type = models.CharField(max_length=100, default='System')
    entity_id = models.IntegerField(null=True, blank=True)
    details = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = 'audit_logs'
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.action}] {self.user_name}: {self.details[:50]}"

    @property
    def created_at_ist(self):
        ist = pytz.timezone('Asia/Kolkata')
        dt = self.created_at.astimezone(ist) if self.created_at else timezone.now().astimezone(ist)
        return dt.strftime('%d %b %Y, %I:%M %p IST')

def log_audit_event(action, details, user=None, user_name='System', entity_type='System', entity_id=None):
    try:
        AuditLog.objects.create(
            user=user if (user and user.is_authenticated) else None,
            user_name=user.name if (user and user.is_authenticated) else user_name,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            details=details,
        )
    except Exception as e:
        print(f"Failed to log audit event: {e}")
