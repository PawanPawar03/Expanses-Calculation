from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.db.models import Sum, Count
from django.utils import timezone
import pytz
import datetime

from apps.authentication.models import User
from apps.categories.models import Category
from apps.expenses.models import Expense

class SummaryReportView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        ist = pytz.timezone('Asia/Kolkata')
        now_ist = timezone.now().astimezone(ist)
        today_date = now_ist.date()

        total_members = User.objects.filter(deleted_at__isnull=True).count()
        active_members = User.objects.filter(deleted_at__isnull=True, status='ACTIVE').count()

        all_expenses = Expense.objects.all()
        total_amount = all_expenses.aggregate(total=Sum('amount'))['total'] or 0
        total_count = all_expenses.count()

        today_expenses = all_expenses.filter(expense_date=today_date)
        today_total = today_expenses.aggregate(total=Sum('amount'))['total'] or 0
        today_count = today_expenses.count()

        month_expenses = all_expenses.filter(expense_date__year=today_date.year, expense_date__month=today_date.month)
        month_total = month_expenses.aggregate(total=Sum('amount'))['total'] or 0
        month_count = month_expenses.count()

        return Response({
            'success': True,
            'summary': {
                'totalMembers': total_members,
                'activeMembers': active_members,
                'totalExpensesCount': total_count,
                'totalAmountPaid': float(total_amount),
                'todayExpenses': float(today_total),
                'todayExpensesCount': today_count,
                'currentMonthExpenses': float(month_total),
                'currentMonthExpensesCount': month_count,
            }
        }, status=status.HTTP_200_OK)

class MemberReportView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        ist = pytz.timezone('Asia/Kolkata')
        today_date = timezone.now().astimezone(ist).date()

        all_expenses = Expense.objects.all()
        grand_total = float(all_expenses.aggregate(total=Sum('amount'))['total'] or 0)
        divisor = grand_total if grand_total > 0 else 1.0

        users = User.objects.filter(deleted_at__isnull=True).order_by('id')
        member_stats = []

        for u in users:
            u_expenses = all_expenses.filter(paid_by=u)
            total_paid = float(u_expenses.aggregate(total=Sum('amount'))['total'] or 0)
            today_paid = float(u_expenses.filter(expense_date=today_date).aggregate(total=Sum('amount'))['total'] or 0)
            month_paid = float(u_expenses.filter(expense_date__year=today_date.year, expense_date__month=today_date.month).aggregate(total=Sum('amount'))['total'] or 0)
            count = u_expenses.count()
            percentage = round((total_paid / divisor) * 100, 1)

            member_stats.append({
                'id': u.id,
                'name': u.name,
                'email': u.email,
                'role': u.role,
                'status': u.status,
                'expenseCount': count,
                'totalPaid': total_paid,
                'thisMonthPaid': month_paid,
                'todayPaid': today_paid,
                'percentage': percentage,
            })

        return Response({
            'success': True,
            'grandTotal': grand_total,
            'members': member_stats
        }, status=status.HTTP_200_OK)

class CategoryReportView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        all_expenses = Expense.objects.all()
        grand_total = float(all_expenses.aggregate(total=Sum('amount'))['total'] or 0)
        divisor = grand_total if grand_total > 0 else 1.0

        categories = Category.objects.all().order_by('id')
        cat_stats = []

        for c in categories:
            c_expenses = all_expenses.filter(category=c)
            total = float(c_expenses.aggregate(total=Sum('amount'))['total'] or 0)
            count = c_expenses.count()
            percentage = round((total / divisor) * 100, 1)

            cat_stats.append({
                'id': c.id,
                'name': c.name,
                'icon': c.icon,
                'count': count,
                'total': total,
                'percentage': percentage,
            })

        return Response({
            'success': True,
            'grandTotal': grand_total,
            'categories': cat_stats
        }, status=status.HTTP_200_OK)

class MonthlyReportView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        ist = pytz.timezone('Asia/Kolkata')
        current_year = timezone.now().astimezone(ist).year
        all_expenses = Expense.objects.filter(expense_date__year=current_year)

        month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        monthly_data = []

        for i, name in enumerate(month_names, start=1):
            m_expenses = all_expenses.filter(expense_date__month=i)
            total = float(m_expenses.aggregate(total=Sum('amount'))['total'] or 0)
            count = m_expenses.count()
            month_key = f"{current_year}-{i:02d}"
            monthly_data.append({
                'month': f"{name} {current_year}",
                'monthKey': month_key,
                'name': name,
                'total': total,
                'count': count,
            })

        return Response({
            'success': True,
            'year': str(current_year),
            'monthlyData': monthly_data
        }, status=status.HTTP_200_OK)

class DailyReportView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        ist = pytz.timezone('Asia/Kolkata')
        today = timezone.now().astimezone(ist).date()
        days_data = []

        for offset in range(6, -1, -1):
            target_date = today - datetime.timedelta(days=offset)
            d_expenses = Expense.objects.filter(expense_date=target_date)
            total = float(d_expenses.aggregate(total=Sum('amount'))['total'] or 0)
            count = d_expenses.count()

            days_data.append({
                'date': target_date.strftime('%Y-%m-%d'),
                'displayDate': target_date.strftime('%d %b'),
                'total': total,
                'count': count,
            })

        return Response({
            'success': True,
            'days': days_data
        }, status=status.HTTP_200_OK)
