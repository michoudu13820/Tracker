<script lang="ts">
	/**
	 * Tableau du résumé pour les périodes « semaine » et « mois » (US-005 scénarios 1/2) :
	 * colonnes = jours, une ligne par habitude avec cellule binaire (fait / non fait / neutre
	 * si non prévu, scénario 6), + une ligne « Tâches » avec le % de tâches validées par jour
	 * (ou neutre si aucune tâche, scénario 5). Colocalisé : usage unique dans `/resume`.
	 */
	import type { Habit, HabitCompletion, IsoDate, Task, TaskCompletion } from '$lib/domain/types';
	import { habitCellStatus, taskDayPercent } from '$lib/domain/summary';
	import { formatIsoDateFr } from '$lib/domain/dates';

	interface Props {
		dates: IsoDate[];
		habits: Habit[];
		habitCompletions: HabitCompletion[];
		tasks: Task[];
		taskCompletions: TaskCompletion[];
	}

	let { dates, habits, habitCompletions, tasks, taskCompletions }: Props = $props();

	function shortDay(iso: IsoDate): string {
		return formatIsoDateFr(iso).slice(0, 5); // DD/MM
	}

	const statusSymbol: Record<'done' | 'not-done' | 'not-due', string> = {
		done: '✓',
		'not-done': '·',
		'not-due': ''
	};
</script>

<div class="table-wrap">
	<table>
		<thead>
			<tr>
				<th scope="col" class="row-header">Habitude</th>
				{#each dates as date (date)}
					<th scope="col">{shortDay(date)}</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each habits as habit (habit.id)}
				<tr>
					<th scope="row" class="row-header">
						<span aria-hidden="true">{habit.emoji}</span>
						{habit.name}
					</th>
					{#each dates as date (date)}
						{@const status = habitCellStatus(habit, date, habitCompletions)}
						<td data-status={status} aria-label={`${habit.name} — ${shortDay(date)} — ${status}`}>
							{statusSymbol[status]}
						</td>
					{/each}
				</tr>
			{/each}
			<tr class="tasks-row">
				<th scope="row" class="row-header">Tâches</th>
				{#each dates as date (date)}
					{@const percent = taskDayPercent(tasks, taskCompletions, date)}
					<td data-neutral={percent === null}>
						{percent === null ? '—' : `${percent}%`}
					</td>
				{/each}
			</tr>
		</tbody>
	</table>
</div>

<style>
	.table-wrap {
		overflow-x: auto;
	}
	table {
		border-collapse: collapse;
		width: 100%;
		font-size: 0.85rem;
	}
	th,
	td {
		padding: 0.4rem 0.5rem;
		text-align: center;
		border-bottom: 1px solid var(--surface-border);
	}
	.row-header {
		text-align: left;
		white-space: nowrap;
		font-weight: 600;
	}
	td[data-status='done'] {
		color: var(--success-text);
		font-weight: 700;
	}
	td[data-status='not-done'] {
		color: var(--muted);
	}
	td[data-status='not-due'] {
		background: var(--bg);
		opacity: 0.6;
	}
	.tasks-row th {
		font-style: italic;
		color: var(--muted);
	}
	.tasks-row td[data-neutral='true'] {
		color: var(--muted);
	}
</style>
