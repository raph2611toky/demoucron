import numpy as np

def build_adjacency_matrix(nodes, edges):
    node_names = [node['name'] for node in nodes]
    n = len(node_names)
    matrix = np.full((n, n), np.inf)
    np.fill_diagonal(matrix, 0)
    for edge in edges:
        i = node_names.index(edge['source'])
        j = node_names.index(edge['target'])
        matrix[i][j] = edge['weight']
    matrix = np.where(np.isinf(matrix), None, matrix)
    return matrix.tolist(), node_names

def demoucron_algorithm(matrix, node_names, method='min'):
    n = len(matrix)
    D = np.array(matrix, dtype=float)
    D = np.where(D == None, np.inf if method == 'min' else -np.inf, D)
    if method == 'min':
        np.fill_diagonal(D, 0)
    else:
        np.fill_diagonal(D, -np.inf)
    predecessors = np.zeros((n, n), dtype=int)
    for i in range(n):
        for j in range(n):
            if i != j and (method == 'min' and D[i, j] < np.inf or method == 'max' and D[i, j] > -np.inf):
                predecessors[i, j] = i + 1
    steps = [{
        'step': 1,
        'matrix': np.where(np.isinf(D) | np.isnan(D), None, D).tolist(),
        'intermediate_node': None,
        'calculations': [],
        'edges': get_current_edges(D, predecessors, node_names, method)
    }]
    for k in range(1, n):
        calculations = []
        for i in range(n):
            for j in range(n):
                if i != j and k != i and k != j:
                    V_ik = D[i, k]
                    V_kj = D[k, j]
                    if method == 'min':
                        W_ij = V_ik + V_kj if V_ik < np.inf and V_kj < np.inf else np.inf
                        if W_ij < D[i, j]:
                            D[i, j] = W_ij
                            predecessors[i, j] = predecessors[k, j]
                            calculations.append({
                                'i': i + 1, 'j': j + 1, 'k': k + 1,
                                'W_ij': float(W_ij) if np.isfinite(W_ij) else None,
                                'V_ik': float(V_ik) if np.isfinite(V_ik) else None,
                                'V_kj': float(V_kj) if np.isfinite(V_kj) else None,
                                'V_ij_prev': float(D[i, j]) if np.isfinite(D[i, j]) else None,
                                'new_V_ij': float(W_ij) if np.isfinite(W_ij) else None
                            })
                    else:
                        W_ij = V_ik + V_kj if V_ik > -np.inf and V_kj > -np.inf else -np.inf
                        if W_ij > D[i, j]:
                            D[i, j] = W_ij
                            predecessors[i, j] = predecessors[k, j]
                            calculations.append({
                                'i': i + 1, 'j': j + 1, 'k': k + 1,
                                'W_ij': float(W_ij) if np.isfinite(W_ij) else None,
                                'V_ik': float(V_ik) if np.isfinite(V_ik) else None,
                                'V_kj': float(V_kj) if np.isfinite(V_kj) else None,
                                'V_ij_prev': float(D[i, j]) if np.isfinite(D[i, j]) else None,
                                'new_V_ij': float(W_ij) if np.isfinite(W_ij) else None
                            })
        steps.append({
            'step': k + 1,
            'matrix': np.where(np.isinf(D) | np.isnan(D), None, D).tolist(),
            'intermediate_node': k + 1,
            'calculations': calculations,
            'edges': get_current_edges(D, predecessors, node_names, method)
        })
    paths = {}
    for i in range(n):
        for j in range(n):
            if i != j and (method == 'min' and D[i, j] < np.inf or method == 'max' and D[i, j] > -np.inf):
                path = reconstruct_path(i + 1, j + 1, predecessors)
                path = [node_names[idx - 1] for idx in path]
                paths[f"{node_names[i]}->{node_names[j]}"] = path
    return steps, paths

def get_current_edges(matrix, predecessors, node_names, method):
    n = len(matrix)
    edges = []
    seen = set()
    for i in range(n):
        for j in range(n):
            if i != j and (method == 'min' and matrix[i][j] < np.inf or method == 'max' and matrix[i][j] > -np.inf):
                path = reconstruct_path(i + 1, j + 1, predecessors)
                for idx in range(len(path) - 1):
                    source_idx = path[idx] - 1
                    target_idx = path[idx + 1] - 1
                    edge_key = f"{source_idx}->{target_idx}"
                    if edge_key not in seen:
                        seen.add(edge_key)
                        weight = matrix[source_idx][target_idx]
                        edges.append({
                            'source': node_names[source_idx],
                            'target': node_names[target_idx],
                            'weight': float(weight) if np.isfinite(weight) else None
                        })
    return edges

def reconstruct_path(start, end, predecessors):
    path = [end]
    current = end
    while current != start:
        pred = predecessors[start - 1, current - 1]
        if pred == 0:
            return []
        path.append(pred)
        current = pred
    return path[::-1]