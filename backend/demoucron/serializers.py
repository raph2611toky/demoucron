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
    sommets = serializers.SerializerMethodField()
    arcs = ArcSerializer(many=True, read_only=True)

    def get_sommets(self, obj):
        sommets = obj.sommets.all()
        initial = sommets.filter(type='initial')
        normal = sommets.filter(type='normal')
        final = sommets.filter(type='final')
        ordered_sommets = list(initial) + list(normal) + list(final)
        return SommetSerializer(ordered_sommets, many=True).data

    class Meta:
        model = Graph
        fields = ['id', 'name', 'sommets', 'arcs']