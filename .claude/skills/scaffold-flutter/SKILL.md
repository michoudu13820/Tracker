---
name: scaffold-flutter
description: >-
  Bootstrap le squelette d'un projet Flutter aligné sur les décisions actées du repo (Clean
  Architecture par feature, Riverpod, Drift, Result/Failure, horloge injectée) : flutter create,
  arborescence core/ + features/, socle core (error, result, di, database), analysis_options
  strict, dépendances de test. À utiliser pour démarrer le projet, ou quand l'utilisateur demande
  « initialise le projet Flutter », « scaffold », « crée la structure », « mets en place le socle ».
---

# Scaffolder un projet Flutter

Crée le squelette du projet conforme aux ADR de `docs/architecture/`. À exécuter **une seule fois**, au démarrage.

## Prérequis (à vérifier AVANT toute autre chose)

```powershell
flutter --version
flutter doctor
```

Si le SDK est absent, **arrête-toi et signale-le** : rien de ce qui suit n'est exécutable, et écrire un `pubspec.yaml` à la main sans `flutter create` laisserait le projet sans les dossiers de plateforme `ios/` et `android/`.

## Étapes

### 1. Création du projet
```powershell
flutter create --org com.<nom> --platforms=ios,android <nom_app>
```
Les deux plateformes : le développement quotidien se fait sur émulateur **Android** (pas de Mac), la cible réelle est **iOS** — cf. addendum du benchmark.

### 2. Arborescence
```
lib/
  core/{database,di,error,result,theme,utils}/
  features/{habits,tasks,planning,summary,settings}/
    domain/{entities,value_objects,repositories,usecases}/
    data/{models,datasources,repositories}/
    presentation/{state,pages,widgets}/
test/                 # miroir exact de lib/
integration_test/
```
Ne crée que les features réellement nécessaires aux US en cours — pas les cinq d'un coup « au cas où ».

### 3. Socle `core/` (à écrire, documenté, avec ses tests)
- `core/error/failure.dart` — `sealed class Failure` : `StorageFailure`, `NotFoundFailure`, `ValidationFailure`, `UnexpectedFailure` (ADR-004).
- `core/result/result.dart` — `sealed class Result<T>` avec `Success<T>` / `Error<T>`, exploitable en `switch` exhaustif (ADR-004).
- `core/utils/clock.dart` — horloge injectable + implémentation système (ADR-004).
- `core/database/` — base Drift + `schemaVersion` (ADR-003), seulement quand la première entité à persister existe.
- `core/di/` — providers du composition root (ADR-002).

### 4. Dépendances
```powershell
flutter pub add flutter_riverpod drift sqlite3_flutter_libs path_provider path
flutter pub add --dev build_runner drift_dev mocktail flutter_lints
```
N'ajoute **rien d'autre** sans justification (cf. CONVENTIONS §8). Pas de `dartz`/`fpdart` : `Result`/`Failure` sont maison.

### 5. `analysis_options.yaml`
Part de `flutter_lints`, puis durcis :
```yaml
include: package:flutter_lints/flutter.yaml
analyzer:
  language:
    strict-casts: true
    strict-raw-types: true
  errors:
    invalid_annotation_target: ignore   # bruit connu du codegen
linter:
  rules:
    - public_member_api_docs        # impose la dartdoc sur les membres publics
    - always_declare_return_types
    - prefer_const_constructors
    - avoid_print
```
`public_member_api_docs` est volontaire : il transforme l'exigence de documentation du projet en **erreur d'analyse**, donc en règle vérifiée par le quality gate plutôt qu'en bonne intention.

### 6. Vérification
Lance la skill `flutter-quality-gate`. Le scaffold n'est terminé que si elle rend `PASS`.

## Règles
- **Ne crée pas d'écran ni d'entité métier ici** : le scaffold livre le socle, les features arrivent par les US.
- Chaque fichier du socle part avec son en-tête de responsabilité et sa dartdoc.
- `Result`, `Failure` et l'horloge sont livrés **avec leurs tests** : ce sont les briques dont tout le reste dépend.
- Si un ADR manque pour un choix rencontré ici, sollicite `flutter-architect` / la skill `generate-adr` — ne tranche pas seul.
