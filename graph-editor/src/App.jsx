import React from 'react';
import BackendGraphManager from './components/BackendGraphManager';
import GraphEditor from './components/GraphEditor';
import AdjacencyMatrix from './components/AdjacencyMatrix';
import DemoucronAlgorithm from './components/DemoucronAlgorithm';
import { useGraphStore } from './store/graphStore';
import './styles/App.css';

function App() {
  const { selectedGraph, setSelectedGraph } = useGraphStore();

  const handleGraphSelected = (graph) => {
    setSelectedGraph(graph);
  };

  return (
    <div className="app">
      {/* Backend Graph Manager - Always at the top */}
      <section className="backend-manager-section">
        <BackendGraphManager
          isEditMode={true}
          onGraphSelected={handleGraphSelected}
          selectedGraph={selectedGraph}
        />
      </section>

      {/* Graph Editor - Shows when a graph is selected */}
      {selectedGraph && (
        <section className="graph-editor-section">
          <GraphEditor selectedGraph={selectedGraph} />
        </section>
      )}

      {/* Adjacency Matrix - Shows when a graph is selected */}
      <section className="matrix-section">
        <AdjacencyMatrix selectedGraph={selectedGraph} />
      </section>

      {/* Demoucron Algorithm Section */}
      <section className="demoucron-section">
        <DemoucronAlgorithm selectedGraph={selectedGraph} />
      </section>
    </div>
  );
}

export default App;