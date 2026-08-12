<script lang="ts">
	/**
	 * Formulaire de création/édition d'une tâche ponctuelle (US-002). Colocalisé dans la
	 * route `taches` (utilisé uniquement ici). Validation déléguée à `$lib/domain/tasks`.
	 */
	import type { Task, IsoDate } from '$lib/domain/types';
	import { validateTaskDraft, type TaskDraft } from '$lib/domain/tasks';
	import { toIsoDate } from '$lib/domain/dates';

	interface Props {
		/** Tâche à éditer, ou `undefined` en création. */
		task?: Task;
		onSave: (task: Task) => void;
		onCancel: () => void;
	}

	let { task, onSave, onCancel }: Props = $props();

	function initialDraft(): TaskDraft {
		return { name: task?.name ?? '', date: task?.date ?? null };
	}

	let draft = $state<TaskDraft>(initialDraft());
	let errors = $state<string[]>([]);

	function submit(e: Event) {
		e.preventDefault();
		const result = validateTaskDraft(draft);
		errors = result.errors;
		if (!result.valid) return;

		const savedTask: Task = {
			id: task?.id ?? crypto.randomUUID(),
			name: draft.name.trim(),
			date: draft.date as IsoDate,
			createdAt: task?.createdAt ?? toIsoDate(new Date())
		};
		onSave(savedTask);
	}
</script>

<form onsubmit={submit} aria-label={task ? 'Modifier la tâche' : 'Créer une tâche'}>
	<div class="field">
		<label for="task-name">Nom</label>
		<input
			id="task-name"
			type="text"
			bind:value={draft.name}
			placeholder="ex. Prendre rendez-vous dentiste"
		/>
	</div>

	<div class="field">
		<label for="task-date">Date</label>
		<input id="task-date" type="date" bind:value={draft.date} />
	</div>

	{#if errors.length > 0}
		<ul class="errors" role="alert">
			{#each errors as error (error)}
				<li>{error}</li>
			{/each}
		</ul>
	{/if}

	<div class="actions">
		<button type="button" class="secondary" onclick={onCancel}>Annuler</button>
		<button type="submit">{task ? 'Enregistrer' : 'Créer'}</button>
	</div>
</form>

<style>
	form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		background: var(--surface);
		border: 1px solid var(--surface-border);
		box-shadow: var(--surface-shadow);
		padding: 1rem;
		border-radius: 0.75rem;
	}
	.field {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}
	label {
		font-size: 0.85rem;
		color: var(--muted);
	}
	input[type='text'],
	input[type='date'] {
		background: var(--bg);
		border: 1px solid var(--surface-border);
		border-radius: 0.35rem;
		color: var(--text);
		padding: 0.5rem;
		min-height: 44px;
	}
	.errors {
		color: var(--danger-text);
		margin: 0;
		padding-left: 1.25rem;
		font-size: 0.85rem;
	}
	.actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
	}
	.actions button {
		min-height: 44px;
		padding: 0.5rem 1rem;
		border-radius: 0.35rem;
		border: 1px solid var(--accent);
		background: var(--accent);
		color: var(--accent-text);
		font-weight: 600;
	}
	.actions button.secondary {
		background: transparent;
		color: var(--text);
		border-color: var(--muted);
	}
</style>
