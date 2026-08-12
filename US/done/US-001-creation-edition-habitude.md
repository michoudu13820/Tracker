---
type: user-story
id: US-001
titre: Création et édition d'une habitude
date: 2026-08-09
auteur: product-owner
statut: livrée
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

## Implémentation

Tous les scénarios ci-dessus sont couverts et testés (✅ 1 à 6).

### Fichiers créés
- `src/lib/domain/habits.ts` — validation du brouillon (`validateHabitDraft`), construction/lecture de `Frequency` (`draftToFrequency`, `frequencyToDraft`), libellé de fréquence (`describeFrequency`). Pur, testé.
- `src/lib/domain/habits.test.ts` — tests unitaires (12 cas) couvrant les scénarios 1, 2, 3, 5, 6.
- `src/routes/habitudes/HabitForm.svelte` — formulaire de création/édition (colocalisé, utilisé uniquement par cette route) : nom, emoji libre (scénario 4), bascule exclusive intervalle/jours de semaine (scénario 3), messages d'erreur (scénario 5).
- `src/routes/habitudes/HabitForm.test.ts` — tests de composant (@testing-library/svelte) couvrant les scénarios 1, 2, 3, 5, 6.

### Fichiers modifiés
- `src/routes/habitudes/+page.svelte` — remplace le placeholder : liste des habitudes (emoji + nom + fréquence lisible), bouton de création, clic sur une ligne pour éditer. Utilise `habitsStore` existant (aucune modification du store nécessaire, `upsert` couvrait déjà création et édition).
- `vite.config.ts` — ajout de `resolve.conditions: ['browser']` sous Vitest (requis pour que les tests de composants Svelte se montent côté client, sinon erreur `mount() is not available on the server`) + `test.setupFiles` pour enregistrer les matchers jest-dom.

### Fichier créé (infra tests)
- `src/lib/test/setup.ts` — importe `@testing-library/jest-dom/vitest` pour les matchers (`toHaveTextContent`, `toBeChecked`, `toHaveValue`…) utilisés par les tests de composants futurs.

### Comment tester manuellement
1. `npm run dev`, aller sur `/habitudes`.
2. Créer une habitude « Boire de l'eau » 💧 en mode intervalle = 2 jours → apparaît dans la liste avec « Tous les 2 jours ».
3. Créer une habitude « Yoga » 🧘 en mode jours de semaine (lundi, mercredi, vendredi) → apparaît avec « lundi, mercredi, vendredi ».
4. Essayer de valider sans nom, ou sans mode de fréquence → message d'erreur, rien n'est créé.
5. Cliquer sur une habitude existante → formulaire pré-rempli ; changer de mode ; enregistrer → la liste reflète les nouvelles valeurs (l'historique de complétion, stocké séparément par `completionsStore`, n'est jamais touché par cette action).

### Hypothèses produit tranchées (à valider si besoin)
- **Ancrage de l'intervalle (`anchor`)** : non spécifié par l'US. Hypothèse retenue : l'ancrage est la date du jour à la création, et reste inchangé en édition (sauf si l'habitude n'avait pas de fréquence intervalle avant) — pour ne pas décaler rétroactivement les occurrences déjà cochées.
- **Validité minimale du mode "jours de semaine"** : l'US ne précise pas explicitement qu'il faut au moins un jour coché pour valider (seul « avoir choisi l'un des deux modes » est mentionné). Hypothèse : un mode « jours de semaine » sans aucun jour sélectionné est traité comme incomplet et bloque la validation (cohérent avec l'esprit du scénario 5).
- **Suppression** : hors périmètre confirmé par l'US elle-même, non implémentée.
