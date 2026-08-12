// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { CompletionsStore } from './completions.store.svelte';
import type { Habit, HabitCompletion, HabitProgress, TaskCompletion } from '$lib/domain/types';
import type { CompletionsRepository } from '$lib/data/repositories';

/**
 * Régression BUG-001 (même patron que HabitsStore/TasksStore) : `setHabitDone()` et
 * `setTaskDone()` doivent dé-proxifier leurs tableaux `$state` avant persistance, sinon
 * `structuredClone` (idb-keyval/IndexedDB) rejette les Proxy réactifs avec un
 * `DataCloneError`.
 */
function fakeRepo(): CompletionsRepository & {
	savedHabit: HabitCompletion[][];
	savedTask: TaskCompletion[][];
	savedProgress: HabitProgress[][];
} {
	const savedHabit: HabitCompletion[][] = [];
	const savedTask: TaskCompletion[][] = [];
	const savedProgress: HabitProgress[][] = [];
	return {
		savedHabit,
		savedTask,
		savedProgress,
		async getHabitCompletions() {
			return [];
		},
		async saveHabitCompletions(c) {
			savedHabit.push(structuredClone(c));
		},
		async getTaskCompletions() {
			return [];
		},
		async saveTaskCompletions(c) {
			savedTask.push(structuredClone(c));
		},
		async getHabitProgress() {
			return [];
		},
		async saveHabitProgress(p) {
			savedProgress.push(structuredClone(p));
		}
	};
}

const targetHabit: Habit = {
	id: 'h1',
	name: "Boire de l'eau",
	emoji: '💧',
	frequency: { kind: 'interval', days: 1, anchor: '2026-08-12' },
	createdAt: '2026-08-12',
	target: { value: 1.5, unit: 'L' }
};

describe('CompletionsStore (régression BUG-001)', () => {
	it('setHabitDone persiste sans DataCloneError', async () => {
		const repo = fakeRepo();
		const store = new CompletionsStore(repo);

		await expect(store.setHabitDone('h1', '2026-08-12', true)).resolves.toBeUndefined();

		expect(repo.savedHabit).toHaveLength(1);
		expect(repo.savedHabit[0]).toEqual([{ habitId: 'h1', date: '2026-08-12', done: true }]);
	});

	it('setTaskDone persiste sans DataCloneError', async () => {
		const repo = fakeRepo();
		const store = new CompletionsStore(repo);

		await expect(store.setTaskDone('t1', true, '2026-08-12')).resolves.toBeUndefined();

		expect(repo.savedTask).toHaveLength(1);
		expect(repo.savedTask[0]).toEqual([{ taskId: 't1', done: true, doneAt: '2026-08-12' }]);
	});

	it('addHabitProgress persiste sans DataCloneError', async () => {
		const repo = fakeRepo();
		const store = new CompletionsStore(repo);

		await expect(
			store.addHabitProgress(targetHabit, '2026-08-12', 0.2)
		).resolves.toBeUndefined();

		expect(repo.savedProgress.at(-1)).toEqual([
			{ habitId: 'h1', date: '2026-08-12', value: 0.2 }
		]);
	});
});

describe('CompletionsStore — progression quotidienne à cible chiffrée (US-018)', () => {
	it('scénario 1 — affiche 0 tant qu’aucune saisie n’a été faite aujourd’hui', () => {
		const store = new CompletionsStore(fakeRepo());
		expect(store.habitProgressValue('h1', '2026-08-12')).toBe(0);
	});

	it('scénario 2 — ajoute une quantité au cumul du jour', async () => {
		const store = new CompletionsStore(fakeRepo());
		await store.addHabitProgress(targetHabit, '2026-08-12', 0.2);
		expect(store.habitProgressValue('h1', '2026-08-12')).toBe(0.2);
	});

	it('scénario 3 — cumule plusieurs saisies dans la même journée', async () => {
		const store = new CompletionsStore(fakeRepo());
		await store.addHabitProgress(targetHabit, '2026-08-12', 0.2);
		await store.addHabitProgress(targetHabit, '2026-08-12', 0.3);
		expect(store.habitProgressValue('h1', '2026-08-12')).toBe(0.5);
	});

	it('scénario 4 — marque automatiquement l’habitude comme faite à l’atteinte de la cible', async () => {
		const store = new CompletionsStore(fakeRepo());
		await store.addHabitProgress(targetHabit, '2026-08-12', 1.3);
		expect(store.isHabitDone('h1', '2026-08-12')).toBe(false);

		await store.addHabitProgress(targetHabit, '2026-08-12', 0.2);
		expect(store.habitProgressValue('h1', '2026-08-12')).toBe(1.5);
		expect(store.isHabitDone('h1', '2026-08-12')).toBe(true);
	});

	it('scénario 5 — le cumul peut dépasser la cible sans blocage, et reste marqué fait', async () => {
		const store = new CompletionsStore(fakeRepo());
		await store.addHabitProgress(targetHabit, '2026-08-12', 1.5);
		expect(store.isHabitDone('h1', '2026-08-12')).toBe(true);

		await store.addHabitProgress(targetHabit, '2026-08-12', 0.3);
		expect(store.habitProgressValue('h1', '2026-08-12')).toBe(1.8);
		expect(store.isHabitDone('h1', '2026-08-12')).toBe(true);
	});

	it('scénario 7 — le cumul du jour suivant repart à 0, sans report de la veille', async () => {
		const store = new CompletionsStore(fakeRepo());
		await store.addHabitProgress(targetHabit, '2026-08-11', 1.5);
		expect(store.habitProgressValue('h1', '2026-08-12')).toBe(0);
	});

	it('scénario 8 — une saisie sur un autre jour ne modifie pas rétroactivement un jour passé', async () => {
		const store = new CompletionsStore(fakeRepo());
		await store.addHabitProgress(targetHabit, '2026-08-10', 1.2);
		await store.addHabitProgress(targetHabit, '2026-08-12', 0.4);
		expect(store.habitProgressValue('h1', '2026-08-10')).toBe(1.2);
	});

	it('scénario 9 — corrige directement la valeur cumulée et recalcule le statut', async () => {
		const store = new CompletionsStore(fakeRepo());
		await store.addHabitProgress(targetHabit, '2026-08-12', 2);
		expect(store.habitProgressValue('h1', '2026-08-12')).toBe(2);
		expect(store.isHabitDone('h1', '2026-08-12')).toBe(true);

		await store.setHabitProgress(targetHabit, '2026-08-12', 0.2);
		expect(store.habitProgressValue('h1', '2026-08-12')).toBe(0.2);
		expect(store.isHabitDone('h1', '2026-08-12')).toBe(false);
	});

	it('scénario 10 — une édition de la cible réévalue le statut fait/pas fait sans toucher au cumul', async () => {
		const store = new CompletionsStore(fakeRepo());
		await store.setHabitProgress(targetHabit, '2026-08-12', 1);
		expect(store.isHabitDone('h1', '2026-08-12')).toBe(false); // 1 < 1.5

		const revisedHabit: Habit = { ...targetHabit, target: { value: 0.5, unit: 'L' } };
		await store.recomputeTargetCompletions(revisedHabit);

		expect(store.habitProgressValue('h1', '2026-08-12')).toBe(1); // cumul conservé
		expect(store.isHabitDone('h1', '2026-08-12')).toBe(true); // 1 >= 0.5

		const raisedHabit: Habit = { ...targetHabit, target: { value: 2, unit: 'L' } };
		await store.recomputeTargetCompletions(raisedHabit);
		expect(store.habitProgressValue('h1', '2026-08-12')).toBe(1); // cumul toujours conservé
		expect(store.isHabitDone('h1', '2026-08-12')).toBe(false); // 1 < 2
	});

	it('ne recalcule rien quand l’habitude n’a plus de cible chiffrée (US-017 scénario 6)', async () => {
		const store = new CompletionsStore(fakeRepo());
		await store.setHabitProgress(targetHabit, '2026-08-12', 2); // done = true (2 >= 1.5)

		const checkboxHabit: Habit = { ...targetHabit, target: undefined };
		await store.recomputeTargetCompletions(checkboxHabit);

		// Statut inchangé : redevient un cochage manuel classique (US-017 scénario 6).
		expect(store.isHabitDone('h1', '2026-08-12')).toBe(true);
	});
});
