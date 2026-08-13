---
type: user-story
id: US-022
titre: Rappel push nominatif à l'heure limite d'une tâche
date: 2026-08-12
auteur: product-owner
statut: livrée
priorite: Should
estimation: L
source: chat
depend_de: ["US-021", "US-007"]
---

## Titre : US-022 — Rappel push nominatif à l'heure limite d'une tâche

### Récit
> **En tant qu'** utilisateur de l'app,
> **je veux** recevoir une notification qui nomme la ou les tâches concernées au moment de leur heure limite,
> **afin de** ne pas manquer une échéance précise sans avoir à deviner de quelle tâche il s'agit.

### Critères d'acceptation

**Scénario 1 — Rappel nominatif pour une tâche unique**
> **Étant donné** une tâche « Payer facture EDF » a une heure limite fixée à 18:00 aujourd'hui, et les rappels sont activés
> **Quand** ce créneau de 18:00 survient (avec la latence possible du scheduler, jusqu'à ~15 minutes)
> **Alors** je reçois une notification dont le contenu **nomme explicitement** cette tâche (ex : « Payer facture EDF — à faire avant 18:00 »)

**Scénario 2 — Groupement des tâches d'un même créneau de 15 minutes en un seul push**
> **Étant donné** deux tâches, « Payer facture EDF » et « Appeler le plombier », ont toutes deux une heure limite tombant dans le même créneau de 15 minutes (ex : 18:00)
> **Quand** ce créneau survient
> **Alors** je reçois **une seule** notification qui nomme les deux tâches (ex : « 2 tâches arrivent à échéance : Payer facture EDF, Appeler le plombier »)
> **Et** je ne reçois jamais deux notifications distinctes pour deux tâches du même créneau de 15 minutes

**Scénario 3 — Aucun rappel nominatif pour une tâche sans heure limite**
> **Étant donné** une tâche n'a pas d'heure limite renseignée (US-021)
> **Quand** le jour de sa date arrive
> **Alors** elle ne déclenche aucune notification de type « heure limite » ; elle continue seulement de pouvoir être comptée, de façon non nominative, dans le récap matinal générique des habitudes/tâches du jour déjà prévu par US-007

**Scénario 4 — Pas de rappel si la tâche est déjà faite, sous réserve de resynchronisation (best-effort)**
> **Étant donné** j'ai coché la tâche « Payer facture EDF » comme faite, et j'ai rouvert l'application depuis ce cochage (ce qui déclenche la resynchronisation décrite par US-023)
> **Quand** son heure limite survient
> **Alors** je ne reçois pas de notification pour cette tâche

> **Étant donné** j'ai coché la tâche comme faite, mais je n'ai PAS rouvert l'application depuis (le serveur ignore encore que la tâche est faite)
> **Quand** son heure limite survient
> **Alors** je peux quand même recevoir la notification nommant cette tâche, malgré sa complétion
> **Et** ce comportement est un compromis assumé (best-effort) de l'architecture (cf. ADR-001) : le serveur ne connaît l'état de complétion que si l'app a resynchronisé sa fenêtre avant l'heure d'envoi

**Scénario 5 — Latence bornée par la granularité du scheduler**
> **Étant donné** une tâche a une heure limite fixée à 18:00
> **Quand** le push correspondant est envoyé
> **Alors** il peut arriver jusqu'à environ 18:15 (latence due à la granularité du scheduler cron, ~15 min), sans jamais garantir un envoi à la minute près

**Scénario 6 — Activation liée au réglage global des rappels**
> **Étant donné** les rappels sont désactivés globalement dans les réglages (US-007)
> **Quand** l'heure limite d'une tâche survient
> **Alors** je ne reçois aucune notification, ni générique ni nominative, tant que les rappels ne sont pas réactivés

### Priorité
Should — apporte une valeur concrète et ciblée sur les tâches à échéance précise, mais n'est pas un pré-requis du MVP déjà livré (US-007).

### Estimation
L — introduit une seconde fenêtre d'échéances (distincte de la fenêtre « récap matinal des habitudes »), avec une logique de groupement par créneau de 15 minutes et un contenu nominatif à construire, tout en respectant l'infrastructure Web Push déjà en place (ADR-001, US-007).

### Dépendances
- **US-021** : l'heure limite d'une tâche doit exister avant de pouvoir déclencher un rappel à ce moment-là.
- **US-007** : réutilise le mécanisme Web Push / micro-scheduler / activation globale des rappels déjà livré.
- **US-023** : la resynchronisation à chaque cochage réduit (sans l'éliminer) le risque de rappel sur une tâche déjà faite — voir scénario 4.

### Notes / hors périmètre
- **Révision explicite d'US-007 et d'ADR-001** : ces deux documents posaient la règle « le contenu du push ne nomme jamais une habitude/tâche ». Cette US **révise cette règle** sur décision assumée de l'utilisateur (téléphone personnel) : le contenu du push peut désormais nommer la ou les tâches concernées. Une note de renvoi a été ajoutée dans US-007 et un amendement daté a été ajouté à ADR-001 (voir ces documents).
- Le récap matinal générique des habitudes (US-007) **n'est pas modifié par cette US** et reste non nominatif — seule la notification déclenchée par l'heure limite d'une tâche devient nominative. Le contenu du récap matinal pourrait être aligné plus tard sur cette même révision si le PO le décide explicitement ; ce n'est **pas** couvert ici.
- Ne couvre pas les habitudes : aucune notion d'« heure limite » n'existe pour une habitude (arbitrage produit 2026-08-12, cf. US-021).
- **Conséquence côté serveur, à ne pas sous-estimer au chiffrage** : pour émettre un push
  nominatif à l'heure dite, le micro-scheduler doit disposer du libellé de la tâche au moment
  de l'émission. Le **libellé devra donc être persisté dans Netlify Blobs** aux côtés du
  timestamp d'échéance — ce qui déroge au principe « aucune donnée métier côté serveur »
  d'ADR-001. La dérogation est circonscrite aux tâches ponctuelles à heure limite (le récap
  matinal d'US-007 reste sans libellé stocké), et la politique de purge de ces libellés
  (après émission, et lors de chaque resynchronisation de la fenêtre) est à définir à
  l'implémentation. Voir l'amendement du 2026-08-12 dans ADR-001.
- Le groupement (scénario 2) se fait strictement **par créneau de 15 minutes**, pas de fusion entre créneaux différents de la même journée (deux créneaux distincts donnent deux pushs distincts, chacun potentiellement groupé en interne).

## Implémentation

Tous les scénarios sont satisfaits et couverts par des tests (domaine + store ; les fonctions
Netlify ne sont, comme le reste de l'infrastructure push existante depuis US-007, pas couvertes
par des tests automatisés — hors du périmètre `svelte-check`/Vitest de ce projet, sanity-check
manuel via `tsc --noEmit` effectué).

**Fichiers créés/modifiés (client) :**
- `src/lib/domain/reminders.ts` — nouveau type `ScheduledTaskReminder` (`sendAt`, `title`,
  `body` — contenu déjà composé côté client) et nouvelle fonction pure
  `computeTaskReminderWindow(tasks, settings, horizonDays, now, completions)` : filtre les
  tâches actives avec heure limite et non faites (best-effort), groupe celles qui tombent au
  même instant (`sendAt` identique, donc même créneau de 15 min déjà garanti par l'arrondi
  d'US-021) en un seul rappel, compose un message nominatif single/groupé.
- `src/lib/push/client.ts` — `pushSchedule` accepte un 3ᵉ paramètre optionnel `taskReminders`,
  envoyé dans le même appel `register-subscription` que `reminders`.
- `src/lib/stores/reminders.store.svelte.ts` — `enable`/`sync` acceptent `tasks`/`taskCompletions`
  en plus, calculent `computeTaskReminderWindow` et le poussent avec la fenêtre habitudes.
  `disable` coupe les deux canaux (suppression complète de la souscription serveur).
- `src/routes/+layout.svelte` — charge `tasksStore` au démarrage et transmet
  `tasksStore.tasks`/`completionsStore.taskCompletions` à `remindersStore.sync` (resynchronisation
  à chaque ouverture de l'app, scénario 4 positif).
- `src/routes/reglages/+page.svelte` — idem pour les appels `enable`/`sync` déclenchés par
  l'activation des rappels et le changement d'heure du récap matinal.

**Fichiers créés/modifiés (serveur, `netlify/functions/`) :**
- `_shared/store.ts` — nouveau type `ScheduledTaskReminder` et champs optionnels
  `StoredSubscription.taskReminders`/`lastTaskSentAt` (marque anti-doublon dédiée, distincte de
  `lastSentAt` du canal générique).
- `register-subscription.ts` — accepte `taskReminders` en plus de `reminders` ; filtre
  défensivement toute entrée déjà passée avant écriture (politique de purge, volet
  « resynchronisation »).
- `_shared/send-due.ts` (`sendDueReminders`) — traite désormais deux canaux par abonnement : le
  récap générique inchangé (US-007), et un envoi nominatif par groupe de tâches dû (contenu déjà
  composé côté client, jamais recomposé côté serveur). Purge chaque groupe du stockage dès son
  émission (politique de purge, volet « après émission ») ; une souscription expirée (404/410)
  interrompt le traitement des deux canaux pour cet abonnement et le supprime.

**Fichiers de test modifiés :**
- `src/lib/domain/reminders.test.ts` — `computeTaskReminderWindow` : tâche unique nommée,
  groupement d'un même créneau, non-fusion de deux créneaux différents, aucune tâche sans heure
  limite, best-effort avec/sans resynchronisation, désactivation globale, exclusion tâche
  supprimée/instant passé/hors horizon.
- `src/lib/stores/reminders.store.svelte.test.ts` — `RemindersStore` pousse bien la fenêtre de
  tâches nominative en même temps que le récap habitudes, aucune entrée sans heure limite, no-op
  si rappels désactivés.

**Arbitrages techniques pris seuls (dans le cadre de l'amendement ADR-001, sans nouvelle
décision d'architecture) :**
1. Le contenu du push (`title`/`body`) est **composé côté client** (`domain/reminders.ts`), pas
   recomposé côté serveur — cohérent avec « la logique métier reste dans `domain/`
   » (CONVENTIONS.md §1) et minimise ce que le serveur a besoin de comprendre.
2. Marque anti-doublon dédiée (`lastTaskSentAt`) distincte de `lastSentAt` (habitudes) : deux
   canaux de contenu différents, purgés indépendamment, pour éviter qu'un envoi sur un canal
   n'empêche par erreur un envoi dû sur l'autre.
3. Fenêtre des tâches bornée par le même horizon par défaut que les habitudes (30 jours), par
   cohérence et pour borner la taille du payload envoyé au serveur — aucune exigence explicite
   de l'US sur ce point.
4. `register-subscription.ts` filtre défensivement les `taskReminders` déjà passés avant
   écriture, en plus du remplacement intégral déjà effectué par le client à chaque sync — double
   filet pour la politique de purge demandée par l'amendement.

**Comment tester manuellement (nécessite un déploiement Netlify avec VAPID configuré, et la PWA
installée sur écran d'accueil iOS — voir US-007) :**
1. Sur `/taches`, créer une tâche avec une heure limite proche (ex. dans 16-20 min, pour couvrir
   un passage du cron `*/15 * * * *`) et activer les rappels dans `/reglages`.
2. Attendre le créneau : une notification nommant la tâche doit arriver (« <nom> — à faire avant
   HH:MM »), avec jusqu'à ~15 min de latence.
3. Créer deux tâches avec la même heure limite arrondie : une seule notification groupée doit
   arriver, listant les deux noms.
4. Cocher une tâche comme faite puis rouvrir l'app avant son heure limite (resynchronisation) :
   plus de notification pour cette tâche.
5. Désactiver les rappels dans `/reglages` avant l'heure limite : aucune notification, ni
   générique ni nominative.
6. Utiliser `netlify/functions/trigger-send.ts` (secret `TRIGGER_SEND_SECRET`) pour déclencher
   l'envoi sans attendre le cron, comme pour US-007.

**Dette / points assumés :** aucun écart avec la spécification. La resynchronisation « à chaque
cochage » (au-delà de l'ouverture de l'app) reste hors périmètre de cette US, comme documenté
(dépendance explicite vers US-023, suivante). La validation en conditions réelles (notification
effectivement reçue sur iPhone) n'a pas pu être exécutée dans cet environnement de développement
(pas de déploiement Netlify ni d'iPhone disponibles ici) — comme pour US-007, cette validation
reste à faire sur appareil réel.
