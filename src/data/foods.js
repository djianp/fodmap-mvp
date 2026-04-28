export const FOODS = [
  // Féculents
  { id: "riz-noir", nom: "Riz Noir (Artémide/Nerone)", cat: "Féculents", midi: "green", soir: "green", note: "10/10", fodmap: "Complet, anthocyanes. Stabilise la glycémie nocturne.", contrainte: null, tags: ["élite", "sommeil"] },
  { id: "kasha", nom: "Kasha (Sarrasin grillé)", cat: "Féculents", midi: "green", soir: "green", note: "9.3/10", fodmap: "Riche en magnésium. Cuisson 10 min.", contrainte: null, tags: ["détente"] },
  { id: "sarrasin-blanc", nom: "Sarrasin Blanc", cat: "Féculents", midi: "green", soir: "green", note: "9/10", fodmap: "Riche en rutine (vasculaire). À toaster à la poêle.", contrainte: null, tags: [] },
  { id: "grenailles", nom: "Pommes de terre / Grenailles", cat: "Féculents", midi: "green", soir: "green", note: "9/10", fodmap: "Vapeur ou four. Zéro fermentation.", contrainte: "Éviter la friture", tags: ["sécurité"] },
  { id: "patate-douce", nom: "Patate Douce", cat: "Féculents", midi: "amber", soir: "amber", note: "7.3/10", fodmap: "Mannitol. En purée, glycémie plus rapide.", contrainte: "Max 75g, préférer midi", tags: ["75g"] },
  { id: "pain-epeautre", nom: "Pain d'Épeautre au levain", cat: "Féculents", midi: "green", soir: "green", note: "8/10", fodmap: "Levain prédigère les fructanes.", contrainte: "Max 2 tranches, uniquement au levain", tags: [] },
  { id: "pain-epeautre-industriel", nom: "Pain d'Épeautre industriel (levure)", cat: "Féculents", midi: "red", soir: "red", note: "2/10", fodmap: "Fructanes non prédigérés.", contrainte: null, tags: [] },
  { id: "frites", nom: "Frites", cat: "Féculents", midi: "red", soir: "red", note: "1/10", fodmap: "Graisses saturées, saboteur du sommeil.", contrainte: null, tags: ["saboteur"] },

  // Protéines
  { id: "saumon", nom: "Saumon", cat: "Protéines", midi: "green", soir: "green", note: "9.3/10", fodmap: "Oméga-3. Digestion légère.", contrainte: null, tags: ["cholestérol"] },
  { id: "truite", nom: "Truite", cat: "Protéines", midi: "green", soir: "green", note: "9.3/10", fodmap: "Oméga-3.", contrainte: null, tags: ["cholestérol"] },
  { id: "poulet", nom: "Poulet", cat: "Protéines", midi: "green", soir: "green", note: "9/10", fodmap: "Viande maigre.", contrainte: "Sans peau, sans ail/oignon", tags: [] },
  { id: "pain-de-viande", nom: "Pain de Viande", cat: "Protéines", midi: "amber", soir: "red", note: "4/10", fodmap: "Souvent ail + oignon + chapelure de blé.", contrainte: "Prudence — trifecta SIBO possible", tags: [] },

  // Légumes
  { id: "haricots-verts", nom: "Haricots Verts", cat: "Légumes", midi: "amber", soir: "amber", note: "7/10", fodmap: "Sorbitol.", contrainte: "Max 75g, attention ail/échalote au resto", tags: ["75g"] },
  { id: "brocoli", nom: "Brocoli", cat: "Légumes", midi: "amber", soir: "amber", note: "7/10", fodmap: "Fructanes (tiges surtout).", contrainte: "Max 75g, uniquement les têtes", tags: ["75g"] },
  { id: "celeri-rave", nom: "Céleri-Rave", cat: "Légumes", midi: "amber", soir: "amber", note: "7.5/10", fodmap: "Mannitol. Bon pour cholestérol.", contrainte: "Max 75g, éviter rémoulade industrielle", tags: ["75g", "cholestérol"] },
  { id: "carotte-puree", nom: "Purée de Carottes", cat: "Légumes", midi: "green", soir: "green", note: "9.3/10", fodmap: "Apaisant en cas de nœud intestinal.", contrainte: null, tags: ["apaisant"] },
  { id: "carotte-crue", nom: "Carottes râpées (crues)", cat: "Légumes", midi: "green", soir: "red", note: "8/10", fodmap: "OK midi, trop lourd le soir.", contrainte: "Midi uniquement", tags: ["cru"] },
  { id: "concombre", nom: "Concombre", cat: "Légumes", midi: "green", soir: "amber", note: "8/10", fodmap: "Low FODMAP.", contrainte: "Midi de préférence (cru lourd le soir)", tags: ["cru"] },
  { id: "laitue", nom: "Laitue / Mâche", cat: "Légumes", midi: "green", soir: "amber", note: "8/10", fodmap: "Low FODMAP.", contrainte: "Midi de préférence", tags: ["cru"] },
  { id: "radis", nom: "Radis", cat: "Légumes", midi: "green", soir: "red", note: "7/10", fodmap: "Cru lourd pour le soir.", contrainte: "Midi uniquement", tags: ["cru"] },
  { id: "tomates-roties", nom: "Tomates rôties", cat: "Légumes", midi: "green", soir: "green", note: "8.5/10", fodmap: "Fibres prédigérées par la chaleur.", contrainte: null, tags: [] },
  { id: "mais", nom: "Maïs", cat: "Légumes", midi: "red", soir: "red", note: "2/10", fodmap: "Sorbitol élevé, fermente vite.", contrainte: null, tags: [] },

  // Fruits
  { id: "banane-verte", nom: "Banane verte/ferme", cat: "Fruits", midi: "green", soir: "green", note: "8/10", fodmap: "Peu de fructanes.", contrainte: "Max 1 par jour", tags: [] },
  { id: "banane-mure", nom: "Banane mûre (taches noires)", cat: "Fruits", midi: "red", soir: "red", note: "2/10", fodmap: "Bombe à fructanes.", contrainte: null, tags: ["liste noire"] },
  { id: "myrtilles", nom: "Myrtilles", cat: "Fruits", midi: "green", soir: "green", note: "9/10", fodmap: "Low FODMAP.", contrainte: null, tags: [] },
  { id: "framboises", nom: "Framboises", cat: "Fruits", midi: "green", soir: "green", note: "9/10", fodmap: "Low FODMAP.", contrainte: null, tags: [] },
  { id: "ananas", nom: "Ananas", cat: "Fruits", midi: "green", soir: "green", note: "9/10", fodmap: "Bromélaïne — aide à digérer les protéines.", contrainte: null, tags: [] },
  { id: "mangue", nom: "Mangue", cat: "Fruits", midi: "red", soir: "red", note: "2/10", fodmap: "Fructose élevé. Perturbe le sommeil.", contrainte: null, tags: ["liste noire"] },
  { id: "beurre-cacahuete", nom: "Beurre de cacahuète 100% pur", cat: "Fruits", midi: "green", soir: "green", note: "8.5/10", fodmap: "Cholestérol + satiété.", contrainte: "Uniquement 100% pur (type Rapunzel)", tags: ["cholestérol"] },
  { id: "muffins", nom: "Muffins maison (bananes mûres + blé)", cat: "Fruits", midi: "red", soir: "red", note: "2/10", fodmap: "Bananes mûres + farine de blé.", contrainte: "À éviter en phase de crise", tags: [] },
  { id: "speculoos", nom: "Spéculoos", cat: "Fruits", midi: "red", soir: "red", note: "1/10", fodmap: "Sucre + blé.", contrainte: null, tags: ["saboteur"] },

  // Condiments
  { id: "ail", nom: "Ail", cat: "Condiments", midi: "red", soir: "red", note: "0/10", fodmap: "Ennemi public n°1 du SIBO.", contrainte: "À bannir, même en poudre", tags: ["liste noire"] },
  { id: "oignon", nom: "Oignon", cat: "Condiments", midi: "red", soir: "red", note: "0/10", fodmap: "Ennemi public n°1 du SIBO.", contrainte: null, tags: ["liste noire"] },
  { id: "echalote", nom: "Échalote", cat: "Condiments", midi: "red", soir: "red", note: "0/10", fodmap: "Même famille que l'oignon.", contrainte: null, tags: ["liste noire"] },
  { id: "huile-olive", nom: "Huile d'Olive", cat: "Condiments", midi: "green", soir: "green", note: "10/10", fodmap: "Allié cholestérol + satiété.", contrainte: null, tags: ["cholestérol"] },
  { id: "citron", nom: "Citron / Yuzu", cat: "Condiments", midi: "green", soir: "green", note: "9/10", fodmap: "Stimule CMM et foie.", contrainte: null, tags: [] },
  { id: "gingembre", nom: "Gingembre", cat: "Condiments", midi: "green", soir: "green", note: "9/10", fodmap: "Stimule digestion.", contrainte: null, tags: [] },
  { id: "ketchup", nom: "Ketchup", cat: "Condiments", midi: "red", soir: "red", note: "2/10", fodmap: "Sucre + oignon souvent.", contrainte: null, tags: [] },
  { id: "mayonnaise", nom: "Mayonnaise industrielle", cat: "Condiments", midi: "red", soir: "red", note: "2/10", fodmap: "Graisses saturées.", contrainte: "Préférer huile + citron", tags: [] }
];
