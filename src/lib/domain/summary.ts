import type { ColorThresholds, Habit, HabitCompletion, IsoDate, Task, TaskCompletion } from './types';
import { isDueOn } from './occurrences';
import { isHabitActive } from './habits';
import { isTaskDone, tasksOn } from './tasks';
import { addDays, addMonths, addYears, daysInMonth, startOfMonth, startOfWeek } from './dates';

export const DEFAULT_THRESHOLDS: ColorThresholds = { green: 80, yellow: 40 };

export type CellColor = 'green' | 'yellow' | 'red';

/**
 * Code couleur du résumé annuel (US-005 / US-006) à partir d'un pourcentage
 * de complétion et des seuils (par défaut vert >= 80, jaune >= 40, rouge sinon).
 */
export function colorFor(percent: number, thresholds: ColorThresholds = DEFAULT_THRESHOLDS): CellColor {
	if (percent >= thresholds.green) return 'green';
	if (percent >= thresholds.yellow) return 'yellow';
	return 'red';
}

/** Valide la cohérence des seuils (US-006, scénario 3). */
export function areThresholdsValid(t: ColorThresholds): boolean {
	const inRange = (n: number) => n >= 0 && n <= 100;
	return inRange(t.green) && inRange(t.yellow) && t.yellow < t.green;
}

/**
 * Agrégation pour le tableau résumé (US-005) : périodes (semaine/mois/année), cellules
 * d'habitude (binaire ou pourcentage) et indicateur de tâches par jour/mois. Fonctions pures,
 * sans dépendance au framework ni au stockage — consomment des tableaux déjà chargés par les
 * stores (`habitsStore`, `tasksStore`, `completionsStore`).
 */
export type SummaryPeriod = 'week' | 'month' | 'year';

/** Statut d'une cellule « habitude x jour » en vue semaine/mois (US-005 scénario 1/6). */
export type HabitCellStatus = 'done' | 'not-done' | 'not-due';

function isHabitDoneOn(completions: HabitCompletion[], habitId: string, date: IsoDate): boolean {
	return completions.some((c) => c.habitId === habitId && c.date === date && c.done);
}

/** Les 7 jours (lundi → dimanche) de la semaine calendaire contenant `reference`. */
export function weekDates(reference: IsoDate): IsoDate[] {
	const start = startOfWeek(reference);
	return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

/** Tous les jours du mois calendaire contenant `reference`. */
export function monthDates(reference: IsoDate): IsoDate[] {
	const [y, m] = reference.split('-').map(Number);
	const start = startOfMonth(reference);
	return Array.from({ length: daysInMonth(y, m) }, (_, i) => addDays(start, i));
}

/** Les 12 mois de l'année civile contenant `reference` (US-005 scénario 3). */
export function yearMonths(reference: IsoDate): { year: number; month: number }[] {
	const year = Number(reference.split('-')[0]);
	return Array.from({ length: 12 }, (_, i) => ({ year, month: i + 1 }));
}

/**
 * Statut binaire d'une cellule « habitude x jour » (vues semaine/mois, US-005 scénario 1) :
 * `'not-due'` si l'habitude n'était pas prévue ce jour-là (cellule neutre, scénario 6),
 * `'done'`/`'not-done'` sinon selon l'historique de complétion.
 */
export function habitCellStatus(
	habit: Habit,
	date: IsoDate,
	completions: HabitCompletion[]
): HabitCellStatus {
	if (!isDueOn(habit, date)) return 'not-due';
	return isHabitDoneOn(completions, habit.id, date) ? 'done' : 'not-done';
}

/**
 * État d'une cellule « habitude x jour » dans le langage à trois symboles du résumé (US-035) :
 * `'done'` ✅, `'todo'` ⬜, `'missed'` ❌ et `'not-due'` (cellule neutre et vide).
 *
 * Extension du `HabitCellStatus` binaire d'US-005, à laquelle s'ajoutent **un axe temporel** et
 * **deux garde-fous** — c'est tout ce qui distingue `'todo'` de `'missed'` :
 * - axe temporel : un jour n'est « écoulé » qu'à partir du lendemain, donc **aujourd'hui reste
 *   `'todo'` toute la journée**, y compris en soirée (scénario 3) ;
 * - garde-fou « antériorité » : jamais de `'missed'` avant `createdAt`, l'habitude n'existait
 *   pas encore (scénario 7) ;
 * - garde-fou « statut » : jamais de `'missed'` pour une habitude en pause (US-015) ou
 *   supprimée (US-013) — ses complétions réelles restent affichées en `'done'` (scénario 8).
 */
export type HabitCellState = 'done' | 'todo' | 'missed' | 'not-due';

/** Libellés français des états de cellule, restitués aux lecteurs d'écran (US-035 scénario 13) :
 * le symbole graphique n'est jamais la seule information portée par la cellule. */
export const CELL_STATE_LABELS: Record<HabitCellState, string> = {
	done: 'fait',
	todo: 'à faire',
	missed: 'manqué',
	'not-due': 'non prévu'
};

/**
 * État d'une cellule « habitude x jour » pour les vues semaine et mois (US-035). L'ordre des
 * règles est significatif : une complétion réellement enregistrée l'emporte toujours (scénarios
 * 1/8), puis les deux garde-fous neutralisent le `'missed'`, puis l'axe temporel tranche entre
 * `'todo'` et `'missed'`.
 *
 * @param today jour courant réel (injecté pour rester pur et testable)
 */
export function habitCellState(
	habit: Habit,
	date: IsoDate,
	completions: HabitCompletion[],
	today: IsoDate
): HabitCellState {
	// Dérivé du statut binaire d'US-005 (lui-même déjà compatible cible chiffrée, US-019
	// scénario 9) : cette US n'ajoute que la qualification du « non fait ».
	const status = habitCellStatus(habit, date, completions);
	if (status === 'not-due') return 'not-due'; // scénario 5
	if (status === 'done') return 'done'; // scénarios 1/8 : l'historique réel l'emporte
	if (!isHabitActive(habit)) return 'not-due'; // scénario 8 : ni ❌, ni injonction ⬜
	if (date < habit.createdAt) return 'not-due'; // scénario 7
	if (date >= today) return 'todo'; // scénarios 2/3/6 : la journée n'est écoulée que demain
	return 'missed'; // scénario 4
}

/**
 * État de lecture de la cellule « Tâches » d'un jour (US-035 scénario 12) : la valeur affichée
 * reste le **pourcentage** (plus informatif qu'un état binaire, décision PO), mais la cellule
 * adopte le même code à trois états en traitement de fond. `null` (aucune tâche ce jour-là)
 * reste neutre, comme aujourd'hui.
 */
export function taskDayState(
	percent: number | null,
	date: IsoDate,
	today: IsoDate
): HabitCellState {
	if (percent === null) return 'not-due';
	if (percent >= 100) return 'done';
	if (date >= today) return 'todo';
	return 'missed';
}

/**
 * Pourcentage de complétion d'une habitude sur un mois donné (vue année, US-005 scénario 3) :
 * jours cochés / jours dus ce mois-là. `null` si aucune occurrence prévue ce mois (cellule
 * neutre, scénario 6bis), pour ne pas confondre avec un taux de 0 %.
 */
export function habitMonthPercent(
	habit: Habit,
	year: number,
	month: number,
	completions: HabitCompletion[]
): number | null {
	const monthKey = String(month).padStart(2, '0');
	let due = 0;
	let done = 0;
	for (let day = 1; day <= daysInMonth(year, month); day++) {
		const date = `${year}-${monthKey}-${String(day).padStart(2, '0')}`;
		if (!isDueOn(habit, date)) continue;
		due++;
		if (isHabitDoneOn(completions, habit.id, date)) done++;
	}
	if (due === 0) return null;
	return Math.round((done / due) * 100);
}

/**
 * Pourcentage de tâches ponctuelles validées un jour donné (US-005 scénario 4). `null` si
 * aucune tâche programmée ce jour (scénario 5, à afficher comme "—", pas comme 0 %).
 */
export function taskDayPercent(
	tasks: Task[],
	completions: TaskCompletion[],
	date: IsoDate
): number | null {
	const dayTasks = tasksOn(tasks, date);
	if (dayTasks.length === 0) return null;
	const done = dayTasks.filter((t) => isTaskDone(completions, t.id)).length;
	return Math.round((done / dayTasks.length) * 100);
}

/**
 * Pourcentage de tâches ponctuelles validées sur un mois donné (US-005 scénario 4bis). `null`
 * si aucune tâche programmée ce mois (scénario 5, appliqué au mois en vue année).
 */
export function taskMonthPercent(
	tasks: Task[],
	completions: TaskCompletion[],
	year: number,
	month: number
): number | null {
	const prefix = `${year}-${String(month).padStart(2, '0')}-`;
	const monthTasks = tasks.filter((t) => t.date.startsWith(prefix));
	if (monthTasks.length === 0) return null;
	const done = monthTasks.filter((t) => isTaskDone(completions, t.id)).length;
	return Math.round((done / monthTasks.length) * 100);
}

/** Déplace la date de référence d'une période (US-005 scénario 7 — navigation précédent/suivant). */
export function shiftReference(period: SummaryPeriod, reference: IsoDate, direction: 1 | -1): IsoDate {
	if (period === 'week') return addDays(reference, 7 * direction);
	if (period === 'month') return addMonths(startOfMonth(reference), direction);
	return addYears(reference, direction);
}
