---
type: user-story
id: US-012
titre: Titre dynamique « Planning du/d'... » selon le jour sélectionné
date: 2026-08-12
auteur: product-owner
statut: livrée
priorite: Could
estimation: XS
source: chat
depend_de: ["US-011"]
---

## Titre : US-012 — Titre dynamique « Planning du/d'... » selon le jour sélectionné

### Récit
> **En tant qu'** utilisateur de l'application,
> **je veux** que le titre en haut de l'écran de planning m'indique clairement, en français,
> pour quel jour je consulte les habitudes et tâches,
> **afin de** ne jamais me tromper de jour en lisant mon planning.

### Contexte (état actuel constaté dans le code)
L'écran « Aujourd'hui » (`/`) affiche aujourd'hui un titre statique « Planning », identique
quel que soit le jour sélectionné ; seule la date affichée dans la navigation par flèches
change. Cette US rend ce titre dynamique, en cohérence avec la frise de dates introduite par
US-011.

### Critères d'acceptation

> **Étant donné** que le jour sélectionné dans le planning est le jour courant (aujourd'hui),
> **Quand** l'écran de planning s'affiche,
> **Alors** le titre en haut de l'écran affiche « Planning d'aujourd'hui ».

> **Étant donné** que je sélectionne, via la frise de dates, un jour différent du jour courant
> (par exemple demain, ou un jour de la semaine dernière),
> **Quand** ce jour devient le jour sélectionné,
> **Alors** le titre affiche « Planning du <jour de la semaine en toutes lettres> <jour du
> mois> <mois en toutes lettres> » (ex. « Planning du mercredi 12 août »), formaté en français.

> **Étant donné** que je navigue d'un jour non-courant vers un autre jour non-courant via la
> frise,
> **Quand** le nouveau jour est sélectionné,
> **Alors** le titre se met à jour immédiatement pour refléter ce nouveau jour.

> **Étant donné** que je reviens, via la frise, sur le jour courant après avoir consulté un
> autre jour,
> **Quand** le jour courant redevient le jour sélectionné,
> **Alors** le titre repasse à « Planning d'aujourd'hui » (et non « Planning du <date du
> jour> »).

- **Priorité** : Could
- **Estimation** : XS
- **Dépendances** : US-011 (frise de dates) — le titre réagit au jour sélectionné via la
  frise ; elle réutilise le mécanisme de sélection de jour introduit par US-011.
- **Notes / hors périmètre** :
  - Le format exact du nom de jour/mois en toutes lettres doit rester cohérent avec les
    conventions déjà utilisées ailleurs dans l'application pour les libellés en français
    (mois en toutes lettres en minuscules) ; l'inclusion ou non de l'année dans le titre
    (utile si le jour sélectionné n'est pas dans l'année en cours) est un point mineur à
    trancher lors de l'affinage plutôt qu'un point bloquant pour démarrer le développement.
  - Ne couvre pas la traduction ou l'internationalisation multi-langue : le format est
    exclusivement en français, comme le reste de l'application actuelle.

## Implémentation

Tous les critères d'acceptation sont couverts et testés. Implémentée en même temps que US-011
(dont elle réutilise directement le mécanisme de sélection de jour), le câblage dans `/` était
donc déjà en place ; cette clôture documente et valide spécifiquement ses propres critères.

### Fichiers créés/modifiés
- `src/lib/domain/dates.ts` — `formatIsoDateLongFr(iso)` ("mercredi 12 août", en minuscules,
  cohérent avec `monthLabelFr` déjà utilisé ailleurs) et `formatPlanningTitleFr(selectedDate,
  today)` (« Planning d'aujourd'hui » si `selectedDate === today`, sinon « Planning du
  <formatIsoDateLongFr> »), fonctions pures testées dans `dates.test.ts`.
- `src/routes/+page.svelte` — `<h1>Planning</h1>` statique remplacé par
  `<h1>{planningTitle}</h1>`, avec `planningTitle = $derived(formatPlanningTitleFr(selectedDate,
  realToday))` (recalculé automatiquement à chaque sélection de jour via la frise US-011).
- `src/routes/page.test.ts` — scénario dédié vérifiant le titre initial (« Planning
  d'aujourd'hui »), son changement immédiat vers « Planning du <jour> » après sélection d'un
  autre jour, et son retour à « Planning d'aujourd'hui » en resélectionnant aujourd'hui.

### Comment tester manuellement
1. `npm run dev`, ouvrir `/` : le titre affiche « Planning d'aujourd'hui ».
2. Taper sur un autre jour de la frise (ex. demain) : le titre passe immédiatement à
   « Planning du <jour de la semaine> <jour> <mois> » (ex. « Planning du jeudi 13 août »).
3. Retaper sur aujourd'hui dans la frise : le titre repasse à « Planning d'aujourd'hui ».

### Hypothèses produit tranchées
- Année exclue du titre (« Planning du mercredi 12 août », sans année), conformément à
  l'exemple donné par le récit de l'US et à l'estimation XS ; point explicitement laissé
  mineur par le PO. Facilement ajoutable (`formatIsoDateLongFr` centralise le format) si
  l'usage révèle un besoin de désambiguïser une date hors année courante.
