import { describe, it, expect } from 'vitest';
import {
	DEFAULT_THRESHOLDS,
	colorFor,
	areThresholdsValid,
	weekDates,
	monthDates,
	yearMonths,
	habitCellStatus,
	habitMonthPercent,
	taskDayPercent,
	taskMonthPercent,
	shiftReference
} from './summary';
import type { Habit, HabitCompletion, Task, TaskCompletion } from './types';

describe('colorFor', () => {
	it('applique les seuils par défaut (US-005 scénario 3ter)', () => {
		expect(colorFor(80)).toBe('green');
		expect(colorFor(79)).toBe('yellow');
		expect(colorFor(40)).toBe('yellow');
		expect(colorFor(39)).toBe('red');
	});

	it('applique des seuils personnalisés (US-006 scénario 2)', () => {
		const custom = { green: 90, yellow: 50 };
		expect(colorFor(90, custom)).toBe('green');
		expect(colorFor(89, custom)).toBe('yellow');
		expect(colorFor(50, custom)).toBe('yellow');
		expect(colorFor(49, custom)).toBe('red');
	});
});

describe('areThresholdsValid', () => {
	it('valide des seuils cohérents', () => {
		expect(areThresholdsValid(DEFAULT_THRESHOLDS)).toBe(true);
	});
	it('rejette jaune >= vert', () => {
		expect(areThresholdsValid({ green: 80, yellow: 85 })).toBe(false);
		expect(areThresholdsValid({ green: 80, yellow: 80 })).toBe(false);
	});
	it('rejette des valeurs hors 0-100', () => {
		expect(areThresholdsValid({ green: 110, yellow: 40 })).toBe(false);
		expect(areThresholdsValid({ green: 80, yellow: -5 })).toBe(false);
	});
});

describe('weekDates (US-005 scénario 1)', () => {
	it('retourne les 7 jours lundi -> dimanche de la semaine', () => {
		expect(weekDates('2026-08-12')).toEqual([
			'2026-08-10',
			'2026-08-11',
			'2026-08-12',
			'2026-08-13',
			'2026-08-14',
			'2026-08-15',
			'2026-08-16'
		]);
	});
});

describe('monthDates (US-005 scénario 2)', () => {
	it('retourne tous les jours du mois', () => {
		const dates = monthDates('2026-02-15');
		expect(dates).toHaveLength(28);
		expect(dates[0]).toBe('2026-02-01');
		expect(dates.at(-1)).toBe('2026-02-28');
	});
});

describe('yearMonths (US-005 scénario 3)', () => {
	it('retourne les 12 mois de l’année', () => {
		const months = yearMonths('2026-08-12');
		expect(months).toHaveLength(12);
		expect(months[0]).toEqual({ year: 2026, month: 1 });
		expect(months[11]).toEqual({ year: 2026, month: 12 });
	});
});

describe('habitCellStatus (US-005 scénarios 1/6)', () => {
	const habit: Habit = {
		id: 'h1',
		name: 'Test',
		emoji: '✅',
		frequency: { kind: 'weekdays', weekdays: [1, 3] }, // lundi, mercredi
		createdAt: '2026-01-01'
	};

	it("est 'not-due' un jour où l'habitude n'est pas prévue (mardi, scénario 6)", () => {
		expect(habitCellStatus(habit, '2026-08-11', [])).toBe('not-due'); // mardi
	});

	it("est 'not-done' un jour prévu non coché", () => {
		expect(habitCellStatus(habit, '2026-08-10', [])).toBe('not-done'); // lundi
	});

	it("est 'done' un jour prévu coché", () => {
		const completions: HabitCompletion[] = [{ habitId: 'h1', date: '2026-08-10', done: true }];
		expect(habitCellStatus(habit, '2026-08-10', completions)).toBe('done');
	});
});

describe('habitMonthPercent (US-005 scénarios 3/6bis)', () => {
	it('retourne null si aucune occurrence prévue ce mois (scénario 6bis)', () => {
		const habit: Habit = {
			id: 'h1',
			name: 'Test',
			emoji: '✅',
			// Ancrée après la fin du mois testé -> aucune occurrence en août.
			frequency: { kind: 'interval', days: 5, anchor: '2026-09-01' },
			createdAt: '2026-01-01'
		};
		expect(habitMonthPercent(habit, 2026, 8, [])).toBeNull();
	});

	it('calcule le pourcentage jours cochés / jours dus (scénario 3)', () => {
		const habit: Habit = {
			id: 'h1',
			name: 'Test',
			emoji: '✅',
			frequency: { kind: 'weekdays', weekdays: [1] }, // tous les lundis
			createdAt: '2026-01-01'
		};
		// Août 2026 compte 4 lundis : 3, 10, 17, 24, 31 -> en fait 5 lundis (03,10,17,24,31).
		const completions: HabitCompletion[] = [
			{ habitId: 'h1', date: '2026-08-03', done: true },
			{ habitId: 'h1', date: '2026-08-10', done: true }
		];
		const percent = habitMonthPercent(habit, 2026, 8, completions);
		expect(percent).toBe(40); // 2 cochés / 5 lundis
	});

	it('continue de compter l\'historique d\'une habitude en pause ou supprimée (US-015 scénario 3 / US-013 scénario 3 — non-régression)', () => {
		const paused: Habit = {
			id: 'h2',
			name: 'Test en pause',
			emoji: '✅',
			frequency: { kind: 'weekdays', weekdays: [1] },
			createdAt: '2026-01-01',
			status: 'paused'
		};
		const deleted: Habit = { ...paused, id: 'h3', name: 'Test supprimée', status: 'deleted' };
		const completions: HabitCompletion[] = [
			{ habitId: 'h2', date: '2026-08-03', done: true },
			{ habitId: 'h3', date: '2026-08-03', done: true }
		];
		// Le statut de gestion (US-013/US-015) n'affecte pas le calcul du résumé, qui reste
		// une fonction pure du couple (fréquence, complétions) — la route `/resume` continue de
		// fournir la liste complète des habitudes, indépendamment de leur statut.
		expect(habitMonthPercent(paused, 2026, 8, completions)).toBe(20); // 1 coché / 5 lundis
		expect(habitMonthPercent(deleted, 2026, 8, completions)).toBe(20);
	});
});

describe('taskDayPercent (US-005 scénarios 4/5)', () => {
	const tasks: Task[] = [
		{ id: 't1', name: 'A', date: '2026-08-12', createdAt: '2026-08-01' },
		{ id: 't2', name: 'B', date: '2026-08-12', createdAt: '2026-08-01' },
		{ id: 't3', name: 'C', date: '2026-08-12', createdAt: '2026-08-01' }
	];

	it('retourne null si aucune tâche ce jour (scénario 5)', () => {
		expect(taskDayPercent(tasks, [], '2026-08-13')).toBeNull();
	});

	it('calcule le pourcentage de tâches validées (scénario 4 — 2/3 = 67%)', () => {
		const completions: TaskCompletion[] = [
			{ taskId: 't1', done: true },
			{ taskId: 't2', done: true },
			{ taskId: 't3', done: false }
		];
		expect(taskDayPercent(tasks, completions, '2026-08-12')).toBe(67);
	});
});

describe('taskMonthPercent (US-005 scénarios 4bis/5)', () => {
	const tasks: Task[] = [
		{ id: 't1', name: 'A', date: '2026-08-05', createdAt: '2026-08-01' },
		{ id: 't2', name: 'B', date: '2026-08-20', createdAt: '2026-08-01' }
	];

	it('retourne null si aucune tâche ce mois', () => {
		expect(taskMonthPercent(tasks, [], 2026, 9)).toBeNull();
	});

	it('agrège le pourcentage sur le mois', () => {
		const completions: TaskCompletion[] = [{ taskId: 't1', done: true }];
		expect(taskMonthPercent(tasks, completions, 2026, 8)).toBe(50);
	});
});

describe('habitCellStatus / habitMonthPercent — habitude à cible chiffrée (US-019)', () => {
	// US-019 : le statut fait/pas fait d'une habitude à cible chiffrée est dérivé (par
	// CompletionsStore, voir US-018) dans le même `HabitCompletion.done` qu'une habitude « case
	// à cocher ». Ces fonctions du domaine n'ont donc besoin d'aucune connaissance de `target`/
	// `HabitProgress` : elles continuent de fonctionner à l'identique, ce que ces tests vérifient
	// explicitement pour ne pas casser silencieusement cette hypothèse d'implémentation.
	const targetHabit: Habit = {
		id: 'h1',
		name: "Boire de l'eau",
		emoji: '💧',
		frequency: { kind: 'interval', days: 1, anchor: '2026-08-01' },
		createdAt: '2026-08-01',
		target: { value: 1.5, unit: 'L' }
	};

	it('scénario 1 — cellule binaire fait/non fait identique à une habitude case à cocher', () => {
		const completions: HabitCompletion[] = [
			{ habitId: 'h1', date: '2026-08-12', done: true } // cumul >= cible ce jour-là
		];
		expect(habitCellStatus(targetHabit, '2026-08-12', completions)).toBe('done');
		expect(habitCellStatus(targetHabit, '2026-08-13', completions)).toBe('not-done');
	});

	it('scénario 2 — pourcentage mensuel identique à une habitude case à cocher', () => {
		const completions: HabitCompletion[] = [
			{ habitId: 'h1', date: '2026-08-03', done: true },
			{ habitId: 'h1', date: '2026-08-10', done: true }
		];
		// Habitude due tous les jours d'août (31 jours) : 2 jours "faits" (cible atteinte) / 31.
		expect(habitMonthPercent(targetHabit, 2026, 8, completions)).toBe(6);
	});

	it('scénario 4 — historique conservé pour une habitude à cible chiffrée en pause/supprimée', () => {
		const paused: Habit = { ...targetHabit, id: 'h2', status: 'paused' };
		const deleted: Habit = { ...targetHabit, id: 'h3', status: 'deleted' };
		const completions: HabitCompletion[] = [
			{ habitId: 'h2', date: '2026-08-03', done: true },
			{ habitId: 'h3', date: '2026-08-03', done: true }
		];
		expect(habitCellStatus(paused, '2026-08-03', completions)).toBe('done');
		expect(habitCellStatus(deleted, '2026-08-03', completions)).toBe('done');
	});
});

describe('shiftReference (US-005 scénario 7)', () => {
	it('avance/recule d’une semaine', () => {
		expect(shiftReference('week', '2026-08-12', 1)).toBe('2026-08-19');
		expect(shiftReference('week', '2026-08-12', -1)).toBe('2026-08-05');
	});
	it('avance/recule d’un mois (calé sur le 1er)', () => {
		expect(shiftReference('month', '2026-08-12', 1)).toBe('2026-09-01');
		expect(shiftReference('month', '2026-08-12', -1)).toBe('2026-07-01');
	});
	it('avance/recule d’une année', () => {
		expect(shiftReference('year', '2026-08-12', 1)).toBe('2027-08-12');
		expect(shiftReference('year', '2026-08-12', -1)).toBe('2025-08-12');
	});
});
