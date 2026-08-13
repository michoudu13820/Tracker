<script lang="ts">
	/**
	 * Ligne d'habitude à cible chiffrée dans le planning quotidien (US-018) : remplace la case
	 * à cocher habituelle (`HabitCheckItem`) par une barre de progression + un bouton « + » pour
	 * ajouter une quantité (saisie libre, scénarios 1/2/3/5), et une valeur cumulée cliquable
	 * pour la corriger directement (scénario 9). Le statut fait/pas fait dérive uniquement du
	 * cumul face à la cible (US-018 notes — pas de décochage manuel indépendant) : c'est le
	 * store appelant (`completionsStore`) qui le recalcule et le fournit via `done`.
	 * Colocalisée comme `HabitCheckItem` : usage unique dans cette route (CONVENTIONS.md §7).
	 */
	import type { Habit } from '$lib/domain/types';
	import { describeTarget, formatTargetNumber } from '$lib/domain/habits';
	import { parseAmount, progressPercent, validateAmount } from '$lib/domain/progress';

	interface Props {
		/** Habitude à cible chiffrée (garanti par la garde `hasNumericTarget` du parent). */
		habit: Habit;
		/** Valeur cumulée du jour affiché. */
		value: number;
		/** Statut fait/pas fait déjà dérivé par le store (cumul >= cible). */
		done: boolean;
		/** Ajoute une quantité au cumul du jour (scénarios 2/3/5). */
		onAdd: (amount: number) => void;
		/** Remplace directement la valeur cumulée du jour (scénario 9 — correction). */
		onCorrect: (value: number) => void;
		/** Signal doux « manquée hier » (US-025) — informatif uniquement, aucune action de
		 * reprogrammation associée. */
		missedYesterday?: boolean;
	}

	let { habit, value, done, onAdd, onCorrect, missedYesterday = false }: Props = $props();

	const target = $derived(habit.target as NonNullable<Habit['target']>);
	const percent = $derived(progressPercent(value, target.value));
	const overflow = $derived(percent > 100);

	let mode = $state<'closed' | 'add' | 'correct'>('closed');
	let input = $state('');
	let error = $state<string | null>(null);

	function openAdd() {
		mode = 'add';
		input = '';
		error = null;
	}

	function openCorrect() {
		mode = 'correct';
		input = formatTargetNumber(value);
		error = null;
	}

	function close() {
		mode = 'closed';
		input = '';
		error = null;
	}

	function submit(e: Event) {
		e.preventDefault();
		const result = validateAmount(input);
		if (!result.valid) {
			error = result.error ?? null;
			return;
		}
		const amount = parseAmount(input);
		if (mode === 'add') onAdd(amount);
		else onCorrect(amount);
		close();
	}
</script>

<li class="habit-item">
	<div class="row">
		<span class="emoji" aria-hidden="true">{habit.emoji}</span>
		<div class="info">
			<span class="name" class:done>{habit.name}</span>
			<button type="button" class="value" onclick={openCorrect}>
				{formatTargetNumber(value)} / {describeTarget(target)}
			</button>
			{#if missedYesterday}
				<span class="badge" data-status="missed-yesterday">manquée hier</span>
			{/if}
		</div>
		<button
			type="button"
			class="add-btn"
			onclick={openAdd}
			aria-label={`Ajouter une quantité pour « ${habit.name} »`}
		>
			+
		</button>
	</div>

	<div
		class="progress-track"
		role="progressbar"
		aria-valuenow={Math.min(percent, 100)}
		aria-valuemin="0"
		aria-valuemax="100"
		aria-label={`Progression de ${habit.name}`}
	>
		<div class="progress-fill" data-done={done} data-overflow={overflow} style={`width: ${Math.min(percent, 100)}%`}></div>
	</div>

	{#if mode !== 'closed'}
		<form class="entry-form" onsubmit={submit}>
			<label class="entry-label" for={`progress-input-${habit.id}`}>
				{mode === 'add' ? 'Quantité à ajouter' : 'Corriger la valeur cumulée'}
			</label>
			<div class="entry-row">
				<input
					id={`progress-input-${habit.id}`}
					type="text"
					inputmode="decimal"
					bind:value={input}
					placeholder="0,2"
				/>
				<button type="submit">OK</button>
				<button type="button" class="secondary" onclick={close}>Annuler</button>
			</div>
			{#if error}
				<p class="error" role="alert">{error}</p>
			{/if}
		</form>
	{/if}
</li>

<style>
	.habit-item {
		background: var(--surface);
		border: 1px solid var(--surface-border);
		border-left: 4px solid var(--habit-border);
		border-radius: var(--card-radius);
		box-shadow: var(--surface-shadow);
		padding: var(--card-padding);
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.row {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		min-height: 44px;
	}
	.emoji {
		font-size: 1.3rem;
	}
	.info {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-width: 0;
	}
	.name {
		font-weight: 600;
		overflow-wrap: anywhere;
	}
	.name.done {
		text-decoration: line-through;
		color: var(--muted);
	}
	.value {
		align-self: flex-start;
		background: transparent;
		border: none;
		padding: 0;
		font-size: 0.85rem;
		color: var(--habit-text);
		text-decoration: underline dotted;
	}
	.badge {
		align-self: flex-start;
		font-size: 0.7rem;
		padding: 0.15rem 0.6rem;
		border-radius: 1rem;
		white-space: nowrap;
		font-weight: 600;
	}
	.badge[data-status='missed-yesterday'] {
		color: var(--habit-text);
		background: var(--surface);
		border: 1px solid var(--habit-border);
	}
	.add-btn {
		min-width: 44px;
		min-height: 44px;
		border-radius: 0.5rem;
		border: 1px solid var(--accent);
		background: var(--accent);
		color: var(--accent-text);
		font-size: 1.2rem;
		font-weight: 700;
		line-height: 1;
	}
	.progress-track {
		width: 100%;
		height: 0.6rem;
		border-radius: 999px;
		background: var(--bg);
		border: 1px solid var(--surface-border);
		overflow: hidden;
	}
	.progress-fill {
		height: 100%;
		background: var(--accent);
		transition: width 0.2s ease;
	}
	.progress-fill[data-done='true'] {
		background: var(--success-text);
	}
	.progress-fill[data-overflow='true'] {
		background: repeating-linear-gradient(
			45deg,
			var(--success-text),
			var(--success-text) 6px,
			var(--success-bg) 6px,
			var(--success-bg) 12px
		);
	}
	.entry-form {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}
	.entry-label {
		font-size: 0.8rem;
		color: var(--muted);
	}
	.entry-row {
		display: flex;
		gap: 0.5rem;
	}
	.entry-row input {
		flex: 1;
		min-height: 44px;
		background: var(--bg);
		border: 1px solid var(--surface-border);
		border-radius: 0.35rem;
		color: var(--text);
		padding: 0.5rem;
	}
	.entry-row button {
		min-height: 44px;
		padding: 0.5rem 0.75rem;
		border-radius: 0.35rem;
		border: 1px solid var(--accent);
		background: var(--accent);
		color: var(--accent-text);
		font-weight: 600;
	}
	.entry-row button.secondary {
		background: transparent;
		color: var(--text);
		border-color: var(--muted);
	}
	.error {
		color: var(--danger-text);
		font-size: 0.8rem;
		margin: 0;
	}
</style>
