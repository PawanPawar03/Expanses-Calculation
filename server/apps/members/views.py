from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.db.models import Sum, Count
from django.utils import timezone
import pytz

from apps.authentication.models import User
from apps.authentication.serializers import UserSerializer
from apps.expenses.models import Expense
from apps.expenses.serializers import ExpenseSerializer
from apps.audit.models import log_audit_event

class MemberListCreateView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        users = User.objects.filter(deleted_at__isnull=True).order_by('id')
        user_list = []

        for u in users:
            u_exp = Expense.objects.filter(paid_by=u)
            total_paid = u_exp.aggregate(total=Sum('amount'))['total'] or 0
            count = u_exp.count()
            
            data = UserSerializer(u).data
            data['expense_count'] = count
            data['total_paid'] = float(total_paid)
            user_list.append(data)

        return Response({
            'success': True,
            'users': user_list
        }, status=status.HTTP_200_OK)

    def post(self, request):
        name = request.data.get('name', '').strip()
        email = request.data.get('email', '').strip().lower()
        mobile = request.data.get('mobile', None)
        password = request.data.get('password', 'password123')
        role = request.data.get('role', 'USER')
        user_status = request.data.get('status', 'ACTIVE')

        if not name or not email:
            return Response({'success': False, 'message': 'Name and email are required.'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(email=email, deleted_at__isnull=True).exists():
            return Response({'success': False, 'message': 'A member with this email already exists.'}, status=status.HTTP_400_BAD_REQUEST)

        # Check if previously soft-deleted, restore or create fresh
        user = User.objects.filter(email=email).first()
        if user and user.deleted_at:
            user.deleted_at = None
            user.name = name
            user.mobile = mobile
            user.role = role
            user.status = user_status
            user.set_password(password)
            user.save()
        else:
            user = User.objects.create_user(
                email=email,
                name=name,
                password=password,
                mobile=mobile,
                role=role,
                status=user_status
            )

        log_audit_event(
            action='ADMIN_CREATE_USER',
            details=f"Admin created member: {user.name} ({user.email}) [{user.role}]",
            user=request.user,
            entity_type='User',
            entity_id=user.id
        )

        return Response({
            'success': True,
            'message': f"Member {name} added successfully!",
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)

class MemberDetailView(APIView):
    permission_classes = [AllowAny]

    def get_object(self, pk):
        try:
            return User.objects.get(pk=pk, deleted_at__isnull=True)
        except User.DoesNotExist:
            return None

    def get(self, request, pk):
        user = self.get_object(pk)
        if not user:
            return Response({'success': False, 'message': 'Member not found'}, status=status.HTTP_404_NOT_FOUND)

        expenses = Expense.objects.filter(paid_by=user).order_by('-expense_date', '-created_at')
        total_paid = expenses.aggregate(total=Sum('amount'))['total'] or 0

        ist = pytz.timezone('Asia/Kolkata')
        today_ist = timezone.now().astimezone(ist).date()
        
        today_paid = expenses.filter(expense_date=today_ist).aggregate(total=Sum('amount'))['total'] or 0
        this_month_paid = expenses.filter(expense_date__year=today_ist.year, expense_date__month=today_ist.month).aggregate(total=Sum('amount'))['total'] or 0

        return Response({
            'success': True,
            'user': UserSerializer(user).data,
            'stats': {
                'totalExpensesPaid': float(total_paid),
                'numberOfExpenses': expenses.count(),
                'thisMonthPaid': float(this_month_paid),
                'todayPaid': float(today_paid),
            },
            'expenses': ExpenseSerializer(expenses, many=True).data
        })

    def put(self, request, pk):
        user = self.get_object(pk)
        if not user:
            return Response({'success': False, 'message': 'Member not found'}, status=status.HTTP_404_NOT_FOUND)

        serializer = UserSerializer(user, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response({'success': False, 'message': 'Invalid member data'}, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.save()
        if 'password' in request.data and request.data['password']:
            user.set_password(request.data['password'])
            user.save(update_fields=['password'])

        log_audit_event(
            action='ADMIN_UPDATE_USER',
            details=f"Admin updated member {user.name} ({user.email})",
            user=request.user,
            entity_type='User',
            entity_id=user.id
        )

        return Response({'success': True, 'message': 'Member updated successfully!', 'user': UserSerializer(user).data})

    def delete(self, request, pk):
        user = self.get_object(pk)
        if not user:
            return Response({'success': False, 'message': 'Member not found'}, status=status.HTTP_404_NOT_FOUND)

        user_name = user.name
        user_email = user.email
        
        # Soft delete
        user.deleted_at = timezone.now()
        user.status = 'INACTIVE'
        user.save()

        log_audit_event(
            action='ADMIN_DELETE_USER',
            details=f"Admin deleted member: {user_name} ({user_email})",
            user=request.user,
            entity_type='User',
            entity_id=pk
        )

        return Response({'success': True, 'message': 'Member deleted successfully'})

class MemberStatusView(APIView):
    permission_classes = [AllowAny]

    def patch(self, request, pk):
        try:
            user = User.objects.get(pk=pk, deleted_at__isnull=True)
        except User.DoesNotExist:
            return Response({'success': False, 'message': 'Member not found'}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get('status')
        if new_status in ['ACTIVE', 'INACTIVE']:
            user.status = new_status
            user.save(update_fields=['status'])

            log_audit_event(
                action='UPDATE_USER_STATUS',
                details=f"Status changed to {new_status} for {user.name}",
                user=request.user,
                entity_type='User',
                entity_id=user.id
            )

            return Response({'success': True, 'message': f'Member status updated to {new_status}!'})
        return Response({'success': False, 'message': 'Invalid status value'}, status=status.HTTP_400_BAD_REQUEST)
