// Couche core (base de données) : ouverture de la connexion SQLite locale.
//
// Seule brique Drift livrée au stade du scaffold : elle isole le choix du
// fichier et du moteur natif. La base applicative `AppDatabase` et ses tables
// arriveront avec la première User Story qui persiste une entité (ADR-003) —
// on ne crée pas de schéma tant qu'il n'y a rien à stocker.
//
// Rappel ADR-003 : les dates de complétion se stockent en JOUR CIVIL
// (`YYYY-MM-DD` ou entier), jamais en timestamp UTC, sous peine de décalage
// d'un jour au cochage tardif ou au changement d'heure.

import 'dart:io';

import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';

/// Ouvre la connexion à la base SQLite locale de l'application.
///
/// La connexion est paresseuse (`LazyDatabase`) : le fichier n'est résolu et
/// ouvert qu'au premier accès. Le moteur natif est chargé automatiquement par
/// `package:sqlite3` 3.x (aucune dépendance de lib native à déclarer, ADR-003).
///
/// [fileName] permet de nommer le fichier de base (utile pour cloisonner des
/// environnements) ; il est stocké dans le dossier « documents » de l'app.
QueryExecutor openAppDatabaseConnection({
  String fileName = 'habit_tracker.sqlite',
}) {
  return LazyDatabase(() async {
    final documentsDir = await getApplicationDocumentsDirectory();
    final file = File(p.join(documentsDir.path, fileName));
    return NativeDatabase.createInBackground(file);
  });
}
