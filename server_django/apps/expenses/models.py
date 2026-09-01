from django.db import models
from django.conf import settings
from django.utils import timezone
import pytz

class Expense(models.Model):
    title = models.CharField(max_length=200)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    category = models.ForeignKey(
        'categories.Category',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='expenses'
    )
    paid_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='paid_expenses'
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_expenses'
    )
    location = models.CharField(max_length=200, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    expense_date = models.DateField(db_index=True)
    expense_time = models.CharField(max_length=30, default='12:00 PM')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'expenses'
        ordering = ['-expense_date', '-created_at']

    def __str__(self):
        return f"{self.title} - ₹{self.amount} ({self.paid_by.name if self.paid_by else 'Unknown'})"

    @property
    def category_id(self):
        return self.category.id if self.category else None

    @property
    def category_name(self):
        return self.category.name if self.category else 'General'

    @property
    def paid_by_user_id(self):
        return self.paid_by.id if self.paid_by else None

    @property
    def paid_by_name(self):
        return self.paid_by.name if self.paid_by else 'Unknown'

    @property
    def paid_by_email(self):
        return self.paid_by.email if self.paid_by else ''

    @property
    def created_by_user_id(self):
        return self.created_by.id if self.created_by else (self.paid_by.id if self.paid_by else None)

    @property
    def created_by_name(self):
        return self.created_by.name if self.created_by else (self.paid_by.name if self.paid_by else 'Admin')

    @property
    def created_at_ist(self):
        ist = pytz.timezone('Asia/Kolkata')
        dt = self.created_at.astimezone(ist) if self.created_at else timezone.now().astimezone(ist)
        return dt.strftime('%d %b %Y, %I:%M %p IST')

    @property
    def updated_at_ist(self):
        ist = pytz.timezone('Asia/Kolkata')
        dt = self.updated_at.astimezone(ist) if self.updated_at else timezone.now().astimezone(ist)
        return dt.strftime('%d %b %Y, %I:%M %p IST')
