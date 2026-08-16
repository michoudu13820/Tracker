---
type: user-story
id: US-040
titre: Accès complet à l'application hors connexion une fois installée
date: 2026-08-16
auteur: product-owner
statut: en cours
priorite: Must
estimation: L
source: chat
depend_de: ["US-007"]
---

> **Origine** : cette US formalise, sous forme de critères d'acceptation testables, une exigence
> jusqu'ici seulement architecturale — ADR-001, décision « **offline-first** » — et validée de
> façon empirique et non tracée en critère de recette (`docs/JOURNAL.md`, session du 2026-08-11 :
> « PWA installable sur iPhone… Fonctionne et vérifié en conditions réelles »). Aucune US livrée
> ne couvrait ce comportement, ce qui a permis à la régression décrite dans
> [BUG-002](../../bug/to_be_resolved/BUG-002-pwa-inutilisable-hors-ligne-iphone.md) de passer
> inaperçue : l'application installée sur l'écran d'accueil d'un iPhone ne s'ouvre plus du tout
> sans réseau (« Safari ne peut pas ouvrir la page »). **BUG-002 documente le défaut technique
> constaté et son analyse de code** (service worker, stratégie de cache/repli) ; **cette US porte
> le comportement cible attendu par l'utilisateur et les critères de recette du correctif**. Les
> deux documents se citent mutuellement et doivent être lus ensemble.

## Titre : US-040 — Accès complet à l'application hors connexion une fois installée

### Récit
> **En tant qu'** utilisateur ayant installé l'application sur l'écran d'accueil de mon iPhone,
> **je veux** pouvoir ouvrir et utiliser l'application même sans connexion réseau,
> **afin de** consulter et faire évoluer le suivi de mes habitudes et de mes tâches n'importe où
> (métro, avion, zone blanche), y compris pour les données déjà enregistrées localement, sans que
> l'absence de réseau ne rende l'application totalement inutilisable.

### Critères d'acceptation

**Scénario 1 — Ouverture de l'application installée sans réseau**
> **Étant donné** l'application est installée sur l'écran d'accueil de l'iPhone et a déjà été
> ouverte au moins une fois avec une connexion réseau active
> **Quand** le téléphone est en mode avion (ou sans réseau disponible) et que j'appuie sur l'icône
> de l'application
> **Alors** l'application s'ouvre normalement et affiche le planning du jour avec les données déjà
> enregistrées localement
> **Et** l'erreur générique du navigateur (par exemple « Safari ne peut pas ouvrir la page »)
> n'apparaît à aucun moment

**Scénario 2 — Navigation hors ligne entre tous les écrans, y compris un écran non visité depuis
la dernière mise à jour**
> **Étant donné** l'application est ouverte hors ligne (scénario 1), et je n'ai pas visité un
> écran donné (par exemple « Résumé ») depuis la dernière fois que l'application a reçu une
> nouvelle version (nouveau déploiement) ou depuis son installation
> **Quand** je navigue vers cet écran via le menu de navigation de l'application, toujours hors
> ligne
> **Alors** l'écran s'affiche normalement, avec les données locales disponibles
> **Et** ce comportement est vrai pour chacun des écrans de l'application (Planning, Habitudes,
> Tâches, Résumé, Réglages), qu'ils aient ou non déjà été affichés au cours de la session en cours

**Scénario 3 — Consultation et saisie hors ligne, persistance vérifiée au retour du réseau**
> **Étant donné** je suis hors ligne dans l'application (ouverte ou rouverte hors ligne comme au
> scénario 1)
> **Quand** je consulte mes habitudes et tâches existantes, que je coche une habitude ou une tâche
> comme faite, et/ou que je crée ou modifie une habitude ou une tâche
> **Alors** chaque action est prise en compte immédiatement dans l'affichage, exactement comme si
> j'étais en ligne
> **Et quand** le réseau revient (désactivation du mode avion) puis que je rouvre ou rafraîchis
> l'application
> **Alors** toutes les données consultées, cochées, créées ou modifiées pendant la période hors
> ligne sont toujours présentes, sans perte ni duplication

**Scénario 4 — Navigation directe hors ligne vers un écran précis**
> **Étant donné** l'application est installée, a déjà été ouverte au moins une fois en ligne, et
> je suis actuellement hors ligne
> **Quand** j'ouvre l'application via un raccourci ou un lien qui cible directement un écran précis
> autre que le planning (par exemple l'écran « Tâches »)
> **Alors** l'application s'ouvre directement sur l'écran demandé (« Tâches »)
> **Et** non sur le planning du jour, quel que soit l'écran initialement ciblé
>
> *(Défaut relevé par le QA dans BUG-002 : le mécanisme de repli actuel du service worker cible
> systématiquement une clé fixe correspondant au planning, quelle que soit la page réellement
> demandée — ce scénario formalise l'exigence que le correctif doit satisfaire.)*

**Scénario 5 — Repli propre sur une ressource réellement jamais mise en cache**
> **Étant donné** je suis hors ligne et je navigue vers une ressource que l'application n'a jamais
> eu l'occasion de mettre en cache localement (ni lors de l'installation, ni lors d'une visite
> antérieure en ligne)
> **Quand** cette navigation échoue faute de réseau et de version locale disponible
> **Alors** l'application affiche un écran de repli clair et compréhensible, cohérent avec
> l'univers visuel de l'application (par exemple un message du type « Contenu non disponible hors
> connexion »)
> **Et** cet écran me propose une action explicite de retour au planning du jour, qui lui est
> disponible localement — je ne me retrouve jamais dans un cul-de-sac sans issue
> **Et** je ne vois à aucun moment l'erreur générique et technique du navigateur

**Scénario 6 — Accès hors ligne préservé après un nouveau déploiement**
> **Étant donné** une nouvelle version de l'application a été déployée depuis la dernière fois que
> je l'ai ouverte avec une connexion active
> **Quand** j'ouvre à nouveau l'application en ligne au moins une fois après ce déploiement (le
> temps que la nouvelle version se mette à jour), puis que je repasse hors ligne
> **Alors** je retrouve un accès complet hors ligne à l'application dans sa nouvelle version (tous
> les écrans, toutes mes données locales)
> **Et** je ne me retrouve jamais bloqué sur une ancienne version figée en cache, ni dans un état
> intermédiaire cassé entre deux versions

**Scénario 6bis — La mise à jour ne perturbe pas la session en cours**
> **Étant donné** j'utilise l'application et qu'une nouvelle version vient d'être déployée
> **Quand** l'application détecte cette nouvelle version pendant que je m'en sers
> **Alors** elle la télécharge en arrière-plan **sans** l'activer immédiatement, et me laisse
> terminer ce que je faisais sur la version déjà chargée, sans rechargement subi ni interruption
> **Et** aucun bandeau ni message ne me demande d'agir
> **Et quand** je ferme puis rouvre l'application
> **Alors** c'est la nouvelle version qui démarre, complète et utilisable hors ligne
>
> *(Arbitrage utilisateur du 2026-08-16 : mise à jour silencieuse différée au prochain lancement.
> Le service worker actuel applique la nouvelle version immédiatement — `skipWaiting` +
> `clients.claim`, cf. BUG-002 — ce qui expose à l'état mixte que le scénario 6 interdit. Ce
> comportement est donc à revoir dans le cadre de cette US.)*

**Scénario 7 — Action nécessitant le réseau effectuée hors ligne**
> **Étant donné** je suis hors ligne dans l'application
> **Quand** j'effectue une action dont l'effet complet dépend du serveur (activer ou désactiver un
> rappel, modifier l'heure limite d'un rappel)
> **Alors** l'action est acceptée et prise en compte immédiatement dans l'affichage, sans message
> d'erreur bloquant
> **Et** l'application m'indique de façon claire que ce rappel deviendra effectif au retour de la
> connexion, pour que je ne croie pas à tort qu'il est déjà actif
> **Et quand** le réseau redevient disponible
> **Alors** l'application applique automatiquement ces actions côté serveur, sans aucune action de
> ma part
> **Et** si j'ai modifié plusieurs fois le même rappel pendant la période hors ligne, seul l'état
> final est appliqué (pas de rejeu de chaque étape intermédiaire)
> **Et** si l'application échoue définitivement à appliquer une action côté serveur, j'en suis
> informé explicitement plutôt que de rester avec un rappel silencieusement inactif

### Priorité
**Must** — régression bloquante sur la proposition de valeur cœur du produit : l'usage nomade sans
réseau garanti est explicitement la raison d'être de l'application (ADR-001, décision
« offline-first »). Tant que BUG-002 n'est pas corrigé, l'application est totalement inutilisable
dès que le réseau est absent au moment de l'ouverture. **Cette US est à traiter en priorité
absolue, avant toute autre US non livrée du backlog** (voir mise à jour de `US/BACKLOG.md`).

### Estimation
**L** — le cœur du correctif reste ciblé (précache des écrans par le service worker, repli
contextuel sur la route demandée plutôt que sur une clé fixe), mais trois éléments pèsent :
plusieurs scénarios de non-régression à vérifier un par un (navigation directe, ressource jamais
cachée, déploiement), la reprise du cycle d'activation du service worker (scénario 6bis), et
surtout la **file d'attente des actions réseau différées** (scénario 7), qui introduit un
mécanisme nouveau — persistance de l'intention, déduplication au dernier état, rejeu au retour du
réseau, gestion de l'échec définitif. Estimation indicative, à confirmer par l'équipe de
développement.

> **Point de vigilance sur le découpage** : le scénario 7 est le seul qui ajoute un mécanisme
> réellement nouveau ; les scénarios 1 à 6bis, eux, réparent un défaut bloquant. Si le scénario 7
> venait à retarder la correction de l'accès hors ligne lui-même, il serait légitime de l'extraire
> dans une US distincte livrée juste après, plutôt que de faire attendre le reste. Décision à
> prendre par l'équipe au moment de l'implémentation, pas maintenant.

### Dépendances
- **US-007 — Rappels par notification pour les habitudes du jour** : a livré le service worker
  actuellement en cause (`src/service-worker.ts`), composant technique que cette US vient corriger
  et compléter. Aucune dépendance fonctionnelle nouvelle : le service worker existe déjà, cette US
  en corrige la couverture offline.
- **ADR-001 — PWA SvelteKit + Web Push avec micro-scheduler serveur**
  (`docs/architecture/ADR-001-pwa-sveltekit-web-push-scheduler.md`) : cette US matérialise en
  critères de recette testables la décision architecturale « offline-first » déjà actée par cet
  ADR ; elle ne la révise pas.
- **BUG-002** (`bug/to_be_resolved/BUG-002-pwa-inutilisable-hors-ligne-iphone.md`) : défaut
  technique correspondant, avec analyse de code du mécanisme fautif (précache incomplet, repli sur
  une clé fixe). Le correctif de BUG-002 doit satisfaire les critères d'acceptation de cette US ;
  cette US devient, après sa création, le critère de recette formel manquant que BUG-002
  mentionnait comme absent.

### Notes / hors périmètre
- Cette US décrit un **comportement attendu**, pas une solution technique : la stratégie exacte de
  précache (liste des routes prérendues à inclure, granularité du cache, contenu précis de l'écran
  de repli du scénario 5) relève de l'agent de développement, pas de ce document.
- **Hors périmètre explicite, sur arbitrage utilisateur** : un indicateur visuel **global** de
  l'état de connexion (en ligne / hors ligne) affiché en permanence dans l'interface n'est **pas**
  couvert par cette US et n'est volontairement traité par aucune US à ce stade ; ce besoin pourra
  être réévalué séparément plus tard si nécessaire. Le message contextuel du scénario 7 (« ce
  rappel sera effectif au retour de la connexion ») ne remet pas en cause cet arbitrage : il est
  local à l'action concernée et n'apparaît que lorsqu'une action a réellement été mise en attente.
- **Hors périmètre** : la synchronisation des données entre plusieurs appareils reste hors sujet
  (ADR-001 — données 100 % locales, aucune synchronisation prévue).
- **Hors périmètre** : l'**envoi effectif** des rappels Web Push par le scheduler serveur (cf.
  US-007 / ADR-001) reste par nature impossible sans réseau — un rappel dont l'heure tombe pendant
  une période hors ligne ne sera pas délivré à cet instant, et cette US ne change rien au compromis
  « best-effort » déjà documenté. Ce qui entre en revanche dans le périmètre (scénario 7), c'est la
  **configuration** de ces rappels : elle doit pouvoir être modifiée hors ligne et être appliquée
  côté serveur au retour du réseau.
- **Hypothèse** : les scénarios ci-dessus supposent que l'application a déjà été ouverte au moins
  une fois en ligne après son installation (ou après un déploiement, scénario 6) avant toute
  tentative d'ouverture hors ligne — cohérent avec le mécanisme de mise en cache d'un service
  worker, qui ne peut pas précacher ce qu'il n'a jamais eu l'occasion de télécharger. Le cas d'une
  toute première ouverture directement hors ligne, jamais rencontré en usage réel, est hors
  périmètre.

### Définition de terminé (validation)
Sur arbitrage utilisateur, cette US **ne peut pas être clôturée sur la seule foi de la CI** :

1. **Tests automatisés** couvrant les scénarios simulables hors appareil (précache des routes,
   repli sur la route demandée, écran de repli, file d'attente et déduplication du scénario 7),
   exécutés dans le quality gate. Ils constituent le filet anti-régression durable — c'est
   précisément leur absence qui a laissé passer BUG-002.
2. **Validation manuelle sur l'iPhone de l'utilisateur**, application installée sur l'écran
   d'accueil, en mode avion, rejouant au minimum les scénarios 1, 2 et 3. Le comportement de
   WebKit en PWA installée n'est pas entièrement reproductible en CI ni sur desktop, et c'est dans
   ce contexte précis que le défaut est apparu.

Le passage de l'US en `done` et la clôture de BUG-002 sont conditionnés à ces deux preuves.

### Implémentation

**État : code terminé, quality gate vert, en attente de la validation sur iPhone réel.**
L'US reste en `in_progress` parce que sa propre définition de terminé exige deux preuves et qu'une
seule est acquise à ce stade (voir « Reste à faire » plus bas).

#### Fichiers créés
| Fichier | Rôle |
|---|---|
| `src/lib/offline/strategy.ts` | Stratégie de réponse du service worker, extraite pour être testable sans navigateur. Garantit l'invariant « toujours un `Response` » |
| `src/lib/offline/strategy.test.ts` | 11 tests, un par branche de décision (scénarios 1, 2, 4, 5) |
| `src/lib/offline/connectivity.ts` | `isOffline()` / `onReconnect()` — détection minimale, sans indicateur global d'interface |
| `src/lib/stores/reminders-reconnect.ts` | Réconciliation de l'état serveur avec l'intention locale au retour du réseau (scénario 7) |
| `src/lib/stores/reminders-reconnect.test.ts` | 9 tests : rejeu, déduplication, idempotence, absence de demande de permission non sollicitée |
| `src/routes/hors-ligne/+page.svelte` | Écran de repli, route prérendue donc précachée comme les autres (scénario 5) |

#### Fichiers modifiés
| Fichier | Changement |
|---|---|
| `src/service-worker.ts` | Precache de `prerendered` (le correctif de fond), precache tolérant aux échecs unitaires, suppression de `skipWaiting()`, délégation à la stratégie testable, `handleFontRequest` qui ne rejette plus |
| `src/lib/stores/reminders.store.svelte.ts` | État `pendingServerSync` + statut `pending`, distinction hors ligne / échec définitif sur les trois actions serveur |
| `src/lib/stores/reminders.store.svelte.test.ts` | 6 tests ajoutés sur le comportement hors ligne |
| `src/routes/+layout.svelte` | Abonnement au retour de connexion, désabonné au démontage |
| `src/routes/reglages/+page.svelte` | Une activation demandée hors ligne persiste la préférence au lieu d'afficher un refus |
| `src/routes/reglages/ReminderSettingsForm.svelte` | Messages « en attente » et « échec définitif », props optionnelles |
| `src/routes/reglages/ReminderSettingsForm.test.ts` | 2 tests ajoutés sur ces deux messages |

#### Correctif de fond
`build` et `files` ne contiennent **aucune page HTML** : le précache n'a jamais couvert les écrans.
L'ajout de `prerendered` est ce qui rend l'app réellement ouvrable hors ligne. Trois défauts
associés ont été corrigés dans la même passe : le repli visait la clé fixe `'/'` au lieu de la
route demandée (scénario 4), toute branche pouvait résoudre à `undefined` — la cause littérale de
`Returned response is null` — et `cache.addAll` étant atomique, une seule ressource introuvable
aurait vidé tout le précache.

#### Vérification effectuée
- Quality gate : `npm run check` → 506 fichiers, 0 erreur ; `npm test` → **660 tests au vert**
  (dont 28 ajoutés par cette US) ; `npm run build` → OK. Pas de script `lint` dans ce projet.
- Inspection du bundle produit : `build/service-worker.js` contient bien `/`, `/habitudes`,
  `/taches`, `/resume`, `/reglages` et `/hors-ligne`, et ne contient plus `skipWaiting`.
  `build/hors-ligne.html` est généré.

#### Comment tester manuellement
1. `npm run build && npm run preview` (le service worker n'est pas actif en `npm run dev`).
2. Ouvrir l'app, laisser le service worker s'enregistrer (DevTools → Application → Service Workers).
3. DevTools → Network → cocher « Offline ».
4. Recharger `/`, puis naviguer vers chaque écran : tous doivent s'afficher.
5. Ouvrir directement `/resume` dans la barre d'adresse hors ligne : doit afficher le résumé,
   **pas** le planning (scénario 4).
6. Ouvrir `/une-page-inexistante` hors ligne : doit afficher l'écran de repli avec le lien retour.
7. Réglages → changer l'heure de rappel hors ligne : message « en attente » ; décocher « Offline » :
   la synchronisation repart seule.

#### Limites et dette assumée
- **Scénarios 1, 2 et 6/6bis non couverts par un test automatisé de bout en bout** : ils dépendent
  du cycle de vie réel d'un service worker (installation, attente, activation), non simulable avec
  l'outillage actuel du projet — Playwright n'est pas installé (cf. CONVENTIONS.md §5). Ils sont
  couverts indirectement : la stratégie est testée unitairement, et la composition du précache est
  vérifiée sur le bundle produit. C'est précisément la raison pour laquelle la validation sur
  appareil réel reste exigée.
- **Rejeu automatique de l'activation conditionné à une permission déjà accordée** : réactiver des
  rappels hors ligne alors que la permission n'a jamais été donnée ne peut pas se conclure au
  retour du réseau, car demander la permission sans geste de l'utilisateur serait rejeté par le
  navigateur — et ferait surgir une fenêtre non sollicitée. L'intention reste persistée et se
  réalisera à la prochaine action de l'utilisateur dans les réglages.
- **Pas de file d'attente persistée pour le scénario 7**, par conception : l'état final vit déjà
  dans `settingsStore`, et réconcilier plutôt que rejouer donne gratuitement la déduplication
  exigée. Raisonnement détaillé en tête de `reminders-reconnect.ts`.
- **`navigator.onLine` est une heuristique** : il n'est jamais consulté seul, seulement après
  l'échec d'une requête, pour trancher entre « à rejouer » et « à signaler ».

#### Reste à faire pour clôturer
Validation manuelle sur l'iPhone, app installée sur l'écran d'accueil, en mode avion, rejouant au
minimum les scénarios 1, 2 et 3 — seconde preuve exigée par la définition de terminé ci-dessus.
Nécessite un déploiement préalable en production. Tant qu'elle n'est pas faite, ni cette US ni
BUG-002 ne peuvent passer en `done`.

### Arbitrages produit (2026-08-16)
Quatre points ouverts ont été tranchés avec l'utilisateur avant le passage de l'US en `prête` :

| Point | Décision retenue | Traduction dans l'US |
|-------|------------------|----------------------|
| Ressource jamais mise en cache | Écran de repli explicite **avec retour au planning** (pas de redirection silencieuse) | Scénario 5 |
| Nouvelle version déployée | Mise à jour **silencieuse, différée au prochain lancement** (ni activation immédiate, ni bandeau de rechargement) | Scénarios 6 et 6bis |
| Actions dépendantes du réseau faites hors ligne | **Enregistrées localement et rejouées au retour du réseau**, plutôt que bloquées | Scénario 7 (élargit le périmètre initial) |
| Preuve exigée pour clôturer | **Tests automatisés + validation sur iPhone réel** | Section « Définition de terminé » |
