"use client"

import { useEffect, useState } from "react"
import ReactFlow, { Controls, Background, useNodesState, useEdgesState, Panel, BackgroundVariant } from "reactflow"

import CustomEdgeComponent from "./CustomEdge.jsx"
import WijGraphNode from "./WijGraphNode.jsx"

const edgeTypes = {
  custom: CustomEdgeComponent,
}

const nodeTypes = {
  custom: WijGraphNode,
}

export default function WijGraph({
  W = [],
  k,
  currentMatrix = [],
  stepIndex = 0,
  nodePositions = {},
  setNodePositions = () => {},
  nodeNames = [], // Ajouter nodeNames comme prop
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [isAnimating, setIsAnimating] = useState(false)

  // Vérification de sécurité pour éviter les erreurs
  const isEmpty = !W || !Array.isArray(W) || W.length === 0 || !currentMatrix || !Array.isArray(currentMatrix)

  useEffect(() => {
    if (isEmpty) {
      setNodes([])
      setEdges([])
      return
    }

    const { nodes: newNodes, edges: newEdges } = generateWijGraph(W, k, currentMatrix, nodeNames)
    setNodes(newNodes)
    setEdges(newEdges)
  }, [W, k, currentMatrix, nodeNames, setNodes, setEdges, stepIndex, isAnimating])

  const generateWijGraph = (W, k, currentMatrix, nodeNames) => {
    // Vérifications de sécurité
    if (!W || !Array.isArray(W) || !currentMatrix || !Array.isArray(currentMatrix) || !k) {
      return { nodes: [], edges: [] }
    }

    const nodes = []
    const edges = []
    const uniqueNodes = new Set()
    const uniqueEdges = new Set()

    // Tracker les nœuds sources et cibles
    const sourceNodes = new Set()
    const targetNodes = new Set()

    // Ajouter le sommet k
    const kNodeId = `node-${k - 1}`
    uniqueNodes.add(kNodeId)

    // Parcourir les calculs de W_ij pour identifier les sources et cibles
    W.forEach(({ i, j }) => {
      if (!i || !j || i < 1 || j < 1) return // Vérification de sécurité

      // Ajouter les sommets i, k, et j
      const iNodeId = `node-${i - 1}`
      const jNodeId = `node-${j - 1}`

      uniqueNodes.add(iNodeId)
      uniqueNodes.add(jNodeId)

      // Marquer les nœuds comme source ou cible
      sourceNodes.add(iNodeId) // i est source (i -> k)
      targetNodes.add(jNodeId) // j est cible (k -> j)

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
            markerEnd: {
              type: "arrowclosed",
              color: "#3a7bd5",
              width: 20,
              height: 20,
            },
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
            markerEnd: {
              type: "arrowclosed",
              color: "#00d2ff",
              width: 20,
              height: 20,
            },
          })
        }
      }
    })

    // Organiser les nœuds par catégorie
    const sourceNodesList = Array.from(sourceNodes).filter((nodeId) => nodeId !== kNodeId)
    const targetNodesList = Array.from(targetNodes).filter((nodeId) => nodeId !== kNodeId)

    // Dimensions du conteneur
    const containerWidth = 300
    const containerHeight = 200
    const centerX = containerWidth / 2
    const centerY = containerHeight / 2

    // Générer les nœuds avec positionnement organisé
    uniqueNodes.forEach((nodeId) => {
      const nodeIndex = Number.parseInt(nodeId.split("-")[1])
      const isKNode = nodeId === kNodeId
      const isSource = sourceNodes.has(nodeId) && !isKNode
      const isTarget = targetNodes.has(nodeId) && !isKNode

      let position = { x: centerX, y: centerY }

      if (isKNode) {
        // Nœud intermédiaire au centre
        position = { x: centerX, y: centerY }
      } else if (isSource) {
        // Sources à gauche, réparties verticalement
        const sourceIndex = sourceNodesList.indexOf(nodeId)
        const totalSources = sourceNodesList.length
        const leftX = centerX - 120 // 120px à gauche du centre

        if (totalSources === 1) {
          position = { x: leftX, y: centerY }
        } else {
          const spacing = Math.min(80, (containerHeight - 40) / (totalSources - 1))
          const startY = centerY - ((totalSources - 1) * spacing) / 2
          position = { x: leftX, y: startY + sourceIndex * spacing }
        }
      } else if (isTarget) {
        // Cibles à droite, réparties verticalement
        const targetIndex = targetNodesList.indexOf(nodeId)
        const totalTargets = targetNodesList.length
        const rightX = centerX + 120 // 120px à droite du centre

        if (totalTargets === 1) {
          position = { x: rightX, y: centerY }
        } else {
          const spacing = Math.min(80, (containerHeight - 40) / (totalTargets - 1))
          const startY = centerY - ((totalTargets - 1) * spacing) / 2
          position = { x: rightX, y: startY + targetIndex * spacing }
        }
      }

      // Utiliser la position sauvegardée si elle existe, sinon utiliser la position calculée
      const savedPosition = nodePositions[stepIndex]?.[nodeId] || position

      // Utiliser le vrai nom du nœud depuis nodeNames, sinon fallback sur l'index
      const nodeName = nodeNames && nodeNames[nodeIndex] ? nodeNames[nodeIndex] : `${nodeIndex + 1}`

      nodes.push({
        id: nodeId,
        type: "custom",
        data: {
          label: nodeName, // Utiliser le vrai nom
          isKNode: isKNode,
          type: isKNode ? "special" : "normal",
          isSource: isSource,
          isTarget: isTarget,
        },
        position: savedPosition,
        draggable: true,
      })
    })

    return { nodes, edges }
  }

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
          nodeTypes={nodeTypes}
          onNodesChange={handleNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          fitViewOptions={{ padding: 0.1 }}
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

          {/* Légende améliorée avec disposition */}
          <Panel position="top-left">
            <div
              className="bg-white p-3 rounded-md shadow-sm border border-gray-200 text-xs"
              style={{ background: "rgba(255, 255, 255, 0.9)", backdropFilter: "blur(4px)" }}
            >
              <div className="text-center mb-2 font-semibold text-gray-700">Disposition</div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">
                  ↗
                </div>
                <span>Sources (gauche)</span>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 bg-gradient-to-r from-orange-400 to-yellow-400 rounded-full"></div>
                <span>Intermédiaire (centre)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">
                  ↙
                </div>
                <span>Cibles (droite)</span>
              </div>
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
