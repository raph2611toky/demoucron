"use client"

import { useEffect } from "react"
import ReactFlow, { Controls, Background, useNodesState, useEdgesState, getBezierPath } from "reactflow"
import "reactflow/dist/style.css"
import { motion } from "framer-motion"
import "./GraphVisualizer.css"

// Composant d'arête personnalisé avec courbe organique
const CustomEdge = ({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style = {}, markerEnd, label }) => {
  // Calculer des points de contrôle pour une courbe plus organique
  const controlPointOffset = Math.random() * 100 + 50 // Variation aléatoire
  const curvature = 0.3 + Math.random() * 0.4 // Courbure variable
  
  // Ajouter de la variation pour éviter les superpositions
  const randomOffset = (Math.random() - 0.5) * 80
  const midX = (sourceX + targetX) / 2 + randomOffset
  const midY = (sourceY + targetY) / 2 + randomOffset
  
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
          filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
        }}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
      />
      {label && (
        <text>
          <textPath href={`#${id}`} style={{ fontSize: 12, fill: style.stroke }} startOffset="50%" textAnchor="middle">
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

function GraphVisualizer({ nodes: inputNodes, edges: inputEdges, theme, nodeNames, initialMatrix }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  // Générer le graphe à partir des données d'entrée
  useEffect(() => {
    if (initialMatrix && initialMatrix.length > 0 && nodeNames && nodeNames.length > 0) {
      // Générer à partir de la matrice
      const newNodes = []
      const newEdges = []
      const nbrMatrice = initialMatrix.length

      // Créer tous les nœuds avec positionnement en cercle
      const centerX = 300
      const centerY = 250
      const radius = Math.min(150, 50 + nbrMatrice * 20)

      for (let i = 0; i < nbrMatrice; i++) {
        const angle = (2 * Math.PI * i) / nbrMatrice
        const x = centerX + radius * Math.cos(angle)
        const y = centerY + radius * Math.sin(angle)

        newNodes.push({
          id: `node-${i}`,
          data: { label: nodeNames[i] || `${i + 1}` },
          position: { x, y },
          draggable: true,
          style: {
            background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
            color: "white",
            borderRadius: "50%",
            width: "45px",
            height: "45px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "bold",
            fontSize: "14px",
            boxShadow: "0 6px 20px rgba(59, 130, 246, 0.3)",
            border: "2px solid #ffffff",
          },
        })
      }

      // Créer toutes les arêtes à partir de la matrice avec courbes organiques
      for (let i = 0; i < nbrMatrice; i++) {
        for (let j = 0; j < nbrMatrice; j++) {
          const weight = initialMatrix[i]?.[j]
          if (weight !== null && weight !== Number.POSITIVE_INFINITY && i !== j && !isNaN(weight)) {
            newEdges.push({
              id: `edge-${i}-${j}`,
              source: `node-${i}`,
              target: `node-${j}`,
              label: weight.toString(),
              type: "custom",
              style: {
                stroke: "#3b82f6",
                strokeWidth: 2.5,
                strokeDasharray: "none",
              },
              markerEnd: {
                type: "arrowclosed",
                color: "#3b82f6",
                width: 20,
                height: 20,
              },
            })
          }
        }
      }

      setNodes(newNodes)
      setEdges(newEdges)
    } else if (inputNodes && inputNodes.length > 0) {
      // Générer à partir des nœuds et arêtes d'entrée
      const centerX = 300
      const centerY = 250
      const radius = Math.min(150, 50 + inputNodes.length * 20)

      const newNodes = inputNodes.map((n, index) => {
        const angle = (2 * Math.PI * index) / inputNodes.length
        const x = centerX + radius * Math.cos(angle)
        const y = centerY + radius * Math.sin(angle)

        return {
          id: `node-${index}`,
          data: { label: n.name || `${index + 1}` },
          position: { x, y },
          draggable: true,
          style: {
            background:
              n.type === "initial"
                ? "linear-gradient(135deg, #10b981, #059669)"
                : n.type === "final"
                  ? "linear-gradient(135deg, #ef4444, #dc2626)"
                  : "linear-gradient(135deg, #3b82f6, #06b6d4)",
            color: "white",
            borderRadius: "50%",
            width: "45px",
            height: "45px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "bold",
            fontSize: "14px",
            boxShadow: "0 6px 20px rgba(59, 130, 246, 0.3)",
            border: "2px solid #ffffff",
          },
        }
      })

      const newEdges = inputEdges
        ? inputEdges
            .map((e, index) => {
              const sourceIndex = inputNodes.findIndex((n) => n.name === e.source)
              const targetIndex = inputNodes.findIndex((n) => n.name === e.target)

              if (sourceIndex !== -1 && targetIndex !== -1) {
                return {
                  id: `edge-${index}`,
                  source: `node-${sourceIndex}`,
                  target: `node-${targetIndex}`,
                  label: e.weight.toString(),
                  type: "custom",
                  style: {
                    stroke: "#3b82f6",
                    strokeWidth: 2.5,
                  },
                  markerEnd: {
                    type: "arrowclosed",
                    color: "#3b82f6",
                    width: 20,
                    height: 20,
                  },
                }
              }
              return null
            })
            .filter(Boolean)
        : []

      setNodes(newNodes)
      setEdges(newEdges)
    } else {
      setNodes([])
      setEdges([])
    }
  }, [inputNodes, inputEdges, initialMatrix, nodeNames, theme, setNodes, setEdges])

  const renderInitialMatrix = () => {
    if (!initialMatrix || initialMatrix.length === 0 || !nodeNames || nodeNames.length === 0) return null

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="matrix-display"
      >
        <div className="matrix-header">
          <h3>Matrice Initiale (D₁)</h3>
          <p>Représentation matricielle du graphe</p>
        </div>
        <div className="matrix-table-container">
          <table className="display-matrix">
            <thead>
              <tr>
                <th className="matrix-corner"></th>
                {nodeNames.map((name, index) => (
                  <th key={index} className="matrix-col-header">
                    {name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {initialMatrix.map((row, i) => (
                <tr key={i}>
                  <td className="matrix-row-header">{nodeNames[i]}</td>
                  {row.map((value, j) => (
                    <td key={j} className={`matrix-value ${i === j ? "diagonal" : ""}`}>
                      {value === null || value === Number.POSITIVE_INFINITY ? (
                        <span className="infinity">∞</span>
                      ) : (
                        value
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    )
  }

  return (
    <div className={`graph-visualizer ${theme === "dark" ? "dark" : ""}`}>
      <div className="panel-header">
        <div className="panel-icon">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
        </div>
        <div className="panel-title">
          <h2>Visualisation Interactive</h2>
          <p>Représentation graphique de votre réseau</p>
        </div>
      </div>

      {nodes.length === 0 && edges.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="empty-visualization">
          <div className="empty-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>
          <h3>Aucun graphe à visualiser</h3>
          <p>Créez ou sélectionnez un graphe pour voir sa représentation</p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="visualization-content"
        >
          <div className="react-flow-container">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              edgeTypes={edgeTypes}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              fitView
              fitViewOptions={{ padding: 0.3 }}
              nodesDraggable={true}
              className="react-flow-custom"
            >
              <Background color={theme === "dark" ? "#334155" : "#e2e8f0"} gap={20} size={1} variant="dots" />
              <Controls className="react-flow-controls" />
            </ReactFlow>
          </div>

          {renderInitialMatrix()}
        </motion.div>
      )}
    </div>
  )
}

export default GraphVisualizer
