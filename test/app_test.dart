// Test de fumée de la coquille applicative : monte l'app sous ProviderScope.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:habit_tracker/main.dart';

void main() {
  testWidgets('la coquille se monte et affiche son titre', (tester) async {
    await tester.pumpWidget(const ProviderScope(child: HabitTrackerApp()));

    expect(find.text('Habit Tracker'), findsOneWidget);
    expect(find.byType(Scaffold), findsOneWidget);
  });
}
