<script lang="ts">
	import { onMount } from 'svelte';
	import { habitsStore } from '$lib/stores/habits.store.svelte';
	import { toIsoDate } from '$lib/domain/dates';
	import { subscribe, pushSchedule, isPushSupported, isStandalone } from '$lib/push/client';

	const today = toIsoDate(new Date());
	let pushStatus = $state<'idle' | 'sending' | 'ok' | 'error' | 'unsupported'>('idle');

	onMount(() => {
		void habitsStore.load();
	});

	let pushError = $state('');

	/** Bouton de test manuel : abonne le navigateur et programme un rappel immédiat (déjà dû). */
	async function testPush() {
		pushError = '';
		if (!isPushSupported()) {
			pushStatus = 'unsupported';
			return;
		}
		pushStatus = 'sending';
		try {
			const sub = await subscribe();
			if (!sub) {
				pushStatus = 'error';
				return;
			}
			await pushSchedule(sub, [{ date: today, sendAt: Date.now() - 1000 }]);
			pushStatus = 'ok';
		} catch (err) {
			pushStatus = 'error';
			pushError = err instanceof Error ? err.message : String(err);
		}
	}
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

	<section class="push-test">
		<button onclick={testPush}>Activer les rappels (test push)</button>
		{#if pushStatus === 'ok'}
			<p class="muted">Abonné, rappel programmé. Déclenche l'envoi côté serveur pour le recevoir tout de suite.</p>
		{:else if pushStatus === 'unsupported'}
			<p class="muted">Web Push indisponible : installe d'abord la PWA via « Ajouter à l'écran d'accueil ».</p>
		{:else if pushStatus === 'error'}
			<p class="muted">Permission refusée ou abonnement impossible.{pushError ? ` (${pushError})` : ''}</p>
		{:else if !isStandalone()}
			<p class="muted">iOS : ouvre l'app depuis l'icône ajoutée à l'écran d'accueil pour que les notifications fonctionnent.</p>
		{/if}
	</section>
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
	.push-test {
		margin-top: 2rem;
		padding-top: 1rem;
		border-top: 1px solid var(--surface);
	}
	.push-test button {
		padding: 0.6rem 1rem;
		border-radius: 0.75rem;
		border: none;
		background: var(--surface);
		font-size: 1rem;
	}
</style>
