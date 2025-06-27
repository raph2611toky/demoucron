import { useMemo } from "react";
import ReactFlow, { Background, Controls, MiniMap } from "reactflow";
import "reactflow/dist/style.css";
import { motion } from "framer-motion";

const nodeTypes = {
  custom: ({ data }) => (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      whileHover={{ scale: 1.1 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
      className="custom-node"
      style={{
        background: data.gradient,
        boxShadow: data.shadow,
      }}
    >
      <span className="node-label">{data.label}</span>
      {data.type !== "normal" && (
        <div className="node-indicator">
          {data.type === "initial" ? "S" : "T"}
        </div>
      )}
    </motion.div>
  ),
};

function GraphVisualizer({ nodes, edges, theme, nodeNames, initialMatrix }) {
  const themeConfig = {
    light: {
      background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
      nodeInitial: "linear-gradient(135deg, #10b981, #059669)",
      nodeFinal: "linear-gradient(135deg, #ef4444, #dc2626)",
      nodeNormal: "linear-gradient(135deg, #3b82f6, #2563eb)",
      edgeColor: "#475569",
      shadowInitial: "0 8px 25px rgba(16, 185, 129, 0.3)",
      shadowFinal: "0 8px 25px rgba(239, 68, 68, 0.3)",
      shadowNormal: "0 8px 25px rgba(59, 130, 246, 0.3)",
    },
    dark: {
      background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
      nodeInitial: "linear-gradient(135deg, #10b981, #059669)",
      nodeFinal: "linear-gradient(135deg, #ef4444, #dc2626)",
      nodeNormal: "linear-gradient(135deg, #3b82f6, #2563eb)",
      edgeColor: "#94a3b8",
      shadowInitial: "0 8px 25px rgba(16, 185, 129, 0.4)",
      shadowFinal: "0 8px 25px rgba(239, 68, 68, 0.4)",
      shadowNormal: "0 8px 25px rgba(59, 130, 246, 0.4)",
    },
  };

  const currentTheme = themeConfig[theme] || themeConfig.light;

  const normalizedNodes = useMemo(() => {
    if (!nodes || nodes.length === 0) return [];
    return nodes.map((n, index) => {
      const nodeType = n.type || "normal";
      return {
        id: `${n.id || index}`,
        type: "custom",
        data: {
          label: n.name,
          type: nodeType,
          gradient: nodeType === "initial" ? currentTheme.nodeInitial : 
                   nodeType === "final" ? currentTheme.nodeFinal : 
                   currentTheme.nodeNormal,
          shadow: nodeType === "initial" ? currentTheme.shadowInitial : 
                  nodeType === "final" ? currentTheme.shadowFinal : 
                  currentTheme.shadowNormal,
        },
        position: { 
          x: 150 + (index % 4) * 200, 
          y: 150 + Math.floor(index / 4) * 150 
        },
        draggable: true,
      };
    });
  }, [nodes, currentTheme]);

  const reactFlowEdges = useMemo(() => {
    if (!edges || !nodes || edges.length === 0) return [];
    return edges
      .map((e, index) => {
        const sourceNode = nodes.find((n) => n.name.toLowerCase() === e.source.toLowerCase());
        const targetNode = nodes.find((n) => n.name.toLowerCase() === e.target.toLowerCase());
        if (!sourceNode || !targetNode) return null;
        if (!e.weight || isNaN(Number(e.weight))) return null;
        return {
          id: `e${index}`,
          source: `${sourceNode.id || nodes.indexOf(sourceNode)}`,
          target: `${targetNode.id || nodes.indexOf(targetNode)}`,
          label: String(e.weight),
          style: { 
            stroke: currentTheme.edgeColor, 
            strokeWidth: 3,
            filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
          },
          labelStyle: { 
            fill: currentTheme.edgeColor, 
            fontWeight: "600", 
            fontSize: "14px",
            fontFamily: "Inter, sans-serif"
          },
          labelBgStyle: { 
            fill: theme === "light" ? "#ffffff" : "#1e293b", 
            fillOpacity: 0.9, 
            stroke: currentTheme.edgeColor, 
            strokeWidth: 1, 
            rx: 6,
            ry: 6
          },
          type: "smoothstep",
          markerEnd: { 
            type: "arrowclosed", 
            color: currentTheme.edgeColor,
            width: 20,
            height: 20
          },
        };
      })
      .filter((edge) => edge !== null);
  }, [edges, nodes, currentTheme, theme]);

  const renderInitialMatrix = () => {
    if (!initialMatrix || initialMatrix.length === 0 || !nodeNames || nodeNames.length === 0) return null;
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
                  <th key={index} className="matrix-col-header">{name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {initialMatrix.map((row, i) => (
                <tr key={i}>
                  <td className="matrix-row-header">{nodeNames[i]}</td>
                  {row.map((value, j) => (
                    <td key={j} className={`matrix-value ${i === j ? 'diagonal' : ''}`}>
                      {value === null ? <span className="infinity">∞</span> : value}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="graph-visualizer">
      <div className="panel-header">
        <div className="panel-icon">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </div>
        <div className="panel-title">
          <h2>Visualisation Interactive</h2>
          <p>Représentation graphique de votre réseau</p>
        </div>
      </div>

      {normalizedNodes.length === 0 && reactFlowEdges.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="empty-visualization"
        >
          <div className="empty-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
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
          <div 
            className="react-flow-container"
            style={{ background: currentTheme.background }}
          >
            <ReactFlow 
              nodes={normalizedNodes} 
              edges={reactFlowEdges} 
              nodeTypes={nodeTypes} 
              fitView 
              fitViewOptions={{ padding: 0.3 }} 
              nodesDraggable={true}
              className="react-flow-custom"
            >
              <Background 
                color={theme === "light" ? "#e2e8f0" : "#334155"} 
                gap={20} 
                size={1} 
                variant="dots"
              />
              <Controls className="react-flow-controls" />
              <MiniMap 
                className="react-flow-minimap"
                nodeColor={(node) => {
                  const nodeData = normalizedNodes.find(n => n.id === node.id);
                  return nodeData?.data.gradient || currentTheme.nodeNormal;
                }}
              />
            </ReactFlow>
          </div>
          
          <div className="legend">
            <div className="legend-item">
              <div className="legend-node initial"></div>
              <span>Sommet Initial</span>
            </div>
            <div className="legend-item">
              <div className="legend-node normal"></div>
              <span>Sommet Normal</span>
            </div>
            <div className="legend-item">
              <div className="legend-node final"></div>
              <span>Sommet Final</span>
            </div>
          </div>
          
          {renderInitialMatrix()}
        </motion.div>
      )}
    </div>
  );
}

export default GraphVisualizer;
