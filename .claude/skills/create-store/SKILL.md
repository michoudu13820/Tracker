---
name: create-store
description: >-
  Crée un module d'état partagé dans src/lib/stores avec les runes Svelte 5 ($state, $derived),
  encapsulé (classe/factory), typé et testable, qui s'appuie sur un repository de lib/data pour
  la persistance. À utiliser pour gérer un état global réactif, ou quand l'utilisateur demande
  « crée un store », « state management », « état partagé entre composants ».
---

# Créer un store (état partagé, Svelte 5 runes)

Crée un module d'état partagé dans `src/lib/stores/`, en s'appuyant sur les runes Svelte 5.

Argument attendu : le nom du domaine d'état (ex : `activities`, `daySelection`).

## Principes
- **Runes Svelte 5** : `$state` pour l'état, `$derived` pour les valeurs calculées. Éviter `$effect` pour du dérivable.
- **Encapsulation** : expose une classe ou une factory avec des méthodes claires (actions), plutôt que des variables mutables nues.
- **Persistance déléguée** : le store appelle un **repository** de `lib/data` pour charger/sauver ; il ne parle pas directement à IndexedDB.
- **Testable** : le store reçoit son repository par injection (constructeur/param) → mockable en test.
- **Réactivité exportable** : si l'état est partagé entre composants, expose une instance unique via le module.

## Contenu généré
```
src/lib/stores/
├── <domaine>.store.svelte.ts     # état (runes) + actions, repository injecté
└── <domaine>.store.test.ts       # tests avec repository mocké
```
(fichier `.svelte.ts` pour autoriser les runes hors composant.)

## Étapes
1. Définis l'état minimal nécessaire (`$state`) et les valeurs dérivées (`$derived`).
2. Implémente les actions (charger, ajouter, cocher/décocher, supprimer…) qui délèguent la persistance au repository.
3. Injecte le repository (pas d'accès stockage en dur).
4. Génère les tests avec un repository en mémoire.
5. Explique comment un composant consomme le store.
