<script lang="ts">
	/**
	 * Route « Tâches » — liste + création/édition des tâches ponctuelles (US-002),
	 * signalement et reprogrammation des tâches en retard (US-003). State : `tasksStore` +
	 * `completionsStore`. Rendu de chaque tâche délégué à `TaskItem` (partagé avec le
	 * planning `/`, US-004) ; `TaskForm` partagé avec l'ajout rapide du planning (US-026).
	 */
	import { onMount } from 'svelte';
	import { tasksStore } from '$lib/stores/tasks.store.svelte';
	import { completionsStore } from '$lib/stores/completions.store.svelte';
	import { resyncReminders } from '$lib/stores/resync-reminders';
	import { toIsoDate } from '$lib/domain/dates';
	import {
		partitionByCompletion,
		recentlyCompletedTasks,
		sortTasksByDateThenDay,
		visibleTasks
	} from '$lib/domain/tasks';
	import type { IsoDate, Task } from '$lib/domain/types';
	import { TaskItem, TaskForm, CompletedTasksSection } from '$lib/components';

	let formOpen = $state(false);
	let editingTask = $state<Task | undefined>(undefined);

	/** Tâche dont le bouton de suppression est actuellement révélé (US-014) — une seule à la
	 * fois : glisser une autre carte referme celle-ci (scénario 5, cohérent avec US-013). */
	let revealedTaskId = $state<string | null>(null);

	const today: IsoDate = toIsoDate(new Date());

	onMount(() => {
		void tasksStore.load();
		void completionsStore.load();
	});

	function openCreate() {
		editingTask = undefined;
		formOpen = true;
	}

	function openEdit(task: Task) {
		editingTask = task;
		formOpen = true;
	}

	async function handleSave(task: Task) {
		await tasksStore.upsert(task);
		formOpen = false;
		editingTask = undefined;
	}

	function handleCancel() {
		formOpen = false;
		editingTask = undefined;
	}

	/** Coche/décoche une tâche et resynchronise la fenêtre de rappels (US-023 scénarios 1/2/5). */
	async function handleToggle(taskId: string, done: boolean) {
		await completionsStore.setTaskDone(taskId, done, done ? today : undefined);
		await resyncReminders();
	}

	async function handleReschedule(taskId: string, newDate: IsoDate) {
		const task = tasksStore.tasks.find((t) => t.id === taskId);
		if (!task) return;
		await tasksStore.upsert({ ...task, date: newDate });
	}

	async function handleDelete(taskId: string) {
		await tasksStore.remove(taskId);
	}

	/** Tâches actives (US-014 : jamais les supprimées), triées par date pour une lecture
	 * chronologique — puis, à date égale, selon exactement la même règle que le planning
	 * (US-038 scénario 9 : heure limite croissante, sans heure limite ensuite, ordre de création
	 * en départage). */
	const sortedTasks = $derived(sortTasksByDateThenDay(visibleTasks(tasksStore.tasks)));

	/** Tâches séparées en « à faire » et « accomplies » (US-041 scénario 5), ordre préservé. */
	const partition = $derived(partitionByCompletion(sortedTasks, completionsStore.taskCompletions));

	/**
	 * Tâches accomplies affichées ici : seulement celles des 7 derniers jours (US-041 scénario 6).
	 * Les plus anciennes — et celles dont la date d'accomplissement n'a jamais été enregistrée
	 * (scénario 9) — sont masquées de cet écran, **jamais supprimées** : elles restent consultables
	 * sur le planning de leur jour, qui n'applique aucun horizon.
	 */
	const recentlyCompleted = $derived(
		recentlyCompletedTasks(partition.completed, completionsStore.taskCompletions, today)
	);
</script>

<svelte:head><title>Tracker — Tâches</title></svelte:head>

<h1>Tâches</h1>

{#if formOpen}
	<TaskForm task={editingTask} onSave={handleSave} onCancel={handleCancel} />
{:else}
	<button class="add" onclick={openCreate}>+ Nouvelle tâche</button>
{/if}

{#if tasksStore.loaded && sortedTasks.length === 0 && !formOpen}
	<p class="muted">Aucune tâche pour l'instant.</p>
{:else}
	{#if partition.pending.length > 0}
		<ul class="task-list">
			{#each partition.pending as task (task.id)}
				<TaskItem
					{task}
					done={completionsStore.isTaskDone(task.id)}
					{today}
					onToggle={handleToggle}
					onReschedule={handleReschedule}
					onEdit={openEdit}
					revealed={revealedTaskId === task.id}
					onReveal={() => (revealedTaskId = task.id)}
					onCloseReveal={() => (revealedTaskId = null)}
					onDelete={handleDelete}
				/>
			{/each}
		</ul>
	{:else}
		<p class="muted">Aucune tâche à faire.</p>
	{/if}

	<CompletedTasksSection count={recentlyCompleted.length}>
		<ul class="task-list">
			{#each recentlyCompleted as task (task.id)}
				<TaskItem
					{task}
					done={completionsStore.isTaskDone(task.id)}
					{today}
					onToggle={handleToggle}
					onReschedule={handleReschedule}
					onEdit={openEdit}
					revealed={revealedTaskId === task.id}
					onReveal={() => (revealedTaskId = task.id)}
					onCloseReveal={() => (revealedTaskId = null)}
					onDelete={handleDelete}
				/>
			{/each}
		</ul>
	</CompletedTasksSection>
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
	.task-list {
		list-style: none;
		padding: 0;
		margin: 1rem 0 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
</style>
