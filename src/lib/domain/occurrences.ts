import type { Habit, IsoDate, MonthDay, Weekday } from './types';
import { daysBetween, daysInMonth, fromIsoDate } from './dates';
import { isHabitActive } from './habits';

/**
 * Quantièmes réellement occupés par une fréquence « jours du mois » (US-032) sur un mois donné,
 * en ordre croissant et **sans doublon**. Applique les deux règles produit tranchées :
 *
 * - **repli** (scénarios 6/8) : un quantième absent du mois (31 en avril, 29/30/31 en février)
 *   se replie sur le dernier jour du mois — jamais de mois sans occurrence ;
 * - **déduplication** (scénario 7) : plusieurs quantièmes repliés sur la même date ne produisent
 *   qu'une seule occurrence (30 et 31 → un seul 28 février en année non bissextile).
 *
 * @param month mois civil 1-12
 */
export function resolveMonthDays(monthdays: MonthDay[], year: number, month: number): MonthDay[] {
	const lastDay = daysInMonth(year, month);
	const resolved = new Set<MonthDay>();
	for (const day of monthdays) {
		if (day < 1) continue; // garde-fou : valeur hors bornes ignorée (jamais produite par l'UI).
		resolved.add(Math.min(day, lastDay));
	}
	return [...resolved].sort((a, b) => a - b);
}

/**
 * Cœur métier : une habitude est-elle prévue un jour donné selon sa fréquence ?
 * Fonction pure et testable, utilisée par le planning (US-004), le résumé (US-005),
 * la régularité (US-024/US-025), les rappels (US-007) et le badge (US-031) — point unique
 * qui rend le mode « jours du mois » (US-032) cohérent partout (US-033). Ne dépend ni du
 * framework ni du stockage.
 */
export function isDueOn(habit: Habit, date: IsoDate): boolean {
	const { frequency } = habit;

	if (frequency.kind === 'weekdays') {
		const weekday = fromIsoDate(date).getDay() as Weekday;
		return frequency.weekdays.includes(weekday);
	}

	if (frequency.kind === 'monthdays') {
		const [year, month, day] = date.split('-').map(Number);
		return resolveMonthDays(frequency.monthdays, year, month).includes(day);
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
