// Point d'entrée de l'application : monte le conteneur Riverpod et la coquille UI.
//
// Aucune feature ni écran métier ici : ce n'est que la coquille bootstrap du
// scaffold. Les écrans arriveront par les User Stories, dans
// `features/<f>/presentation/`. Le `ProviderScope` est le composition root
// runtime de Riverpod (ADR-002).

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Démarre l'application dans son conteneur d'injection Riverpod.
void main() {
  runApp(const ProviderScope(child: HabitTrackerApp()));
}

/// Coquille applicative : thème et point d'accroche de la navigation.
class HabitTrackerApp extends StatelessWidget {
  /// Crée la coquille de l'application Habit Tracker.
  const HabitTrackerApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Habit Tracker',
      theme: ThemeData(useMaterial3: true, colorSchemeSeed: Colors.indigo),
      home: const _BootstrapPage(),
    );
  }
}

/// Écran placeholder temporaire, remplacé par le planning quotidien (US-004).
class _BootstrapPage extends StatelessWidget {
  const _BootstrapPage();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Habit Tracker')),
      body: const Center(
        child: Text('Socle prêt. Les écrans arrivent avec les User Stories.'),
      ),
    );
  }
}
