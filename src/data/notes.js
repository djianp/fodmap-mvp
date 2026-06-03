// Seed content for the Notes tab. Inserted once per user when their `notes` table is empty
// (see seedNotes / useNotes in src/lib/user-data.js). After seeding, notes are fully editable
// in-app, so editing this array later won't touch notes that already exist in the database.
export const NOTES = [
  {
    title: 'Le gras',
    content: `Pour faire attention pendant 1 à 2 jours et reposer votre estomac, il est très utile de comprendre la distinction majeure entre les FODMAPs et les graisses :

> **Les FODMAPs sont exclusivement des glucides** (des sucres et des fibres). Le gras (les lipides) ne contient **aucun FODMAP**.

C'est pour cela que de nombreux aliments 100 % gras (comme les huiles ou le beurre) sont totalement autorisés dans la phase stricte du régime FODMAP. Cependant, comme vous l'avez expérimenté, **le gras ralentit fortement la digestion** et peut surcharger l'estomac indépendamment des FODMAPs.

Pour votre diète "repos" de 48 heures, voici où se cache le gras dans le monde du low-FODMAP et ce que vous devez surveiller :

---

## 1. Les aliments Low-FODMAP mais TRÈS riches en gras (À limiter ou éviter pendant 2 jours)

Ce sont des aliments parfaits pour le régime FODMAP, mais qui demandent un gros effort de digestion à votre estomac :

* **Les oléagineux :** Les amandes (que vous consommez beaucoup), les pignons de pin, les noix, les cacahuètes et les graines (girasol, courge). Même s'ils sont validés côté FODMAPs, ils sont composés à plus de 50 % de lipides.
* **Certains fruits low-FODMAP :** L'avocat (un avocat entier apporte environ 15g à 20g de graisse) et la noix de coco (lait de coco, crème de coco).
* **Les huiles et matières grasses pures :** L'huile d'olive (même infusée à l'ail), l'huile de tournesol, le beurre et la margarine. Ils ne contiennent aucun FODMAP mais sont de l'or noir pour l'estomac en période de fatigue digestive.
* **Les protéines animales grasses :**
    * Les poissons gras (saumon, maquereau, sardines, thon rouge).
    * Les viandes grasses (porc, agneau, cuisses de poulet avec la peau, canard, charcuteries autorisées comme le bacon ou le jambon cru).
* **Les produits laitiers autorisés (pauvres en lactose) :** Les fromages à pâte dure (Comté, Parmesan, cheddar) ne contiennent pas de lactose mais restent très riches en matières grasses animales. Il en va de même pour la crème fraîche sans lactose ou le beurre.

---

## 2. Les aliments Low-FODMAP et PAUVRES en gras (Votre priorité pour les prochaines 48h)

Pour garantir des nuits parfaites et un réveil à 100 %, votre panier pour les deux prochains jours doit se concentrer sur des aliments qui combinent **zéro FODMAP** et **zéro graisse** :

* **Les protéines ultra-maigres :**
    * Le blanc de poulet ou de dinde (sans la peau, cuit sans matière grasse).
    * Les poissons blancs (cabillaud, colin, lieu, dorade, sole) cuits vapeur ou papillote. Ils contiennent moins de 1 % de matières grasses.
    * Les œufs (au plat sans huile, pochés, ou coque. Évitez les œufs brouillés noyés dans le beurre).
* **Les féculents faciles :**
    * Le riz blanc (Basmati ou Jasmin), qui ne contient aucune graisse et s'assimile très vite.
    * Les pommes de terre (sans la peau, cuites à l'eau ou à la vapeur, sans ajout de beurre ou d'huile).
    * Le quinoa bien cuit.
* **Les légumes cuits et légers :**
    * Les carottes cuites (zéro gras, ultra-douces).
    * Les courgettes cuites (en portion normale et sans la peau si vous voulez être encore plus doux avec vos intestins).
    * Les pousses d'épinards cuites.

---

## 🛠️ Votre stratégie pour les prochains repas

Pendant 1 à 2 jours, l'objectif n'est pas de supprimer totalement le gras (votre corps en a besoin), mais de le descendre au strict minimum.

1. **En cuisine :** Utilisez une poêle antiadhésive ou une cuisson vapeur/papillote/bain-marie pour cuisiner avec **zéro goutte d'huile ou de beurre**.
2. **Mettez de côté :** Stoppez temporairement les amandes, les avocats, le fromage et le saumon.
3. **Réintroduisez le saumon doucement :** Si vous faites votre assiette idéale (saumon bain-marie, courgettes, riz blanc), le saumon sera la seule source de gras de votre repas. C'est parfait, car ce gras sera isolé et non cumulé avec d'autres lipides.

On part sur ça pour les prochaines 48 heures pour remettre le compteur à zéro ?`,
  },
]
