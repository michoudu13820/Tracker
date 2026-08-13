import { habitsStore } from './habits.store.svelte';
import { tasksStore } from './tasks.store.svelte';
import { completionsStore } from './completions.store.svelte';
import { badgeStore } from './badge.store.svelte';
import { toIsoDate } from '$lib/domain/dates';

/**
 * Recalcule et applique le badge d'icône PWA (US-031) à partir de l'état courant des stores
 * singleton de l'app — même patron que `resyncReminders` (US-023) : coordination inter-stores
 * explicite, centralisée ici pour éviter de dupliquer l'orchestration à chaque point d'appel
 * (`+layout.svelte`, à l'ouverture et à la mise en arrière-plan — voir CONVENTIONS.md/ADR-003).
 * Toujours calculé pour le jour réel (« aujourd'hui »), jamais un jour sélectionné dans le
 * planning. No-op silencieux si l'App Badging API n'est pas supportée (délégué à `BadgeStore`).
 */
export async function updateBadge(): Promise<void> {
	await badgeStore.update(
		habitsStore.habits,
		completionsStore.habitCompletions,
		tasksStore.tasks,
		completionsStore.taskCompletions,
		toIsoDate(new Date())
	);
}
