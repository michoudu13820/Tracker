<script lang="ts">
	/**
	 * Route « Habitudes » — liste + création/édition des habitudes (US-001).
	 * State : `habitsStore` ($lib/stores/habits.store.svelte). Logique de formulaire
	 * déléguée à `HabitForm.svelte` (colocalisé) + `$lib/domain/habits` (pur).
	 */
	import { onMount } from 'svelte';
	import { habitsStore } from '$lib/stores/habits.store.svelte';
	import { completionsStore } from '$lib/stores/completions.store.svelte';
	import { visibleHabits } from '$lib/domain/habits';
	import type { Habit } from '$lib/domain/types';
	import HabitForm from './HabitForm.svelte';
	import HabitCard from './HabitCard.svelte';

	let formOpen = $state(false);
	let editingHabit = $state<Habit | undefined>(undefined);

	/** Habitude dont le bouton de suppression est actuellement révélé (US-013) — une seule à
	 * la fois : glisser une autre carte referme celle-ci (scénario 5). */
	let revealedHabitId = $state<string | null>(null);

	onMount(() => {
		void habitsStore.load();
		void completionsStore.load();
	});

	/** Habitudes affichées dans la liste de gestion : jamais les supprimées (US-013 scénario 3). */
	const displayedHabits = $derived(visibleHabits(habitsStore.habits));

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
			/>
		{/each}
	</ul>
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
</style>
