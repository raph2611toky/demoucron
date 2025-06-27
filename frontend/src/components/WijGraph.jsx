import { useEffect, useState } from "react";
import ReactFlow, { Controls, Background } from "reactflow";
import "reactflow/dist/style.css";
import { motion } from "framer-motion";

function WijGraph({ W, k, currentMatrix, stepIndex, nodes, nodeNames }) {
  const [isAnimating, setIsAnimating] = useState(false);

  const generateWijGraph = (W, k, currentMatrix, nodes, nodeNames) => {
    const rfNodes = [];
    const rfEdges = [];
    const uniqueNodes = new Set();
    const uniqueEdges = new Set();

    const kNodeId = `node-${k - 1}`;
    uniqueNodes.add(kNodeId);

    W.forEach(({ i, j }) => {
      uniqueNodes.add(`node-${i - 1}`);
      uniqueNodes.add(`node-${j - 1}`);

      const iIdx = i - 1;
      const jIdx = j - 1;
      const kIdx = k - 1;

      const edgeIkId = `edge-${iIdx}-${kIdx}-${stepIndex}`;
      if (!uniqueEdges.has(edgeIkId)) {
        uniqueEdges.add(edgeIkId);
        const weightIk = currentMatrix[iIdx][kIdx];
        if (weightIk !== null) {
          rfEdges.push({
            id: edgeIkId,
            source: `node-${iIdx}`,
            target: `node-${kIdx}`,
            label: `${weightIk}`,
            animated: isAnimating,
            style: { stroke: "#3b82f6", strokeWidth: 3 },
            labelStyle: { 
              fill: "#3b82f6", 
              fontWeight: "600", 
              fontSize: "12px",
              fontFamily: "Inter, sans-serif"
            },
            labelBgStyle: {
              fill: "white",
              fillOpacity: 0.9,
              stroke: "#3b82f6",
              strokeWidth: 1,
              rx: 4,
              ry: 4
            }
          });
        }
      }

      const edgeKjId = `edge-${kIdx}-${jIdx}-${stepIndex}`;
      if (!uniqueEdges.has(edgeKjId)) {
        uniqueEdges.add(edgeKjId);
        const weightKj = currentMatrix[kIdx][jIdx];
        if (weightKj !== null) {
          rfEdges.push({
            id: edgeKjId,
            source: `node-${kIdx}`,
            target: `node-${jIdx}`,
            label: `${weightKj}`,
            animated: isAnimating,
            style: { stroke: "#06b6d4", strokeWidth: 3 },
            labelStyle: { 
              fill: "#06b6d4", 
              fontWeight: "600", 
              fontSize: "12px",
              fontFamily: "Inter, sans-serif"
            },
            labelBgStyle: {
              fill: "white",
              fillOpacity: 0.9,
              stroke: "#06b6d4",
              strokeWidth: 1,
              rx: 4,
              ry: 4
            }
          });
        }
      }
    });

    uniqueNodes.forEach((nodeId) => {
      const nodeIndex = Number.parseInt(nodeId.split("-")[1]);
      const node = nodes.find((n) => n.name === nodeNames[nodeIndex]);
      const isKNode = nodeId === kNodeId;
      rfNodes.push({
        id: nodeId,
        data: { label: node?.name || nodeNames[nodeIndex] },
        position: { x: nodeIndex * 120 + 50, y: isKNode ? 50 : 150 },
        style: isKNode
          ? { 
              background: "linear-gradient(135deg, #f59e0b, #f97316)", 
              color: "white", 
              borderRadius: "50%", 
              width: "50px", 
              height: "50px", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              fontWeight: "bold", 
              fontSize: "16px",
              boxShadow: "0 8px 25px rgba(245, 158, 11, 0.4)",
              border: "3px solid #fbbf24"
            }
          : { 
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
              boxShadow: "0 6px 20px rgba(59, 130, 246, 0.3)"
            },
      });
    });

    return { nodes: rfNodes, edges: rfEdges };
  };

  const { nodes: initialNodes, edges: initialEdges } = generateWijGraph(W, k, currentMatrix, nodes, nodeNames);
  const [rfNodes, setNodes] = useState(initialNodes);
  const [rfEdges, setEdges] = useState(initialEdges);

  useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = generateWijGraph(W, k, currentMatrix, nodes, nodeNames);
    setNodes(newNodes);
    setEdges(newEdges);
  }, [W, k, currentMatrix, nodes, nodeNames, isAnimating]);

  return (
    <div className="wij-graph">
      {rfNodes.length > 0 ? (
        <div className="wij-container">
          <ReactFlow 
            nodes={rfNodes} 
            edges={rfEdges} 
            fitView
            fitViewOptions={{ padding: 0.2 }}
          >
            <Background color="#f0f0f0" gap={16} size={1} variant="dots" />
            <Controls />
          </ReactFlow>
          <motion.button
            onClick={() => setIsAnimating(!isAnimating)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="animation-toggle"
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isAnimating ? "M10 9v6m4-6v6" : "M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H15"} />
            </svg>
            {isAnimating ? "Pause" : "Animer"}
          </motion.button>
        </div>
      ) : (
        <div className="wij-empty">
          <div className="empty-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 0 00-5.656 0l-4 4a4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 0 005.5 0l4-4a4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <p>Aucun chemin trouvé pour cette étape</p>
        </div>
      )}
    </div>
  );
}

export default WijGraph;
