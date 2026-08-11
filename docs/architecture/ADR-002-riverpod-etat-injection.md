---
type: adr
numero: 002
titre: Riverpod pour l'état de présentation et l'injection de dépendances
date: 2026-08-09
auteur: flutter-architect
statut: accepté
remplace: —
---

# ADR-002 — Riverpod pour l'état de présentation et l'injection de dépendances

## Contexte

L'ADR-001 impose que la couche presentation consomme le domaine via des use cases, et que les implémentations concrètes soient injectées depuis un composition root. Il faut donc :
1. un mécanisme d'**état de présentation** réactif (planning du jour, formulaire d'habitude, résumé par période) ;
2. un mécanisme d'**injection de dépendances** pour fournir repositories et use cases sans singletons globaux appelés depuis les widgets ;
3. les deux doivent rester **testables sans émulateur** et permettre de substituer facilement un fake de repository.

## Décision

Le projet utilise **Riverpod** pour l'état de présentation **et** pour l'injection de dépendances.

- Les dépendances (datasource, repository, use cases) sont exposées par des providers déclarés dans `core/di/` et/ou dans `features/<feature>/presentation/state/`.
- L'état d'un écran est porté par un `Notifier`/`AsyncNotifier` dans `features/<feature>/presentation/state/`, qui appelle des use cases et n'expose qu'un état immuable à l'UI.
- Les widgets consomment l'état via `ref.watch` ; ils ne contiennent **aucune règle métier**.
- En test, les dépendances sont remplacées par `ProviderContainer(overrides: […])` avec des fakes/mocks — c'est la raison principale du choix.
- **Le domaine n'importe jamais Riverpod.** Un use case est une classe Dart ordinaire ; c'est le provider qui l'instancie.

## Alternatives considérées

| Option | Avantages | Inconvénients | Retenue ? |
|--------|-----------|---------------|-----------|
| **Riverpod** | État + DI dans un seul outil (pas de `get_it` en plus) ; `overrides` rend le test d'écran trivial ; erreurs de câblage détectées à la compilation ; indépendant du `BuildContext`, donc testable hors widget | Courbe d'apprentissage des types de providers ; conventions à fixer pour éviter la prolifération de providers | ✅ Oui |
| flutter_bloc (+ get_it) | Très explicite (event → state), excellent pour la traçabilité, très répandu | Deux outils au lieu d'un (DI séparée) ; beaucoup de cérémonie pour des écrans simples comme un formulaire d'habitude ; volume de code supérieur pour un projet solo | ❌ Non |
| `setState` / `ChangeNotifier` + `Provider` | Minimal, natif ou quasi | Pas de substitution propre des dépendances en test ; l'état finit dans les `State<T>` donc couplé au widget ; régression garantie sur le résumé par période (US-005) qui doit recalculer sur plusieurs sources | ❌ Non |
| `signals` / solutions récentes | Ergonomie moderne | Écosystème plus étroit, pérennité moins établie — critère « maintenabilité solo sur la durée » du benchmark | ❌ Non |

## Conséquences

**Positives :**
- Une seule dépendance couvre état + injection.
- Les tests de la couche presentation n'ont pas besoin de la vraie base : `overrides` injecte un repository en mémoire.
- L'état étant hors `BuildContext`, une partie de la logique de présentation se teste sans `testWidgets`.

**Négatives / compromis acceptés :**
- Riverpod devient une dépendance transverse de toute la couche presentation : en sortir plus tard serait coûteux. Acceptable car cantonné à `presentation/` + `core/di/` — le domaine et la data en sont totalement exempts, donc le cœur de valeur reste portable.
- Convention à tenir : **un provider ne contient pas de logique métier**. S'il commence à calculer un taux ou une échéance, le calcul doit descendre dans le domaine.

## Liens

- [ADR-001 — Flutter + Clean Architecture](ADR-001-flutter-clean-architecture.md)
- [CONVENTIONS.md](CONVENTIONS.md)
