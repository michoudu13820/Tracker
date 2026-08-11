---
type: adr
numero: 004
titre: Gestion des erreurs par Result/Failure et horloge injectée
date: 2026-08-09
auteur: flutter-architect
statut: accepté
remplace: —
---

# ADR-004 — Gestion des erreurs par Result/Failure et horloge injectée

## Contexte

Deux décisions transverses, sans lesquelles la clean architecture de l'ADR-001 fuit immédiatement.

**1. Erreurs.** Les couches basses lèvent des exceptions techniques (SQLite indisponible, données corrompues, permission refusée). Si elles remontent telles quelles, la couche presentation doit connaître les exceptions de Drift — le couplage que l'ADR-001 cherche justement à éviter — et l'UI plante au lieu d'afficher un message.

**2. Temps.** Cette application est entièrement une application de dates : « tous les 2 jours » (US-001), « en retard » (US-003), « aujourd'hui » (US-004), « taux de complétion sur la période » (US-005). Si le domaine appelle `DateTime.now()`, ses tests deviennent non déterministes (ils changent de résultat selon le jour d'exécution, et cassent une fois par an au changement d'heure).

## Décision

### Erreurs : `Result<T>` + `Failure` scellées, sans dépendance externe

- `core/error/failure.dart` définit une hiérarchie **`sealed class Failure`** (Dart 3) : `StorageFailure`, `NotFoundFailure`, `ValidationFailure`, `UnexpectedFailure`.
- `core/result/result.dart` définit **`sealed class Result<T>`** avec `Success<T>` et `Error<T>`, exploitable en `switch` exhaustif (le compilateur signale un cas d'erreur non traité).
- Les **use cases et repositories retournent `Result<T>`** ; ils ne lancent pas d'exception vers l'appelant.
- La **conversion exception → `Failure` se fait dans la couche data**, dans l'implémentation du repository (le seul endroit qui connaît la technologie de stockage).
- Une exception qui traverse quand même est un bug : `UnexpectedFailure` la capture avec sa trace, l'UI affiche un message générique.
- **Aucune dépendance ajoutée** : pas de `dartz`/`fpdart`. Les `sealed class` de Dart 3 couvrent le besoin avec un vocabulaire lisible par n'importe qui, là où `Either<L, R>` impose un vocabulaire fonctionnel à un projet solo.

### Temps : horloge injectée, et jour civil comme type métier

- Le domaine ne fait **jamais** appel à `DateTime.now()`. Toute classe qui a besoin de l'instant présent reçoit une `Clock` (`DateTime Function() now`, ou une petite classe `Clock`) par constructeur.
- Le composition root injecte l'horloge système ; les tests injectent une horloge figée.
- Un **value object `CivilDate`** (année/mois/jour, sans heure ni fuseau) représente le « jour » métier. Les complétions, échéances et périodes s'expriment en `CivilDate`, jamais en `DateTime` UTC.
- Les conversions `DateTime` ↔ `CivilDate` se font aux frontières (data et presentation), pas au milieu du domaine.

## Alternatives considérées

| Option | Avantages | Inconvénients | Retenue ? |
|--------|-----------|---------------|-----------|
| **`Result`/`Failure` scellés maison** | Zéro dépendance ; `switch` exhaustif vérifié à la compilation ; lisible sans culture FP | ~60 lignes à écrire et maintenir soi-même | ✅ Oui |
| `fpdart` / `dartz` (`Either`) | Outillage riche, composition (`map`, `flatMap`) | Dépendance supplémentaire et vocabulaire FP imposé partout, pour un gain marginal à cette échelle | ❌ Non |
| Exceptions Dart classiques + `try/catch` dans l'UI | Idiomatique Dart, aucun code à écrire | Rien ne force le traitement d'un cas d'erreur : les oublis ne se voient qu'au crash ; la presentation finit par connaître les exceptions de Drift | ❌ Non |
| `DateTime.now()` direct + tests tolérants | Aucun code d'infrastructure | Tests non déterministes sur exactement les règles les plus critiques (retard, série, taux) ; casse aux transitions d'heure d'été | ❌ Non |
| Package `clock` | Standard, `withClock` en test | Dépendance et magie implicite (zone) là où un paramètre de constructeur explicite est plus lisible ; peut être adopté plus tard sans changer les signatures métier | ❌ Non (pour l'instant) |

## Conséquences

**Positives :**
- Le compilateur devient le garde-fou : un `switch` sur `Result` ou sur `Failure` qui oublie un cas ne compile pas.
- Les règles de dates se testent de façon déterministe, y compris les cas tordus (retard de plusieurs jours, transition d'heure d'été, dernier jour du mois) — impossible à valider autrement, le tooling iOS étant distant.
- Aucune dépendance ajoutée pour ces deux besoins.

**Négatives / compromis acceptés :**
- Verbosité : chaque appel de use case se déballe par un `switch` ou un `when` plutôt qu'un `await` nu.
- `CivilDate` est un type de plus à écrire, mapper et sérialiser. C'est le prix pour ne pas avoir de bug de décalage d'un jour — le bug le plus probable et le plus insidieux de cette application.
- L'horloge doit être passée explicitement dans les constructeurs des use cases concernés, ce qui alourdit un peu leur instanciation dans les providers.

## Liens

- [ADR-001 — Flutter + Clean Architecture](ADR-001-flutter-clean-architecture.md)
- [ADR-003 — Drift pour la persistance locale](ADR-003-drift-persistance-locale.md)
- [CONVENTIONS.md](CONVENTIONS.md)
