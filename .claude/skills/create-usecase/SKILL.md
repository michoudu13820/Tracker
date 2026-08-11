---
name: create-usecase
description: >-
  Crée la couche domaine d'une fonctionnalité Flutter en Dart pur : entité/value objects,
  interface de repository abstraite, et cas d'usage (use case) portant une intention métier
  unique, avec Result/Failure, dartdoc complète et test unitaire. À utiliser quand une règle
  métier doit être implémentée, ou quand l'utilisateur demande « crée un use case »,
  « ajoute une règle métier », « couche domaine », « entité métier ».
---

# Créer un cas d'usage (couche domaine)

Crée l'intention métier dans `lib/features/<feature>/domain/`. C'est le **contrat** qui guide ensuite la data et la presentation : on l'écrit en premier.

Argument attendu : l'intention métier (ex : `créer une habitude`, `reprogrammer une tâche en retard`, `calculer la série courante`).

## Règle absolue : domaine pur

`domain/` ne contient **aucun** import `package:flutter/...`, ni HTTP, ni base de données, ni package de state management. Vérifiable par `Grep 'package:flutter/' lib/features/*/domain/` → doit ne rien renvoyer. Si tu as besoin d'un import framework ici, la conception est fausse : le besoin appartient à `data/` ou `presentation/`.

## Contenu généré

```
lib/features/<feature>/domain/
├── entities/<entity>.dart                  # objet métier immuable + invariants
├── value_objects/<vo>.dart                 # type contraint (optionnel)
├── repositories/<entity>_repository.dart   # INTERFACE abstraite (pas d'implémentation)
└── usecases/<verb>_<entity>.dart           # 1 classe = 1 intention métier
test/features/<feature>/domain/
└── usecases/<verb>_<entity>_test.dart      # tests unitaires purs (mocktail / fake)
```

## Principes

- **Une intention par use case**, exposée par une méthode d'appel unique et explicite (`call(...)` ou une méthode nommée). Il orchestre : valide les entrées, applique la règle métier, délègue la persistance au repository via son interface.
- **Nom = verbe + objet** : `CreateHabit`, `RescheduleOverdueTask`, `ComputeCurrentStreak`. Jamais `HabitManager`, `HabitService`, `handle()`.
- **Interface de repository dans le domaine**, implémentation dans `data/` : c'est l'inversion de dépendance qui garde le domaine pur.
- **Result / Failure** : le use case retourne un `Result<T>` (ou `Either<Failure, T>` selon l'ADR) ; il ne lance pas d'exception vers l'UI. Chaque cas d'échec métier a une `Failure` typée dans `core/error`.
- **Immutabilité** : entités `final`/`const`, `copyWith`, `==`/`hashCode` implémentés.
- **Testable sans Flutter** : le test du use case tourne avec `flutter test` sans `testWidgets`, repository remplacé par un mock `mocktail` ou un fake en mémoire.

## Documentation (obligatoire)

- En-tête de fichier : couche + responsabilité unique.
- Dartdoc `///` sur l'entité, l'interface de repository, le use case et sa méthode d'appel : **intention métier**, règles appliquées, cas d'échec (`Failure`) possibles, sens des paramètres non évidents.
- Commentaire inline sur toute règle métier non triviale (seuil, calcul de série, gestion du retard) expliquant le **pourquoi**.
- Commentaires et dartdoc en français, identifiants en anglais (sauf si le code existant a tranché autrement).

## Étapes

1. Identifie la feature et l'intention métier exacte (une seule ; si l'US en contient plusieurs, crée plusieurs use cases).
2. Modélise l'entité et ses invariants avant tout le reste.
3. Déclare l'interface de repository avec les seules opérations dont le use case a besoin (pas de CRUD spéculatif).
4. Écris le use case, puis son test unitaire — un `group()` par critère d'acceptation de l'US, un `test()` par cas Given/When/Then, cas limites et échecs inclus.
5. Renvoie vers `create-repository` pour l'implémentation data, et `flutter-quality-gate` pour la vérification.
