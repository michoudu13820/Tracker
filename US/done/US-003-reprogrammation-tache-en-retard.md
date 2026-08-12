---
type: user-story
id: US-003
titre: Reprogrammation manuelle d'une tâche en retard
date: 2026-08-09
auteur: product-owner
statut: livrée
priorite: Should
estimation: S
source: chat
depend_de: ["US-002"]
---

## Titre : US-003 — Reprogrammation manuelle d'une tâche en retard

### Récit
> **En tant qu'** utilisateur de l'app,
> **je veux** reprogrammer manuellement une tâche en retard à une nouvelle date que je choisis moi-même,
> **afin de** ne pas perdre une tâche non réalisée sans avoir à la recréer.

### Critères d'acceptation

**Scénario 1 — Détection d'une tâche en retard**
> **Étant donné** une tâche « Appeler le plombier » a une date antérieure à aujourd'hui et n'a pas été validée
> **Quand** j'affiche la liste des tâches ou le planning correspondant à cette date passée
> **Alors** la tâche est signalée visuellement comme « en retard »

**Scénario 1bis — Bascule en retard à minuit le lendemain de la date prévue**
> **Étant donné** une tâche a pour date le jour courant (aujourd'hui) et n'a pas encore été validée
> **Quand** j'affiche cette tâche à n'importe quel moment du jour courant, avant minuit
> **Alors** elle n'est PAS signalée comme « en retard » (elle reste « à faire aujourd'hui »)
> **Et quand** minuit (00h00) sonne et que le jour suivant commence sans que la tâche ait été validée
> **Alors** dès 00h00 le lendemain, la tâche bascule et est désormais signalée comme « en retard »

**Scénario 2 — Reprogrammation à une nouvelle date**
> **Étant donné** la tâche « Appeler le plombier » est signalée en retard
> **Quand** je déclenche l'action « reprogrammer » et que je saisis une nouvelle date
> **Et** je valide
> **Alors** la date de la tâche est mise à jour avec la date saisie
> **Et** la tâche n'apparaît plus comme « en retard »
> **Et** elle apparaît désormais dans le planning correspondant à cette nouvelle date

**Scénario 3 — Reprogrammation bloquée sans nouvelle date**
> **Étant donné** je suis sur l'action de reprogrammation d'une tâche en retard
> **Quand** je tente de valider sans avoir saisi de nouvelle date
> **Alors** la reprogrammation est bloquée
> **Et** un message m'invite à choisir une date

**Scénario 4 — Une tâche validée n'est jamais considérée en retard**
> **Étant donné** une tâche a une date passée mais a été validée (cochée comme faite) à ou avant cette date
> **Quand** j'affiche la liste des tâches
> **Alors** elle n'est pas signalée comme « en retard », elle apparaît avec le statut « faite »

### Priorité
Should (vient après le socle MVP création/planning ; améliore la gestion des tâches manquées)

### Estimation
S

### Dépendances
US-002 (une tâche doit pouvoir être créée avant d'être en retard)

### Notes / hors périmètre
- Pas de report automatique ni de règle de replanification implicite : la reprogrammation est toujours une action manuelle initiée par l'utilisateur.
- Règle de bascule « en retard » tranchée : une tâche dont la date est dépassée devient « en retard » dès 00h00 le jour suivant sa date prévue. Une tâche datée du jour même n'est jamais « en retard » avant minuit.
- Pas de notification ou de rappel automatique pour les tâches en retard dans cette US.

## Implémentation

Tous les scénarios sont couverts et testés (1, 1bis, 2, 3, 4).

### Fichiers créés
- `src/lib/components/TaskItem.svelte` — composant partagé (utilisé par `/taches` ET par `/`
  dès US-004, d'où son placement dans `lib/components` plutôt que colocalisé) : case à cocher,
  badge de statut (Faite / À faire / En retard, via `taskStatus` déjà testé en domaine), action
  « Reprogrammer » visible uniquement si `status === 'overdue'`, formulaire de nouvelle date
  validé via `validateReschedule` (ajouté en amont pendant US-002). Bouton « Modifier » optionnel
  (prop `onEdit`) pour ne pas forcer cette action sur l'écran de planning à venir.
- `src/lib/components/TaskItem.test.ts` — 10 tests couvrant tous les scénarios (statut, retard à
  J+1 mais pas J, reprogrammation bloquée/validée, tâche faite jamais en retard, cochage, édition
  optionnelle).
- `src/lib/domain/dates.test.ts` — le fichier `dates.ts` était utilisé partout mais n'avait aucun
  test dédié ; comblé à cette occasion (utilitaires génériques, pas spécifiques à cette US).

### Fichiers modifiés
- `src/lib/domain/dates.ts` — ajout de `formatIsoDateFr` (formatage `DD/MM/YYYY`, utilisé par
  `TaskItem` et la liste des tâches) : utilitaire de date générique, donc placé ici plutôt que
  dupliqué dans chaque composant.
- `src/lib/components/index.ts` — export de `TaskItem`.
- `src/routes/taches/+page.svelte` — utilise désormais `TaskItem` pour le rendu de chaque tâche
  (statut, cochage via `completionsStore.setTaskDone`, reprogrammation via `tasksStore.upsert`
  avec la nouvelle date, édition via `onEdit` → réouvre `TaskForm`).

### Comment tester manuellement
1. Créer une tâche datée d'hier (non cochée) sur `/taches` → badge « En retard » + bouton
   « Reprogrammer » visibles.
2. Créer une tâche datée d'aujourd'hui → badge « À faire », pas de bouton « Reprogrammer »
   (bascule uniquement après minuit, scénario 1bis, vérifié par test unitaire avec une date
   `today` injectée plutôt qu'en observant une vraie horloge).
3. Cliquer « Reprogrammer » sans choisir de date puis valider → message d'erreur, rien ne change.
4. Choisir une nouvelle date future puis valider → la tâche disparaît du retard, sa date est
   mise à jour.
5. Cocher une tâche en retard comme faite → le badge passe à « Faite », le bouton
   « Reprogrammer » disparaît.

### Hypothèses produit tranchées
- Aucune ambiguïté bloquante : la règle de bascule à minuit était déjà explicitement tranchée par
  l'US et implémentée en amont dans `isTaskOverdue`/`taskStatus` (domaine, testé lors de la
  création initiale du projet).
