# CONVENTIONS — Habit Tracker (Flutter)

**Pense-bête condensé. C'est la lecture par défaut avant de coder.** Il suffit dans la quasi-totalité des cas. Ne va lire un ADR complet (`ADR-*.md`) que si un point précis n'est pas couvert ici.

Stack actée : **Flutter** + **Clean Architecture par feature** (ADR-001) + **Riverpod** (ADR-002) + **Drift** (ADR-003) + **`Result`/`Failure` et horloge injectée** (ADR-004).

---

## 1. Où mettre le code — arbre de décision

| Je veux écrire… | Ça va dans | Contrainte |
|---|---|---|
| Une règle métier (fréquence, retard, taux, série, seuil) | `features/<f>/domain/` | **Zéro import Flutter** |
| Un objet métier immuable (Habit, Task, Completion) | `domain/entities/` | `final`, `copyWith`, `==`/`hashCode` |
| Un type contraint (CivilDate, HabitFrequency, CompletionRate) | `domain/value_objects/` | Valide ses invariants à la construction |
| Le contrat d'accès aux données | `domain/repositories/` | **Interface abstraite uniquement** |
| Une intention métier (créer, reprogrammer, calculer) | `domain/usecases/` | 1 classe = 1 intention, retourne `Result<T>` |
| Une table, une migration, le schéma | `core/database/` | Drift confiné ici + `data/` |
| Une requête SQL propre à une feature | `data/datasources/` | Accès brut, aucune règle métier |
| Le mapping stockage ↔ métier | `data/models/` + `data/repositories/` | Le DTO ne sort **jamais** de `data/` |
| L'état d'un écran | `presentation/state/` | `Notifier`/`AsyncNotifier`, zéro règle métier |
| Un écran routé | `presentation/pages/` | |
| Un widget réutilisable de la feature | `presentation/widgets/` | |
| Un widget réutilisé par ≥ 2 features | `core/theme/` ou `core/widgets/` | |
| Le câblage des dépendances | `core/di/` | Composition root, pas de singleton global |

**Règle de dépendance :** `presentation → domain ← data`. Contrôle mécanique : `grep 'package:flutter/' lib/features/*/domain/` doit être **vide**, et `presentation/` ne doit **jamais** importer `data/`.

**Exception utile (ADR-001) :** pas de use case passe-plat. Une lecture triviale (`getAllHabits`) peut être exposée directement par le repository via un provider. La règle « tout passe par un use case » vaut pour les **écritures et les calculs métier**.

---

## 2. Arborescence

```
lib/
  core/
    database/          # schéma Drift, migrations
    di/                # providers de dépendances (composition root)
    error/             # sealed class Failure
    result/            # sealed class Result<T>
    theme/             # couleurs, typographies, widgets partagés
    utils/             # helpers purs
  features/
    habits/ | tasks/ | planning/ | summary/ | settings/
      domain/    { entities, value_objects, repositories, usecases }
      data/      { models, datasources, repositories }
      presentation/ { state, pages, widgets }
  main.dart
test/                  # miroir exact de lib/
integration_test/      # parcours critiques uniquement
```

---

## 3. Nommage

- **Identifiants en anglais**, **commentaires et dartdoc en français**. En cas de doute, aligne-toi sur le code existant.
- Use case : `CreateHabit`, `RescheduleOverdueTask`, `ComputeCompletionRate` — verbe + objet. Jamais `HabitService`, `HabitManager`, `handle()`.
- Méthode : intention explicite → `markHabitAsCompletedForDay()`, `rescheduleTaskTo()`, `computeCurrentStreak()`. Interdits : `handle`, `process`, `run`, `doIt`, `data` sans complément.
- Booléen : `isOverdue`, `hasReachedThreshold`, `canBeRescheduled`.
- Classes : `HabitRepository` (interface) / `HabitRepositoryImpl` (impl) / `HabitLocalDataSource` / `HabitModel` (DTO) / `Habit` (entité) / `DailyPlanningPage` / `HabitSummaryTable`.
- Fichiers : `snake_case.dart`, miroir du nom de classe (`create_habit.dart`).
- Test : nommé d'après le **comportement attendu**, pas la méthode appelée.
- Pas d'abréviations (`hab`, `cfg`, `usr`), pas de `Helper`/`Utils` sur une classe métier.

---

## 4. Documentation du code (exigence forte)

1. **En-tête de fichier** : une ligne disant la couche et la responsabilité unique.
2. **Dartdoc `///` sur tout élément public** : classe, méthode, champ, use case, entité. Elle explique le **pourquoi et le rôle**, pas la traduction du code. Pour un use case : intention métier, règles appliquées, `Failure` possibles.
3. **Commentaire inline `//`** sur les blocs non évidents : règle métier, cas limite, contournement de plateforme. Explique le **pourquoi**.
4. **Zéro commentaire mensonger** : si tu modifies du code, tu mets à jour son commentaire dans la même passe.

---

## 5. Erreurs et temps (ADR-004)

- Use cases et repositories retournent **`Result<T>`**, jamais une exception vers l'appelant.
- La conversion exception technique → **`Failure`** typée se fait dans l'implémentation du repository (couche data).
- Traite les `Result`/`Failure` par `switch` exhaustif : un cas oublié ne compile pas.
- **Jamais de `DateTime.now()` dans le domaine.** L'horloge est injectée par constructeur ; les tests la figent.
- Le « jour » métier est un **`CivilDate`** (année/mois/jour, sans heure ni fuseau). Complétions, échéances et périodes s'expriment en `CivilDate`. Conversion `DateTime` ↔ `CivilDate` **aux frontières uniquement**.
- En base, une date de complétion se stocke en **jour civil** (`YYYY-MM-DD` ou entier), jamais en timestamp UTC.

---

## 6. Flutter / UI

- `StatelessWidget` par défaut, `const` dès que possible.
- **Aucun appel base/réseau ni règle métier dans un `build()`.**
- Découpe en **sous-widgets nommés**, pas en méthodes `_buildXxx()`.
- Les widgets consomment l'état via `ref.watch` ; ils ne calculent rien.
- Tout écran gère explicitement ses **quatre états** : chargement, vide, erreur, nominal.
- `Key` explicite sur les éléments interactifs qui seront testés.
- Vérifie `mounted` avant toute mise à jour d'état après un `await`.

---

## 7. Tests

Pyramide : **domaine (le gros du volume) → data → widgets → integration_test (parcours critiques seulement)**.

- Un `group()` par critère d'acceptation de l'US, un `test()` par cas Given/When/Then.
- Domaine : tests purs, sans Flutter, repository en fake/mock (`mocktail`).
- Data : base Drift **en mémoire** (`NativeDatabase.memory()`), pas de mock de SQLite.
- Presentation : `ProviderContainer(overrides: […])` pour injecter des fakes ; `testWidgets` pour le rendu et les interactions.
- Couvre le nominal **et** les cas limites de l'US, et vérifie explicitement les `Failure` attendues.

---

## 8. Dépendances

Actées : `flutter_riverpod`, `drift` + `path`/`path_provider` + `drift_dev`/`build_runner`, `mocktail` (dev), `flutter_lints`.

> **Note packaging (maj scaffold) :** `sqlite3_flutter_libs` n'est **plus** une dépendance. Depuis Drift 2.32 avec `sqlite3` 3.x, la lib SQLite native est embarquée automatiquement (build hooks) ; le package est passé EOL. Ne pas le réintroduire. Drift reste le choix acté (ADR-003) : seul le mécanisme d'embarquement natif a changé côté upstream.

- Toute **nouvelle** dépendance doit être justifiée dans le résumé d'implémentation de l'US.
- Pas de package pour ce que Dart ou Flutter fait déjà (`Result`/`Failure` sont maison, cf. ADR-004).
- **Navigation** : `Navigator` standard en v0 (le périmètre tient en ~5 écrans). Passer à `go_router` seulement si deep links ou restauration d'état deviennent nécessaires — et tracer la bascule par un ADR.

---

## 9. Quality gate (bloquant avant `US/done/`)

`flutter pub get` → `dart run build_runner build --delete-conflicting-outputs` (si le schéma a changé) → `dart format --output=none --set-exit-if-changed .` → `flutter analyze` → `flutter test --reporter=compact` → build.

Détail et règles de sobriété de sortie : skill `flutter-quality-gate`.

---

## 10. Pièges spécifiques à ce projet

- **Décalage d'un jour** : le bug le plus probable ici. Cochage tardif le soir, changement d'heure d'été, dernier jour du mois → tester ces trois cas sur toute règle de date.
- **Exclusivité des modes de fréquence** (US-001) : intervalle en jours **XOR** jours de semaine. À modéliser par une `sealed class HabitFrequency` (`IntervalFrequency` / `WeekdaysFrequency`), pas par deux champs nullables — l'état invalide devient alors inexprimable.
- **Emoji** : saisie libre, aucune liste fermée (US-001). Attention au comptage de caractères — un emoji peut occuper plusieurs unités UTF-16 ; raisonner en `characters` (graphèmes).
- **Historique immuable** : éditer une habitude ne doit **jamais** modifier les jours déjà cochés (US-001, scénario 6).
- **Agrégations de US-005 en SQL**, pas en Dart après chargement complet de l'historique.
- **Développement sur émulateur Android**, cible réelle iPhone : tout comportement spécifique iOS (notifications, permissions) n'est validable que via le pipeline CI → AltStore.
