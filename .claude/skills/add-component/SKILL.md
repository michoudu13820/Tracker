---
name: add-component
description: >-
  Crée un composant Svelte réutilisable dans src/lib/components/ avec son test
  (@testing-library/svelte + Vitest), props typées via $props, runes Svelte 5, styles scoped,
  accessibilité tactile. À utiliser pour ajouter un composant, ou quand l'utilisateur demande
  « crée un composant », « nouveau composant Svelte », « ajoute un composant réutilisable ».
---

# Ajouter un composant Svelte

Crée un composant Svelte réutilisable dans `src/lib/components/`, avec son test, en respectant les conventions du projet.

Argument attendu : le nom du composant (PascalCase, ex : `ActivityCard`).

## Fichiers générés (colocation)
```
src/lib/components/<Nom>/
├── <Nom>.svelte        # composant (Svelte 5, runes, props typées via $props)
└── <Nom>.test.ts       # test avec @testing-library/svelte + Vitest
```
(ou fichiers plats `src/lib/components/<Nom>.svelte` + `.test.ts` si le projet ne colocalise pas par dossier — détecte la convention existante.)

## Conventions
- **Props typées** via `let { ... }: Props = $props()` avec une interface `Props`.
- État local en `$state`, valeurs calculées en `$derived`.
- Émission d'événements via callbacks props (Svelte 5), pas `createEventDispatcher`.
- Styles scoped dans `<style>`.
- Pas d'accès direct au stockage/réseau : le composant reçoit ses données en props ou via un store.
- Accessibilité : rôles ARIA, cibles tactiles ≥ 44px si UI tactile.

## Test généré
- Rendu du composant, présence des éléments clés, interaction principale (ex : clic → callback appelé).

## Étapes
1. Détecte la convention de colocation existante (dossier vs plat).
2. Génère le composant + le test.
3. Ajoute l'export dans `src/lib/index.ts` si le projet utilise un barrel.
4. Explique le composant et lance les tests si demandé (`npm run test`).
