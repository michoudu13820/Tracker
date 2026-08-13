<script lang="ts">
	/**
	 * Élément de tâche ponctuelle réutilisable — utilisé par `/taches` (US-002/US-003) et
	 * `/` (planning quotidien, US-004) : cochage, badge de statut (fait / à faire / en retard),
	 * action de reprogrammation quand la tâche est en retard (US-003), et suppression par
	 * glisser + confirmation (US-014) — réservée à `/taches` : disponible uniquement si
	 * `onDelete` est fourni (scénario 6 : absente sur le planning `/`, comme `onEdit`).
	 * Partagé entre ≥ 2 routes → placé dans `lib/components` (voir CONVENTIONS.md §7).
	 */
	import type { IsoDate, Task } from '$lib/domain/types';
	import { taskStatus, validateReschedule } from '$lib/domain/tasks';
	import { formatIsoDateFr } from '$lib/domain/dates';
	import { SwipeToDelete, ConfirmDialog } from '$lib/components';

	interface Props {
		task: Task;
		done: boolean;
		/** Date de référence pour le calcul du retard — toujours "aujourd'hui" réel,
		 * indépendamment de la date de planning affichée (US-003 scénario 1bis). */
		today: IsoDate;
		onToggle: (taskId: string, done: boolean) => void;
		onReschedule: (taskId: string, newDate: IsoDate) => void;
		/** Action d'édition optionnelle (utilisée par `/taches`, absente sur le planning `/`). */
		onEdit?: (task: Task) => void;
		/** Le bouton de suppression de cette carte est-il révélé (glissement) ? Piloté par le
		 * parent pour n'avoir qu'une seule carte révélée à la fois dans la liste (US-014). */
		revealed?: boolean;
		onReveal?: () => void;
		onCloseReveal?: () => void;
		/** Action de suppression optionnelle (US-014 scénario 6 : fournie uniquement par
		 * `/taches`, absente sur le planning `/` — active la fonctionnalité de glisser). */
		onDelete?: (taskId: string) => void;
	}

	let {
		task,
		done,
		today,
		onToggle,
		onReschedule,
		onEdit,
		revealed = false,
		onReveal,
		onCloseReveal,
		onDelete
	}: Props = $props();

	const status = $derived(taskStatus(task, done, today));

	let reprogramOpen = $state(false);
	let newDate = $state<IsoDate | null>(null);
	let error = $state<string | null>(null);
	let confirmOpen = $state(false);

	function openReprogram() {
		reprogramOpen = true;
		newDate = null;
		error = null;
	}

	function cancelReprogram() {
		reprogramOpen = false;
		error = null;
	}

	function submitReprogram(e: Event) {
		e.preventDefault();
		const result = validateReschedule(newDate);
		if (!result.valid) {
			error = result.errors[0];
			return;
		}
		onReschedule(task.id, newDate as IsoDate);
		reprogramOpen = false;
	}

	function openConfirmDelete() {
		confirmOpen = true;
	}

	function cancelConfirmDelete() {
		confirmOpen = false;
	}

	function confirmDelete() {
		confirmOpen = false;
		onCloseReveal?.();
		onDelete?.(task.id);
	}

	const statusLabel: Record<typeof status, string> = {
		done: 'Faite',
		due: 'À faire',
		overdue: 'En retard'
	};
</script>

{#snippet row()}
	<label class="row">
		<input
			type="checkbox"
			checked={done}
			onchange={(e) => onToggle(task.id, (e.currentTarget as HTMLInputElement).checked)}
			aria-label={`Marquer « ${task.name} » comme faite`}
		/>
		<span class="icon" aria-hidden="true">✅</span>
		<span class="info">
			<span class="name" class:done>{task.name}</span>
			<span class="date"
				>{formatIsoDateFr(task.date)}{#if task.dueTime}
					<span class="due-time">· jusqu'à {task.dueTime}</span>
				{/if}</span
			>
		</span>
		<span class="badge" data-status={status}>{statusLabel[status]}</span>
	</label>
{/snippet}

<li class="task-item" data-status={status}>
	{#if onDelete}
		<SwipeToDelete
			{revealed}
			onReveal={() => onReveal?.()}
			onCloseReveal={() => onCloseReveal?.()}
			onDeleteClick={openConfirmDelete}
			deleteLabel={`Supprimer « ${task.name} »`}
		>
			{@render row()}
		</SwipeToDelete>
	{:else}
		{@render row()}
	{/if}

	<div class="secondary-actions">
		{#if status === 'overdue' && !reprogramOpen}
			<button type="button" class="reprogram-btn" onclick={openReprogram}>Reprogrammer</button>
		{/if}
		{#if onEdit}
			<button type="button" class="edit-btn" onclick={() => onEdit?.(task)}>Modifier</button>
		{/if}
	</div>

	{#if reprogramOpen}
		<form class="reprogram-form" onsubmit={submitReprogram} aria-label="Reprogrammer la tâche">
			<label for={`reschedule-${task.id}`}>Nouvelle date</label>
			<input id={`reschedule-${task.id}`} type="date" bind:value={newDate} />
			{#if error}
				<p class="error" role="alert">{error}</p>
			{/if}
			<div class="actions">
				<button type="button" class="secondary" onclick={cancelReprogram}>Annuler</button>
				<button type="submit">Valider</button>
			</div>
		</form>
	{/if}
</li>

{#if confirmOpen}
	<ConfirmDialog
		message={`Supprimer « ${task.name} » (${formatIsoDateFr(task.date)}) ? Cette action est définitive.`}
		onConfirm={confirmDelete}
		onCancel={cancelConfirmDelete}
	/>
{/if}

<style>
	.task-item {
		background: var(--surface);
		border: 1px solid var(--surface-border);
		border-left: 4px solid var(--accent);
		border-radius: var(--card-radius);
		box-shadow: var(--surface-shadow);
		padding: var(--card-padding);
		width: 100%;
	}
	.row {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		min-height: 44px;
	}
	.icon {
		font-size: 1.2rem;
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
	.name.done {
		text-decoration: line-through;
		color: var(--muted);
	}
	.date {
		font-size: 0.8rem;
		color: var(--muted);
	}
	.due-time {
		font-weight: 600;
	}
	.badge {
		font-size: 0.7rem;
		padding: 0.15rem 0.6rem;
		border-radius: 1rem;
		white-space: nowrap;
		font-weight: 600;
	}
	.badge[data-status='done'] {
		color: var(--success-text);
		background: var(--success-bg);
		border: 1px solid var(--success-border);
	}
	.badge[data-status='due'] {
		color: var(--muted);
		background: var(--bg);
		border: 1px solid var(--surface-border);
	}
	.badge[data-status='overdue'] {
		color: var(--danger-text);
		background: var(--danger-bg);
		border: 1px solid var(--danger-border);
	}
	.secondary-actions {
		display: flex;
		gap: 0.5rem;
		margin-top: 0.4rem;
	}
	.reprogram-btn,
	.edit-btn {
		min-height: 36px;
		padding: 0.25rem 0.75rem;
		border-radius: 0.35rem;
		background: transparent;
		font-size: 0.8rem;
	}
	.reprogram-btn {
		border: 1px solid var(--danger-border);
		color: var(--danger-text);
	}
	.edit-btn {
		border: 1px solid var(--muted);
		color: var(--muted);
	}
	.reprogram-form {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-top: 0.5rem;
		padding-top: 0.5rem;
		border-top: 1px solid var(--surface-border);
	}
	.reprogram-form label {
		font-size: 0.8rem;
		color: var(--muted);
	}
	.reprogram-form input[type='date'] {
		background: var(--bg);
		border: 1px solid var(--surface-border);
		border-radius: 0.35rem;
		color: var(--text);
		padding: 0.4rem;
		min-height: 40px;
	}
	.error {
		color: var(--danger-text);
		font-size: 0.8rem;
		margin: 0;
	}
	.actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
	}
	.actions button {
		min-height: 40px;
		padding: 0.4rem 0.8rem;
		border-radius: 0.35rem;
		border: 1px solid var(--accent);
		background: var(--accent);
		color: var(--accent-text);
		font-weight: 600;
		font-size: 0.85rem;
	}
	.actions button.secondary {
		background: transparent;
		color: var(--text);
		border-color: var(--muted);
	}
</style>
