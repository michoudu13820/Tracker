# Architecture — Habit Tracker

Application personnelle de suivi d'habitudes, **iPhone**, **100 % locale** (pas de backend, pas de compte, pas de synchronisation).

## Documents

| Document | Objet |
|----------|-------|
| **[CONVENTIONS.md](CONVENTIONS.md)** | **Pense-bête condensé — lecture par défaut avant de coder.** Où mettre le code, nommage, documentation, tests, pièges du projet. |
| [ADR-001](ADR-001-flutter-clean-architecture.md) | Flutter + Clean Architecture organisée par feature — `accepté` |
| [ADR-002](ADR-002-riverpod-etat-injection.md) | Riverpod pour l'état de présentation et l'injection de dépendances — `accepté` |
| [ADR-003](ADR-003-drift-persistance-locale.md) | Drift (SQLite) pour la persistance locale — `accepté` |
| [ADR-004](ADR-004-result-failure-horloge-injectee.md) | Gestion des erreurs par `Result`/`Failure` et horloge injectée — `accepté` |
| [ADR-005](ADR-005-notifications-locales-ios.md) | Notifications locales iOS : plugin, fuseaux, fenêtre glissante — `proposé` (aucune US ne les couvre encore) |

Source amont : [benchmark framework mobile](../../benchmarks/benchmark-habit-tracker-ios-2026-08-09.md) — Flutter retenu dans l'addendum du 2026-08-09 (pas de Mac, pas de compte Apple Developer payant).

## Vue d'ensemble

```
        presentation  ──►  domain  ◄──  data
        (Riverpod)         (Dart pur)   (Drift)
                              ▲
                              │ interfaces de repository
                              │ (inversion de dépendance)
```

Le **domaine** ne dépend de rien : ni Flutter, ni Riverpod, ni Drift. Il contient les règles qui font la valeur de l'app — fréquences d'habitude, retard d'une tâche, taux de complétion, seuils de couleur — et se teste en millisecondes sans émulateur. C'est délibéré : le tooling iOS étant distant (build cloud), toute règle testable localement est du temps gagné.

## Décisions transverses en une ligne

- Découpage **par feature** (`habits`, `tasks`, `planning`, `summary`, `settings`), pas par couche technique globale.
- Les écritures et calculs métier passent par un **use case** ; les lectures triviales peuvent passer directement par le repository.
- Les erreurs remontent en **`Result<T>` + `Failure` scellées**, jamais en exception ; conversion faite dans la couche data.
- Le temps est **injecté** (horloge), et le jour métier est un **`CivilDate`** sans heure ni fuseau.
- Aucune dépendance ajoutée sans justification dans l'US qui l'introduit.

## Agents et skills associés

- Agent **`flutter-architect`** — décisions d'architecture, ADR, revue de structure.
- Agent **`flutter-senior-dev`** — implémentation des US (cycle `US/to_be_implemented → in_progress → done`).
- Skills : `scaffold-flutter`, `create-usecase`, `create-repository`, `create-flutter-screen`, `write-flutter-tests`, `flutter-quality-gate`.
