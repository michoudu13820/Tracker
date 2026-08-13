---
type: user-story
id: US-013
titre: Suppression d'une habitude par glisser + confirmation
date: 2026-08-12
auteur: product-owner
statut: livrée
priorite: Should
estimation: M
source: chat
depend_de: ["US-001", "US-010"]
---

## Titre : US-013 — Suppression d'une habitude par glisser + confirmation

> **Révision de portée (US-027)** : le scénario 3 ci-dessous précise qu'une habitude supprimée
> « n'est plus listée du tout ». [US-027 — Section « En pause / Supprimées »](./US-027-section-pause-supprimees-reprise-automatique.md)
> révise ce point sur décision produit explicite : une habitude supprimée n'apparaît plus dans la
> **liste active**, mais devient visible, en lecture seule, dans une nouvelle section dédiée
> « En pause / Supprimées » de l'écran Habitudes — plutôt que d'être masquée sans trace. Le
> caractère **irréversible** de la suppression (pas de restauration via l'UI) et son absence du
> planning/résumé sont inchangés.

### Récit
> **En tant qu'** utilisateur de l'app,
> **je veux** pouvoir supprimer une habitude que je ne souhaite plus suivre, via un geste de glisser sur sa carte suivi d'une confirmation,
> **afin de** garder ma liste d'habitudes pertinente, sans risquer de supprimer accidentellement une habitude à laquelle je tiens.

### Critères d'acceptation

**Scénario 1 — Révélation du bouton de suppression au glisser**
> **Étant donné** je suis sur l'écran « Habitudes » avec au moins une habitude affichée
> **Quand** je glisse (swipe) la carte d'une habitude
> **Alors** un bouton « poubelle » apparaît sur cette carte
> **Et** l'habitude n'est pas encore supprimée à ce stade

**Scénario 2 — Confirmation demandée avant suppression**
> **Étant donné** le bouton poubelle est visible sur la carte d'une habitude (après glissement)
> **Quand** je clique sur ce bouton
> **Alors** une demande de confirmation m'est présentée, rappelant le nom de l'habitude concernée et précisant que l'action est définitive
> **Et** la zone tactile de ce bouton est suffisamment grande pour un usage confortable au doigt sur mobile (cohérent avec le standard déjà appliqué dans l'app, ex. 44 px minimum)
> **Et** tant que je n'ai pas confirmé, l'habitude n'est pas supprimée

**Scénario 3 — Suppression effective après confirmation**
> **Étant donné** la demande de confirmation de suppression est affichée pour une habitude
> **Quand** je confirme la suppression
> **Alors** l'habitude disparaît immédiatement de la liste des habitudes (elle n'est plus listée du tout, y compris sans badge, contrairement à une habitude en pause — US-015)
> **Et** elle n'apparaît plus dans le planning des jours suivants
> **Et** contrairement à l'hypothèse initialement envisagée, son historique de complétion déjà enregistré (`HabitCompletion`) est **conservé** et continue d'être pris en compte dans le résumé « Habit tracker » (US-005) sur les périodes où elle était active — la suppression retire l'habitude de la gestion active, mais ne détruit pas les statistiques déjà accumulées
> **Et**, contrairement à la mise en pause (US-015), cette suppression est **irréversible** : il n'existe aucune action de « réactiver » ou « restaurer » une habitude supprimée

**Scénario 4 — Annulation de la confirmation**
> **Étant donné** la demande de confirmation de suppression est affichée pour une habitude
> **Quand** je choisis d'annuler plutôt que de confirmer
> **Alors** l'habitude n'est pas supprimée
> **Et** elle reste visible normalement dans la liste, à l'état actif ou en pause qu'elle avait avant le geste

**Scénario 5 — Fermeture du bouton poubelle sans suppression**
> **Étant donné** le bouton poubelle est visible sur la carte d'une habitude après un glissement
> **Quand** je n'interagis pas avec ce bouton (par exemple j'interagis ailleurs sur l'écran)
> **Alors** le bouton poubelle se referme sans qu'aucune suppression n'ait eu lieu
> *(le déclencheur exact de cette fermeture — tap ailleurs, glissement d'une autre carte, délai — est un détail d'interaction laissé au développeur, voir Notes)*

### Priorité
Should — améliore la gestion au quotidien d'une liste d'habitudes qui grandit, mais n'est pas bloquant pour le MVP déjà livré (US-001/US-004).

### Estimation
M — geste de glissement sur la carte existante (US-010), bouton contextuel, boîte de confirmation, retrait de l'habitude de la gestion active tout en préservant son historique de complétion dans le repository/store (soft-delete, cf. Notes), tests domain + composant.

### Dépendances
US-001 (création/édition d'une habitude — écran et carte existants), US-010 (cards horizontales pleine largeur — support visuel du geste de glissement), US-015 (mise en pause — introduit déjà une notion de statut sur l'habitude ; la suppression doit réutiliser/étendre le même mécanisme de statut plutôt qu'un second système parallèle).

### Notes / hors périmètre
- Le **sens du glissement** (gauche/droite) et le **comportement exact de fermeture** du bouton poubelle si l'utilisateur n'appuie pas dessus ne sont pas prescrits par cette US : ce sont des détails d'interaction laissés à l'appréciation du développeur, du moment que le geste reste découvrable et non accidentel sur mobile (usage principal iPhone/PWA, cf. ADR-002).
- **Clarifié avec l'utilisateur (2026-08-12)** : la suppression conserve l'historique de complétion (contrairement à l'hypothèse initiale de suppression en cascade). Sur le plan technique, cela implique un **soft-delete** : l'habitude n'est pas retirée physiquement du repository, mais marquée dans un état terminal (ex. `statut: "supprimée"`, distinct de `actif`/`en pause` introduits par US-015) qui l'exclut définitivement de la liste des habitudes et du planning, sans possibilité de retour arrière — à la différence de la pause qui reste visible et réversible. Le résumé (US-005) doit continuer de lire l'historique des habitudes supprimées pour les périodes où elles étaient actives.
- Ne couvre pas la suppression groupée (plusieurs habitudes à la fois).
- Ne couvre pas un mécanisme d'« annuler la suppression » après confirmation (type snackbar « Annuler » quelques secondes) : la confirmation préalable (scénario 2) est le seul garde-fou prévu par cette US. À envisager comme amélioration future si le besoin se confirme.
- Le geste de glissement est pensé mobile-first (tactile) ; une alternative non gestuelle pour un usage clavier/souris (desktop) n'est pas un critère testable de cette US mais reste une bonne pratique d'accessibilité à considérer par le développeur.

## Implémentation

**Note sur l'ordre de traitement** : le backlog recommandait d'implémenter US-015 avant US-013 pour
introduire le mécanisme de statut en premier. L'utilisateur ayant explicitement demandé l'ordre
013 → 014 → 015 → 016, le mécanisme de statut (`HabitStatus`/`TaskRecordStatus`) a été conçu et
construit dès cette US-013 de façon à couvrir directement les trois états `active`/`paused`/`deleted`
(et non les deux seuls `active`/`deleted` nécessaires à cette US), pour que US-015 n'ait plus qu'à
ajouter les actions et le badge de pause sur un mécanisme déjà en place — conformément à l'esprit de
la dépendance documentée (« réutiliser/étendre le même mécanisme de statut plutôt qu'un second
système parallèle »), sans revenir sur l'ordre demandé.

Critères d'acceptation : les 5 scénarios sont couverts et vérifiés par les tests automatisés
(voir fichiers ci-dessous).

### Fichiers créés
- `src/lib/components/SwipeToDelete.svelte` + `.test.ts` + `SwipeToDeleteTestHost.svelte` (hôte de test) : geste de glissement (pointer events) réutilisable, révèle un bouton poubelle (44px min), referme sans action au clic ailleurs sur la carte (scénario 5). Partagé avec US-014.
- `src/lib/components/ConfirmDialog.svelte` : boîte de confirmation générique (message + Confirmer/Annuler), réutilisée par US-014.
- `src/routes/habitudes/HabitCard.svelte` + `.test.ts` : carte d'habitude colocalisée, assemble `SwipeToDelete` + `ConfirmDialog`, édition au clic normal.

### Fichiers modifiés
- `src/lib/domain/types.ts` : ajout de `HabitStatus` (`active`/`paused`/`deleted`) et `Habit.status?` (optionnel, rétro-compatible avec les habitudes déjà persistées) ; ajout de `TaskRecordStatus` (`active`/`deleted`) et `Task.status?` (préparation US-014).
- `src/lib/domain/habits.ts` : `habitStatus`, `isHabitActive`, `isHabitPaused`, `isHabitDeleted`, `visibleHabits` (filtre les supprimées pour la liste de gestion).
- `src/lib/domain/occurrences.ts` : `habitsDueOn` exclut désormais les habitudes non actives (en pause ou supprimées) du planning.
- `src/lib/stores/habits.store.svelte.ts` : `setStatus(habitId, status)` (mécanisme unique bascule/suppression, réutilisé par US-015) et `remove(habitId)` (soft-delete → `status: 'deleted'`).
- `src/routes/habitudes/+page.svelte` : liste filtrée via `visibleHabits`, rendu par `HabitCard`, coordination d'une seule carte révélée à la fois (`revealedHabitId`), câblage de la suppression.
- `src/lib/components/index.ts` : export de `SwipeToDelete` et `ConfirmDialog`.
- Tests étendus : `src/lib/domain/habits.test.ts`, `src/lib/domain/occurrences.test.ts`, `src/lib/stores/habits.store.svelte.test.ts`.

### Comment tester manuellement
1. `npm run dev`, aller sur `/habitudes` avec au moins une habitude.
2. Sur mobile/tactile (ou souris en émulant un drag), glisser une carte vers la gauche : un bouton poubelle apparaît.
3. Cliquer le bouton poubelle → une confirmation apparaît avec le nom de l'habitude et la mention du caractère définitif.
4. Confirmer → l'habitude disparaît de la liste et du planning (`/`) ; son historique reste visible dans `/resume`.
5. Recommencer et cliquer « Annuler » → l'habitude reste inchangée. Glisser puis cliquer ailleurs sur la carte → le bouton se referme sans suppression.

### Dette assumée
- Le geste est un seuil discret (glisser > 40px révèle/referme), pas un suivi pixel-par-pixel du doigt — acceptable au regard des Notes de l'US (détail d'interaction laissé au développeur).
- Pas d'alternative clavier/souris dédiée au geste de glissement (hors périmètre explicite de l'US) ; la suppression reste toutefois possible au clavier une fois le bouton poubelle révélé par glissement.
