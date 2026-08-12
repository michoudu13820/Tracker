<script lang="ts">
	/**
	 * Route « Aujourd'hui » — planning quotidien (US-004) : habitudes prévues + tâches du
	 * jour affiché, cochage, navigation entre jours via une frise de dates (US-011) et titre
	 * dynamique (US-012). Habitudes et tâches sont regroupées dans deux sections visuellement
	 * distinctes (scénario 8). `TaskItem` est partagé avec `/taches` (US-002/003) ;
	 * `HabitCheckItem` et `DateStrip` sont colocalisés (besoin propre à cet écran).
	 */
	import { onMount } from 'svelte';
	import { habitsStore } from '$lib/stores/habits.store.svelte';
	import { tasksStore } from '$lib/stores/tasks.store.svelte';
	import { completionsStore } from '$lib/stores/completions.store.svelte';
	import { toIsoDate, dateStripRange, formatPlanningTitleFr } from '$lib/domain/dates';
	import { hasNumericTarget } from '$lib/domain/habits';
	import type { Habit, IsoDate } from '$lib/domain/types';
	import { TaskItem } from '$lib/components';
	import HabitCheckItem from './HabitCheckItem.svelte';
	import HabitProgressItem from './HabitProgressItem.svelte';
	import DateStrip from './DateStrip.svelte';

	/** "Aujourd'hui" réel — sert de référence pour le statut "en retard" des tâches
	 * (US-003 scénario 1bis) et pour le titre dynamique (US-012), indépendamment du jour
	 * affiché dans le planning. */
	const realToday: IsoDate = toIsoDate(new Date());

	/** Jour affiché dans le planning — par défaut le jour courant (scénario 1). */
	let selectedDate = $state<IsoDate>(realToday);

	/** Plage de dates de la frise (US-011 scénario 6) : 8 semaines avant/après aujourd'hui,
	 * fixe (pas de chargement dynamique de semaines supplémentaires — détail d'implémentation
	 * laissé libre par l'US). Ancrée sur `realToday`, pas sur `selectedDate`, pour ne pas
	 * décaler la frise à chaque sélection. */
	const stripDates = dateStripRange(realToday, 8, 8);

	onMount(() => {
		void habitsStore.load();
		void tasksStore.load();
		void completionsStore.load();
	});

	function selectDate(date: IsoDate) {
		selectedDate = date;
	}

	const planningTitle = $derived(formatPlanningTitleFr(selectedDate, realToday));

	const dueHabits = $derived(habitsStore.dueOn(selectedDate));
	const dueTasks = $derived(tasksStore.onDate(selectedDate));

	async function handleHabitToggle(habitId: string, done: boolean) {
		await completionsStore.setHabitDone(habitId, selectedDate, done);
	}

	/** Ajoute une quantité au cumul du jour affiché (US-018 scénarios 2/3/5). */
	async function handleProgressAdd(habit: Habit, amount: number) {
		await completionsStore.addHabitProgress(habit, selectedDate, amount);
	}

	/** Corrige directement la valeur cumulée du jour affiché (US-018 scénario 9). */
	async function handleProgressCorrect(habit: Habit, value: number) {
		await completionsStore.setHabitProgress(habit, selectedDate, value);
	}

	async function handleTaskToggle(taskId: string, done: boolean) {
		await completionsStore.setTaskDone(taskId, done, done ? realToday : undefined);
	}

	async function handleReschedule(taskId: string, newDate: IsoDate) {
		const task = tasksStore.tasks.find((t) => t.id === taskId);
		if (!task) return;
		await tasksStore.upsert({ ...task, date: newDate });
	}
</script>

<svelte:head><title>Tracker — Aujourd'hui</title></svelte:head>

<h1>{planningTitle}</h1>

<DateStrip dates={stripDates} selected={selectedDate} onSelect={selectDate} />

<section aria-labelledby="habits-heading">
	<h2 id="habits-heading">🔁 Habitudes</h2>
	{#if dueHabits.length === 0}
		<p class="muted">Aucune habitude prévue ce jour.</p>
	{:else}
		<ul class="item-list">
			{#each dueHabits as habit (habit.id)}
				{#if hasNumericTarget(habit)}
					<HabitProgressItem
						{habit}
						value={completionsStore.habitProgressValue(habit.id, selectedDate)}
						done={completionsStore.isHabitDone(habit.id, selectedDate)}
						onAdd={(amount) => handleProgressAdd(habit, amount)}
						onCorrect={(value) => handleProgressCorrect(habit, value)}
					/>
				{:else}
					<HabitCheckItem
						{habit}
						done={completionsStore.isHabitDone(habit.id, selectedDate)}
						onToggle={handleHabitToggle}
					/>
				{/if}
			{/each}
		</ul>
	{/if}
</section>

<section aria-labelledby="tasks-heading">
	<h2 id="tasks-heading">✅ Tâches</h2>
	{#if dueTasks.length === 0}
		<p class="muted">Aucune tâche prévue ce jour.</p>
	{:else}
		<ul class="item-list">
			{#each dueTasks as task (task.id)}
				<TaskItem
					{task}
					done={completionsStore.isTaskDone(task.id)}
					today={realToday}
					onToggle={handleTaskToggle}
					onReschedule={handleReschedule}
				/>
			{/each}
		</ul>
	{/if}
</section>

<style>
	.muted {
		color: var(--muted);
	}
	section {
		margin-bottom: 1.5rem;
	}
	section h2 {
		font-size: 1rem;
		margin-bottom: 0.5rem;
	}
	.item-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
</style>
