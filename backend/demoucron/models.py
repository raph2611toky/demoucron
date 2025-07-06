from django.db import models
from django.core.exceptions import ValidationError

# Models
class Graph(models.Model):
    name = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    class Meta:
        db_table = "graph"

class Sommet(models.Model):
    graph = models.ForeignKey(Graph, on_delete=models.CASCADE, related_name='sommets')
    name = models.CharField(max_length=50)
    type = models.CharField(max_length=20, choices=[
        ('normal', 'Normal'),
        ('initial', 'Initial'),
        ('final', 'Final')
    ])
    x = models.FloatField(default=0.0)  # Position x
    y = models.FloatField(default=0.0)  # Position y

    def clean(self):
        if self.type == 'initial':
            if Sommet.objects.filter(graph=self.graph, type='initial').exclude(pk=self.pk).exists():
                raise ValidationError("Un graphe ne peut avoir qu'un seul nœud initial.")
        if self.type == 'final':
            if Sommet.objects.filter(graph=self.graph, type='final').exclude(pk=self.pk).exists():
                raise ValidationError("Un graphe ne peut avoir qu'un seul nœud final.")

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    class Meta:
        db_table = "sommet"
        unique_together = ('graph', 'name')

    def __str__(self):
        return f"{self.name} ({self.type})"

class Arc(models.Model):
    graph = models.ForeignKey(Graph, on_delete=models.CASCADE, related_name='arcs')
    source = models.ForeignKey(Sommet, on_delete=models.CASCADE, related_name='arcs_sortant')
    target = models.ForeignKey(Sommet, on_delete=models.CASCADE, related_name='arcs_entrant')
    weight = models.FloatField(default=1.0)

    def clean(self):
        if self.target.type == 'initial':
            raise ValidationError("Un nœud initial ne peut pas avoir d'arêtes entrantes.")
        if self.source.type == 'final':
            raise ValidationError("Un nœud final ne peut pas avoir d'arêtes sortantes.")
        if self.source.graph != self.graph or self.target.graph != self.graph:
            raise ValidationError("La source et la cible doivent appartenir au même graphe.")
        if self.source == self.target:
            raise ValidationError("La source et la cible ne peuvent pas être le même nœud.")

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.source.name} -> {self.target.name} ({self.weight})"

    class Meta:
        db_table = "arc"