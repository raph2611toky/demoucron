import { create } from 'zustand';

export const useGraphStore = create((set, get) => ({
  nodes: [],
  edges: [],
  selectedNode: null,
  showNodeForm: false,
  contextMenu: { visible: false, x: 0, y: 0, adjustedPos: { x: 0, y: 0 } },
  arcCreationMode: null,
  previewArc: null,
  scale: 1,
  stagePosition: { x: 0, y: 0 },
  currentPath: [],
  
  // Edit mode
  isEditMode: true,
  
  // Simulation states
  showSimulationForm: false,
  isSimulating: false,
  simulationSteps: [],
  currentStepIndex: 0,
  packetPosition: null,
  animationSpeed: 1000,
  
  // Edge weight editing
  showEdgeWeightModal: false,
  editingEdge: null,

  // Edit mode methods
  setEditMode: (mode) => {
    set({ isEditMode: mode });
  },

  toggleEditMode: () => {
    set((state) => ({ isEditMode: !state.isEditMode }));
  },

  addNode: (x, y) => {
    const { isEditMode } = get();
    if (!isEditMode) return;
    
    const newNode = {
      id: `node-${Date.now()}`,
      x,
      y,
      value: '',
      isInitial: false,
      isFinal: false,
    };
    set((state) => ({
      nodes: [...state.nodes, newNode],
      selectedNode: newNode,
      showNodeForm: true,
      contextMenu: { visible: false, x: 0, y: 0, adjustedPos: { x: 0, y: 0 } },
    }));
  },

  updateNode: (id, updates) => {
    const { isEditMode } = get();
    if (!isEditMode) return;
    
    set((state) => {
      const nodes = state.nodes.map((node) =>
        node.id === id ? { ...node, ...updates } : node
      );
      if (updates.isInitial) {
        nodes.forEach((node) => {
          if (node.id !== id && node.isInitial) {
            node.isInitial = false;
          }
          if (node.id === id && node.isFinal) {
            node.isFinal = false;
          }
        });
      }
      if (updates.isFinal) {
        nodes.forEach((node) => {
          if (node.id !== id && node.isFinal) {
            node.isFinal = false;
          }
          if (node.id === id && node.isInitial) {
            node.isInitial = false;
          }
        });
      }
      return {
        nodes,
        selectedNode: state.selectedNode?.id === id ? { ...state.selectedNode, ...updates } : state.selectedNode,
      };
    });
  },

  deleteNode: (id) => {
    const { isEditMode } = get();
    if (!isEditMode) return;
    
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== id),
      edges: state.edges.filter((edge) => edge.fromNodeId !== id && edge.toNodeId !== id),
      selectedNode: state.selectedNode?.id === id ? null : state.selectedNode,
      showNodeForm: state.selectedNode?.id === id ? false : state.showNodeForm,
      currentPath: [],
    }));
  },

  addEdge: (fromNodeId, toNodeId) => {
    const { isEditMode } = get();
    if (!isEditMode) return;
    
    if (fromNodeId === toNodeId) return;
    const existingEdge = get().edges.find(
      (edge) => edge.fromNodeId === fromNodeId && edge.toNodeId === toNodeId
    );
    if (existingEdge) return;
    const newEdge = {
      id: `edge-${Date.now()}`,
      fromNodeId,
      toNodeId,
      weight: 1,
    };
    set((state) => ({ edges: [...state.edges, newEdge] }));
  },

  updateEdge: (id, updates) => {
    const { isEditMode } = get();
    if (!isEditMode) return;
    
    set((state) => ({
      edges: state.edges.map((edge) =>
        edge.id === id ? { ...edge, ...updates } : edge
      ),
    }));
  },

  deleteEdge: (id) => {
    const { isEditMode } = get();
    if (!isEditMode) return;
    
    set((state) => ({
      edges: state.edges.filter((edge) => edge.id !== id),
      currentPath: state.currentPath.filter((edgeId) => edgeId !== id),
    }));
  },

  setSelectedNode: (node) => {
    set({ selectedNode: node });
  },

  setShowNodeForm: (show) => {
    set({ showNodeForm: show });
  },

  setContextMenu: (visible, x = 0, y = 0, adjustedPos = { x: 0, y: 0 }) => {
    set({ contextMenu: { visible, x, y, adjustedPos } });
  },

  setArcCreationMode: (nodeId) => {
    const { isEditMode } = get();
    if (!isEditMode) return;
    
    set({ arcCreationMode: nodeId, previewArc: null });
  },

  setPreviewArc: (arc) => {
    set({ previewArc: arc });
  },

  clearGraph: () => {
    const { isEditMode } = get();
    if (!isEditMode) return;
    
    set({
      nodes: [],
      edges: [],
      selectedNode: null,
      showNodeForm: false,
      contextMenu: { visible: false, x: 0, y: 0, adjustedPos: { x: 0, y: 0 } },
      arcCreationMode: null,
      previewArc: null,
      currentPath: [],
      showSimulationForm: false,
      isSimulating: false,
      simulationSteps: [],
      currentStepIndex: 0,
      packetPosition: null,
      showEdgeWeightModal: false,
      editingEdge: null,
    });
  },

  setScale: (scale) => {
    set({ scale });
  },

  setStagePosition: (position) => {
    set({ stagePosition: position });
  },

  setCurrentPath: (path) => {
    set({ currentPath: path });
  },

  // Simulation methods
  setShowSimulationForm: (show) => {
    set({ showSimulationForm: show });
  },

  setSimulationSteps: (steps) => {
    set({ simulationSteps: steps });
  },

  setAnimationSpeed: (speed) => {
    set({ animationSpeed: speed });
  },

  startSimulation: () => {
    const { simulationSteps } = get();
    if (simulationSteps.length === 0) return;
    
    const initialNode = get().nodes.find(n => n.id === simulationSteps[0].nodeId);
    if (!initialNode) return;
    
    set({
      isSimulating: true,
      currentStepIndex: 0,
      packetPosition: {
        x: initialNode.x + 35,
        y: initialNode.y - 20,
        nodeId: initialNode.id
      },
    });
  },

  stopSimulation: () => {
    set({
      isSimulating: false,
      currentStepIndex: 0,
      packetPosition: null,
    });
  },

  nextSimulationStep: () => {
    const { currentStepIndex, simulationSteps, nodes, edges } = get();
    const nextIndex = currentStepIndex + 1;
    
    if (nextIndex < simulationSteps.length) {
      const nextStep = simulationSteps[nextIndex];
      const nextNode = nodes.find(n => n.id === nextStep.nodeId);
      
      if (nextNode) {
        // Calculate animation duration based on edge weight
        let duration = 1000; // default
        if (currentStepIndex >= 0) {
          const currentStep = simulationSteps[currentStepIndex];
          const edge = edges.find(e => 
            e.fromNodeId === currentStep.nodeId && e.toNodeId === nextStep.nodeId
          );
          if (edge) {
            duration = edge.weight * 10; // weight × 10ms
          }
        }
        
        set({
          currentStepIndex: nextIndex,
          packetPosition: {
            x: nextNode.x + 35,
            y: nextNode.y - 20,
            nodeId: nextNode.id
          },
        });
        
        return { hasNext: true, duration };
      }
    }
    
    set({
      isSimulating: false,
      packetPosition: null,
    });
    return { hasNext: false, duration: 0 };
  },

  getInitialNode: () => {
    return get().nodes.find(node => node.isInitial);
  },

  getFinalNode: () => {
    return get().nodes.find(node => node.isFinal);
  },

  canSimulate: () => {
    const { getInitialNode, getFinalNode } = get();
    return getInitialNode() && getFinalNode();
  },

  generateAutoPath: () => {
    const { getInitialNode, getFinalNode, findPath } = get();
    const initialNode = getInitialNode();
    const finalNode = getFinalNode();
    
    if (!initialNode || !finalNode) return [];
    
    const edgePath = findPath(initialNode.id, finalNode.id);
    if (!edgePath) return [];
    
    const { nodes, edges } = get();
    const nodePath = [initialNode.id];
    
    edgePath.forEach(edgeId => {
      const edge = edges.find(e => e.id === edgeId);
      if (edge) {
        nodePath.push(edge.toNodeId);
      }
    });
    
    return nodePath.map(nodeId => {
      const node = nodes.find(n => n.id === nodeId);
      return {
        id: nodeId,
        nodeId,
        value: node?.value || nodeId
      };
    });
  },

  addStepAfter: (afterIndex, nodeId) => {
    const { isEditMode, nodes, simulationSteps } = get();
    if (!isEditMode) return;
    
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    const newStep = {
      id: `step-${Date.now()}`,
      nodeId,
      value: node.value || nodeId
    };
    
    const newSteps = [...simulationSteps];
    newSteps.splice(afterIndex + 1, 0, newStep);
    
    set({ simulationSteps: newSteps });
  },

  removeStep: (stepIndex) => {
    const { isEditMode, simulationSteps } = get();
    if (!isEditMode) return;
    
    if (simulationSteps.length <= 2) return; // Keep at least initial and final
    
    const newSteps = simulationSteps.filter((_, index) => index !== stepIndex);
    set({ simulationSteps: newSteps });
  },

  // Edge weight modal methods
  setShowEdgeWeightModal: (show) => {
    set({ showEdgeWeightModal: show });
  },

  setEditingEdge: (edge) => {
    set({ editingEdge: edge });
  },

  openEdgeWeightModal: (edge) => {
    const { isEditMode } = get();
    if (!isEditMode) return;
    
    set({ 
      editingEdge: edge,
      showEdgeWeightModal: true 
    });
  },

  closeEdgeWeightModal: () => {
    set({ 
      showEdgeWeightModal: false,
      editingEdge: null 
    });
  },

  findPath: (startId, endId) => {
    const { nodes, edges } = get();
    const adjList = {};
    nodes.forEach((node) => {
      adjList[node.id] = [];
    });
    edges.forEach((edge) => {
      adjList[edge.fromNodeId].push({ to: edge.toNodeId, edgeId: edge.id });
    });

    const queue = [startId];
    const visited = new Set();
    const cameFrom = {};

    visited.add(startId);

    while (queue.length > 0) {
      const current = queue.shift();
      if (current === endId) {
        const path = [];
        let node = endId;
        while (node !== startId) {
          const { from, edgeId } = cameFrom[node];
          path.unshift(edgeId);
          node = from;
        }
        return path;
      }
      adjList[current].forEach((neighbor) => {
        if (!visited.has(neighbor.to)) {
          visited.add(neighbor.to);
          cameFrom[neighbor.to] = { from: current, edgeId: neighbor.edgeId };
          queue.push(neighbor.to);
        }
      });
    }
    return null;
  },
}));