---
type: adr
numero: 001
titre: PWA SvelteKit + Web Push avec micro-scheduler serveur (pivot depuis Flutter)
date: 2026-08-11
auteur: sveltekit-architect
statut: accepté
remplace: null
---

# ADR-001 — PWA SvelteKit + Web Push avec micro-scheduler serveur (pivot depuis Flutter)

## Contexte

Le projet « Tracker » est un habit tracker personnel, solo, iPhone-only, dont la
priorité est la légèreté et dont le point technique le plus critique est la
**fiabilité des rappels par notification** (25 % de la pondération du benchmark initial —
voir `benchmarks/benchmark-habit-tracker-ios-2026-08-09.md`).

Le benchmark d'origine recommandait **Flutter** (après addendum sur l'absence de Mac /
de compte Apple Developer payant), la **PWA pure étant explicitement disqualifiée** au
motif que « iOS ne supporte pas les notifications locales programmées ; seul le Web Push
serveur existe, ce qui impose un backend, en contradiction avec la contrainte zéro backend ».

Deux éléments font rouvrir la décision :

1. **Le coût réel de la chaîne Flutter sans Mac** (build iOS via CI cloud, signature
   Apple ID gratuit à renouveler tous les 7 jours via AltStore/SideStore, réinstallation
   manuelle à chaque mise à jour) est une friction permanente lourde pour un projet perso.
2. **L'utilisateur accepte désormais explicitement un compromis** : un tout petit
   composant serveur, **sans compte utilisateur ni synchronisation des données**,
   uniquement pour déclencher les notifications au bon moment. La contrainte « zéro backend
   absolu » devient « presque zéro backend » (les données métier restent 100 % locales).

Ce compromis lève précisément le seul point qui disqualifiait la PWA. Une PWA installée
sur l'écran d'accueil s'installe sans Mac, sans App Store, sans certificat à renouveler,
et se met à jour en rechargeant la page — ce qui élimine toute la friction Flutter.

### Faits techniques vérifiés (2026-08-11)

- **Web Push sur iOS** fonctionne uniquement pour une PWA **installée sur l'écran
  d'accueil** (Réglages Safari → Partager → « Ajouter à l'écran d'accueil »), à partir
  d'**iOS 16.4**. Il faut une permission utilisateur explicite. Pas de push silencieux,
  pas de réveil en arrière-plan.
- **Statut EU / France** : Apple avait annoncé (iOS 17.4 beta, fév. 2024) retirer les
  web apps de l'écran d'accueil dans l'UE au titre du DMA, puis a **fait marche arrière
  le 1er mars 2024** et **rétabli** les home screen web apps, **push inclus**, dès
  iOS 17.4. Le Web Push est donc disponible pour l'utilisateur cible (France).
- **Un service worker ne peut pas programmer un envoi futur seul** : il ne fait que
  *recevoir* l'événement `push` et *afficher* la notification. Le déclenchement au bon
  moment doit venir d'un composant serveur (d'où le micro-scheduler).
- **Netlify Scheduled Functions** : fonctions cron (granularité ~1 min via expression
  cron), incluses dans l'offre gratuite, sur le **même compte/pipeline que l'hébergement**.
- **Netlify Blobs** : stockage clé/valeur inclus dans l'offre gratuite → suffit à stocker
  les souscriptions push, **sans base de données**.

## Décision

Construire « Tracker » comme une **PWA SvelteKit statique** (adapter-static, offline-first,
IndexedDB), installée sur l'écran d'accueil de l'iPhone, complétée par un **micro-scheduler
serveur minimal** dédié **exclusivement** au déclenchement des rappels Web Push.

**Répartition stricte des responsabilités :**

| Où | Quoi | Données |
|---|---|---|
| **Client (PWA, 100 % local)** | Habitudes, tâches, historique de complétion, statistiques, calcul des occurrences et des heures de rappel | IndexedDB — **ne quitte jamais l'appareil** |
| **Serveur (Netlify Functions)** | Recevoir les souscriptions push + les instants de rappel calculés par le client ; envoyer les push via VAPID au bon moment | Netlify Blobs — **uniquement souscription + timestamps d'envoi, aucune donnée métier** |

**Ce qui remonte au serveur, et rien d'autre :**
- la **souscription Web Push** (endpoint + clés de chiffrement du navigateur) ;
- une **liste d'instants d'envoi** (`sendAt` en epoch UTC) calculée localement par le client
  sur une **fenêtre glissante** (30 jours par défaut), re-poussée à chaque ouverture de l'app.

Le contenu du push est **générique** (« Tu as des habitudes prévues aujourd'hui »). Le nom
des habitudes, l'historique et les stats ne transitent pas : l'utilisateur ouvre l'app pour
voir sa liste réelle (chargée localement).

**Identité sans compte** : l'**endpoint de la souscription push sert d'identifiant implicite**.
Le serveur en calcule un hash SHA-256 comme clé de stockage Netlify Blobs. Aucun email,
aucun compte, aucun login.

**Frontière d'architecture** : l'app SvelteKit est **100 % statique** (aucun endpoint
serveur SvelteKit). Le seul code serveur du projet vit dans `netlify/functions/`, totalement
découplé de l'app. On peut supprimer ces fonctions et l'app reste utilisable (sans rappels).

## Alternatives considérées

| Option | Avantages | Inconvénients | Retenue ? |
|--------|-----------|---------------|-----------|
| **Flutter + CI iOS + AltStore** (recommandation du benchmark) | Notifications locales natives fiables (pas de serveur), pousse Android « gratuit » | Chaîne sans Mac lourde : build CI, signature Apple ID à renouveler tous les 7 jours, réinstallation manuelle à chaque MAJ, binaire ~18 Mo | Non — friction de déploiement disproportionnée pour un projet perso |
| **PWA pure, zéro serveur** | Le plus simple, le plus léger | **Impossible** : iOS n'a pas de notification locale programmée ; sans serveur, aucun rappel app fermée | Non — échoue sur le point critique |
| **PWA + micro-scheduler Netlify (retenue)** | Installation/MAJ triviales (écran d'accueil, reload), app légère, données 100 % locales, un seul pipeline (Netlify) | Introduit un « presque backend » ; fiabilité des rappels dépend désormais du scheduler ; push iOS conditionné à l'installation écran d'accueil | **Oui** |
| **PWA + Cloudflare Workers + Cron Triggers** | Cron à la minute, edge, généreux | Deuxième plateforme à gérer en plus de l'hébergement ; pas de gain décisif ici | Non — Netlify suffit et centralise (bascule possible si besoin de granularité < 1 min) |
| **PWA + Capacitor (app native empaquetée)** | Notifications natives | Re-introduit toute la chaîne native iOS (Mac/App Store) qu'on cherche à éviter | Non |

## Conséquences

**Positives :**
- Déploiement et mises à jour triviaux : plus de Mac, plus de CI iOS, plus de certificat
  à renouveler, plus de réinstallation. Un `git push` → Netlify redéploie ; l'utilisateur
  recharge l'app.
- App très légère (SvelteKit statique + service worker), offline-first.
- **Données métier strictement locales** (IndexedDB) — la promesse de confidentialité v0 est
  quasi intégralement tenue.
- Un seul fournisseur (Netlify) pour l'hébergement statique **et** le scheduler.
- Logique métier isolée dans `src/lib/domain` (pure, testable) → portable si futur pivot.

**Négatives / compromis acceptés :**
- **« Presque zéro backend » au lieu de « zéro backend absolu »** : un composant serveur
  minimal existe et connaît, par abonnement, une souscription push + des horodatages de rappel
  (pas les habitudes). C'est le prix explicitement accepté pour des rappels fiables.
- **La fiabilité des rappels dépend maintenant du scheduler serveur** (et non plus de l'OS).
  Nouveau risque à surveiller : si la fonction cron ne tourne pas, les rappels ne partent pas.
- **Push conditionné à l'installation sur l'écran d'accueil** (iOS 16.4+/17.4+ EU) et à
  l'acceptation de la permission. Un utilisateur qui n'installe pas la PWA n'aura pas de rappel.
- **Latence de rappel** bornée par la granularité cron (15 min par défaut) : un rappel peut
  arriver jusqu'à ~15 min après l'heure choisie. Réductible à 5 min si nécessaire.
- **Awareness de complétion (US-007, scénario 8) devient best-effort** : le serveur ne
  connaît pas l'état « fait / pas fait » (local). Un rappel peut partir même si tout est déjà
  coché, sauf si l'app a re-synchronisé sa fenêtre avant l'heure d'envoi.
- **Risque de purge du stockage iOS** (IndexedDB) : mitigé par l'installation écran d'accueil
  (exemption de la purge 7 jours) + `navigator.storage.persist()` + export/import JSON.

## Amendement (2026-08-12) — révision du volet « contenu de notification non nominatif »

**Statut de l'ADR** : reste **accepté**, décision d'origine inchangée. Cet amendement ne
révise qu'**un sous-point** de la décision (le contenu du push), pas le choix architectural
lui-même (PWA + micro-scheduler Netlify).

**Ce qui change** : la Décision ci-dessus posait « le contenu du push est générique […]. Le
nom des habitudes […] ne transite pas ». Ce principe est **révisé sur décision assumée de
l'utilisateur** (téléphone personnel, risque de confidentialité jugé acceptable) : le contenu
du push **peut désormais nommer** l'élément concerné, mais **uniquement** pour le nouveau
rappel déclenché par l'heure limite d'une tâche ponctuelle (voir
[US-021](../../US/done/US-021-heure-limite-tache-ponctuelle.md) et
[US-022](../../US/done/US-022-rappel-push-nominatif-heure-limite-tache.md)). Le
récap matinal générique des habitudes (US-007) n'est pas concerné par ce changement et reste
non nominatif.

**Ce qui ne change pas** : la limite « le serveur ne connaît pas l'état de complétion »
(section Conséquences ci-dessus, « Awareness de complétion […] devient best-effort ») **reste
entière**. Nommer un élément dans le push ne dispense pas d'une resynchronisation de la
fenêtre d'échéances avant l'heure d'envoi pour espérer éviter un rappel sur un élément déjà
fait — voir [US-023](../../US/to_be_implemented/US-023-resynchronisation-echeances-a-chaque-cochage.md),
qui étend ce mécanisme de resynchronisation (déclenché désormais à chaque cochage, pas
seulement à l'ouverture de l'app) sans lever la nature best-effort du compromis.

**Conséquence assumée sur la répartition des responsabilités** : cet amendement **entame** le
principe posé plus haut selon lequel Netlify Blobs ne stocke « uniquement souscription +
timestamps d'envoi, aucune donnée métier ». Le micro-scheduler cron n'ayant aucune autre
source de vérité au moment de l'émission, le **libellé de la tâche devra être persisté dans
Blobs** aux côtés de son timestamp d'échéance, jusqu'à l'envoi du push. Ce n'est donc plus
« aucune donnée métier » : c'est « aucune donnée métier **autre que** le libellé des tâches à
heure limite de la fenêtre glissante en cours ».

Ce que cela implique, à trancher à l'implémentation d'US-022 :
- la durée de rétention de ces libellés côté serveur (a minima : purge après émission, et
  purge des échéances passées à chaque resynchronisation de la fenêtre) ;
- le fait que le récap matinal des habitudes (US-007) reste, lui, sans aucun libellé stocké —
  la dérogation est circonscrite aux tâches ponctuelles à heure limite.

Le reste de la décision d'origine (pas de compte utilisateur, pas de synchronisation des
données métier, IndexedDB comme unique source de vérité côté client) est inchangé.

## Liens

- [Benchmark framework mobile — Habit Tracker iOS](../../benchmarks/benchmark-habit-tracker-ios-2026-08-09.md) (recommandation Flutter, disqualification PWA pure — révisée ici)
- [US-007 — Rappels par notification](../../US/to_be_implemented/US-007-rappels-notifications-locales.md)
- [Do PWAs Work on iOS? 2026 Guide — Mobiloud](https://www.mobiloud.com/blog/progressive-web-apps-ios)
- [Apple Reverses Decision: Home Screen Web Apps in the EU — PushAlert](https://pushalert.co/blog/apple-reverses-decision-will-continue-to-support-home-screen-web-apps-in-the-eu/)
- [PWA Push Notifications on iOS in 2026 — Webscraft](https://webscraft.org/blog/pwa-pushspovischennya-na-ios-u-2026-scho-realno-pratsyuye?lang=en)
- [Scheduled Functions — Netlify Docs](https://docs.netlify.com/build/functions/scheduled-functions/)
- [Netlify Blobs — Netlify Docs](https://docs.netlify.com/build/data-and-storage/netlify-blobs/)
- [Cron Triggers — Cloudflare Workers Docs](https://developers.cloudflare.com/workers/runtime-apis/handlers/scheduled/) (alternative écartée)
