"use client"

import React, { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import WijGraph from "./WijGraph.jsx"
import GraphCanvas from "./GraphCanvas.jsx"
import { useGraphStore } from "../store/graphStore"
import { Play, Square, Route } from "lucide-react"
import "../styles/ResultsDisplay.css"

function MatrixDisplay({ matrix, nodeNames, title, optimalPaths = {} }) {
  if (!matrix || !nodeNames) {
    return <p className="empty-state">Matrice non disponible</p>
  }

  const cellColors = {}
  const colors = ["#f97316", "#10b981", "#8b5cf6", "#ef4444", "#3b82f6", "#eab308", "#14b8a6", "#ec4899"]
  let colorIndex = 0

  Object.entries(optimalPaths || {}).forEach(([_, paths]) => {
    paths.forEach((path) => {
      if (path && path.length > 1) {
        const pathColor = colors[colorIndex % colors.length]
        colorIndex++
        for (let k = 0; k < path.length - 1; k++) {
          const i = path[k] - 1
          const j = path[k + 1] - 1
          if (i >= 0 && j >= 0 && i < matrix.length && j < matrix.length) {
            cellColors[`${i}-${j}`] = pathColor
          }
        }
      }
    })
  })

  return (
    <div className="matrix-display-container">
      {title && <h4 className="matrix-title">{title}</h4>}
      <div className="matrix-table-wrapper">
        <table className="result-matrix">
          <thead>
            {/* <tr>
              <th className="matrix-corner"></th>
              {nodeNames.map((name, index) => (
                <th key={index} className="matrix-header">
                  {name}
                </th>
              ))}
            </tr> */}
          </thead>
          <tbody>
            {matrix.map((row, i) => (
              <tr key={i}>
                <td className="matrix-row-header">{nodeNames[i]}</td>
                {row.map((value, j) => {
                  const cellKey = `${i}-${j}`
                  const cellColor = cellColors[cellKey]
                  return (
                    <td
                      key={j}
                      className={`matrix-cell ${i === j ? "diagonal" : ""} ${cellColor ? "path-cell" : ""}`}
                      style={cellColor ? { backgroundColor: cellColor, color: "white" } : {}}
                    >
                      {value === Number.POSITIVE_INFINITY ? <span className="infinity">∞</span> : value}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function CalculationsDisplay({ calculations, type, method }) {
  if (!calculations || calculations.length === 0) {
    return <p className="empty-state">Aucun calcul disponible</p>
  }

  return (
    <div className="calculation-section">
      <h4 className="calculation-title">
        Calculs {type} ({method === "min" ? "Minimisation" : "Maximisation"})
      </h4>
      <div className="calculation-list">
        {calculations.map((calc, index) => (
          <div key={index} className="calculation-item">
            <div className="calculation-formula" dangerouslySetInnerHTML={{ __html: calc.formula }} />
          </div>
        ))}
      </div>
    </div>
  )
}

function OptimalPathGraph({ optimalPaths, nodeNames, finalMatrix }) {
  const {
    nodes,
    edges,
    setCurrentPath,
    isSimulating,
    startSimulation,
    stopSimulation,
    setSimulationSteps,
    simulationSteps,
    currentStepIndex,
    packetPosition,
    nextSimulationStep,
  } = useGraphStore()

  const [highlightedPaths, setHighlightedPaths] = useState([])
  const [pathColors, setPathColors] = useState({ nodes: {}, edges: {} })
  const [selectedPathForSimulation, setSelectedPathForSimulation] = useState(null)

  // Convertir les chemins optimaux en format utilisable pour la simulation
  const availablePaths = useMemo(() => {
    const paths = []
    Object.entries(optimalPaths || {}).forEach(([key, pathList]) => {
      pathList.forEach((path, index) => {
        if (path && Array.isArray(path) && path.length > 1) {
          // Convertir les indices de nœuds en IDs de nœuds
          const nodeIds = path
            .map((nodeIndex) => {
              const nodeName = nodeNames[nodeIndex - 1]
              const node = nodes.find((n) => n.value === nodeName)
              return node ? node.id : null
            })
            .filter((id) => id !== null)

          if (nodeIds.length === path.length) {
            paths.push({
              id: `${key}-${index}`,
              name: `${key.replace("-", " → ")} (${index + 1})`,
              nodeIds: nodeIds,
              nodeNames: path.map((nodeIndex) => nodeNames[nodeIndex - 1]),
              path: path.map((nodeIndex) => nodeNames[nodeIndex - 1]).join(" → "),
            })
          }
        }
      })
    })
    return paths
  }, [optimalPaths, nodeNames, nodes])

  // Gestion de la simulation automatique
  React.useEffect(() => {
    let interval
    if (isSimulating && simulationSteps.length > 0) {
      interval = setInterval(() => {
        const result = nextSimulationStep()
        if (!result.hasNext) {
          clearInterval(interval)
        }
      }, 800) // Vitesse de simulation
    }
    return () => clearInterval(interval)
  }, [isSimulating, nextSimulationStep, simulationSteps.length])

  React.useEffect(() => {
    const colors = ["#f97316", "#10b981", "#8b5cf6", "#ef4444", "#3b82f6", "#eab308", "#14b8a6", "#ec4899"]
    const pathsToHighlight = []
    const allHighlightedEdges = []
    const nodesToHighlight = {}
    const edgesToHighlight = {}
    let colorIndex = 0

    Object.entries(optimalPaths || {}).forEach(([key, paths]) => {
      paths.forEach((path, pathIndex) => {
        if (path && Array.isArray(path) && path.length > 1) {
          const pathColor = colors[colorIndex % colors.length]
          colorIndex++
          const pathEdges = []

          for (let k = 0; k < path.length - 1; k++) {
            const sourceNodeIndex = path[k] - 1
            const targetNodeIndex = path[k + 1] - 1
            const sourceNode = nodes.find((n) => nodeNames[sourceNodeIndex] === n.value)
            const targetNode = nodes.find((n) => nodeNames[targetNodeIndex] === n.value)

            if (sourceNode && targetNode) {
              const edge = edges.find((e) => e.fromNodeId === sourceNode.id && e.toNodeId === targetNode.id)
              if (edge) {
                pathEdges.push(edge.id)
                allHighlightedEdges.push(edge.id)
                edgesToHighlight[edge.id] = pathColor
              }
              nodesToHighlight[sourceNode.id] = pathColor
              nodesToHighlight[targetNode.id] = pathColor
            }
          }

          pathsToHighlight.push({
            key: `${key}-${pathIndex}`,
            edges: pathEdges,
            color: pathColor,
            path: path.map((node) => nodeNames[node - 1]).join(" → "),
          })
        }
      })
    })

    setHighlightedPaths(pathsToHighlight)
    setPathColors({ nodes: nodesToHighlight, edges: edgesToHighlight })
    setCurrentPath(allHighlightedEdges)

    return () => {
      setHighlightedPaths([])
      setPathColors({ nodes: {}, edges: {} })
      setCurrentPath([])
    }
  }, [optimalPaths, nodeNames, nodes, edges, setCurrentPath])

  const handleStartSimulation = (pathData) => {
    if (!pathData || !pathData.nodeIds || pathData.nodeIds.length === 0) {
      alert("Chemin invalide pour la simulation")
      return
    }

    // Créer les étapes de simulation basées sur le chemin optimal
    const steps = pathData.nodeIds.map((nodeId, index) => {
      const node = nodes.find((n) => n.id === nodeId)
      return {
        id: `step-${index}`,
        nodeId: nodeId,
        value: node ? node.value : `Node ${index + 1}`,
        duration: 800, // Durée en ms pour chaque étape
      }
    })

    setSimulationSteps(steps)
    setSelectedPathForSimulation(pathData)
    startSimulation()
  }

  const handleStopSimulation = () => {
    stopSimulation()
    setSelectedPathForSimulation(null)
  }

  if (!nodes || nodes.length === 0) {
    return (
      <div className="no-path">
        <div className="no-path-icon">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <h4>Aucun graphe disponible</h4>
        <p>Veuillez d'abord créer un graphe dans l'éditeur</p>
      </div>
    )
  }

  return (
    <div className="optimal-path-graph">
      {/* Contrôles de simulation */}
      <div className="simulation-controls-section">
        <h4>🎮 Simulation des Chemins Optimaux</h4>
        <div className="simulation-path-selector">
          {availablePaths.map((pathData) => (
            <div key={pathData.id} className="path-simulation-item">
              <div className="path-info">
                <span className="path-name">{pathData.name}</span>
                <span className="path-route">{pathData.path}</span>
              </div>
              <div className="path-controls">
                {!isSimulating ? (
                  <button
                    onClick={() => handleStartSimulation(pathData)}
                    className="simulate-path-btn"
                    title="Simuler ce chemin"
                  >
                    <Play className="w-4 h-4" />
                    Simuler
                  </button>
                ) : selectedPathForSimulation?.id === pathData.id ? (
                  <button onClick={handleStopSimulation} className="stop-simulation-btn" title="Arrêter la simulation">
                    <Square className="w-4 h-4" />
                    Arrêter
                  </button>
                ) : (
                  <button disabled className="simulate-path-btn disabled">
                    <Play className="w-4 h-4" />
                    Simuler
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {isSimulating && selectedPathForSimulation && (
          <div className="simulation-status">
            <div className="status-info">
              <Route className="w-5 h-5" />
              <span>Simulation en cours: {selectedPathForSimulation.name}</span>
            </div>
            <div className="simulation-progress">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${((currentStepIndex + 1) / simulationSteps.length) * 100}%`,
                  }}
                />
              </div>
              <span className="progress-text">
                Étape {currentStepIndex + 1} / {simulationSteps.length}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="graph-container" style={{ height: "500px" }}>
        <div className="read-mode-notice">
          <span>📖 Graphe en mode lecture - Chemins optimaux mis en évidence</span>
        </div>
        {highlightedPaths.length > 0 && (
          <div className="path-legend">
            <h5>Chemins optimaux trouvés :</h5>
            {highlightedPaths.map((pathInfo) => (
              <div key={pathInfo.key} className="legend-item" style={{ color: pathInfo.color }}>
                <div className="legend-color" style={{ backgroundColor: pathInfo.color }}></div>
                <span>{pathInfo.path}</span>
              </div>
            ))}
          </div>
        )}
        <div style={{ height: "100%", width: "100%" }}>
          <GraphCanvas isReadOnly={true} pathColors={pathColors} />
        </div>
      </div>
    </div>
  )
}

function ResultsDisplay({ results }) {
  const [expandedSteps, setExpandedSteps] = useState({})
  const [activeTab, setActiveTab] = useState("steps")
  const { nodes } = useGraphStore()

  if (!results || results.error) {
    const error = results?.error || "Aucun résultat disponible"
    return (
      <div className="results-error">
        <div className="error-icon">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3>Erreur de calcul</h3>
        <p>{error}</p>
        {results?.graphInfo && (
          <div className="error-details">
            <p>Graphe: {results.graphInfo.name}</p>
            <p>
              Sommets: {results.graphInfo.nodes}, Arcs: {results.graphInfo.edges}
            </p>
          </div>
        )}
      </div>
    )
  }

  const { steps, finalMatrix, optimalPaths, method, nodeNames } = results

  const toggleStep = (index) => {
    setExpandedSteps((prev) => ({ ...prev, [index]: !prev[index] }))
  }

  const totalPaths = Object.values(optimalPaths || {}).reduce((acc, paths) => acc + paths.length, 0)

  return (
    <div className="results-display">
      <div className="results-header">
        <div className="results-icon">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        </div>
        <div className="results-title">
          <h2>Résultats de l'Algorithme de Demoucron</h2>
          <p>
            Analyse complète des chemins optimaux avec la méthode de{" "}
            {method === "min" ? "minimisation" : "maximisation"}
          </p>
        </div>
      </div>

      <div className="results-tabs">
        <button onClick={() => setActiveTab("steps")} className={`tab-btn ${activeTab === "steps" ? "active" : ""}`}>
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          Étapes de Calcul
        </button>
        <button onClick={() => setActiveTab("final")} className={`tab-btn ${activeTab === "final" ? "active" : ""}`}>
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Résultat Final
        </button>
        <button onClick={() => setActiveTab("paths")} className={`tab-btn ${activeTab === "paths" ? "active" : ""}`}>
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13.828 10.172a4 0 00-5.656 0l-4 4a4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 0 005.656 0l4-4a4 0 00-5.656-5.656l-1.1 1.1"
            />
          </svg>
          Chemins Optimaux & Simulation
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
              {steps &&
                steps.map((step, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="step-card"
                  >
                    <button onClick={() => toggleStep(index)} className="step-header">
                      <div className="step-info">
                        <div className="step-number">{step.k}</div>
                        <div className="step-details">
                          <h4>{step.description || `Étape ${step.k}`}</h4>
                          <p>
                            {step.k === 0
                              ? "Configuration initiale de la matrice"
                              : `Calculs avec le nœud intermédiaire ${step.k}`}
                          </p>
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
                              <MatrixDisplay matrix={step.matrix} nodeNames={nodeNames} title={`Matrice D${step.k}`} />
                            </div>
                            {step.k > 0 && (
                              <div className="step-graph">
                                <h5>Graphe W{step.k}</h5>
                                <WijGraph
                                  W={step.W || []}
                                  k={step.k}
                                  currentMatrix={step.matrix}
                                  stepIndex={index}
                                  nodeNames={nodeNames}
                                  nodes={nodes}
                                />
                              </div>
                            )}
                          </div>
                          {step.k > 0 && (
                            <div className="calculations-grid">
                              <CalculationsDisplay calculations={step.W} type="W" method={method} />
                              <CalculationsDisplay calculations={step.V} type="V" method={method} />
                            </div>
                          )}
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
              <MatrixDisplay matrix={finalMatrix} nodeNames={nodeNames} optimalPaths={optimalPaths} />
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
                <h3>Chemins Optimaux & Simulation</h3>
                <p>
                  Meilleurs chemins trouvés selon la méthode de {method === "min" ? "minimisation" : "maximisation"}
                </p>
                <p>Nombre total de chemins optimaux trouvés : {totalPaths}</p>
              </div>
              <OptimalPathGraph optimalPaths={optimalPaths} nodeNames={nodeNames} finalMatrix={finalMatrix} />
              <div className="paths-list">
                <h4>Liste des Chemins Optimaux</h4>
                {Object.entries(optimalPaths || {}).map(([key, paths]) => (
                  <div key={key}>
                    <p>
                      <strong>{key.replace("-", " → ")} :</strong>
                    </p>
                    <ul>
                      {paths.map((path, index) => (
                        <li key={index}>{path.map((node) => nodeNames[node - 1]).join(" → ")}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ResultsDisplay
