import type { Habit, HabitCompletion, IsoDate } from './types';
import { addDays, startOfMonth } from './dates';
import { isDueOn } from './occurrences';

/**
 * Indicateur de régularité **apaisé** d'une habitude (US-024) : jamais de mécanique de streak
 * (compteur de jours d'affilée, record personnel, notion de série rompue — arbitrage produit
 * explicite du 2026-08-12, à ne jamais réintroduire même sous une autre forme). Fonctions
 * pures, calculées à partir de l'historique de complétion déjà produit par US-004/US-005.
 */

/** Statut d'un jour dans la fenêtre de régularité (US-024 scénario 4) : `not-due` (non
 * concerné, distinct visuellement d'un jour manqué) est déterminé par la fréquence de
 * l'habitude à cette date-là, indépendamment de son statut actif/en pause courant. */
export type DayRegularityStatus = 'done' | 'missed' | 'not-due';

export interface DayRegularity {
	date: IsoDate;
	status: DayRegularityStatus;
}

/**
 * Régularité des `windowDays` derniers jours (défaut 7, US-024 scénario 1), `today` inclus,
 * en ordre chronologique croissant (le plus ancien en premier). Chaque jour est soit `done`
 * (faite), `missed` (due mais non faite) ou `not-due` (non concernée ce jour-là, scénario 4).
 */
export function last7DaysRegularity(
	habit: Habit,
	completions: HabitCompletion[],
	today: IsoDate,
	windowDays = 7
): DayRegularity[] {
	const days: DayRegularity[] = [];
	for (let offset = windowDays - 1; offset >= 0; offset--) {
		const date = addDays(today, -offset);
		if (!isDueOn(habit, date)) {
			days.push({ date, status: 'not-due' });
			continue;
		}
		const done = completions.some((c) => c.habitId === habit.id && c.date === date && c.done);
		days.push({ date, status: done ? 'done' : 'missed' });
	}
	return days;
}

/**
 * Signal doux « manquée hier » (US-025) : vrai seulement si l'habitude était due **hier**
 * (par rapport à `today`) et n'a pas été cochée faite ce jour-là. Ne porte jamais que sur
 * l'occurrence d'hier — aucun cumul, aucun historique plus ancien (scénario 4), et n'implique
 * aucune reprogrammation (scénario 5) : une habitude reste récurrente selon sa fréquence.
 */
export function missedYesterday(habit: Habit, completions: HabitCompletion[], today: IsoDate): boolean {
	const yesterday = addDays(today, -1);
	if (!isDueOn(habit, yesterday)) return false;
	return !completions.some((c) => c.habitId === habit.id && c.date === yesterday && c.done);
}

/**
 * Nombre de fois où l'habitude a été faite depuis le 1er du mois courant, `today` inclus
 * (US-024 scénario 2) — un simple compteur neutre, jamais présenté comme une série.
 */
export function monthlyCompletionCount(
	habit: Habit,
	completions: HabitCompletion[],
	today: IsoDate
): number {
	const monthStart = startOfMonth(today);
	return completions.filter(
		(c) => c.habitId === habit.id && c.done && c.date >= monthStart && c.date <= today
	).length;
}
