from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.utils import timezone
import pytz

class UserManager(BaseUserManager):
    def create_user(self, email, name, password=None, **extra_fields):
        if not email:
            raise ValueError('Email address is required')
        email = self.normalize_email(email).lower()
        extra_fields.setdefault('role', 'USER')
        extra_fields.setdefault('status', 'ACTIVE')
        user = self.model(email=email, name=name, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, email, name, password=None, **extra_fields):
        extra_fields.setdefault('role', 'ADMIN')
        extra_fields.setdefault('status', 'ACTIVE')
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, name, password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = (
        ('ADMIN', 'Admin'),
        ('USER', 'Member'),
    )
    STATUS_CHOICES = (
        ('ACTIVE', 'Active'),
        ('INACTIVE', 'Inactive'),
    )

    name = models.CharField(max_length=150)
    email = models.EmailField(unique=True, db_index=True)
    mobile = models.CharField(max_length=30, blank=True, null=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='USER')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')
    
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True, db_index=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name']

    class Meta:
        db_table = 'users'
        ordering = ['id']

    def __str__(self):
        return f"{self.name} ({self.email}) [{self.role}]"

    @property
    def is_admin(self):
        return self.role == 'ADMIN' or self.is_superuser

    @property
    def created_at_ist(self):
        ist = pytz.timezone('Asia/Kolkata')
        dt = self.created_at.astimezone(ist) if self.created_at else timezone.now().astimezone(ist)
        return dt.strftime('%d %b %Y, %I:%M %p IST')
