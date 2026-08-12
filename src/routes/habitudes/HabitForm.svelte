<script lang="ts">
	/**
	 * Formulaire de création/édition d'une habitude (US-001). Colocalisé dans la route
	 * `habitudes` car utilisé uniquement ici. Logique de validation/conversion déléguée
	 * à `$lib/domain/habits` (pure, testée séparément) — ce composant ne fait qu'assembler
	 * l'état de saisie et appeler le domaine.
	 */
	import type { Habit, Weekday } from '$lib/domain/types';
	import {
		WEEKDAY_ORDER,
		draftToFrequency,
		emptyHabitDraft,
		frequencyToDraft,
		validateHabitDraft,
		weekdayLabel,
		type HabitDraft
	} from '$lib/domain/habits';
	import { toIsoDate } from '$lib/domain/dates';

	interface Props {
		/** Habitude à éditer, ou `undefined` en création. */
		habit?: Habit;
		onSave: (habit: Habit) => void;
		onCancel: () => void;
	}

	let { habit, onSave, onCancel }: Props = $props();

	function initialDraft(): HabitDraft {
		if (!habit) return emptyHabitDraft();
		return { name: habit.name, emoji: habit.emoji, ...frequencyToDraft(habit.frequency) };
	}

	let draft = $state<HabitDraft>(initialDraft());
	let errors = $state<string[]>([]);

	function selectMode(mode: 'interval' | 'weekdays') {
		if (draft.frequencyMode === mode) return;
		// US-001 scénario 3 : bascule de mode = réinitialisation de l'autre mode, un seul actif.
		draft.frequencyMode = mode;
		draft.intervalDays = null;
		draft.weekdays = [];
	}

	function toggleWeekday(day: Weekday) {
		draft.weekdays = draft.weekdays.includes(day)
			? draft.weekdays.filter((d) => d !== day)
			: [...draft.weekdays, day];
	}

	function submit(e: Event) {
		e.preventDefault();
		const result = validateHabitDraft(draft);
		errors = result.errors;
		if (!result.valid) return;

		const anchor =
			habit?.frequency.kind === 'interval' ? habit.frequency.anchor : toIsoDate(new Date());
		const savedHabit: Habit = {
			id: habit?.id ?? crypto.randomUUID(),
			name: draft.name.trim(),
			emoji: draft.emoji,
			frequency: draftToFrequency(draft, anchor),
			createdAt: habit?.createdAt ?? toIsoDate(new Date())
		};
		onSave(savedHabit);
	}
</script>

<form onsubmit={submit} aria-label={habit ? "Modifier l'habitude" : 'Créer une habitude'}>
	<div class="field">
		<label for="habit-name">Nom</label>
		<input id="habit-name" type="text" bind:value={draft.name} placeholder="ex. Boire de l'eau" />
	</div>

	<div class="field">
		<label for="habit-emoji">Emoji</label>
		<input id="habit-emoji" type="text" bind:value={draft.emoji} placeholder="💧" maxlength="4" />
	</div>

	<fieldset class="field">
		<legend>Fréquence</legend>
		<div class="mode-toggle">
			<button
				type="button"
				aria-pressed={draft.frequencyMode === 'interval'}
				onclick={() => selectMode('interval')}
			>
				Intervalle en jours
			</button>
			<button
				type="button"
				aria-pressed={draft.frequencyMode === 'weekdays'}
				onclick={() => selectMode('weekdays')}
			>
				Jours de la semaine
			</button>
		</div>

		{#if draft.frequencyMode === 'interval'}
			<div class="field">
				<label for="habit-interval">Tous les combien de jours ?</label>
				<input
					id="habit-interval"
					type="number"
					min="1"
					bind:value={draft.intervalDays}
					placeholder="2"
				/>
			</div>
		{:else if draft.frequencyMode === 'weekdays'}
			<div class="weekdays" role="group" aria-label="Jours de la semaine">
				{#each WEEKDAY_ORDER as day (day)}
					<label class="weekday">
						<input
							type="checkbox"
							checked={draft.weekdays.includes(day)}
							onchange={() => toggleWeekday(day)}
						/>
						{weekdayLabel(day)}
					</label>
				{/each}
			</div>
		{/if}
	</fieldset>

	{#if errors.length > 0}
		<ul class="errors" role="alert">
			{#each errors as error (error)}
				<li>{error}</li>
			{/each}
		</ul>
	{/if}

	<div class="actions">
		<button type="button" class="secondary" onclick={onCancel}>Annuler</button>
		<button type="submit">{habit ? 'Enregistrer' : 'Créer'}</button>
	</div>
</form>

<style>
	form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		background: var(--surface);
		border: 1px solid var(--surface-border);
		box-shadow: var(--surface-shadow);
		padding: 1rem;
		border-radius: 0.75rem;
	}
	.field {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}
	fieldset {
		border: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	legend {
		padding: 0;
		font-weight: 600;
	}
	label {
		font-size: 0.85rem;
		color: var(--muted);
	}
	input[type='text'],
	input[type='number'] {
		background: var(--bg);
		border: 1px solid var(--surface-border);
		border-radius: 0.35rem;
		color: var(--text);
		padding: 0.5rem;
		min-height: 44px;
	}
	.mode-toggle {
		display: flex;
		gap: 0.5rem;
	}
	.mode-toggle button {
		flex: 1;
		min-height: 44px;
		border-radius: 0.35rem;
		border: 1px solid var(--surface-border);
		background: var(--bg);
		color: var(--text);
	}
	.mode-toggle button[aria-pressed='true'] {
		background: var(--accent);
		color: var(--accent-text);
		border-color: var(--accent);
	}
	.weekdays {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}
	.weekday {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		min-height: 44px;
	}
	.errors {
		color: var(--danger-text);
		margin: 0;
		padding-left: 1.25rem;
		font-size: 0.85rem;
	}
	.actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
	}
	.actions button {
		min-height: 44px;
		padding: 0.5rem 1rem;
		border-radius: 0.35rem;
		border: 1px solid var(--accent);
		background: var(--accent);
		color: var(--accent-text);
		font-weight: 600;
	}
	.actions button.secondary {
		background: transparent;
		color: var(--text);
		border-color: var(--muted);
	}
</style>
