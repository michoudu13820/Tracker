---
type: user-story
id: US-011
titre: Frise de dates en haut de l'écran pour naviguer entre les jours du planning
date: 2026-08-12
auteur: product-owner
statut: livrée
priorite: Should
estimation: L
source: chat
depend_de: ["US-004"]
---

## Titre : US-011 — Frise de dates en haut de l'écran pour naviguer entre les jours du planning

### Récit
> **En tant qu'** utilisateur de l'application,
> **je veux** naviguer entre les jours du planning en tapant directement sur un jour affiché
> dans une frise horizontale en haut de l'écran, plutôt qu'en utilisant des flèches
> précédent/suivant,
> **afin de** choisir rapidement un jour précis sans avoir à cliquer plusieurs fois de suite.

### Contexte (état actuel constaté dans le code)
L'écran « Aujourd'hui » (`/`) affiche aujourd'hui une navigation composée de trois boutons :
une flèche « jour précédent », un libellé central affichant la date sélectionnée au format
`JJ/MM/AAAA` (qui ramène à aujourd'hui si on clique dessus), et une flèche « jour suivant ». Le
jour sélectionné pilote l'affichage des habitudes et tâches du dessous. Cette navigation par
flèches doit être remplacée par la frise de dates décrite ci-dessous.

### Critères d'acceptation

> **Étant donné** que j'ouvre l'écran de planning (`/`),
> **Quand** la page se charge,
> **Alors** une frise horizontale de jours s'affiche en haut de l'écran, et les boutons de
> navigation « jour précédent » / « jour suivant » actuels ne sont plus présents.

> **Étant donné** la frise de dates affichée,
> **Quand** je regarde un jour de la frise,
> **Alors** il est représenté par un rond contenant le chiffre du jour du mois, avec juste
> au-dessus ce rond les 3 premières lettres du nom du jour de la semaine (ex. pour mercredi
> 12 août : « Mer » au-dessus d'un rond contenant « 12 »).

> **Étant donné** la frise de dates affichée,
> **Quand** je tape sur un groupement jour (le rond + son libellé de jour au-dessus),
> **Alors** le planning affiché en dessous (habitudes et tâches) bascule immédiatement sur ce
> jour, exactement comme si j'avais navigué jour par jour jusqu'à cette date avec l'ancien
> mécanisme de flèches.

> **Étant donné** la frise de dates affichée,
> **Quand** je regarde le jour actuellement sélectionné dans la frise,
> **Alors** il est visuellement distingué des autres jours de la frise (je sais en un coup
> d'œil quel jour est actuellement affiché).

> **Étant donné** la frise de dates affichée sur un écran de smartphone (usage principal :
> iPhone en PWA installée),
> **Quand** je tape sur un jour,
> **Alors** la zone de tap (rond + libellé au-dessus) est suffisamment grande pour être
> atteinte confortablement au doigt, cohérente avec les autres zones cliquables de
> l'application.

> **Étant donné** la frise de dates affichée,
> **Quand** je consulte la frise,
> **Alors** elle couvre plusieurs semaines (passées et/ou futures autour d'aujourd'hui) et non
> une seule semaine fixe.

> **Étant donné** la frise de dates affichée,
> **Quand** je fais défiler horizontalement (swipe/scroll) au doigt,
> **Alors** je peux atteindre d'autres semaines que celle initialement visible, dans un sens
> comme dans l'autre (jours passés et jours futurs), via un défilement horizontal natif.

- **Priorité** : Should
- **Estimation** : L
- **Dépendances** : US-004 (planning quotidien) — cette US remplace le mécanisme de navigation
  par jour livré dans US-004, en conservant le comportement métier existant (le jour
  sélectionné détermine les habitudes/tâches affichées, indépendamment du jour réel
  « aujourd'hui » utilisé par ailleurs pour le calcul du retard des tâches).
- **Notes / hors périmètre** :
  - **Clarifié avec l'utilisateur (2026-08-12)** : la frise est scrollable sur plusieurs
    semaines (défilement horizontal natif, pas de pagination par flèches). Le nombre exact de
    semaines pré-générées de part et d'autre d'aujourd'hui, et le comportement en cas
    d'atteinte d'une borne (chargement dynamique de semaines supplémentaires ou plage fixe
    large), restent un détail d'implémentation laissé à l'équipe de développement.
  - Ne couvre pas le contenu du planning lui-même (habitudes/tâches, cochage) : uniquement le
    mécanisme de sélection du jour. Voir US-012 pour le titre dynamique associé.

## Implémentation

Tous les critères d'acceptation sont couverts et testés.

### Fichiers créés
- `src/lib/domain/dates.ts` (complété) — `weekdayShortLabelFr` (libellé court "Mer", "Lun", …)
  et `dateStripRange(center, weeksBefore, weeksAfter)` (génération pure de la plage de dates
  continue de la frise), fonctions pures testées dans `dates.test.ts`.
- `src/routes/DateStrip.svelte` (nouveau, colocalisé — usage unique par `/`) — frise
  horizontale scrollable nativement (`overflow-x: auto`) ; chaque jour est un `<button>`
  (zone de tap ≥ 44×56px) affichant le libellé de jour de semaine (3 lettres) au-dessus d'un
  rond avec le chiffre du jour ; jour sélectionné marqué `aria-current="date"` et distingué
  visuellement (rond rempli en couleur accent). Recentre automatiquement le jour sélectionné
  au chargement/changement (`scrollIntoView`, no-op silencieux en environnement de test jsdom).
- `src/routes/DateStrip.test.ts` (nouveau) — 4 tests couvrant le rendu jour/rond, la sélection
  au clic, la distinction visuelle du jour sélectionné, et la couverture multi-semaines.

### Fichiers modifiés
- `src/routes/+page.svelte` — remplace la `<nav class="date-nav">` (flèches ◀/▶ + libellé
  cliquable) par `<DateStrip>`, alimentée par `dateStripRange(realToday, 8, 8)` (8 semaines
  avant/après aujourd'hui, plage fixe — cf. hypothèse ci-dessous). `selectDate` remplace
  `goToPreviousDay`/`goToNextDay`/`goToToday`.
- `src/routes/page.test.ts` — les scénarios 2/7 et 6 (navigation jour suivant/précédent)
  adaptés pour cliquer sur un jour de la frise au lieu des boutons flèches supprimés ; ajout
  d'un scénario vérifiant `aria-current` sur le jour sélectionné.

### Comment tester manuellement
1. `npm run dev`, ouvrir `/` : une frise de jours (ronds numérotés + jour de semaine abrégé
   au-dessus) s'affiche en haut, aujourd'hui est visuellement distingué et centré.
2. Taper sur un autre jour de la frise : le planning (habitudes/tâches) bascule immédiatement
   sur ce jour ; le rond tapé devient le jour distingué.
3. Faire défiler la frise horizontalement (souris/trackpad ou doigt sur iPhone) : d'autres
   semaines passées/futures apparaissent (± 8 semaines autour d'aujourd'hui).

### Hypothèses produit tranchées
- Plage de la frise fixée à 8 semaines avant/après aujourd'hui (≈ 4 mois de recul et
  d'anticipation), générée une fois au chargement de la page plutôt que chargée
  dynamiquement aux bornes — choix explicitement laissé libre par la note du PO
  ("détail d'implémentation laissé à l'équipe de développement"). Ajustable en un seul
  endroit (`dateStripRange(realToday, 8, 8)` dans `+page.svelte`) si une plage plus large
  s'avère nécessaire à l'usage.
