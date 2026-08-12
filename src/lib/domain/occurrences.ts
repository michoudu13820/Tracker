import type { Habit, IsoDate, Weekday } from './types';
import { daysBetween, fromIsoDate } from './dates';
import { isHabitActive } from './habits';

/**
 * Cœur métier : une habitude est-elle prévue un jour donné selon sa fréquence ?
 * Fonction pure et testable, utilisée par le planning (US-004), le résumé (US-005)
 * et le calcul des rappels (US-007). Ne dépend ni du framework ni du stockage.
 */
export function isDueOn(habit: Habit, date: IsoDate): boolean {
	const { frequency } = habit;

	if (frequency.kind === 'weekdays') {
		const weekday = fromIsoDate(date).getDay() as Weekday;
		return frequency.weekdays.includes(weekday);
	}

	// interval : due si (date - anchor) est un multiple positif de `days`.
	const delta = daysBetween(frequency.anchor, date);
	if (delta < 0) return false;
	return delta % frequency.days === 0;
}

/**
 * Liste les habitudes prévues un jour donné, pour le planning (US-004). N'inclut que les
 * habitudes actives : une habitude en pause (US-015) ou supprimée (US-013) n'apparaît plus
 * dans le planning, quel que soit le jour consulté, même si elle serait due selon sa fréquence.
 */
export function habitsDueOn(habits: Habit[], date: IsoDate): Habit[] {
	return habits.filter((h) => isHabitActive(h) && isDueOn(h, date));
}
