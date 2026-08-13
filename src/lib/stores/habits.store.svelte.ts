import type { Habit, HabitStatus, IsoDate } from '$lib/domain/types';
import { habitsDueOn } from '$lib/domain/occurrences';
import { isDueForAutoResume, isHabitPaused } from '$lib/domain/habits';
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
	 * Toute transition qui quitte l'état `'paused'` retire une éventuelle date de reprise
	 * automatique programmée (US-027) : elle n'a plus de sens hors pause.
	 */
	async setStatus(habitId: string, status: HabitStatus) {
		const habit = this.habits.find((h) => h.id === habitId);
		if (!habit) return;
		if (status === 'paused') {
			await this.upsert({ ...habit, status });
			return;
		}
		const { resumeAt: _resumeAt, ...rest } = habit;
		await this.upsert({ ...rest, status });
	}

	/** Supprime une habitude (US-013, soft-delete) : conserve son historique de complétion. */
	async remove(habitId: string) {
		await this.setStatus(habitId, 'deleted');
	}

	/**
	 * Définit (ou retire, `undefined`) la date de reprise automatique d'une habitude déjà en
	 * pause (US-027 scénarios 3/5) sans changer son statut. No-op si l'habitude ciblée n'est
	 * pas en pause (la date de reprise n'a de sens que dans cet état).
	 */
	async setResumeAt(habitId: string, resumeAt: IsoDate | undefined) {
		const habit = this.habits.find((h) => h.id === habitId);
		if (!habit || !isHabitPaused(habit)) return;
		const { resumeAt: _resumeAt, ...rest } = habit;
		await this.upsert({ ...rest, ...(resumeAt ? { resumeAt } : {}) });
	}

	/**
	 * Réactive automatiquement les habitudes en pause dont la date de reprise programmée est
	 * atteinte (US-027 scénario 4). À appeler à l'ouverture de l'application — best-effort, même
	 * principe que la resynchronisation des rappels (US-007/US-023) : sans mécanisme serveur
	 * dédié, la reprise n'est effective qu'à la prochaine ouverture si l'app n'était pas ouverte
	 * le jour J (voir notes de l'US).
	 */
	async applyAutoResume(today: IsoDate) {
		const due = this.habits.filter((h) => isDueForAutoResume(h, today));
		for (const habit of due) {
			await this.setStatus(habit.id, 'active');
		}
	}
}

/** Instance unique partagée par l'app. */
export const habitsStore = new HabitsStore();
