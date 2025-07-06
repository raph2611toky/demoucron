import React from 'react';
import axios from 'axios';
import { useGraphStore } from '../store/graphStore';
import { Mail, Edit, Eye } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Toolbar = ({ graphId }) => {
  const { 
    clearGraph, 
    nodes, 
    edges, 
    scale, 
    setScale, 
    setStagePosition, 
    findPath, 
    setCurrentPath,
    setShowSimulationForm,
    isSimulating,
    canSimulate,
    getInitialNode,
    getFinalNode,
    isEditMode,
    toggleEditMode,
  } = useGraphStore();

  const handleClearGraph = async () => {
    if (!isEditMode) return;
    if (confirm('Êtes-vous sûr de vouloir effacer tout le graphe ?')) {
      try {
        const response = await axios.delete(`http://localhost:8000/api/graphs/${graphId}/clear/`, {
          headers: {
            'Content-Type': 'application/json',
          },
        });

        clearGraph();
        toast.success('Graphe vidé avec succès');
      } catch (error) {
        console.error('Erreur lors de la suppression du graphe:', error);
        toast.error(error.response?.data?.error || 'Erreur réseau lors de la suppression');
      }
    }
  };

  const handleResetView = () => {
    setScale(1);
    setStagePosition({ x: 0, y: 0 });
  };

  const handleZoomIn = () => {
    const newScale = Math.min(3, scale * 1.2);
    setScale(newScale);
  };

  const handleZoomOut = () => {
    const newScale = Math.max(0.1, scale / 1.2);
    setScale(newScale);
  };

  const handleSimulateTransmission = () => {
    const initialNode = getInitialNode();
    const finalNode = getFinalNode();
    
    if (initialNode && finalNode) {
      const path = findPath(initialNode.id, finalNode.id);
      if (path) {
        setCurrentPath(path);
      } else {
        toast.warn('Aucun chemin trouvé entre le sommet initial et final.');
        setCurrentPath([]);
      }
    }
  };

  const handleShowSimulationForm = () => {
    if (!canSimulate()) {
      toast.warn('Veuillez définir un sommet initial et un sommet final avant de configurer la simulation.');
      return;
    }
    setShowSimulationForm(true);
  };

  const handleClearPath = () => {
    setCurrentPath([]);
  };

  const initialNode = getInitialNode();
  const finalNode = getFinalNode();

  return (
    <div className="toolbar">
      <div className="toolbar-group">
        <h2>🎨 Éditeur de Graphes</h2>
        <div className="stats">
          <span>📍 {nodes.length} sommets</span>
          <span>🔗 {edges.length} arcs</span>
          <span>🔍 {Math.round(scale * 100)}%</span>
        </div>
      </div>
      
      <div className="toolbar-group">
        <button 
          onClick={toggleEditMode} 
          className={`toolbar-button ${isEditMode ? 'edit-mode-active' : 'view-mode-active'}`}
        >
          {isEditMode ? (
            <>
              <Edit className="w-4 h-4 mr-2" />
              Mode Édition
            </>
          ) : (
            <>
              <Eye className="w-4 h-4 mr-2" />
              Mode Lecture
            </>
          )}
        </button>
      </div>
      
      <div className="toolbar-group">
        <button onClick={handleZoomIn} className="toolbar-button">
          🔍+ Zoom +
        </button>
        <button onClick={handleZoomOut} className="toolbar-button">
          🔍- Zoom -
        </button>
        <button onClick={handleResetView} className="toolbar-button">
          🎯 Centrer
        </button>
        {isEditMode && (
          <button onClick={handleClearGraph} className="toolbar-button danger">
            🗑️ Effacer tout
          </button>
        )}
      </div>
      
      <div className="toolbar-group">
        <button 
          onClick={handleSimulateTransmission} 
          className="toolbar-button" 
          disabled={!canSimulate()}
        >
          Afficher chemin
        </button>
        <button onClick={handleClearPath} className="toolbar-button">
          Effacer chemin
        </button>
      </div>
      
      <div className="toolbar-group">
        <button 
          onClick={handleShowSimulationForm} 
          className="toolbar-button simulation-button"
          disabled={!canSimulate() || isSimulating}
        >
          <Mail className="w-4 h-4 mr-2" />
          Configuration Simulation
        </button>
      </div>
      
      <div className="toolbar-group">
        <span>Initial: {initialNode?.value || 'Non défini'}</span>
        <span>Final: {finalNode?.value || 'Non défini'}</span>
      </div>

      <ToastContainer />
    </div>
  );
};

export default Toolbar;