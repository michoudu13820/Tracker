<script lang="ts">
	import { onMount } from 'svelte';
	import '../app.css';
	import { TabBar } from '$lib/components';
	import { settingsStore } from '$lib/stores/settings.store.svelte';
	import { habitsStore } from '$lib/stores/habits.store.svelte';
	import { tasksStore } from '$lib/stores/tasks.store.svelte';
	import { completionsStore } from '$lib/stores/completions.store.svelte';
	import { remindersStore } from '$lib/stores/reminders.store.svelte';
	import { updateBadge } from '$lib/stores/update-badge';
	import { applyFontChoice } from '$lib/fonts/client';
	import { toIsoDate } from '$lib/domain/dates';

	let { children } = $props();

	// Police de caractères (US-016 scénario 3) : appliquée à toute l'app (tous les onglets)
	// dès que le réglage persisté est chargé (settingsStore.load(), ci-dessous), et à chaque
	// changement — sans rechargement de page.
	$effect(() => {
		applyFontChoice(settingsStore.fontChoice);
	});

	/**
	 * Re-synchronisation des rappels à chaque ouverture de l'app (US-007 scénarios 8/9/10,
	 * US-022, US-028) : retrouve la souscription push existante (si déjà accordée lors d'une
	 * session précédente) et repousse les trois fenêtres glissantes recalculées avec l'état de
	 * complétion à jour — récap générique des habitudes, rappels nominatifs des tâches à heure
	 * limite, et revue hebdomadaire poussée. C'est ce qui permet au best-effort des scénarios 8
	 * (US-007) et 4 (US-022) de fonctionner (aucun rappel sur un élément déjà fait, seulement si
	 * l'app a été rouverte avant l'heure d'envoi).
	 *
	 * Reprise automatique des habitudes en pause (US-027 scénario 4) : évaluée localement à
	 * chaque ouverture de l'app, même principe best-effort (pas de mécanisme serveur dédié —
	 * voir ADR-001) : sans ouverture le jour J, la reprise n'est effective qu'à la prochaine
	 * ouverture.
	 *
	 * Badge d'icône PWA (US-031 scénarios 1/3) : recalculé à l'ouverture de l'app et à chaque
	 * mise en arrière-plan (`visibilitychange` → `document.hidden`), qui couvre uniformément
	 * toute mutation ayant pu changer le nombre d'éléments restants (cochage, ajout rapide,
	 * suppression…) sans avoir à instrumenter chaque action individuellement. No-op silencieux
	 * si l'App Badging API n'est pas supportée par le navigateur (voir `$lib/badge/client`) —
	 * support non garanti en PWA standalone iOS, non validable en CI (cf. US-031, notes).
	 */
	onMount(() => {
		void (async () => {
			await Promise.all([
				settingsStore.load(),
				habitsStore.load(),
				tasksStore.load(),
				completionsStore.load()
			]);
			await habitsStore.applyAutoResume(toIsoDate(new Date()));
			await remindersStore.restore();
			if (settingsStore.reminder?.enabled) {
				await remindersStore.sync(
					habitsStore.habits,
					settingsStore.reminder,
					completionsStore.habitCompletions,
					tasksStore.tasks,
					completionsStore.taskCompletions,
					settingsStore.weeklyReview ?? undefined
				);
			}
			await updateBadge();
		})();

		function handleVisibilityChange() {
			if (document.hidden) void updateBadge();
		}
		document.addEventListener('visibilitychange', handleVisibilityChange);
		return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
	});
</script>

<div class="app">
	<main>
		{@render children()}
	</main>
	<TabBar />
</div>

<style>
	.app {
		display: flex;
		flex-direction: column;
		min-height: 100dvh;
	}
	main {
		flex: 1;
		width: 100%;
		max-width: 42rem;
		margin: 0 auto;
		padding: 1.5rem;
	}
</style>
