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
