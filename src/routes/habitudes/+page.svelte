<script lang="ts">
	/**
	 * Route « Habitudes » — liste + création/édition des habitudes (US-001).
	 * State : `habitsStore` ($lib/stores/habits.store.svelte). Logique de formulaire
	 * déléguée à `HabitForm` ($lib/components — partagé avec l'ajout rapide du planning,
	 * US-026) + `$lib/domain/habits` (pur).
	 */
	import { onMount } from 'svelte';
	import { habitsStore } from '$lib/stores/habits.store.svelte';
	import { completionsStore } from '$lib/stores/completions.store.svelte';
	import { activeHabits, pausedOrDeletedHabits } from '$lib/domain/habits';
	import { toIsoDate } from '$lib/domain/dates';
	import type { Habit, IsoDate } from '$lib/domain/types';
	import { HabitForm } from '$lib/components';
	import HabitCard from './HabitCard.svelte';

	let formOpen = $state(false);
	let editingHabit = $state<Habit | undefined>(undefined);

	/** Jour de référence pour l'indicateur de régularité de chaque carte (US-024). */
	const today: IsoDate = toIsoDate(new Date());

	/** Habitude dont le bouton de suppression est actuellement révélé (US-013) — une seule à
	 * la fois : glisser une autre carte referme celle-ci (scénario 5). */
	let revealedHabitId = $state<string | null>(null);

	onMount(() => {
		void (async () => {
			await habitsStore.load();
			// US-027 scénario 4 : reprise automatique évaluée à l'ouverture de l'écran (en plus de
			// l'ouverture de l'app dans `+layout.svelte`) — best-effort, idempotent si déjà appliquée.
			await habitsStore.applyAutoResume(today);
		})();
		void completionsStore.load();
	});

	/** Habitudes actives, liste principale de gestion (US-027 scénario 1). */
	const displayedHabits = $derived(activeHabits(habitsStore.habits));
	/** Habitudes en pause ou supprimées, regroupées dans une section dédiée distincte
	 * (US-027 scénario 1) — une habitude supprimée (US-013) redevient donc visible ici, à la
	 * différence du comportement précédent (masquée entièrement) : voir notes d'implémentation. */
	const pausedOrDeleted = $derived(pausedOrDeletedHabits(habitsStore.habits));

	function openCreate() {
		editingHabit = undefined;
		formOpen = true;
	}

	function openEdit(habit: Habit) {
		editingHabit = habit;
		formOpen = true;
	}

	async function handleSave(habit: Habit) {
		await habitsStore.upsert(habit);
		// US-018 scénario 10 : une cible éditée doit réévaluer le statut fait/pas fait des jours
		// déjà suivis, sans toucher au cumul brut enregistré (no-op si l'habitude n'a pas/plus
		// de cible chiffrée, cf. US-017 scénario 6).
		await completionsStore.recomputeTargetCompletions(habit);
		formOpen = false;
		editingHabit = undefined;
	}

	function handleCancel() {
		formOpen = false;
		editingHabit = undefined;
	}

	async function handleDelete(habit: Habit) {
		await habitsStore.remove(habit.id);
	}

	/** Mise en pause (US-015 scénario 1) : réutilise `setStatus`, mécanisme partagé avec US-013. */
	async function handlePause(habit: Habit) {
		await habitsStore.setStatus(habit.id, 'paused');
	}

	/** Réactivation d'une habitude en pause (US-015 scénario 4). */
	async function handleResume(habit: Habit) {
		await habitsStore.setStatus(habit.id, 'active');
	}

	/** Définit ou retire la date de reprise automatique d'une habitude en pause (US-027
	 * scénarios 3/5). */
	async function handleSetResumeAt(habit: Habit, resumeAt: IsoDate | undefined) {
		await habitsStore.setResumeAt(habit.id, resumeAt);
	}
</script>

<svelte:head><title>Tracker — Habitudes</title></svelte:head>

<h1>Habitudes</h1>

{#if formOpen}
	<HabitForm habit={editingHabit} onSave={handleSave} onCancel={handleCancel} />
{:else}
	<button class="add" onclick={openCreate}>+ Nouvelle habitude</button>
{/if}

{#if habitsStore.loaded && displayedHabits.length === 0 && !formOpen}
	<p class="muted">Aucune habitude pour l'instant. Créez-en une pour commencer à la suivre.</p>
{:else}
	<ul class="habit-list">
		{#each displayedHabits as habit (habit.id)}
			<HabitCard
				{habit}
				revealed={revealedHabitId === habit.id}
				onReveal={() => (revealedHabitId = habit.id)}
				onCloseReveal={() => (revealedHabitId = null)}
				onEdit={openEdit}
				onDelete={handleDelete}
				onPause={handlePause}
				onResume={handleResume}
				onSetResumeAt={handleSetResumeAt}
				completions={completionsStore.habitCompletions}
				{today}
			/>
		{/each}
	</ul>
{/if}

{#if pausedOrDeleted.length > 0}
	<section aria-labelledby="paused-deleted-heading" class="paused-deleted-section">
		<h2 id="paused-deleted-heading">En pause / Supprimées</h2>
		<ul class="habit-list">
			{#each pausedOrDeleted as habit (habit.id)}
				<HabitCard
					{habit}
					revealed={revealedHabitId === habit.id}
					onReveal={() => (revealedHabitId = habit.id)}
					onCloseReveal={() => (revealedHabitId = null)}
					onEdit={openEdit}
					onDelete={handleDelete}
					onPause={handlePause}
					onResume={handleResume}
					onSetResumeAt={handleSetResumeAt}
					completions={completionsStore.habitCompletions}
					{today}
				/>
			{/each}
		</ul>
	</section>
{/if}

<style>
	.muted {
		color: var(--muted);
	}
	.add {
		min-height: 44px;
		padding: 0.5rem 1rem;
		border-radius: 0.35rem;
		border: 1px solid var(--accent);
		background: var(--accent);
		color: var(--accent-text);
		font-weight: 600;
		margin-block: 1rem;
	}
	.habit-list {
		list-style: none;
		padding: 0;
		margin: 1rem 0 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.paused-deleted-section {
		margin-top: 2rem;
	}
	.paused-deleted-section h2 {
		font-size: 0.95rem;
		color: var(--muted);
		margin: 0;
	}
</style>
