import React, { useState, useEffect } from 'react';
import { useGraphStore } from '../store/graphStore';
import { X, Save } from 'lucide-react';

const EdgeWeightModal = () => {
  const {
    showEdgeWeightModal,
    editingEdge,
    updateEdge,
    closeEdgeWeightModal,
  } = useGraphStore();

  const [weight, setWeight] = useState(0);

  useEffect(() => {
    if (editingEdge) {
      setWeight(editingEdge.weight || 0);
    }
  }, [editingEdge]);

  const handleSave = () => {
    if (editingEdge) {
      const newWeight = parseFloat(weight);
      if (!isNaN(newWeight) && newWeight >= 0) {
        updateEdge(editingEdge.id, { weight: newWeight });
        closeEdgeWeightModal();
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      closeEdgeWeightModal();
    }
  };

  if (!showEdgeWeightModal || !editingEdge) return null;

  return (
    <div className="modal-overlay" onClick={closeEdgeWeightModal}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>✏️ Modifier le poids de l'arc</h3>
          <button 
            className="modal-close-button"
            onClick={closeEdgeWeightModal}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="modal-body">
          <div className="form-group">
            <label>Nouveau poids</label>
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              onKeyPress={handleKeyPress}
              min="0"
              step="0.1"
              className="weight-input"
              autoFocus
            />
          </div>
        </div>
        
        <div className="modal-actions">
          <button 
            className="modal-button cancel"
            onClick={closeEdgeWeightModal}
          >
            Annuler
          </button>
          <button 
            className="modal-button save"
            onClick={handleSave}
          >
            <Save className="w-4 h-4 mr-2" />
            Sauvegarder
          </button>
        </div>
      </div>
    </div>
  );
};

export default EdgeWeightModal;