from django.urls import path
from .views import CategoryListCreateView, CategoryDetailView

urlpatterns = [
    path('', CategoryListCreateView.as_view(), name='category_list_create'),
    path('<int:pk>/', CategoryDetailView.as_view(), name='category_detail'),
    path('<int:pk>', CategoryDetailView.as_view()),
]
