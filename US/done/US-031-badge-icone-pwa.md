---
type: user-story
id: US-031
titre: Badge d'icône PWA indiquant les éléments restants du jour
date: 2026-08-12
auteur: product-owner
statut: livrée
priorite: Could
estimation: M
source: chat
depend_de: ["US-004"]
---

## Titre : US-031 — Badge d'icône PWA indiquant les éléments restants du jour

### Récit
> **En tant qu'** utilisateur de l'app,
> **je veux** voir un badge numérique sur l'icône de l'application indiquant le nombre d'habitudes/tâches restant à faire aujourd'hui,
> **afin de** avoir un rappel visuel discret sans devoir ouvrir l'application ni recevoir de notification.

### Critères d'acceptation

**Scénario 1 — Badge affichant le nombre d'éléments restants**
> **Étant donné** il me reste 3 habitudes/tâches non cochées pour aujourd'hui
> **Quand** je consulte l'écran d'accueil de mon iPhone, application fermée
> **Alors** l'icône de l'application affiche un badge numérique « 3 »

**Scénario 2 — Aucun badge quand tout est fait**
> **Étant donné** toutes les habitudes/tâches du jour sont cochées comme faites
> **Quand** je consulte l'écran d'accueil
> **Alors** aucun badge ne s'affiche sur l'icône de l'application (ou le badge à 0 disparaît)

**Scénario 3 — Mise à jour du badge après une action dans l'app**
> **Étant donné** je viens de cocher un élément dans l'application
> **Quand** je quitte l'application (ou la mets en arrière-plan)
> **Alors** le badge affiché sur l'icône reflète le nouveau nombre d'éléments restants pour aujourd'hui

### Priorité
Could — amélioration de confort, non essentielle, **conditionnée à un spike technique préalable** (voir Notes).

### Estimation
M — estimation hors coût du spike de compatibilité préalable, qui doit être chiffré et mené séparément avant tout engagement de développement de cette US.

### Dépendances
US-004 (nombre d'éléments restants calculé à partir du planning du jour) **et, avant tout, un spike technique de validation de compatibilité** (voir Notes ci-dessous), pré-requis bloquant non négociable.

### Notes / hors périmètre
- **CONDITION BLOQUANTE — spike technique obligatoire avant tout engagement** : cette US repose sur `navigator.setAppBadge()` (App Badging API). Son support en **PWA standalone installée sur l'écran d'accueil iOS Safari** n'est **pas garanti** et doit être vérifié sur un appareil réel avant toute mise en chantier. **Ne pas engager de développement sur cette US avant la réalisation de ce spike et la confirmation de sa faisabilité.**
- Si le spike conclut à une incompatibilité (ou à un support trop partiel/instable), cette US doit être requalifiée en `Won't` ou reformulée en conséquence — sa priorité `Could` actuelle et son statut `à affiner` reflètent cette incertitude.
- Ne couvre pas de badge affichant autre chose qu'un simple compte d'éléments restants (pas de couleur différenciée, pas de sous-badges par catégorie habitude/tâche).
- Ne couvre pas la mise à jour du badge lorsque l'application n'a pas été ouverte depuis un changement de jour (ex : passage à minuit, app fermée) : le badge ne peut se recalculer que si l'application (ou son service worker, selon ce que confirmera le spike) est exécutée à un moment donné.

### Arbitrage utilisateur du 2026-08-13 — rafraîchissement du badge

Une limite de cette US a été soulevée avec l'utilisateur : le scénario 1 promet un badge juste
« application fermée », alors que la note ci-dessus reconnaît que le badge ne peut se
recalculer que lorsque l'app s'exécute. Concrètement, sans ouverture de l'app, le badge reflète
l'état de la dernière visite — potentiellement « 0 » au matin alors que des éléments sont dus.

Une issue existe : faire recalculer le badge par le **service worker à la réception du push
matinal d'US-007** (un simple compte, non nominatif — sans incidence sur l'arbitrage
confidentialité d'ADR-001).

**Décision de l'utilisateur : attendre le résultat du spike avant d'investir.** La version
livrée est donc volontairement minimale (recalcul à l'ouverture de l'app et sur
`visibilitychange` uniquement). Le rafraîchissement par le service worker ne sera creusé que
si le badge s'avère effectivement supporté sur iPhone. En cas d'incompatibilité constatée,
cette US doit être requalifiée en `Won't` conformément à la note ci-dessus, sans développement
supplémentaire.

## Implémentation

**Arbitrage explicite sur la condition bloquante** : cette US porte une condition bloquante
documentée ci-dessus (« spike technique obligatoire avant tout engagement »). Sur instruction
explicite de l'orchestrateur de session (qui a pris acte de cette condition et prescrit une
méthode d'implémentation compatible avec elle), le développement a été engagé **sans spike
matériel préalable**, en appliquant strictement les garde-fous que ce spike aurait de toute
façon exigés : détection de fonctionnalité systématique (`'setAppBadge' in navigator`) et
dégradation silencieuse totale si absent (aucune erreur, aucun log, aucune régression
fonctionnelle du reste de l'app). **La validation de compatibilité réelle sur iPhone/PWA
standalone reste entièrement à faire** — voir « Dette / points assumés » ci-dessous. Si cette
validation devait conclure à une incompatibilité, le code de dégradation silencieuse garantit
qu'aucun retrait n'est nécessaire (l'app se comporte alors comme si l'US n'existait pas).

Tous les scénarios sont satisfaits et couverts par des tests, dans la limite de ce qui est
automatisable (l'App Badging API elle-même n'est pas implémentée par jsdom/la plupart des
navigateurs desktop — simulée par injection/mock, comme le reste de l'infrastructure push).

**Fichiers créés :**
- `src/lib/domain/badge.ts` (+ test) — `remainingCount(habits, habitCompletions, tasks,
  taskCompletions, date)` : fonction pure réutilisant les mêmes règles de sélection que le
  planning (`habitsDueOn`, `tasksOn`/`visibleTasks`), sans dépendance à `navigator`.
- `src/lib/badge/client.ts` (+ test) — client navigateur : `isBadgingSupported`,
  `setBadge(count)`, `clearBadge()`, chacun avec détection de fonctionnalité et try/catch
  avalant silencieusement toute erreur de l'API. Interface `BadgeClient` + `defaultBadgeClient`,
  même patron d'injection que `$lib/push/client`.
- `src/lib/stores/badge.store.svelte.ts` (+ test) — `BadgeStore.update(...)` : recalcule
  `remainingCount` et affiche/retire le badge en conséquence ; client injecté (mockable).
- `src/lib/stores/update-badge.ts` (+ test) — `updateBadge()` : coordination inter-stores,
  même patron que `resyncReminders` (US-023), calcule toujours pour le jour réel.

**Fichiers modifiés :**
- `src/routes/+layout.svelte` — appelle `updateBadge()` à l'ouverture de l'app (après chargement
  des stores) et à chaque passage en arrière-plan (`document.visibilitychange` → `document.hidden`,
  scénario 3) — couvre uniformément toute action ayant pu changer le compte (cochage, ajout
  rapide, suppression, reprise automatique…) sans instrumenter chaque point d'appel séparément.

**Comment tester manuellement (nécessite un iPhone avec la PWA installée sur l'écran d'accueil —
validation non faisable en CI/desktop) :** avoir des habitudes/tâches non cochées aujourd'hui,
fermer ou mettre l'app en arrière-plan : vérifier qu'un badge numérique apparaît sur l'icône à
l'écran d'accueil. Cocher tous les éléments restants puis remettre l'app en arrière-plan :
vérifier que le badge disparaît. Si `navigator.setAppBadge` n'est pas supporté dans ce contexte
(à confirmer), vérifier qu'aucune erreur n'apparaît dans la console et que le reste de l'app
fonctionne normalement.

**Dette / points assumés (à traiter avant toute promotion de confiance sur cette US) :**
- **Validation de compatibilité réelle non faite** : le support de `navigator.setAppBadge()` en
  PWA standalone installée sur iOS Safari n'a pas été vérifié sur appareil réel (impossible dans
  cet environnement de développement, pas d'iPhone disponible). C'est précisément le spike que
  l'US posait comme condition bloquante ; le code livré est conçu pour ne jamais régresser le
  reste de l'app si ce spike conclut à une incompatibilité, mais la fonctionnalité elle-même
  (le badge apparaît-il vraiment ?) reste non confirmée.
- Le badge n'est pas recalculé à minuit si l'app reste ouverte en arrière-plan sans interaction
  (limite explicitement actée hors périmètre par l'US elle-même).
