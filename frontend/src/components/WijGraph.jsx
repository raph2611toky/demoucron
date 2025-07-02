"use client"

import { useEffect, useState } from "react"
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Panel,
  BackgroundVariant,
  MarkerType,
  getBezierPath,
} from "reactflow"

// Composant d'arête personnalisé avec courbe organique
const CustomEdge = ({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style = {}, markerEnd, label, animated }) => {
  // Calculer des points de contrôle pour une courbe plus organique
  const curvature = 0.4 + Math.random() * 0.3
  
  // Ajouter de la variation pour éviter les superpositions
  const randomOffset = (Math.random() - 0.5) * 60
  
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

export default function WijGraph({ W, k, currentMatrix, stepIndex, nodePositions, setNodePositions }) {
  const [isAnimating, setIsAnimating] = useState(false)

  const generateWijGraph = (W, k, currentMatrix) => {
    const nodes = []
    const edges = []
    const uniqueNodes = new Set()
    const uniqueEdges = new Set()

    // Ajouter le sommet k
    const kNodeId = `node-${k - 1}`
    uniqueNodes.add(kNodeId)

    // Parcourir les calculs de W_ij pour ajouter les sommets et arêtes
    W.forEach(({ i, j }) => {
      // Ajouter les sommets i, k, et j
      uniqueNodes.add(`node-${i - 1}`)
      uniqueNodes.add(`node-${j - 1}`)

      // Ajouter les arêtes i -> k et k -> j
      const iIdx = i - 1
      const jIdx = j - 1
      const kIdx = k - 1

      // Arête i -> k
      const edgeIkId = `edge-${iIdx}-${kIdx}-${stepIndex}`
      if (!uniqueEdges.has(edgeIkId)) {
        uniqueEdges.add(edgeIkId)
        const weightIk = currentMatrix[iIdx][kIdx]
        if (weightIk !== Number.POSITIVE_INFINITY) {
          edges.push({
            id: edgeIkId,
            source: `node-${iIdx}`,
            target: `node-${kIdx}`,
            label: `${weightIk}`,
            type: "custom",
            animated: isAnimating,
            style: {
              stroke: "#3a7bd5",
              strokeWidth: 2.5,
            },
            markerEnd: MarkerType.ArrowClosed,
          })
        }
      }

      // Arête k -> j
      const edgeKjId = `edge-${kIdx}-${jIdx}-${stepIndex}`
      if (!uniqueEdges.has(edgeKjId)) {
        uniqueEdges.add(edgeKjId)
        const weightKj = currentMatrix[kIdx][jIdx]
        if (weightKj !== Number.POSITIVE_INFINITY) {
          edges.push({
            id: edgeKjId,
            source: `node-${kIdx}`,
            target: `node-${jIdx}`,
            label: `${weightKj}`,
            type: "custom",
            animated: isAnimating,
            style: {
              stroke: "#00d2ff",
              strokeWidth: 2.5,
            },
            markerEnd: MarkerType.ArrowClosed,
          })
        }
      }
    })

    // Générer les nœuds à partir des sommets uniques
    uniqueNodes.forEach((nodeId) => {
      const nodeIndex = Number.parseInt(nodeId.split("-")[1])
      // Positionnement en cercle pour éviter les superpositions
      const angle = (2 * Math.PI * nodeIndex) / Math.max(uniqueNodes.size, 3)
      const radius = 80
      const centerX = 150
      const centerY = 100
      
      const savedPosition = nodePositions[stepIndex]?.[nodeId] || {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      }

      // Appliquer un style différent pour le sommet k
      const isKNode = nodeId === kNodeId
      nodes.push({
        id: nodeId,
        data: {
          label: `${nodeIndex + 1}`,
          isKNode: isKNode,
        },
        position: savedPosition,
        draggable: true,
        style: isKNode
          ? {
              background: "linear-gradient(135deg, #FF4E50, #F9D423)",
              color: "white",
              border: "none",
              borderRadius: "50%",
              width: "40px",
              height: "40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "bold",
              fontSize: "16px",
              boxShadow: "0 4px 15px rgba(255, 78, 80, 0.5)",
              transition: "all 0.3s ease",
            }
          : {
              background: "linear-gradient(135deg, #3a7bd5, #00d2ff)",
              color: "white",
              border: "none",
              borderRadius: "50%",
              width: "40px",
              height: "40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "bold",
              fontSize: "16px",
              boxShadow: "0 4px 10px rgba(0, 0, 0, 0.2)",
              transition: "all 0.3s ease",
            },
      })
    })

    return { nodes, edges }
  }

  // Initialiser les nœuds et arêtes avec les données générées
  const { nodes: initialNodes, edges: initialEdges } = generateWijGraph(W, k, currentMatrix)
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  // Mettre à jour les nœuds et arêtes si W, k, ou currentMatrix change
  useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = generateWijGraph(W, k, currentMatrix)
    setNodes(newNodes)
    setEdges(newEdges)
  }, [W, k, currentMatrix, setNodes, setEdges, stepIndex, isAnimating])

  // Gestionnaire pour mettre à jour les positions des nœuds
  const handleNodesChange = (changes) => {
    onNodesChange(changes)
    setNodePositions((prevPositions) => {
      const newPositions = { ...prevPositions }
      if (!newPositions[stepIndex]) {
        newPositions[stepIndex] = {}
      }

      changes.forEach((change) => {
        if (change.type === "position" && "position" in change && change.position) {
          newPositions[stepIndex][change.id] = {
            x: change.position.x,
            y: change.position.y,
          }
        }
      })

      return newPositions
    })
  }

  return (
    <div
      className="relative w-full rounded-lg overflow-hidden border border-gray-200 shadow-lg mt-4"
      style={{ height: "300px" }}
    >
      {/* Overlay gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "linear-gradient(to bottom right, rgba(59, 130, 246, 0.05), rgba(34, 211, 238, 0.05))",
          zIndex: 0,
        }}
      ></div>

      {nodes.length > 0 ? (
        <ReactFlow
          nodes={nodes}
          edges={edges}
          edgeTypes={edgeTypes}
          onNodesChange={handleNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          nodesDraggable={true}
          elementsSelectable={true}
          className="w-full h-full"
        >
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} color="#3a7bd5" style={{ opacity: 0.2 }} />
          <Controls
            style={{
              boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
              borderRadius: "8px",
              backgroundColor: "white",
            }}
            showInteractive={false}
          />
          <Panel position="top-right">
            <button
              onClick={() => setIsAnimating(!isAnimating)}
              className="bg-white px-3 py-1 rounded-md text-xs font-medium shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              {isAnimating ? "Arrêter l'animation" : "Animer les arêtes"}
            </button>
          </Panel>
          <Panel position="bottom-center">
            <div
              className="font-poppins text-xs px-3 py-1 rounded-full shadow-sm border border-gray-200"
              style={{ background: "rgba(255, 255, 255, 0.8)", backdropFilter: "blur(4px)" }}
            >
              <span className="font-semibold">Étape k = {k}</span> • {nodes.length} sommets • {edges.length} arêtes
            </div>
          </Panel>
        </ReactFlow>
      ) : (
        <div className="flex items-center justify-center h-full">
          <div
            className="font-poppins text-center px-6 py-4 rounded-lg shadow-md"
            style={{ background: "rgba(255, 255, 255, 0.8)", backdropFilter: "blur(4px)" }}
          >
            <svg
              className="w-12 h-12 mx-auto text-gray-400 mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <p className="text-gray-600">Aucun chemin trouvé pour cette étape.</p>
          </div>
        </div>
      )}
    </div>
  )
}
