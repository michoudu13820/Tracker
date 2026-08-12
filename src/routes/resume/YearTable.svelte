<script lang="ts">
	/**
	 * Tableau du résumé pour la période « année » (US-005 scénario 3) : colonnes = 12 mois,
	 * une ligne par habitude avec le % de complétion coloré (vert/jaune/rouge selon les
	 * seuils, US-005/US-006), cellule neutre si aucune occurrence prévue ce mois-là
	 * (scénario 6bis) ; + une ligne « Tâches » avec le % de tâches validées par mois
	 * (neutre si aucune tâche, scénario 5). Colocalisé : usage unique dans `/resume`.
	 */
	import type {
		ColorThresholds,
		Habit,
		HabitCompletion,
		Task,
		TaskCompletion
	} from '$lib/domain/types';
	import { colorFor, habitMonthPercent, taskMonthPercent } from '$lib/domain/summary';
	import { monthLabelFr } from '$lib/domain/dates';

	interface Props {
		months: { year: number; month: number }[];
		habits: Habit[];
		habitCompletions: HabitCompletion[];
		tasks: Task[];
		taskCompletions: TaskCompletion[];
		thresholds: ColorThresholds;
	}

	let { months, habits, habitCompletions, tasks, taskCompletions, thresholds }: Props = $props();
</script>

<div class="table-wrap">
	<table>
		<thead>
			<tr>
				<th scope="col" class="row-header">Habitude</th>
				{#each months as m (m.month)}
					<th scope="col">{monthLabelFr(m.month).slice(0, 3)}</th>
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
					{#each months as m (m.month)}
						{@const percent = habitMonthPercent(habit, m.year, m.month, habitCompletions)}
						<td
							data-neutral={percent === null}
							data-color={percent === null ? undefined : colorFor(percent, thresholds)}
							aria-label={`${habit.name} — ${monthLabelFr(m.month)} — ${percent === null ? 'aucune occurrence prévue' : `${percent}%`}`}
						>
							{percent === null ? '—' : `${percent}%`}
						</td>
					{/each}
				</tr>
			{/each}
			<tr class="tasks-row">
				<th scope="row" class="row-header">Tâches</th>
				{#each months as m (m.month)}
					{@const percent = taskMonthPercent(tasks, taskCompletions, m.year, m.month)}
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
		font-size: 0.8rem;
	}
	th,
	td {
		padding: 0.4rem 0.4rem;
		text-align: center;
		border-bottom: 1px solid var(--surface-border);
	}
	.row-header {
		text-align: left;
		white-space: nowrap;
		font-weight: 600;
	}
	td[data-neutral='true'] {
		background: var(--bg);
		opacity: 0.6;
		color: var(--muted);
	}
	td[data-color='green'] {
		background: var(--success-bg);
		color: var(--success-text);
	}
	td[data-color='yellow'] {
		background: var(--warning-bg);
		color: var(--warning-text);
	}
	td[data-color='red'] {
		background: var(--danger-bg);
		color: var(--danger-text);
	}
	.tasks-row th {
		font-style: italic;
		color: var(--muted);
	}
</style>
