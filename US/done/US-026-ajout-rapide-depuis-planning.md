---
type: user-story
id: US-026
titre: Ajout rapide d'une habitude ou d'une tâche depuis le planning
date: 2026-08-12
auteur: product-owner
statut: livrée
priorite: Should
estimation: M
source: chat
depend_de: ["US-001", "US-002", "US-004"]
---

## Titre : US-026 — Ajout rapide d'une habitude ou d'une tâche depuis le planning

### Récit
> **En tant qu'** utilisateur de l'app,
> **je veux** pouvoir créer rapidement une nouvelle habitude ou une nouvelle tâche directement depuis l'écran de planning,
> **afin de** ne pas devoir naviguer vers un autre écran quand une idée me vient en consultant ma journée.

### Critères d'acceptation

**Scénario 1 — Bouton d'ajout rapide visible sur le planning**
> **Étant donné** je suis sur l'écran de planning, quel que soit le jour affiché
> **Quand** je consulte l'écran
> **Alors** un bouton d'ajout rapide est visible et accessible (par exemple un bouton flottant ou en en-tête)

**Scénario 2 — Choix du type d'élément à créer**
> **Étant donné** je clique sur le bouton d'ajout rapide
> **Quand** le choix m'est proposé
> **Alors** je peux choisir de créer soit une habitude, soit une tâche ponctuelle

**Scénario 3 — Création d'une tâche pré-remplie à la date affichée**
> **Étant donné** je suis sur le planning du 20/08/2026 et je choisis « Créer une tâche » via l'ajout rapide
> **Quand** le formulaire de création de tâche s'ouvre
> **Alors** la date est pré-remplie avec le 20/08/2026 (le jour actuellement affiché), modifiable si je le souhaite
> **Et** après validation, la tâche apparaît dans le planning de ce jour sans navigation supplémentaire

**Scénario 4 — Création d'une habitude depuis le planning**
> **Étant donné** je choisis « Créer une habitude » via l'ajout rapide
> **Quand** je remplis le formulaire (nom, emoji, fréquence — mêmes champs et règles qu'US-001) et je valide
> **Alors** l'habitude est créée avec les mêmes règles de validation qu'à l'écran « Habitudes » (US-001)
> **Et** si elle est due le jour actuellement affiché dans le planning, elle y apparaît immédiatement

**Scénario 5 — Annulation de l'ajout rapide**
> **Étant donné** le formulaire d'ajout rapide (habitude ou tâche) est ouvert depuis le planning
> **Quand** j'annule sans valider
> **Alors** je reviens au planning sans qu'aucun élément n'ait été créé

### Priorité
Should — réduit une friction réelle (aller-retour entre écrans) sans introduire de nouvelle règle métier ; s'appuie entièrement sur des formulaires déjà livrés.

### Estimation
M — nouveau point d'entrée UI (bouton + choix de type) réutilisant tel quel les formulaires et validations existants d'US-001/US-002, avec pré-remplissage de la date depuis le jour affiché.

### Dépendances
US-001 (formulaire habitude réutilisé), US-002 (formulaire tâche réutilisé), US-004 (écran de planning, jour actuellement affiché).

### Notes / hors périmètre
- Réutilise strictement les formulaires et règles de validation existants d'US-001/US-002 ; cette US ne redéfinit aucune règle de validation propre.
- Ne couvre pas l'édition rapide d'un élément existant depuis le planning (hors périmètre) : seule la **création** est concernée ici.
- Le pré-remplissage de date ne s'applique qu'à la création d'une tâche (une habitude n'a pas de date propre, seulement une fréquence).

## Implémentation

Tous les scénarios sont satisfaits et couverts par des tests.

**Fichiers déplacés (`src/routes/*` → `src/lib/components/`, CONVENTIONS.md §7 : un composant
utilisé par ≥ 2 routes migre vers `lib/components`) :**
- `HabitForm.svelte` + `HabitForm.test.ts` (depuis `src/routes/habitudes/`) — désormais partagé
  entre `/habitudes` et l'ajout rapide du planning `/`.
- `TaskForm.svelte` + `TaskForm.test.ts` (depuis `src/routes/taches/`) — désormais partagé entre
  `/taches` et l'ajout rapide du planning `/`.
- `src/lib/components/index.ts` — exporte `HabitForm` et `TaskForm`.

**Fichiers modifiés :**
- `src/lib/components/TaskForm.svelte` — nouvelle prop optionnelle `defaultDate` : pré-remplit la
  date à la création (scénario 3), ignorée en édition (la date déjà enregistrée prévaut).
- `src/routes/habitudes/+page.svelte`, `src/routes/taches/+page.svelte` — imports mis à jour vers
  `$lib/components` (aucun changement de comportement).
- `src/routes/+page.svelte` — nouveau bouton « + Ajouter » (visible quel que soit le jour
  affiché, scénario 1) ouvrant un choix « Nouvelle habitude » / « Nouvelle tâche » (scénario 2),
  puis le formulaire correspondant (`HabitForm`/`TaskForm`, réutilisés tels quels — aucune
  nouvelle règle de validation). La tâche créée reçoit `defaultDate={selectedDate}` (scénario 3).
  `Annuler` referme sans rien créer (scénario 5). Les deux formulaires appellent
  `habitsStore.upsert`/`tasksStore.upsert`, ce qui suffit à faire réapparaître l'élément
  immédiatement dans le planning (dérivé réactivement de `dueOn`/`onDate`, scénario 4).

**Fichiers de test créés/modifiés :**
- `src/lib/components/TaskForm.test.ts` — pré-remplissage par `defaultDate`, modifiable,
  ignoré en édition.
- `src/routes/page.test.ts` — nouveau bloc « ajout rapide » : bouton visible sur tout jour
  affiché, choix habitude/tâche, création de tâche pré-remplie visible immédiatement, création
  d'habitude visible immédiatement, annulation sans création.

**Comment tester manuellement :** sur `/`, taper « + Ajouter », choisir « Nouvelle tâche » : la
date est pré-remplie avec le jour affiché dans le planning ; valider fait apparaître la tâche
immédiatement dans la section « Tâches » sans navigation. Idem avec « Nouvelle habitude » : elle
apparaît si due le jour affiché.

**Dette / points assumés :** aucun écart avec la spécification. Choix d'implémentation du bouton
d'ajout rapide en en-tête (au-dessus des sections, sous la frise de dates) plutôt qu'un bouton
flottant — les deux étaient explicitement acceptés par le scénario 1 (« par exemple »), ce choix
évite la complexité de positionnement fixe au-dessus de la barre d'onglets sticky.
