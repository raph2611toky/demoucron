import React from 'react';
import { useGraphStore } from '../store/graphStore';
import { Mail, Edit, Eye } from 'lucide-react';

const Toolbar = () => {
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

  const handleClearGraph = () => {
    if (!isEditMode) return;
    if (confirm('Êtes-vous sûr de vouloir effacer tout le graphe ?')) {
      clearGraph();
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
        alert('Aucun chemin trouvé entre le sommet initial et final.');
        setCurrentPath([]);
      }
    }
  };

  const handleShowSimulationForm = () => {
    if (!canSimulate()) {
      alert('Veuillez définir un sommet initial et un sommet final avant de configurer la simulation.');
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
    </div>
  );
};

export default Toolbar;