"use client"

import { useState } from "react"
import { Handle, Position } from "reactflow"

const WijGraphNode = ({ data, selected }) => {
  const [isHovered, setIsHovered] = useState(false)
  const { label, isKNode = false, type = "normal", isSource = false, isTarget = false } = data

  const getDisplayName = (name) => {
    if (!name || typeof name !== "string") return "/"
    if (name.length <= 4) return name
    const firstLetter = name.charAt(0).toUpperCase()
    const lastThreeLetters = name.slice(-3).toLowerCase()
    return `${firstLetter}/${lastThreeLetters}`
  }

  const getNodeStyle = () => {
    if (isKNode) {
      return {
        background: "linear-gradient(135deg, #FF4E50, #F9D423)",
        boxShadow: "0 4px 15px rgba(255, 78, 80, 0.5)",
      }
    }
    return {
      background: "linear-gradient(135deg, #3a7bd5, #00d2ff)",
      boxShadow: "0 4px 10px rgba(0, 0, 0, 0.2)",
    }
  }

  const nodeStyle = getNodeStyle()
  const displayName = getDisplayName(label)

  return (
    <div
      className="custom-node"
      style={{
        ...nodeStyle,
        color: "white",
        borderRadius: "50%",
        width: "50px",
        height: "50px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: "bold",
        fontSize: displayName.length > 3 ? "11px" : "14px",
        border: "3px solid #ffffff",
        cursor: "grab",
        transition: "all 0.3s ease",
        transform: isHovered ? "scale(1.1)" : "scale(1)",
        zIndex: isHovered ? 1000 : 1,
        position: "relative",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={isHovered ? label : undefined}
    >
      <span style={{ pointerEvents: "none", userSelect: "none", textAlign: "center", lineHeight: "1" }}>
        {displayName}
      </span>

      {isSource && (
        <div
          style={{
            position: "absolute",
            top: "-8px",
            right: "-8px",
            width: "16px",
            height: "16px",
            background: "#10b981",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "10px",
            color: "white",
            fontWeight: "bold",
            boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
          }}
          title="Nœud source"
        >
          ↗
        </div>
      )}

      {isTarget && (
        <div
          style={{
            position: "absolute",
            top: "-8px",
            left: "-8px",
            width: "16px",
            height: "16px",
            background: "#ef4444",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "10px",
            color: "white",
            fontWeight: "bold",
            boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
          }}
          title="Nœud cible"
        >
          ↙
        </div>
      )}

      {isHovered && (
        <div
          style={{
            position: "absolute",
            top: "-40px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(0, 0, 0, 0.8)",
            color: "white",
            padding: "4px 8px",
            borderRadius: "4px",
            fontSize: "12px",
            whiteSpace: "nowrap",
            zIndex: 1001,
            pointerEvents: "none",
          }}
        >
          {label}
          {isKNode && " (Nœud intermédiaire)"}
          {isSource && " (Source)"}
          {isTarget && " (Cible)"}
        </div>
      )}

      <Handle type="target" position={Position.Top} style={{ background: "transparent", border: "none" }} />
      <Handle type="source" position={Position.Bottom} style={{ background: "transparent", border: "none" }} />
      <Handle type="target" position={Position.Left} style={{ background: "transparent", border: "none" }} />
      <Handle type="source" position={Position.Right} style={{ background: "transparent", border: "none" }} />
    </div>
  )
}

export default WijGraphNode