// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { CompletionsStore } from './completions.store.svelte';
import type { HabitCompletion, TaskCompletion } from '$lib/domain/types';
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
} {
	const savedHabit: HabitCompletion[][] = [];
	const savedTask: TaskCompletion[][] = [];
	return {
		savedHabit,
		savedTask,
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
		}
	};
}

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
});
