import numpy as np

def build_adjacency_matrix(graph):
    nodes = list(graph.sommets.all())
    
    initial = [node for node in nodes if node.type == 'initial']
    normal = [node for node in nodes if node.type == 'normal']
    final = [node for node in nodes if node.type == 'final']
    
    ordered_nodes = initial + normal + final
    node_names = [node.name for node in ordered_nodes]
    n = len(node_names)

    matrix = np.full((n, n), np.inf)
    np.fill_diagonal(matrix, 0)

    for edge in graph.arcs.all():
        source_idx = node_names.index(edge.source.name)
        target_idx = node_names.index(edge.target.name)
        matrix[source_idx, target_idx] = edge.weight

    matrix = np.where(np.isinf(matrix), None, matrix)
    
    matrix = matrix.tolist()
    return matrix, node_names

def demoucron_algorithm(matrix, node_names, method='min'):
    n = len(matrix)
    current_matrix = np.array(matrix, dtype=float)
    current_matrix = np.where(current_matrix == None, np.inf if method == 'min' else -np.inf, current_matrix)
    predecessors = np.full((n, n), -1, dtype=int)
    
    # Initialisation des prédécesseurs pour les arêtes directes
    for i in range(n):
        for j in range(n):
            if current_matrix[i][j] != np.inf and i != j:
                predecessors[i][j] = i

    steps = [
        {
            'step': 0,
            'matrix': np.where(np.isinf(current_matrix) | np.isnan(current_matrix), None, current_matrix).tolist(),
            'intermediate_node': None,
            'calculations': [],
            'edges': [{'source': node_names[i], 'target': node_names[j], 'weight': current_matrix[i][j] if not np.isinf(current_matrix[i][j]) else None}
                      for i in range(n) for j in range(n) if current_matrix[i][j] != np.inf and i != j]
        }
    ]

    # Algorithme principal
    for k in range(n):
        calculations = []
        for i in range(n):
            for j in range(n):
                if i != j and current_matrix[i][k] != np.inf and current_matrix[k][j] != np.inf:
                    W_ij = current_matrix[i][k] + current_matrix[k][j]
                    V_ik = current_matrix[i][k]
                    V_kj = current_matrix[k][j]
                    V_ij_prev = current_matrix[i][j]
                    new_V_ij = V_ij_prev

                    if method == 'min' and W_ij < V_ij_prev:
                        new_V_ij = W_ij
                        current_matrix[i][j] = W_ij
                        predecessors[i][j] = predecessors[k][j]
                    elif method == 'max' and W_ij > V_ij_prev and W_ij != np.inf:
                        new_V_ij = W_ij
                        current_matrix[i][j] = W_ij
                        predecessors[i][j] = predecessors[k][j]

                    calculations.append({
                        'i': i + 1,
                        'j': j + 1,
                        'k': k + 1,
                        'W_ij': W_ij if np.isfinite(W_ij) else None,
                        'V_ik': V_ik if np.isfinite(V_ik) else None,
                        'V_kj': V_kj if np.isfinite(V_kj) else None,
                        'V_ij_prev': V_ij_prev if np.isfinite(V_ij_prev) else None,
                        'new_V_ij': new_V_ij if np.isfinite(new_V_ij) else None
                    })

        steps.append({
            'step': k + 1,
            'matrix': np.where(np.isinf(current_matrix) | np.isnan(current_matrix), None, current_matrix).tolist(),
            'intermediate_node': node_names[k],
            'calculations': calculations,
            'edges': [{'source': node_names[i], 'target': node_names[j], 'weight': current_matrix[i][j] if not np.isinf(current_matrix[i][j]) else None}
                      for i in range(n) for j in range(n) if current_matrix[i][j] != np.inf and i != j]
        })

    # Construire le chemin optimal (uniquement du nœud initial au nœud final)
    def get_path(start, end):
        if current_matrix[start][end] == np.inf or predecessors[start][end] == -1:
            return []
        path = []
        current = end
        while current != start:
            path.insert(0, node_names[current])
            current = predecessors[start][current]
            if current == -1:
                return []
        path.insert(0, node_names[start])
        return path

    paths = {}
    start_idx = 0  # Nœud initial (premier dans node_names)
    end_idx = n - 1  # Nœud final (dernier dans node_names)
    path = get_path(start_idx, end_idx)
    if path:
        paths[f"{node_names[start_idx]}-{node_names[end_idx]}"] = path

    return steps, paths