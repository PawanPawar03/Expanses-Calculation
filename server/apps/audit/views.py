from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

from .models import AuditLog
from .serializers import AuditLogSerializer

class AuditLogListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        logs = AuditLog.objects.all().order_by('-created_at')
        total_count = logs.count()
        
        limit = request.GET.get('limit')
        if limit and limit.isdigit():
            logs_list = logs[:int(limit)]
        else:
            logs_list = logs

        serializer = AuditLogSerializer(logs_list, many=True)
        return Response({
            'success': True,
            'totalCount': total_count,
            'page': 1,
            'totalPages': 1,
            'logs': serializer.data
        }, status=status.HTTP_200_OK)
