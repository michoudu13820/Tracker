---
type: user-story
id: US-023
titre: Resynchronisation de la fenêtre d'échéances à chaque cochage
date: 2026-08-12
auteur: product-owner
statut: livrée
priorite: Should
estimation: M
source: chat
depend_de: ["US-007", "US-022"]
---

## Titre : US-023 — Resynchronisation de la fenêtre d'échéances à chaque cochage

### Récit
> **En tant qu'** utilisateur de l'app,
> **je veux** que la fenêtre d'échéances envoyée au serveur soit remise à jour dès que je coche ou décoche une habitude ou une tâche,
> **afin de** réduire le risque de recevoir un rappel pour quelque chose que j'ai déjà fait, sans attendre la prochaine ouverture de l'application.

### Critères d'acceptation

**Scénario 1 — Resynchronisation immédiate au cochage**
> **Étant donné** l'application est ouverte et j'ai une tâche à heure limite (US-021/US-022) ou une habitude due aujourd'hui (US-007) non encore cochée
> **Quand** je coche cet élément comme fait
> **Alors** l'application recalcule et repousse immédiatement au serveur la fenêtre d'échéances mise à jour, sans attendre une prochaine ouverture de l'application

**Scénario 2 — Resynchronisation également au décochage**
> **Étant donné** un élément était coché comme fait
> **Quand** je le décoche
> **Alors** la fenêtre d'échéances est également resynchronisée, de sorte que l'élément redevienne éligible à un rappel s'il est encore dû

**Scénario 3 — Limite structurelle assumée : best-effort si l'app n'est pas ouverte**
> **Étant donné** je réalise une tâche ou une habitude dans la vraie vie **sans ouvrir l'application** (donc sans cocher quoi que ce soit dans l'app)
> **Quand** l'heure du rappel correspondant survient
> **Alors** le rappel part quand même, car le serveur ignore que l'élément a été fait en dehors de l'application
> **Et** ce comportement est une **limite structurelle assumée** de l'architecture (cf. ADR-001) : le serveur ne connaît l'état de complétion que si l'application a été ouverte et que l'élément a été coché avant l'heure d'envoi

**Scénario 4 — Cohérence avec la resynchronisation déjà existante à l'ouverture de l'app**
> **Étant donné** l'application est fermée puis rouverte
> **Quand** elle se charge
> **Alors** elle continue de resynchroniser la fenêtre d'échéances au démarrage, comme déjà prévu par US-007
> **Et** cette resynchronisation au démarrage s'ajoute à — sans la remplacer — la resynchronisation désormais déclenchée à chaque cochage/décochage individuel décrite par les scénarios 1 et 2

**Scénario 5 — Portée : habitudes et tâches à heure limite**
> **Étant donné** je coche une habitude due aujourd'hui, ou une tâche ayant une heure limite
> **Quand** le cochage a lieu
> **Alors** la resynchronisation s'applique dans les deux cas (fenêtre du récap matinal des habitudes, ET fenêtre des rappels nominatifs de tâches à heure limite), sans qu'un des deux cas soit oublié

### Priorité
Should — réduit un risque concret de rappel « inutile » identifié dès US-007 (scénario 8, best-effort), mais reste une amélioration de fiabilité, pas un pré-requis bloquant.

### Estimation
M — étend un mécanisme de resynchronisation déjà existant (US-007, déclenché à l'ouverture de l'app) pour le déclencher aussi à chaque action de cochage/décochage, sur les deux fenêtres d'échéances (habitudes et tâches à heure limite).

### Dépendances
- **US-007** : le mécanisme de resynchronisation de la fenêtre de rappels des habitudes existe déjà (déclenché à l'ouverture de l'app) ; cette US le rend plus réactif.
- **US-022** : introduit la seconde fenêtre d'échéances (tâches à heure limite) que cette US doit également resynchroniser.

### Notes / hors périmètre
- **La limite best-effort reste entière** (cf. ADR-001, « le serveur ne connaît pas l'état de complétion ») : cette US réduit la fenêtre de risque (resynchronisation plus fréquente) mais ne l'élimine pas. Elle ne doit jamais être présentée comme une garantie d'annulation du rappel.
- Ne couvre pas un mécanisme d'annulation explicite d'un push déjà programmé côté serveur : la resynchronisation consiste à repousser une fenêtre d'échéances à jour, pas à révoquer un envoi individuel déjà en file.
- N'introduit aucune nouvelle interface utilisateur visible : cette US est une amélioration de fiabilité interne, sans impact sur l'écran de réglages au-delà de ce qui existe déjà (US-007).

## Implémentation

Tous les scénarios sont satisfaits et couverts par des tests.

**Fichiers créés :**
- `src/lib/stores/resync-reminders.ts` — nouvelle fonction de coordination
  `resyncReminders()` : lit l'état courant des stores singleton (`settingsStore`,
  `habitsStore`, `tasksStore`, `completionsStore`) et appelle `remindersStore.sync(...)` avec
  les deux fenêtres (récap habitudes US-007 + rappels nominatifs de tâches US-022). No-op si
  les réglages ne sont pas chargés (délègue le reste des cas no-op — pas de souscription, pas
  activé — à `RemindersStore.sync`, déjà couvert par ses propres tests). Centralise ce qui
  aurait sinon été dupliqué dans chaque route qui coche/décoche.

**Fichiers modifiés :**
- `src/routes/+page.svelte` — `handleHabitToggle`, `handleProgressAdd`,
  `handleProgressCorrect` et `handleTaskToggle` appellent désormais `resyncReminders()` après
  avoir persisté le changement de complétion (scénarios 1/2/5). Les habitudes à cible chiffrée
  (US-018) sont incluses par cohérence : elles font aussi basculer l'état fait/pas fait consommé
  par la fenêtre de rappels des habitudes.
- `src/routes/taches/+page.svelte` — `handleToggle` appelle `resyncReminders()` après le
  cochage/décochage d'une tâche (scénarios 1/2/5).

**Fichiers de test créés/modifiés :**
- `src/lib/stores/resync-reminders.test.ts` (nouveau) — no-op sans réglages chargés, transmission
  correcte des deux fenêtres avec l'état courant des stores.
- `src/routes/page.test.ts` — nouveau bloc « resynchronisation des rappels au cochage » :
  cochage/décochage d'une habitude et d'une tâche déclenchent `remindersStore.sync` (espionné).
- `src/routes/taches/page.test.ts` (nouveau) — même vérification côté écran « Tâches ».

**Comment tester manuellement :** avec les rappels activés (`/reglages`) et une tâche à heure
limite proche ou une habitude due aujourd'hui, cocher l'élément depuis `/` ou `/taches` : un
appel réseau `POST register-subscription` part immédiatement (visible dans les outils de
développement réseau du navigateur), sans attendre une fermeture/réouverture de l'app.

**Dette / points assumés :** aucun écart avec la spécification. Le best-effort reste entier
(scénario 3, non « corrigible » par construction — dépend de l'ouverture de l'app). Un léger
arbitrage : la resynchronisation a aussi été branchée sur les habitudes à cible chiffrée
(US-018, ajout/correction de progression), au-delà des seules cases à cocher classiques
mentionnées explicitement par les scénarios — cohérent avec l'intention de l'US (tout ce qui
fait basculer l'état fait/pas fait d'une habitude due) et sans en changer le périmètre déclaré.
