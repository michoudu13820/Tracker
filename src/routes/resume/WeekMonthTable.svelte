<script lang="ts">
	/**
	 * Tableau du résumé pour les périodes « semaine » et « mois » (US-005 scénarios 1/2) :
	 * colonnes = jours, une ligne par habitude, + une ligne « Tâches » avec le % de tâches
	 * validées par jour (ou « — » si aucune tâche, scénario 5). Colocalisé : usage unique
	 * dans `/resume`.
	 *
	 * Mise en page (US-034) : en période **semaine**, le tableau tient intégralement dans la
	 * largeur de l'écran (7 colonnes, aucun défilement horizontal) grâce à `table-layout: fixed`,
	 * une colonne d'en-tête de ligne bornée et des en-têtes de jour compacts. La période **mois**
	 * conserve strictement son rendu et son défilement horizontal d'origine (scénario 7 :
	 * 28 à 31 colonnes ne peuvent pas tenir à l'écran — arbitrage produit explicite).
	 *
	 * Langage visuel (US-035) : chaque cellule d'habitude porte l'un des trois symboles
	 * ✅ / ⬜ / ❌, ou reste neutre et vide quand l'habitude n'était pas prévue. Le symbole n'est
	 * jamais la seule information : il est `aria-hidden`, et la cellule porte un libellé textuel
	 * explicite (« Yoga — lundi 10 août — fait »). Les trois états se distinguent aussi par la
	 * forme et par une teinte de fond, jamais par la seule couleur (scénarios 13/15). La vue
	 * **année** (`YearTable`) n'est pas concernée : elle conserve son pourcentage coloré.
	 */
	import type { Habit, HabitCompletion, IsoDate, Task, TaskCompletion } from '$lib/domain/types';
	import {
		CELL_STATE_LABELS,
		habitCellState,
		taskDayPercent,
		taskDayState,
		type HabitCellState
	} from '$lib/domain/summary';
	import { formatIsoDateFr, formatIsoDateLongFr, weekdayShortLabelFr } from '$lib/domain/dates';

	interface Props {
		dates: IsoDate[];
		habits: Habit[];
		habitCompletions: HabitCompletion[];
		tasks: Task[];
		taskCompletions: TaskCompletion[];
		/** Période affichée : seule `'week'` est contrainte à tenir sans défilement (US-034). */
		period?: 'week' | 'month';
		/** Jour courant réel : met en évidence sa colonne (US-034 scénario 3) et sert d'axe
		 * « journée écoulée ou non » pour les trois états (US-035 scénarios 3/4/17). */
		today: IsoDate;
	}

	let {
		dates,
		habits,
		habitCompletions,
		tasks,
		taskCompletions,
		period = 'week',
		today
	}: Props = $props();

	function shortDay(iso: IsoDate): string {
		return formatIsoDateFr(iso).slice(0, 5); // DD/MM
	}

	/** Quantième seul (sans zéro initial), pour l'en-tête compact de la vue semaine (US-034). */
	function dayOfMonth(iso: IsoDate): number {
		return Number(iso.split('-')[2]);
	}

	/** Symboles demandés par l'utilisateur (US-035) — décoratifs : toujours `aria-hidden`,
	 * doublés du libellé textuel de `CELL_STATE_LABELS`. */
	const STATE_SYMBOL: Record<HabitCellState, string> = {
		done: '✅',
		todo: '⬜',
		missed: '❌',
		'not-due': ''
	};

	/** Libellé accessible d'une cellule (US-035 scénario 13) : habitude, date en toutes lettres
	 * et état en français — jamais le nom brut de l'emoji. */
	function cellLabel(habitName: string, date: IsoDate, state: HabitCellState): string {
		return `${habitName} — ${formatIsoDateLongFr(date)} — ${CELL_STATE_LABELS[state]}`;
	}

	/** Libellé accessible de la ligne « Tâches » (US-035 scénario 12) : le pourcentage y est
	 * explicitement restitué, l'`aria-label` de la cellule remplaçant sinon son texte visible. */
	function taskCellLabel(date: IsoDate, percent: number | null, state: HabitCellState): string {
		const day = formatIsoDateLongFr(date);
		if (percent === null) return `Tâches — ${day} — aucune tâche`;
		return `Tâches — ${day} — ${percent} % — ${CELL_STATE_LABELS[state]}`;
	}

	const LEGEND: HabitCellState[] = ['done', 'todo', 'missed'];
</script>

<div class="table-wrap" data-period={period}>
	<table data-period={period}>
		<thead>
			<tr>
				<th scope="col" class="row-header">Habitude</th>
				{#each dates as date (date)}
					<th scope="col" data-today={date === today}>
						{#if period === 'week'}
							<!-- Jour de la semaine + quantième visibles, date complète réservée aux
							     lecteurs d'écran (US-034 scénario 3). -->
							<span class="col-weekday" aria-hidden="true">{weekdayShortLabelFr(date)}</span>
							<span class="col-day" aria-hidden="true">{dayOfMonth(date)}</span>
							<span class="visually-hidden">{formatIsoDateLongFr(date)}</span>
						{:else}
							{shortDay(date)}
						{/if}
					</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each habits as habit (habit.id)}
				<tr>
					<th scope="row" class="row-header" title={habit.name}>
						<span class="row-header-inner">
							<span class="emoji" aria-hidden="true">{habit.emoji}</span>
							<span class="habit-name">{habit.name}</span>
						</span>
					</th>
					{#each dates as date (date)}
						{@const state = habitCellState(habit, date, habitCompletions, today)}
						<td
							data-state={state}
							data-today={date === today}
							aria-label={cellLabel(habit.name, date, state)}
						>
							<span aria-hidden="true">{STATE_SYMBOL[state]}</span>
						</td>
					{/each}
				</tr>
			{/each}
			<tr class="tasks-row">
				<th scope="row" class="row-header">Tâches</th>
				{#each dates as date (date)}
					{@const percent = taskDayPercent(tasks, taskCompletions, date)}
					{@const state = taskDayState(percent, date, today)}
					<td
						data-state={state}
						data-today={date === today}
						aria-label={taskCellLabel(date, percent, state)}
					>
						{percent === null ? '—' : `${percent}%`}
					</td>
				{/each}
			</tr>
		</tbody>
	</table>
</div>

<!-- Légende compacte des trois symboles (US-035 scénario 14), affichée sous le tableau en
     semaine comme en mois, et elle-même lisible par un lecteur d'écran. -->
<ul class="legend" aria-label="Légende des symboles">
	{#each LEGEND as state (state)}
		<li><span aria-hidden="true">{STATE_SYMBOL[state]}</span> {CELL_STATE_LABELS[state]}</li>
	{/each}
</ul>

<style>
	.table-wrap {
		overflow-x: auto;
	}
	/* US-034 scénario 1 : en vue semaine, aucun défilement horizontal n'est nécessaire ni
	   possible — la largeur est contrainte, pas seulement masquée (voir `table-layout` plus bas). */
	.table-wrap[data-period='week'] {
		overflow-x: hidden;
	}
	table {
		border-collapse: collapse;
		width: 100%;
		font-size: 0.85rem;
	}
	/* Largeurs réparties par le navigateur sans tenir compte du contenu : c'est ce qui garantit
	   qu'un nom d'habitude très long ne pousse jamais le tableau au-delà de l'écran (scénario 6). */
	table[data-period='week'] {
		table-layout: fixed;
	}
	th,
	td {
		padding: 0.4rem 0.5rem;
		text-align: center;
		border-bottom: 1px solid var(--surface-border);
	}
	table[data-period='week'] th,
	table[data-period='week'] td {
		padding: 0.4rem 0.1rem;
	}
	.row-header {
		text-align: left;
		white-space: nowrap;
		font-weight: 600;
	}
	/* Colonne d'en-tête de ligne bornée : le reste de la largeur est réparti à parts égales
	   entre les 7 jours (scénarios 1/4/5). */
	table[data-period='week'] .row-header {
		width: 5.5rem;
		padding-right: 0.35rem;
	}
	table[data-period='week'] .row-header-inner {
		display: flex;
		align-items: baseline;
		gap: 0.2rem;
		overflow: hidden;
	}
	.emoji {
		flex: none;
	}
	/* Nom tronqué visuellement (ellipse) mais **complet dans le DOM** : il reste donc lisible
	   par un lecteur d'écran et disponible en info-bulle (scénarios 2/6). */
	table[data-period='week'] .habit-name {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		min-width: 0;
	}
	.col-weekday,
	.col-day {
		display: block;
		line-height: 1.15;
	}
	.col-weekday {
		font-size: 0.7rem;
		font-weight: 500;
		color: var(--muted);
	}
	.col-day {
		font-size: 0.85rem;
	}
	/* Jour courant distingué (scénario 3) : traitement porté par la bordure et la graisse, pour
	   rester lisible quel que soit le fond de la cellule. */
	th[data-today='true'] {
		color: var(--accent-text);
		background: var(--accent);
		border-radius: 0.35rem 0.35rem 0 0;
	}
	th[data-today='true'] .col-weekday {
		color: var(--accent-text);
	}
	td[data-today='true'] {
		box-shadow: inset 1px 0 0 var(--accent), inset -1px 0 0 var(--accent);
	}
	/* Trois états + cellule neutre (US-035). La distinction repose sur trois canaux cumulés —
	   forme du symbole, teinte de fond et libellé accessible — jamais sur la seule couleur
	   (scénario 13). Les teintes viennent de la palette centralisée (US-009), qui possède déjà
	   sa déclinaison sombre : les trois états restent donc contrastés en mode sombre sans
	   variable supplémentaire (scénario 15). */
	td[data-state='done'] {
		background: var(--success-bg);
		color: var(--success-text);
	}
	td[data-state='todo'] {
		background: var(--surface);
		color: var(--muted);
	}
	td[data-state='missed'] {
		background: var(--danger-bg);
		color: var(--danger-text);
	}
	/* Neutre : inchangé par rapport à l'existant (scénario 5). */
	td[data-state='not-due'] {
		background: var(--bg);
		opacity: 0.6;
	}
	/* Les symboles doivent rester lisibles sans zoom tout en tenant dans une colonne de ~34 px
	   en vue semaine (scénario 16 / US-034). */
	td span {
		font-size: 0.9rem;
		line-height: 1.2;
	}
	.tasks-row th {
		font-style: italic;
		color: var(--muted);
	}
	/* Ligne « Tâches » (scénario 12) : le pourcentage reste la valeur affichée et lisible, seul
	   le fond adopte le code à trois états — aucun emoji, pour ne pas concurrencer visuellement
	   les lignes d'habitudes. */
	.tasks-row td {
		font-weight: 600;
	}
	.legend {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem 0.9rem;
		margin: 0.6rem 0 0;
		padding: 0;
		list-style: none;
		font-size: 0.75rem;
		color: var(--muted);
	}
	.legend li {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}
	/* Écrans plus larges (paysage, bureau) : la colonne d'en-tête reprend de l'air plutôt que
	   de laisser 7 colonnes disproportionnées (scénario 8). */
	@media (min-width: 30rem) {
		table[data-period='week'] .row-header {
			width: 9rem;
		}
		table[data-period='week'] th,
		table[data-period='week'] td {
			padding: 0.4rem 0.25rem;
		}
	}
	.visually-hidden {
		position: absolute;
		width: 1px;
		height: 1px;
		margin: -1px;
		padding: 0;
		overflow: hidden;
		clip: rect(0 0 0 0);
		white-space: nowrap;
		border: 0;
	}
</style>
