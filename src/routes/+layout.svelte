<script lang="ts">
	import { onMount } from 'svelte';
	import '../app.css';
	import { TabBar } from '$lib/components';
	import { settingsStore } from '$lib/stores/settings.store.svelte';
	import { habitsStore } from '$lib/stores/habits.store.svelte';
	import { completionsStore } from '$lib/stores/completions.store.svelte';
	import { remindersStore } from '$lib/stores/reminders.store.svelte';
	import { applyFontChoice } from '$lib/fonts/client';

	let { children } = $props();

	// Police de caractères (US-016 scénario 3) : appliquée à toute l'app (tous les onglets)
	// dès que le réglage persisté est chargé (settingsStore.load(), ci-dessous), et à chaque
	// changement — sans rechargement de page.
	$effect(() => {
		applyFontChoice(settingsStore.fontChoice);
	});

	/**
	 * Re-synchronisation des rappels à chaque ouverture de l'app (US-007 scénarios 8/9/10) :
	 * retrouve la souscription push existante (si déjà accordée lors d'une session précédente)
	 * et repousse la fenêtre glissante recalculée avec l'état de complétion à jour — c'est ce
	 * qui permet au best-effort du scénario 8 de fonctionner (aucun rappel si tout est déjà
	 * coché ET l'app a été rouverte avant l'heure d'envoi).
	 */
	onMount(() => {
		void (async () => {
			await Promise.all([settingsStore.load(), habitsStore.load(), completionsStore.load()]);
			await remindersStore.restore();
			if (settingsStore.reminder?.enabled) {
				await remindersStore.sync(
					habitsStore.habits,
					settingsStore.reminder,
					completionsStore.habitCompletions
				);
			}
		})();
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
