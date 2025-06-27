import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import WijGraph from "./WijGraph";

function MatrixDisplay({ matrix, nodeNames, title }) {
  if (!matrix || !nodeNames) {
    return <p className="empty-state">Matrice non disponible</p>;
  }
  
  return (
    <div className="matrix-display-container">
      {title && <h4 className="matrix-title">{title}</h4>}
      <div className="matrix-table-wrapper">
        <table className="result-matrix">
          <thead>
            <tr>
              <th className="matrix-corner"></th>
              {nodeNames.map((name, index) => (
                <th key={index} className="matrix-header">{name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, i) => (
              <tr key={i}>
                <td className="matrix-row-header">{nodeNames[i]}</td>
                {row.map((value, j) => (
                  <td key={j} className={`matrix-cell ${i === j ? 'diagonal' : ''}`}>
                    {value === null ? <span className="infinity">∞</span> : value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CalculationsDisplay({ calculations, methode }) {
  if (!calculations || calculations.length === 0) {
    return <p className="empty-state">Aucun calcul disponible</p>;
  }
  
  return (
    <div className="calculations-grid">
      <div className="calculation-section">
        <h4 className="calculation-title">Calculs W (Chemins intermédiaires)</h4>
        <div className="calculation-list">
          {calculations.map((calc, index) => (
            <div key={index} className="calculation-item">
              <div className="calculation-formula">
                W<sub>{calc.i}{calc.j}</sub><sup>{calc.k - 1}</sup> = 
                V<sub>{calc.i}{calc.k}</sub> + V<sub>{calc.k}{calc.j}</sub>
              </div>
              <div className="calculation-values">
                = {calc.V_ik ?? "∞"} + {calc.V_kj ?? "∞"} = {calc.W_ij ?? "∞"}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="calculation-section">
        <h4 className="calculation-title">Calculs V (Optimisation)</h4>
        <div className="calculation-list">
          {calculations.map((calc, index) => (
            <div key={index} className="calculation-item">
              <div className="calculation-formula">
                V<sub>{calc.i}{calc.j}</sub><sup>{calc.k}</sup> = 
                {methode === "min" ? "min" : "max"}(W<sub>{calc.i}{calc.j}</sub><sup>{calc.k - 1}</sup>, V<sub>{calc.i}{calc.j}</sub><sup>{calc.k - 1}</sup>)
              </div>
              <div className="calculation-values">
                = {methode === "min" ? "min" : "max"}({calc.W_ij ?? "∞"}, {calc.V_ij_prev ?? "∞"}) = {calc.new_V_ij ?? "∞"}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ResultsDisplay({ results, theme, nodes, nodeNames }) {
  const [expandedSteps, setExpandedSteps] = useState({});
  const [activeTab, setActiveTab] = useState("steps");

  if (!results || results.error || !results.steps) {
    const error = results?.error || "Aucun résultat disponible";
    return (
      <div className="results-error">
        <div className="error-icon">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3>Erreur de calcul</h3>
        <p>{error}</p>
      </div>
    );
  }

  const { steps, paths, methode } = results;
  const initialNode = nodes.find((n) => n.type === "initial");
  const finalNode = nodes.find((n) => n.type === "final");
  const optimalPathKey = initialNode && finalNode ? `${initialNode.name}-${finalNode.name}` : null;
  const optimalPath = optimalPathKey ? paths[optimalPathKey] : null;

  const toggleStep = (index) => {
    setExpandedSteps((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <div className="results-display">
      <div className="results-header">
        <div className="results-icon">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <div className="results-title">
          <h2>Résultats de l'Algorithme</h2>
          <p>Analyse complète des chemins optimaux avec la méthode de {methode === "min" ? "minimisation" : "maximisation"}</p>
        </div>
      </div>

      <div className="results-tabs">
        <button 
          onClick={() => setActiveTab("steps")} 
          className={`tab-btn ${activeTab === "steps" ? "active" : ""}`}
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          Étapes de Calcul
        </button>
        <button 
          onClick={() => setActiveTab("final")} 
          className={`tab-btn ${activeTab === "final" ? "active" : ""}`}
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Résultat Final
        </button>
        <button 
          onClick={() => setActiveTab("paths")} 
          className={`tab-btn ${activeTab === "paths" ? "active" : ""}`}
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 0 00-5.656 0l-4 4a4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 0 005.5 0l4-4a4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          Chemins Optimaux
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "steps" && (
          <motion.div
            key="steps"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="tab-content"
          >
            <div className="steps-container">
              {steps.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="step-card"
                >
                  <button 
                    onClick={() => toggleStep(index)} 
                    className="step-header"
                  >
                    <div className="step-info">
                      <div className="step-number">{step.step}</div>
                      <div className="step-details">
                        <h4>Étape {step.step}</h4>
                        <p>{step.intermediate_node ? `Nœud intermédiaire k = ${step.intermediate_node}` : "Matrice initiale"}</p>
                      </div>
                    </div>
                    <div className={`step-toggle ${expandedSteps[index] ? "expanded" : ""}`}>
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>
                  
                  <AnimatePresence>
                    {expandedSteps[index] && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="step-content"
                      >
                        <div className="step-grid">
                          <div className="step-matrix">
                            <MatrixDisplay 
                              matrix={step.matrix} 
                              nodeNames={nodeNames} 
                              title={`Matrice D${step.step}`}
                            />
                          </div>
                          <div className="step-graph">
                            <h5>Graphe W{step.intermediate_node}</h5>
                            <WijGraph
                              W={step.calculations || []}
                              k={step.intermediate_node}
                              currentMatrix={step.matrix}
                              stepIndex={index}
                              nodes={nodes}
                              nodeNames={nodeNames}
                            />
                          </div>
                        </div>
                        <CalculationsDisplay calculations={step.calculations} methode={methode} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === "final" && (
          <motion.div
            key="final"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="tab-content"
          >
            <div className="final-result">
              <div className="final-header">
                <h3>Matrice Finale</h3>
                <p>Résultat après application complète de l'algorithme de Demoucron</p>
              </div>
              <MatrixDisplay 
                matrix={steps[steps.length - 1]?.matrix} 
                nodeNames={nodeNames} 
              />
            </div>
          </motion.div>
        )}

        {activeTab === "paths" && (
          <motion.div
            key="paths"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="tab-content"
          >
            <div className="paths-result">
              <div className="paths-header">
                <h3>Chemins Optimaux</h3>
                <p>Meilleurs chemins trouvés selon la méthode de {methode === "min" ? "minimisation" : "maximisation"}</p>
              </div>
              {optimalPath ? (
                <div className="optimal-path">
                  <div className="path-card">
                    <div className="path-info">
                      <div className="path-nodes">
                        <span className="path-start">{initialNode.name}</span>
                        <svg className="path-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                        <span className="path-end">{finalNode.name}</span>
                      </div>
                      <div className="path-sequence">
                        {optimalPath.map((node, index) => (
                          <React.Fragment key={index}>
                            <span className="path-node">{node}</span>
                            {index < optimalPath.length - 1 && (
                              <svg className="path-connector" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="no-path">
                  <div className="no-path-icon">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <h4>Aucun chemin optimal trouvé</h4>
                  <p>Vérifiez que vous avez défini des sommets initial et final</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ResultsDisplay;
