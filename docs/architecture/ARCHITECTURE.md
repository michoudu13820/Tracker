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

- `routes` / `components` → `stores` → `domain` + `data`. Les composants **n'accèdent
  jamais** à IndexedDB directement (toujours via un store).
- `domain/` est **pur** (aucune dépendance framework/stockage) → testable et portable.
- L'app SvelteKit est **100 % statique** : **aucun** endpoint serveur SvelteKit. Le seul
  code serveur vit dans `netlify/functions/`, découplé. Supprimer ces fonctions n'empêche
  pas l'app de fonctionner (elle perd seulement les rappels).

## Arborescence

```
src/
├── lib/
│   ├── domain/        # Métier pur : types, dates, occurrences, reminders, summary
│   ├── data/          # repositories.ts (IndexedDB via idb-keyval) + export JSON
│   ├── stores/        # habits.store.svelte.ts (runes Svelte 5), repo injecté
│   ├── push/          # client.ts (souscription Web Push + upload fenêtre)
│   └── index.ts       # barrel
├── routes/            # +layout(.svelte/.ts), +page.svelte  (SPA, ssr=false)
├── service-worker.ts  # offline (precache) + push + notificationclick
├── app.html           # meta iOS + lien manifest
└── app.css
static/                # manifest.webmanifest, favicon.svg, icons/
netlify/functions/     # register / unregister / send-reminders (+ _shared/store.ts)
netlify.toml           # build statique + fonctions + SPA fallback
docs/architecture/     # ADR + ce document
```

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
