# Architecture — Tracker (habit tracker PWA)

Document de synthèse. Les décisions structurantes sont tracées dans des ADR.

## Vue d'ensemble

**Tracker** est une **PWA SvelteKit statique**, installée sur l'écran d'accueil de
l'iPhone, offline-first, avec toutes les **données métier stockées localement**
(IndexedDB). Un **micro-scheduler serveur** (Netlify Functions) sert *uniquement* à
déclencher les rappels Web Push au bon moment — il ne stocke aucune donnée métier.

```
┌────────────────────── iPhone (PWA écran d'accueil) ──────────────────────┐
│  UI Svelte 5 (routes/, lib/components)                                    │
│      │ via stores (runes)                                                 │
│  lib/stores  ── lib/domain (métier pur) ── lib/data (IndexedDB) ◄── DONNÉES│
│      │                                          (habitudes, complétion…)  │
│  lib/push (souscription + fenêtre de rappels)                             │
│  service-worker.ts (offline + réception push)                             │
└───────────────────────────────┬──────────────────────────────────────────┘
                                 │  POST { subscription, reminders[] }
                                 │  (UNIQUEMENT des horodatages, aucune donnée métier)
                                 ▼
┌────────────────── Netlify (même compte que l'hébergement) ───────────────┐
│  functions/register-subscription   → écrit dans Netlify Blobs            │
│  functions/unregister-subscription → supprime                            │
│  functions/send-reminders (CRON */15) → lit Blobs, envoie push via VAPID │
│  Netlify Blobs : clé = SHA-256(endpoint) → { subscription, reminders }   │
└──────────────────────────────────────────────────────────────────────────┘
                                 │ Web Push (VAPID)
                                 ▼  service worker affiche la notification
```

## Flux de données

1. **Données métier** (habitudes, tâches, complétions, réglages, seuils) : créées et lues
   localement, persistées dans **IndexedDB** via `lib/data/repositories.ts`. Elles ne
   quittent **jamais** l'appareil.
2. **Rappels** : `lib/domain/reminders.ts` calcule localement une **fenêtre glissante**
   d'instants d'envoi (jours ayant au moins une occurrence × heure de rappel choisie).
   `lib/push/client.ts` envoie cette liste + la souscription au serveur, à chaque ouverture
   de l'app ou changement de données.
3. **Déclenchement** : la fonction cron `send-reminders` s'exécute toutes les 15 min, envoie
   un push générique pour tout rappel échu, purge les rappels passés.
4. **Réception** : le `service-worker.ts` reçoit l'événement `push` et affiche la notification.

## Frontières & règles de dépendance

- `routes` / `components` → `stores` → `domain` + `data` ; `data` → `domain` ; `domain` pur.
  Les composants **n'accèdent jamais** à IndexedDB directement (toujours via un store).
- `domain/` est **pur** (aucune dépendance framework/stockage) → testable et portable.
- L'app SvelteKit est **100 % statique** : **aucun** endpoint serveur SvelteKit. Le seul
  code serveur vit dans `netlify/functions/`, découplé. Supprimer ces fonctions n'empêche
  pas l'app de fonctionner (elle perd seulement les rappels).
- Détail des règles au quotidien : voir [CONVENTIONS.md](./CONVENTIONS.md).

## Navigation & routes

Navigation par **onglets** (barre inférieure, `TabBar.svelte`) — 5 routes de premier niveau
(ADR-002). Toutes en SPA client (`ssr = false`, `prerender = true`).

| Route | Onglet | US |
|-------|--------|----|
| `/` | Aujourd'hui | US-004 (planning quotidien) |
| `/habitudes` | Habitudes | US-001 |
| `/taches` | Tâches | US-002, US-003 |
| `/resume` | Résumé | US-005, US-006 |
| `/reglages` | Réglages | US-007 (rappels), US-006 (seuils), US-008 (sauvegarde) |

## Stores (état, ADR-003)

Un store par domaine fonctionnel, patron commun (classe + singleton, runes `$state`, repo
injecté) : `habitsStore`, `tasksStore`, `completionsStore`, `settingsStore` (réglages
persistés : seuils + rappels), `remindersStore` (orchestration runtime du push).

## Arborescence

```
src/
├── lib/
│   ├── domain/        # Métier pur : types, dates, occurrences, tasks, reminders, summary (+ *.test.ts)
│   ├── data/          # repositories.ts (IndexedDB via idb-keyval) + backup.ts (export/import JSON, US-008)
│   ├── stores/        # habits / tasks / completions / settings / reminders (.store.svelte.ts)
│   ├── components/    # TabBar.svelte (coquille de navigation) + index.ts (barrel)
│   ├── push/          # client.ts (souscription Web Push + upload fenêtre)
│   └── index.ts       # barrel
├── routes/
│   ├── +layout.svelte # coquille : <main> + <TabBar/>
│   ├── +layout.ts     # ssr=false, prerender=true (hérité par toutes les routes)
│   ├── +page.svelte           # / — Aujourd'hui (US-004)
│   ├── habitudes/+page.svelte  # US-001
│   ├── taches/+page.svelte     # US-002/003
│   ├── resume/+page.svelte     # US-005/006
│   └── reglages/+page.svelte   # US-006/007/008
├── service-worker.ts  # offline (precache) + push + notificationclick
├── app.html           # meta iOS + lien manifest
└── app.css
static/                # manifest.webmanifest, favicon.svg, icons/
netlify/functions/     # register / unregister / send-reminders / trigger-send (+ _shared/{store,send-due}.ts)
netlify.toml           # build statique + fonctions + SPA fallback
docs/architecture/     # ADR-001..004 + ARCHITECTURE.md + CONVENTIONS.md
```

> Note : les `+page.svelte` de chaque route sont pour l'instant des **placeholders** de
> structure (titre + renvoi à l'US), câblés aux stores, à implémenter US par US.

## Choix de librairies (minimalistes)

| Besoin | Choix | Justification |
|---|---|---|
| Framework | SvelteKit 2 + Svelte 5 (runes) | Léger, statique, idiomatique |
| Déploiement | `adapter-static` (SPA) | App locale, hébergement gratuit, offline |
| PWA / offline / push | `service-worker.ts` natif SvelteKit | Contrôle total de l'événement `push`, **zéro dépendance** (vs vite-plugin-pwa) |
| Stockage local | `idb-keyval` | API minimale sur IndexedDB, suffisant pour v0 |
| Scheduler | Netlify Scheduled Functions | Même compte que l'hébergement, offre gratuite |
| État serveur | Netlify Blobs | Clé/valeur gratuit, pas de base de données |
| Web Push serveur | `web-push` (VAPID) | Standard de facto |
| Tests | Vitest (+ `@testing-library/svelte` si composants) | Pyramide : beaucoup d'unitaires sur `domain` |

## Stratégie de test

- **Unitaire (Vitest, node)** : `lib/domain` (occurrences, reminders, summary) et
  `lib/data` (repository en mémoire). C'est là que se concentre l'effort.
- **Composants (Vitest + jsdom + testing-library)** : composants critiques, au besoin.
- **e2e (Playwright)** : à ajouter pour les parcours clés quand l'UI existera.
- **Rappels (US-007)** : la fiabilité « app fermée / verrouillée » ne se valide **que sur
  iPhone réel installé** — à tester tôt (cf. US-007 et ADR-001).

## ADR

| ADR | Titre | Statut |
|-----|-------|--------|
| [ADR-001](./ADR-001-pwa-sveltekit-web-push-scheduler.md) | PWA SvelteKit + Web Push avec micro-scheduler serveur (pivot depuis Flutter) | accepté |
| [ADR-002](./ADR-002-structure-routes-spa-onglets.md) | Structure des routes SPA et navigation par onglets | accepté |
| [ADR-003](./ADR-003-state-management-store-par-domaine.md) | State management : un store Svelte 5 par domaine fonctionnel | accepté |
| [ADR-004](./ADR-004-persistance-indexeddb-repositories.md) | Couche de persistance : repositories par agrégat sur IndexedDB | accepté |

Conventions de code : [CONVENTIONS.md](./CONVENTIONS.md).
