import type { Habit, IsoDate } from '$lib/domain/types';
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
}

/** Instance unique partagée par l'app. */
export const habitsStore = new HabitsStore();
