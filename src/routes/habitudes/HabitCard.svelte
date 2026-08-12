<script lang="ts">
	/**
	 * Carte d'une habitude sur l'écran « Habitudes » (US-010 carte pleine largeur) : ouvre
	 * l'édition au clic, propose la suppression par glisser + confirmation (US-013) via
	 * `SwipeToDelete` + `ConfirmDialog` (partagés, `lib/components`), et la mise en pause /
	 * reprise (US-015) via un badge + une action contextuelle sous la carte, sur le même
	 * mécanisme de statut que la suppression. Colocalisé : usage unique dans cette route
	 * (voir CONVENTIONS.md §7).
	 */
	import type { Habit } from '$lib/domain/types';
	import { describeFrequency, describeTarget, isHabitPaused } from '$lib/domain/habits';
	import { SwipeToDelete, ConfirmDialog } from '$lib/components';

	interface Props {
		habit: Habit;
		/** Le bouton de suppression de cette carte est-il révélé (glissement) ? Piloté par le parent
		 * pour n'avoir qu'une seule carte révélée à la fois dans la liste. */
		revealed: boolean;
		onReveal: () => void;
		onCloseReveal: () => void;
		onEdit: (habit: Habit) => void;
		/** Appelé uniquement après confirmation explicite (US-013 scénario 3). */
		onDelete: (habit: Habit) => void;
		/** Met l'habitude en pause (US-015 scénario 1). */
		onPause: (habit: Habit) => void;
		/** Réactive une habitude en pause (US-015 scénario 4). */
		onResume: (habit: Habit) => void;
	}

	let { habit, revealed, onReveal, onCloseReveal, onEdit, onDelete, onPause, onResume }: Props = $props();

	const paused = $derived(isHabitPaused(habit));

	let confirmOpen = $state(false);

	function openConfirm() {
		confirmOpen = true;
	}

	function cancelConfirm() {
		confirmOpen = false;
	}

	function confirmDelete() {
		confirmOpen = false;
		onCloseReveal();
		onDelete(habit);
	}
</script>

<li class="habit-card-item">
	<SwipeToDelete
		{revealed}
		{onReveal}
		{onCloseReveal}
		onDeleteClick={openConfirm}
		deleteLabel={`Supprimer « ${habit.name} »`}
	>
		<button class="habit-row" type="button" onclick={() => onEdit(habit)}>
			<span class="emoji" aria-hidden="true">{habit.emoji}</span>
			<span class="info">
				<span class="name">{habit.name}</span>
				<span class="frequency">{describeFrequency(habit.frequency)}</span>
				{#if habit.target}
					<span class="target">🎯 {describeTarget(habit.target)}</span>
				{/if}
			</span>
			{#if paused}
				<span class="badge" data-status="paused">En pause</span>
			{/if}
		</button>
	</SwipeToDelete>

	<div class="secondary-actions">
		{#if paused}
			<button type="button" class="resume-btn" onclick={() => onResume(habit)}>Réactiver</button>
		{:else}
			<button type="button" class="pause-btn" onclick={() => onPause(habit)}>Mettre en pause</button>
		{/if}
	</div>
</li>

{#if confirmOpen}
	<ConfirmDialog
		message={`Supprimer « ${habit.name} » ? Cette action est définitive.`}
		onConfirm={confirmDelete}
		onCancel={cancelConfirm}
	/>
{/if}

<style>
	.habit-card-item {
		list-style: none;
	}
	.habit-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		width: 100%;
		min-height: 44px;
		padding: var(--card-padding);
		background: var(--surface);
		border: 1px solid var(--surface-border);
		border-left: 4px solid var(--habit-border);
		border-radius: var(--card-radius);
		box-shadow: var(--surface-shadow);
		color: var(--text);
		text-align: left;
	}
	.emoji {
		font-size: 1.5rem;
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
	.frequency {
		font-size: 0.8rem;
		color: var(--muted);
	}
	.target {
		font-size: 0.8rem;
		color: var(--habit-text);
	}
	.badge {
		font-size: 0.7rem;
		padding: 0.15rem 0.6rem;
		border-radius: 1rem;
		white-space: nowrap;
		font-weight: 600;
	}
	.badge[data-status='paused'] {
		color: var(--warning-text);
		background: var(--warning-bg);
		border: 1px solid var(--warning-border);
	}
	.secondary-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
		margin-top: 0.4rem;
	}
	.pause-btn,
	.resume-btn {
		min-height: 36px;
		padding: 0.25rem 0.75rem;
		border-radius: 0.35rem;
		background: transparent;
		font-size: 0.8rem;
	}
	.pause-btn {
		border: 1px solid var(--muted);
		color: var(--muted);
	}
	.resume-btn {
		border: 1px solid var(--habit-border);
		color: var(--habit-text);
	}
</style>
