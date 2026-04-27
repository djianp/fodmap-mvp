// Seed data — restaurant inserted into Supabase the first time a user logs in
// with no rows. Each entry holds Google Place metadata so the new map can show
// pins and the distance pill can deep-link to Google Maps.
export const RESTOS = [
  {
    id: "r1", nom: "Bistrot Paul-Bert",
    adresse: "18 rue Paul Bert, 75011",
    place_id: "ChIJnYPdmaZz5kcR80ulUF3wtjQ",
    lat: 48.8522102, lng: 2.3850177,
    walk_min_bureau: 67, walk_min_domicile: 128,
    phone: "+33143727624",
    rating: 4.8, takeaway: false,
    meals: [
      { nom: "Bar de ligne vapeur, grenailles (26€)", proteine: "bar", rating: 5.0,
        comment: "Demander : sans ail dans les pommes de terre, sauce à part." },
      { nom: "Poulet fermier rôti, purée maison (22€)", proteine: "poulet", rating: 4.5,
        comment: "Demander : poulet sans peau, purée sans oignon." },
    ]
  },
];

export const PROTEINES = ["Toutes", "poulet", "saumon cuit", "bar", "poke", "sushi"];
