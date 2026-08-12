<script lang="ts">
	/**
	 * Route « Résumé » — tableau de synthèse sur une période (US-005) : semaine/mois en
	 * colonnes-jours (cellule binaire), année en colonnes-mois (cellule % colorée selon les
	 * seuils — US-006). Charge `habitsStore`, `tasksStore`, `completionsStore`,
	 * `settingsStore` (pour les seuils, avec les valeurs par défaut en attendant US-006).
	 */
	import { onMount } from 'svelte';
	import { habitsStore } from '$lib/stores/habits.store.svelte';
	import { tasksStore } from '$lib/stores/tasks.store.svelte';
	import { completionsStore } from '$lib/stores/completions.store.svelte';
	import { settingsStore } from '$lib/stores/settings.store.svelte';
	import { toIsoDate, formatIsoDateFr, monthLabelFr } from '$lib/domain/dates';
	import {
		monthDates,
		shiftReference,
		weekDates,
		yearMonths,
		type SummaryPeriod
	} from '$lib/domain/summary';
	import type { IsoDate } from '$lib/domain/types';
	import WeekMonthTable from './WeekMonthTable.svelte';
	import YearTable from './YearTable.svelte';

	let period = $state<SummaryPeriod>('week');
	let reference = $state<IsoDate>(toIsoDate(new Date()));

	onMount(() => {
		void habitsStore.load();
		void tasksStore.load();
		void completionsStore.load();
		void settingsStore.load();
	});

	function selectPeriod(p: SummaryPeriod) {
		period = p;
	}

	function goPrevious() {
		reference = shiftReference(period, reference, -1);
	}

	function goNext() {
		reference = shiftReference(period, reference, 1);
	}

	const dates = $derived(period === 'month' ? monthDates(reference) : weekDates(reference));
	const months = $derived(yearMonths(reference));

	const periodLabel = $derived.by(() => {
		if (period === 'week') {
			return `Semaine du ${formatIsoDateFr(dates[0])} au ${formatIsoDateFr(dates.at(-1) ?? dates[0])}`;
		}
		if (period === 'month') {
			const [year, month] = reference.split('-').map(Number);
			return `${monthLabelFr(month)} ${year}`;
		}
		return reference.split('-')[0];
	});
</script>

<svelte:head><title>Tracker — Résumé</title></svelte:head>

<h1>Résumé</h1>

<div class="period-selector" role="group" aria-label="Période">
	<button type="button" aria-pressed={period === 'week'} onclick={() => selectPeriod('week')}>
		Semaine
	</button>
	<button type="button" aria-pressed={period === 'month'} onclick={() => selectPeriod('month')}>
		Mois
	</button>
	<button type="button" aria-pressed={period === 'year'} onclick={() => selectPeriod('year')}>
		Année
	</button>
</div>

<nav class="period-nav" aria-label="Navigation par période">
	<button type="button" onclick={goPrevious} aria-label="Période précédente">◀</button>
	<span class="period-label">{periodLabel}</span>
	<button type="button" onclick={goNext} aria-label="Période suivante">▶</button>
</nav>

{#if habitsStore.habits.length === 0}
	<p class="muted">Créez une habitude pour voir apparaître le résumé.</p>
{:else if period === 'year'}
	<YearTable
		{months}
		habits={habitsStore.habits}
		habitCompletions={completionsStore.habitCompletions}
		tasks={tasksStore.tasks}
		taskCompletions={completionsStore.taskCompletions}
		thresholds={settingsStore.thresholds}
	/>
{:else}
	<WeekMonthTable
		{dates}
		habits={habitsStore.habits}
		habitCompletions={completionsStore.habitCompletions}
		tasks={tasksStore.tasks}
		taskCompletions={completionsStore.taskCompletions}
	/>
{/if}

<style>
	.muted {
		color: var(--muted);
	}
	.period-selector {
		display: flex;
		gap: 0.5rem;
		margin: 1rem 0;
	}
	.period-selector button {
		flex: 1;
		min-height: 44px;
		border-radius: 0.35rem;
		border: 1px solid var(--surface-border);
		background: var(--surface);
		color: var(--text);
	}
	.period-selector button[aria-pressed='true'] {
		background: var(--accent);
		color: var(--accent-text);
		border-color: var(--accent);
	}
	.period-nav {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		margin-bottom: 1.5rem;
	}
	.period-nav button {
		min-height: 44px;
		min-width: 44px;
		border-radius: 0.35rem;
		border: 1px solid var(--surface-border);
		background: var(--surface);
		color: var(--text);
	}
	.period-label {
		min-width: 10rem;
		text-align: center;
		font-weight: 600;
	}
</style>
