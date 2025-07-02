"use client"

import React, { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import WijGraph from "./WijGraph.jsx"
import ReactFlow, { Background, Controls, useNodesState, useEdgesState, getBezierPath } from "reactflow"
import "reactflow/dist/style.css"
import "./ResultsDisplay.css"

// Composant d'arête personnalisé avec courbe organique
const CustomEdge = ({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style = {}, markerEnd, label, animated }) => {
  // Calculer des points de contrôle pour une courbe plus organique
  const controlPointOffset = Math.random() * 100 + 50
  const curvature = 0.3 + Math.random() * 0.4
  
  // Ajouter de la variation pour éviter les superpositions
  const randomOffset = (Math.random() - 0.5) * 80
  
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature
  })

  return (
    <>
      <path
        id={id}
        style={{
          ...style,
          strokeLinecap: "round",
          strokeLinejoin: "round",
          filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
          strokeDasharray: animated ? "5,5" : "none",
          animation: animated ? "dash 1s linear infinite" : "none"
        }}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
      />
      {label && (
        <text>
          <textPath href={`#${id}`} style={{ fontSize: 12, fill: style.stroke, fontWeight: "bold" }} startOffset="50%" textAnchor="middle">
            {label}
          </textPath>
        </text>
      )}
    </>
  )
}

const edgeTypes = {
  custom: CustomEdge,
}

function MatrixDisplay({ matrix, nodeNames, title, optimalPaths = {} }) {
  if (!matrix || !nodeNames) {
    return <p className="empty-state">Matrice non disponible</p>
  }

  const isOptimalValue = Array(matrix.length)
    .fill()
    .map(() => Array(matrix.length).fill(false))
  Object.entries(optimalPaths).forEach(([_, path]) => {
    if (path && path.length > 1) {
      for (let k = 0; k < path.length - 1; k++) {
        const i = path[k] - 1
        const j = path[k + 1] - 1
        if (i >= 0 && j >= 0 && i < matrix.length && j < matrix.length) {
          isOptimalValue[i][j] = true
        }
      }
    }
  })

  return (
    <div className="matrix-display-container">
      {title && <h4 className="matrix-title">{title}</h4>}
      <div className="matrix-table-wrapper">
        <table className="result-matrix">
          <thead>
            <tr>
              <th className="matrix-corner"></th>
              {nodeNames.map((name, index) => (
                <th key={index} className="matrix-header">
                  {name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, i) => (
              <tr key={i}>
                <td className="matrix-row-header">{nodeNames[i]}</td>
                {row.map((value, j) => (
                  <td
                    key={j}
                    className={`matrix-cell ${i === j ? "diagonal" : ""} ${isOptimalValue[i][j] ? "optimal" : ""}`}
                  >
                    {value === Number.POSITIVE_INFINITY ? <span className="infinity">∞</span> : value}
                  </td>
                ))}
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

function OptimalPathGraph({ optimalPaths, nodes, nodeNames, finalMatrix, theme }) {
  const [graphNodes, setGraphNodes, onNodesChange] = useNodesState([])
  const [graphEdges, setGraphEdges, onEdgesChange] = useEdgesState([])

  const themeConfig = useMemo(
    () => ({
      light: {
        background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
        nodeNormal: "linear-gradient(135deg, #3b82f6, #2563eb)",
        edgeColor: "#475569",
        optimalEdgeColor: "#f97316",
        shadowNormal: "0 8px 25px rgba(59, 130, 246, 0.3)",
      },
      dark: {
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        nodeNormal: "linear-gradient(135deg, #3b82f6, #2563eb)",
        edgeColor: "#94a3b8",
        optimalEdgeColor: "#f97316",
        shadowNormal: "0 8px 25px rgba(59, 130, 246, 0.4)",
      },
    }),
    [],
  )

  const currentTheme = themeConfig[theme] || themeConfig.light

  React.useEffect(() => {
    if (!nodeNames || !finalMatrix) {
      setGraphNodes([])
      setGraphEdges([])
      return
    }

    const rfNodes = []
    const rfEdges = []

    // Positionnement en cercle comme WijGraph
    const centerX = 300
    const centerY = 250
    const radius = Math.min(150, 50 + nodeNames.length * 20)

    // Ajouter tous les nœuds du graphe
    nodeNames.forEach((name, index) => {
      const angle = (2 * Math.PI * index) / nodeNames.length
      const x = centerX + radius * Math.cos(angle)
      const y = centerY + radius * Math.sin(angle)

      rfNodes.push({
        id: `node-${index}`,
        data: { label: name },
        position: { x, y },
        style: {
          background: currentTheme.nodeNormal,
          color: "white",
          borderRadius: "50%",
          width: "45px",
          height: "45px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: "bold",
          fontSize: "14px",
          boxShadow: currentTheme.shadowNormal,
          border: "2px solid #ffffff",
        },
        draggable: true,
      })
    })

    // Ajouter toutes les arêtes du graphe depuis la matrice finale
    if (finalMatrix && Array.isArray(finalMatrix)) {
      finalMatrix.forEach((row, i) => {
        if (row && Array.isArray(row)) {
          row.forEach((value, j) => {
            if (value !== Number.POSITIVE_INFINITY && i !== j && value !== null && !isNaN(value)) {
              // Vérifier si cette arête fait partie d'un chemin optimal
              let isOptimal = false
              if (optimalPaths && typeof optimalPaths === "object") {
                Object.entries(optimalPaths).forEach(([key, path]) => {
                  if (path && Array.isArray(path) && path.length > 1) {
                    for (let k = 0; k < path.length - 1; k++) {
                      if (path[k] - 1 === i && path[k + 1] - 1 === j) {
                        isOptimal = true
                        break
                      }
                    }
                  }
                })
              }

              rfEdges.push({
                id: `edge-${i}-${j}`,
                source: `node-${i}`,
                target: `node-${j}`,
                label: `${value}`,
                type: "custom",
                style: {
                  stroke: isOptimal ? currentTheme.optimalEdgeColor : currentTheme.edgeColor,
                  strokeWidth: isOptimal ? 3.5 : 2.5,
                },
                markerEnd: {
                  type: "arrowclosed",
                  color: isOptimal ? currentTheme.optimalEdgeColor : currentTheme.edgeColor,
                },
                animated: isOptimal,
              })
            }
          })
        }
      })
    }

    setGraphNodes(rfNodes)
    setGraphEdges(rfEdges)
  }, [nodeNames, finalMatrix, optimalPaths, theme, currentTheme, setGraphNodes, setGraphEdges])

  return (
    <div className="optimal-path-graph">
      {graphNodes.length > 0 ? (
        <div className="react-flow-container" style={{ height: "400px", background: currentTheme.background }}>
          <ReactFlow
            nodes={graphNodes}
            edges={graphEdges}
            edgeTypes={edgeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            nodesDraggable={true}
            nodesConnectable={false}
            zoomOnScroll={true}
            panOnScroll={true}
            panOnDrag={true}
          >
            <Background color={theme === "light" ? "#e2e8f0" : "#334155"} gap={16} size={1} variant="dots" />
            <Controls />
          </ReactFlow>
        </div>
      ) : (
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
          <h4>Aucun chemin optimal trouvé</h4>
          <p>Vérifiez votre matrice d'entrée ou les données du graphe</p>
        </div>
      )}
    </div>
  )
}

// Le reste du composant ResultsDisplay reste identique...
function ResultsDisplay({ results, theme, nodes, nodeNames }) {
  const [expandedSteps, setExpandedSteps] = useState({})
  const [activeTab, setActiveTab] = useState("steps")

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
      </div>
    )
  }

  const { steps, finalMatrix, optimalPaths, method } = results

  const toggleStep = (index) => {
    setExpandedSteps((prev) => ({ ...prev, [index]: !prev[index] }))
  }

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
          <h2>Résultats de l'Algorithme</h2>
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
              d="M13.828 10.172a4 0 00-5.656 0l-4 4a4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 0 005.5 0l4-4a4 0 00-5.656-5.656l-1.1 1.1"
            />
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
                                  nodes={nodes}
                                  nodeNames={nodeNames}
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
                <h3>Chemins Optimaux</h3>
                <p>
                  Meilleurs chemins trouvés selon la méthode de {method === "min" ? "minimisation" : "maximisation"}
                </p>
              </div>
              <OptimalPathGraph
                optimalPaths={optimalPaths}
                nodes={nodes}
                nodeNames={nodeNames}
                finalMatrix={finalMatrix}
                theme={theme}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ResultsDisplay
