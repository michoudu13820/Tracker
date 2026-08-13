import type { Habit, HabitCompletion, IsoDate, Task, TaskCompletion } from '$lib/domain/types';
import { remainingCount } from '$lib/domain/badge';
import { defaultBadgeClient, type BadgeClient } from '$lib/badge/client';

/**
 * Orchestration RUNTIME du badge d'icône PWA (US-031) — état lié à l'appareil/navigateur, sur
 * le même principe que `remindersStore` : calcule localement le nombre d'éléments restants
 * (`$lib/domain/badge`) et appelle l'API navigateur (`$lib/badge/client`, injecté — mockable en
 * test, sans navigateur réel).
 *
 * Support non garanti (voir `$lib/badge/client`) : `update` reste un no-op silencieux si l'API
 * est absente, délégué au client — jamais d'échec visible ni de régression du reste de l'app.
 */
export class BadgeStore {
	#client: BadgeClient;

	/** Dernier compte calculé (état device, non persisté) — utile pour l'affichage éventuel
	 * d'un statut de support dans les réglages, sans obligation d'usage. */
	lastCount = $state<number | null>(null);

	constructor(client: BadgeClient = defaultBadgeClient) {
		this.#client = client;
	}

	/** Support de l'API sur ce navigateur, sans effet de bord. */
	supported(): boolean {
		return this.#client.isBadgingSupported();
	}

	/**
	 * Recalcule le nombre d'éléments restants pour `today` et met à jour le badge (US-031
	 * scénarios 1/2/3) : affiche le compte s'il est positif, retire le badge sinon. À appeler à
	 * chaque ouverture de l'app et à chaque mise en arrière-plan (voir `+layout.svelte`).
	 */
	async update(
		habits: Habit[],
		habitCompletions: HabitCompletion[],
		tasks: Task[],
		taskCompletions: TaskCompletion[],
		today: IsoDate
	): Promise<void> {
		const count = remainingCount(habits, habitCompletions, tasks, taskCompletions, today);
		this.lastCount = count;
		if (count > 0) {
			await this.#client.setBadge(count);
		} else {
			await this.#client.clearBadge();
		}
	}
}

/** Instance unique partagée par l'app. */
export const badgeStore = new BadgeStore();
