# Generated by Django 5.0.8 on 2025-04-27 10:15

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Graph',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100, unique=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'db_table': 'graph',
            },
        ),
        migrations.CreateModel(
            name='Sommet',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=50)),
                ('type', models.CharField(choices=[('normal', 'Normal'), ('initial', 'Initial'), ('final', 'Final')], max_length=20)),
                ('graph', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='sommets', to='demoucron.graph')),
            ],
            options={
                'db_table': 'sommet',
                'unique_together': {('graph', 'name')},
            },
        ),
        migrations.CreateModel(
            name='Arc',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('weight', models.FloatField()),
                ('graph', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='arcs', to='demoucron.graph')),
                ('source', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='arcs_sortant', to='demoucron.sommet')),
                ('target', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='arcs_entrant', to='demoucron.sommet')),
            ],
            options={
                'db_table': 'arc',
            },
        ),
    ]
