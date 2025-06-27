// src/lib/logiqueMax.js

export async function MaxDemoucron(formData) {
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
        const new_V_value = methode === "max" ? Math.max(W_value, V_ij) : Math.min(W_value, V_ij)

        V.push({
          i,
          j,
          value: new_V_value,
          formula: `V_${i}${j}^(${k}) = ${methode === "max" ? "MAX" : "MIN"}(W_${i}${j}^(${k-1}), V_${i}${j}^(${k-1})) = ${methode === "max" ? "MAX" : "MIN"}(${W_value === Infinity ? "+∞" : W_value}, ${V_ij === Infinity ? "+∞" : V_ij}) = ${new_V_value === Infinity ? "+∞" : new_V_value}`
        })

        if ((methode === "max" && new_V_value > currentMatrix[iIdx][jIdx]) ||
            (methode === "min" && new_V_value < currentMatrix[iIdx][jIdx])) {
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

  const findOptimalPathFromLastColumn = () => {
    const path = []
    let currentCol = nbrMatrice - 1 // Dernière colonne

    while (currentCol >= 0) {
      let optimalValue = methode === "max" ? -Infinity : Infinity
      let optimalRow = -1

      // Chercher la valeur optimale dans la colonne actuelle
      for (let i = 0; i < nbrMatrice; i++) {
        if (i !== currentCol) {
          const value = currentMatrix[i][currentCol]
          if (methode === "max" && value > optimalValue && value !== Infinity) {
            optimalValue = value
            optimalRow = i
          } else if (methode === "min" && value < optimalValue) {
            optimalValue = value
            optimalRow = i
          }
        }
      }

      if (optimalRow === -1 || optimalValue === Infinity) break
      if (path.includes(optimalRow + 1)) break // Éviter les boucles

      path.unshift(optimalRow + 1) // Ajouter le sommet au début du chemin
      currentCol = optimalRow // Passer à la colonne correspondant à la ligne optimale
    }

    // Ajouter la dernière colonne au chemin
    path.push(nbrMatrice)
    return path
  }

  // Calculer le chemin optimal unique à partir de la dernière colonne
  const optimalPath = findOptimalPathFromLastColumn()
  if (optimalPath.length > 1) {
    // Stocker le chemin dans optimalPaths avec la clé "1-n" (du premier au dernier sommet)
    optimalPaths[`1-${nbrMatrice}`] = optimalPath
  }

  return {
    steps,
    finalMatrix: currentMatrix,
    predecessors,
    optimalPaths
  }
}
