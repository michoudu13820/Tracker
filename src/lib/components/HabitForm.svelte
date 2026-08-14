<script lang="ts">
	/**
	 * Formulaire de création/édition d'une habitude (US-001). Partagé entre `/habitudes` et
	 * l'ajout rapide depuis le planning `/` (US-026) — déplacé dans `$lib/components` dès son
	 * usage par une 2ᵉ route (voir CONVENTIONS.md §7). Logique de validation/conversion déléguée
	 * à `$lib/domain/habits` (pure, testée séparément) — ce composant ne fait qu'assembler
	 * l'état de saisie et appeler le domaine.
	 */
	import type { Habit, MonthDay, Weekday } from '$lib/domain/types';
	import {
		MONTH_DAY_ORDER,
		TARGET_UNITS,
		WEEKDAY_ORDER,
		colorToDraft,
		draftToColor,
		draftToFrequency,
		draftToTarget,
		emptyHabitDraft,
		frequencyToDraft,
		monthDayLabel,
		targetToDraft,
		targetUnitLabel,
		validateHabitDraft,
		weekdayLabel,
		type FrequencyMode,
		type HabitDraft
	} from '$lib/domain/habits';
	import { toIsoDate } from '$lib/domain/dates';
	import { CardColorPicker } from '$lib/components';

	interface Props {
		/** Habitude à éditer, ou `undefined` en création. */
		habit?: Habit;
		onSave: (habit: Habit) => void;
		onCancel: () => void;
	}

	let { habit, onSave, onCancel }: Props = $props();

	function initialDraft(): HabitDraft {
		if (!habit) return emptyHabitDraft();
		return {
			name: habit.name,
			emoji: habit.emoji,
			...frequencyToDraft(habit.frequency),
			...targetToDraft(habit.target),
			...colorToDraft(habit.color)
		};
	}

	let draft = $state<HabitDraft>(initialDraft());
	let errors = $state<string[]>([]);

	function selectMode(mode: FrequencyMode) {
		if (draft.frequencyMode === mode) return;
		// US-001 scénario 3 / US-032 scénario 4 : bascule de mode = réinitialisation des deux
		// autres modes, un seul actif à la fois (dans les deux sens).
		draft.frequencyMode = mode;
		draft.intervalDays = null;
		draft.weekdays = [];
		draft.monthdays = [];
	}

	function toggleWeekday(day: Weekday) {
		draft.weekdays = draft.weekdays.includes(day)
			? draft.weekdays.filter((d) => d !== day)
			: [...draft.weekdays, day];
	}

	/** Bascule cocher/décocher d'un quantième (US-032 scénario 3), symétrique de `toggleWeekday`. */
	function toggleMonthDay(day: MonthDay) {
		draft.monthdays = draft.monthdays.includes(day)
			? draft.monthdays.filter((d) => d !== day)
			: [...draft.monthdays, day];
	}

	function submit(e: Event) {
		e.preventDefault();
		const result = validateHabitDraft(draft);
		errors = result.errors;
		if (!result.valid) return;

		const anchor =
			habit?.frequency.kind === 'interval' ? habit.frequency.anchor : toIsoDate(new Date());
		const savedHabit: Habit = {
			// US-036 scénario 5 : une édition ne touche QUE les champs du formulaire — les champs
			// gérés ailleurs (statut de pause/suppression US-013/US-015, date de reprise
			// automatique US-027) sont repris tels quels, jamais réinitialisés.
			...habit,
			id: habit?.id ?? crypto.randomUUID(),
			name: draft.name.trim(),
			emoji: draft.emoji,
			frequency: draftToFrequency(draft, anchor),
			createdAt: habit?.createdAt ?? toIsoDate(new Date()),
			target: draftToTarget(draft),
			// US-036 scénarios 3/6 : `undefined` quand la teinte par défaut est sélectionnée —
			// l'habitude reste alors strictement identique à une habitude sans couleur.
			color: draftToColor(draft)
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
			<button
				type="button"
				aria-pressed={draft.frequencyMode === 'monthdays'}
				onclick={() => selectMode('monthdays')}
			>
				Jours du mois
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
		{:else if draft.frequencyMode === 'monthdays'}
			<div class="monthdays" role="group" aria-label="Jours du mois">
				{#each MONTH_DAY_ORDER as day (day)}
					<label class="monthday">
						<input
							type="checkbox"
							checked={draft.monthdays.includes(day)}
							onchange={() => toggleMonthDay(day)}
							aria-label={`${monthDayLabel(day)} du mois`}
						/>
						<span aria-hidden="true">{day}</span>
					</label>
				{/each}
			</div>
			<p class="hint">
				Un jour absent du mois (le 31 en avril, le 29/30/31 en février) est reporté au dernier
				jour du mois.
			</p>
		{/if}
	</fieldset>

	<fieldset class="field">
		<legend>Cible chiffrée (optionnel)</legend>
		<label class="target-toggle">
			<input type="checkbox" bind:checked={draft.hasTarget} />
			Suivre une quantité
		</label>

		{#if draft.hasTarget}
			<div class="target-fields">
				<div class="field">
					<label for="habit-target-value">Valeur cible</label>
					<input
						id="habit-target-value"
						type="number"
						step="0.01"
						min="0"
						bind:value={draft.targetValue}
						placeholder="1.5"
					/>
				</div>
				<div class="field">
					<label for="habit-target-unit">Unité</label>
					<select id="habit-target-unit" bind:value={draft.targetUnit}>
						{#each TARGET_UNITS as unit (unit)}
							<option value={unit}>{targetUnitLabel(unit)}</option>
						{/each}
					</select>
				</div>
			</div>
		{/if}
	</fieldset>

	<CardColorPicker
		value={draft.color}
		onChange={(color) => (draft.color = color)}
		idPrefix="habit-color"
	/>

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
		flex-wrap: wrap;
		gap: 0.5rem;
	}
	.mode-toggle button {
		/* 3 modes depuis US-032 : on autorise le retour à la ligne plutôt que d'écraser les
		   libellés sur la largeur d'un iPhone. */
		flex: 1 1 8rem;
		padding: 0 0.4rem;
		font-size: 0.85rem;
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
	/* Sélecteur de quantièmes 1–31 (US-032) : grille de 7 colonnes, cibles tactiles ≥ 40px,
	   même principe de bascule que les jours de semaine ci-dessus. */
	.monthdays {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 0.3rem;
	}
	.monthday {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.monthday input {
		position: absolute;
		width: 100%;
		height: 100%;
		margin: 0;
		opacity: 0;
		cursor: pointer;
	}
	.monthday span {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		min-height: 40px;
		border: 1px solid var(--surface-border);
		border-radius: 0.35rem;
		background: var(--bg);
		color: var(--text);
		font-size: 0.85rem;
	}
	.monthday input:checked + span {
		background: var(--accent);
		color: var(--accent-text);
		border-color: var(--accent);
		font-weight: 600;
	}
	.monthday input:focus-visible + span {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}
	.hint {
		margin: 0;
		font-size: 0.75rem;
		color: var(--muted);
	}
	.target-toggle {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		min-height: 44px;
		font-size: 0.9rem;
		color: var(--text);
	}
	.target-fields {
		display: flex;
		gap: 0.75rem;
	}
	.target-fields .field {
		flex: 1;
	}
	select {
		background: var(--bg);
		border: 1px solid var(--surface-border);
		border-radius: 0.35rem;
		color: var(--text);
		padding: 0.5rem;
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
