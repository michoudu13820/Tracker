import type { Habit, HabitCompletion, HabitProgress, IsoDate, TaskCompletion } from '$lib/domain/types';
import { idbRepositories, type CompletionsRepository } from '$lib/data/repositories';
import { isTargetReached, progressValue, roundAmount } from '$lib/domain/progress';

/**
 * État partagé de l'historique de complétion (Svelte 5 runes) : cochage des habitudes
 * par jour et des tâches ponctuelles. Cœur de US-004 (planning : cocher/décocher) et
 * source de vérité pour US-005 (résumé) et US-003 (une tâche cochée n'est pas en retard).
 * Gère aussi la progression cumulée quotidienne des habitudes à cible chiffrée (US-018).
 *
 * Modèle volontairement simple (tableaux plats) : suffisant à l'échelle d'un usage perso.
 * Voir ADR-004 (granularité de persistance).
 */
export class CompletionsStore {
	#repo: CompletionsRepository;
	habitCompletions = $state<HabitCompletion[]>([]);
	taskCompletions = $state<TaskCompletion[]>([]);
	/** Progression cumulée quotidienne des habitudes à cible chiffrée (US-018). */
	habitProgress = $state<HabitProgress[]>([]);
	loaded = $state(false);

	constructor(repo: CompletionsRepository = idbRepositories.completions) {
		this.#repo = repo;
	}

	async load() {
		[this.habitCompletions, this.taskCompletions, this.habitProgress] = await Promise.all([
			this.#repo.getHabitCompletions(),
			this.#repo.getTaskCompletions(),
			this.#repo.getHabitProgress()
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

	/** Valeur cumulée du jour pour une habitude à cible chiffrée (US-018 scénarios 1/7/8). */
	habitProgressValue(habitId: string, date: IsoDate): number {
		return progressValue(this.habitProgress, habitId, date);
	}

	/**
	 * Fixe directement la valeur cumulée du jour (US-018 scénario 9 — correction d'une saisie
	 * erronée) et dérive le statut fait/pas fait de l'habitude à partir de sa cible chiffrée
	 * (scénarios 4/9/10), en réutilisant `setHabitDone` — même mécanisme de complétion que les
	 * habitudes « case à cocher », consommé tel quel par le résumé (US-005/US-019).
	 */
	async setHabitProgress(habit: Habit, date: IsoDate, value: number) {
		const rounded = roundAmount(value);
		const idx = this.habitProgress.findIndex((p) => p.habitId === habit.id && p.date === date);
		if (idx >= 0) this.habitProgress[idx] = { habitId: habit.id, date, value: rounded };
		else this.habitProgress.push({ habitId: habit.id, date, value: rounded });
		// Dé-proxifier avant persistance : voir BUG-001 (mêmes causes que habits/tasks store).
		await this.#repo.saveHabitProgress($state.snapshot(this.habitProgress));

		if (habit.target) {
			await this.setHabitDone(habit.id, date, isTargetReached(rounded, habit.target.value));
		}
	}

	/** Ajoute une quantité au cumul du jour (US-018 scénarios 2/3/5), sans limite haute — la
	 * saisie n'est jamais bloquée une fois la cible atteinte (scénario 5). */
	async addHabitProgress(habit: Habit, date: IsoDate, amount: number) {
		const current = this.habitProgressValue(habit.id, date);
		await this.setHabitProgress(habit, date, current + amount);
	}

	/**
	 * Réévalue le statut fait/pas fait de tous les jours ayant une progression enregistrée pour
	 * cette habitude, après une édition de sa cible (US-018 scénario 10) : le cumul brut est
	 * conservé tel quel, seule sa comparaison à la nouvelle cible change. Ne fait rien si
	 * l'habitude n'a plus de cible chiffrée (retour au mode case à cocher, US-017 scénario 6) —
	 * le statut redevient alors un cochage manuel classique, sans recalcul rétroactif.
	 */
	async recomputeTargetCompletions(habit: Habit) {
		if (!habit.target) return;
		const targetValue = habit.target.value;
		const dates = this.habitProgress
			.filter((p) => p.habitId === habit.id)
			.map((p) => p.date);
		for (const date of dates) {
			const value = this.habitProgressValue(habit.id, date);
			await this.setHabitDone(habit.id, date, isTargetReached(value, targetValue));
		}
	}
}

/** Instance unique partagée par l'app. */
export const completionsStore = new CompletionsStore();
