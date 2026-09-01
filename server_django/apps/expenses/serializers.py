from rest_framework import serializers
from .models import Expense
from apps.categories.models import Category
from apps.authentication.models import User
from django.utils import timezone
import pytz

class ExpenseSerializer(serializers.ModelSerializer):
    category_id = serializers.IntegerField(required=False, allow_null=True)
    category_name = serializers.ReadOnlyField()
    paid_by_user_id = serializers.IntegerField(required=False, allow_null=True)
    paid_by_name = serializers.ReadOnlyField()
    paid_by_email = serializers.ReadOnlyField()
    created_by_user_id = serializers.ReadOnlyField()
    created_by_name = serializers.ReadOnlyField()
    created_at_ist = serializers.ReadOnlyField()
    updated_at_ist = serializers.ReadOnlyField()
    expense_date = serializers.DateField(required=False)
    expense_time = serializers.CharField(required=False, default='12:00 PM')

    class Meta:
        model = Expense
        fields = [
            'id', 'title', 'amount',
            'category_id', 'category_name',
            'paid_by_user_id', 'paid_by_name', 'paid_by_email',
            'location', 'description',
            'expense_date', 'expense_time',
            'created_by_user_id', 'created_by_name',
            'created_at', 'created_at_ist',
            'updated_at', 'updated_at_ist'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def to_internal_value(self, data):
        # Support both camelCase and snake_case inputs
        mutable_data = data.copy() if hasattr(data, 'copy') else dict(data)

        if 'categoryId' in mutable_data and 'category_id' not in mutable_data:
            mutable_data['category_id'] = mutable_data['categoryId']
        if 'paidByUserId' in mutable_data and 'paid_by_user_id' not in mutable_data:
            mutable_data['paid_by_user_id'] = mutable_data['paidByUserId']
        if 'expenseDate' in mutable_data and 'expense_date' not in mutable_data:
            mutable_data['expense_date'] = mutable_data['expenseDate']
        if 'expenseTime' in mutable_data and 'expense_time' not in mutable_data:
            mutable_data['expense_time'] = mutable_data['expenseTime']

        # Default date if not provided
        if not mutable_data.get('expense_date'):
            ist = pytz.timezone('Asia/Kolkata')
            mutable_data['expense_date'] = timezone.now().astimezone(ist).date().strftime('%Y-%m-%d')

        return super().to_internal_value(mutable_data)

    def create(self, validated_data):
        category_id = validated_data.pop('category_id', None)
        paid_by_user_id = validated_data.pop('paid_by_user_id', None)

        category = Category.objects.filter(id=category_id).first() if category_id else None
        paid_by = User.objects.filter(id=paid_by_user_id).first() if paid_by_user_id else None
        created_by = self.context.get('request').user if (self.context.get('request') and self.context.get('request').user.is_authenticated) else paid_by

        if not paid_by:
            paid_by = User.objects.first()
        if not created_by:
            created_by = User.objects.first()

        expense = Expense.objects.create(
            category=category,
            paid_by=paid_by,
            created_by=created_by,
            **validated_data
        )
        return expense

    def update(self, instance, validated_data):
        category_id = validated_data.pop('category_id', None)
        paid_by_user_id = validated_data.pop('paid_by_user_id', None)

        if category_id is not None:
            instance.category = Category.objects.filter(id=category_id).first()
        if paid_by_user_id is not None:
            instance.paid_by = User.objects.filter(id=paid_by_user_id).first()

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()
        return instance
