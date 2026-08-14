<script lang="ts">
	/**
	 * Formulaire de création/édition d'une tâche ponctuelle (US-002). Partagé entre `/taches` et
	 * l'ajout rapide depuis le planning `/` (US-026) — déplacé dans `$lib/components` dès son
	 * usage par une 2ᵉ route (voir CONVENTIONS.md §7). Validation déléguée à `$lib/domain/tasks`.
	 */
	import type { Task, IsoDate } from '$lib/domain/types';
	import {
		draftToTaskColor,
		draftToUrgent,
		taskColorToDraft,
		validateTaskDraft,
		type TaskDraft
	} from '$lib/domain/tasks';
	import { DEFAULT_CARD_COLOR } from '$lib/domain/card-colors';
	import { toIsoDate, roundTimeToQuarterHour } from '$lib/domain/dates';
	import { CardColorPicker } from '$lib/components';

	interface Props {
		/** Tâche à éditer, ou `undefined` en création. */
		task?: Task;
		/** Date pré-remplie à la création depuis le planning (US-026 scénario 3) — ignorée en
		 * édition (la date déjà enregistrée de la tâche prévaut toujours). */
		defaultDate?: IsoDate;
		onSave: (task: Task) => void;
		onCancel: () => void;
	}

	let { task, defaultDate, onSave, onCancel }: Props = $props();

	function initialDraft(): TaskDraft {
		return {
			name: task?.name ?? '',
			date: task?.date ?? defaultDate ?? null,
			dueTime: task?.dueTime ?? null,
			...taskColorToDraft(task?.color),
			// US-039 scénarios 2/11 : désactivé par défaut à la création comme dans l'ajout rapide.
			urgent: task?.urgent === true
		};
	}

	let draft = $state<TaskDraft>(initialDraft());
	let errors = $state<string[]>([]);

	function submit(e: Event) {
		e.preventDefault();
		const result = validateTaskDraft(draft);
		errors = result.errors;
		if (!result.valid) return;

		// Heure limite optionnelle (US-021 scénario 3) : toujours arrondie au quart d'heure,
		// jamais stockée à la minute près, même si le sélecteur du navigateur l'a permis.
		const dueTime = draft.dueTime ? roundTimeToQuarterHour(draft.dueTime) : undefined;

		// US-037 scénarios 3/5 : la teinte par défaut n'est pas persistée — une tâche remise en
		// « Lavande » redevient strictement indiscernable d'une tâche n'ayant jamais eu de couleur.
		const color = draftToTaskColor(draft);

		const savedTask: Task = {
			// US-037 scénario 7 : une édition ne touche QUE les champs du formulaire — les champs
			// gérés ailleurs (statut de suppression US-014) sont repris tels quels.
			...task,
			id: task?.id ?? crypto.randomUUID(),
			name: draft.name.trim(),
			date: draft.date as IsoDate,
			createdAt: task?.createdAt ?? toIsoDate(new Date()),
			dueTime,
			color,
			// US-039 scénarios 2/4 : `undefined` quand le marquage n'est pas activé.
			urgent: draftToUrgent(draft)
		};
		onSave(savedTask);
	}
</script>

<form
	onsubmit={submit}
	aria-label={task ? 'Modifier la tâche' : 'Créer une tâche'}
	novalidate
>
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

	<div class="field">
		<label for="task-due-time">Heure limite (optionnelle)</label>
		<input id="task-due-time" type="time" step="900" bind:value={draft.dueTime} />
	</div>

	<!-- Marquage d'urgence (US-039) : réservé aux tâches ponctuelles, jamais aux habitudes. -->
	<label class="urgent-toggle">
		<input type="checkbox" bind:checked={draft.urgent} />
		Urgente
	</label>

	<CardColorPicker
		value={draft.color ?? DEFAULT_CARD_COLOR}
		onChange={(color) => (draft.color = color)}
		idPrefix="task-color"
	/>

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
	.urgent-toggle {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		min-height: 44px;
		font-size: 0.9rem;
		color: var(--text);
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
