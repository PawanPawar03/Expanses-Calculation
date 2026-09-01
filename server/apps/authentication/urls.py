from django.urls import path
from .views import LoginView, RegisterView, MeView, ChangePasswordView

urlpatterns = [
    path('login/', LoginView.as_view(), name='auth_login'),
    path('login', LoginView.as_view()),

    path('register/', RegisterView.as_view(), name='auth_register'),
    path('register', RegisterView.as_view()),

    path('me/', MeView.as_view(), name='auth_me'),
    path('me', MeView.as_view()),

    path('change-password/', ChangePasswordView.as_view(), name='auth_change_password'),
    path('change-password', ChangePasswordView.as_view()),
]
