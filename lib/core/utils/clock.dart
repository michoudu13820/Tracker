// Couche core (temps) : horloge injectable, seule source autorisée de l'instant.
//
// Le domaine ne doit JAMAIS appeler `DateTime.now()` : ses règles de dates
// (retard, série, taux de complétion) deviendraient non déterministes à tester.
// Toute classe ayant besoin de l'instant présent reçoit une `Clock` par
// constructeur ; les tests injectent une horloge figée. Voir ADR-004.

/// Fournit l'instant présent de façon injectable.
///
/// Le composition root fournit [SystemClock] ; les tests fournissent une
/// implémentation figée pour rendre déterministes les règles de dates.
abstract interface class Clock {
  /// Renvoie l'instant présent.
  DateTime now();
}

/// Implémentation par défaut, adossée à l'horloge système du device.
///
/// C'est le seul endroit du code applicatif qui a le droit d'appeler
/// `DateTime.now()` : il s'agit d'une frontière d'infrastructure, pas de métier.
final class SystemClock implements Clock {
  /// Crée l'horloge système.
  const SystemClock();

  @override
  DateTime now() => DateTime.now();
}
