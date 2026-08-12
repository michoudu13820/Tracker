import type { IsoDate, Task } from '$lib/domain/types';
import { tasksOn } from '$lib/domain/tasks';
import { idbRepositories, type TasksRepository } from '$lib/data/repositories';

/**
 * État partagé des tâches ponctuelles (Svelte 5 runes). Même patron que `HabitsStore` :
 * état réactif + persistance déléguée à un repository injecté (mockable en test).
 * Sert US-002 (création/édition), US-003 (reprogrammation) et US-004 (planning).
 */
export class TasksStore {
	#repo: TasksRepository;
	tasks = $state<Task[]>([]);
	loaded = $state(false);

	constructor(repo: TasksRepository = idbRepositories.tasks) {
		this.#repo = repo;
	}

	async load() {
		this.tasks = await this.#repo.getAll();
		this.loaded = true;
	}

	/** Tâches datées d'un jour donné (US-004). */
	onDate(date: IsoDate): Task[] {
		return tasksOn(this.tasks, date);
	}

	/** Crée ou met à jour une tâche (US-002). La reprogrammation (US-003) est un upsert de date. */
	async upsert(task: Task) {
		const idx = this.tasks.findIndex((t) => t.id === task.id);
		if (idx >= 0) this.tasks[idx] = task;
		else this.tasks.push(task);
		// `this.tasks` est un tableau $state : ses éléments sont enveloppés dans des Proxy
		// réactifs, non clonables par `structuredClone` (utilisé en interne par idb-keyval
		// pour écrire dans IndexedDB). On dé-proxifie avant persistance (BUG-001).
		await this.#repo.saveAll($state.snapshot(this.tasks));
	}
}

/** Instance unique partagée par l'app (sûr car app 100% client, ssr=false — voir ADR-002/003). */
export const tasksStore = new TasksStore();
