"use client"

import { useEffect, useState } from "react"
import ReactFlow, { Controls, Background, useNodesState, useEdgesState, Panel, BackgroundVariant } from "reactflow"
import "reactflow/dist/style.css"
import WijGraphNode from "./WijGraphNode.jsx"
import { useGraphStore } from "../store/graphStore"
import "../styles/WijGraph.css"

const nodeTypes = {
  wijNode: WijGraphNode,
}

export default function WijGraph({ W = [], k, currentMatrix = [], stepIndex = 0, nodeNames = [] }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [isAnimating, setIsAnimating] = useState(false)

  // Récupérer le graphe original depuis le store
  const { nodes: originalNodes, edges: originalEdges } = useGraphStore()

  // Vérifier si on doit afficher le graphe (pas pour k=1 et k=n)
  const shouldDisplayGraph = k > 1 && k < nodeNames.length
  const isEmpty =
    !W ||
    !Array.isArray(W) ||
    W.length === 0 ||
    !currentMatrix ||
    !Array.isArray(currentMatrix) ||
    !k ||
    !shouldDisplayGraph

  useEffect(() => {
    if (isEmpty) {
      setNodes([])
      setEdges([])
      return
    }

    console.log("Generating WijGraph with:", { W, k, nodeNames, currentMatrix, originalNodes, originalEdges })

    const { nodes: newNodes, edges: newEdges } = generateWijGraph(
      W,
      k,
      currentMatrix,
      nodeNames,
      stepIndex,
      isAnimating,
      originalNodes,
      originalEdges,
    )
    setNodes(newNodes)
    setEdges(newEdges)
  }, [W, k, currentMatrix, nodeNames, stepIndex, isAnimating, isEmpty, originalNodes, originalEdges])

  const generateWijGraph = (W, k, currentMatrix, nodeNames, stepIndex, isAnimating, originalNodes, originalEdges) => {
    if (
      !W ||
      !Array.isArray(W) ||
      !currentMatrix ||
      !Array.isArray(currentMatrix) ||
      !k ||
      !originalNodes ||
      !originalEdges ||
      !shouldDisplayGraph
    ) {
      return { nodes: [], edges: [] }
    }

    const nodes = []
    const edges = []
    const uniqueNodes = new Set()
    const uniqueEdges = new Set()

    // Trouver le nœud k dans le graphe original
    const kNodeOriginal = originalNodes.find((node) => {
      const nodeIndex = nodeNames.findIndex((name) => name === node.value)
      return nodeIndex === k - 1
    })

    if (!kNodeOriginal) {
      console.log("Nœud k non trouvé dans le graphe original")
      return { nodes: [], edges: [] }
    }

    // Identifier les nœuds réellement connectés au nœud k dans le graphe original
    const connectedToK = new Set()
    const kNodeId = `node-${k - 1}`

    // Ajouter le nœud k lui-même
    uniqueNodes.add(kNodeId)
    connectedToK.add(k - 1)

    // Parcourir les arêtes originales pour trouver les connexions avec k
    originalEdges.forEach((edge) => {
      const fromNode = originalNodes.find((n) => n.id === edge.fromNodeId)
      const toNode = originalNodes.find((n) => n.id === edge.toNodeId)

      if (fromNode && toNode) {
        const fromIndex = nodeNames.findIndex((name) => name === fromNode.value)
        const toIndex = nodeNames.findIndex((name) => name === toNode.value)

        // Si l'arête part de k ou arrive à k
        if (fromIndex === k - 1) {
          connectedToK.add(toIndex)
          uniqueNodes.add(`node-${toIndex}`)
        }
        if (toIndex === k - 1) {
          connectedToK.add(fromIndex)
          uniqueNodes.add(`node-${fromIndex}`)
        }
      }
    })

    console.log("Nœuds connectés à k:", Array.from(connectedToK), "k =", k - 1)

    // Filtrer W pour ne garder que les calculs impliquant des nœuds réellement connectés
    const filteredW = W.filter(({ i, j }) => {
      const iIdx = i - 1
      const jIdx = j - 1
      return connectedToK.has(iIdx) && connectedToK.has(jIdx)
    })

    console.log("W filtré:", filteredW)

    // Configuration de la disposition
    const containerWidth = 280
    const containerHeight = 180
    const centerX = containerWidth / 2
    const centerY = containerHeight / 2
    const leftX = 60 // Position des sources à gauche
    const rightX = 220 // Position des puits à droite
    const verticalSpacing = 40 // Espacement vertical entre les nœuds

    // Séparer les nœuds par type (basé sur les connexions réelles)
    const sourceNodes = []
    const targetNodes = []
    const nodeArray = Array.from(uniqueNodes)

    nodeArray.forEach((nodeId) => {
      const nodeIndex = Number.parseInt(nodeId.split("-")[1])
      const isKNode = nodeId === kNodeId

      if (!isKNode) {
        // Vérifier les connexions réelles dans le graphe original
        let isSource = false
        let isTarget = false

        originalEdges.forEach((edge) => {
          const fromNode = originalNodes.find((n) => n.id === edge.fromNodeId)
          const toNode = originalNodes.find((n) => n.id === edge.toNodeId)

          if (fromNode && toNode) {
            const fromIndex = nodeNames.findIndex((name) => name === fromNode.value)
            const toIndex = nodeNames.findIndex((name) => name === toNode.value)

            // Si ce nœud pointe vers k
            if (fromIndex === nodeIndex && toIndex === k - 1) {
              isSource = true
            }
            // Si k pointe vers ce nœud
            if (fromIndex === k - 1 && toIndex === nodeIndex) {
              isTarget = true
            }
          }
        })

        if (isSource) sourceNodes.push(nodeId)
        if (isTarget) targetNodes.push(nodeId)
      }
    })

    console.log("Sources:", sourceNodes, "Targets:", targetNodes)

    // Créer les nœuds avec leurs positions optimisées
    nodeArray.forEach((nodeId) => {
      const nodeIndex = Number.parseInt(nodeId.split("-")[1])
      const isKNode = nodeId === kNodeId
      const nodeName = nodeNames[nodeIndex] || `${nodeIndex + 1}`

      let position
      if (isKNode) {
        // Nœud K au centre
        position = { x: centerX, y: centerY }
      } else {
        const isSource = sourceNodes.includes(nodeId)
        const isTarget = targetNodes.includes(nodeId)

        if (isSource && !isTarget) {
          // Sources à gauche
          const sourceIndex = sourceNodes.indexOf(nodeId)
          const startY = centerY - ((sourceNodes.length - 1) * verticalSpacing) / 2
          position = { x: leftX, y: startY + sourceIndex * verticalSpacing }
        } else if (isTarget && !isSource) {
          // Puits à droite
          const targetIndex = targetNodes.indexOf(nodeId)
          const startY = centerY - ((targetNodes.length - 1) * verticalSpacing) / 2
          position = { x: rightX, y: startY + targetIndex * verticalSpacing }
        } else {
          // Nœuds qui sont à la fois source et puits - disposition en cercle
          const mixedNodes = nodeArray.filter((id) => {
            return id !== kNodeId && sourceNodes.includes(id) && targetNodes.includes(id)
          })
          const mixedIndex = mixedNodes.indexOf(nodeId)
          const angle = (2 * Math.PI * mixedIndex) / Math.max(mixedNodes.length, 1)
          position = {
            x: centerX + 50 * Math.cos(angle),
            y: centerY + 50 * Math.sin(angle),
          }
        }
      }

      nodes.push({
        id: nodeId,
        type: "wijNode",
        data: {
          label: nodeName,
          isKNode: isKNode,
          isSource: sourceNodes.includes(nodeId),
          isTarget: targetNodes.includes(nodeId),
        },
        position,
        draggable: true,
      })
    })

    // Créer les arêtes basées sur les connexions réelles et les calculs W
    filteredW.forEach(({ i, j }) => {
      if (!i || !j || i < 1 || j < 1) return

      const iNodeId = `node-${i - 1}`
      const jNodeId = `node-${j - 1}`
      const kNodeId = `node-${k - 1}`

      const iIdx = i - 1
      const jIdx = j - 1
      const kIdx = k - 1

      // Vérifier que les nœuds existent dans notre graphe filtré
      if (!uniqueNodes.has(iNodeId) || !uniqueNodes.has(jNodeId) || !uniqueNodes.has(kNodeId)) {
        return
      }

      // Arête i -> k (seulement si elle existe dans le graphe original)
      const hasEdgeIK = originalEdges.some((edge) => {
        const fromNode = originalNodes.find((n) => n.id === edge.fromNodeId)
        const toNode = originalNodes.find((n) => n.id === edge.toNodeId)
        if (fromNode && toNode) {
          const fromIndex = nodeNames.findIndex((name) => name === fromNode.value)
          const toIndex = nodeNames.findIndex((name) => name === toNode.value)
          return fromIndex === iIdx && toIndex === kIdx
        }
        return false
      })

      if (hasEdgeIK) {
        const edgeIkId = `edge-${iIdx}-${kIdx}-${stepIndex}`
        if (!uniqueEdges.has(edgeIkId) && currentMatrix[iIdx] && currentMatrix[iIdx][kIdx] !== undefined) {
          uniqueEdges.add(edgeIkId)
          const weightIk = currentMatrix[iIdx][kIdx]
          if (weightIk !== Number.POSITIVE_INFINITY && weightIk !== null && weightIk !== undefined) {
            edges.push({
              id: edgeIkId,
              source: iNodeId,
              target: kNodeId,
              label: `${weightIk}`,
              animated: isAnimating,
              style: {
                stroke: "#3b82f6",
                strokeWidth: 2,
                strokeDasharray: isAnimating ? "5,5" : "none",
              },
              markerEnd: {
                type: "arrowclosed",
                color: "#3b82f6",
              },
              labelStyle: {
                fill: "#1f2937",
                fontWeight: 600,
                fontSize: "12px",
              },
              labelBgStyle: {
                fill: "#ffffff",
                fillOpacity: 0.9,
              },
            })
          }
        }
      }

      // Arête k -> j (seulement si elle existe dans le graphe original)
      const hasEdgeKJ = originalEdges.some((edge) => {
        const fromNode = originalNodes.find((n) => n.id === edge.fromNodeId)
        const toNode = originalNodes.find((n) => n.id === edge.toNodeId)
        if (fromNode && toNode) {
          const fromIndex = nodeNames.findIndex((name) => name === fromNode.value)
          const toIndex = nodeNames.findIndex((name) => name === toNode.value)
          return fromIndex === kIdx && toIndex === jIdx
        }
        return false
      })

      if (hasEdgeKJ) {
        const edgeKjId = `edge-${kIdx}-${jIdx}-${stepIndex}`
        if (!uniqueEdges.has(edgeKjId) && currentMatrix[kIdx] && currentMatrix[kIdx][jIdx] !== undefined) {
          uniqueEdges.add(edgeKjId)
          const weightKj = currentMatrix[kIdx][jIdx]
          if (weightKj !== Number.POSITIVE_INFINITY && weightKj !== null && weightKj !== undefined) {
            edges.push({
              id: edgeKjId,
              source: kNodeId,
              target: jNodeId,
              label: `${weightKj}`,
              animated: isAnimating,
              style: {
                stroke: "#06b6d4",
                strokeWidth: 2,
                strokeDasharray: isAnimating ? "5,5" : "none",
              },
              markerEnd: {
                type: "arrowclosed",
                color: "#06b6d4",
              },
              labelStyle: {
                fill: "#1f2937",
                fontWeight: 600,
                fontSize: "12px",
              },
              labelBgStyle: {
                fill: "#ffffff",
                fillOpacity: 0.9,
              },
            })
          }
        }
      }
    })

    console.log("Generated nodes:", nodes.length, "edges:", edges.length)
    return { nodes, edges }
  }

  // Messages spéciaux pour k=1 et k=n
  if (k === 1) {
    return (
      <div className="wij-graph">
        <div className="wij-empty">
          <div className="empty-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p>
            <strong>k = 1 :</strong> Sommet initial
          </p>
          <p>Aucun graphe Wij à afficher (pas d'arcs entrants)</p>
        </div>
      </div>
    )
  }

  if (k === nodeNames.length) {
    return (
      <div className="wij-graph">
        <div className="wij-empty">
          <div className="empty-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p>
            <strong>k = {nodeNames.length} :</strong> Sommet final
          </p>
          <p>Aucun graphe Wij à afficher (pas d'arcs sortants)</p>
        </div>
      </div>
    )
  }

  if (isEmpty) {
    return (
      <div className="wij-graph">
        <div className="wij-empty">
          <div className="empty-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <p>Aucun chemin trouvé pour cette étape.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="wij-graph">
      <div className="wij-container" style={{ height: "100%", width: "100%" }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          fitViewOptions={{
            padding: 0.2,
            includeHiddenNodes: true,
            minZoom: 0.5,
            maxZoom: 1.5,
          }}
          style={{ height: "100%", width: "100%" }}
          nodesDraggable={true}
          nodesConnectable={false}
          elementsSelectable={true}
          selectNodesOnDrag={false}
          panOnDrag={true}
          zoomOnScroll={true}
          zoomOnPinch={true}
          preventScrolling={false}
        >
          <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#e2e8f0" style={{ opacity: 0.5 }} />
          <Controls showInteractive={false} />
          <Panel position="top-right">
            <button onClick={() => setIsAnimating(!isAnimating)} className="animation-toggle">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {isAnimating ? "Arrêter" : "Animer"}
            </button>
          </Panel>
          <Panel position="bottom-center">
            <div className="step-info-panel">
              <span>Étape k = {k}</span> • {nodes.length} sommets • {edges.length} arêtes
            </div>
          </Panel>
          {/* <Panel position="top-left">
            <div className="legend-panel">
              <div>Graphe Wij - Connexions réelles</div>
              <div>
                <div style={{ background: "#10b981" }}>↗ Sources → k</div>
                <div style={{ background: "linear-gradient(135deg, #FF4E50, #F9D423)" }}>k (intermédiaire)</div>
                <div style={{ background: "#ef4444" }}>k → Cibles ↙</div>
              </div>
            </div>
          </Panel> */}
        </ReactFlow>
      </div>
    </div>
  )
}
