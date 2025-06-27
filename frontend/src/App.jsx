import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import Header from "./components/Header.jsx";
import GraphEditor from "./components/GraphEditor.jsx";
import MatrixInput from "./components/MatrixInput.jsx";
import GraphVisualizer from "./components/GraphVisualizer.jsx";
import ResultsDisplay from "./components/ResultsDisplay.jsx";
import "./styles.css";

function App() {
  const [mode, setMode] = useState("graph");
  const [theme, setTheme] = useState("light");
  const [visualizationData, setVisualizationData] = useState({
    nodes: [],
    edges: [],
    node_names: [],
    initial_matrix: []
  });
  const [calculationData, setCalculationData] = useState(null);
  const [results, setResults] = useState(null);
  const [method, setMethod] = useState("min");
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  useEffect(() => {
    setVisualizationData({ nodes: [], edges: [], node_names: [], initial_matrix: [] });
    setCalculationData(null);
    setResults(null);
  }, [mode]);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "light" ? "dark" : "light");
  }, [theme]);

  const handleGraphUpdate = useCallback((data) => {
    setVisualizationData({
      nodes: data.nodes || [],
      edges: data.edges || [],
      node_names: data.node_names || [],
      initial_matrix: data.initial_matrix || []
    });
    setCalculationData({ type: "graph", graphId: data.graphId });
  }, []);

  const handleMatrixUpdate = useCallback((data) => {
    if (data) {
      const { matrix, node_names } = data;
      const nodes = node_names.map((name, index) => ({ id: index, name, type: "normal" }));
      const edges = [];
      for (let i = 0; i < matrix.length; i++) {
        for (let j = 0; j < matrix[i].length; j++) {
          if (matrix[i][j] !== null && i !== j) {
            edges.push({ source: node_names[i], target: node_names[j], weight: matrix[i][j] });
          }
        }
      }
      setVisualizationData({ nodes, edges, node_names, initial_matrix: matrix });
      setCalculationData({ type: "matrix", matrix, node_names });
    } else {
      setVisualizationData({ nodes: [], edges: [], node_names: [], initial_matrix: [] });
      setCalculationData(null);
    }
  }, []);

  const handleCalculate = async () => {
    if (!calculationData) return;
    setIsCalculating(true);
    try {
      let response;
      if (calculationData.type === "graph" && calculationData.graphId) {
        response = await axios.get(`http://localhost:8000/api/graphs/${calculationData.graphId}/run_demoucron/?mode=${method}`);
      } else if (calculationData.type === "matrix" && calculationData.matrix) {
        response = await axios.post("http://localhost:8000/api/matrix_demoucron/", {
          matrix: calculationData.matrix,
          node_names: calculationData.node_names,
          method: method
        });
      }
      setResults(response.data);
    } catch (error) {
      console.error("Calculation error:", error);
      setResults({ error: "Erreur lors du calcul" });
    } finally {
      setIsCalculating(false);
    }
  };

  const canCalculate = calculationData && (calculationData.type === "graph" ? calculationData.graphId : calculationData.matrix && calculationData.matrix.length > 0);

  return (
    <div className="app-container">
      <Header theme={theme} toggleTheme={toggleTheme} />
      
      <main className="main-content">
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="hero-section"
        >
          <div className="hero-background">
            <div className="hero-gradient"></div>
            <div className="hero-pattern"></div>
          </div>
          <div className="hero-content">
            <motion.h1 
              className="hero-title"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Algorithme de Demoucron
            </motion.h1>
            <motion.p 
              className="hero-description"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Découvrez les chemins optimaux avec une interface moderne et intuitive. 
              Créez votre graphe ou saisissez une matrice pour commencer l'analyse.
            </motion.p>
            <motion.div
              className="hero-stats"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <div className="stat-item">
                <div className="stat-number">∞</div>
                <div className="stat-label">Possibilités</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">O(n³)</div>
                <div className="stat-label">Complexité</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">2</div>
                <div className="stat-label">Modes</div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mode-selector-container"
        >
          <div className="mode-selector">
            <motion.button
              onClick={() => setMode("graph")}
              className={`mode-btn ${mode === "graph" ? "active" : ""}`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <svg className="mode-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a1 1 0 01-1-1V9a1 1 0 011-1h1a2 2 0 100-4H4a1 1 0 01-1-1V4a1 1 0 011-1h3a1 1 0 001-1v-1a2 2 0 114 0z" />
              </svg>
              <span>Éditeur de Graphe</span>
              <div className="mode-badge">Interactif</div>
            </motion.button>
            <motion.button
              onClick={() => setMode("matrix")}
              className={`mode-btn ${mode === "matrix" ? "active" : ""}`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <svg className="mode-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span>Entrée Matricielle</span>
              <div className="mode-badge">Précis</div>
            </motion.button>
          </div>
        </motion.div>

        <div className="workspace-grid">
          <AnimatePresence mode="wait">
            {mode === "graph" && (
              <motion.div
                key="graph-editor"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.5 }}
                className="workspace-panel"
              >
                <GraphEditor onUpdate={handleGraphUpdate} theme={theme} />
              </motion.div>
            )}
            {mode === "matrix" && (
              <motion.div
                key="matrix-input"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.5 }}
                className="workspace-panel"
              >
                <MatrixInput onMatrixUpdate={handleMatrixUpdate} theme={theme} />
              </motion.div>
            )}
          </AnimatePresence>
          
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="workspace-panel"
          >
            <GraphVisualizer
              nodes={visualizationData.nodes}
              edges={visualizationData.edges}
              theme={theme}
              nodeNames={visualizationData.node_names}
              initialMatrix={visualizationData.initial_matrix}
            />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="calculation-panel"
        >
          <div className="calculation-header">
            <div className="calculation-title">
              <svg className="calculation-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <div>
                <h3>Configuration du Calcul</h3>
                <p>Choisissez votre méthode d'optimisation</p>
              </div>
            </div>
          </div>
          
          <div className="method-selection">
            <div className="method-options">
              <motion.label
                className={`method-option ${method === "min" ? "selected" : ""}`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <input
                  type="radio"
                  value="min"
                  checked={method === "min"}
                  onChange={() => setMethod("min")}
                  className="method-radio"
                />
                <div className="method-content">
                  <div className="method-icon min">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </div>
                  <div className="method-info">
                    <span className="method-name">Minimisation</span>
                    <span className="method-desc">Trouve le chemin le plus court</span>
                  </div>
                </div>
                <div className="method-indicator"></div>
              </motion.label>
              
              <motion.label
                className={`method-option ${method === "max" ? "selected" : ""}`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <input
                  type="radio"
                  value="max"
                  checked={method === "max"}
                  onChange={() => setMethod("max")}
                  className="method-radio"
                />
                <div className="method-content">
                  <div className="method-icon max">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                  </div>
                  <div className="method-info">
                    <span className="method-name">Maximisation</span>
                    <span className="method-desc">Trouve le chemin le plus long</span>
                  </div>
                </div>
                <div className="method-indicator"></div>
              </motion.label>
            </div>
            
            <motion.button
              onClick={handleCalculate}
              disabled={!canCalculate || isCalculating}
              whileHover={{ scale: canCalculate && !isCalculating ? 1.02 : 1 }}
              whileTap={{ scale: canCalculate && !isCalculating ? 0.98 : 1 }}
              className="calculate-btn"
            >
              <AnimatePresence mode="wait">
                {isCalculating ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="btn-content"
                  >
                    <div className="loading-spinner"></div>
                    <span>Calcul en cours...</span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="calculate"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="btn-content"
                  >
                    <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>Calculer les Chemins Optimaux</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </motion.div>

        <AnimatePresence>
          {results && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              transition={{ duration: 0.6 }}
              className="results-container"
            >
              <ResultsDisplay
                results={results}
                theme={theme}
                nodes={visualizationData.nodes}
                edges={visualizationData.edges}
                nodeNames={visualizationData.node_names}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default App;
