from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated

from .models import Category
from .serializers import CategorySerializer
from apps.audit.models import log_audit_event

class CategoryListCreateView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        categories = Category.objects.all()
        serializer = CategorySerializer(categories, many=True)
        return Response({
            'success': True,
            'categories': serializer.data
        }, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = CategorySerializer(data=request.data)
        if not serializer.is_valid():
            errors = serializer.errors
            first_err = next(iter(errors.values()))[0] if errors else 'Invalid category data'
            return Response({'success': False, 'message': str(first_err)}, status=status.HTTP_400_BAD_REQUEST)

        category = serializer.save()
        log_audit_event(
            action='CREATE_CATEGORY',
            details=f"Created category '{category.name}'",
            user=request.user,
            entity_type='Category',
            entity_id=category.id
        )

        return Response({
            'success': True,
            'message': f"Category '{category.name}' created successfully!",
            'category': CategorySerializer(category).data
        }, status=status.HTTP_201_CREATED)

class CategoryDetailView(APIView):
    permission_classes = [AllowAny]

    def get_object(self, pk):
        try:
            return Category.objects.get(pk=pk)
        except Category.DoesNotExist:
            return None

    def get(self, request, pk):
        category = self.get_object(pk)
        if not category:
            return Response({'success': False, 'message': 'Category not found'}, status=status.HTTP_404_NOT_FOUND)
        return Response({'success': True, 'category': CategorySerializer(category).data})

    def put(self, request, pk):
        category = self.get_object(pk)
        if not category:
            return Response({'success': False, 'message': 'Category not found'}, status=status.HTTP_404_NOT_FOUND)

        serializer = CategorySerializer(category, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response({'success': False, 'message': 'Invalid category data'}, status=status.HTTP_400_BAD_REQUEST)

        category = serializer.save()
        return Response({'success': True, 'message': 'Category updated successfully!', 'category': CategorySerializer(category).data})

    def delete(self, request, pk):
        category = self.get_object(pk)
        if not category:
            return Response({'success': False, 'message': 'Category not found'}, status=status.HTTP_404_NOT_FOUND)

        cat_name = category.name
        category.delete()

        log_audit_event(
            action='DELETE_CATEGORY',
            details=f"Removed category '{cat_name}'",
            user=request.user,
            entity_type='Category',
            entity_id=pk
        )

        return Response({'success': True, 'message': f"Category '{cat_name}' removed successfully!"})
