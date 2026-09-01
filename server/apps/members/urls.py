from django.urls import path
from .views import MemberListCreateView, MemberDetailView, MemberStatusView

urlpatterns = [
    path('', MemberListCreateView.as_view(), name='member_list_create'),
    path('<int:pk>/', MemberDetailView.as_view(), name='member_detail'),
    path('<int:pk>', MemberDetailView.as_view()),
    path('<int:pk>/status/', MemberStatusView.as_view(), name='member_status'),
    path('<int:pk>/status', MemberStatusView.as_view()),
]
