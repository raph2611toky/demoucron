"use client"

import { useEffect, useState } from "react"
import ReactFlow, { Controls, Background, useNodesState, useEdgesState } from "reactflow"
import "reactflow/dist/style.css"
import { motion } from "framer-motion"
import { ArrowRight, Calculator, ChevronDown, ChevronUp, Maximize, Minimize } from "lucide-react"
import { MinDemoucron } from "../lib/logiqueMini"
import { MaxDemoucron } from "../lib/logiqueMax"
import WijGraph from "./WijGraph"

export default function Sujet() {
  const [nbrMatrice, setNbrMatrice] = useState(0)
  const [matriceData, setMatriceData] = useState([])
  const [steps, setSteps] = useState([])
  const [finalMatrix, setFinalMatrix] = useState([])
  const [optimalPaths, setOptimalPaths] = useState({})
  const [formData, setFormData] = useState({
    methode: "",
    matrice: [],
    nbrMatrice: 0,
  })
  const [expandedSteps, setExpandedSteps] = useState({})
  const [isCalculating, setIsCalculating] = useState(false)
  const [nodePositions, setNodePositions] = useState({})

  useEffect(() => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      matrice: matriceData,
    }))
  }, [matriceData])

  const handleChange = (event) => {
    const value = Number.parseInt(event.target.value, 10)
    const validValue = isNaN(value) ? 0 : value

    setNbrMatrice(validValue)
    setFormData({ ...formData, nbrMatrice: validValue })

    if (validValue > 0) {
      const initialMatrice = Array.from({ length: validValue }, () => Array(validValue).fill(Number.POSITIVE_INFINITY))
      setMatriceData(initialMatrice)
    } else {
      setMatriceData([])
    }
  }

  const handleCalcule = async (e) => {
    e.preventDefault()
    try {
      setIsCalculating(true)
      setSteps([])
      setFinalMatrix([])
      setOptimalPaths({})

      if (formData.methode === "min") {
        const result = await MinDemoucron(formData)
        if (result.error) {
          console.log("Erreur de MinDemoucron :", result.error)
        } else {
          setSteps(result.steps)
          setFinalMatrix(result.finalMatrix)
          setOptimalPaths(result.optimalPaths || {})
        }
      } else if (formData.methode === "max") {
        const result = await MaxDemoucron(formData)
        if (result.error) {
          console.log("Erreur de MaxDemoucron :", result.error)
        } else {
          setSteps(result.steps)
          setFinalMatrix(result.finalMatrix)
          setOptimalPaths(result.optimalPaths || {})
        }
      }
      setIsCalculating(false)
    } catch (error) {
      console.log("Erreur lors du calcul")
      console.error(error)
      setIsCalculating(false)
    }
  }

  const toggleStepExpansion = (index) => {
    setExpandedSteps((prev) => ({
      ...prev,
      [index]: !prev[index],
    }))
  }

  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [optimalNodes, setOptimalNodes, onOptimalNodesChange] = useNodesState([])
  const [optimalEdges, setOptimalEdges, onOptimalEdgesChange] = useEdgesState([])

  // Mettre à jour le graphe initial
  useEffect(() => {
    const newNodes = []
    const newEdges = []

    // Ajouter tous les nœuds
    for (let i = 0; i < nbrMatrice; i++) {
      newNodes.push({
        id: `node-${i}`,
        data: { label: `${i + 1}` },
        position: { x: i * 150, y: i % 2 === 0 ? 0 : 100 },
        draggable: true,
        style: {
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
          boxShadow: "0 4px 10px rgba(0, 0, 0, 0.2)",
        },
      })
    }

    // Ajouter toutes les arêtes de la matrice initiale
    for (let i = 0; i < nbrMatrice; i++) {
      for (let j = 0; j < nbrMatrice; j++) {
        const weight = matriceData[i]?.[j]
        if (weight !== Number.POSITIVE_INFINITY && i !== j) {
          newEdges.push({
            id: `edge-${i}-${j}`,
            source: `node-${i}`,
            target: `node-${j}`,
            label: weight.toString(),
            style: {
              stroke: "#3a7bd5",
              strokeWidth: 2,
            },
            labelStyle: {
              fill: "#3a7bd5",
              fontWeight: "bold",
              fontSize: "12px",
              background: "white",
              padding: "2px 5px",
              borderRadius: "4px",
              border: "1px solid #3a7bd5",
            },
            type: "default",
          })
        }
      }
    }

    setNodes(newNodes)
    setEdges(newEdges)
  }, [matriceData, nbrMatrice])

  // Mettre à jour le graphe optimal avec le graphe original + mise en évidence
  useEffect(() => {
    if (nbrMatrice > 0) {
      const newNodes = []
      const newEdges = []
      const optimalPath = optimalPaths[`1-${nbrMatrice}`] || []

      // Ajouter tous les nœuds avec style différent pour les sommets optimaux
      for (let i = 0; i < nbrMatrice; i++) {
        const isOptimal = optimalPath.includes(i + 1)
        newNodes.push({
          id: `node-${i}`,
          data: { label: `${i + 1}` },
          position: { x: i * 150, y: i % 2 === 0 ? 0 : 100 },
          draggable: true,
          style: {
            background: isOptimal
              ? "linear-gradient(135deg, #FF4E50, #F9D423)"
              : "linear-gradient(135deg, #3a7bd5, #00d2ff)",
            color: "white",
            border: "none",
            borderRadius: "50%",
            width: "40px",
            height: "40px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "bold",
            boxShadow: isOptimal ? "0 4px 15px rgba(255, 78, 80, 0.5)" : "0 4px 10px rgba(0, 0, 0, 0.2)",
          },
        })
      }

      // Ajouter toutes les arêtes de la matrice initiale
      for (let i = 0; i < nbrMatrice; i++) {
        for (let j = 0; j < nbrMatrice; j++) {
          const weight = matriceData[i]?.[j]
          if (weight !== Number.POSITIVE_INFINITY && i !== j) {
            const isOptimalEdge =
              optimalPath.includes(i + 1) &&
              optimalPath.includes(j + 1) &&
              optimalPath.indexOf(i + 1) + 1 === optimalPath.indexOf(j + 1)
            newEdges.push({
              id: `edge-${i}-${j}`,
              source: `node-${i}`,
              target: `node-${j}`,
              label: weight.toString(),
              style: {
                stroke: isOptimalEdge ? "#FF4E50" : "#3a7bd5",
                strokeWidth: isOptimalEdge ? 3 : 2,
              },
              labelStyle: {
                fill: isOptimalEdge ? "#FF4E50" : "#3a7bd5",
                fontWeight: "bold",
                fontSize: "12px",
                background: "white",
                padding: "2px 5px",
                borderRadius: "4px",
                border: isOptimalEdge ? "1px solid #FF4E50" : "1px solid #3a7bd5",
              },
              type: "default",
            })
          }
        }
      }

      setOptimalNodes(newNodes)
      setOptimalEdges(newEdges)
    }
  }, [optimalPaths, matriceData, nbrMatrice])

  const renderMatrice = () => {
    const matrice = []
    for (let i = 0; i < nbrMatrice; i++) {
      const ligne = []
      for (let j = 0; j < nbrMatrice; j++) {
        if (i === 0) {
          ligne.push(
            <td key={j}>
              <div className="flex flex-col items-center">
                <p className="text-gray-600 font-medium">{j + 1}</p>
                <input
                  type="number"
                  id="valeur"
                  name="valeur"
                  className="border border-gray-300 m-2 rounded-lg px-2 py-2 transition-all"
                  style={{ width: "70px", fontSize: "0.875rem" }}
                  onChange={(e) => handleInputChange(i, j, e)}
                  value={matriceData[i]?.[j] === Number.POSITIVE_INFINITY ? "" : matriceData[i]?.[j]}
                />
              </div>
            </td>,
          )
        } else {
          ligne.push(
            <td key={j}>
              <input
                type="number"
                id="valeur"
                name="valeur"
                className="border border-gray-300 m-2 rounded-lg px-2 py-2 transition-all"
                style={{ width: '70px', fontSize: '0.875rem' }}
                onChange={(e) => handleInputChange(i, j, e)}
                value={matriceData[i]?.[j] === Number.POSITIVE_INFINITY ? "" : matriceData[i]?.[j]}
              />
            </td>
          )
        }
      }
      matrice.push(
        <tr key={i} className="flex flex-row items-center">
          <td className="text-gray-600 font-medium w-8 text-center">{i + 1}</td>
          {ligne}
        </tr>,
      )
    }
    return matrice
  }

  const InputChange = (i, j, event) => {
    const value = Number.parseInt(event.target.value, 10)
    const validValue = isNaN(value) ? Number.POSITIVE_INFINITY : value

    setMatriceData((prevMatrice) => {
      const newMatrice = [...prevMatrice]
      newMatrice[i][j] = validValue
      return newMatrice
    })
  }

  const handleInputChange = (i, j, event) => {
    const value = event.target.value
    const edgeId = `edge-${i}-${j}`

    setEdges((prevEdges) => {
      const updatedEdges = prevEdges.filter((edge) => edge.id !== edgeId)
      if (value && !isNaN(Number.parseInt(value, 10))) {
        updatedEdges.push({
          id: edgeId,
          source: `node-${i}`,
          target: `node-${j}`,
          label: value,
          style: { stroke: "#3a7bd5", strokeWidth: 2 },
          labelStyle: {
            fill: "#3a7bd5",
            fontWeight: "bold",
            fontSize: "12px",
            background: "white",
            padding: "2px 5px",
            borderRadius: "4px",
            border: "1px solid #3a7bd5",
          },
          type: "default",
        })
      }
      InputChange(i, j, event)
      return updatedEdges
    })

    setNodes((prevNodes) => {
      const updatedNodes = [...prevNodes]
      const sourceNode = {
        id: `node-${i}`,
        data: { label: `${i + 1}` },
        position: { x: i * 150, y: 0 },
        draggable: true,
        style: {
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
          boxShadow: "0 4px 10px rgba(0, 0, 0, 0.2)",
        },
      }
      const targetNode = {
        id: `node-${j}`,
        data: { label: `${j + 1}` },
        position: { x: j * 150, y: 100 },
        draggable: true,
        style: {
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
          boxShadow: "0 4px 10px rgba(0, 0, 0, 0.2)",
        },
      }

      if (!updatedNodes.find((node) => node.id === sourceNode.id)) {
        updatedNodes.push(sourceNode)
      }
      if (!updatedNodes.find((node) => node.id === targetNode.id)) {
        updatedNodes.push(targetNode)
      }
      return updatedNodes
    })
  }

  const renderOptimalMatrix = () => {
    if (finalMatrix.length === 0 || !optimalPaths || Object.keys(optimalPaths).length === 0) return null

    const isOptimalValue = Array.from({ length: finalMatrix.length }, () => Array(finalMatrix.length).fill(false))

    Object.entries(optimalPaths).forEach(([key, path]) => {
      console.log(key)
      if (path.length > 1) {
        for (let k = 0; k < path.length - 1; k++) {
          const i = path[k] - 1
          const j = path[k + 1] - 1
          isOptimalValue[i][j] = true
        }
      }
    })

    return (
      <table className="border-collapse rounded-lg overflow-hidden shadow-lg">
        <thead>
          <tr style={{ background: "linear-gradient(to right, var(--blue-500), var(--cyan-500))" }}>
            <th className="font-poppins p-3 text-white"></th>
            {Array.from({ length: finalMatrix.length }, (_, i) => (
              <th key={i} className="font-poppins p-3 text-white">
                {i + 1}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {finalMatrix.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? "bg-gray-50" : "bg-white"}>
              <td
                className="font-poppins p-3 font-medium text-white"
                style={{ background: "linear-gradient(to right, var(--blue-500), var(--cyan-500))" }}
              >
                {i + 1}
              </td>
              {row.map((value, j) => (
                <td
                  key={j}
                  className="font-poppins p-3 text-center"
                  style={
                    isOptimalValue[i][j]
                      ? {
                          background: "linear-gradient(to right, var(--orange-400), var(--red-500))",
                          color: "white",
                        }
                      : {}
                  }
                >
                  {value === Number.POSITIVE_INFINITY ? <span className="text-red-600">+∞</span> : value}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  return (
    <div className="w-full container py-8 flex flex-col gap-10">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="rounded-xl shadow-xl p-6"
        style={{ background: "linear-gradient(to right, var(--blue-600), var(--cyan-500))" }}
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <h1 className="font-poppins text-3xl md:text-4xl font-bold text-white">Algorithme de Demoucron</h1>
          <form className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
            <label htmlFor="nbrmatrice" className="font-poppins text-lg text-white">
              Nombre de sommets :
            </label>
            <input
              type="number"
              id="nbrmatrice"
              name="nbrmatrice"
              className="border-0 text-lg rounded-lg px-4 py-2 shadow-inner"
              style={{ width: "8rem" }}
              value={nbrMatrice}
              onChange={handleChange}
              min="0"
            />
          </form>
        </div>
      </motion.div>

      {nbrMatrice > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col gap-10"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="card">
              <h2 className="font-poppins text-2xl font-semibold mb-4 text-gray-800">Matrice d'adjacence</h2>
              <div className="overflow-x-auto">
                <table style={{ margin: "0 auto" }}>
                  <tbody>{renderMatrice()}</tbody>
                </table>
              </div>
            </div>

            <div className="card">
              <h2 className="font-poppins text-2xl font-semibold mb-4 text-gray-800">Matrice D1</h2>
              <div className="overflow-x-auto">
                <table className="border-collapse" style={{ margin: "0 auto" }}>
                  <tbody>
                    {matriceData.map((ligne, i) => (
                      <tr key={i} className={i % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                        {ligne.map((valeur, j) => (
                          <td key={j} className="font-poppins border border-gray-200 p-3 text-center">
                            {valeur === Number.POSITIVE_INFINITY ? <span className="text-red-600">+∞</span> : valeur}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="font-poppins text-2xl font-semibold mb-4 text-gray-800">Graphe initial</h2>
            <div style={{ width: "100%", height: "350px" }} className="border border-gray-200 rounded-lg">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                fitView
              >
                <Background color="#f0f0f0" gap={16} />
                <Controls />
              </ReactFlow>
            </div>
          </div>

          <motion.div
            className="card"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <form className="flex flex-col md:flex-row justify-between items-center gap-6" onSubmit={handleCalcule}>
              <div className="flex flex-col md:flex-row items-center gap-6 w-full">
                <div className="flex items-center gap-3 bg-gray-100 p-3 rounded-lg">
                  <input
                    type="radio"
                    id="max"
                    name="methode"
                    value="max"
                    className="w-5 h-5"
                    onChange={(e) => setFormData({ ...formData, methode: e.target.value })}
                  />
                  <label htmlFor="max" className="font-poppins text-lg font-medium flex items-center gap-2">
                    <Maximize size={18} />
                    Maximisation
                  </label>
                </div>
                <div className="flex items-center gap-3 bg-gray-100 p-3 rounded-lg">
                  <input
                    type="radio"
                    id="min"
                    name="methode"
                    value="min"
                    className="w-5 h-5"
                    onChange={(e) => setFormData({ ...formData, methode: e.target.value })}
                  />
                  <label htmlFor="min" className="font-poppins text-lg font-medium flex items-center gap-2">
                    <Minimize size={18} />
                    Minimisation
                  </label>
                </div>
              </div>
              <button
                type="submit"
                disabled={isCalculating || !formData.methode}
                className="btn btn-primary font-poppins text-lg font-semibold w-full md:w-auto justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCalculating ? (
                  <>
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                    Calcul en cours...
                  </>
                ) : (
                  <>
                    <Calculator size={20} />
                    Calculer
                  </>
                )}
              </button>
            </form>
          </motion.div>

          {steps.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="flex flex-col gap-8"
            >
              <h2
                className="font-poppins text-3xl font-bold text-gray-800"
                style={{ borderBottom: "2px solid var(--blue-500)", paddingBottom: "0.5rem" }}
              >
                Étapes de calcul
              </h2>

              {steps.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="bg-white rounded-xl shadow-lg overflow-hidden"
                >
                  <div
                    className="p-4 flex justify-between items-center cursor-pointer"
                    style={{ background: "linear-gradient(to right, var(--blue-600), var(--cyan-500))" }}
                    onClick={() => toggleStepExpansion(index)}
                  >
                    <h3 className="font-poppins text-xl font-semibold text-white">
                      Étape {index + 1}: k = {step.k}
                    </h3>
                    {expandedSteps[index] ? (
                      <ChevronUp className="text-white" />
                    ) : (
                      <ChevronDown className="text-white" />
                    )}
                  </div>

                  {expandedSteps[index] && (
                    <div className="p-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                        <div>
                          <h4 className="font-poppins text-lg font-semibold mb-3 text-gray-800">Graphe W{step.k}</h4>
                          <WijGraph
                            W={step.W}
                            k={step.k}
                            currentMatrix={step.matrix}
                            stepIndex={index}
                            nodePositions={nodePositions}
                            setNodePositions={setNodePositions}
                          />
                        </div>
                        <div>
                          <h4 className="font-poppins text-lg font-semibold mb-3 text-gray-800">Matrice D_{step.k}</h4>
                          <table className="border-collapse rounded-lg overflow-hidden shadow-md">
                            <tbody>
                              {step.matrix.map((ligne, i) => (
                                <tr key={i} className={i % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                                  {ligne.map((valeur, j) => (
                                    <td key={j} className="font-poppins border border-gray-200 p-3 text-center">
                                      {valeur === Number.POSITIVE_INFINITY ? (
                                        <span className="text-red-600">+∞</span>
                                      ) : (
                                        valeur
                                      )}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-poppins text-lg font-semibold mb-3 text-gray-800">Calculs W{step.k}</h4>
                          {step.W.map((w, wIndex) => (
                            <div key={wIndex} className="font-poppins flex items-center gap-3 mb-2">
                              <span className="font-medium">{w.formula}</span>
                              <ArrowRight className="text-orange-500" size={18} />
                            </div>
                          ))}
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-poppins text-lg font-semibold mb-3 text-gray-800">Calculs V{step.k}</h4>
                          {step.V.map((v, vIndex) => (
                            <div key={vIndex} className="font-poppins mb-2">
                              <span className="font-medium">{v.formula}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                className="card"
              >
                <h2 className="font-poppins text-3xl font-bold text-gray-800 mb-6">Résultats de Calcul</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="flex flex-col gap-4">
                    <h3 className="font-poppins text-xl font-semibold text-gray-800">Matrice finale</h3>
                    {finalMatrix.length > 0 ? (
                      <table className="border-collapse rounded-lg overflow-hidden shadow-lg">
                        <thead>
                          <tr style={{ background: "linear-gradient(to right, var(--blue-500), var(--cyan-500))" }}>
                            <th className="font-poppins p-3 text-white"></th>
                            {Array.from({ length: finalMatrix.length }, (_, i) => (
                              <th key={i} className="font-poppins p-3 text-white">
                                {i + 1}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {finalMatrix.map((ligne, i) => (
                            <tr key={i} className={i % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                              <td
                                className="font-poppins p-3 font-medium text-white"
                                style={{ background: "linear-gradient(to right, var(--blue-500), var(--cyan-500))" }}
                              >
                                {i + 1}
                              </td>
                              {ligne.map((valeur, j) => (
                                <td key={j} className="font-poppins p-3 text-center">
                                  {valeur === Number.POSITIVE_INFINITY ? (
                                    <span className="text-red-600">+∞</span>
                                  ) : (
                                    valeur
                                  )}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className="font-poppins text-gray-600">
                        Aucune matrice finale à afficher. Veuillez effectuer un calcul.
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-4">
                    <h3 className="font-poppins text-xl font-semibold text-gray-800">Chemins optimaux</h3>
                    {finalMatrix.length > 0 ? (
                      renderOptimalMatrix()
                    ) : (
                      <p className="font-poppins text-gray-600">
                        Aucune matrice des chemins optimaux à afficher. Veuillez effectuer un calcul.
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 1 }}
                className="card"
              >
                <h2 className="font-poppins text-xl font-semibold mb-4 text-gray-800">Graphe des chemins optimaux</h2>
                {optimalNodes.length > 0 ? (
                  <div style={{ width: "100%", height: "350px" }} className="border border-gray-200 rounded-lg">
                    <ReactFlow
                      nodes={optimalNodes}
                      edges={optimalEdges}
                      onNodesChange={onOptimalNodesChange}
                      onEdgesChange={onOptimalEdgesChange}
                      fitView
                    >
                      <Background color="#f0f0f0" gap={16} />
                      <Controls />
                    </ReactFlow>
                  </div>
                ) : (
                  <p className="font-poppins text-gray-600">
                    Aucun graphe des chemins optimaux à afficher. Veuillez effectuer un calcul.
                  </p>
                )}
              </motion.div>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  )
}
