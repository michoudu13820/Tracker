---
type: user-story
id: US-027
titre: Section « En pause / Supprimées » sur l'écran Habitudes et reprise automatique programmée
date: 2026-08-12
auteur: product-owner
statut: livrée
priorite: Should
estimation: M
source: chat
depend_de: ["US-013", "US-015"]
---

## Titre : US-027 — Section « En pause / Supprimées » sur l'écran Habitudes et reprise automatique programmée

### Récit
> **En tant qu'** utilisateur de l'app,
> **je veux** voir mes habitudes en pause et supprimées regroupées dans une section dédiée de l'écran Habitudes, et pouvoir définir une date de reprise automatique lors d'une mise en pause,
> **afin de** retrouver facilement ces habitudes et ne pas avoir à me souvenir moi-même de les réactiver.

### Critères d'acceptation

**Scénario 1 — Section dédiée regroupant pause et supprimées**
> **Étant donné** j'ai au moins une habitude active, une en pause (US-015) et une supprimée (US-013)
> **Quand** je consulte l'écran « Habitudes »
> **Alors** les habitudes actives sont listées normalement
> **Et** une section distincte « En pause / Supprimées » regroupe les habitudes en pause et supprimées, clairement séparée de la liste des habitudes actives

**Scénario 2 — Distinction visuelle pause vs supprimée au sein de la section**
> **Étant donné** la section « En pause / Supprimées » est affichée
> **Quand** je la consulte
> **Alors** je distingue immédiatement quelles habitudes sont « en pause » (réactivables) et lesquelles sont « supprimées »
> **Et** les actions déjà existantes (« Réactiver » pour une habitude en pause — US-015) restent disponibles depuis cette section

**Scénario 3 — Date de reprise automatique optionnelle à la mise en pause**
> **Étant donné** je mets une habitude en pause (US-015)
> **Quand** je choisis de renseigner en plus une date de reprise automatique (champ optionnel)
> **Et** je valide
> **Alors** cette date est enregistrée avec l'habitude
> **Et** si je ne renseigne aucune date, l'habitude reste en pause indéfiniment jusqu'à une réactivation manuelle, comme avant cette US (comportement inchangé d'US-015)

**Scénario 4 — Réactivation automatique à la date de reprise**
> **Étant donné** une habitude en pause a une date de reprise automatique fixée à un jour donné
> **Quand** ce jour arrive et que j'ouvre l'application
> **Alors** l'habitude redevient automatiquement active
> **Et** elle réapparaît dans le planning des jours suivants dès qu'elle est due selon sa fréquence, comme après une réactivation manuelle (US-015, scénario 4)

**Scénario 5 — Retrait de la date de reprise automatique**
> **Étant donné** une habitude en pause a une date de reprise automatique programmée
> **Quand** je modifie cette habitude depuis la section « En pause / Supprimées » pour retirer cette date
> **Et** je valide
> **Alors** l'habitude reste en pause sans reprise automatique programmée (retour à une pause manuelle simple, comme avant cette US)

### Priorité
Should — améliore la lisibilité de l'écran Habitudes (US-015/US-013 ont introduit deux statuts sans regroupement dédié) et réduit la charge mentale de devoir se souvenir de réactiver une habitude.

### Estimation
M — nouvelle section d'écran regroupant deux statuts déjà existants, plus un nouveau champ optionnel (date de reprise) et sa logique d'application automatique lors de l'ouverture de l'application.

### Dépendances
US-015 (statut « en pause »/« active » et actions de bascule, étendus par cette US), US-013 (statut « supprimée », affiché dans la même section), US-001/US-010 (écran et carte d'habitude).

### Notes / hors périmètre
- Le déclenchement de la reprise automatique est évalué **localement, à l'ouverture de l'application** (même principe que la resynchronisation d'US-007/US-023) : si l'application n'est pas ouverte le jour J, la réactivation effective a lieu à la prochaine ouverture, pas nécessairement pile ce jour-là. Limite assumée, cohérente avec l'architecture 100 % locale d'ADR-001 (pas de mécanisme serveur dédié à cette reprise).
- Ne couvre pas de restauration automatique programmée pour les habitudes **supprimées** (US-013) : seule la **pause** bénéficie d'une reprise automatique optionnelle. Une habitude supprimée ne peut être restaurée que manuellement (comportement existant d'US-013, non modifié ici).
- N'introduit pas de suppression définitive ni de purge automatique des éléments de cette section : elle reste un simple regroupement d'affichage des statuts existants.

## Implémentation

Tous les scénarios sont satisfaits et couverts par des tests.

**Fichiers modifiés :**
- `src/lib/domain/types.ts` — `Habit.resumeAt?: IsoDate`, pertinent uniquement si `status ===
  'paused'`.
- `src/lib/domain/habits.ts` — `activeHabits`, `pausedOrDeletedHabits` (partition pour les deux
  sections d'écran, scénario 1) et `isDueForAutoResume` (scénario 4).
- `src/lib/stores/habits.store.svelte.ts` — `setStatus` retire désormais `resumeAt` sur toute
  transition qui quitte `'paused'` (réactivation manuelle ou suppression) ; nouvelles méthodes
  `setResumeAt(habitId, resumeAt)` (scénarios 3/5) et `applyAutoResume(today)` (scénario 4,
  réactive et purge `resumeAt` des habitudes dont la date est atteinte).
- `src/routes/habitudes/HabitCard.svelte` — rendu à trois variantes selon le statut : active
  (inchangée), en pause (badge + « Réactiver » inchangés, + nouveau contrôle « Date de reprise
  automatique » réutilisé pour programmer/modifier/retirer la date, scénarios 3/5), supprimée
  (nouvelle variante **lecture seule** : badge « Supprimée », aucune action — pas de glisser, pas
  d'édition, pas de pause/réactivation).
- `src/routes/habitudes/+page.svelte` — deux listes distinctes : `displayedHabits` (actives) et
  une nouvelle section « En pause / Supprimées » (`pausedOrDeleted`, visible seulement si non
  vide) ; `applyAutoResume` appelé à l'ouverture de l'écran.
- `src/routes/+layout.svelte` — `applyAutoResume` également appelé à l'ouverture de l'app (même
  principe best-effort que la resynchronisation des rappels, US-007/US-023).

**Arbitrage assumé (documenté, pas de régression du test existant sans raison) :**
- US-013 (déjà livrée) spécifiait qu'une habitude supprimée « disparaît de la liste » de gestion
  (masquée sans trace). US-027 **révise explicitement** ce point : une habitude supprimée reste
  désormais visible, en lecture seule, dans la nouvelle section dédiée. Le test associé
  (`src/routes/habitudes/page.test.ts`) a été adapté pour refléter cette révision assumée par le
  PO (voir la note de renvoi ajoutée dans `US/done/US-013-...md`), pas contournée silencieusement.
- Le flux de mise en pause au clic sur « Mettre en pause » reste **inchangé** (immédiat, sans
  demander de date à cet instant précis) pour ne pas régresser le test déjà livré d'US-015. La
  date de reprise automatique (scénario 3) est proposée **juste après**, depuis la section
  « En pause / Supprimées », via un contrôle dédié qui sert aussi à la modifier/retirer ensuite
  (scénario 5) — interprétation qui satisfait le scénario 3 (« en plus » de la mise en pause) sans
  toucher au comportement déjà testé d'US-015.

**Fichiers de test créés/modifiés :**
- `src/lib/domain/habits.test.ts` — `activeHabits`, `pausedOrDeletedHabits`, `isDueForAutoResume`.
- `src/lib/stores/habits.store.svelte.test.ts` — `setResumeAt`, purge par `setStatus`,
  `applyAutoResume`.
- `src/routes/habitudes/HabitCard.test.ts` — variante lecture seule (supprimée), contrôle de
  reprise automatique (programmer/afficher/retirer), absence pour une habitude active.
- `src/routes/habitudes/page.test.ts` — section dédiée (scénarios 1/2), reprise automatique
  effective à l'ouverture pour une date atteinte/non atteinte (scénario 4), test de suppression
  adapté (voir arbitrage ci-dessus).

**Comment tester manuellement :** mettre une habitude en pause sur `/habitudes` (section « En
pause / Supprimées » apparaît), taper « + Date de reprise automatique », choisir une date passée
ou aujourd'hui, valider ; recharger l'app (ou revenir sur `/habitudes`) : l'habitude redevient
active automatiquement. Supprimer une autre habitude : elle apparaît en lecture seule, badge
« Supprimée », dans la même section.

**Dette / points assumés :** aucun écart avec le périmètre de l'US au-delà de l'arbitrage
documenté ci-dessus. Pas de restauration manuelle d'une habitude supprimée (hors périmètre,
comportement inchangé).
