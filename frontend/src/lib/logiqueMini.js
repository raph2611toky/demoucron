export async function MinDemoucron(formData) {
  const { methode, matrice, nbrMatrice } = formData;

  if (!methode || methode !== "min" || nbrMatrice <= 0 || !matrice || matrice.length !== nbrMatrice || matrice.some(row => row.length !== nbrMatrice)) {
    return {
      steps: [],
      finalMatrix: [],
      predecessors: [],
      optimalPaths: {},
      error: "Données d'entrée invalides."
    };
  }

  const currentMatrix = matrice.map(row => [...row]);
  const steps = [];

  const predecessors = Array.from({ length: nbrMatrice }, () =>
    Array(nbrMatrice).fill(-1)
  );

  // Initialiser les prédécesseurs pour les arêtes directes
  for (let i = 0; i < nbrMatrice; i++) {
    for (let j = 0; j < nbrMatrice; j++) {
      if (i !== j && currentMatrix[i][j] !== null && currentMatrix[i][j] !== Infinity) {
        predecessors[i][j] = i;
      }
    }
  }

  steps.push({
    k: 0,
    W: [],
    V: [],
    matrix: matrice.map(row => [...row]),
    description: "Matrice initiale"
  });

  // Demoucron : on ne prend pas k = 0 ni k = n - 1
  for (let k = 1; k < nbrMatrice - 1; k++) {
    const W = [];
    const V = [];

    for (let i = 0; i < nbrMatrice; i++) {
      for (let j = 0; j < nbrMatrice; j++) {
        if (i === j || currentMatrix[i][k] === Infinity || currentMatrix[k][j] === Infinity) continue;

        const direct = currentMatrix[i][j];
        const viaK = currentMatrix[i][k] + currentMatrix[k][j];
        const newValue = Math.min(direct, viaK);

        W.push({
          i: i + 1,
          j: j + 1,
          value: viaK,
          formula: `W_${i + 1}${j + 1}^(${k}) = V_${i + 1}${k + 1}^(${k}) + V_${k + 1}${j + 1}^(${k}) = ${currentMatrix[i][k]} + ${currentMatrix[k][j]} = ${viaK}`
        });

        if (newValue < direct) {
          currentMatrix[i][j] = newValue;
          predecessors[i][j] = predecessors[k][j];
        }

        V.push({
          i: i + 1,
          j: j + 1,
          value: newValue,
          formula: `V_${i + 1}${j + 1}^(${k + 1}) = MIN(W_${i + 1}${j + 1}^(${k}), V_${i + 1}${j + 1}^(${k})) = MIN(${viaK}, ${direct}) = ${newValue}`
        });
      }
    }

    steps.push({
      k: k + 1,
      W,
      V,
      matrix: currentMatrix.map(row => [...row])
    });
  }

  // Reconstruction des chemins uniquement depuis le sommet initial (nœud 0)
  const getPath = (start, end) => {
    if (currentMatrix[start][end] === Infinity || predecessors[start][end] === -1) return [];
    const path = [];
    let current = end;

    while (current !== start) {
      if (path.includes(current + 1)) return []; // éviter les boucles
      path.unshift(current + 1);
      current = predecessors[start][current];
      if (current === -1) return [];
    }

    path.unshift(start + 1);
    return path;
  };

  const optimalPaths = {};
  const start = 0;
  for (let end = 0; end < nbrMatrice; end++) {
    if (start !== end && currentMatrix[start][end] !== Infinity) {
      const path = getPath(start, end);
      if (path.length > 1 && end === nbrMatrice-1) {
        optimalPaths[`${start + 1}-${end + 1}`] = path;
      }
    }
  }


  return {
    steps,
    finalMatrix: currentMatrix,
    predecessors,
    optimalPaths,
    method: methode
  };
}
