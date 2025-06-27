// src/lib/logiqueMini.js
export async function MinDemoucron(formData) {
  const { methode, matrice, nbrMatrice } = formData

  if (!methode) {
    return { 
      steps: [], 
      finalMatrix: [], 
      predecessors: [], 
      optimalPaths: {}, 
      error: "Veuillez sélectionner une méthode (min ou max)." 
    }
  }
  
  if (nbrMatrice <= 0 || !matrice || matrice.length !== nbrMatrice || matrice[0].length !== nbrMatrice) {
    return { 
      steps: [], 
      finalMatrix: [], 
      predecessors: [], 
      optimalPaths: {}, 
      error: "Matrice invalide ou nombre de matrices incorrect." 
    }
  }

  const currentMatrix = matrice.map(row => [...row])
  const steps = []
  const predecessors = Array.from({ length: nbrMatrice }, (_, i) =>
    Array.from({ length: nbrMatrice }, (_, j) => (currentMatrix[i][j] !== Infinity && i !== j ? i : -1))
  )

  for (let k = 2; k <= nbrMatrice - 1; k++) {
    const W = []
    const V = []
    const kIdx = k - 1

    const verticesToK = []
    for (let i = 1; i <= nbrMatrice; i++) {
      const iIdx = i - 1
      if (i !== k && currentMatrix[iIdx][kIdx] !== Infinity) {
        verticesToK.push(i)
      }
    }

    const verticesFromK = []
    for (let j = 1; j <= nbrMatrice; j++) {
      const jIdx = j - 1
      if (j !== k && currentMatrix[kIdx][jIdx] !== Infinity) {
        verticesFromK.push(j)
      }
    }

    for (const i of verticesToK) {
      for (const j of verticesFromK) {
        const iIdx = i - 1
        const jIdx = j - 1

        const V_ik = currentMatrix[iIdx][kIdx]
        const V_kj = currentMatrix[kIdx][jIdx]
        let W_value

        if (V_ik === Infinity || V_kj === Infinity) {
          W_value = Infinity
        } else {
          W_value = V_ik + V_kj
        }

        W.push({
          i,
          j,
          value: W_value,
          formula: `W_${i}${j}^(${k-1}) = V_${i}${k}^(${k-1}) + V_${k}${j}^(${k-1}) = ${V_ik === Infinity ? "+∞" : V_ik} + ${V_kj === Infinity ? "+∞" : V_kj} = ${W_value === Infinity ? "+∞" : W_value}`
        })

        const V_ij = currentMatrix[iIdx][jIdx]
        const new_V_value = methode === "min" ? Math.min(W_value, V_ij) : Math.max(W_value, V_ij)

        V.push({
          i,
          j,
          value: new_V_value,
          formula: `V_${i}${j}^(${k}) = ${methode === "min" ? "MIN" : "MAX"}(W_${i}${j}^(${k-1}}, V_${i}${j}^(${k-1})) = ${methode === "min" ? "MIN" : "MAX"}(${W_value === Infinity ? "+∞" : W_value}, ${V_ij === Infinity ? "+∞" : V_ij}) = ${new_V_value === Infinity ? "+∞" : new_V_value}`
        })

        if ((methode === "min" && new_V_value < currentMatrix[iIdx][jIdx]) ||
            (methode === "max" && new_V_value > currentMatrix[iIdx][jIdx])) {
          currentMatrix[iIdx][jIdx] = new_V_value
          predecessors[iIdx][jIdx] = predecessors[kIdx][jIdx]
        }
      }
    }

    const matrixCopy = currentMatrix.map(row => [...row])
    steps.push({ k, W, V, matrix: matrixCopy })
  }

  // Construire les chemins optimaux en partant de la dernière colonne
  const optimalPaths = {}

  const findOptimalPathFromEnd = (end, start) => {
    const path = [end + 1]
    let currentCol = end

    while (currentCol >= 0) {
      let optimalValue = methode === "min" ? Infinity : -Infinity
      let optimalRow = -1

      for (let i = 0; i < nbrMatrice; i++) {
        if (i !== currentCol) {
          const value = currentMatrix[i][currentCol]
          if (methode === "min" && value < optimalValue) {
            optimalValue = value
            optimalRow = i
          } else if (methode === "max" && value > optimalValue && value !== Infinity) {
            optimalValue = value
            optimalRow = i
          }
        }
      }

      if (optimalRow === -1 || optimalValue === Infinity) break
      if (path.includes(optimalRow + 1)) break

      path.unshift(optimalRow + 1)
      if (start !== undefined && optimalRow === start) break
      currentCol = optimalRow
    }

    return path
  }

  const lastColumn = nbrMatrice - 1
  for (let i = 0; i < nbrMatrice; i++) {
    if (i !== lastColumn && currentMatrix[i][lastColumn] !== Infinity) {
      const path = findOptimalPathFromEnd(lastColumn, i)
      if (path.length > 1 && path[0] === i + 1) {
        optimalPaths[`${i + 1}-${lastColumn + 1}`] = path
      }
    }
  }

  return {
    steps,
    finalMatrix: currentMatrix,
    predecessors,
    optimalPaths
  }
}
