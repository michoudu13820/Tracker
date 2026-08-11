---
name: write-flutter-tests
description: >-
  Écrit ou complète les tests d'un projet Flutter : unitaires du domaine et de la data
  (flutter test, mocktail), tests de widgets (testWidgets, WidgetTester), et parcours critiques
  bout en bout (integration_test), en traduisant les critères d'acceptation Given/When/Then en
  cas de test. À utiliser pendant l'implémentation d'une US, ou quand l'utilisateur demande
  « écris les tests Flutter », « couvre cette fonctionnalité », « ajoute des widget tests ».
---

# Écrire des tests Flutter

Écrit/complète les tests en respectant la pyramide et en traduisant les critères d'acceptation de l'US.

## Stratégie (pyramide)

- **Domaine** (`domain/entities`, `value_objects`, `usecases`) : tests unitaires purs, **sans Flutter ni DOM**. Repository remplacé par un mock `mocktail` ou un fake en mémoire. Beaucoup de tests, rapides — c'est ici que vit la règle métier, donc l'essentiel de la couverture.
- **Data** (`repositories`, `datasources`) : tests unitaires avec datasource fake/en mémoire. Vérifie le mapping DTO → entité et la **conversion des exceptions techniques en `Failure`**.
- **Presentation** (`state`, `pages`, `widgets`) : `testWidgets` + `WidgetTester`. Rendu, interactions (`tester.tap`, `enterText`, `pumpAndSettle`), et les états **loading / vide / erreur / nominal**.
- **Parcours critiques** : `integration_test/` sur les flux clés seulement (création d'une habitude, cochage du jour, consultation du résumé).

Le test reflète l'arborescence de `lib/` : `test/features/<feature>/domain/usecases/create_habit_test.dart`.

## Traduction des critères d'acceptation

Chaque scénario **Given/When/Then** d'une US devient un cas de test :
- **Étant donné (Given)** → arrange (état initial, mocks, `pumpWidget`)
- **Quand (When)** → act (appel du use case, interaction utilisateur)
- **Alors (Then)** → assert (résultat observable, `expect(find.text(...), findsOneWidget)`)

Structure : un `group()` par critère d'acceptation, un `test()`/`testWidgets()` par cas. Nomme d'après le comportement attendu, pas d'après la méthode appelée :
`test('marque l'habitude comme faite pour aujourd'hui quand on coche la case', ...)`.

## Bonnes pratiques

- Teste le **comportement observable**, pas les détails d'implémentation.
- Couvre le nominal ET les cas limites/erreurs mentionnés dans l'US (jour sans données, tâche déjà en retard, seuil exactement atteint, stockage indisponible).
- Vérifie explicitement les **`Failure`** attendues, pas seulement les cas passants.
- Isole : mocke le repository pour tester un use case, mocke le use case pour tester la presentation.
- `mocktail` (pas de codegen) sauf si l'ADR a retenu `mockito` ; `registerFallbackValue` pour les types custom passés en `any()`.
- Widgets : requêtes accessibles (`find.bySemanticsLabel`, `find.byKey`) plutôt que par type quand c'est possible ; `Key` explicite sur les éléments interactifs testés.
- Dates/heures : injecte une horloge (`DateTime Function() now`) plutôt que d'appeler `DateTime.now()` dans le domaine — sinon les tests de retard et de série sont non déterministes.
- Commente en une ligne les tests dont l'intention n'est pas évidente à la lecture (cas limite métier, régression).

## Étapes

1. Repère les critères d'acceptation de l'US en cours (dans `US/in_progress/`).
2. Détecte la config de test existante (`pubspec.yaml` : `flutter_test`, `mocktail`, `integration_test`) ; propose de l'ajouter si absente.
3. Écris les tests au bon niveau de la pyramide — priorité au domaine.
4. Lance `flutter test --reporter=compact` et rends compte ; renvoie vers `flutter-quality-gate` pour la vérification complète.
