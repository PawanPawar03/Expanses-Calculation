from django.db import models

class AppSetting(models.Model):
    key = models.CharField(max_length=100, unique=True, db_index=True)
    value = models.TextField()
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'app_settings'

    def __str__(self):
        return f"{self.key}: {self.value}"
