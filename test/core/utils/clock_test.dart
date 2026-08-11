// Tests de l'horloge injectable : démontre la substitution en test (ADR-004).

import 'package:flutter_test/flutter_test.dart';
import 'package:habit_tracker/core/utils/clock.dart';

/// Horloge figée : illustration du pattern que les use cases de dates
/// utiliseront pour rendre leurs règles déterministes.
final class _FixedClock implements Clock {
  const _FixedClock(this._instant);

  final DateTime _instant;

  @override
  DateTime now() => _instant;
}

void main() {
  group('Clock', () {
    test('SystemClock renvoie un instant proche de l\'horloge murale', () {
      const clock = SystemClock();

      final before = DateTime.now();
      final observed = clock.now();
      final after = DateTime.now();

      expect(
        observed.isBefore(before.subtract(const Duration(seconds: 1))),
        isFalse,
      );
      expect(observed.isAfter(after.add(const Duration(seconds: 1))), isFalse);
    });

    test('une horloge figée renvoie toujours le même instant', () {
      // Cochage tardif le soir : le cas exact que l'horloge injectée rend
      // testable sans dépendre de l'heure d'exécution réelle.
      final frozen = DateTime(2026, 8, 9, 23, 30);
      final Clock clock = _FixedClock(frozen);

      expect(clock.now(), frozen);
      expect(clock.now(), clock.now());
    });
  });
}
