import type { HabitCompletion, IsoDate, TaskCompletion } from '$lib/domain/types';
import { idbRepositories, type CompletionsRepository } from '$lib/data/repositories';

/**
 * État partagé de l'historique de complétion (Svelte 5 runes) : cochage des habitudes
 * par jour et des tâches ponctuelles. Cœur de US-004 (planning : cocher/décocher) et
 * source de vérité pour US-005 (résumé) et US-003 (une tâche cochée n'est pas en retard).
 *
 * Modèle volontairement simple (tableaux plats) : suffisant à l'échelle d'un usage perso.
 * Voir ADR-004 (granularité de persistance).
 */
export class CompletionsStore {
	#repo: CompletionsRepository;
	habitCompletions = $state<HabitCompletion[]>([]);
	taskCompletions = $state<TaskCompletion[]>([]);
	loaded = $state(false);

	constructor(repo: CompletionsRepository = idbRepositories.completions) {
		this.#repo = repo;
	}

	async load() {
		[this.habitCompletions, this.taskCompletions] = await Promise.all([
			this.#repo.getHabitCompletions(),
			this.#repo.getTaskCompletions()
		]);
		this.loaded = true;
	}

	/** État coché/non coché d'une habitude un jour donné (US-004/US-005). */
	isHabitDone(habitId: string, date: IsoDate): boolean {
		return (
			this.habitCompletions.find((c) => c.habitId === habitId && c.date === date)?.done ?? false
		);
	}

	/** Coche/décoche une habitude pour un jour (US-004 scénarios 4/5). */
	async setHabitDone(habitId: string, date: IsoDate, done: boolean) {
		const idx = this.habitCompletions.findIndex((c) => c.habitId === habitId && c.date === date);
		if (idx >= 0) this.habitCompletions[idx] = { habitId, date, done };
		else this.habitCompletions.push({ habitId, date, done });
		// Dé-proxifier avant persistance : voir BUG-001 (mêmes causes que habits/tasks store).
		await this.#repo.saveHabitCompletions($state.snapshot(this.habitCompletions));
	}

	/** État coché/non coché d'une tâche ponctuelle (US-004). */
	isTaskDone(taskId: string): boolean {
		return this.taskCompletions.find((c) => c.taskId === taskId)?.done ?? false;
	}

	/** Coche/décoche une tâche ponctuelle (US-004). */
	async setTaskDone(taskId: string, done: boolean, doneAt?: IsoDate) {
		const idx = this.taskCompletions.findIndex((c) => c.taskId === taskId);
		if (idx >= 0) this.taskCompletions[idx] = { taskId, done, doneAt };
		else this.taskCompletions.push({ taskId, done, doneAt });
		// Dé-proxifier avant persistance : voir BUG-001 (mêmes causes que habits/tasks store).
		await this.#repo.saveTaskCompletions($state.snapshot(this.taskCompletions));
	}
}

/** Instance unique partagée par l'app. */
export const completionsStore = new CompletionsStore();
