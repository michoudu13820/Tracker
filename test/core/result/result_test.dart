// Tests du type Result : garantit le déballage par switch exhaustif (ADR-004).

import 'package:flutter_test/flutter_test.dart';
import 'package:habit_tracker/core/error/failure.dart';
import 'package:habit_tracker/core/result/result.dart';

void main() {
  group('Result', () {
    test('un Success porte sa valeur', () {
      const Result<int> result = Success<int>(42);

      final value = switch (result) {
        Success<int>(:final value) => value,
        Error<int>() => -1,
      };

      expect(value, 42);
    });

    test('un Error porte son Failure', () {
      const Result<int> result = Error<int>(NotFoundFailure('introuvable'));

      final message = switch (result) {
        Success<int>() => 'ok',
        Error<int>(:final failure) => failure.message,
      };

      expect(message, 'introuvable');
    });

    test('deux Success de même valeur ne sont pas confondus avec un Error', () {
      const Result<String> ok = Success<String>('a');
      const Result<String> ko = Error<String>(StorageFailure('boom'));

      expect(ok, isA<Success<String>>());
      expect(ko, isA<Error<String>>());
    });
  });
}
