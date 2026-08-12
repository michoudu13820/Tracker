---
type: user-story
id: US-014
titre: Suppression d'une tâche ponctuelle par glisser + confirmation
date: 2026-08-12
auteur: product-owner
statut: livrée
priorite: Should
estimation: M
source: chat
depend_de: ["US-002", "US-003", "US-010"]
---

## Titre : US-014 — Suppression d'une tâche ponctuelle par glisser + confirmation

### Récit
> **En tant qu'** utilisateur de l'app,
> **je veux** pouvoir supprimer une tâche ponctuelle dont je n'ai plus besoin, via un geste de glisser sur sa carte suivi d'une confirmation,
> **afin de** garder ma liste de tâches à jour, sans risquer de supprimer accidentellement une tâche importante.

### Critères d'acceptation

**Scénario 1 — Révélation du bouton de suppression au glisser**
> **Étant donné** je suis sur l'écran « Tâches » avec au moins une tâche affichée
> **Quand** je glisse (swipe) la carte d'une tâche
> **Alors** un bouton « poubelle » apparaît sur cette carte
> **Et** la tâche n'est pas encore supprimée à ce stade

**Scénario 2 — Confirmation demandée avant suppression**
> **Étant donné** le bouton poubelle est visible sur la carte d'une tâche (après glissement)
> **Quand** je clique sur ce bouton
> **Alors** une demande de confirmation m'est présentée, rappelant le nom et la date de la tâche concernée et précisant que l'action est définitive
> **Et** la zone tactile de ce bouton est suffisamment grande pour un usage confortable au doigt sur mobile (cohérent avec le standard déjà appliqué dans l'app, ex. 44 px minimum)
> **Et** tant que je n'ai pas confirmé, la tâche n'est pas supprimée

**Scénario 3 — Suppression effective après confirmation**
> **Étant donné** la demande de confirmation de suppression est affichée pour une tâche
> **Quand** je confirme la suppression
> **Alors** la tâche disparaît immédiatement de la liste des tâches
> **Et** elle n'apparaît plus dans le planning du jour auquel elle était rattachée
> **Et** contrairement à l'hypothèse initialement envisagée, sa complétion éventuellement enregistrée (`TaskCompletion`) est **conservée** et continue d'être prise en compte dans le résumé « Habit tracker » (US-005) — la suppression retire la tâche de la gestion active, mais ne détruit pas les statistiques déjà accumulées
> **Et** cette suppression est irréversible : il n'existe aucune action de restauration d'une tâche supprimée

**Scénario 4 — Annulation de la confirmation**
> **Étant donné** la demande de confirmation de suppression est affichée pour une tâche
> **Quand** je choisis d'annuler plutôt que de confirmer
> **Alors** la tâche n'est pas supprimée
> **Et** elle reste visible normalement dans la liste, avec son statut (faite / à faire / en retard) inchangé

**Scénario 5 — Fermeture du bouton poubelle sans suppression**
> **Étant donné** le bouton poubelle est visible sur la carte d'une tâche après un glissement
> **Quand** je n'interagis pas avec ce bouton (par exemple j'interagis ailleurs sur l'écran)
> **Alors** le bouton poubelle se referme sans qu'aucune suppression n'ait eu lieu
> *(le déclencheur exact de cette fermeture est un détail d'interaction laissé au développeur, voir Notes — à garder cohérent avec US-013 sur les habitudes)*

**Scénario 6 — Suppression réservée à l'écran de gestion des tâches**
> **Étant donné** je suis sur le planning quotidien (écran « Aujourd'hui »)
> **Quand** une tâche du jour y est affichée
> **Alors** aucune action de suppression par glissement n'est proposée à cet endroit : la suppression d'une tâche n'est possible que depuis l'écran « Tâches » où elle est gérée
> *(confirmé avec l'utilisateur le 2026-08-12 : périmètre validé tel quel)*

### Priorité
Should — améliore la gestion au quotidien d'une liste de tâches qui grandit, mais n'est pas bloquant pour le MVP déjà livré (US-002/US-003/US-004).

### Estimation
M — geste de glissement sur la carte existante (US-010), bouton contextuel, boîte de confirmation, retrait de la tâche de la gestion active tout en préservant sa complétion éventuelle dans le repository/store (soft-delete, cf. Notes), tests domain + composant. Le composant de carte de tâche étant déjà partagé entre `/taches` et le planning `/` (`TaskItem.svelte`), une attention particulière est nécessaire pour ne pas exposer l'action de suppression là où elle n'est pas voulue (scénario 6).

### Dépendances
US-002 (création/édition d'une tâche), US-003 (reprogrammation — partage le composant `TaskItem`), US-010 (cards horizontales pleine largeur — support visuel du geste de glissement).

### Notes / hors périmètre
- **Confirmé avec l'utilisateur (2026-08-12)** : la suppression est bien réservée à l'écran « Tâches » (`/taches`), pas accessible depuis le planning quotidien (`/`).
- **Confirmé avec l'utilisateur (2026-08-12)** : la suppression conserve la complétion éventuellement enregistrée (contrairement à l'hypothèse initiale de suppression en cascade), sur le même principe de soft-delete que US-013 pour les habitudes — la tâche est marquée dans un état terminal qui l'exclut définitivement des listes/planning, sans possibilité de restauration, mais son historique reste lisible par le résumé (US-005).
- Le **sens du glissement** et le **comportement exact de fermeture** du bouton poubelle ne sont pas prescrits, comme pour US-013 (habitudes) — à garder cohérents entre les deux écrans pour l'expérience utilisateur, même si l'implémentation technique du partage n'est pas du ressort de cette US produit.
- Contrairement aux habitudes, une tâche ponctuelle n'a pas de notion de « pause » (pas de récurrence à interrompre) : la suppression est ici la seule action de retrait disponible pour une tâche.
- Ne couvre pas la suppression groupée (plusieurs tâches à la fois).
- Ne couvre pas un mécanisme d'« annuler la suppression » après confirmation.

## Implémentation

Réutilise intégralement `SwipeToDelete.svelte` et `ConfirmDialog.svelte` créés pour US-013, pour
garder un geste et une confirmation cohérents entre Habitudes et Tâches (comme demandé en Notes).
Les 6 scénarios sont couverts et vérifiés par les tests automatisés (voir fichiers ci-dessous).

### Fichiers modifiés
- `src/lib/domain/tasks.ts` : `taskRecordStatus`, `isTaskDeleted`, `visibleTasks` (même patron que `habits.ts` pour US-013 ; nommé `TaskRecordStatus`, distinct de `TaskStatus` déjà existant qui désigne le statut du jour fait/à faire/en retard).
- `src/lib/stores/tasks.store.svelte.ts` : `remove(taskId)` (soft-delete → `status: 'deleted'`) ; `onDate()` exclut désormais les tâches supprimées.
- `src/lib/components/TaskItem.svelte` : ajout des props optionnelles `revealed` / `onReveal` / `onCloseReveal` / `onDelete`. Le geste de suppression n'est actif que si `onDelete` est fourni (même mécanisme que `onEdit`, déjà optionnel) — **scénario 6** satisfait par construction : le planning (`/`, `routes/+page.svelte`) ne passe pas `onDelete`, donc aucune poubelle n'y est jamais révélable. Seule la ligne `.row` (checkbox + nom + badge) est enveloppée par `SwipeToDelete` ; les actions secondaires (Reprogrammer/Modifier) restent toujours visibles sous la ligne.
- `src/routes/taches/+page.svelte` : liste filtrée via `visibleTasks`, coordination d'une seule carte révélée à la fois (`revealedTaskId`), câblage de `handleDelete` → `tasksStore.remove`.
- Tests étendus : `src/lib/domain/tasks.test.ts`, `src/lib/stores/tasks.store.svelte.test.ts`, `src/lib/components/TaskItem.test.ts`.

### Comment tester manuellement
1. `npm run dev`, aller sur `/taches` avec au moins une tâche.
2. Glisser la ligne d'une tâche vers la gauche : un bouton poubelle apparaît (même geste que sur `/habitudes`).
3. Cliquer le bouton poubelle → confirmation avec le nom et la date de la tâche, mention du caractère définitif.
4. Confirmer → la tâche disparaît de `/taches` et du planning (`/`) ; sa complétion éventuelle reste visible dans `/resume`.
5. Vérifier sur le planning (`/`) qu'aucune poubelle n'apparaît jamais au glissement d'une tâche du jour (scénario 6).
6. Annuler la confirmation, ou cliquer ailleurs sur la ligne révélée → aucune suppression, comportement identique à US-013.

### Dette assumée
- Même dette que US-013 (seuil de glissement discret, pas d'alternative clavier dédiée) — cohérence assumée entre les deux écrans.
