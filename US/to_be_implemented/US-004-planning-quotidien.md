---
type: user-story
id: US-004
titre: Planning quotidien des habitudes et tâches
date: 2026-08-09
auteur: product-owner
statut: prête
priorite: Must
estimation: L
source: chat
depend_de: ["US-001", "US-002"]
---

## Titre : US-004 — Planning quotidien des habitudes et tâches

### Récit
> **En tant qu'** utilisateur de l'app,
> **je veux** consulter, pour une date donnée, les habitudes prévues ce jour-là et les tâches ponctuelles de ce jour, et pouvoir cocher qu'elles ont été faites,
> **afin de** savoir chaque jour ce que j'ai à faire et suivre ma progression au quotidien.

### Critères d'acceptation

**Scénario 1 — Affichage du jour courant**
> **Étant donné** j'ouvre l'application
> **Quand** j'accède au planning quotidien
> **Alors** le planning affiché par défaut correspond au jour courant
> **Et** les habitudes prévues ce jour (selon leur fréquence) sont listées dans une section distincte des tâches
> **Et** les tâches ponctuelles dont la date correspond à ce jour sont listées dans une autre section distincte

**Scénario 2 — Sélection des habitudes du jour selon un intervalle de jours**
> **Étant donné** une habitude a une fréquence par intervalle de N jours
> **Quand** j'affiche le planning d'un jour qui correspond à une occurrence prévue selon cet intervalle
> **Alors** l'habitude apparaît dans le planning de ce jour
> **Et quand** j'affiche le planning d'un jour qui ne correspond pas à une occurrence prévue
> **Alors** l'habitude n'apparaît pas dans le planning de ce jour

**Scénario 3 — Sélection des habitudes du jour selon des jours de semaine précis**
> **Étant donné** une habitude a une fréquence « lundi, jeudi »
> **Quand** j'affiche le planning d'un mardi
> **Alors** cette habitude n'apparaît pas dans le planning de ce jour
> **Et quand** j'affiche le planning d'un jeudi
> **Alors** cette habitude apparaît dans le planning de ce jour

**Scénario 4 — Validation d'une habitude ou d'une tâche du jour**
> **Étant donné** le planning du jour affiche une habitude « Boire de l'eau » et une tâche « Appeler le plombier », toutes deux non cochées
> **Quand** je coche l'habitude comme faite
> **Alors** son état passe à « faite » pour ce jour, avec une indication visuelle claire (ex : coche, style barré)
> **Et quand** je coche la tâche comme faite
> **Alors** son état passe également à « faite »

**Scénario 5 — Décochage**
> **Étant donné** une habitude a été cochée comme faite pour le jour affiché
> **Quand** je la décoche
> **Alors** son état repasse à « non faite » pour ce jour

**Scénario 6 — Navigation vers un jour passé**
> **Étant donné** je suis sur le planning du jour courant
> **Quand** je navigue vers un jour antérieur
> **Alors** le planning affiche les habitudes et tâches correspondant à cette date passée, avec leur état de complétion tel qu'enregistré (fait / non fait)

**Scénario 7 — Navigation vers un jour futur**
> **Étant donné** je suis sur le planning du jour courant
> **Quand** je navigue vers un jour futur
> **Alors** le planning affiche les habitudes prévues ce jour-là selon leur fréquence et les tâches dont la date correspond, toutes non cochées par défaut (sauf si déjà cochées par anticipation)

**Scénario 8 — Distinction visuelle maintenue sur toutes les dates**
> **Étant donné** le planning affiché (jour courant, passé ou futur) contient à la fois des habitudes et des tâches
> **Quand** je consulte l'écran
> **Alors** je distingue immédiatement les deux catégories (sections séparées et/ou style visuel différent)

### Priorité
Must (cœur du MVP)

### Estimation
L

### Dépendances
US-001 (habitudes existantes à afficher), US-002 (tâches existantes à afficher)

### Notes / hors périmètre
- Le comportement de report automatique n'existe pas : une habitude non cochée un jour reste simplement « non faite » ce jour-là (pas de statut « en retard » pour les habitudes, contrairement aux tâches — cf. US-003).
- Les notifications/rappels ne sont pas couverts par cette US.
- L'affichage agrégé sur plusieurs jours (tableau de synthèse) fait l'objet d'une US séparée (US-005).
