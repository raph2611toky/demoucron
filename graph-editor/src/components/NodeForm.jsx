import React, { useState, useEffect } from 'react';
import { useGraphStore } from '../store/graphStore';

const NodeForm = () => {
  const {
    selectedNode,
    showNodeForm,
    nodes,
    edges,
    isEditMode,
    updateNode,
    deleteNode,
    updateEdge,
    deleteEdge,
    setShowNodeForm,
  } = useGraphStore();

  const [formData, setFormData] = useState({
    value: '',
    isInitial: false,
    isFinal: false,
  });

  useEffect(() => {
    if (selectedNode) {
      setFormData({
        value: selectedNode.value,
        isInitial: selectedNode.isInitial,
        isFinal: selectedNode.isFinal,
      });
    }
  }, [selectedNode]);

  const handleSave = () => {
    if (!isEditMode || !selectedNode) return;
    updateNode(selectedNode.id, formData);
    setShowNodeForm(false);
  };

  const handleDelete = () => {
    if (!isEditMode || !selectedNode) return;
    if (confirm('Êtes-vous sûr de vouloir supprimer ce sommet ?')) {
      deleteNode(selectedNode.id);
    }
  };

  const handleInitialChange = (checked) => {
    if (!isEditMode) return;
    
    if (checked) {
      const currentInitial = nodes.find(n => n.isInitial && n.id !== selectedNode?.id);
      if (currentInitial) {
        if (confirm('Un sommet initial existe déjà. Voulez-vous le remplacer ?')) {
          setFormData({ ...formData, isInitial: true, isFinal: false });
        }
      } else {
        setFormData({ ...formData, isInitial: true, isFinal: false });
      }
    } else {
      setFormData({ ...formData, isInitial: false });
    }
  };

  const handleFinalChange = (checked) => {
    if (!isEditMode) return;
    
    if (checked) {
      const currentFinal = nodes.find(n => n.isFinal && n.id !== selectedNode?.id);
      if (currentFinal) {
        if (confirm('Un sommet final existe déjà. Voulez-vous le remplacer ?')) {
          setFormData({ ...formData, isFinal: true, isInitial: false });
        }
      } else {
        setFormData({ ...formData, isFinal: true, isInitial: false });
      }
    } else {
      setFormData({ ...formData, isFinal: false });
    }
  };

  const getOutgoingEdges = () => {
    if (!selectedNode) return [];
    return edges.filter(edge => edge.fromNodeId === selectedNode.id);
  };

  const getNodeById = (id) => {
    return nodes.find(node => node.id === id);
  };

  const handleEdgeWeightChange = (edgeId, newWeight) => {
    if (!isEditMode) return;
    
    const weight = parseFloat(newWeight);
    if (!isNaN(weight)) {
      updateEdge(edgeId, { weight });
    }
  };

  if (!showNodeForm || !selectedNode) return null;

  const outgoingEdges = getOutgoingEdges();

  return (
    <div className="node-form">
      <div className="form-header">
        <h3>
          {isEditMode ? '✨ Propriétés du sommet' : '👁️ Informations du sommet'}
        </h3>
        <button 
          className="close-button"
          onClick={() => setShowNodeForm(false)}
        >
          ×
        </button>
      </div>
      
      <div className="form-content">
        <div className="form-group">
          <label>🏷️ Valeur du sommet</label>
          <input
            type="text"
            value={formData.value}
            onChange={(e) => isEditMode && setFormData({ ...formData, value: e.target.value })}
            placeholder="Entrez la valeur du sommet"
            disabled={!isEditMode}
          />
        </div>

        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={formData.isInitial}
              onChange={(e) => handleInitialChange(e.target.checked)}
              disabled={!isEditMode}
            />
            🚀 Sommet initial
          </label>
        </div>

        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={formData.isFinal}
              onChange={(e) => handleFinalChange(e.target.checked)}
              disabled={!isEditMode}
            />
            🎯 Sommet final
          </label>
        </div>

        {isEditMode && (
          <div className="form-actions">
            <button className="save-button" onClick={handleSave}>
              💾 Sauvegarder
            </button>
            <button className="delete-button" onClick={handleDelete}>
              🗑️ Supprimer
            </button>
          </div>
        )}

        {outgoingEdges.length > 0 && (
          <div className="edges-section">
            <h4>🔗 Arcs sortants ({outgoingEdges.length})</h4>
            <div className="edges-list">
              {outgoingEdges.map(edge => {
                const targetNode = getNodeById(edge.toNodeId);
                return (
                  <div key={edge.id} className="edge-item">
                    <div className="edge-info">
                      <span className="edge-target">
                        → {targetNode ? targetNode.value || 'Sans nom' : 'Inconnu'}
                      </span>
                      <input
                        type="number"
                        value={edge.weight}
                        onChange={(e) => handleEdgeWeightChange(edge.id, e.target.value)}
                        className="edge-weight-input"
                        step="0.1"
                        placeholder="Poids"
                        disabled={!isEditMode}
                      />
                    </div>
                    {isEditMode && (
                      <button
                        className="edge-delete-button"
                        onClick={() => {
                          if (confirm('Supprimer cet arc ?')) {
                            deleteEdge(edge.id);
                          }
                        }}
                      >
                        ×
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NodeForm;