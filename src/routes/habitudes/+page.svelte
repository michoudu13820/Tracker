<script lang="ts">
	/**
	 * Route « Habitudes » — liste + création/édition des habitudes (US-001).
	 * State : `habitsStore` ($lib/stores/habits.store.svelte). Logique de formulaire
	 * déléguée à `HabitForm.svelte` (colocalisé) + `$lib/domain/habits` (pur).
	 */
	import { onMount } from 'svelte';
	import { habitsStore } from '$lib/stores/habits.store.svelte';
	import { describeFrequency } from '$lib/domain/habits';
	import type { Habit } from '$lib/domain/types';
	import HabitForm from './HabitForm.svelte';

	let formOpen = $state(false);
	let editingHabit = $state<Habit | undefined>(undefined);

	onMount(() => {
		void habitsStore.load();
	});

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
		formOpen = false;
		editingHabit = undefined;
	}

	function handleCancel() {
		formOpen = false;
		editingHabit = undefined;
	}
</script>

<svelte:head><title>Tracker — Habitudes</title></svelte:head>

<h1>Habitudes</h1>

{#if formOpen}
	<HabitForm habit={editingHabit} onSave={handleSave} onCancel={handleCancel} />
{:else}
	<button class="add" onclick={openCreate}>+ Nouvelle habitude</button>
{/if}

{#if habitsStore.loaded && habitsStore.habits.length === 0 && !formOpen}
	<p class="muted">Aucune habitude pour l'instant. Créez-en une pour commencer à la suivre.</p>
{:else}
	<ul class="habit-list">
		{#each habitsStore.habits as habit (habit.id)}
			<li>
				<button class="habit-row" onclick={() => openEdit(habit)}>
					<span class="emoji" aria-hidden="true">{habit.emoji}</span>
					<span class="info">
						<span class="name">{habit.name}</span>
						<span class="frequency">{describeFrequency(habit.frequency)}</span>
					</span>
				</button>
			</li>
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
</style>
