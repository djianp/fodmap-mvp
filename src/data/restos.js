// Seed data — initial restaurants. In Phase C this becomes a one-time
// client-side seed into Supabase the first time a user logs in with no rows.
export const RESTOS = [
  {
    id: "r1", nom: "Bistrot Paul-Bert",
    adresse: "18 rue Paul Bert, 75011",
    distance_bureau: 0.8, distance_domicile: 1.4,
    phone: "+33143727624",
    rating: 4.8, takeaway: false,
    meals: [
      { nom: "Bar de ligne vapeur, grenailles (26€)", proteine: "bar", rating: 5.0,
        comment: "Demander : sans ail dans les pommes de terre, sauce à part." },
      { nom: "Poulet fermier rôti, purée maison (22€)", proteine: "poulet", rating: 4.5,
        comment: "Demander : poulet sans peau, purée sans oignon." },
    ]
  },
  {
    id: "r2", nom: "Sushi Shop République",
    adresse: "12 bd du Temple, 75011",
    distance_bureau: 1.2, distance_domicile: 0.6,
    phone: "+33140210012",
    rating: 4.6, takeaway: true,
    meals: [
      { nom: "Poke bowl saumon, riz blanc (17€)", proteine: "poke", rating: 4.7,
        comment: "Demander : sans edamame, sans sauce soja sucrée, gingembre OK." },
      { nom: "Sushi saumon × 12 sans avocat (19€)", proteine: "sushi", rating: 4.5,
        comment: "Éviter maki California (fructose)." },
    ]
  },
  {
    id: "r3", nom: "Le Saint-Germain",
    adresse: "45 rue de Seine, 75006",
    distance_bureau: 2.6, distance_domicile: 3.1,
    phone: "+33143269012",
    rating: 4.7, takeaway: false,
    meals: [
      { nom: "Filet de bar vapeur, légumes verts (24€)", proteine: "bar", rating: 4.8,
        comment: "Demander : légumes sans ail/oignon, citron à part." },
      { nom: "Saumon cuit lentement, purée céleri (25€)", proteine: "saumon cuit", rating: 4.7,
        comment: "Demander : sans beurre noisette." },
    ]
  },
  {
    id: "r4", nom: "Côté Sushi",
    adresse: "28 rue du Louvre, 75002",
    distance_bureau: 0.4, distance_domicile: 2.9,
    phone: "+33142364578",
    rating: 4.4, takeaway: true,
    meals: [
      { nom: "Poke saumon cuit, riz complet (16€)", proteine: "poke", rating: 4.6,
        comment: "Sans mangue, sans maïs — remplacer par concombre." },
      { nom: "Sushi saumon + crevette, 10 pces (18€)", proteine: "sushi", rating: 4.3,
        comment: "" },
    ]
  },
  {
    id: "r5", nom: "Le Clocher Pereire",
    adresse: "42 bd Pereire, 75017",
    distance_bureau: 3.8, distance_domicile: 0.3,
    phone: "+33147660812",
    rating: 4.5, takeaway: false,
    meals: [
      { nom: "Suprême de poulet vapeur, riz (21€)", proteine: "poulet", rating: 4.6,
        comment: "Demander : riz blanc à part, sans sauce crémée." },
      { nom: "Dos de bar grillé, grenailles (23€)", proteine: "bar", rating: 4.5,
        comment: "Sauce à part, sans ail dans les pommes de terre." },
    ]
  },
  {
    id: "r6", nom: "Poké Poké",
    adresse: "5 rue Montmartre, 75001",
    distance_bureau: 0.6, distance_domicile: 2.5,
    phone: "+33140280999",
    rating: 4.3, takeaway: true,
    meals: [
      { nom: "Poke saumon cuit, riz blanc, concombre (15€)", proteine: "poke", rating: 4.4,
        comment: "Sauce à part, sans mangue/maïs, edamame à retirer." },
    ]
  },
  {
    id: "r7", nom: "Le Bar à Huîtres",
    adresse: "33 bd Raspail, 75007",
    distance_bureau: 4.1, distance_domicile: 2.2,
    phone: "+33144075646",
    rating: 4.6, takeaway: false,
    meals: [
      { nom: "Bar entier grillé, pommes vapeur (26€)", proteine: "bar", rating: 4.8,
        comment: "Demander : sans beurre d'ail, citron à part." },
      { nom: "Pavé de saumon à l'unilatérale (24€)", proteine: "saumon cuit", rating: 4.5,
        comment: "Accompagnement riz au lieu des légumes crus." },
    ]
  },
  {
    id: "r8", nom: "Sushi Gourmet",
    adresse: "88 av. des Champs-Élysées, 75008",
    distance_bureau: 2.8, distance_domicile: 3.5,
    phone: "+33142896521",
    rating: 4.5, takeaway: true,
    meals: [
      { nom: "Sushi saumon/thon, 12 pces (20€)", proteine: "sushi", rating: 4.6,
        comment: "Éviter sauces sucrées type teriyaki." },
      { nom: "Chirashi saumon cuit (22€)", proteine: "saumon cuit", rating: 4.4,
        comment: "Sans avocat, sans graines de sésame si possible." },
    ]
  },
];

export const PROTEINES = ["Toutes", "poulet", "saumon cuit", "bar", "poke", "sushi"];
