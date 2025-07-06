from django.urls import path
from .views import (GraphCreateView, GraphListView, GraphDetailView, AddSommetView, AddArcView, RunDemoucronView, MatrixDemoucronView,
    DeleteSommetView, DeleteArcView, GraphDeleteView, GraphClearView)
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from rest_framework import permissions

swagger_info = openapi.Info(
    title="Demoucron API",
    default_version='v1',
    description="API pour gérer des graphes et exécuter l'algorithme de Demoucron pour calculer les chemins minimaux et maximaux.",
    terms_of_service="https://www.example.com/terms/",
    contact=openapi.Contact(email="contact@example.com"),
    license=openapi.License(name="MIT License"),
)

swagger_view = get_schema_view(
    openapi.Info(
        title="Demoucron API",
        default_version='v1',
        description="API pour gérer des graphes et exécuter l'algorithme de Demoucron.",
        terms_of_service="https://www.example.com/terms/",
        contact=openapi.Contact(email="contact@example.com"),
        license=openapi.License(name="MIT License"),
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    path('docs/', swagger_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('graphs/', GraphListView.as_view(), name='graph-list'),
    path('graphs/create/', GraphCreateView.as_view(), name='graph-create'),
    path('graphs/<int:graph_id>/', GraphDetailView.as_view(), name='graph-detail'),
    path('graphs/<int:graph_id>/supprimer/', GraphDeleteView.as_view(), name='graph-suppression'),
    path('graphs/<int:graph_id>/add_sommet/', AddSommetView.as_view(), name='add-sommet'),
    path('graphs/<int:graph_id>/add_arc/', AddArcView.as_view(), name='add-arc'),
    path('graphs/<int:graph_id>/run_demoucron/', RunDemoucronView.as_view(), name='run-demoucron'),
    path('matrix_demoucron/', MatrixDemoucronView.as_view(), name='matrix-demoucron'),
    path('graphs/<int:graph_id>/delete_sommet/<str:sommet_name>/', DeleteSommetView.as_view(), name='delete-sommet'),
    path('graphs/<int:graph_id>/delete_arc/<str:source_name>/<str:target_name>/', DeleteArcView.as_view(), name='delete-arc'),
    
    path('graphs/<int:graph_id>/clear/', GraphClearView.as_view(), name='graph-clear'),
]