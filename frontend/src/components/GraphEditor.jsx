import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

function GraphEditor({ onUpdate, theme }) {
  const [graphId, setGraphId] = useState(null);
  const [graphName, setGraphName] = useState("");
  const [graphs, setGraphs] = useState([]);
  const [selectedGraph, setSelectedGraph] = useState("");
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [nodeName, setNodeName] = useState("");
  const [nodeType, setNodeType] = useState("normal");
  const [source, setSource] = useState("");
  const [target, setTarget] = useState("");
  const [weight, setWeight] = useState("");
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: "", type: "success" });

  const loadGraphs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get("http://localhost:8000/api/graphs/");
      setGraphs(response.data);
      setNotification({ show: true, message: "Liste des graphes chargée avec succès", type: "success" });
    } catch (error) {
      setNotification({ show: true, message: `Erreur de chargement: ${error.message}`, type: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  const loadGraphDetails = useCallback(async (graphId) => {
    if (!graphId) {
      setGraphId(null);
      setNodes([]);
      setEdges([]);
      onUpdate({ nodes: [], edges: [], node_names: [], initial_matrix: [], graphId: null });
      return;
    }
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:8000/api/graphs/${graphId}/`);
      const data = response.data;
      setGraphId(data.id);
      setNodes(data.sommets || []);
      setEdges(data.arcs || []);
      setNotification({ show: true, message: `Graphe '${data.name}' chargé avec succès`, type: "success" });
      onUpdate({
        nodes: data.sommets || [],
        edges: data.arcs || [],
        node_names: data.node_names || [],
        initial_matrix: data.initial_matrix || [],
        graphId: data.id
      });
    } catch (error) {
      setNotification({ show: true, message: `Erreur de chargement: ${error.message}`, type: "error" });
      onUpdate({ error: "Erreur lors du chargement du graphe" });
    } finally {
      setLoading(false);
    }
  }, [onUpdate]);

  const deleteGraph = async (graphIdToDelete) => {
    if (!graphIdToDelete) {
      setNotification({ show: true, message: "Aucun graphe sélectionné pour suppression", type: "error" });
      return;
    }
    setLoading(true);
    try {
      await axios.delete(`http://localhost:8000/api/graphs/${graphIdToDelete}/supprimer/`);
      setGraphs((prevGraphs) => prevGraphs.filter((g) => g.id !== graphIdToDelete));
      if (selectedGraph === String(graphIdToDelete)) {
        setSelectedGraph("");
        setGraphId(null);
        setNodes([]);
        setEdges([]);
        onUpdate({ nodes: [], edges: [], node_names: [], initial_matrix: [], graphId: null });
      }
      setNotification({ show: true, message: "Graphe supprimé avec succès", type: "success" });
    } catch (error) {
      setNotification({ show: true, message: `Erreur de suppression: ${error.message}`, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGraphs();
  }, [loadGraphs]);

  useEffect(() => {
    loadGraphDetails(selectedGraph);
  }, [selectedGraph, loadGraphDetails]);

  const createGraph = async () => {
    if (!graphName) {
      setNotification({ show: true, message: "Veuillez entrer un nom pour le graphe", type: "error" });
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post("http://localhost:8000/api/graphs/create/", { name: graphName });
      const newGraph = response.data;
      setGraphs((prevGraphs) => [...prevGraphs, newGraph]);
      setSelectedGraph(String(newGraph.id));
      setGraphName("");
      setNotification({ show: true, message: `Graphe '${newGraph.name}' créé avec succès`, type: "success" });
    } catch (error) {
      setNotification({ show: true, message: `Erreur de création: ${error.message}`, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const addNode = async () => {
    if (!nodeName) {
      setNotification({ show: true, message: "Veuillez entrer un nom pour le sommet", type: "error" });
      return;
    }
    if (!graphId) {
      setNotification({ show: true, message: "Veuillez créer ou sélectionner un graphe d'abord", type: "error" });
      return;
    }
    if (nodes.some((n) => n.name === nodeName)) {
      setNotification({ show: true, message: `Le sommet '${nodeName}' existe déjà`, type: "error" });
      return;
    }
    setLoading(true);
    try {
      await axios.post(`http://localhost:8000/api/graphs/${graphId}/add_sommet/`, { name: nodeName, type: nodeType });
      await loadGraphDetails(graphId);
      setNodeName("");
      setNodeType("normal");
      setNotification({ show: true, message: `Sommet '${nodeName}' ajouté avec succès`, type: "success" });
    } catch (error) {
      setNotification({ show: true, message: `Erreur d'ajout: ${error.message}`, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const addEdge = async () => {
    if (!source || !target || !weight) {
      setNotification({ show: true, message: "Veuillez remplir tous les champs pour l'arc", type: "error" });
      return;
    }
    if (!graphId) {
      setNotification({ show: true, message: "Veuillez créer ou sélectionner un graphe d'abord", type: "error" });
      return;
    }
    if (source === target) {
      setNotification({ show: true, message: "La source et la cible ne peuvent pas être identiques", type: "error" });
      return;
    }
    setLoading(true);
    try {
      await axios.post(`http://localhost:8000/api/graphs/${graphId}/add_arc/`, {
        source,
        target,
        weight: Number.parseFloat(weight)
      });
      await loadGraphDetails(graphId);
      setSource("");
      setTarget("");
      setWeight("");
      setNotification({ show: true, message: `Arc de '${source}' à '${target}' ajouté avec succès`, type: "success" });
    } catch (error) {
      setNotification({ show: true, message: `Erreur d'ajout: ${error.message}`, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const deleteNode = async (sommetName) => {
    if (!graphId) {
      setNotification({ show: true, message: "Aucun graphe sélectionné", type: "error" });
      return;
    }
    setLoading(true);
    try {
      await axios.delete(`http://localhost:8000/api/graphs/${graphId}/delete_sommet/${sommetName}/`);
      await loadGraphDetails(graphId);
      setNotification({ show: true, message: `Sommet '${sommetName}' supprimé avec succès`, type: "success" });
    } catch (error) {
      setNotification({ show: true, message: `Erreur de suppression: ${error.message}`, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const deleteEdge = async (sourceName, targetName) => {
    if (!graphId) {
      setNotification({ show: true, message: "Aucun graphe sélectionné", type: "error" });
      return;
    }
    setLoading(true);
    try {
      await axios.delete(`http://localhost:8000/api/graphs/${graphId}/delete_arc/${sourceName}/${targetName}/`);
      await loadGraphDetails(graphId);
      setNotification({ show: true, message: `Arc de '${sourceName}' à '${targetName}' supprimé avec succès`, type: "success" });
    } catch (error) {
      setNotification({ show: true, message: `Erreur de suppression: ${error.message}`, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => setNotification({ show: false, message: "", type: "success" }), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const getNodeTypeIcon = (type) => {
    switch (type) {
      case "initial":
        return <svg className="node-type-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2m4 7h6" /></svg>;
      case "final":
        return <svg className="node-type-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
//  -4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
      default:
        return <svg className="node-type-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>;
    }
  };

  return (
    <div className="graph-editor">
      <div className="panel-header">
        <div className="panel-icon">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a1 1 0 01-1-1V9a1 1 0 011-1h1a2 2 0 100-4H4a1 1 0 01-1-1V4a1 1 0 011-1h3a1 1 0 001-1v-1a2 2 0 114 0z" />
          </svg>
        </div>
        <div className="panel-title">
          <h2>Éditeur de Graphe</h2>
          <p>Créez et modifiez votre graphe interactivement</p>
        </div>
      </div>

      <AnimatePresence>
        {notification.show && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className={`notification ${notification.type}`}
          >
            <div className="notification-icon">
              {notification.type === "error" ? (
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <span>{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="editor-sections">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="editor-section"
        >
          <div className="section-header">
            <h3>Gestion du Graphe</h3>
            <button onClick={loadGraphs} disabled={loading} className="refresh-btn">
              <svg className={loading ? "spinning" : ""} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m0 0a8.001 8.001 0 0115.356 2m-15.356-2H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label>Sélectionner un graphe</label>
              <select value={selectedGraph} onChange={(e) => setSelectedGraph(e.target.value)} className="form-select">
                <option value="">Choisir un graphe existant</option>
                {graphs.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Nouveau graphe</label>
              <div className="input-group">
                <input
                  type="text"
                  value={graphName}
                  onChange={(e) => setGraphName(e.target.value)}
                  placeholder="Nom du graphe"
                  className="form-input"
                />
                <button onClick={createGraph} disabled={loading} className="btn btn-primary">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          <div className="graph-list">
            <h4>Liste des graphes</h4>
            {graphs.length > 0 ? (
              <ul>
                {graphs.map((g) => (
                  <li key={g.id}>
                    {g.name}
                    <button
                      onClick={() => deleteGraph(g.id)}
                      disabled={loading}
                      className="btn btn-danger btn-sm"
                    >
                      Supprimer
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Aucun graphe disponible</p>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="editor-section"
        >
          <div className="section-header">
            <h3>Ajouter un Sommet</h3>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label>Nom du sommet</label>
              <input
                type="text"
                value={nodeName}
                onChange={(e) => setNodeName(e.target.value)}
                placeholder="Ex: A, B, C..."
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Type de sommet</label>
              <select value={nodeType} onChange={(e) => setNodeType(e.target.value)} className="form-select">
                <option value="normal">Normal</option>
                <option value="initial">Initial</option>
                <option value="final">Final</option>
              </select>
            </div>
            <div className="form-group">
              <button onClick={addNode} disabled={loading} className="btn btn-success full-width">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Ajouter Sommet
              </button>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="editor-section"
        >
          <div className="section-header">
            <h3>Ajouter un Arc</h3>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label>Source</label>
              <select value={source} onChange={(e) => setSource(e.target.value)} className="form-select">
                <option value="">Choisir</option>
                {nodes.map((n) => (
                  <option key={n.id} value={n.name}>
                    {n.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Cible</label>
              <select value={target} onChange={(e) => setTarget(e.target.value)} className="form-select">
                <option value="">Choisir</option>
                {nodes.map((n) => (
                  <option key={n.id} value={n.name}>
                    {n.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Poids</label>
              <input
                type="number"
                min="0"
                value={weight}
                onChange={(e) => {
                  const value = Math.abs(Number(e.target.value));
                  setWeight(value);
                }}
                placeholder="0"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <button onClick={addEdge} disabled={loading} className="btn btn-purple full-width">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 0 00-5.656 0l-4 4a4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 0 005.5 0l4-4a4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                Ajouter Arc
              </button>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="summary-section"
        >
          <div className="summary-grid">
            <div className="summary-card">
              <div className="summary-header">
                <h4>Sommets ({nodes.length})</h4>
              </div>
              <div className="summary-content">
                {nodes.length > 0 ? (
                  <div className="node-list">
                    {nodes.map((n) => (
                      <div key={n.id} className={`node-item ${n.type}`}>
                        {getNodeTypeIcon(n.type)}
                        <span className="node-name">{n.name}</span>
                        <span className="node-type">{n.type}</span>
                        <button
                          onClick={() => deleteNode(n.name)}
                          disabled={loading}
                          className="btn btn-danger btn-sm"
                        >
                          Supprimer
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="empty-state">Aucun sommet ajouté</p>
                )}
              </div>
            </div>

            <div className="summary-card">
              <div className="summary-header">
                <h4>Arcs ({edges.length})</h4>
              </div>
              <div className="summary-content">
                {edges.length > 0 ? (
                  <div className="edge-list">
                    {edges.map((e, index) => (
                      <div key={index} className="edge-item">
                        <span className="edge-source">{e.source}</span>
                        <svg className="edge-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                        <span className="edge-target">{e.target}</span>
                        <span className="edge-weight">({e.weight})</span>
                        <button
                          onClick={() => deleteEdge(e.source, e.target)}
                          disabled={loading}
                          className="btn btn-danger btn-sm"
                        >
                          Supprimer
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="empty-state">Aucun arc ajouté</p>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default GraphEditor;