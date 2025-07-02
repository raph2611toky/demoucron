"use client"

import { useState } from "react"
import { Handle, Position } from "reactflow"

const CustomNode = ({ data, selected }) => {
  const [isHovered, setIsHovered] = useState(false)

  const { label, isKNode = false, type = "normal" } = data

  // Fonction pour formater le nom d'affichage
  const getDisplayName = (name) => {
    if (!name || typeof name !== "string") return "/"

    // Si le nom fait 4 caractères ou moins, afficher le nom complet
    if (name.length <= 4) {
      return name
    }

    // Si le nom dépasse 4 caractères, utiliser le format spécial
    const firstLetter = name.charAt(0).toUpperCase()
    const lastThreeLetters = name.slice(-3).toLowerCase()
    return `${firstLetter}/${lastThreeLetters}`
  }

  // Déterminer le style en fonction du type de nœud
  const getNodeStyle = () => {
    if (isKNode) {
      return {
        background: "linear-gradient(135deg, #FF4E50, #F9D423)",
        boxShadow: "0 4px 15px rgba(255, 78, 80, 0.5)",
      }
    }

    switch (type) {
      case "initial":
        return {
          background: "linear-gradient(135deg, #10b981, #059669)",
          boxShadow: "0 6px 20px rgba(16, 185, 129, 0.3)",
        }
      case "final":
        return {
          background: "linear-gradient(135deg, #ef4444, #dc2626)",
          boxShadow: "0 6px 20px rgba(239, 68, 68, 0.3)",
        }
      default:
        return {
          background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
          boxShadow: "0 6px 20px rgba(59, 130, 246, 0.3)",
        }
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
        fontSize: displayName.length > 3 ? "11px" : "14px", // Ajuster la taille selon la longueur
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
      {/* Afficher le nom formaté */}
      <span style={{ pointerEvents: "none", userSelect: "none", textAlign: "center", lineHeight: "1" }}>
        {displayName}
      </span>

      {/* Tooltip au hover */}
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
        </div>
      )}

      {/* Handles pour les connexions */}
      <Handle type="target" position={Position.Top} style={{ background: "transparent", border: "none" }} />
      <Handle type="source" position={Position.Bottom} style={{ background: "transparent", border: "none" }} />
      <Handle type="target" position={Position.Left} style={{ background: "transparent", border: "none" }} />
      <Handle type="source" position={Position.Right} style={{ background: "transparent", border: "none" }} />
    </div>
  )
}

export default CustomNode
