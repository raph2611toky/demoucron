"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import "./MatrixInput.css"

function MatrixInput({ onMatrixUpdate, theme }) {
  const [nbrMatrice, setNbrMatrice] = useState(0)
  const [matrix, setMatrix] = useState([])

  const handleChange = (e) => {
    const value = Number.parseInt(e.target.value, 10)
    setNbrMatrice(value)
    if (value > 0) {
      const newMatrix = Array(value)
        .fill()
        .map(() => Array(value).fill(null))
      // Mettre la diagonale à 0
      for (let i = 0; i < value; i++) {
        newMatrix[i][i] = 0
      }
      setMatrix(newMatrix)
      const node_names = Array.from({ length: value }, (_, i) => (i + 1).toString())
      onMatrixUpdate({ matrix: newMatrix, node_names })
    } else {
      setMatrix([])
      onMatrixUpdate(null)
    }
  }

  const handleMatrixChange = (i, j, value) => {
    const newValue = value === "" ? null : Number.parseFloat(value)
    const newMatrix = matrix.map((row, rowIndex) =>
      rowIndex === i ? row.map((cell, colIndex) => (colIndex === j ? newValue : cell)) : row,
    )
    setMatrix(newMatrix)
    const node_names = Array.from({ length: nbrMatrice }, (_, i) => (i + 1).toString())
    onMatrixUpdate({ matrix: newMatrix, node_names })
  }

  return (
    <div className={`matrix-input ${theme}`}>
      <div className="panel-header">
        <div className="panel-icon">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        </div>
        <div className="panel-title">
          <h2>Entrée Matricielle</h2>
          <p>Saisissez directement la matrice d'adjacence</p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="matrix-config"
      >
        <div className="form-group">
          <label>Nombre de sommets</label>
          <div className="size-selector">
            <input
              type="number"
              min="0"
              value={nbrMatrice}
              onChange={handleChange}
              className="form-input size-input"
            />
            <div className="size-info">
              <span>
                Matrice {nbrMatrice}×{nbrMatrice}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {nbrMatrice > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="matrix-container"
        >
          <div className="matrix-wrapper">
            <table className="matrix-table">
              <thead>
                <tr>
                  <th className="matrix-corner"></th>
                  {Array.from({ length: nbrMatrice }, (_, i) => (
                    <th key={i} className="matrix-header">
                      {i + 1}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrix.map((row, i) => (
                  <tr key={i}>
                    <td className="matrix-header row-header">{i + 1}</td>
                    {row.map((cell, j) => (
                      <td key={j} className="matrix-cell">
                        <input
                          type="number"
                          min="0"
                          value={cell === null ? "" : cell}
                          onChange={(e) => {
                            const value = Math.abs(Number(e.target.value));
                            handleMatrixChange(i, j, value);
                          }}
                          className="matrix-input-field"
                          placeholder={i === j ? "0" : "∞"}
                          disabled={i === j}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="matrix-legend">
            <div className="legend-item">
              <div className="legend-color diagonal"></div>
              <span>Diagonale (distance à soi-même = 0)</span>
            </div>
            <div className="legend-item">
              <div className="legend-color infinity"></div>
              <span>Vide = ∞ (pas de connexion directe)</span>
            </div>
            <div className="legend-item">
              <div className="legend-color value"></div>
              <span>Valeur = distance/poids</span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default MatrixInput
