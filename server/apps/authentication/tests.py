from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from apps.authentication.models import User
from apps.categories.models import Category
from apps.expenses.models import Expense

class WhitehouseAPITestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin_user = User.objects.create_superuser(
            email='admin@whitehouse.com',
            name='Admin',
            password='admin123'
        )
        self.pawan_user = User.objects.create_user(
            email='pawan@whitehouse.com',
            name='Pawan',
            password='pawan123'
        )
        self.category = Category.objects.create(
            name='Food',
            description='Meals and snacks',
            icon='Utensils'
        )

    def test_health_check(self):
        response = self.client.get('/api/health/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()['status'], 'healthy')

    def test_admin_login(self):
        response = self.client.post('/api/auth/login/', {
            'email': 'admin@whitehouse.com',
            'password': 'admin123'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertTrue(data['success'])
        self.assertIn('token', data)
        self.assertEqual(data['user']['role'], 'ADMIN')

    def test_pawan_login_by_username(self):
        response = self.client.post('/api/auth/login/', {
            'email': 'pawan',
            'password': 'pawan123'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertTrue(data['success'])
        self.assertEqual(data['user']['name'], 'Pawan')

    def test_create_and_list_expense(self):
        # Login to get token
        login_res = self.client.post('/api/auth/login/', {
            'email': 'pawan@whitehouse.com',
            'password': 'pawan123'
        })
        token = login_res.json()['token']
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + token)

        # Create expense
        create_res = self.client.post('/api/expenses/', {
            'title': 'Dinner Thali',
            'amount': 250.00,
            'categoryId': self.category.id,
            'paidByUserId': self.pawan_user.id,
            'location': 'Hotel Mayur',
            'expenseDate': '2026-09-01',
            'expenseTime': '08:30 PM'
        })
        self.assertEqual(create_res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(create_res.json()['success'])

        # List expenses
        list_res = self.client.get('/api/expenses/')
        self.assertEqual(list_res.status_code, status.HTTP_200_OK)
        data = list_res.json()
        self.assertEqual(len(data['expenses']), 1)
        self.assertEqual(data['summary']['totalAmount'], 250.0)

    def test_reports_summary(self):
        Expense.objects.create(
            title='Internet Bill',
            amount=799.00,
            category=self.category,
            paid_by=self.admin_user,
            expense_date='2026-09-01'
        )
        response = self.client.get('/api/reports/summary/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data['summary']['totalExpensesCount'], 1)
        self.assertEqual(data['summary']['totalAmountPaid'], 799.00)
