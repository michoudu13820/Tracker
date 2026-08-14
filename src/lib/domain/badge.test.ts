import { describe, it, expect } from 'vitest';
import { remainingCount } from './badge';
import type { Habit, HabitCompletion, Task, TaskCompletion } from './types';

const dailyHabit: Habit = {
	id: 'h1',
	name: "Boire de l'eau",
	emoji: '💧',
	createdAt: '2026-08-01',
	frequency: { kind: 'interval', days: 1, anchor: '2026-08-01' }
};
const weeklyHabit: Habit = {
	id: 'h2',
	name: 'Yoga',
	emoji: '🧘',
	createdAt: '2026-08-01',
	frequency: { kind: 'weekdays', weekdays: [2] } // mardi uniquement
};
const task: Task = {
	id: 't1',
	name: 'Appeler le plombier',
	date: '2026-08-12',
	createdAt: '2026-08-01'
};

describe('remainingCount (US-031)', () => {
	const today = '2026-08-12'; // mercredi

	it('scénario 1 — compte les habitudes dues et les tâches non cochées du jour', () => {
		const count = remainingCount([dailyHabit], [], [task], [], today);
		expect(count).toBe(2);
	});

	it('scénario 2 — renvoie 0 quand tout est fait', () => {
		const habitCompletions: HabitCompletion[] = [{ habitId: dailyHabit.id, date: today, done: true }];
		const taskCompletions: TaskCompletion[] = [{ taskId: task.id, done: true }];
		const count = remainingCount([dailyHabit], habitCompletions, [task], taskCompletions, today);
		expect(count).toBe(0);
	});

	it('scénario 3 — diminue immédiatement après un cochage', () => {
		const before = remainingCount([dailyHabit], [], [task], [], today);
		const habitCompletions: HabitCompletion[] = [{ habitId: dailyHabit.id, date: today, done: true }];
		const after = remainingCount([dailyHabit], habitCompletions, [task], [], today);
		expect(after).toBe(before - 1);
	});

	it("n'inclut pas une habitude non due ce jour-là", () => {
		// 2026-08-12 est un mercredi, weeklyHabit n'est due que le mardi.
		const count = remainingCount([weeklyHabit], [], [], [], today);
		expect(count).toBe(0);
	});

	it('exclut une tâche supprimée (soft-delete, US-014)', () => {
		const deleted: Task = { ...task, status: 'deleted' };
		const count = remainingCount([], [], [deleted], [], today);
		expect(count).toBe(0);
	});

	it("exclut une tâche d'un autre jour", () => {
		const otherDay: Task = { ...task, date: '2026-08-13' };
		const count = remainingCount([], [], [otherDay], [], today);
		expect(count).toBe(0);
	});
});

/**
 * US-033 scénario 8 — le badge d'icône (US-031) compte une habitude « jours du mois »
 * (US-032) uniquement les jours où elle est réellement due, replis compris.
 */
describe('remainingCount et fréquence « jours du mois » (US-033 scénario 8)', () => {
	const monthly: Habit = {
		id: 'hm',
		name: 'Sauvegarde',
		emoji: '💾',
		createdAt: '2026-08-01',
		frequency: { kind: 'monthdays', monthdays: [1, 15] }
	};

	it('compte l’habitude mensuelle due et non faite ce jour-là', () => {
		expect(remainingCount([monthly], [], [], [], '2026-08-15')).toBe(1);
	});

	it('ne la compte aucun autre jour du mois', () => {
		expect(remainingCount([monthly], [], [], [], '2026-08-14')).toBe(0);
		expect(remainingCount([monthly], [], [], [], '2026-08-16')).toBe(0);
		expect(remainingCount([monthly], [], [], [], '2026-08-31')).toBe(0);
	});

	it('ne la compte plus une fois cochée', () => {
		const completions: HabitCompletion[] = [{ habitId: 'hm', date: '2026-08-15', done: true }];
		expect(remainingCount([monthly], completions, [], [], '2026-08-15')).toBe(0);
	});

	it('compte une seule fois un jour où deux quantièmes se replient sur la même date', () => {
		const twice: Habit = {
			...monthly,
			id: 'hm2',
			frequency: { kind: 'monthdays', monthdays: [30, 31] }
		};
		expect(remainingCount([twice], [], [], [], '2026-02-28')).toBe(1);
	});
});
