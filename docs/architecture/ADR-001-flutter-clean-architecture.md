---
type: adr
numero: 001
titre: Flutter + Clean Architecture organisée par feature
date: 2026-08-09
auteur: flutter-architect
statut: accepté
remplace: —
---

# ADR-001 — Flutter + Clean Architecture organisée par feature

## Contexte

Le benchmark `benchmarks/benchmark-habit-tracker-ios-2026-08-09.md` a retenu **Flutter** dans son addendum du 2026-08-09 : sans Mac ni compte Apple Developer payant, Swift/SwiftUI devient impraticable au quotidien (Xcode obligatoire pour toute itération), alors que Flutter permet de développer ~90 % du périmètre sur Windows via l'émulateur Android, en ne recourant à un build iOS cloud que ponctuellement.

Contraintes structurantes du projet :
- Application **personnelle, solo**, sans backend, persistance strictement locale.
- **Durée de vie longue** avec un seul mainteneur : le code doit rester compréhensible après plusieurs mois sans y toucher.
- Cible iPhone, **porte Android laissée ouverte** sans surcoût.
- Le développement est assisté par des agents : le code doit être **explicitement documenté et à frontières nettes** pour qu'un agent (ou un humain) reprenne un fichier sans lire tout le projet.

Reste à décider comment organiser le code à l'intérieur du projet Flutter.

## Décision

Le projet adopte la **Clean Architecture à trois couches, organisée par feature** :

```
lib/
  core/                      # transverse : error, result, di, theme, router, utils
  features/<feature>/
    domain/                  # Dart pur : entities, value_objects, repositories (interfaces), usecases
    data/                    # models (DTO) + mappers, datasources, repositories (implémentations)
    presentation/            # state, pages, widgets
```

Règle de dépendance non négociable : **`presentation → domain ← data`**. Le domaine ne dépend de rien (aucun import `package:flutter/…`, aucun package de stockage ou d'état). L'inversion se fait par des interfaces de repository déclarées dans le domaine et implémentées dans la data.

L'UI ne parle au domaine **que via des use cases** (une classe = une intention métier). L'injection des implémentations se fait au composition root (`core/di`).

Le découpage se fait **par feature d'abord** (`features/habits/`, `features/tasks/`, `features/planning/`, `features/summary/`, `features/settings/`), pas par couche technique globale.

## Alternatives considérées

| Option | Avantages | Inconvénients | Retenue ? |
|--------|-----------|---------------|-----------|
| **Clean Architecture par feature** | Frontières explicites, domaine testable sans Flutter, règles métier (fréquences, séries, seuils) isolées et portables ; un agent peut travailler sur une feature sans charger le reste | Boilerplate réel : une simple lecture traverse 3 couches ; plus de fichiers | ✅ Oui |
| Clean Architecture par couche technique (`lib/domain/`, `lib/data/`, `lib/presentation/` globaux) | Même pureté du domaine, moins de dossiers au début | Ne passe pas l'échelle : à 6 US, chaque dossier mélange habitudes, tâches, résumé ; le contexte à charger pour une modification devient global | ❌ Non |
| MVVM/MVC simple (widget → service → base) sans couche domaine | Beaucoup moins de code, rapide au démarrage | Les règles métier (intervalle de jours, jours de semaine, taux de complétion, seuils) se retrouvent dans les widgets ou les services de données : intestables sans Flutter, et c'est exactement le cœur de valeur de cette app | ❌ Non |
| Feature-first « light » (domain + presentation, sans couche data séparée) | Compromis intermédiaire, moins de mapping | Le repository parlerait directement Drift : le domaine deviendrait dépendant du schéma de base, et un changement de stockage se propagerait partout | ❌ Non |

## Conséquences

**Positives :**
- Les règles métier du projet (fréquence par intervalle vs jours de semaine et leur exclusivité — US-001, retard d'une tâche — US-003, taux de complétion et seuils de couleur — US-005/US-006) vivent dans du Dart pur, testable en millisecondes sans émulateur. C'est décisif ici : le tooling iOS est distant et lent.
- La porte Android/desktop reste ouverte sans coût : seule la couche presentation est spécifique.
- Un changement de stockage (Drift → autre) n'impacte que `data/`.
- Frontières vérifiables mécaniquement (`grep 'package:flutter/' lib/features/*/domain/` doit être vide), donc opposables en revue.

**Négatives / compromis acceptés :**
- **Sur-ingénierie assumée pour la taille du projet.** Pour une app perso de 6 US, la clean architecture complète coûte plus de fichiers et de mapping DTO↔entité que nécessaire. Le choix est fait délibérément pour la lisibilité long terme et le travail assisté par agents, pas pour la vitesse de v0.
- Mitigation : **pas de use case anémique de confort**. On crée un use case quand il porte une intention métier, pas un passe-plat `GetAllHabits` qui ne ferait qu'appeler le repository — dans ce cas la lecture peut être exposée directement par le repository via le provider. La règle « tout passe par un use case » s'applique aux **écritures et aux calculs métier**, pas aux lectures triviales.
- Le mapping DTO ↔ entité est du code répétitif à écrire et à maintenir.

## Liens

- [Benchmark framework mobile — addendum 2026-08-09](../../benchmarks/benchmark-habit-tracker-ios-2026-08-09.md)
- [ADR-002 — Riverpod pour l'état et l'injection](ADR-002-riverpod-etat-injection.md)
- [ADR-003 — Drift pour la persistance locale](ADR-003-drift-persistance-locale.md)
- [CONVENTIONS.md](CONVENTIONS.md)
