from django.urls import path
from .views import SummaryReportView, MemberReportView, CategoryReportView, MonthlyReportView, DailyReportView

urlpatterns = [
    path('summary/', SummaryReportView.as_view(), name='report_summary'),
    path('summary', SummaryReportView.as_view()),
    path('members/', MemberReportView.as_view(), name='report_members'),
    path('members', MemberReportView.as_view()),
    path('categories/', CategoryReportView.as_view(), name='report_categories'),
    path('categories', CategoryReportView.as_view()),
    path('monthly/', MonthlyReportView.as_view(), name='report_monthly'),
    path('monthly', MonthlyReportView.as_view()),
    path('daily/', DailyReportView.as_view(), name='report_daily'),
    path('daily', DailyReportView.as_view()),
]
