// src/lib/logiqueMax.js

export async function MaxDemoucron(formData) {
  const { methode, matrice, nbrMatrice } = formData;

  if (!methode || methode !== "max" || nbrMatrice <= 0 || !matrice || matrice.length !== nbrMatrice || matrice.some(row => row.length !== nbrMatrice)) {
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

  // Initialiser les prédécesseurs comme des listes pour stocker plusieurs prédécesseurs possibles
  const predecessors = Array.from({ length: nbrMatrice }, () =>
    Array.from({ length: nbrMatrice }, () => [])
  );

  // Définir les prédécesseurs initiaux pour les arêtes directes
  for (let i = 0; i < nbrMatrice; i++) {
    for (let j = 0; j < nbrMatrice; j++) {
      if (i !== j && currentMatrix[i][j] !== null && currentMatrix[i][j] !== Infinity) {
        predecessors[i][j].push(i);
      }
    }
  }
  console.log("Initial predecessors:", predecessors);

  steps.push({
    k: 0,
    W: [],
    V: [],
    matrix: matrice.map(row => [...row]),
    description: "Matrice initiale"
  });

  for (let k = 0; k < nbrMatrice; k++) {
    const W = [];
    const V = [];

    for (let i = 0; i < nbrMatrice; i++) {
      for (let j = 0; j < nbrMatrice; j++) {
        if (i === j || currentMatrix[i][k] === Infinity || currentMatrix[k][j] === Infinity) continue;

        const direct = currentMatrix[i][j] === null || currentMatrix[i][j] === Infinity ? -Infinity : currentMatrix[i][j];
        const viaK = currentMatrix[i][k] + currentMatrix[k][j];

        W.push({
          i: i + 1,
          j: j + 1,
          value: viaK,
          formula: `W_${i + 1}${j + 1}^(${k + 1}) = V_${i + 1}${k + 1}^(${k + 1}) + V_${k + 1}${j + 1}^(${k + 1}) = ${currentMatrix[i][k]} + ${currentMatrix[k][j]} = ${viaK}`
        });

        if (viaK > direct) {
          currentMatrix[i][j] = viaK;
          predecessors[i][j] = [...predecessors[k][j]];
        } else if (viaK === direct && viaK !== -Infinity) {
          predecessors[i][j] = [...new Set([...predecessors[i][j], ...predecessors[k][j]])];
        }

        V.push({
          i: i + 1,
          j: j + 1,
          value: currentMatrix[i][j],
          formula: `V_${i + 1}${j + 1}^(${k + 1}) = MAX(W_${i + 1}${j + 1}^(${k + 1}), V_${i + 1}${j + 1}^(${k})) = MAX(${viaK}, ${direct === -Infinity ? "∞" : direct}) = ${currentMatrix[i][j] === Infinity ? "∞" : currentMatrix[i][j]}`
        });
      }
    }

    steps.push({
      k: k + 1,
      W,
      V,
      matrix: currentMatrix.map(row => [...row])
    });
    console.log(`Step ${k + 1} predecessors:`, predecessors);
  }

  // Fonction pour reconstruire les chemins optimaux
  const getAllPaths = (start, current, path = [], visited = new Set()) => {
    path = [...path, current];

    if (current === start) {
      return [path.reverse().map(node => node + 1)];
    }

    if (visited.has(current)) {
      return [];
    }

    visited.add(current);

    const paths = [];
    const preds = predecessors[start][current];

    console.log(`Exploring paths from ${start + 1} to ${current + 1}, predecessors:`, preds);

    for (const pred of preds) {
      const subPaths = getAllPaths(start, pred, path, new Set(visited));
      paths.push(...subPaths);
    }

    return paths;
  };

  const optimalPaths = {};
  let start = 0;
  for (let end = 0; end < nbrMatrice; end++) {
    if (start !== end && currentMatrix[start][end] !== Infinity) {
      const paths = getAllPaths(start, end);
      if (paths.length > 0 && end === nbrMatrice-1) {
        optimalPaths[`${start + 1}-${end + 1}`] = paths;
      }
    }
  }
  console.log("Final optimalPaths:", optimalPaths);

  return {
    steps,
    finalMatrix: currentMatrix,
    predecessors,
    optimalPaths,
    method: methode
  };
}