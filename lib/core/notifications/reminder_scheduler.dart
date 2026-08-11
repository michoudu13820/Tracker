// Couche core (notifications) : PORT d'infrastructure des rappels locaux.
//
// INTERFACE UNIQUEMENT à ce stade (ADR-005, statut « proposé »). Aucune US du
// backlog courant (US-001..US-006) ne couvre les rappels : l'implémentation
// (plugin `flutter_local_notifications` + `timezone`, fenêtre glissante) ne
// sera écrite qu'avec l'US de rappels, pour éviter le scope creep. Ce port
// existe pour figer dès maintenant la frontière : la DÉCISION métier « quelles
// échéances programmer, dans quel ordre » est un use case du domaine testable
// sur Windows ; seule la PROGRAMMATION effective, derrière ce port, exige un
// iPhone.

import 'package:habit_tracker/core/result/result.dart';

/// Statut de l'autorisation d'envoyer des notifications locales.
///
/// La permission refusée est un état de premier ordre de l'app (écran
/// d'explication + lien vers les Réglages), pas un échec silencieux (ADR-005).
enum ReminderPermission {
  /// L'utilisateur a autorisé les notifications.
  granted,

  /// L'utilisateur a refusé les notifications.
  denied,

  /// L'utilisateur n'a pas encore été sollicité.
  notDetermined,
}

/// Rappel unitaire à programmer, tel que produit par le domaine.
///
/// Contrat minimal du port : le domaine décide de la liste, l'infrastructure la
/// programme. [scheduledFor] est un instant local (heure de déclenchement) et
/// non un jour civil : c'est le seul endroit où le temps porte une heure.
final class PendingReminder {
  /// Crée un rappel à programmer.
  const PendingReminder({
    required this.id,
    required this.title,
    required this.body,
    required this.scheduledFor,
  });

  /// Identifiant stable du rappel, pour pouvoir le remplacer ou l'annuler.
  final String id;

  /// Titre affiché dans la notification.
  final String title;

  /// Corps du message affiché dans la notification.
  final String body;

  /// Instant local de déclenchement souhaité.
  final DateTime scheduledFor;
}

/// Port de programmation des rappels locaux (ADR-005).
///
/// Le domaine ne connaît que cette interface ; l'implémentation concrète vit
/// hors du domaine et reste substituable en test. La stratégie de « fenêtre
/// glissante » (ne jamais dépasser la limite iOS de 64, reprogrammer les 7 à 14
/// prochains jours à chaque lancement) est portée par [replaceScheduled] :
/// l'appelant fournit l'ensemble courant des rappels, l'implémentation remplace
/// intégralement la programmation précédente.
abstract interface class ReminderScheduler {
  /// S'assure de disposer de l'autorisation et renvoie son statut courant.
  Future<Result<ReminderPermission>> ensurePermission();

  /// Remplace l'intégralité des rappels programmés par [reminders].
  ///
  /// Sémantique « tout ou rien » adaptée à la fenêtre glissante : l'ancienne
  /// programmation est annulée, la nouvelle prend sa place.
  Future<Result<void>> replaceScheduled(List<PendingReminder> reminders);

  /// Annule tous les rappels programmés.
  Future<Result<void>> cancelAll();
}
