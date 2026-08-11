---
name: run-quality-gate
description: >-
  Exécute la barrière qualité d'un projet SvelteKit avant de clôturer une US : typecheck
  (svelte-check/tsc), lint/format, tests (Vitest + éventuellement Playwright) et build de
  production, puis rapporte un verdict PASS/FAIL détaillé. À utiliser avant de passer une US en
  done, ou quand l'utilisateur demande « vérifie la qualité », « lance les checks », « est-ce que ça build ».
---

# Quality gate (SvelteKit)

Exécute la barrière qualité et rends un verdict clair. **Bloquant** : une US ne passe pas en `US/done/` tant que le gate n'est pas vert.

## Sobriété de sortie (important — coût en tokens)

Ce gate est relancé plusieurs fois par US (corrections itératives). Une sortie verbeuse (ex. Vitest qui liste chaque test individuellement) coûte cher en tokens à chaque relance. Par défaut, utilise des reporters/flags **silencieux sur succès, détaillés sur échec seulement** :

- Vitest : `npx vitest run --reporter=dot` (pas le reporter par défaut, qui imprime une ligne par test). En cas d'échec, relance uniquement le(s) fichier(s) en échec sans `--reporter=dot` pour obtenir le détail complet.
- ESLint : `npx eslint . --format=compact` (ou `--quiet` si seules les erreurs comptent, pas les warnings).
- Vite build : pas de flag spécial nécessaire (sortie déjà courte), mais éviter `--debug`.
- N'exécute **pas** deux fois la même étape « pour vérifier » — une seule passe suffit si rien n'a changé entre-temps.

## Étapes (dans l'ordre, s'arrêter et rapporter au premier échec bloquant)

1. **Install** (si nécessaire, càd si `node_modules/` absent) : `npm install`
2. **Typecheck** : `npm run check` (svelte-check) ou `npx tsc --noEmit`
3. **Lint / format** : `npm run lint` (ESLint) + `npx prettier --check .` si configuré — voir sobriété ci-dessus
4. **Tests unitaires & composants** : `npx vitest run --reporter=dot` (voir sobriété ci-dessus)
5. **Tests e2e** (si présents et pertinents pour l'US) : `npx playwright test`
6. **Build de production** : `npm run build`

Adapte les commandes aux scripts réellement présents dans `package.json` (lis-le d'abord). Sur Windows, utilise PowerShell.

## Rapport
Produis un tableau de synthèse :

```
| Étape       | Commande            | Résultat |
|-------------|---------------------|----------|
| Typecheck   | npm run check       | ✅ / ❌   |
| Lint        | npm run lint        | ✅ / ❌   |
| Tests       | vitest run          | ✅ / ❌   |
| E2E         | playwright test     | ✅ / ❌ / ⏭️ |
| Build       | npm run build       | ✅ / ❌   |
```

- **Verdict** : `PASS` seulement si toutes les étapes bloquantes sont vertes ; sinon `FAIL` avec la liste des erreurs et une reco de correction.
- En cas d'échec, propose (ou applique si demandé) les corrections, puis relance **uniquement l'étape corrigée** (pas tout le gate) avant une passe finale complète unique.
- Ne déclare jamais `PASS` sans avoir réellement exécuté les commandes et lu leur sortie.
