<script lang="ts">
	/**
	 * Route « Réglages » — regroupe les préférences et actions de maintenance :
	 *   - Seuils de couleur du résumé annuel (US-006) : implémenté ci-dessous.
	 *   - Rappels par notification (US-007) : implémenté ci-dessous. `settingsStore.reminder`
	 *     porte la préférence persistée (heure, activation), `remindersStore` orchestre le
	 *     canal Web Push (permission, souscription, synchronisation de la fenêtre).
	 *   - Sauvegarde / restauration (US-008) : PLACEHOLDER, hors périmètre de cette session.
	 *     Export/import JSON via $lib/data/backup.
	 *   - Police de caractères (US-016, catalogue étendu + défaut Dancing Script par US-020) :
	 *     implémenté ci-dessous. `settingsStore.fontChoice` porte le réglage persisté, appliqué à
	 *     toute l'app depuis `+layout.svelte`.
	 */
	import { onMount } from 'svelte';
	import { settingsStore } from '$lib/stores/settings.store.svelte';
	import { remindersStore } from '$lib/stores/reminders.store.svelte';
	import { habitsStore } from '$lib/stores/habits.store.svelte';
	import { completionsStore } from '$lib/stores/completions.store.svelte';
	import { DEFAULT_THRESHOLDS } from '$lib/domain/summary';
	import { DEFAULT_FONT_CHOICE, type FontChoice } from '$lib/domain/fonts';
	import type { ColorThresholds } from '$lib/domain/types';
	import ColorThresholdsForm from './ColorThresholdsForm.svelte';
	import ReminderSettingsForm from './ReminderSettingsForm.svelte';
	import FontSelector from './FontSelector.svelte';

	let enabling = $state(false);
	let enableError = $state<string | null>(null);

	onMount(() => {
		void settingsStore.load();
		void habitsStore.load();
		void completionsStore.load();
	});

	async function handleSaveThresholds(thresholds: ColorThresholds) {
		await settingsStore.saveThresholds(thresholds);
	}

	async function handleResetThresholds() {
		await settingsStore.saveThresholds({ ...DEFAULT_THRESHOLDS });
	}

	/** US-007 scénarios 4/5/6 : (dés)active les rappels depuis la case à cocher. */
	async function handleToggleReminders(nextEnabled: boolean) {
		enableError = null;
		const current = settingsStore.reminder;
		if (!current) return;

		if (!nextEnabled) {
			// Scénario 6 : désactivation globale.
			await remindersStore.disable();
			await settingsStore.saveReminder({ ...current, enabled: false });
			return;
		}

		// Scénario 4 : première activation (ou réactivation) — demande la permission.
		enabling = true;
		try {
			const subscription = await remindersStore.enable(
				habitsStore.habits,
				{ ...current, enabled: true },
				completionsStore.habitCompletions
			);
			if (!subscription) {
				// Scénario 5 : refus (ou impossibilité) — état visible, rien n'est activé silencieusement.
				enableError =
					"L'autorisation de notifications n'a pas été accordée : les rappels ne sont pas activés.";
				return;
			}
			await settingsStore.saveReminder({ ...current, enabled: true });
		} finally {
			enabling = false;
		}
	}

	/** US-007 scénario 7 : changement d'heure, re-synchronisé si les rappels sont actifs. */
	async function handleTimeChange(time: string) {
		const current = settingsStore.reminder;
		if (!current) return;
		const updated = { ...current, time };
		await settingsStore.saveReminder(updated);
		if (updated.enabled) {
			await remindersStore.sync(habitsStore.habits, updated, completionsStore.habitCompletions);
		}
	}

	/** US-016 scénario 3 : applique et persiste immédiatement la police choisie. */
	async function handleSaveFont(choice: FontChoice) {
		await settingsStore.saveFontChoice(choice);
	}

	/** US-016 scénario reset : revient à la police par défaut de l'app (US-020 : Dancing Script). */
	async function handleResetFont() {
		await settingsStore.saveFontChoice(DEFAULT_FONT_CHOICE);
	}
</script>

<svelte:head><title>Tracker — Réglages</title></svelte:head>

<h1>Réglages</h1>

<section aria-labelledby="reminders-heading">
	<h2 id="reminders-heading">Rappels par notification</h2>
	<ReminderSettingsForm
		availability={remindersStore.availability()}
		permission={remindersStore.permission()}
		settings={settingsStore.reminder}
		{enabling}
		{enableError}
		onToggle={handleToggleReminders}
		onTimeChange={handleTimeChange}
	/>
</section>

<section aria-labelledby="thresholds-heading">
	<h2 id="thresholds-heading">Couleurs du résumé annuel</h2>
	<ColorThresholdsForm
		thresholds={settingsStore.thresholds}
		onSave={handleSaveThresholds}
		onReset={handleResetThresholds}
	/>
</section>

<section aria-labelledby="font-heading">
	<h2 id="font-heading">Police de caractères</h2>
	<FontSelector
		selected={settingsStore.fontChoice}
		onSave={handleSaveFont}
		onReset={handleResetFont}
	/>
</section>

<p class="muted">Sauvegarde/restauration (US-008) à venir.</p>

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
