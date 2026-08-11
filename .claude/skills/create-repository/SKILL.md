---
name: create-repository
description: >-
  Implémente la couche data d'une feature Flutter : datasource (locale Drift/Isar/sqflite/prefs
  ou distante http/dio), modèles DTO + mappers vers le domaine, et implémentation concrète de
  l'interface de repository définie dans le domaine, avec conversion des exceptions en Failure
  et tests. À utiliser quand une donnée doit être persistée ou chargée, ou quand l'utilisateur
  demande « crée le repository », « implémente la persistance », « couche data », « stockage local Flutter ».
---

# Implémenter un repository (couche data)

Implémente dans `lib/features/<feature>/data/` l'interface de repository déclarée dans le domaine. C'est le **seul** endroit qui connaît la source de données réelle.

Argument attendu : l'entité concernée (ex : `habit`, `task`, `settings`).

## Prérequis

L'interface abstraite doit exister dans `domain/repositories/`. Si elle n'existe pas, commence par `create-usecase` — on n'implémente pas un repository sans contrat métier.

## Contenu généré

```
lib/features/<feature>/data/
├── models/<entity>_model.dart                # DTO (fromJson/toJson ou colonnes DB) + mappers
├── datasources/<entity>_local_data_source.dart   # accès brut au stockage
├── datasources/<entity>_remote_data_source.dart  # accès brut au réseau (si nécessaire)
└── repositories/<entity>_repository_impl.dart    # implémente l'interface du domaine
test/features/<feature>/data/
└── repositories/<entity>_repository_impl_test.dart
```

## Principes

- **Le DTO n'est pas l'entité** : `HabitModel` (sérialisation) ≠ `Habit` (métier). Le mapping se fait ici et **ne fuit jamais** vers la presentation. Un `Model` visible dans un widget est un bug d'architecture.
- **Datasource = accès brut**, sans règle métier : elle lit/écrit et lance des exceptions techniques.
- **Repository impl = traduction** : il appelle la datasource, mappe DTO → entité, et **convertit les exceptions techniques en `Failure` typées** renvoyées dans un `Result`. Aucune exception ne remonte à l'UI.
- **Cas à couvrir explicitement** : donnée absente, stockage indisponible/plein, données corrompues (migration de schéma), échec réseau et hors-ligne si une source distante existe.
- **Substituable** : l'implémentation est injectée au composition root (`core/di`), jamais instanciée dans un widget ni exposée en singleton global.
- **App locale/offline (défaut du projet)** : privilégie une base locale (Drift/Isar/sqflite selon l'ADR) pour les données structurées et requêtables ; `shared_preferences` uniquement pour des préférences scalaires. Ne tranche pas ce choix seul s'il n'est pas déjà acté — demande un ADR (`generate-adr`).

## Documentation (obligatoire)

- En-tête de fichier : couche + responsabilité (ex. « Couche data — traduit le stockage local en entités du domaine »).
- Dartdoc `///` sur la classe d'implémentation, chaque méthode publique, chaque mapper : ce qui est garanti, quelles `Failure` sont produites et dans quels cas.
- Commentaire inline sur les subtilités de stockage : format de sérialisation d'une date, migration de schéma, contournement d'une contrainte iOS.
- Commentaires en français, identifiants en anglais (sauf si le code existant a tranché autrement).

## Étapes

1. Lis l'interface du domaine : implémente **exactement** ses méthodes, rien de plus.
2. Détecte la lib de stockage déjà utilisée (`pubspec.yaml`) ; ne l'introduis pas unilatéralement si elle n'est pas actée.
3. Écris le modèle + mappers, puis la datasource, puis l'implémentation du repository.
4. Écris les tests avec une datasource fake/en mémoire : nominal, donnée absente, erreur technique → `Failure` attendue.
5. Câble l'injection dans `core/di`, puis lance `flutter-quality-gate`.
