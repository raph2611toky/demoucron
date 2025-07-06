import { create } from 'zustand';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

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

  // Backend integration
  selectedGraph: null,

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

  // Backend methods
  setSelectedGraph: (graph) => {
    set({ selectedGraph: graph });
    if (graph) {
      // Convert backend data to frontend format
      const frontendNodes = (graph.sommets || []).map(sommet => ({
        id: `node-${sommet.id}`,
        x: sommet.x || Math.random() * 400 + 200,
        y: sommet.y || Math.random() * 300 + 150,
        value: sommet.name,
        isInitial: sommet.type === 'initial',
        isFinal: sommet.type === 'final',
        backendId: sommet.id,
        backendName: sommet.name,
        isTemporary: false // Nodes from backend are not temporary
      }));

      const frontendEdges = (graph.arcs || []).map(arc => ({
        id: `edge-${arc.id}`,
        fromNodeId: `node-${graph.sommets.find(s => s.name === arc.source)?.id}`,
        toNodeId: `node-${graph.sommets.find(s => s.name === arc.target)?.id}`,
        weight: arc.weight,
        backendId: arc.id,
        isTemporary: false // Edges from backend are not temporary
      }));

      set({
        nodes: frontendNodes,
        edges: frontendEdges,
        selectedNode: null,
        showNodeForm: false
      });
    } else {
      set({
        nodes: [],
        edges: [],
        selectedNode: null,
        showNodeForm: false
      });
    }
  },

  syncWithBackend: async () => {
    const { selectedGraph } = get();
    if (!selectedGraph) return;

    try {
      const response = await axios.get(`${API_BASE_URL}/graphs/${selectedGraph.id}/`);
      
      // Update selectedGraph and convert to frontend format
      const updatedGraph = response.data;
      
      const frontendNodes = (updatedGraph.sommets || []).map(sommet => ({
        id: `node-${sommet.id}`,
        x: sommet.x || Math.random() * 400 + 200,
        y: sommet.y || Math.random() * 300 + 150,
        value: sommet.name,
        isInitial: sommet.type === 'initial',
        isFinal: sommet.type === 'final',
        backendId: sommet.id,
        backendName: sommet.name,
        isTemporary: false
      }));

      const frontendEdges = (updatedGraph.arcs || []).map(arc => ({
        id: `edge-${arc.id}`,
        fromNodeId: `node-${updatedGraph.sommets.find(s => s.name === arc.source)?.id}`,
        toNodeId: `node-${updatedGraph.sommets.find(s => s.name === arc.target)?.id}`,
        weight: arc.weight,
        backendId: arc.id,
        isTemporary: false
      }));

      set({
        selectedGraph: updatedGraph,
        nodes: frontendNodes,
        edges: frontendEdges
      });
    } catch (error) {
      console.error('Erreur de synchronisation:', error);
    }
  },

  // Edit mode methods
  setEditMode: (mode) => {
    set({ isEditMode: mode });
  },

  toggleEditMode: () => {
    set((state) => ({ isEditMode: !state.isEditMode }));
  },

  addNode: (x, y) => {
    const { isEditMode, selectedGraph } = get();
    if (!isEditMode || !selectedGraph) return;

    const newNodeName = `S${Date.now().toString().slice(-4)}`;

    // Create temporary node (not saved to backend yet)
    const newNode = {
      id: `temp-node-${Date.now()}`,
      x,
      y,
      value: newNodeName,
      isInitial: false,
      isFinal: false,
      isTemporary: true, // Mark as temporary
      backendId: null,
      backendName: newNodeName
    };

    set((state) => ({
      nodes: [...state.nodes, newNode],
      selectedNode: newNode,
      showNodeForm: true,
      contextMenu: { visible: false, x: 0, y: 0, adjustedPos: { x: 0, y: 0 } },
    }));
  },

  saveNodeToBackend: async (nodeId, nodeData) => {
    const { selectedGraph, nodes } = get();
    if (!selectedGraph) return null;

    const node = nodes.find(n => n.id === nodeId);
    if (!node) return null;

    try {
      if (node.isTemporary) {
        // Create new node in backend
        const response = await axios.post(`${API_BASE_URL}/graphs/${selectedGraph.id}/add_sommet/`, {
          name: nodeData.value || node.value,
          type: nodeData.isInitial ? 'initial' : nodeData.isFinal ? 'final' : 'normal',
          x: node.x,
          y: node.y
        });

        // Update node to be non-temporary
        set((state) => ({
          nodes: state.nodes.map(n =>
            n.id === nodeId
              ? {
                  ...n,
                  ...nodeData,
                  isTemporary: false,
                  backendId: response.data.id,
                  backendName: nodeData.value || node.value
                }
              : n
          )
        }));

        // Sync with backend to update selectedGraph
        await get().syncWithBackend();
        return response.data;
      } else {
        // Update existing node - for now just update locally
        // Backend doesn't have update endpoint, would need to delete and recreate
        set((state) => ({
          nodes: state.nodes.map(n =>
            n.id === nodeId ? { ...n, ...nodeData } : n
          )
        }));
        return node;
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du sommet:', error);
      throw error;
    }
  },

  updateNode: async (id, updates) => {
    const { isEditMode, nodes } = get();
    if (!isEditMode) return;

    // Update frontend immediately for UI responsiveness
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

  deleteNode: async (id) => {
    const { isEditMode, selectedGraph, nodes } = get();
    if (!isEditMode || !selectedGraph) return;

    const node = nodes.find(n => n.id === id);
    if (!node) return;

    try {
      if (!node.isTemporary && node.backendName) {
        // Delete from backend only if it's not temporary
        await axios.delete(`${API_BASE_URL}/graphs/${selectedGraph.id}/delete_sommet/${node.backendName}/`);
      }

      // Delete from frontend
      set((state) => ({
        nodes: state.nodes.filter((node) => node.id !== id),
        edges: state.edges.filter((edge) => edge.fromNodeId !== id && edge.toNodeId !== id),
        selectedNode: state.selectedNode?.id === id ? null : state.selectedNode,
        showNodeForm: state.selectedNode?.id === id ? false : state.showNodeForm,
        currentPath: [],
      }));

      // Sync with backend only if node was saved
      if (!node.isTemporary) {
        await get().syncWithBackend();
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du sommet:', error);
    }
  },

  addEdge: async (fromNodeId, toNodeId) => {
    const { isEditMode, selectedGraph, nodes } = get();
    if (!isEditMode || !selectedGraph) return;

    if (fromNodeId === toNodeId) return;
    const existingEdge = get().edges.find(
      (edge) => edge.fromNodeId === fromNodeId && edge.toNodeId === toNodeId
    );
    if (existingEdge) return;

    const fromNode = nodes.find(n => n.id === fromNodeId);
    const toNode = nodes.find(n => n.id === toNodeId);
    if (!fromNode || !toNode) return;

    // Check if both nodes are saved to backend
    if (fromNode.isTemporary || toNode.isTemporary) {
      alert('Veuillez d\'abord sauvegarder les sommets avant de créer des arcs entre eux.');
      return;
    }

    try {
      // Add to backend
      const response = await axios.post(`${API_BASE_URL}/graphs/${selectedGraph.id}/add_arc/`, {
        source: fromNode.backendName,
        target: toNode.backendName,
        weight: 1
      });

      // Add to frontend
      const newEdge = {
        id: `edge-${response.data.id}`,
        fromNodeId,
        toNodeId,
        weight: 1,
        backendId: response.data.id,
        isTemporary: false
      };

      set((state) => ({ edges: [...state.edges, newEdge] }));

      // Sync with backend
      await get().syncWithBackend();
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'arc:', error);
      alert('Erreur lors de la création de l\'arc. Vérifiez que les sommets sont bien sauvegardés.');
    }
  },

  updateEdge: async (id, updates) => {
    const { isEditMode, selectedGraph, edges, nodes } = get();
    if (!isEditMode || !selectedGraph) return;

    const edge = edges.find(e => e.id === id);
    if (!edge) return;

    try {
      // For weight updates, we need to delete and recreate the arc
      // This is a limitation of the current backend API
      if (updates.weight !== undefined && !edge.isTemporary) {
        const fromNode = nodes.find(n => n.id === edge.fromNodeId);
        const toNode = nodes.find(n => n.id === edge.toNodeId);

        if (fromNode && toNode && !fromNode.isTemporary && !toNode.isTemporary) {
          // Delete old arc
          await axios.delete(`${API_BASE_URL}/graphs/${selectedGraph.id}/delete_arc/${fromNode.backendName}/${toNode.backendName}/`);

          // Create new arc with updated weight
          const response = await axios.post(`${API_BASE_URL}/graphs/${selectedGraph.id}/add_arc/`, {
            source: fromNode.backendName,
            target: toNode.backendName,
            weight: updates.weight
          });

          // Update frontend
          set((state) => ({
            edges: state.edges.map((edge) =>
              edge.id === id ? { ...edge, ...updates, backendId: response.data.id } : edge
            ),
          }));

          // Sync with backend
          await get().syncWithBackend();
        }
      } else {
        // Just update frontend for temporary edges or non-weight updates
        set((state) => ({
          edges: state.edges.map((edge) =>
            edge.id === id ? { ...edge, ...updates } : edge
          ),
        }));
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'arc:', error);
    }
  },

  deleteEdge: async (id) => {
    const { isEditMode, selectedGraph, edges, nodes } = get();
    if (!isEditMode || !selectedGraph) return;

    const edge = edges.find(e => e.id === id);
    if (!edge) return;

    try {
      if (!edge.isTemporary) {
        const fromNode = nodes.find(n => n.id === edge.fromNodeId);
        const toNode = nodes.find(n => n.id === edge.toNodeId);

        if (fromNode && toNode && !fromNode.isTemporary && !toNode.isTemporary) {
          // Delete from backend
          await axios.delete(`${API_BASE_URL}/graphs/${selectedGraph.id}/delete_arc/${fromNode.backendName}/${toNode.backendName}/`);
        }
      }

      // Delete from frontend
      set((state) => ({
        edges: state.edges.filter((edge) => edge.id !== id),
        currentPath: state.currentPath.filter((edgeId) => edgeId !== id),
      }));

      // Sync with backend only if edge was saved
      if (!edge.isTemporary) {
        await get().syncWithBackend();
      }
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'arc:', error);
    }
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