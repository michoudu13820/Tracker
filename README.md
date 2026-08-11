# Tracker

Suivi d'habitudes personnel — **PWA SvelteKit**, données **100 % locales** (iPhone),
rappels par **Web Push**.

## Architecture en bref

- **App** : SvelteKit 2 + Svelte 5 (runes), `adapter-static` (SPA offline-first), installée
  sur l'écran d'accueil de l'iPhone. Toutes les données métier (habitudes, tâches, historique,
  stats) vivent dans **IndexedDB** — elles ne quittent jamais l'appareil.
- **Rappels** : un **micro-scheduler serveur** (Netlify Functions + Netlify Blobs) déclenche
  les notifications Web Push au bon moment. Il ne connaît **que** la souscription push et des
  horodatages d'envoi — **aucune donnée métier**.

Détails et décisions : [`docs/architecture/ARCHITECTURE.md`](docs/architecture/ARCHITECTURE.md)
et [`docs/architecture/ADR-001`](docs/architecture/ADR-001-pwa-sveltekit-web-push-scheduler.md).

## Développement (Windows / PowerShell)

```powershell
npm install
npm run dev       # serveur de dev Vite
npm run build     # build statique dans build/
npm run preview   # prévisualise le build
npm run check     # vérification de types (svelte-check)
npm test          # tests unitaires (Vitest)
```

## Web Push (clés VAPID)

```powershell
npx web-push generate-vapid-keys
```

Copier `.env.example` en `.env` et renseigner `PUBLIC_VAPID_KEY`. Côté Netlify, définir
`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (variables d'environnement, non
commitées). Voir `.env.example`.

## Installation sur iPhone

Safari → **Partager** → **« Ajouter à l'écran d'accueil »**. L'installation est requise pour
recevoir les notifications Web Push (iOS 16.4+ ; France/UE depuis iOS 17.4).

## Structure

```
src/lib/domain    # logique métier pure (occurrences, rappels, résumé)
src/lib/data      # IndexedDB (repositories)
src/lib/stores    # état partagé (runes Svelte 5)
src/lib/push      # souscription Web Push + upload de la fenêtre de rappels
src/routes        # UI
netlify/functions # micro-scheduler (register / unregister / send-reminders)
US/               # User Stories
docs/architecture # ADR + synthèse
```

Le suivi fonctionnel est dans [`US/BACKLOG.md`](US/BACKLOG.md).
