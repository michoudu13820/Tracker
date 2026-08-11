// Couche core (injection) : composition root des dépendances partagées.
//
// Riverpod sert à la fois d'état de présentation et de conteneur d'injection
// (ADR-002). Les providers déclarés ici câblent les implémentations concrètes ;
// les tests les substituent via `ProviderContainer(overrides: [...])`.
// Les providers propres à une feature vivent dans sa couche presentation ;
// seuls les câblages transverses (horloge, base, scheduler) remontent ici.

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:habit_tracker/core/utils/clock.dart';

/// Horloge injectée dans tout le domaine (ADR-002 + ADR-004).
///
/// Fournit [SystemClock] en production ; les tests surchargent ce provider par
/// une horloge figée pour rendre déterministes les règles de dates.
final Provider<Clock> clockProvider = Provider<Clock>(
  (ref) => const SystemClock(),
);
