---
type: user-story
id: US-010
titre: Cards horizontales pleine largeur pour les listes de tâches et d'habitudes
date: 2026-08-12
auteur: product-owner
statut: livrée
priorite: Should
estimation: S
source: chat
depend_de: ["US-001", "US-002", "US-004"]
---

## Titre : US-010 — Cards horizontales pleine largeur pour les listes de tâches et d'habitudes

### Récit
> **En tant qu'** utilisateur de l'application,
> **je veux** que chaque tâche et chaque habitude affichée dans une liste (planning du jour,
> écran Habitudes, écran Tâches) soit présentée sous forme de carte horizontale occupant toute
> la largeur disponible de l'écran,
> **afin de** lire plus facilement les informations d'un coup d'œil et de disposer d'une zone
> de clic confortable, en particulier sur mobile (iPhone).

### Contexte (état actuel constaté dans le code)
Trois écrans affichent des listes d'éléments cliquables/cochables : le planning du jour (`/`,
habitudes + tâches), l'écran Habitudes (`/habitudes`) et l'écran Tâches (`/taches`). Les
rendus diffèrent légèrement selon l'écran (carte avec bordure colorée à gauche pour les
habitudes/tâches du planning et de l'écran Tâches, simple ligne cliquable pour l'écran
Habitudes), et leur largeur suit celle du conteneur central de la page (qui a lui-même une
largeur maximale et une marge intérieure). Le rendu horizontal pleine largeur n'est donc
aujourd'hui ni garanti visuellement identique, ni vérifié explicitement sur les trois écrans.

### Critères d'acceptation

> **Étant donné** le planning du jour (`/`) avec au moins une habitude prévue,
> **Quand** la liste des habitudes du jour s'affiche,
> **Alors** chaque habitude est présentée comme une seule carte horizontale occupant toute la
> largeur disponible de l'écran, sans espace horizontal inutilisé sur les côtés.

> **Étant donné** le planning du jour (`/`) avec au moins une tâche prévue,
> **Quand** la liste des tâches du jour s'affiche,
> **Alors** chaque tâche est présentée comme une carte horizontale pleine largeur, avec le
> même comportement de largeur que les cartes d'habitudes.

> **Étant donné** l'écran Habitudes (`/habitudes`) listant toutes les habitudes existantes,
> **Quand** la liste s'affiche,
> **Alors** chaque habitude est présentée comme une carte horizontale pleine largeur,
> visuellement cohérente avec les cartes du planning (mêmes proportions, mêmes arrondis).

> **Étant donné** l'écran Tâches (`/taches`) listant toutes les tâches existantes,
> **Quand** la liste s'affiche,
> **Alors** chaque tâche est présentée comme une carte horizontale pleine largeur, cohérente
> avec les autres écrans.

> **Étant donné** une habitude ou une tâche dont le nom est long,
> **Quand** elle s'affiche dans sa carte,
> **Alors** la mise en page de la carte ne se casse pas (le nom passe à la ligne ou est
> tronqué proprement) et les autres éléments de la carte (case à cocher, badge de statut,
> bouton d'action) restent alignés sur une disposition horizontale lisible.

- **Priorité** : Should
- **Estimation** : S
- **Dépendances** : US-001 (habitudes), US-002 (tâches), US-004 (planning) — écrans existants
  restylés par cette US, aucune modification du comportement fonctionnel (cochage,
  reprogrammation, édition) n'est demandée ici. Cohérence visuelle attendue avec US-009 (thème
  pastel), mais ces deux US sont développables indépendamment.
- **Notes / hors périmètre** :
  - « Toute la largeur de l'écran » est interprétée ici comme toute la largeur de la zone de
    contenu de l'application (celle utilisée aujourd'hui par les titres, formulaires, etc.),
    pas nécessairement une carte allant jusqu'aux bords physiques de l'écran en ignorant les
    marges de page habituelles. **Point à clarifier** avec l'utilisateur si un rendu « bord à
    bord » (edge-to-edge, sans marge latérale) est réellement souhaité.
  - Ne couvre pas de changement du contenu affiché dans les cartes (informations, actions) ni
    de leur logique métier — uniquement leur disposition en carte horizontale pleine largeur.

## Implémentation

Tous les critères d'acceptation sont couverts, sans changement de comportement fonctionnel
(cochage, reprogrammation, édition inchangés — vérifié par la suite de tests existante qui
reste verte).

### Fichiers modifiés
- `src/routes/habitudes/+page.svelte` — la ligne d'habitude (`.habit-row`) devient une carte
  horizontale : fond `--surface`, bordure `--surface-border` + bordure gauche violette
  `--habit-border` (cohérente avec `HabitCheckItem` du planning), rayon/padding partagés via les
  variables `--card-radius`/`--card-padding` (déclarées dans `app.css`, US-009), largeur 100 %.
- `src/lib/components/TaskItem.svelte`, `src/routes/HabitCheckItem.svelte` — même traitement
  (bordure/fond/rayon/padding alignés sur les variables `--card-radius`/`--card-padding`), pour
  garantir un rendu identique entre `/`, `/habitudes` et `/taches` (scénarios 1 à 4).
- Dans les trois composants de carte, ajout de `min-width: 0` sur le conteneur d'info et
  `overflow-wrap: anywhere` sur le nom, pour qu'un nom long passe à la ligne proprement sans
  casser l'alignement des autres éléments de la carte (case à cocher, badge, actions) — scénario 5.
- `src/lib/components/TaskItem.test.ts`, `src/routes/HabitCheckItem.test.ts` — ajout d'un test
  par composant vérifiant qu'un nom très long reste affiché en entier (non tronqué).
- `src/routes/habitudes/page.test.ts` (nouveau) — vérifie que chaque habitude de la liste est
  rendue comme une carte cliquable pleine largeur et qu'un nom long n'est pas tronqué.

### Comment tester manuellement
1. `npm run dev`, créer une habitude et une tâche avec un nom très long.
2. Aller sur `/` : la carte habitude et la carte tâche du planning occupent toute la largeur de
   la zone de contenu, sans espace inutilisé sur les côtés ; le nom long passe à la ligne
   proprement, case à cocher/badge restent alignés.
3. Aller sur `/habitudes` : la liste utilise le même rendu de carte (bordure violette, rayon,
   ombre) que le planning.
4. Aller sur `/taches` : même rendu de carte que le planning (le composant `TaskItem` est
   partagé).

### Hypothèses produit tranchées
- « Toute la largeur de l'écran » interprétée, comme suggéré par la note du PO en l'absence de
  clarification explicite de l'utilisateur, comme la largeur de la zone de contenu de
  l'application (celle du conteneur `main`, avec ses marges habituelles), **pas** un rendu
  bord-à-bord (edge-to-edge) qui ignorerait les marges de page. Cette interprétation est déjà
  celle du rendu existant du planning (`HabitCheckItem`/`TaskItem`) : cette US l'aligne sur
  `/habitudes` plutôt que de la remettre en cause. À réviser si l'utilisateur souhaite
  explicitement un rendu bord-à-bord.
