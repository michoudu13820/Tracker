// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { TasksStore } from './tasks.store.svelte';
import type { Task } from '$lib/domain/types';
import type { TasksRepository } from '$lib/data/repositories';

/**
 * Régression BUG-001 (même patron que HabitsStore, voir habits.store.svelte.test.ts) :
 * `upsert()` doit dé-proxifier `this.tasks` avant `repo.saveAll()`, sinon `structuredClone`
 * (utilisé en interne par idb-keyval/IndexedDB) rejette les Proxy réactifs `$state` avec un
 * `DataCloneError`, faisant échouer la persistance en silence.
 */
function fakeRepo(): TasksRepository & { saved: Task[][] } {
	const saved: Task[][] = [];
	return {
		saved,
		async getAll() {
			return [];
		},
		async saveAll(tasks) {
			saved.push(structuredClone(tasks));
		}
	};
}

const task: Task = {
	id: 't1',
	name: 'Appeler le plombier',
	date: '2026-08-12',
	createdAt: '2026-08-12'
};

describe('TasksStore.upsert (régression BUG-001)', () => {
	it('persiste une tâche fraîchement créée sans DataCloneError', async () => {
		const repo = fakeRepo();
		const store = new TasksStore(repo);

		await expect(store.upsert(task)).resolves.toBeUndefined();

		expect(repo.saved).toHaveLength(1);
		expect(repo.saved[0]).toEqual([task]);
	});
});
