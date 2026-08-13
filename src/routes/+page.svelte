<script lang="ts">
	/**
	 * Route « Aujourd'hui » — planning quotidien (US-004) : habitudes prévues + tâches du
	 * jour affiché, cochage, navigation entre jours via une frise de dates (US-011) et titre
	 * dynamique (US-012). Habitudes et tâches sont regroupées dans deux sections visuellement
	 * distinctes (scénario 8). `TaskItem`/`HabitForm`/`TaskForm` sont partagés avec les autres
	 * routes (US-002/003, US-001, US-026) ; `HabitCheckItem` et `DateStrip` sont colocalisés
	 * (besoin propre à cet écran).
	 */
	import { onMount } from 'svelte';
	import { habitsStore } from '$lib/stores/habits.store.svelte';
	import { tasksStore } from '$lib/stores/tasks.store.svelte';
	import { completionsStore } from '$lib/stores/completions.store.svelte';
	import { resyncReminders } from '$lib/stores/resync-reminders';
	import { toIsoDate, dateStripRange, formatPlanningTitleFr } from '$lib/domain/dates';
	import { hasNumericTarget } from '$lib/domain/habits';
	import { missedYesterday } from '$lib/domain/regularity';
	import type { Habit, IsoDate, Task } from '$lib/domain/types';
	import { TaskItem, HabitForm, TaskForm } from '$lib/components';
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

	/** Coche/décoche une habitude (US-004 scénarios 4/5) et resynchronise la fenêtre de rappels
	 * (US-023 scénarios 1/2/5) : réduit, sans l'éliminer (best-effort, ADR-001), le risque de
	 * rappel sur un élément déjà fait. */
	async function handleHabitToggle(habitId: string, done: boolean) {
		await completionsStore.setHabitDone(habitId, selectedDate, done);
		await resyncReminders();
	}

	/** Ajoute une quantité au cumul du jour affiché (US-018 scénarios 2/3/5). */
	async function handleProgressAdd(habit: Habit, amount: number) {
		await completionsStore.addHabitProgress(habit, selectedDate, amount);
		await resyncReminders();
	}

	/** Corrige directement la valeur cumulée du jour affiché (US-018 scénario 9). */
	async function handleProgressCorrect(habit: Habit, value: number) {
		await completionsStore.setHabitProgress(habit, selectedDate, value);
		await resyncReminders();
	}

	/** Coche/décoche une tâche (US-023 scénarios 1/2/5 : resynchronise aussi la fenêtre des
	 * rappels nominatifs de tâches à heure limite, US-022). */
	async function handleTaskToggle(taskId: string, done: boolean) {
		await completionsStore.setTaskDone(taskId, done, done ? realToday : undefined);
		await resyncReminders();
	}

	async function handleReschedule(taskId: string, newDate: IsoDate) {
		const task = tasksStore.tasks.find((t) => t.id === taskId);
		if (!task) return;
		await tasksStore.upsert({ ...task, date: newDate });
	}

	/**
	 * Ajout rapide depuis le planning (US-026) : bouton visible quel que soit le jour affiché
	 * (scénario 1), choix du type d'élément (scénario 2), formulaires réutilisés tels quels
	 * (US-001/US-002 — mêmes règles de validation, aucune redéfinition).
	 */
	type QuickAddMode = 'closed' | 'choice' | 'habit' | 'task';
	let quickAdd = $state<QuickAddMode>('closed');

	function openQuickAdd() {
		quickAdd = 'choice';
	}

	function cancelQuickAdd() {
		quickAdd = 'closed';
	}

	/** Création d'habitude depuis l'ajout rapide (scénario 4) : mêmes règles qu'US-001 ; elle
	 * apparaît immédiatement dans le planning si due au jour affiché (dérivé réactivement de
	 * `habitsStore.habits` via `dueOn`, aucune action supplémentaire nécessaire). */
	async function handleQuickAddHabit(habit: Habit) {
		await habitsStore.upsert(habit);
		quickAdd = 'closed';
	}

	/** Création de tâche depuis l'ajout rapide (scénario 3) : date pré-remplie avec le jour
	 * affiché, modifiable ; apparaît immédiatement dans le planning de ce jour. */
	async function handleQuickAddTask(task: Task) {
		await tasksStore.upsert(task);
		quickAdd = 'closed';
	}
</script>

<svelte:head><title>Tracker — Aujourd'hui</title></svelte:head>

<h1>{planningTitle}</h1>

<DateStrip dates={stripDates} selected={selectedDate} onSelect={selectDate} />

<div class="quick-add">
	{#if quickAdd === 'closed'}
		<button type="button" class="quick-add-btn" onclick={openQuickAdd}>+ Ajouter</button>
	{:else if quickAdd === 'choice'}
		<div class="quick-add-choice" role="group" aria-label="Que voulez-vous ajouter ?">
			<button type="button" onclick={() => (quickAdd = 'habit')}>Nouvelle habitude</button>
			<button type="button" onclick={() => (quickAdd = 'task')}>Nouvelle tâche</button>
			<button type="button" class="secondary" onclick={cancelQuickAdd}>Annuler</button>
		</div>
	{:else if quickAdd === 'habit'}
		<HabitForm onSave={handleQuickAddHabit} onCancel={cancelQuickAdd} />
	{:else if quickAdd === 'task'}
		<TaskForm defaultDate={selectedDate} onSave={handleQuickAddTask} onCancel={cancelQuickAdd} />
	{/if}
</div>

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
						missedYesterday={missedYesterday(habit, completionsStore.habitCompletions, realToday)}
					/>
				{:else}
					<HabitCheckItem
						{habit}
						done={completionsStore.isHabitDone(habit.id, selectedDate)}
						onToggle={handleHabitToggle}
						missedYesterday={missedYesterday(habit, completionsStore.habitCompletions, realToday)}
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
	.quick-add {
		margin: 1rem 0;
	}
	.quick-add-btn {
		width: 100%;
		min-height: 44px;
		padding: 0.5rem 1rem;
		border-radius: 0.35rem;
		border: 1px solid var(--accent);
		background: var(--accent);
		color: var(--accent-text);
		font-weight: 600;
	}
	.quick-add-choice {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}
	.quick-add-choice button {
		flex: 1;
		min-width: 8rem;
		min-height: 44px;
		padding: 0.5rem 1rem;
		border-radius: 0.35rem;
		border: 1px solid var(--accent);
		background: var(--accent);
		color: var(--accent-text);
		font-weight: 600;
	}
	.quick-add-choice button.secondary {
		background: transparent;
		color: var(--text);
		border-color: var(--muted);
		flex: 0 1 100%;
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
