from django.core.management.base import BaseCommand
from django.db import connection
from apps.authentication.models import User
from apps.categories.models import Category
from apps.settings_app.models import AppSetting
from apps.audit.models import AuditLog

class Command(BaseCommand):
    help = 'Seeds initial clean database with Admin, Pawan, Categories, and App Settings (0 dummy expenses)'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE('[+] Seeding Whitehouse database...'))

        try:
            # Test connection
            with connection.cursor() as cursor:
                cursor.execute('SELECT 1;')
        except Exception as e:
            self.stdout.write(self.style.WARNING(f'[!] Database connection warning: {e}'))
            self.stdout.write(self.style.NOTICE('[!] Seeding skipped until database connectivity is verified.'))
            return

        try:
            # 1. Clean Users (Only Admin & Pawan)
            users_data = [
                {
                    'email': 'admin@whitehouse.com',
                    'name': 'Admin',
                    'password': 'admin123',
                    'role': 'ADMIN',
                    'mobile': '+91 9876543210',
                    'is_staff': True,
                    'is_superuser': True,
                },
                {
                    'email': 'pawan@whitehouse.com',
                    'name': 'Pawan',
                    'password': 'pawan123',
                    'role': 'USER',
                    'mobile': '+91 9823012345',
                    'is_staff': False,
                    'is_superuser': False,
                }
            ]

            for u_data in users_data:
                email = u_data['email']
                user = User.objects.filter(email=email).first()
                if not user:
                    user = User.objects.create_user(
                        email=email,
                        name=u_data['name'],
                        password=u_data['password'],
                        mobile=u_data['mobile'],
                        role=u_data['role'],
                        status='ACTIVE',
                        is_staff=u_data['is_staff'],
                        is_superuser=u_data['is_superuser'],
                    )
                    self.stdout.write(self.style.SUCCESS(f"[OK] Created {user.role}: {user.name} ({user.email})"))
                else:
                    user.name = u_data['name']
                    user.role = u_data['role']
                    user.status = 'ACTIVE'
                    user.deleted_at = None
                    user.set_password(u_data['password'])
                    user.save()
                    self.stdout.write(self.style.SUCCESS(f"[OK] Updated {user.role}: {user.name} ({user.email})"))

            # 2. Categories
            categories_data = [
                {'name': 'Food', 'description': 'Meals, snacks, dining out, mess', 'icon': 'Utensils'},
                {'name': 'Grocery', 'description': 'Supermarket, provisions, vegetables, milk', 'icon': 'ShoppingBag'},
                {'name': 'Electricity', 'description': 'Monthly electricity bill & maintenance', 'icon': 'Zap'},
                {'name': 'Rent', 'description': 'Monthly apartment rent & deposit', 'icon': 'Home'},
                {'name': 'Internet', 'description': 'High-speed broadband & Wi-Fi', 'icon': 'Wifi'},
                {'name': 'Household', 'description': 'Cleaning supplies, repairs, toiletries, maid', 'icon': 'Lamp'},
                {'name': 'Transportation', 'description': 'Fuel, cab, auto, metro, bus', 'icon': 'Car'},
                {'name': 'Other', 'description': 'Miscellaneous shared expenses', 'icon': 'Receipt'},
            ]

            for c_data in categories_data:
                cat, created = Category.objects.get_or_create(
                    name=c_data['name'],
                    defaults={'description': c_data['description'], 'icon': c_data['icon'], 'status': 'ACTIVE'}
                )
                if created:
                    self.stdout.write(self.style.SUCCESS(f"[OK] Created Category: {cat.name}"))

            # 3. Settings
            settings_data = [
                ('websiteName', 'Whitehouse'),
                ('tagline', 'Simple. Transparent. Shared Expenses.'),
                ('currencySymbol', '₹'),
                ('allowMemberRegistration', 'true'),
            ]

            for key, val in settings_data:
                AppSetting.objects.get_or_create(key=key, defaults={'value': val})

            # 4. Audit Log
            if not AuditLog.objects.exists():
                AuditLog.objects.create(
                    user_name='System',
                    action='SYSTEM_INITIALIZATION',
                    entity_type='System',
                    details='Whitehouse Django REST Framework Database Initialized.'
                )

            self.stdout.write(self.style.SUCCESS('[SUCCESS] Database seed complete! 0 dummy expenses. Ready for production.'))
        except Exception as err:
            self.stdout.write(self.style.WARNING(f'[!] Seed encountered error: {err}'))
