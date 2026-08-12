<script lang="ts">
	/**
	 * Route « Tâches » — liste + création/édition des tâches ponctuelles (US-002),
	 * signalement et reprogrammation des tâches en retard (US-003). State : `tasksStore` +
	 * `completionsStore`. Rendu de chaque tâche délégué à `TaskItem` (partagé avec le
	 * planning `/`, US-004).
	 */
	import { onMount } from 'svelte';
	import { tasksStore } from '$lib/stores/tasks.store.svelte';
	import { completionsStore } from '$lib/stores/completions.store.svelte';
	import { toIsoDate } from '$lib/domain/dates';
	import { visibleTasks } from '$lib/domain/tasks';
	import type { IsoDate, Task } from '$lib/domain/types';
	import { TaskItem } from '$lib/components';
	import TaskForm from './TaskForm.svelte';

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

	async function handleToggle(taskId: string, done: boolean) {
		await completionsStore.setTaskDone(taskId, done, done ? today : undefined);
	}

	async function handleReschedule(taskId: string, newDate: IsoDate) {
		const task = tasksStore.tasks.find((t) => t.id === taskId);
		if (!task) return;
		await tasksStore.upsert({ ...task, date: newDate });
	}

	async function handleDelete(taskId: string) {
		await tasksStore.remove(taskId);
	}

	/** Tâches actives (US-014 : jamais les supprimées), triées par date pour une lecture chronologique. */
	const sortedTasks = $derived(
		[...visibleTasks(tasksStore.tasks)].sort((a, b) => a.date.localeCompare(b.date))
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
	<ul class="task-list">
		{#each sortedTasks as task (task.id)}
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
