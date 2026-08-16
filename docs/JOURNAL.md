# Journal de session

Journal chronologique des décisions et étapes marquantes du projet, en complément des ADR
(`docs/architecture/`) qui documentent le *pourquoi* des décisions structurantes. Ce journal
documente le *déroulé* — utile pour reprendre le fil d'une session à l'autre.

---

## 2026-08-09 — Choix technologique initial : Flutter

- Besoin cadré : habit tracker perso, iOS uniquement, v0 100% local (pas de compte, pas de
  sync), rappels par notification à l'échéance d'une habitude.
- Benchmark mobile réalisé (`benchmarks/benchmark-habit-tracker-ios-2026-08-09.md`) : **Flutter**
  recommandé (à égalité de fiabilité de notifications avec Swift natif, mais bien plus adapté
  à un dev sans Mac).
- Contrainte de déploiement clarifiée en cours de route : pas de compte Apple Developer payant,
  **aucun accès à un Mac**, budget 0€. Pipeline retenu (addendum du même fichier) : build iOS via
  GitHub Actions (runner macOS gratuit sur repo public) → `.ipa` non signé → sideload sur iPhone
  via AltStore/SideStore (signature à la volée avec un Apple ID gratuit, aucun secret Apple
  stocké côté CI).

## 2026-08-11 — Scaffold Flutter + CI GitHub, pipeline validé de bout en bout

- Agent `github-ci-engineer` créé (`.claude/agents/github-ci-engineer.md`), scopé à ce repo.
- Flutter SDK installé (Scoop), projet `habit_tracker` scaffoldé, `gh` CLI installé et
  authentifié (compte GitHub `michoudu13820`, scope `workflow` ajouté après un premier blocage).
- Dépôt GitHub créé **public** : https://github.com/michoudu13820/Tracker (choix délibéré pour
  des minutes de build macOS gratuites et illimitées).
- Deux workflows GitHub Actions mis en place et validés par un run réel vert : `ci.yml` (tests) et
  `build-ios.yml` (build `.ipa` non signé, artifact téléchargeable).
- **Revirement d'architecture décidé dans la foulée** : après réflexion, la complexité de
  déploiement (Xcode/AltStore/re-signature tous les 7 jours) a été jugée disproportionnée pour
  un projet perso. Accepté un compromis : un **tout petit backend serverless** (pas de compte
  utilisateur, pas de sync des données métier) pour piloter des rappels **Web Push**, en échange
  d'une **PWA SvelteKit** — déploiement radicalement plus simple (install via Safari, pas de
  Xcode/signature/AltStore).
- Tout le code Flutter et les ADR associés (001 à 005) supprimés (commit `1eafb31`). Le repo
  GitHub existant a été réutilisé (pas de nouveau repo créé).
- Agent `sveltekit-architect` : conception de l'architecture PWA + Web Push, vérification à jour
  qu'Apple a fait marche arrière sur le retrait des PWA écran d'accueil dans l'UE (DMA, depuis le
  1er mars 2024 — donc Web Push bien disponible en France dès iOS 17.4), scaffold SvelteKit
  (`adapter-static`, IndexedDB, offline-first), **ADR-001**
  (`docs/architecture/ADR-001-pwa-sveltekit-web-push-scheduler.md`, statut accepté) documentant
  la décision, mise à jour de `US-007` (dépendance ADR-005 → ADR-001).
- Agent `github-ci-engineer` (2e passage) : nouveau workflow CI adapté SvelteKit (`ubuntu-latest`
  uniquement, fini le runner macOS), création du site Netlify **`tracker-habit-pwa`**
  (https://tracker-habit-pwa.netlify.app), premier déploiement manuel (CLI), clés VAPID générées
  et stockées en variables d'environnement Netlify (jamais commitées), fonction planifiée
  (`netlify/functions/send-reminders.ts`, cron 15 min) déployée.
- **Test end-to-end du Web Push réalisé et confirmé fonctionnel** : ajout d'un endpoint de test
  manuel `netlify/functions/trigger-send.ts` (protégé par secret partagé, contourne l'attente du
  cron) et d'un bouton temporaire « Activer les rappels (test push) » sur la page d'accueil.
  Un bug a été trouvé et corrigé en cours de route : le premier déploiement avait été fait avec un
  build utilisant une clé VAPID **placeholder** (utilisée uniquement pour une vérification locale
  de build), ce qui faisait échouer `subscribe()` silencieusement côté iPhone. Corrigé (rebuild
  avec la vraie clé + gestion d'erreur visible dans l'UI de test) et **notification reçue avec
  succès sur l'iPhone de l'utilisateur**.

### État à la fin de la session du 2026-08-11

**Fonctionne et vérifié en conditions réelles :**
- PWA installable sur iPhone (Safari → Ajouter à l'écran d'accueil).
- Abonnement Web Push + envoi + réception réels, confirmés par l'utilisateur.
- CI (`ubuntu-latest`) verte sur chaque push.
- Site en production : https://tracker-habit-pwa.netlify.app.

**Pas encore fait / décisions en attente :**
- **Déploiement continu non lié** : le déploiement est pour l'instant manuel via `netlify-cli`
  (nécessite une autorisation OAuth navigateur non faisable par un agent). Deux options
  documentées dans le rapport de l'agent : lier le repo dans le dashboard Netlify (recommandé,
  simple), ou fournir un `NETLIFY_AUTH_TOKEN` en secret GitHub pour un déploiement via Actions.
- **US-007 (rappels) pas réellement implémentée** : seule l'infra de test existe
  (`netlify/functions/trigger-send.ts` + bouton « Activer les rappels (test push) » dans
  `src/routes/+page.svelte`). Ce sont des outils de **test temporaires**, pas l'UX finale — à
  retirer ou remplacer quand US-007 sera implémentée pour de vrai (réglages, granularité par
  habitude/heure, etc., cf. `US/to_be_implemented/US-007-rappels-notifications-locales.md`).
- **Aucune autre User Story implémentée** : le scaffold est prêt (domaine, stores, IndexedDB)
  mais US-001 à US-006 restent à faire — la page d'accueil affiche encore un état vide/scaffold.
- Secret de test `TRIGGER_SEND_SECRET` stocké en variable Netlify + une copie locale dans
  `%TEMP%\tracker_trigger_secret.txt` sur la machine de dev (fichier temporaire, pas dans le repo).

### Liens utiles
- Repo GitHub : https://github.com/michoudu13820/Tracker
- Site production : https://tracker-habit-pwa.netlify.app
- Admin Netlify : https://app.netlify.com/projects/tracker-habit-pwa
- Logs des fonctions : https://app.netlify.com/projects/tracker-habit-pwa/logs/functions
- Benchmark initial (Flutter, devenu obsolète mais gardé pour trace) :
  `benchmarks/benchmark-habit-tracker-ios-2026-08-09.md`
- Décision actuelle (PWA + Web Push) : `docs/architecture/ADR-001-pwa-sveltekit-web-push-scheduler.md`

### Prochaine session — points de reprise suggérés
1. Décider et finaliser l'option de déploiement continu (recommandé : lier le repo dans Netlify).
2. Implémenter les User Stories du backlog (`US/BACKLOG.md`), en commençant par US-001.
3. Remplacer le bouton/endpoint de test Web Push par la vraie UX de réglages des rappels (US-007).

## 2026-08-16 — BUG-002 / US-040 : l'app ne s'ouvrait plus hors connexion

- **Symptôme** : sur iPhone, app installée sur l'écran d'accueil, ouverture sans réseau →
  « Safari ne peut pas ouvrir la page », avec
  `FetchEvent.respondWith received an error: Returned response is null`.
- **Cause** : le précache du service worker ne contenait que `build` et `files` — bundle JS/CSS et
  contenu de `static/`, donc **aucune page HTML**. Toute navigation hors ligne partait au réseau,
  échouait, puis retombait sur `caches.match('/')`, une clé jamais mise en cache, qui résolvait à
  `undefined`. Trois défauts connexes trouvés dans la foulée : le repli visait la clé fixe `'/'` et
  non la route demandée, plusieurs branches pouvaient résoudre à `undefined`, et `cache.addAll`
  étant atomique, une seule ressource introuvable aurait vidé tout le précache.

### La leçon, plus importante que le correctif
L'engagement « offline-first » était acté dans l'ADR-001 et vérifié **une fois, manuellement**, le
2026-08-11 — mais **aucune US ne le formalisait en critère Given/When/Then testable**. Rien ne
gardait donc la promesse dans le temps : la régression est passée sans que quoi que ce soit
n'échoue. C'est pour combler ce trou de couverture, et pas seulement pour réparer, que US-040 a été
rédigée après coup.

Corollaire appliqué à l'implémentation : la stratégie de réponse du service worker a été extraite
dans `src/lib/offline/strategy.ts` pour être testable sans navigateur. Un ADR ne se teste pas ; un
module, si.

### Arbitrages produit tranchés ce jour
| Point | Décision |
|---|---|
| Ressource jamais mise en cache | Écran `/hors-ligne` explicite **avec retour au planning**, pas de redirection silencieuse |
| Nouvelle version déployée | Mise à jour **silencieuse différée au prochain lancement** — `skipWaiting()` supprimé |
| Actions serveur faites hors ligne | **Retenues et rejouées** au retour du réseau, plutôt que bloquées |
| Indicateur global en ligne / hors ligne | **Écarté** volontairement, aucune US ouverte |
| Preuve de clôture | Tests automatisés **et** validation sur iPhone réel |

### Conséquence opérationnelle à retenir
Sans `skipWaiting()`, une nouvelle version exige désormais **deux ouvertures en ligne successives,
entrecoupées d'une fermeture complète de l'app**, avant de prendre la main. C'est le prix assumé du
« pas de rechargement subi » — à garder en tête pour toute future validation sur appareil, sous
peine de tester l'ancienne version en croyant tester la nouvelle.

### État
- US-040 **livrée**, BUG-002 **corrigé**, validés en mode avion sur l'iPhone le 2026-08-16.
- Commit `53a1474`, run CI `31935270567` (typecheck/tests/build + déploiement Netlify), 660 tests
  au vert dont 28 ajoutés par cette US.
- Reste non couvert par l'automatisation : le cycle de vie réel d'un service worker (scénarios 1, 2
  et 6/6bis d'US-040) — Playwright n'est toujours pas installé sur le projet.
