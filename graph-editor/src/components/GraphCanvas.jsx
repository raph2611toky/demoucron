import React, { useRef, useEffect, useState } from 'react';
import { Stage, Layer, Circle, Text, Line, Rect, Group, Path } from 'react-konva';
import { useGraphStore } from '../store/graphStore';

const GraphCanvas = ({ isReadOnly = false, pathColors = { nodes: {}, edges: {} } }) => {
  const stageRef = useRef(null);
  const containerRef = useRef(null);
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isDraggingNode, setIsDraggingNode] = useState(false);
  const [isDraggingEdge, setIsDraggingEdge] = useState(false);
  const [isDraggingStage, setIsDraggingStage] = useState(false);
  const [lastPointerPosition, setLastPointerPosition] = useState({ x: 0, y: 0 });

  const {
    nodes,
    edges,
    selectedNode,
    contextMenu,
    arcCreationMode,
    previewArc,
    scale,
    stagePosition,
    currentPath,
    isSimulating,
    packetPosition,
    isEditMode,
    addNode,
    updateNode,
    setSelectedNode,
    setShowNodeForm,
    setContextMenu,
    setArcCreationMode,
    setPreviewArc,
    addEdge,
    updateEdge,
    deleteEdge,
    setScale,
    setStagePosition,
    clearGraph,
    openEdgeWeightModal,
  } = useGraphStore();

  const effectiveEditMode = isReadOnly ? false : isEditMode;

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setStageSize({
          width: rect.width,
          height: rect.height,
        });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    const resizeObserver = new ResizeObserver(handleResize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
    };
  }, []);

  const handleStageMouseMove = (e) => {
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    const stagePos = stage.position();
    const adjustedPos = {
      x: (pos.x - stagePos.x) / scale,
      y: (pos.y - stagePos.y) / scale,
    };
    setMousePos(adjustedPos);

    if (isDraggingStage && !arcCreationMode && !isDraggingNode && !isDraggingEdge) {
      const dx = pos.x - lastPointerPosition.x;
      const dy = pos.y - lastPointerPosition.y;
      setStagePosition({
        x: stagePosition.x + dx,
        y: stagePosition.y + dy,
      });
      setLastPointerPosition(pos);
    }

    if (arcCreationMode && effectiveEditMode) {
      const sourceNode = nodes.find((n) => n.id === arcCreationMode);
      if (sourceNode) {
        setPreviewArc({
          from: { x: sourceNode.x, y: sourceNode.y },
          to: adjustedPos,
        });
      }
    }
  };

  const handleStageMouseDown = (e) => {
    if (e.target === e.target.getStage() && !arcCreationMode && !isDraggingNode && !isDraggingEdge) {
      setIsDraggingStage(true);
      const pos = e.target.getStage().getPointerPosition();
      setLastPointerPosition(pos);
    }
  };

  const handleStageMouseUp = () => {
    setIsDraggingStage(false);
  };

  const handleStageClick = (e) => {
    if (isReadOnly) return;
    if (e.target === e.target.getStage()) {
      if (arcCreationMode) {
        setArcCreationMode(null);
        setPreviewArc(null);
      } else {
        setSelectedNode(null);
        setShowNodeForm(false);
      }
    }
    setContextMenu(false);
  };

  const handleStageRightClick = (e) => {
    if (isReadOnly) return;
    e.evt.preventDefault();
    const pos = e.target.getStage().getPointerPosition();
    const stagePos = e.target.getStage().position();
    const adjustedPos = {
      x: (pos.x - stagePos.x) / scale,
      y: (pos.y - stagePos.y) / scale,
    };
    setContextMenu(true, pos.x, pos.y, adjustedPos);
  };

  const handleNodeLeftClick = (node) => {
    if (isReadOnly) return;
    if (effectiveEditMode) {
      if (arcCreationMode === null) {
        setArcCreationMode(node.id);
      } else if (arcCreationMode === node.id) {
        setArcCreationMode(null);
        setPreviewArc(null);
      } else {
        addEdge(arcCreationMode, node.id);
        setArcCreationMode(null);
        setPreviewArc(null);
      }
    }
  };

  const handleNodeRightClick = (e, node) => {
    e.evt.preventDefault();
    if (isReadOnly) {
      setSelectedNode(node);
      setShowNodeForm(true);
      return;
    }
    setSelectedNode(node);
    setShowNodeForm(true);
    setContextMenu(false);
    if (arcCreationMode) {
      setArcCreationMode(null);
      setPreviewArc(null);
    }
  };

  const handleNodeDragStart = () => {
    if (isReadOnly) return;
    setIsDraggingNode(true);
  };

  const handleNodeDragEnd = (nodeId, e) => {
    if (isReadOnly) return;
    setIsDraggingNode(false);
    const newPos = e.target.position();
    updateNode(nodeId, { x: newPos.x, y: newPos.y });
  };

  const handleWheel = (e) => {
    e.evt.preventDefault();
    const scaleBy = 1.1;
    const stage = e.target.getStage();
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();

    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
    const clampedScale = Math.max(0.1, Math.min(3, newScale));

    setScale(clampedScale);

    const newPos = {
      x: pointer.x - (pointer.x - stage.x()) * (clampedScale / oldScale),
      y: pointer.y - (pointer.y - stage.y()) * (clampedScale / oldScale),
    };

    setStagePosition(newPos);
  };

  const handleEdgeRightClick = (e, edge) => {
    if (isReadOnly) return;
    e.evt.preventDefault();
    e.cancelBubble = true;
    openEdgeWeightModal(edge);
  };

  const formatNodeLabel = (value) => {
    if (value.length <= 4) return value;
    return value.charAt(0).toUpperCase() + value.slice(-3).toLowerCase();
  };

  const getNodeColor = (node) => {
    if (pathColors.nodes[node.id]) return pathColors.nodes[node.id];
    if (node.isInitial) return '#10b981';
    if (node.isFinal) return '#ef4444';
    if (arcCreationMode === node.id) return '#fbbf24';
    if (node.isTemporary) return '#f59e0b';
    return '#ffffff';
  };

  const getNodeBorderColor = (node) => {
    if (pathColors.nodes[node.id]) return darkenColor(pathColors.nodes[node.id]);
    if (node.isInitial) return '#059669';
    if (node.isFinal) return '#dc2626';
    if (arcCreationMode === node.id) return '#f59e0b';
    if (node.isTemporary) return '#d97706';
    return '#d1d5db';
  };

  const darkenColor = (color) => {
    const map = {
      '#f97316': '#c2410c',
      '#10b981': '#047857',
      '#8b5cf6': '#6d28d9',
      '#ef4444': '#b91c1c',
      '#3b82f6': '#1d4ed8',
      '#eab308': '#b45309',
      '#14b8a6': '#0f766e',
      '#ec4899': '#be185d'
    };
    return map[color] || color;
  };

  const renderPacket = () => {
    if (!packetPosition || !isSimulating) return null;
    return (
      <Group x={packetPosition.x} y={packetPosition.y}>
        <Rect
          x={-10}
          y={-7.5}
          width={20}
          height={15}
          fill="linear-gradient(135deg, #fbbf24, #f59e0b)"
          stroke="#d97706"
          strokeWidth={1}
          cornerRadius={2}
          shadowColor="rgba(0, 0, 0, 0.3)"
          shadowBlur={4}
          shadowOffset={{ x: 1, y: 1 }}
          shadowOpacity={0.5}
        />
        <Path
          data="M -10 -7.5 L 0 0 L 10 -7.5 Z"
          fill="#f59e0b"
          stroke="#d97706"
          strokeWidth={0.5}
        />
        <Text
          text="📧"
          fontSize={8}
          width={20}
          height={15}
          align="center"
          verticalAlign="middle"
          offsetX={10}
          offsetY={7.5}
        />
        <Circle
          radius={12}
          fill="rgba(251, 191, 36, 0.2)"
          stroke="rgba(251, 191, 36, 0.4)"
          strokeWidth={1}
          dash={[2, 2]}
          opacity={0.7}
        />
      </Group>
    );
  };

  const renderNodes = () => {
    return nodes.map((node) => (
      <Group
        key={node.id}
        x={node.x}
        y={node.y}
        draggable={effectiveEditMode && !isSimulating}
        onDragStart={handleNodeDragStart}
        onDragEnd={(e) => handleNodeDragEnd(node.id, e)}
        onClick={() => handleNodeLeftClick(node)}
        onContextMenu={(e) => handleNodeRightClick(e, node)}
      >
        <Circle
          radius={28}
          fill={pathColors.nodes[node.id] || getNodeColor(node)}
          stroke={pathColors.nodes[node.id] ? darkenColor(pathColors.nodes[node.id]) : getNodeBorderColor(node)}
          strokeWidth={3}
          shadowColor="rgba(0, 0, 0, 0.3)"
          shadowBlur={8}
          shadowOffset={{ x: 2, y: 2 }}
          shadowOpacity={0.3}
        />
        <Circle
          radius={25}
          fill="rgba(255, 255, 255, 0.8)"
          stroke="rgba(255, 255, 255, 0.5)"
          strokeWidth={1}
        />
        <Text
          text={formatNodeLabel(node.value)}
          fontSize={13}
          fontFamily="Inter, Arial"
          fill="#1f2937"
          fontStyle="600"
          width={56}
          height={56}
          align="center"
          verticalAlign="middle"
          offsetX={28}
          offsetY={28}
        />
      </Group>
    ));
  };

  const renderEdges = () => {
    const edgesToRender = [...edges];
    if (previewArc && effectiveEditMode) {
      edgesToRender.push({
        id: 'preview',
        fromNode: previewArc.from,
        toNode: previewArc.to,
        weight: '?',
        isPreview: true,
      });
    }
    return edgesToRender.map((edge) => {
      let fromNode, toNode;
      if (edge.isPreview) {
        fromNode = edge.fromNode;
        toNode = edge.toNode;
      } else {
        fromNode = nodes.find((n) => n.id === edge.fromNodeId);
        toNode = nodes.find((n) => n.id === edge.toNodeId);
      }
      if (!fromNode || !toNode) return null;
      const dx = toNode.x - fromNode.x;
      const dy = toNode.y - fromNode.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance === 0) return null;
      const unitX = dx / distance;
      const unitY = dy / distance;
      const startX = fromNode.x + unitX * 28;
      const startY = fromNode.y + unitY * 28;
      const endX = toNode.x - unitX * 28;
      const endY = toNode.y - unitY * 28;
      const pathData = `M ${startX} ${startY} L ${endX} ${endY}`;
      const midX = (startX + endX) / 2;
      const midY = (startY + endY) / 2;
      const arrowLength = 15;
      const arrowAngle = Math.PI / 6;
      const angle = Math.atan2(dy, dx);
      const arrowX1 = endX - arrowLength * Math.cos(angle - arrowAngle);
      const arrowY1 = endY - arrowLength * Math.sin(angle - arrowAngle);
      const arrowX2 = endX - arrowLength * Math.cos(angle + arrowAngle);
      const arrowY2 = endY - arrowLength * Math.sin(angle + arrowAngle);

      let strokeColor = '#374151';
      if (pathColors.edges[edge.id]) strokeColor = pathColors.edges[edge.id];
      else if (edge.isPreview) strokeColor = '#3b82f6';
      else if (edge.isTemporary) strokeColor = '#f59e0b';

      return (
        <Group key={edge.id}>
          <Path
            data={pathData}
            stroke={strokeColor}
            strokeWidth={edge.isPreview ? 3 : 2}
            opacity={edge.isPreview ? 0.7 : edge.isTemporary ? 0.8 : 1}
            dash={edge.isPreview ? [10, 5] : edge.isTemporary ? [5, 5] : []}
            onContextMenu={!edge.isPreview && effectiveEditMode ? (e) => handleEdgeRightClick(e, edge) : undefined}
          />
          <Line
            points={[endX, endY, arrowX1, arrowY1]}
            stroke={strokeColor}
            strokeWidth={edge.isPreview ? 3 : 2}
            opacity={edge.isPreview ? 0.7 : edge.isTemporary ? 0.8 : 1}
          />
          <Line
            points={[endX, endY, arrowX2, arrowY2]}
            stroke={strokeColor}
            strokeWidth={edge.isPreview ? 3 : 2}
            opacity={edge.isPreview ? 0.7 : edge.isTemporary ? 0.8 : 1}
          />
          <Group x={midX} y={midY} onContextMenu={!edge.isPreview && effectiveEditMode ? (e) => handleEdgeRightClick(e, edge) : undefined}>
            <Rect
              x={-16}
              y={-12}
              width={32}
              height={24}
              fill={edge.isPreview ? 'rgba(59, 130, 246, 0.9)' : edge.isTemporary ? 'rgba(245, 158, 11, 0.9)' : '#ffffff'}
              stroke={edge.isPreview ? '#3b82f6' : edge.isTemporary ? '#f59e0b' : '#374151'}
              strokeWidth={2}
              cornerRadius={6}
              shadowColor="rgba(0, 0, 0, 0.2)"
              shadowBlur={4}
              shadowOffset={{ x: 1, y: 1 }}
              shadowOpacity={0.3}
            />
            <Text
              text={edge.weight?.toString() || '0'}
              fontSize={12}
              fontFamily="Inter, Arial"
              fill={edge.isPreview || edge.isTemporary ? '#ffffff' : '#374151'}
              fontStyle="600"
              width={32}
              height={24}
              align="center"
              verticalAlign="middle"
              offsetX={16}
              offsetY={12}
            />
          </Group>
        </Group>
      );
    });
  };

  return (
    <div
      ref={containerRef}
      className="canvas-container"
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        scaleX={scale}
        scaleY={scale}
        x={stagePosition.x}
        y={stagePosition.y}
        onWheel={handleWheel}
        onClick={handleStageClick}
        onContextMenu={handleStageRightClick}
        onMouseMove={handleStageMouseMove}
        onMouseDown={handleStageMouseDown}
        onMouseUp={handleStageMouseUp}
        style={{
          display: 'block',
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      >
        <Layer>
          {renderEdges()}
          {renderNodes()}
          {renderPacket()}
        </Layer>
      </Stage>
      {contextMenu.visible && effectiveEditMode && !isSimulating && (
        <div
          className="context-menu"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
        >
          <button
            onClick={() => {
              addNode(contextMenu.adjustedPos.x, contextMenu.adjustedPos.y);
            }}
          >
            ✨ Ajouter un sommet ici
          </button>
          <button
            onClick={() => {
              if (confirm('Êtes-vous sûr de vouloir effacer tout le graphe ?')) {
                clearGraph();
              }
            }}
          >
            🗑️ Effacer le graphe
          </button>
        </div>
      )}
      {arcCreationMode && effectiveEditMode && !isSimulating && (
        <div className="arc-creation-indicator">
          <div className="indicator-content">
            <div className="indicator-icon">🎯</div>
            <div className="indicator-text">
              <div className="indicator-title">Mode création d'arc</div>
              <div className="indicator-subtitle">Cliquez sur le sommet de destination</div>
            </div>
          </div>
        </div>
      )}
      {isSimulating && (
        <div className="simulation-indicator">
          <div className="indicator-content">
            <div className="indicator-icon">📧</div>
            <div className="indicator-text">
              <div className="indicator-title">Simulation en cours</div>
              <div className="indicator-subtitle">Transmission du paquet</div>
            </div>
          </div>
        </div>
      )}
      {isReadOnly && (
        <div className="read-mode-indicator">
          <div className="indicator-content">
            <div className="indicator-icon">👁️</div>
            <div className="indicator-text">
              <div className="indicator-title">Mode Lecture</div>
              <div className="indicator-subtitle">Édition désactivée</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GraphCanvas;