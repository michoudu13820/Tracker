import { habitsStore } from './habits.store.svelte';
import { tasksStore } from './tasks.store.svelte';
import { completionsStore } from './completions.store.svelte';
import { settingsStore } from './settings.store.svelte';
import { remindersStore } from './reminders.store.svelte';

/**
 * Resynchronise les trois fenêtres de rappels (récap générique des habitudes US-007, rappels
 * nominatifs des tâches à heure limite US-022, revue hebdomadaire poussée US-028) à partir de
 * l'état courant des stores singleton de l'app — US-023 : à appeler, en plus de la
 * resynchronisation déjà déclenchée à l'ouverture de l'app (`+layout.svelte`), à chaque
 * cochage/décochage d'une habitude ou d'une tâche.
 *
 * Coordination inter-stores explicite, à la charge de l'appelant (pas de bus d'événements —
 * voir ADR-003) : centralisée ici pour éviter de dupliquer cette orchestration dans chaque
 * route qui coche/décoche (`/`, `/taches`). No-op silencieux si les réglages ne sont pas
 * encore chargés ou si les rappels ne sont pas actifs/souscrits — délégué à `RemindersStore.sync`,
 * qui ne fait déjà rien dans ce cas. Reste, comme le reste du mécanisme, **best-effort**
 * (cf. ADR-001, amendement 2026-08-12) : ne garantit jamais l'annulation d'un rappel déjà en
 * file côté serveur, réduit seulement la fenêtre de risque (US-023 scénario 3).
 */
export async function resyncReminders(): Promise<void> {
	const settings = settingsStore.reminder;
	if (!settings) return;

	await remindersStore.sync(
		habitsStore.habits,
		settings,
		completionsStore.habitCompletions,
		tasksStore.tasks,
		completionsStore.taskCompletions,
		settingsStore.weeklyReview ?? undefined
	);
}
