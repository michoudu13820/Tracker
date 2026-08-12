import type { Habit, HabitStatus, IsoDate } from '$lib/domain/types';
import { habitsDueOn } from '$lib/domain/occurrences';
import { idbRepositories, type HabitsRepository } from '$lib/data/repositories';

/**
 * Store d'état partagé (Svelte 5 runes). Encapsule l'état des habitudes et délègue
 * la persistance à un repository injecté (mockable en test). Aucun accès direct à
 * IndexedDB ici. Voir skill create-store.
 */
export class HabitsStore {
	#repo: HabitsRepository;
	habits = $state<Habit[]>([]);
	loaded = $state(false);

	constructor(repo: HabitsRepository = idbRepositories.habits) {
		this.#repo = repo;
	}

	async load() {
		this.habits = await this.#repo.getAll();
		this.loaded = true;
	}

	dueOn(date: IsoDate): Habit[] {
		return habitsDueOn(this.habits, date);
	}

	async upsert(habit: Habit) {
		const idx = this.habits.findIndex((h) => h.id === habit.id);
		if (idx >= 0) this.habits[idx] = habit;
		else this.habits.push(habit);
		// `this.habits` est un tableau $state : ses éléments sont enveloppés dans des Proxy
		// réactifs, non clonables par `structuredClone` (utilisé en interne par idb-keyval
		// pour écrire dans IndexedDB). On dé-proxifie avant persistance (BUG-001).
		await this.#repo.saveAll($state.snapshot(this.habits));
	}

	/**
	 * Change le statut de gestion d'une habitude (US-013 suppression / US-015 pause-reprise) :
	 * mécanisme unique et réutilisé plutôt que deux systèmes parallèles (cf. dépendance
	 * US-013 → US-015). `'deleted'` est un état terminal, jamais réattribué depuis l'UI.
	 */
	async setStatus(habitId: string, status: HabitStatus) {
		const habit = this.habits.find((h) => h.id === habitId);
		if (!habit) return;
		await this.upsert({ ...habit, status });
	}

	/** Supprime une habitude (US-013, soft-delete) : conserve son historique de complétion. */
	async remove(habitId: string) {
		await this.setStatus(habitId, 'deleted');
	}
}

/** Instance unique partagée par l'app. */
export const habitsStore = new HabitsStore();
