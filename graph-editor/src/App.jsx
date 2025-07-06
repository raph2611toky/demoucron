import React, { useState } from 'react';
import GraphCanvas from './components/GraphCanvas';
import NodeForm from './components/NodeForm';
import SimulationForm from './components/SimulationForm';
import EdgeWeightModal from './components/EdgeWeightModal.jsx';
import Toolbar from './components/Toolbar';
import { useGraphStore } from './store/graphStore';
import './App.css';

function App() {
  const { isEditMode, setEditMode } = useGraphStore();

  return (
    <div className="app">
      <Toolbar />
      <div className="main-content">
        <GraphCanvas />
        <NodeForm />
        <SimulationForm />
      </div>
      <EdgeWeightModal />
    </div>
  );
}

export default App;