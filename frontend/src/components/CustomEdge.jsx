"use client"

import { getBezierPath } from "reactflow"
import { useState } from "react"

// Composant d'arête personnalisé avec poids bien visibles
const CustomEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  label,
  animated = false,
}) => {
  const [isHovered, setIsHovered] = useState(false)

  // Calculer des points de contrôle pour une courbe plus organique
  const curvature = 0.3 + Math.random() * 0.2

  // Ajouter de la variation pour éviter les superpositions
  const randomOffset = (Math.random() - 0.5) * 40

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature,
  })

  // Calculer la position du label au centre de l'arc
  const centerX = labelX + randomOffset
  const centerY = labelY + randomOffset

  return (
    <g>
      {/* L'arc principal */}
      <path
        id={id}
        style={{
          ...style,
          strokeLinecap: "round",
          strokeLinejoin: "round",
          filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
          strokeDasharray: animated ? "5,5" : "none",
          animation: animated ? "dash 1s linear infinite" : "none",
          strokeWidth: isHovered ? (style.strokeWidth || 2) + 1 : style.strokeWidth || 2,
        }}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />

      {/* Label avec fond blanc pour la visibilité */}
      {label && (
        <g transform={`translate(${centerX}, ${centerY})`}>
          {/* Fond blanc carré pour le poids */}
          <rect
            x="-12"
            y="-10"
            width="24"
            height="20"
            fill="white"
            stroke={style.stroke || "#3b82f6"}
            strokeWidth="1"
            rx="4"
            ry="4"
            style={{
              filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
            }}
          />
          {/* Texte du poids */}
          <text
            x="0"
            y="0"
            textAnchor="middle"
            dominantBaseline="central"
            style={{
              fontSize: "12px",
              fontWeight: "bold",
              fill: style.stroke || "#3b82f6",
              pointerEvents: "none",
              userSelect: "none",
            }}
          >
            {label}
          </text>
        </g>
      )}
    </g>
  )
}

export default CustomEdge
