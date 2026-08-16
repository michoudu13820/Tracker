---
type: bug
id: BUG-002
titre: L'application PWA installée sur l'écran d'accueil ne s'ouvre pas hors connexion ("Safari ne peut pas ouvrir la page")
date: 2026-08-16
auteur: qa
statut: à corriger
severite: bloquant
us_liee: ["US-040"]
reproductible: toujours
---

# BUG-002 — L'application PWA installée sur l'écran d'accueil ne s'ouvre pas hors connexion

## Résumé
Sur iPhone, une fois l'application installée sur l'écran d'accueil et déjà ouverte au moins une
fois en ligne, l'ouvrir sans connexion réseau (mode avion) échoue avec l'erreur navigateur
« Safari ne peut pas ouvrir la page » au lieu d'afficher le planning du jour avec les données
locales déjà enregistrées — l'usage nomade hors ligne, cœur de la proposition de valeur du
produit, est totalement impossible.

## Comportement attendu — origine de l'engagement

**US liée : US-040 — Accès hors ligne à l'application installée**
(`US/to_be_implemented/US-040-acces-hors-ligne-application-installee.md`), qui porte le
comportement cible et les critères de recette complets du correctif.

À noter, car c'est la cause racine du fait que ce défaut soit passé inaperçu : **aucune US déjà
livrée** ne formalisait, sous forme d'un critère Given/When/Then testable, l'exigence
« l'application fonctionne hors ligne une fois installée ». Ce bug ne viole donc le critère
d'acceptation d'aucune US livrée — l'engagement n'était acté qu'au niveau **architectural**, et
vérifié empiriquement une fois, ce qui suffit à qualifier l'écart de régression. US-040 a été
rédigée après coup, précisément pour combler ce trou de couverture.

- `docs/architecture/ADR-001-pwa-sveltekit-web-push-scheduler.md`, décision : « PWA SvelteKit
  statique, **offline-first**, IndexedDB ».
- `docs/JOURNAL.md`, session du 2026-08-11 : « État à la fin de la session… Fonctionne et vérifié
  en conditions réelles : PWA installable sur iPhone ».

L'US la plus proche, **US-007 — Rappels par notification pour les habitudes du jour**,
Scénario 3bis, ne couvre que la disponibilité des rappels push selon que la PWA est installée ou
non — pas l'accès hors ligne à l'application elle-même — et n'est donc pas le critère violé ici.
US-007 reste néanmoins l'US qui a livré le service worker en cause (`src/service-worker.ts`).

Comportement attendu, repris ici pour que la fiche se suffise à elle-même — le jeu complet de
scénarios de recette figure dans US-040 :

> **Étant donné** l'application est installée sur l'écran d'accueil de l'iPhone et a déjà été
> ouverte au moins une fois avec une connexion réseau active
> **Quand** le téléphone est en mode avion (ou sans réseau disponible) et que j'appuie sur l'icône
> de l'application
> **Alors** l'application s'ouvre normalement et affiche le planning du jour avec les données déjà
> enregistrées localement
> **Et** l'erreur générique du navigateur (« Safari ne peut pas ouvrir la page ») n'apparaît à
> aucun moment

Le défaut ne se limite pas au cas « ressource jamais chargée » : faute de tout précache de page
HTML, même les pages déjà visitées en ligne ne sont pas rechargeables hors ligne (voir
« Notes / pistes »).

## Environnement
- Appareil : iPhone (modèle non précisé par l'utilisateur — à confirmer si besoin de reproduction
  ciblée par version iOS), Safari / PWA.
- Mode : application **installée sur l'écran d'accueil** (« Ajouter à l'écran d'accueil »), pas un
  onglet Safari classique. L'application a déjà été ouverte au moins une fois en ligne au
  préalable.
- Déploiement : site en production Netlify (`https://tracker-habit-pwa.netlify.app`, cf.
  `docs/JOURNAL.md`), adapter-static, `fallback: '200.html'` (SPA), service worker natif
  SvelteKit (`src/service-worker.ts`).
- Reproductible également en environnement de dev/desktop (Chrome DevTools → onglet Application/
  Network → case « Offline ») sur une page qui n'a pas été explicitement précachée par le service
  worker — voir variante ci-dessous.

## Étapes de reproduction

**Variante iPhone (scénario principal) :**
1. Installer l'application sur l'écran d'accueil de l'iPhone (Safari → Partager → « Ajouter à
   l'écran d'accueil »).
2. Ouvrir l'application depuis l'icône au moins une fois avec une connexion réseau active,
   attendre que le planning du jour s'affiche.
3. Fermer l'application (mise en arrière-plan ou fermeture complète).
4. Activer le mode avion (ou se placer en zone sans réseau).
5. Appuyer sur l'icône de l'application depuis l'écran d'accueil.
6. **Constat** : Safari affiche l'erreur « Safari ne peut pas ouvrir la page » au lieu du planning
   du jour. La console distante (Safari Web Inspector connecté à l'iPhone, ou logs équivalents)
   montre : `FetchEvent.respondWith received an error: Returned response is null`.

**Variante dev/desktop (reproductible sans iPhone, pour investigation/non-régression) :**
1. `npm run build && npm run preview` (ou équivalent servant les fichiers statiques buildés —
   nécessaire pour que le service worker soit enregistré, contrairement à `npm run dev`).
2. Ouvrir l'application dans Chrome, attendre l'enregistrement du service worker (onglet
   Application → Service Workers), laisser l'app charger une première fois en ligne.
3. Naviguer vers un écran qui n'a pas encore été visité dans cette session (ex. `/resume` si
   seule `/` a été chargée), pour garantir qu'aucune requête réseau antérieure n'a pu la mettre en
   cache de façon incidente.
4. Ouvrir DevTools → onglet Network (ou Application → Service Workers) → cocher « Offline ».
5. Recharger la page ou naviguer vers cet écran non visité.
6. **Constat** : la page ne s'affiche pas (erreur réseau / page blanche selon le navigateur),
   avec la même erreur `FetchEvent.respondWith received an error: Returned response is null`
   visible dans la console DevTools, confirmant que le mécanisme fautif est bien le service
   worker et non une particularité iOS/Safari.

## Résultat observé
- Sur iPhone, l'ouverture de l'app installée sans réseau échoue avec l'erreur générique du
  navigateur « Safari ne peut pas ouvrir la page ». L'application ne s'affiche pas du tout, y
  compris pour consulter des données déjà enregistrées localement.
- Erreur technique associée, journalisée côté service worker : `FetchEvent.respondWith received
  an error: Returned response is null`.
- Le même défaut se reproduit en desktop (Chrome, mode Offline des DevTools) sur toute page non
  déjà mise en cache explicitement.

## Résultat attendu
Conformément au comportement attendu recopié ci-dessus : l'application s'ouvre normalement depuis
l'icône de l'écran d'accueil même sans réseau, et affiche le planning du jour avec les données déjà
enregistrées localement (IndexedDB) — sans jamais afficher l'erreur générique du navigateur.

## Sévérité & impact
**Bloquant.** L'usage nomade sans réseau garanti (métro, avion, zone blanche) est la raison d'être
du produit (cf. ADR-001, « offline-first »). Ce défaut rend l'application **totalement
inutilisable** dès que le réseau est absent au moment de l'ouverture, y compris pour consulter des
données déjà présentes en local — il ne s'agit pas d'une dégradation partielle mais d'un échec
complet du parcours (l'app ne s'ouvre pas du tout). Aucun contournement utilisateur connu (l'app
étant en SPA/`fallback: '200.html'`, il n'existe pas de page HTML de repli hors ligne). Impact sur
l'intégralité des utilisateurs, à chaque ouverture sans réseau. Il s'agit de plus d'une
**régression** par rapport à un comportement déjà acté et vérifié en conditions réelles
(`docs/JOURNAL.md`, session du 2026-08-11), pas d'une fonctionnalité jamais livrée.

## Notes / pistes
Analyse de code statique (lecture seule, aucune modification apportée — à confirmer/affiner par le
développeur en charge du correctif) :

- `src/service-worker.ts` (lignes ~18-20 et ~43-55) : `ASSETS = [...build, ...files]`, où `build`
  et `files` (import `$service-worker` de SvelteKit) couvrent uniquement le bundle JS/CSS et les
  assets statiques (`static/`) — **aucune page HTML pré-rendue n'est précachée** (ni `200.html`,
  ni les routes `/`, `/habitudes`, `/taches`, `/resume`, `/reglages`). Le module `$service-worker`
  de SvelteKit expose pourtant aussi un export `prerendered` (liste des routes pré-rendues), non
  importé ici.
- Le gestionnaire `fetch` (lignes ~43-55) applique une stratégie cache-first avec repli réseau :
  `caches.match(request).then((cached) => cached ?? fetch(request).catch(() => caches.match('/')))`.
  Hors ligne, sur une page jamais précachée : `caches.match(request)` échoue (`undefined`),
  `fetch(request)` échoue (pas de réseau) et tombe dans le `.catch`, qui tente
  `caches.match('/')` — mais la clé `'/'` (comme toute autre page HTML) n'a jamais été mise en
  cache par l'étape `install` (voir point précédent), donc cette dernière tentative résout aussi
  à `undefined`. `event.respondWith` reçoit alors une Promise résolue en `undefined` (pas un objet
  `Response`), d'où l'erreur `FetchEvent.respondWith received an error: Returned response is
  null` et l'échec de la navigation.
- Point additionnel à noter pour le correctif : le repli en cas d'échec cible toujours la clé
  fixe `'/'` (`caches.match('/')`), jamais le chemin réellement demandé — même si `'/'` était
  correctement précachée, une navigation directe vers `/habitudes` ou `/resume` hors ligne
  retomberait sur le planning plutôt que sur l'écran demandé.
- `svelte.config.js` : `adapter-static` avec `fallback: '200.html'` (mode SPA) et
  `src/routes/+layout.ts` : `ssr = false` / `prerender = true` — confirmé, cohérent avec la
  description du signalement initial.
- Fichiers à examiner en priorité pour le correctif : `src/service-worker.ts` (stratégie de
  précache et de repli), et — selon la solution retenue pour le cas d'une ressource réellement
  jamais mise en cache — un éventuel écran/route dédié à l'état hors ligne, en repli propre plutôt
  qu'une erreur navigateur.
- Aucune correction n'a été apportée par ce ticket, conformément au rôle QA : le correctif relève
  de l'agent `sveltekit-senior-dev`.
