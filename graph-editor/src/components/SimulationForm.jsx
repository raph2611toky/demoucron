  import React, { useState, useEffect } from 'react';
  import { useGraphStore } from '../store/graphStore';
  import { Mail, Play, Square, Settings, Route, Plus, Trash2 } from 'lucide-react';
  
  const SimulationForm = () => {
    const {
      showSimulationForm,
      nodes,
      simulationSteps,
      isSimulating,
      currentStepIndex,
      isEditMode,
      setShowSimulationForm,
      setSimulationSteps,
      startSimulation,
      stopSimulation,
      nextSimulationStep,
      generateAutoPath,
      addStepAfter,
      removeStep,
      getInitialNode,
      getFinalNode,
    } = useGraphStore();
  
    const [selectedNodeForAdd, setSelectedNodeForAdd] = useState('');
    const [addAfterIndex, setAddAfterIndex] = useState(-1);
  
    useEffect(() => {
      if (showSimulationForm) {
        const autoPath = generateAutoPath();
        setSimulationSteps(autoPath);
      }
    }, [showSimulationForm, generateAutoPath, setSimulationSteps]);
  
    useEffect(() => {
      let interval;
      if (isSimulating && simulationSteps.length > 0) {
        interval = setInterval(() => {
          const result = nextSimulationStep();
          if (!result.hasNext) {
            clearInterval(interval);
          }
        }, 500); // Base interval, actual duration is calculated in the store
      }
      return () => clearInterval(interval);
    }, [isSimulating, nextSimulationStep, simulationSteps.length]);
  
    const handleStartSimulation = () => {
      if (simulationSteps.length === 0) {
        alert('Aucune étape de simulation définie');
        return;
      }
      startSimulation();
    };
  
    const handleAddStep = () => {
      if (!isEditMode || !selectedNodeForAdd || addAfterIndex === -1) return;
      
      addStepAfter(addAfterIndex, selectedNodeForAdd);
      setSelectedNodeForAdd('');
      setAddAfterIndex(-1);
    };
  
    const handleRemoveStep = (index) => {
      if (!isEditMode) return;
      removeStep(index);
    };
  
    const initialNode = getInitialNode();
    const finalNode = getFinalNode();
  
    if (!showSimulationForm) return null;
  
    return (
      <div className="simulation-form">
        <div className="form-header">
          <h3>
            <Mail className="inline w-6 h-6 mr-2" />
            Configuration de la Simulation
          </h3>
          <button 
            className="close-button"
            onClick={() => setShowSimulationForm(false)}
          >
            ×
          </button>
        </div>
        
        <div className="form-content">
          <div className="simulation-info">
            <div className="info-item">
              <Route className="w-5 h-5" />
              <span>Départ: <strong>{initialNode?.value || 'Non défini'}</strong></span>
            </div>
            <div className="info-item">
              <Route className="w-5 h-5" />
              <span>Arrivée: <strong>{finalNode?.value || 'Non défini'}</strong></span>
            </div>
          </div>
  
          <div className="simulation-controls">
            <button 
              className={`control-button ${isSimulating ? 'active' : ''}`}
              onClick={handleStartSimulation}
              disabled={isSimulating || simulationSteps.length === 0 || !initialNode || !finalNode}
            >
              <Play className="w-4 h-4 mr-2" />
              Démarrer
            </button>
            <button 
              className="control-button stop"
              onClick={stopSimulation}
              disabled={!isSimulating}
            >
              <Square className="w-4 h-4 mr-2" />
              Arrêter
            </button>
          </div>
  
          <div className="steps-section">
            <h4>
              <Settings className="inline w-4 h-4 mr-2" />
              Parcours de transmission ({simulationSteps.length} étapes)
            </h4>
            
            {addAfterIndex !== -1 && isEditMode && (
              <div className="add-step-form">
                <select
                  value={selectedNodeForAdd}
                  onChange={(e) => setSelectedNodeForAdd(e.target.value)}
                  className="step-node-select"
                >
                  <option value="">Sélectionner un sommet</option>
                  {nodes.map(node => (
                    <option key={node.id} value={node.id}>
                      {node.value || node.id}
                    </option>
                  ))}
                </select>
                
                <div className="add-step-actions">
                  <button
                    onClick={handleAddStep}
                    className="add-step-button"
                    disabled={!selectedNodeForAdd}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Ajouter
                  </button>
                  <button
                    onClick={() => {
                      setAddAfterIndex(-1);
                      setSelectedNodeForAdd('');
                    }}
                    className="cancel-step-button"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}
  
            <div className="steps-list">
              {simulationSteps.map((step, index) => (
                <div 
                  key={step.id} 
                  className={`step-item ${currentStepIndex === index && isSimulating ? 'current' : ''}`}
                >
                  <div className="step-info">
                    <span className="step-number">{index}</span>
                    <span className="step-description">{step.value || step.nodeId}</span>
                  </div>
                  <div className="step-actions">
                    {isEditMode && addAfterIndex !== index && (
                      <button
                        className="add-after-button"
                        onClick={() => setAddAfterIndex(index)}
                        disabled={isSimulating}
                        title="Ajouter un sommet après cette étape"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    )}
                    {isEditMode && simulationSteps.length > 2 && index !== 0 && index !== simulationSteps.length - 1 && (
                      <button
                        className="remove-step-button"
                        onClick={() => handleRemoveStep(index)}
                        disabled={isSimulating}
                        title="Supprimer cette étape"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  export default SimulationForm;