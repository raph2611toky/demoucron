// Types pour les données du formulaire
export const createFormData = (methode = "", matrice = [], nbrMatrice = 0) => ({
  methode,
  matrice,
  nbrMatrice
})

// Types pour les détails des étapes
export const createStepDetail = (i, j, value, formula) => ({
  i,
  j,
  value,
  formula
})

// Types pour les étapes
export const createStep = (k, W = [], V = [], matrix = []) => ({
  k,
  W,
  V,
  matrix
})

// Types pour les positions des nœuds
export const createNodePosition = (x, y) => ({
  x,
  y
})
