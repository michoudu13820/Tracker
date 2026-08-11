---
type: adr
numero: 003
titre: Drift (SQLite) pour la persistance locale
date: 2026-08-09
auteur: flutter-architect
statut: accepté
remplace: —
---

# ADR-003 — Drift (SQLite) pour la persistance locale

## Contexte

Le projet est **strictement local, sans backend et sans synchronisation** (contrainte v0 du benchmark). Les données à persister :

- habitudes (nom, emoji, fréquence par intervalle de jours **ou** par jours de semaine) — US-001 ;
- tâches ponctuelles avec échéance — US-002/US-003 ;
- **complétions journalières** (une ligne par habitude/tâche et par jour coché) — US-004 ;
- préférences (seuils de couleur du résumé) — US-006.

Le besoin discriminant est **US-005** : un résumé en tableau sur une période (mois, année) avec un taux de complétion par habitude et par période. C'est une **agrégation sur un historique qui grossit indéfiniment** (une entrée par habitude et par jour : ~365 lignes/an/habitude).

## Décision

La persistance locale utilise **Drift** (surcouche typée de SQLite, avec génération de code).

- Le schéma (tables, migrations) vit dans `lib/core/database/` ; les requêtes propres à une feature dans `features/<feature>/data/datasources/`.
- Les agrégations de US-005 sont écrites en **SQL** (`GROUP BY` sur la période), pas en Dart après chargement complet de l'historique.
- Les migrations de schéma sont **versionnées et testées** dès la première évolution (`schemaVersion` + `MigrationStrategy`).
- Drift reste confiné à `data/` et `core/database/` : **aucun type Drift généré n'apparaît dans `domain/` ni dans `presentation/`** — la datasource renvoie des DTO, le repository mappe vers les entités.

## Alternatives considérées

| Option | Avantages | Inconvénients | Retenue ? |
|--------|-----------|---------------|-----------|
| **Drift** | SQL typé vérifié à la compilation ; agrégations `GROUP BY` natives pour US-005 sans charger l'historique en mémoire ; migrations outillées et testables ; activement maintenu ; `NativeDatabase.memory()` rend les tests de data rapides et sans mock | Génération de code (`build_runner`) à relancer ; nécessite de connaître SQL | ✅ Oui |
| Isar | API 100 % Dart, très rapide, pas de SQL | La v4 est en beta prolongée et la maintenance du projet est incertaine — rédhibitoire pour une app censée durer avec un seul mainteneur ; agrégations par période à écrire en Dart, donc historique chargé en mémoire | ❌ Non |
| sqflite brut | Dépendance minimale, zéro codegen, aligné avec la priorité « app légère » | SQL en chaînes non vérifiées, mapping manuel, migrations à la main : plus de code non typé à tester, exactement là où les bugs silencieux coûtent cher (historique) | ❌ Non |
| `shared_preferences` + JSON | Trivial à mettre en place | S'effondre dès que l'historique grossit : relecture/réécriture intégrale du fichier à chaque cochage, aucune requête par période | ❌ Non (sauf pour les seuils de US-006, voir ci-dessous) |

## Conséquences

**Positives :**
- US-005 reste performante quelle que soit la taille de l'historique : le calcul du taux de complétion se fait en base.
- Les tests de la couche data tournent sur une base SQLite **en mémoire**, donc sans émulateur ni mock de stockage.
- Les migrations sont un problème traité explicitement plutôt que découvert en production (perte de données réelle sur une app perso non synchronisée = irrécupérable).

**Négatives / compromis acceptés :**
- **`build_runner` entre dans le cycle** : toute modification de schéma impose `dart run build_runner build --delete-conflicting-outputs` avant que le projet compile. C'est intégré comme étape du quality gate.
- Poids et complexité supérieurs à `shared_preferences`, contre la priorité « app légère » du benchmark — accepté parce que le besoin d'agrégation de US-005 est structurel, pas accessoire.
- **Exception assumée** : les seuils de couleur (US-006), qui sont deux scalaires, peuvent vivre dans `shared_preferences` plutôt que dans une table dédiée. La frontière reste la même : un `SettingsRepository` du domaine, dont l'implémentation choisit son stockage.

## Points de vigilance

- **Stocker les dates de complétion comme jour civil** (`YYYY-MM-DD` ou entier), jamais comme timestamp UTC : sinon un cochage à 23 h ou un changement d'heure d'été déplace une complétion d'un jour et fausse les séries et le résumé annuel. Voir ADR-004.
- Indexer la colonne de date de complétion : c'est la colonne d'agrégation de US-005.

## Liens

- [ADR-001 — Flutter + Clean Architecture](ADR-001-flutter-clean-architecture.md)
- [ADR-004 — Result/Failure et horloge injectée](ADR-004-result-failure-horloge-injectee.md)
- [US-005 — Résumé « Habit tracker » en tableau sur une période](../../US/to_be_implemented/US-005-resume-habit-tracker-tableau-periode.md)
