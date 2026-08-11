---
name: scaffold-sveltekit
description: >-
  Bootstrap le squelette d'un projet SvelteKit (SvelteKit 2 + Svelte 5 runes, adapter-static,
  vite-plugin-pwa, arborescence lib/domain·data·stores, Vitest/Playwright), aligné sur les
  décisions actées du repo (PWA, stockage local). À utiliser pour démarrer un projet SvelteKit,
  ou quand l'utilisateur demande « initialise le projet », « scaffold », « crée la structure SvelteKit ».
---

# Scaffolder un projet SvelteKit

Bootstrap le squelette d'un projet SvelteKit adapté au cas d'usage du projet (par défaut : PWA locale offline-first, sans backend).

Avant de générer, lis les décisions déjà actées dans le repo (`benchmarks/`, `docs/architecture/`) avec Glob/Grep/Read et aligne-toi dessus (adapter, stockage, etc.). Si un choix n'est pas tranché, demande-le.

## Ce que ce skill met en place

### 1. Dépendances & config
- SvelteKit 2 + Svelte 5 (runes)
- `@sveltejs/adapter-static` (app statique / PWA — sauf indication contraire)
- `vite-plugin-pwa` (manifest + service worker)
- TypeScript
- Vitest + `@testing-library/svelte` + jsdom (tests unitaires & composants)
- Playwright (e2e) — optionnel, proposer

### 2. Arborescence cible
```
src/
├── lib/
│   ├── components/      # Composants UI réutilisables
│   ├── domain/          # Logique métier pure (framework-agnostique)
│   ├── stores/          # État global (runes $state)
│   ├── data/            # Repositories (IndexedDB / fetch)
│   ├── utils/
│   └── index.ts
├── routes/
│   ├── +layout.svelte
│   └── +page.svelte
├── service-worker.ts
├── app.html
└── app.css
static/                  # manifest.json, icônes
```

### 3. Config clés à générer
- `svelte.config.js` avec l'adapter choisi
- `vite.config.ts` avec `vite-plugin-pwa` et l'alias `$lib`
- `vitest` configuré dans `vite.config.ts`
- `tsconfig.json`, `.gitignore`

## Étapes
1. Vérifier le contexte (lecture des rapports existants).
2. Confirmer la stack et l'adapter avec l'utilisateur si non tranché.
3. Générer les fichiers de config + l'arborescence + un exemple minimal (layout + page d'accueil + un store + un repository IndexedDB stub).
4. Afficher les commandes d'install et de lancement (`npm install`, `npm run dev`) — sur Windows/PowerShell.
5. Rappeler d'exécuter le skill `setup-pwa` pour finaliser le manifest et le service worker, et `generate-adr` pour tracer le choix d'architecture.

Explique chaque fichier généré et son rôle. Ne crée aucune couche/dépendance non justifiée par le cas d'usage.
