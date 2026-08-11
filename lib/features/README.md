# `features/` — découpage par feature (Clean Architecture)

Ce dossier est **volontairement vide au scaffold**. Chaque feature est créée
par la User Story qui l'introduit (skills `create-usecase`, `create-repository`,
`create-flutter-screen`), pas « au cas où ». On ne crée pas d'arborescence morte.

## Structure d'une feature

```
features/<feature>/
  domain/          # Dart PUR — zéro import Flutter/Riverpod/Drift
    entities/        # objets métier immuables (final, copyWith, ==/hashCode)
    value_objects/   # types contraints, invariants validés à la construction
    repositories/    # interfaces abstraites uniquement (inversion de dépendance)
    usecases/        # 1 classe = 1 intention métier, retourne Result<T>
  data/
    models/          # DTO + mappers (le DTO ne sort JAMAIS de data/)
    datasources/     # accès brut (SQL Drift), aucune règle métier
    repositories/    # implémentations : exception technique -> Failure
  presentation/
    state/           # Notifier / AsyncNotifier, zéro règle métier
    pages/           # écrans routés
    widgets/         # widgets réutilisables de la feature
```

Règle de dépendance : `presentation -> domain <- data`. Le domaine ne dépend de
rien. Contrôle mécanique : `package:flutter/` interdit sous `*/domain/` ;
`presentation/` n'importe jamais `data/`.

## Features prévues par le backlog

`habits` (US-001), `tasks` (US-002/003), `planning` (US-004),
`summary` (US-005), `settings` (US-006). Voir `docs/architecture/CONVENTIONS.md`.
