// Couche core (résultat) : type de retour des use cases et des repositories.
//
// Les use cases et repositories renvoient un `Result<T>` plutôt que de lancer
// une exception vers l'appelant. Traité par `switch` exhaustif, un cas d'erreur
// oublié ne compile pas. Zéro dépendance externe (pas de dartz/fpdart). ADR-004.

import 'package:habit_tracker/core/error/failure.dart';

/// Résultat d'une opération pouvant échouer : soit [Success], soit [Error].
///
/// `sealed` pour forcer le traitement exhaustif des deux variantes à la
/// compilation. Préférer un `switch` (expression) au déballage manuel.
sealed class Result<T> {
  /// Constructeur `const` de base, utilisé par les variantes scellées.
  const Result();
}

/// Variante de succès : porte la [value] produite par l'opération.
final class Success<T> extends Result<T> {
  /// Crée un succès portant [value].
  const Success(this.value);

  /// Valeur produite en cas de succès.
  final T value;
}

/// Variante d'échec : porte la [failure] décrivant la cause.
final class Error<T> extends Result<T> {
  /// Crée un échec portant [failure].
  const Error(this.failure);

  /// Échec typé décrivant la cause de l'erreur.
  final Failure failure;
}
