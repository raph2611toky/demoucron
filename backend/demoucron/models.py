from django.db import models

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

    class Meta:
        db_table = "sommet"
        unique_together = ('graph', 'name')

    def __str__(self):
        return f"{self.name} ({self.type})"

class Arc(models.Model):
    graph = models.ForeignKey(Graph, on_delete=models.CASCADE, related_name='arcs')
    source = models.ForeignKey(Sommet, on_delete=models.CASCADE, related_name='arcs_sortant')
    target = models.ForeignKey(Sommet, on_delete=models.CASCADE, related_name='arcs_entrant')
    weight = models.FloatField()

    def __str__(self):
        return f"{self.source.name} -> {self.target.name} ({self.weight})"

    class Meta:
        db_table = "arc"