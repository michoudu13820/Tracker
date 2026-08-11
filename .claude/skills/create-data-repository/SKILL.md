---
name: create-data-repository
description: >-
  Crée un repository d'accès aux données dans src/lib/data (IndexedDB via idb-keyval, ou fetch),
  avec une interface TypeScript typée, découplée de l'UI et mockable pour les tests. À utiliser
  quand on doit persister/charger des données, ou quand l'utilisateur demande « crée un repository »,
  « couche d'accès aux données », « persistance IndexedDB », « stockage local ».
---

# Créer un repository de données

Crée une couche d'accès aux données dans `src/lib/data/`, isolant la source (IndexedDB, fetch API…) du reste de l'application.

Argument attendu : le nom de l'entité (ex : `activities`, `dayEvents`).

## Principes
- **Interface d'abord** : définis une interface TypeScript décrivant les opérations (`getAll`, `getById`, `save`, `remove`…) indépendamment de l'implémentation.
- **Implémentation isolée** : l'implémentation concrète (IndexedDB / fetch) est le seul endroit qui connaît la source de données.
- **Découplage UI** : aucun composant n'accède directement au stockage ; il passe par le repository (souvent via un store).
- **Mockable** : l'interface permet une implémentation en mémoire pour les tests.

## Contenu généré
```
src/lib/data/
├── <entité>.repository.ts        # interface + implémentation (ex: IndexedDB via idb-keyval)
└── <entité>.repository.test.ts   # tests unitaires (impl. en mémoire ou fake-indexeddb)
```

## Pour une app locale/offline (défaut du projet)
- Utilise **IndexedDB** via `idb-keyval` (léger) pour la persistance.
- Types stricts sur les entités (définis dans `lib/domain` si l'entité est métier).
- Gère les cas : donnée absente, stockage indisponible.

## Étapes
1. Détecte la lib de stockage utilisée (ou propose `idb-keyval`).
2. Génère l'interface, l'implémentation, et un test (avec `fake-indexeddb` ou une impl. en mémoire).
3. Explique comment le repository sera consommé (via un store de `lib/stores`).
