import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useGraphStore } from '../store/graphStore';
import '../styles/AdjacencyMatrix.css';

const AdjacencyMatrix = ({ selectedGraph }) => {
  const { nodes, edges } = useGraphStore();

  const { matrix, nodeNames } = useMemo(() => {
    // Use nodes and edges from the store instead of selectedGraph data
    if (!selectedGraph || !nodes || nodes.length === 0) {
      return { matrix: [], nodeNames: [] };
    }

    // Order nodes: initial, normal, final
    const initialNodes = nodes.filter(n => n.isInitial);
    const normalNodes = nodes.filter(n => !n.isInitial && !n.isFinal);
    const finalNodes = nodes.filter(n => n.isFinal);
    const orderedNodes = [...initialNodes, ...normalNodes, ...finalNodes];
    
    const nodeNames = orderedNodes.map(n => n.value || n.name);
    const size = nodeNames.length;
    
    // Initialize matrix with infinity
    const matrix = Array(size).fill().map(() => Array(size).fill('∞'));
    
    // Diagonal to 0
    for (let i = 0; i < size; i++) {
      matrix[i][i] = 0;
    }
    
    // Add edges
    if (edges && edges.length > 0) {
      edges.forEach(edge => {
        const sourceNode = nodes.find(n => n.id === edge.fromNodeId);
        const targetNode = nodes.find(n => n.id === edge.toNodeId);
        
        if (sourceNode && targetNode) {
          const sourceIndex = nodeNames.indexOf(sourceNode.value || sourceNode.name);
          const targetIndex = nodeNames.indexOf(targetNode.value || targetNode.name);
          
          if (sourceIndex !== -1 && targetIndex !== -1) {
            matrix[sourceIndex][targetIndex] = edge.weight || 1;
          }
        }
      });
    }
    
    return { matrix, nodeNames };
  }, [selectedGraph, nodes, edges]);

  if (!selectedGraph || matrix.length === 0) {
    return (
      <div className="adjacency-matrix-container">
        <div className="matrix-header">
          <h2>📊 Matrice d'Adjacence</h2>
          <div className="matrix-info">
            <span>Aucun graphe sélectionné</span>
          </div>
        </div>
        <div className="empty-matrix">
          <p>Sélectionnez un graphe pour voir sa matrice d'adjacence</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="adjacency-matrix-container"
    >
      <div className="matrix-header">
        <h2>📊 Matrice d'Adjacence - {selectedGraph.name}</h2>
        <div className="matrix-info">
          <span>{nodeNames.length} × {nodeNames.length}</span>
        </div>
      </div>

      <div className="matrix-wrapper">
        <table className="adjacency-matrix">
          <thead>
            <tr>
              <th className="matrix-corner"></th>
              {nodeNames.map((name, index) => (
                <th key={index} className="matrix-header-cell">
                  {name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, i) => (
              <tr key={i}>
                <td className="matrix-header-cell">{nodeNames[i]}</td>
                {row.map((value, j) => (
                  <td 
                    key={j} 
                    className={`matrix-cell ${i === j ? 'diagonal' : ''} ${value !== '∞' && value !== 0 ? 'has-value' : ''}`}
                  >
                    {value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend for node types */}
      {nodes && nodes.length > 0 && (
        <div className="node-types-legend">
          <h3>Types de sommets</h3>
          <div className="legend-items">
            {nodes.filter(n => n.isInitial).length > 0 && (
              <div className="legend-item initial">
                <div className="legend-color"></div>
                <span>Initial ({nodes.filter(n => n.isInitial).map(n => n.value || n.name).join(', ')})</span>
              </div>
            )}
            {nodes.filter(n => !n.isInitial && !n.isFinal).length > 0 && (
              <div className="legend-item normal">
                <div className="legend-color"></div>
                <span>Normal ({nodes.filter(n => !n.isInitial && !n.isFinal).map(n => n.value || n.name).join(', ')})</span>
              </div>
            )}
            {nodes.filter(n => n.isFinal).length > 0 && (
              <div className="legend-item final">
                <div className="legend-color"></div>
                <span>Final ({nodes.filter(n => n.isFinal).map(n => n.value || n.name).join(', ')})</span>
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default AdjacencyMatrix;