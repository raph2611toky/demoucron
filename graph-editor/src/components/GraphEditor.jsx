import React from 'react';
import GraphCanvas from './GraphCanvas';
import NodeForm from './NodeForm';
import SimulationForm from './SimulationForm';
import EdgeWeightModal from './EdgeWeightModal';
import Toolbar from './Toolbar';
import { useGraphStore } from '../store/graphStore';
import '../styles/GraphEditor.css';
import '../styles/NodeForm.css';
import '../styles/Toolbar.css';
import '../styles/GraphCanvas.css';
import '../styles/EdgeWeightModal.css';
import '../styles/SimulationForm.css';

const GraphEditor = ({ selectedGraph }) => {
  console.log(selectedGraph);
  const { showNodeForm, showSimulationForm, showEdgeWeightModal } = useGraphStore();

  return (
    <div className="graph-editor">
      <div className="editor-header">
        <h2>🎨 Éditeur de Graphe - {selectedGraph.name}</h2>
        <p>Mode édition activé pour le graphe sélectionné</p>
      </div>
      <div className="editor-content">
        <Toolbar graphId={selectedGraph.id} />
        <div className="canvas-area">
          <GraphCanvas />
        </div>
      </div>
      {showNodeForm && <NodeForm />}
      {showSimulationForm && <SimulationForm />}
      {showEdgeWeightModal && <EdgeWeightModal />}
    </div>
  );
};

export default GraphEditor;