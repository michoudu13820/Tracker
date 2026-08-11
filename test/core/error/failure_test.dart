// Tests de la hiérarchie Failure : variantes scellées et champs de diagnostic.

import 'package:flutter_test/flutter_test.dart';
import 'package:habit_tracker/core/error/failure.dart';

void main() {
  group('Failure', () {
    test('chaque variante conserve son message', () {
      const failures = <Failure>[
        StorageFailure('stockage'),
        NotFoundFailure('absent'),
        ValidationFailure('invalide'),
        UnexpectedFailure('inattendu'),
      ];

      expect(failures.map((f) => f.message), [
        'stockage',
        'absent',
        'invalide',
        'inattendu',
      ]);
    });

    test('conserve la cause et la stack trace techniques quand fournies', () {
      final cause = Exception('sqlite indisponible');
      final trace = StackTrace.current;

      final failure = StorageFailure('boom', cause: cause, stackTrace: trace);

      expect(failure.cause, same(cause));
      expect(failure.stackTrace, same(trace));
    });

    test('un switch exhaustif couvre toutes les variantes', () {
      String label(Failure failure) => switch (failure) {
        StorageFailure() => 'storage',
        NotFoundFailure() => 'not_found',
        ValidationFailure() => 'validation',
        UnexpectedFailure() => 'unexpected',
      };

      expect(label(const NotFoundFailure('x')), 'not_found');
    });
  });
}
