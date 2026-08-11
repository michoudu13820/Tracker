<script lang="ts">
	import { onMount } from 'svelte';
	import { habitsStore } from '$lib/stores/habits.store.svelte';
	import { toIsoDate } from '$lib/domain/dates';

	const today = toIsoDate(new Date());

	onMount(() => {
		void habitsStore.load();
	});
</script>

<svelte:head>
	<title>Tracker — mes habitudes</title>
</svelte:head>

<main>
	<h1>Tracker</h1>
	<p class="muted">Suivi d'habitudes 100% local. Aujourd'hui : {today}</p>

	{#if !habitsStore.loaded}
		<p class="muted">Chargement…</p>
	{:else if habitsStore.dueOn(today).length === 0}
		<p class="muted">Aucune habitude prévue aujourd'hui. Le scaffold est prêt : implémente US-001 pour commencer.</p>
	{:else}
		<ul>
			{#each habitsStore.dueOn(today) as habit (habit.id)}
				<li>{habit.emoji} {habit.name}</li>
			{/each}
		</ul>
	{/if}
</main>

<style>
	main {
		max-width: 42rem;
		margin: 0 auto;
		padding: 1.5rem;
	}
	h1 {
		margin: 0 0 0.25rem;
	}
	.muted {
		color: var(--muted);
	}
	ul {
		list-style: none;
		padding: 0;
	}
	li {
		padding: 0.75rem 1rem;
		background: var(--surface);
		border-radius: 0.75rem;
		margin-bottom: 0.5rem;
	}
</style>
