// Couche core (erreurs) : hiérarchie scellée des échecs remontés à l'appelant.
//
// Toute couche basse convertit ses exceptions techniques en `Failure` typée
// (dans l'implémentation du repository, couche data) plutôt que de les laisser
// remonter : la presentation n'a ainsi jamais à connaître les exceptions de
// Drift ou du système de fichiers. Voir ADR-004.

/// Échec métier ou technique remonté à l'appelant, encapsulé dans un [Result].
///
/// `sealed` : le compilateur impose de traiter chaque variante dans un `switch`
/// exhaustif, si bien qu'un nouveau type d'échec oublié ne compile pas.
sealed class Failure {
  /// Construit un échec avec son [message] lisible et, optionnellement, la
  /// [cause] technique d'origine et sa [stackTrace] (utiles au diagnostic).
  const Failure(this.message, {this.cause, this.stackTrace});

  /// Message lisible décrivant l'échec (destiné au diagnostic, pas forcément à
  /// l'affichage direct : l'UI choisit son propre libellé selon la variante).
  final String message;

  /// Exception ou erreur technique à l'origine de l'échec, si elle existe.
  final Object? cause;

  /// Trace d'exécution associée à la [cause], si elle existe.
  final StackTrace? stackTrace;

  @override
  String toString() => '$runtimeType($message)';
}

/// Échec d'accès au stockage local : base indisponible, écriture refusée,
/// données corrompues. Produit par la couche data (Drift / système de fichiers).
final class StorageFailure extends Failure {
  /// Crée un [StorageFailure]. Voir [Failure] pour les paramètres.
  const StorageFailure(super.message, {super.cause, super.stackTrace});
}

/// Échec signalant qu'une entité demandée est introuvable (identifiant inconnu).
final class NotFoundFailure extends Failure {
  /// Crée un [NotFoundFailure]. Voir [Failure] pour les paramètres.
  const NotFoundFailure(super.message, {super.cause, super.stackTrace});
}

/// Échec de validation d'une règle métier ou d'un invariant en entrée
/// (fréquence incohérente, champ obligatoire manquant, seuil hors bornes).
final class ValidationFailure extends Failure {
  /// Crée un [ValidationFailure]. Voir [Failure] pour les paramètres.
  const ValidationFailure(super.message, {super.cause, super.stackTrace});
}

/// Échec inattendu : une exception a franchi une frontière sans être classée.
///
/// Sa présence signale un bug à corriger, pas un cas métier prévu. L'UI affiche
/// un message générique ; la [cause] et la [stackTrace] servent au diagnostic.
final class UnexpectedFailure extends Failure {
  /// Crée un [UnexpectedFailure]. Voir [Failure] pour les paramètres.
  const UnexpectedFailure(super.message, {super.cause, super.stackTrace});
}
