import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, Plus, Trash2, RefreshCw } from 'lucide-react';
import axios from 'axios';
import '../styles/BackendGraphManager.css';

const BackendGraphManager = ({ isEditMode, onGraphSelected, selectedGraph }) => {
  const [graphs, setGraphs] = useState([]);
  const [newGraphName, setNewGraphName] = useState('');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ 
    show: false, 
    message: '', 
    type: 'success'
  });

  const loadGraphs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:8000/api/graphs/');
      setGraphs(response.data);
      showNotification('Liste des graphes chargée avec succès', 'success');
    } catch (error) {
      showNotification(`Erreur de chargement: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadGraphDetails = useCallback(async (graphId) => {
    if (!graphId) {
      onGraphSelected(null);
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:8000/api/graphs/${graphId}/`);
      onGraphSelected(response.data);
      showNotification(`Graphe '${response.data.name}' chargé avec succès`, 'success');
    } catch (error) {
      showNotification(`Erreur de chargement: ${error.message}`, 'error');
      onGraphSelected(null);
    } finally {
      setLoading(false);
    }
  }, [onGraphSelected]);

  const createGraph = async () => {
    if (!isEditMode) {
      showNotification('Mode lecture activé - Modification interdite', 'error');
      return;
    }
    
    if (!newGraphName.trim()) {
      showNotification('Veuillez entrer un nom pour le graphe', 'error');
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:8000/api/graphs/create/', { 
        name: newGraphName.trim() 
      });
      const newGraph = response.data;
      setGraphs(prev => [...prev, newGraph]);
      loadGraphDetails(newGraph.id);
      setNewGraphName('');
      showNotification(`Graphe '${newGraph.name}' créé avec succès`, 'success');
    } catch (error) {
      showNotification(`Erreur de création: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const deleteGraph = async (graphId) => {
    if (!isEditMode) {
      showNotification('Mode lecture activé - Modification interdite', 'error');
      return;
    }
    
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce graphe ?')) return;
    
    setLoading(true);
    try {
      await axios.delete(`http://localhost:8000/api/graphs/${graphId}/supprimer/`);
      setGraphs(prev => prev.filter(g => g.id !== graphId));
      if (selectedGraph?.id === graphId) {
        onGraphSelected(null);
      }
      showNotification('Graphe supprimé avec succès', 'success');
    } catch (error) {
      showNotification(`Erreur de suppression: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 4000);
  };

  useEffect(() => {
    loadGraphs();
  }, [loadGraphs]);

  return (
    <div className="backend-graph-manager">
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
              {notification.type === 'error' ? '❌' : '✅'}
            </div>
            <span>{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="manager-header">
        <div className="header-icon">
          <Database size={32} />
        </div>
        <div className="header-content">
          <h1>🗄️ Gestionnaire de Graphes Backend</h1>
          <p>{isEditMode ? 'Gérez vos graphes avec persistance en base de données' : 'Visualisation en mode lecture seule'}</p>
        </div>
      </div>

      <div className="manager-content">
        <div className="graph-controls">
          <div className="control-group">
            <label>Sélectionner un graphe existant</label>
            <div className="select-wrapper">
              <select 
                value={selectedGraph?.id || ''} 
                onChange={(e) => loadGraphDetails(e.target.value)}
                className="graph-select"
              >
                <option value="">-- Choisir un graphe --</option>
                {graphs.map(graph => (
                  <option key={graph.id} value={graph.id}>
                    {graph.name} ({graph.sommets?.length || 0} sommets, {graph.arcs?.length || 0} arcs)
                  </option>
                ))}
              </select>
              <button onClick={loadGraphs} disabled={loading} className="refresh-btn">
                <RefreshCw size={16} className={loading ? 'spinning' : ''} />
              </button>
            </div>
          </div>

          <div className="control-group">
            <label>Créer un nouveau graphe</label>
            <div className="input-group">
              <input
                type="text"
                value={newGraphName}
                onChange={(e) => setNewGraphName(e.target.value)}
                placeholder="Nom du nouveau graphe"
                className="graph-name-input"
                disabled={!isEditMode}
                onKeyPress={(e) => e.key === 'Enter' && createGraph()}
              />
              <button 
                onClick={createGraph} 
                disabled={loading || !isEditMode || !newGraphName.trim()}
                className="create-btn"
              >
                <Plus size={16} />
                Créer
              </button>
            </div>
          </div>
        </div>

        {graphs.length > 0 && (
          <div className="graphs-list">
            <h3>Graphes disponibles ({graphs.length})</h3>
            <div className="graphs-grid">
              {graphs.map(graph => (
                <motion.div
                  key={graph.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className={`graph-card ${selectedGraph?.id === graph.id ? 'selected' : ''}`}
                >
                  <div className="graph-info">
                    <h4>{graph.name}</h4>
                    <div className="graph-stats">
                      <span>📊 {graph.sommets?.length || 0} sommets</span>
                      <span>🔗 {graph.arcs?.length || 0} arcs</span>
                    </div>
                  </div>
                  <div className="graph-actions">
                    <button 
                      onClick={() => loadGraphDetails(graph.id)}
                      className="select-btn"
                      disabled={selectedGraph?.id === graph.id}
                    >
                      {selectedGraph?.id === graph.id ? 'Sélectionné' : 'Sélectionner'}
                    </button>
                    {isEditMode && (
                      <button 
                        onClick={() => deleteGraph(graph.id)}
                        className="delete-btn"
                        disabled={loading}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BackendGraphManager;