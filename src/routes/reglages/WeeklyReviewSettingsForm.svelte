<script lang="ts">
	/**
	 * Formulaire de la revue hebdomadaire poussée (US-028). Colocalisé (usage unique dans
	 * `/reglages`). Composant présentational : reçoit l'état courant et des callbacks, ne
	 * parle pas aux stores directement (voir CONVENTIONS.md — la route orchestre).
	 *
	 * Nécessite les rappels quotidiens actifs (US-007) — même souscription push, scénario 1 —
	 * mais son activation reste indépendante de celle du rappel quotidien (scénario 3) : on peut
	 * désactiver l'une sans l'autre une fois les deux accessibles.
	 */
	import type { WeeklyReviewSettings, Weekday } from '$lib/domain/types';
	import { WEEKDAY_ORDER, weekdayLabel } from '$lib/domain/habits';

	interface Props {
		/** Rappels quotidiens actifs (US-007) — prérequis d'activation (scénario 1). */
		dailyRemindersEnabled: boolean;
		/** Réglages persistés actuels (null tant que non chargés). */
		settings: WeeklyReviewSettings | null;
		onToggle: (nextEnabled: boolean) => void;
		onWeekdayChange: (weekday: Weekday) => void;
		onTimeChange: (time: string) => void;
	}

	let { dailyRemindersEnabled, settings, onToggle, onWeekdayChange, onTimeChange }: Props = $props();

	function handleToggle(e: Event) {
		onToggle((e.target as HTMLInputElement).checked);
	}

	function handleWeekdayChange(e: Event) {
		onWeekdayChange(Number((e.target as HTMLSelectElement).value) as Weekday);
	}

	function handleTimeChange(e: Event) {
		onTimeChange((e.target as HTMLInputElement).value);
	}
</script>

{#if !dailyRemindersEnabled}
	<div class="notice" role="status">
		<p>Active d'abord les rappels quotidiens ci-dessus pour pouvoir activer la revue hebdomadaire.</p>
	</div>
{:else if settings}
	<div class="field toggle-field">
		<label for="weekly-review-enabled">Recevoir une revue hebdomadaire</label>
		<input
			id="weekly-review-enabled"
			type="checkbox"
			role="switch"
			checked={settings.enabled}
			onchange={handleToggle}
		/>
	</div>

	<div class="field">
		<label for="weekly-review-weekday">Jour</label>
		<select id="weekly-review-weekday" value={settings.weekday} onchange={handleWeekdayChange}>
			{#each WEEKDAY_ORDER as day (day)}
				<option value={day}>{weekdayLabel(day)}</option>
			{/each}
		</select>
	</div>

	<div class="field">
		<label for="weekly-review-time">Heure</label>
		<input
			id="weekly-review-time"
			type="time"
			step="900"
			value={settings.time}
			onchange={handleTimeChange}
		/>
		<p class="hint">Envoi autour de l'heure choisie, avec une latence possible jusqu'à ~15 minutes.</p>
	</div>
{/if}

<style>
	.notice {
		background: var(--surface);
		border: 1px solid var(--surface-border);
		border-radius: 0.75rem;
		padding: 1rem;
	}
	.notice p {
		margin: 0;
	}
	.field {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		margin-bottom: 0.75rem;
	}
	.toggle-field {
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
	}
	label {
		font-size: 0.85rem;
		color: var(--muted);
	}
	input[type='time'],
	select {
		background: var(--bg);
		border: 1px solid var(--surface-border);
		border-radius: 0.35rem;
		color: var(--text);
		padding: 0.5rem;
		min-height: 44px;
	}
	input[type='checkbox'] {
		width: 2.5rem;
		height: 1.5rem;
	}
	.hint {
		color: var(--muted);
		font-size: 0.8rem;
	}
</style>
