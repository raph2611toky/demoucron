import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calculator, Play, RotateCcw } from 'lucide-react';
import { useGraphStore } from '../store/graphStore';
import { MinDemoucron } from '../lib/logiqueMini';
import { MaxDemoucron } from '../lib/logiqueMax';
import ResultsDisplay from './ResultsDisplay';
import '../styles/DemoucronAlgorithm.css';

const DemoucronAlgorithm = ({ selectedGraph }) => {
  const { nodes, edges } = useGraphStore();
  const [optimizationType, setOptimizationType] = useState('minimisation');
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState(null);

  const createMatrixFromGraph = () => {
    if (!nodes || nodes.length === 0) return { matrix: [], nodeNames: [] };

    // Ordonner les nœuds : initial, normaux, final
    const initialNodes = nodes.filter(n => n.isInitial);
    const normalNodes = nodes.filter(n => !n.isInitial && !n.isFinal);
    const finalNodes = nodes.filter(n => n.isFinal);
    const orderedNodes = [...initialNodes, ...normalNodes, ...finalNodes];
    
    const nodeNames = orderedNodes.map(n => n.value);
    const size = nodeNames.length;
    
    // Initialiser la matrice avec des infinis
    const matrix = Array(size).fill().map(() => Array(size).fill(Infinity));
    
    // Diagonale à 0
    for (let i = 0; i < size; i++) {
      matrix[i][i] = 0;
    }
    
    // Ajouter les arcs
    if (edges && edges.length > 0) {
      edges.forEach(edge => {
        const sourceNode = nodes.find(n => n.id === edge.fromNodeId);
        const targetNode = nodes.find(n => n.id === edge.toNodeId);
        
        if (sourceNode && targetNode) {
          const sourceIndex = nodeNames.indexOf(sourceNode.value);
          const targetIndex = nodeNames.indexOf(targetNode.value);
          
          if (sourceIndex !== -1 && targetIndex !== -1) {
            matrix[sourceIndex][targetIndex] = edge.weight || 1;
          }
        }
      });
    }
    
    return { matrix, nodeNames };
  };

  const handleRunAlgorithm = async () => {
    if (!selectedGraph || !nodes || nodes.length === 0) {
      alert('Veuillez sélectionner un graphe valide avant de lancer l\'algorithme');
      return;
    }

    // Vérifier qu'il y a un sommet initial et final
    const hasInitial = nodes.some(n => n.isInitial);
    const hasFinal = nodes.some(n => n.isFinal);
    
    if (!hasInitial || !hasFinal) {
      alert('Le graphe doit avoir un sommet initial et un sommet final pour exécuter l\'algorithme');
      return;
    }

    setIsRunning(true);
    setResult(null);

    try {
      // Créer la matrice à partir du graphe actuel
      const { matrix, nodeNames } = createMatrixFromGraph();
      
      if (matrix.length === 0) {
        throw new Error('Impossible de créer la matrice à partir du graphe');
      }

      // Préparer les données pour l'algorithme
      const formData = {
        methode: optimizationType === 'minimisation' ? 'min' : 'max',
        matrice: matrix,
        nbrMatrice: matrix.length
      };

      console.log('Données envoyées à l\'algorithme:', formData);

      // Exécuter l'algorithme approprié
      let algorithmResult;
      if (optimizationType === 'minimisation') {
        algorithmResult = await MinDemoucron(formData);
      } else {
        algorithmResult = await MaxDemoucron(formData);
      }

      console.log('Résultat de l\'algorithme:', algorithmResult);

      if (algorithmResult.error) {
        throw new Error(algorithmResult.error);
      }

      setResult({
        ...algorithmResult,
        nodeNames,
        graphInfo: {
          name: selectedGraph.name,
          nodes: nodes.length,
          edges: edges.length,
          type: optimizationType
        }
      });

    } catch (error) {
      console.error('Erreur lors de l\'exécution de l\'algorithme:', error);
      setResult({
        error: error.message || 'Erreur lors de l\'exécution de l\'algorithme',
        graphInfo: {
          name: selectedGraph.name,
          nodes: nodes.length,
          edges: edges.length,
          type: optimizationType
        }
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setOptimizationType('minimisation');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="demoucron-algorithm-container"
    >
      <div className="algorithm-header">
        <div className="header-icon">
          <Calculator size={32} />
        </div>
        <div className="header-content">
          <h2>🧮 Algorithme de Demoucron</h2>
          <p>Optimisation de graphes par l'algorithme de Demoucron</p>
        </div>
      </div>

      <div className="algorithm-content">
        <div className="algorithm-controls">
          <div className="control-group">
            <label>Type d'optimisation</label>
            <div className="optimization-options">
              <label className="radio-option">
                <input
                  type="radio"
                  value="minimisation"
                  checked={optimizationType === 'minimisation'}
                  onChange={(e) => setOptimizationType(e.target.value)}
                  disabled={isRunning}
                />
                <span className="radio-label">
                  <span className="radio-icon">📉</span>
                  Minimisation
                </span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  value="maximisation"
                  checked={optimizationType === 'maximisation'}
                  onChange={(e) => setOptimizationType(e.target.value)}
                  disabled={isRunning}
                />
                <span className="radio-label">
                  <span className="radio-icon">📈</span>
                  Maximisation
                </span>
              </label>
            </div>
          </div>

          <div className="algorithm-actions">
            <button
              onClick={handleRunAlgorithm}
              disabled={isRunning || !selectedGraph}
              className={`run-button ${isRunning ? 'running' : ''}`}
            >
              {isRunning ? (
                <>
                  <div className="spinner"></div>
                  Exécution en cours...
                </>
              ) : (
                <>
                  <Play size={20} />
                  Lancer l'algorithme
                </>
              )}
            </button>
            
            {result && (
              <button
                onClick={handleReset}
                className="reset-button"
              >
                <RotateCcw size={20} />
                Réinitialiser
              </button>
            )}
          </div>
        </div>

        {selectedGraph && (
          <div className="graph-info">
            <h3>Graphe sélectionné</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Nom :</span>
                <span className="info-value">{selectedGraph.name}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Sommets :</span>
                <span className="info-value">{nodes.length}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Arcs :</span>
                <span className="info-value">{edges.length}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Type :</span>
                <span className="info-value">Graphe orienté</span>
              </div>
            </div>
          </div>
        )}

        {/* Affichage des résultats */}
        {result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="results-section"
          >
            <ResultsDisplay results={result} />
          </motion.div>
        )}

        {!selectedGraph && (
          <div className="no-graph-message">
            <div className="message-icon">📊</div>
            <h3>Aucun graphe sélectionné</h3>
            <p>Veuillez sélectionner un graphe dans la section "Gestionnaire de Graphes" pour utiliser l'algorithme de Demoucron.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default DemoucronAlgorithm;