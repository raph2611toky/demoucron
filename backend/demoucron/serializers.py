from rest_framework import serializers
from .models import Graph, Sommet, Arc

class SommetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sommet
        fields = ['id', 'name', 'type']

class ArcSerializer(serializers.ModelSerializer):
    source = serializers.SlugRelatedField(slug_field='name', queryset=Sommet.objects.all())
    target = serializers.SlugRelatedField(slug_field='name', queryset=Sommet.objects.all())

    class Meta:
        model = Arc
        fields = ['id', 'source', 'target', 'weight']

class GraphSerializer(serializers.ModelSerializer):
    sommets = SommetSerializer(many=True, read_only=True)
    arcs = ArcSerializer(many=True, read_only=True)

    class Meta:
        model = Graph
        fields = ['id', 'name', 'sommets', 'arcs']