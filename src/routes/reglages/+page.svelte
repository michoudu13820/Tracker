<script lang="ts">
	/**
	 * Route « Réglages » — regroupe les préférences et actions de maintenance :
	 *   - Seuils de couleur du résumé annuel (US-006) : implémenté ci-dessous.
	 *   - Rappels par notification (US-007) : PLACEHOLDER, hors périmètre de cette session.
	 *     State prévu : `settingsStore.reminder` + `remindersStore` (orchestration push).
	 *   - Sauvegarde / restauration (US-008) : PLACEHOLDER, hors périmètre de cette session.
	 *     Export/import JSON via $lib/data/backup.
	 */
	import { onMount } from 'svelte';
	import { settingsStore } from '$lib/stores/settings.store.svelte';
	import { DEFAULT_THRESHOLDS } from '$lib/domain/summary';
	import type { ColorThresholds } from '$lib/domain/types';
	import ColorThresholdsForm from './ColorThresholdsForm.svelte';

	onMount(() => {
		void settingsStore.load();
	});

	async function handleSaveThresholds(thresholds: ColorThresholds) {
		await settingsStore.saveThresholds(thresholds);
	}

	async function handleResetThresholds() {
		await settingsStore.saveThresholds({ ...DEFAULT_THRESHOLDS });
	}
</script>

<svelte:head><title>Tracker — Réglages</title></svelte:head>

<h1>Réglages</h1>

<section aria-labelledby="thresholds-heading">
	<h2 id="thresholds-heading">Couleurs du résumé annuel</h2>
	<ColorThresholdsForm
		thresholds={settingsStore.thresholds}
		onSave={handleSaveThresholds}
		onReset={handleResetThresholds}
	/>
</section>

<p class="muted">Écran à compléter — rappels (US-007), sauvegarde/restauration (US-008).</p>

<style>
	.muted {
		color: var(--muted);
	}
	section {
		margin-bottom: 1.5rem;
	}
	section h2 {
		font-size: 1rem;
		margin-bottom: 0.5rem;
	}
</style>
