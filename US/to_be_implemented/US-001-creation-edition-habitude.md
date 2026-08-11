---
type: user-story
id: US-001
titre: Création et édition d'une habitude
date: 2026-08-09
auteur: product-owner
statut: prête
priorite: Must
estimation: M
source: chat
depend_de: []
---

## Titre : US-001 — Création et édition d'une habitude

### Récit
> **En tant qu'** utilisateur de l'app,
> **je veux** créer et modifier une habitude en renseignant un nom, un emoji et une fréquence de répétition,
> **afin de** définir précisément les habitudes récurrentes que je souhaite suivre au quotidien.

### Critères d'acceptation

**Scénario 1 — Création avec fréquence par intervalle de jours**
> **Étant donné** je suis sur l'écran de création d'une habitude
> **Quand** je saisis un nom « Boire de l'eau », un emoji « 💧 », que je choisis le mode « intervalle en jours » et que je saisis « 2 »
> **Et** je valide la création
> **Alors** l'habitude est enregistrée avec ce nom, cet emoji et la fréquence « tous les 2 jours »
> **Et** elle apparaît dans la liste des habitudes avec son emoji et son nom affichés

**Scénario 2 — Création avec fréquence par jours de la semaine**
> **Étant donné** je suis sur l'écran de création d'une habitude
> **Quand** je saisis un nom « Yoga », un emoji « 🧘 », que je choisis le mode « jours de la semaine » et que je sélectionne lundi, mercredi, vendredi
> **Et** je valide la création
> **Alors** l'habitude est enregistrée avec ce nom, cet emoji et la fréquence « lundi, mercredi, vendredi »

**Scénario 3 — Exclusivité des deux modes de fréquence**
> **Étant donné** je suis en train de créer une habitude et j'ai déjà renseigné le mode « intervalle en jours »
> **Quand** je bascule vers le mode « jours de la semaine »
> **Alors** la valeur d'intervalle précédemment saisie est réinitialisée ou masquée
> **Et** un seul mode de fréquence est actif à la fois : il est impossible d'enregistrer une habitude avec les deux modes renseignés simultanément

**Scénario 4 — Saisie libre de l'emoji**
> **Étant donné** je suis sur l'écran de création d'une habitude
> **Quand** je saisis ou colle n'importe quel caractère emoji dans le champ dédié
> **Alors** le caractère est accepté et associé à l'habitude, sans contrôle contre une liste prédéfinie fermée

**Scénario 5 — Champs obligatoires manquants**
> **Étant donné** je suis sur l'écran de création d'une habitude
> **Quand** je tente de valider sans avoir renseigné de nom, ou sans avoir choisi l'un des deux modes de fréquence
> **Alors** la création est bloquée
> **Et** un message m'indique le ou les champs manquants

**Scénario 6 — Édition d'une habitude existante**
> **Étant donné** une habitude « Marcher » existe déjà avec une fréquence par jours de semaine
> **Quand** je modifie son nom, son emoji, ou que je bascule vers le mode « intervalle en jours » avec une nouvelle valeur
> **Et** je valide les modifications
> **Alors** les nouvelles valeurs remplacent les anciennes
> **Et** les jours déjà cochés dans le passé pour cette habitude restent inchangés dans l'historique

### Priorité
Must (socle du MVP : sans habitude créée, aucune autre US n'a de contenu à afficher)

### Estimation
M

### Dépendances
Aucune

### Notes / hors périmètre
- La suppression d'une habitude n'est pas couverte par cette US (à clarifier/spécifier séparément si besoin).
- Aucune limite de nombre d'habitudes n'est spécifiée ici.
- Aucune gestion de catégories, tags ou couleurs personnalisées au-delà de l'emoji n'est couverte.
- Le rendu visuel exact de l'emoji selon les plateformes n'est pas un critère de cette US (dépend du rendu système).
