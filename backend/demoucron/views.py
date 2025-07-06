from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from .models import Graph, Sommet, Arc
from .serializers import GraphSerializer, SommetSerializer, ArcSerializer
from helper import build_adjacency_matrix, demoucron_algorithm
import numpy as np

class GraphCreateView(APIView):
    @swagger_auto_schema(
        operation_description="Crée un nouveau graphe avec un nom unique.",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=['name'],
            properties={
                'name': openapi.Schema(type=openapi.TYPE_STRING, description="Nom unique du graphe"),
            },
        ),
        responses={
            201: GraphSerializer,
            400: openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={'error': openapi.Schema(type=openapi.TYPE_STRING)}
            )
        }
    )
    def post(self, request):
        serializer = GraphSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class GraphListView(APIView):
    @swagger_auto_schema(
        operation_description="Liste tous les graphes existants.",
        responses={200: GraphSerializer(many=True)}
    )
    def get(self, request):
        graphs = Graph.objects.all()
        serializer = GraphSerializer(graphs, many=True)
        return Response(serializer.data)

class GraphDetailView(APIView):
    @swagger_auto_schema(
        operation_description="Récupère les détails d'un graphe spécifique par son ID, incluant la matrice initiale (D1) et les noms des nœuds.",
        responses={
            200: openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    'id': openapi.Schema(type=openapi.TYPE_INTEGER, description="ID du graphe"),
                    'name': openapi.Schema(type=openapi.TYPE_STRING, description="Nom du graphe"),
                    'sommets': openapi.Schema(
                        type=openapi.TYPE_ARRAY,
                        items=openapi.Items(type=openapi.TYPE_OBJECT),
                        description="Liste des sommets"
                    ),
                    'arcs': openapi.Schema(
                        type=openapi.TYPE_ARRAY,
                        items=openapi.Items(type=openapi.TYPE_OBJECT),
                        description="Liste des arcs"
                    ),
                    'node_names': openapi.Schema(
                        type=openapi.TYPE_ARRAY,
                        items=openapi.Items(type=openapi.TYPE_STRING),
                        description="Liste des noms des nœuds dans l'ordre de la matrice"
                    ),
                    'initial_matrix': openapi.Schema(
                        type=openapi.TYPE_ARRAY,
                        items=openapi.Items(
                            type=openapi.TYPE_ARRAY,
                            items=openapi.Items(type=openapi.TYPE_NUMBER, nullable=True)
                        ),
                        description="Matrice initiale (D1) du graphe"
                    ),
                }
            ),
            404: openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={'error': openapi.Schema(type=openapi.TYPE_STRING)}
            )
        }
    )
    def get(self, request, graph_id):
        try:
            graph = Graph.objects.get(pk=graph_id)
            serializer = GraphSerializer(graph)
            
            # Construire la matrice initiale (D1) et les noms des nœuds
            initial_matrix, node_names = build_adjacency_matrix(graph)
            
            # Ajouter node_names et initial_matrix à la réponse
            response_data = serializer.data
            response_data['node_names'] = node_names
            response_data['initial_matrix'] = initial_matrix
            
            return Response(response_data)
        except Graph.DoesNotExist:
            return Response({'error': 'Graphe introuvable'}, status=status.HTTP_404_NOT_FOUND)
        
class GraphDeleteView(APIView):
    @swagger_auto_schema(
        operation_description="Supprimer un graphe spécifique par son ID",
        responses={
            200: openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    'message': openapi.Schema(type=openapi.TYPE_INTEGER, description="Graphe supprimé avec succès"),
                }
            ),
            404: openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={'error': openapi.Schema(type=openapi.TYPE_STRING)}
            )
        }
    )
    def delete(self, request, graph_id):
        try:
            graph = Graph.objects.get(pk=graph_id)
            graph.delete()
            return Response({"message":"Graph supprimé avec succès"},status=status.HTTP_204_NO_CONTENT)
        except Graph.DoesNotExist:
            return Response({'error': 'Graphe introuvable'}, status=status.HTTP_404_NOT_FOUND)

class AddSommetView(APIView):
    @swagger_auto_schema(
        operation_description="Ajoute un sommet à un graphe spécifié par son ID.",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=['name', 'type'],
            properties={
                'name': openapi.Schema(type=openapi.TYPE_STRING, description="Nom unique du sommet dans le graphe"),
                'type': openapi.Schema(
                    type=openapi.TYPE_STRING,
                    enum=['normal', 'initial', 'final'],
                    description="Type du sommet"
                ),
                'x': openapi.Schema(type=openapi.TYPE_NUMBER),
                'y': openapi.Schema(type=openapi.TYPE_NUMBER),
            },
        ),
        responses={
            201: SommetSerializer,
            400: openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={'error': openapi.Schema(type=openapi.TYPE_STRING)}
            ),
            404: openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={'error': openapi.Schema(type=openapi.TYPE_STRING)}
            )
        }
    )
    def post(self, request, graph_id):
        try:
            graph = Graph.objects.get(pk=graph_id)
            serializer = SommetSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(graph=graph)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Graph.DoesNotExist:
            return Response({'error': 'Graphe introuvable'}, status=status.HTTP_404_NOT_FOUND)

class AddArcView(APIView):
    @swagger_auto_schema(
        operation_description="Ajoute un arc à un graphe spécifié par son ID.",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=['source', 'target', 'weight'],
            properties={
                'source': openapi.Schema(type=openapi.TYPE_STRING, description="Nom du sommet source"),
                'target': openapi.Schema(type=openapi.TYPE_STRING, description="Nom du sommet cible"),
                'weight': openapi.Schema(type=openapi.TYPE_NUMBER, description="Poids de l'arc")
            },
        ),
        responses={
            201: ArcSerializer,
            400: openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={'error': openapi.Schema(type=openapi.TYPE_STRING)}
            ),
            404: openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={'error': openapi.Schema(type=openapi.TYPE_STRING)}
            )
        }
    )
    def post(self, request, graph_id):
        try:
            graph = Graph.objects.get(pk=graph_id)
            serializer = ArcSerializer(data=request.data)
            if serializer.is_valid():
                source_name = serializer.validated_data['source'].name
                target_name = serializer.validated_data['target'].name
                try:
                    source = graph.sommets.get(name=source_name)
                    target = graph.sommets.get(name=target_name)
                    arc = Arc.objects.create(
                        graph=graph,
                        source=source,
                        target=target,
                        weight=serializer.validated_data['weight']
                    )
                    return Response(ArcSerializer(arc).data, status=status.HTTP_201_CREATED)
                except Sommet.DoesNotExist:
                    return Response({'error': 'Sommet source ou cible introuvable'}, status=status.HTTP_400_BAD_REQUEST)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Graph.DoesNotExist:
            return Response({'error': 'Graphe introuvable'}, status=status.HTTP_404_NOT_FOUND)

class RunDemoucronView(APIView):
    @swagger_auto_schema(
        operation_description="Exécute l'algorithme de Demoucron sur un graphe spécifié pour calculer le chemin optimal du nœud initial au nœud final.",
        responses={
            200: openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    'steps': openapi.Schema(
                        type=openapi.TYPE_ARRAY,
                        items=openapi.Items(
                            type=openapi.TYPE_OBJECT,
                            properties={
                                'step': openapi.Schema(type=openapi.TYPE_INTEGER),
                                'matrix': openapi.Schema(
                                    type=openapi.TYPE_ARRAY,
                                    items=openapi.Items(
                                        type=openapi.TYPE_ARRAY,
                                        items=openapi.Items(type=openapi.TYPE_NUMBER, nullable=True)
                                    )
                                ),
                                'intermediate_node': openapi.Schema(type=openapi.TYPE_INTEGER, nullable=True),
                                'calculations': openapi.Schema(
                                    type=openapi.TYPE_ARRAY,
                                    items=openapi.Items(
                                        type=openapi.TYPE_OBJECT,
                                        properties={
                                            'i': openapi.Schema(type=openapi.TYPE_INTEGER),
                                            'j': openapi.Schema(type=openapi.TYPE_INTEGER),
                                            'k': openapi.Schema(type=openapi.TYPE_INTEGER),
                                            'W_ij': openapi.Schema(type=openapi.TYPE_NUMBER, nullable=True),
                                            'V_ik': openapi.Schema(type=openapi.TYPE_NUMBER, nullable=True),
                                            'V_kj': openapi.Schema(type=openapi.TYPE_NUMBER, nullable=True),
                                            'V_ij_prev': openapi.Schema(type=openapi.TYPE_NUMBER, nullable=True),
                                            'new_V_ij': openapi.Schema(type=openapi.TYPE_NUMBER, nullable=True)
                                        }
                                    )
                                ),
                                'edges': openapi.Schema(
                                    type=openapi.TYPE_ARRAY,
                                    items=openapi.Items(
                                        type=openapi.TYPE_OBJECT,
                                        properties={
                                            'source': openapi.Schema(type=openapi.TYPE_STRING),
                                            'target': openapi.Schema(type=openapi.TYPE_STRING),
                                            'weight': openapi.Schema(type=openapi.TYPE_NUMBER)
                                        }
                                    )
                                )
                            }
                        )
                    ),
                    'paths': openapi.Schema(type=openapi.TYPE_OBJECT),
                    'nodes': openapi.Schema(type=openapi.TYPE_ARRAY, items=openapi.Items(type=openapi.TYPE_OBJECT)),
                    'edges': openapi.Schema(type=openapi.TYPE_ARRAY, items=openapi.Items(type=openapi.TYPE_OBJECT)),
                }
            ),
            400: openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={'error': openapi.Schema(type=openapi.TYPE_STRING)}
            ),
            404: openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={'error': openapi.Schema(type=openapi.TYPE_STRING)}
            )
        }
    )
    def get(self, request, graph_id):
        try:
            graph = Graph.objects.get(pk=graph_id)
            nodes = list(graph.sommets.all())
            edges = list(graph.arcs.all())

            if not nodes or not edges:
                return Response(
                    {'error': 'Le graphe doit contenir des sommets et des arcs'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Vérifier la présence d'un nœud initial et final
            if not graph.sommets.filter(type='initial').exists() or not graph.sommets.filter(type='final').exists():
                return Response(
                    {'error': 'Le graphe doit avoir un nœud initial et un nœud final'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Construire la matrice et les noms des nœuds
            initial_matrix, node_names = build_adjacency_matrix(graph)
            steps, paths = demoucron_algorithm(initial_matrix, node_names)

            return Response({
                'steps': steps,
                'paths': paths,
                'nodes': SommetSerializer(nodes, many=True).data,
                'edges': ArcSerializer(edges, many=True).data
            })
        except Graph.DoesNotExist:
            return Response({'error': 'Graphe introuvable'}, status=status.HTTP_404_NOT_FOUND)

class MatrixDemoucronView(APIView):
    @swagger_auto_schema(
        operation_description="Exécute l'algorithme de Demoucron sur une matrice fournie avec la méthode spécifiée (min ou max).",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=['matrix', 'node_names', 'method'],
            properties={
                'matrix': openapi.Schema(type=openapi.TYPE_ARRAY, items=openapi.Items(type=openapi.TYPE_ARRAY, items=openapi.Items(type=openapi.TYPE_NUMBER, nullable=True))),
                'node_names': openapi.Schema(type=openapi.TYPE_ARRAY, items=openapi.Items(type=openapi.TYPE_STRING)),
                'method': openapi.Schema(type=openapi.TYPE_STRING, enum=['min', 'max'], description="Méthode de calcul (min ou max)"),
            },
        ),
        responses={
            200: openapi.Schema(type=openapi.TYPE_OBJECT, properties={
                'steps': openapi.Schema(type=openapi.TYPE_ARRAY, items=openapi.Items(type=openapi.TYPE_OBJECT)),
                'paths': openapi.Schema(type=openapi.TYPE_OBJECT),
                'nodes': openapi.Schema(type=openapi.TYPE_ARRAY, items=openapi.Items(type=openapi.TYPE_OBJECT)),
                'edges': openapi.Schema(type=openapi.TYPE_ARRAY, items=openapi.Items(type=openapi.TYPE_OBJECT)),
            }),
            400: openapi.Schema(type=openapi.TYPE_OBJECT, properties={'error': openapi.Schema(type=openapi.TYPE_STRING)})
        }
    )
    def post(self, request):
        matrix = request.data.get('matrix')
        node_names = request.data.get('node_names')
        method = request.data.get('method', 'min')
        if not matrix or not node_names or len(matrix) != len(node_names):
            return Response({'error': 'Invalid input'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            matrix = np.array(matrix, dtype=float)
            matrix = np.where(matrix == None, np.inf if method == 'min' else -np.inf, matrix)
        except:
            return Response({'error': 'Invalid matrix format'}, status=status.HTTP_400_BAD_REQUEST)
        steps, paths = demoucron_algorithm(matrix, node_names, method=method)
        return Response({
            'steps': steps,
            'paths': paths,
            'nodes': [{'name': name} for name in node_names],
            'edges': [],
            'methode': method
        })


class DeleteSommetView(APIView):
    @swagger_auto_schema(
        operation_description="Supprime un sommet d'un graphe spécifié par son ID et le nom du sommet.",
        responses={
            204: openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={'message': openapi.Schema(type=openapi.TYPE_STRING)}
            ),
            404: openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={'error': openapi.Schema(type=openapi.TYPE_STRING)}
            )
        }
    )
    def delete(self, request, graph_id, sommet_name):
        try:
            graph = Graph.objects.get(pk=graph_id)
            sommet = graph.sommets.get(name=sommet_name)
            sommet.delete()
            return Response({'message': 'Sommet supprimé avec succès'}, status=status.HTTP_204_NO_CONTENT)
        except Graph.DoesNotExist:
            return Response({'error': 'Graphe introuvable'}, status=status.HTTP_404_NOT_FOUND)
        except Sommet.DoesNotExist:
            return Response({'error': 'Sommet introuvable'}, status=status.HTTP_404_NOT_FOUND)
        
class DeleteArcView(APIView):
    @swagger_auto_schema(
        operation_description="Supprime un arc d'un graphe spécifié par son ID, la source et la cible.",
        responses={
            204: openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={'message': openapi.Schema(type=openapi.TYPE_STRING)}
            ),
            404: openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={'error': openapi.Schema(type=openapi.TYPE_STRING)}
            )
        }
    )
    def delete(self, request, graph_id, source_name, target_name):
        try:
            graph = Graph.objects.get(pk=graph_id)
            arc = graph.arcs.get(source__name=source_name, target__name=target_name)
            arc.delete()
            return Response({'message': 'Arc supprimé avec succès'}, status=status.HTTP_204_NO_CONTENT)
        except Graph.DoesNotExist:
            return Response({'error': 'Graphe introuvable'}, status=status.HTTP_404_NOT_FOUND)
        except Arc.DoesNotExist:
            return Response({'error': 'Arc introuvable'}, status=status.HTTP_404_NOT_FOUND)