---
name: flutter-quality-gate
description: >-
  Exécute la barrière qualité d'un projet Flutter avant de clôturer une US : dépendances,
  codegen éventuel, format (dart format), analyse statique (flutter analyze), tests
  (flutter test + integration_test) et build, puis rapporte un verdict PASS/FAIL détaillé.
  À utiliser avant de passer une US en done, ou quand l'utilisateur demande « vérifie la qualité »,
  « lance les checks », « est-ce que ça build », « flutter analyze ».
---

# Quality gate (Flutter)

Exécute la barrière qualité et rends un verdict clair. **Bloquant** : une US ne passe pas en `US/done/` tant que le gate n'est pas vert.

## Sobriété de sortie (important — coût en tokens)

Ce gate est relancé plusieurs fois par US (corrections itératives). Une sortie verbeuse coûte cher à chaque relance. Par défaut : **silencieux sur succès, détaillé sur échec seulement**.

- `flutter test --reporter=compact` — jamais le reporter `expanded`. En cas d'échec, relance **uniquement** le fichier fautif (`flutter test test/chemin/du_test.dart`) pour le détail complet.
- `dart format --output=none --set-exit-if-changed .` en vérification (n'écrit rien). Si ça échoue, lance `dart format .` puis relance **cette seule étape**.
- `flutter analyze` : sortie déjà courte ; ne pas ajouter `-v`.
- N'exécute **pas** deux fois la même étape « pour vérifier » si rien n'a changé entre-temps.
- Après correction : relance l'étape corrigée seule, puis **une unique** passe complète finale.

## Étapes (dans l'ordre, s'arrêter au premier échec bloquant)

1. **Dépendances** : `flutter pub get` (obligatoire si `.dart_tool/` absent ou `pubspec.yaml` modifié)
2. **Codegen** (seulement si le projet utilise `build_runner` — vérifie `pubspec.yaml`) : `dart run build_runner build --delete-conflicting-outputs`
3. **Format** : `dart format --output=none --set-exit-if-changed .`
4. **Analyse statique** : `flutter analyze`
5. **Tests unitaires & widgets** : `flutter test --reporter=compact`
6. **Tests d'intégration** (si présents et pertinents pour l'US) : `flutter test integration_test`
7. **Build** : `flutter build ios --no-codesign` sur macOS ; sinon `flutter build apk --debug` (le build iOS complet est délégué à la CI macOS)

Lis d'abord `pubspec.yaml` et `analysis_options.yaml` pour adapter les commandes à ce qui existe réellement. Sur Windows, utilise PowerShell.

## Rapport

```
| Étape     | Commande                                    | Résultat     |
|-----------|---------------------------------------------|--------------|
| Deps      | flutter pub get                             | ✅ / ❌       |
| Codegen   | dart run build_runner build                 | ✅ / ❌ / ⏭️  |
| Format    | dart format --set-exit-if-changed .         | ✅ / ❌       |
| Analyse   | flutter analyze                             | ✅ / ❌       |
| Tests     | flutter test --reporter=compact             | ✅ / ❌       |
| E2E       | flutter test integration_test               | ✅ / ❌ / ⏭️  |
| Build     | flutter build apk --debug                   | ✅ / ❌       |
```

- **Verdict** : `PASS` seulement si toutes les étapes bloquantes sont vertes ; sinon `FAIL` avec la liste des erreurs et une reco de correction.
- En cas d'échec, propose (ou applique si demandé) les corrections, puis relance **uniquement l'étape corrigée** avant une passe finale complète unique.
- Ne déclare **jamais** `PASS` sans avoir réellement exécuté les commandes et lu leur sortie.

## Contrôles complémentaires (revue, non automatisables)

Avant de valider, vérifie aussi à la lecture du diff :
- **Pureté du domaine** : `Grep` de `package:flutter/` dans `lib/features/*/domain/` → doit ne rien renvoyer.
- **Étanchéité des couches** : aucun import de `data/` depuis `presentation/` (l'UI passe par les use cases).
- **Documentation** : tout élément public ajouté porte une dartdoc `///` ; tout fichier créé a son en-tête de responsabilité.
