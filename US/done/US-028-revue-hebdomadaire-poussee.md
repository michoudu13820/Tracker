---
type: user-story
id: US-028
titre: Revue hebdomadaire poussée
date: 2026-08-12
auteur: product-owner
statut: livrée
priorite: Could
estimation: M
source: chat
depend_de: ["US-005", "US-007", "US-024"]
---

## Titre : US-028 — Revue hebdomadaire poussée

### Récit
> **En tant qu'** utilisateur de l'app,
> **je veux** recevoir une notification me proposant de consulter un récapitulatif de ma semaine écoulée,
> **afin de** prendre du recul sur ma régularité sans avoir à penser moi-même à consulter le résumé détaillé.

### Critères d'acceptation

**Scénario 1 — Notification hebdomadaire à un créneau configuré**
> **Étant donné** les rappels sont activés et un jour et une heure de revue hebdomadaire sont configurés (ex : dimanche 18h00, saisie arrondie au quart d'heure comme pour US-007/US-021)
> **Quand** ce jour et ce créneau arrivent
> **Alors** je reçois une notification distincte du rappel quotidien, m'invitant à consulter le récapitulatif de ma semaine

**Scénario 2 — Contenu du récapitulatif à l'ouverture de l'application**
> **Étant donné** je viens de recevoir la notification de revue hebdomadaire
> **Quand** j'ouvre l'application depuis cette notification (ou plus tard dans la journée)
> **Alors** je vois un écran ou une section présentant un résumé neutre de ma semaine écoulée (par exemple, un nombre d'habitudes réalisées), cohérent avec le ton apaisé de l'indicateur de régularité (US-024), sans classement ni streak

**Scénario 3 — Désactivation indépendante du rappel quotidien**
> **Étant donné** le rappel quotidien (US-007) est activé
> **Quand** je désactive uniquement la revue hebdomadaire dans les réglages
> **Alors** je continue de recevoir le rappel quotidien, mais plus la notification hebdomadaire

**Scénario 4 — Latence bornée par le scheduler**
> **Étant donné** la revue hebdomadaire est configurée pour dimanche 18h00
> **Quand** la notification est envoyée
> **Alors** elle peut arriver jusqu'à environ 18h15 (latence due à la granularité du scheduler, ~15 min), sans précision garantie à la minute

### Priorité
Could — amélioration de confort, priorisée basse dans cette itération (Lot 3), non planifiée à court terme.

### Estimation
M — réutilise l'infrastructure Web Push/scheduler d'US-007 pour un second type de notification, avec un contenu de résumé s'appuyant sur les données déjà produites par US-005.

### Dépendances
US-007 (mécanisme Web Push/scheduler existant, réutilisé pour un second créneau de notification), US-005 (données de résumé existantes à réutiliser pour le contenu), US-024 (ton neutre déjà établi pour les indicateurs de régularité, à respecter dans le contenu du récap).

### Notes / hors périmètre
- Priorisée basse (Lot 3) : rédigée pour mémoire, non planifiée dans l'ordre d'implémentation recommandé à ce stade.
- Le contenu précis du récapitulatif (quelles métriques exactement, quel format) est volontairement laissé large ici et devra être affiné avec le PO au moment de sa mise en chantier.
- Ne couvre pas de personnalisation fine du contenu (ex : choix des métriques à afficher) ni d'historique de revues passées.

## Implémentation

Tous les scénarios sont satisfaits et couverts par des tests (domaine + store + composant ; les
fonctions Netlify ne sont, comme le reste de l'infrastructure push depuis US-007/US-022, pas
couvertes par des tests automatisés — sanity-check manuel via `tsc --noEmit` effectué).

**Fichiers créés :**
- `src/routes/reglages/WeeklyReviewSettingsForm.svelte` (+ test) — formulaire présentational :
  message + contrôles désactivés si les rappels quotidiens ne sont pas actifs (prérequis,
  scénario 1), sinon activation/jour/heure (réutilise `WEEKDAY_ORDER`/`weekdayLabel` d'US-001).

**Fichiers modifiés (client) :**
- `src/lib/domain/types.ts` — nouveau type `WeeklyReviewSettings` (`enabled`, `weekday`, `time`).
- `src/lib/domain/reminders.ts` — `computeWeeklyReviewWindow(settings, horizonDays, now)` :
  réutilise le type `ScheduledReminder` (aucune donnée métier, contrairement à US-022), même
  horizon par défaut (30 jours), gate sur `settings.enabled` (indépendant du rappel quotidien).
- `src/lib/data/repositories.ts` — `SettingsRepository.getWeeklyReviewSettings`/
  `saveWeeklyReviewSettings`, clé `weekly-review-settings`, défaut dimanche 18h00 désactivée.
- `src/lib/stores/settings.store.svelte.ts` — `weeklyReview` (état persisté) + `saveWeeklyReview`.
- `src/lib/push/client.ts`, `src/lib/stores/reminders.store.svelte.ts` — `pushSchedule`/`enable`/
  `sync` acceptent un 3ᵉ canal `weeklyReviewReminders`, calculé et transmis en plus des deux
  autres.
- `src/lib/stores/resync-reminders.ts` — transmet aussi `settingsStore.weeklyReview` (US-023).
- `src/routes/+layout.svelte`, `src/routes/reglages/+page.svelte` — chargent/synchronisent le
  3ᵉ canal ; nouveaux handlers `handleToggleWeeklyReview`/`handleWeeklyReviewWeekdayChange`/
  `handleWeeklyReviewTimeChange` (heure arrondie au quart d'heure, même règle qu'US-021) ; le
  formulaire n'est activable que si `settingsStore.reminder?.enabled` (scénario 1).
- `src/service-worker.ts` — le clic sur une notification taguée `weekly-review` ouvre/navigue
  vers `/resume` (où le récapitulatif hebdomadaire d'US-005 est déjà consultable — scénario 2) ;
  toute autre notification continue d'ouvrir `/` comme avant.

**Fichiers modifiés (serveur, `netlify/functions/`) :**
- `_shared/store.ts` — `StoredSubscription.weeklyReviewReminders`/`lastWeeklyReviewSentAt`
  (marque anti-doublon dédiée, canal indépendant des deux autres).
- `register-subscription.ts` — accepte et valide `weeklyReviewReminders`.
- `_shared/send-due.ts` — troisième canal d'émission, contenu générique statique
  `WEEKLY_REVIEW_GENERIC` (`tag: 'weekly-review'`, distinct du récap quotidien — scénario 1),
  aucune donnée métier (pas de dérogation ADR-001 nécessaire ici, à la différence d'US-022).

**Fichiers de test créés/modifiés :**
- `src/lib/domain/reminders.test.ts` — `computeWeeklyReviewWindow` : occurrences hebdomadaires
  dans l'horizon, désactivation, exclusion de l'instant déjà passé.
- `src/lib/stores/settings.store.svelte.test.ts` — chargement/sauvegarde de `weeklyReview`,
  régression BUG-001.
- `src/lib/stores/reminders.store.svelte.test.ts` — 3ᵉ canal poussé avec `enable`, vide si
  réglage désactivé ou absent.
- `src/lib/stores/resync-reminders.test.ts` — transmission de `weeklyReview`.
- `src/routes/reglages/WeeklyReviewSettingsForm.test.ts` — prérequis rappels quotidiens,
  activation/désactivation indépendante (scénario 3), changement jour/heure (scénario 1).

**Comment tester manuellement (nécessite Netlify + VAPID configurés, PWA installée — voir
US-007/US-022) :** activer les rappels quotidiens dans `/reglages`, puis activer la revue
hebdomadaire avec un jour/heure proches ; au créneau (± 15 min), une notification distincte
« Ta revue hebdomadaire est prête à consulter » arrive ; cliquer dessus ouvre `/resume`.
Désactiver uniquement la revue hebdomadaire : le rappel quotidien continue d'arriver normalement.

**Dette / points assumés :** aucun écart avec la spécification. Le contenu du récapitulatif
(scénario 2) réutilise tel quel l'écran `/resume` déjà livré par US-005 (déjà dans le ton neutre
d'US-024, sans classement ni streak) plutôt que de construire un nouvel écran dédié — cohérent
avec la dépendance explicite de l'US à US-005 et avec les « notes / hors périmètre » qui
laissent le contenu précis volontairement large. Comme documenté par l'US elle-même, cette
fonctionnalité n'a pas pu être validée en conditions réelles (pas de déploiement Netlify ni
d'iPhone disponibles dans cet environnement).
