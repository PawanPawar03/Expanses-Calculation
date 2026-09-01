from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.db.models import Sum, Q

from .models import Expense
from .serializers import ExpenseSerializer
from apps.audit.models import log_audit_event

class ExpenseListCreateView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        queryset = Expense.objects.all()

        # Query filters
        search = request.GET.get('search', '').strip()
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(location__icontains=search) |
                Q(description__icontains=search) |
                Q(paid_by__name__icontains=search)
            )

        category_id = request.GET.get('categoryId') or request.GET.get('category_id')
        if category_id:
            queryset = queryset.filter(category_id=category_id)

        paid_by_user_id = request.GET.get('paidByUserId') or request.GET.get('paid_by_user_id')
        if paid_by_user_id:
            queryset = queryset.filter(paid_by_id=paid_by_user_id)

        start_date = request.GET.get('startDate') or request.GET.get('start_date')
        if start_date:
            queryset = queryset.filter(expense_date__gte=start_date)

        end_date = request.GET.get('endDate') or request.GET.get('end_date')
        if end_date:
            queryset = queryset.filter(expense_date__lte=end_date)

        total_amount = queryset.aggregate(total=Sum('amount'))['total'] or 0
        total_count = queryset.count()

        # Check limit
        limit = request.GET.get('limit')
        if limit and limit.isdigit():
            expenses_list = queryset[:int(limit)]
        else:
            expenses_list = queryset

        serializer = ExpenseSerializer(expenses_list, many=True)

        return Response({
            'success': True,
            'summary': {
                'totalAmount': float(total_amount),
                'totalCount': total_count,
                'page': 1,
                'totalPages': 1,
            },
            'expenses': serializer.data
        }, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = ExpenseSerializer(data=request.data, context={'request': request})
        if not serializer.is_valid():
            errors = serializer.errors
            first_err = next(iter(errors.values()))[0] if errors else 'Invalid expense data'
            return Response({'success': False, 'message': str(first_err)}, status=status.HTTP_400_BAD_REQUEST)

        expense = serializer.save()

        # Log audit
        payer_name = expense.paid_by.name if expense.paid_by else 'User'
        log_audit_event(
            action='CREATE_EXPENSE',
            details=f"{payer_name} added '{expense.title}' ₹{expense.amount}",
            user=request.user,
            entity_type='Expense',
            entity_id=expense.id
        )

        return Response({
            'success': True,
            'message': 'Expense added successfully',
            'expenseId': expense.id,
            'expense': ExpenseSerializer(expense).data
        }, status=status.HTTP_201_CREATED)

class ExpenseDetailView(APIView):
    permission_classes = [AllowAny]

    def get_object(self, pk):
        try:
            return Expense.objects.get(pk=pk)
        except Expense.DoesNotExist:
            return None

    def get(self, request, pk):
        expense = self.get_object(pk)
        if not expense:
            return Response({'success': False, 'message': 'Expense not found'}, status=status.HTTP_404_NOT_FOUND)
        return Response({'success': True, 'expense': ExpenseSerializer(expense).data})

    def put(self, request, pk):
        expense = self.get_object(pk)
        if not expense:
            return Response({'success': False, 'message': 'Expense not found'}, status=status.HTTP_404_NOT_FOUND)

        serializer = ExpenseSerializer(expense, data=request.data, partial=True, context={'request': request})
        if not serializer.is_valid():
            return Response({'success': False, 'message': 'Invalid expense data'}, status=status.HTTP_400_BAD_REQUEST)

        expense = serializer.save()
        log_audit_event(
            action='UPDATE_EXPENSE',
            details=f"Updated expense '{expense.title}' (₹{expense.amount})",
            user=request.user,
            entity_type='Expense',
            entity_id=expense.id
        )

        return Response({'success': True, 'message': 'Expense updated successfully', 'expense': ExpenseSerializer(expense).data})

    def delete(self, request, pk):
        expense = self.get_object(pk)
        if not expense:
            return Response({'success': False, 'message': 'Expense not found'}, status=status.HTTP_404_NOT_FOUND)

        title = expense.title
        amt = expense.amount
        expense.delete()

        log_audit_event(
            action='DELETE_EXPENSE',
            details=f"Deleted expense '{title}' (₹{amt})",
            user=request.user,
            entity_type='Expense',
            entity_id=pk
        )

        return Response({'success': True, 'message': 'Expense deleted successfully'})
