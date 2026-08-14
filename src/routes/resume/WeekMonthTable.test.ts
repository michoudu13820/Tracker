// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import WeekMonthTable from './WeekMonthTable.svelte';
import type { Habit, HabitCompletion, Task, TaskCompletion } from '$lib/domain/types';

const habit: Habit = {
	id: 'h1',
	name: 'Yoga',
	emoji: '🧘',
	frequency: { kind: 'weekdays', weekdays: [1, 3] }, // lundi, mercredi
	createdAt: '2026-01-01'
};

const dates = ['2026-08-10', '2026-08-11', '2026-08-12']; // lundi, mardi, mercredi
const today = '2026-08-12'; // mercredi

describe('WeekMonthTable (US-005 scénarios 1/2/6, langage à trois états US-035)', () => {
	it('distingue fait / à faire / non prévu selon la fréquence et la date (scénarios 1/6)', () => {
		const completions: HabitCompletion[] = [{ habitId: 'h1', date: '2026-08-10', done: true }];
		render(WeekMonthTable, {
			dates,
			habits: [habit],
			habitCompletions: completions,
			tasks: [],
			taskCompletions: [],
			today
		});

		expect(screen.getByLabelText('Yoga — lundi 10 août — fait')).toHaveAttribute(
			'data-state',
			'done'
		);
		expect(screen.getByLabelText('Yoga — mercredi 12 août — à faire')).toHaveAttribute(
			'data-state',
			'todo'
		);
		expect(screen.getByLabelText('Yoga — mardi 11 août — non prévu')).toHaveAttribute(
			'data-state',
			'not-due'
		);
	});

	it('ne montre ni pourcentage ni couleur graduelle sur une cellule d’habitude', () => {
		render(WeekMonthTable, {
			dates,
			habits: [habit],
			habitCompletions: [],
			tasks: [],
			taskCompletions: [],
			today
		});
		expect(screen.queryByText(/%/)).toBeNull();
	});
});

describe('WeekMonthTable — habitude à cible chiffrée (US-019 scénario 1/3)', () => {
	const targetHabit: Habit = {
		id: 'h2',
		name: "Boire de l'eau",
		emoji: '💧',
		frequency: { kind: 'weekdays', weekdays: [1, 3] }, // lundi, mercredi
		createdAt: '2026-01-01',
		target: { value: 1.5, unit: 'L' }
	};

	it('US-035 scénario 9 — utilise les mêmes états que les habitudes « case à cocher », sans quantité ni pourcentage', () => {
		const completions: HabitCompletion[] = [{ habitId: 'h2', date: '2026-08-10', done: true }];
		render(WeekMonthTable, {
			dates,
			habits: [targetHabit],
			habitCompletions: completions,
			tasks: [],
			taskCompletions: [],
			today
		});

		expect(screen.getByLabelText("Boire de l'eau — lundi 10 août — fait")).toHaveAttribute(
			'data-state',
			'done'
		);
		expect(screen.getByLabelText("Boire de l'eau — mercredi 12 août — à faire")).toHaveAttribute(
			'data-state',
			'todo'
		);
		expect(screen.queryByText(/1,5/)).toBeNull();
		expect(screen.queryByText(/%/)).toBeNull();
	});
});

describe('WeekMonthTable — fréquence « jours du mois » (US-033 scénario 1)', () => {
	const monthly: Habit = {
		id: 'hm',
		name: 'Sauvegarde',
		emoji: '💾',
		frequency: { kind: 'monthdays', monthdays: [1, 15] },
		createdAt: '2026-01-01'
	};

	it('ne considère « prévues » que les colonnes du 1 et du 15, les autres restent neutres', () => {
		const completions: HabitCompletion[] = [{ habitId: 'hm', date: '2026-08-15', done: true }];
		render(WeekMonthTable, {
			dates: ['2026-08-14', '2026-08-15', '2026-08-16'],
			habits: [monthly],
			habitCompletions: completions,
			tasks: [],
			taskCompletions: [],
			today: '2026-08-16'
		});

		expect(screen.getByLabelText('Sauvegarde — samedi 15 août — fait')).toHaveAttribute(
			'data-state',
			'done'
		);
		expect(screen.getByLabelText('Sauvegarde — vendredi 14 août — non prévu')).toHaveAttribute(
			'data-state',
			'not-due'
		);
		expect(screen.getByLabelText('Sauvegarde — dimanche 16 août — non prévu')).toHaveAttribute(
			'data-state',
			'not-due'
		);
	});
});

/**
 * US-034 — la vue semaine doit tenir sur 7 colonnes sans défilement horizontal. Les largeurs
 * réelles ne sont pas mesurables en jsdom (pas de moteur de layout) : on verrouille ici les
 * **décisions structurelles** qui produisent ce résultat (largeur de table figée, débordement
 * neutralisé, en-têtes compacts, nom complet conservé dans le DOM) et la non-régression de la
 * vue mois. La vérification visuelle finale reste manuelle sur iPhone (cf. notes de l'US).
 */
describe('WeekMonthTable — mise en page de la semaine (US-034)', () => {
	const weekDates = [
		'2026-08-10',
		'2026-08-11',
		'2026-08-12',
		'2026-08-13',
		'2026-08-14',
		'2026-08-15',
		'2026-08-16'
	];

	function renderWeek(props: Record<string, unknown> = {}) {
		return render(WeekMonthTable, {
			dates: weekDates,
			habits: [habit],
			habitCompletions: [],
			tasks: [],
			taskCompletions: [],
			period: 'week',
			today: '2026-08-12',
			...props
		});
	}

	it('scénario 1 — affiche exactement 7 colonnes de jours, sans conteneur défilant', () => {
		const { container } = renderWeek();

		const columnHeaders = screen.getAllByRole('columnheader');
		// 1 en-tête « Habitude » + 7 jours.
		expect(columnHeaders).toHaveLength(8);

		const wrap = container.querySelector('.table-wrap') as HTMLElement;
		expect(wrap).toHaveAttribute('data-period', 'week');
		const table = container.querySelector('table') as HTMLElement;
		expect(table).toHaveAttribute('data-period', 'week');
	});

	it('scénario 2/6 — le nom complet de l’habitude reste dans le DOM même s’il est abrégé visuellement', () => {
		const longName = "Faire 20 minutes d'étirements du dos le soir";
		renderWeek({ habits: [{ ...habit, name: longName }] });

		const rowHeader = screen.getByRole('rowheader', { name: longName });
		expect(rowHeader).toHaveAttribute('title', longName);
		expect(rowHeader).toHaveTextContent(longName);
		// L'emoji reste visible et n'est pas restitué au lecteur d'écran.
		expect(rowHeader.querySelector('.emoji')).toHaveAttribute('aria-hidden', 'true');
		expect(rowHeader.querySelector('.emoji')).toHaveTextContent('🧘');
	});

	it('scénario 3 — chaque colonne porte le jour et le quantième, et sa date complète accessible', () => {
		renderWeek();

		// Le nom accessible de la colonne est la date complète en français.
		const monday = screen.getByRole('columnheader', { name: 'lundi 10 août' });
		expect(monday.querySelector('.col-weekday')).toHaveTextContent('Lun');
		expect(monday.querySelector('.col-day')).toHaveTextContent('10');
	});

	it('scénario 3 — la colonne du jour courant est distinguée des autres', () => {
		renderWeek();

		const todayHeader = screen.getByRole('columnheader', { name: 'mercredi 12 août' });
		expect(todayHeader).toHaveAttribute('data-today', 'true');
		expect(screen.getByRole('columnheader', { name: 'lundi 10 août' })).toHaveAttribute(
			'data-today',
			'false'
		);
		// Les cellules de cette colonne portent aussi le marqueur (mise en évidence de la colonne).
		expect(screen.getByLabelText('Yoga — mercredi 12 août — à faire')).toHaveAttribute(
			'data-today',
			'true'
		);
	});

	it('scénario 5 — la ligne « Tâches » reste présente avec ses 7 cellules', () => {
		renderWeek({ habits: Array.from({ length: 15 }, (_, i) => ({ ...habit, id: `h${i}` })) });

		const tasksRowHeader = screen.getByRole('rowheader', { name: 'Tâches' });
		const tasksRow = tasksRowHeader.closest('tr') as HTMLElement;
		expect(tasksRow.querySelectorAll('td')).toHaveLength(7);
	});

	it('scénario 7 — la vue mois conserve son en-tête JJ/MM et son conteneur défilant', () => {
		const { container } = render(WeekMonthTable, {
			dates: weekDates,
			habits: [habit],
			habitCompletions: [],
			tasks: [],
			taskCompletions: [],
			period: 'month',
			today: '2026-08-12'
		});

		expect(container.querySelector('.table-wrap')).toHaveAttribute('data-period', 'month');
		expect(container.querySelector('table')).toHaveAttribute('data-period', 'month');
		expect(screen.getByRole('columnheader', { name: '10/08' })).toBeInTheDocument();
		expect(screen.queryByRole('columnheader', { name: 'lundi 10 août' })).toBeNull();
	});
});

/**
 * US-035 — trois états visuels distincts dans le résumé. Les scénarios purement calculatoires
 * (2/3/4/6/7/8/17) sont couverts en unitaire par `habitCellState` dans `summary.test.ts` ;
 * on vérifie ici le **rendu** : symboles, libellés accessibles, légende, ligne « Tâches ».
 */
describe('WeekMonthTable — trois états visuels (US-035)', () => {
	const weekDates = ['2026-08-10', '2026-08-11', '2026-08-12', '2026-08-13'];

	it('scénarios 1/3/4 — affiche ✅ pour fait, ⬜ pour à faire, ❌ pour manqué', () => {
		const daily: Habit = {
			id: 'hd',
			name: 'Marcher',
			emoji: '🚶',
			frequency: { kind: 'interval', days: 1, anchor: '2026-08-01' },
			createdAt: '2026-08-01'
		};
		const completions: HabitCompletion[] = [{ habitId: 'hd', date: '2026-08-10', done: true }];
		render(WeekMonthTable, {
			dates: weekDates,
			habits: [daily],
			habitCompletions: completions,
			tasks: [],
			taskCompletions: [],
			today: '2026-08-12'
		});

		expect(screen.getByLabelText('Marcher — lundi 10 août — fait')).toHaveTextContent('✅');
		expect(screen.getByLabelText('Marcher — mardi 11 août — manqué')).toHaveTextContent('❌');
		// Aujourd'hui reste « à faire » toute la journée (scénario 3).
		expect(screen.getByLabelText('Marcher — mercredi 12 août — à faire')).toHaveTextContent('⬜');
		// Jour à venir : « à faire », jamais « manqué » (scénario 2).
		expect(screen.getByLabelText('Marcher — jeudi 13 août — à faire')).toHaveTextContent('⬜');
	});

	it('scénario 5 — une cellule non prévue reste vide, sans aucun des trois symboles', () => {
		render(WeekMonthTable, {
			dates: weekDates,
			habits: [habit], // lundi/mercredi
			habitCompletions: [],
			tasks: [],
			taskCompletions: [],
			today: '2026-08-12'
		});

		const notDue = screen.getByLabelText('Yoga — mardi 11 août — non prévu');
		expect(notDue).toHaveTextContent('');
		expect(notDue.textContent).not.toContain('✅');
		expect(notDue.textContent).not.toContain('⬜');
		expect(notDue.textContent).not.toContain('❌');
	});

	it('scénario 13 — le symbole est décoratif, l’information passe par un libellé textuel français', () => {
		render(WeekMonthTable, {
			dates: weekDates,
			habits: [habit],
			habitCompletions: [],
			tasks: [],
			taskCompletions: [],
			today: '2026-08-12'
		});

		const cell = screen.getByLabelText('Yoga — lundi 10 août — manqué');
		expect(cell.querySelector('span')).toHaveAttribute('aria-hidden', 'true');
		expect(cell).toHaveAttribute('aria-label', 'Yoga — lundi 10 août — manqué');
	});

	it('scénario 14 — une légende accessible décrit les trois symboles', () => {
		render(WeekMonthTable, {
			dates: weekDates,
			habits: [habit],
			habitCompletions: [],
			tasks: [],
			taskCompletions: [],
			today: '2026-08-12'
		});

		const legend = screen.getByRole('list', { name: 'Légende des symboles' });
		expect(legend).toHaveTextContent('fait');
		expect(legend).toHaveTextContent('à faire');
		expect(legend).toHaveTextContent('manqué');
	});

	it('scénario 12 — la ligne « Tâches » garde son pourcentage et adopte le code à trois états', () => {
		const tasks: Task[] = [
			{ id: 't1', name: 'A', date: '2026-08-10', createdAt: '2026-08-01' },
			{ id: 't2', name: 'B', date: '2026-08-10', createdAt: '2026-08-01' },
			{ id: 't3', name: 'C', date: '2026-08-11', createdAt: '2026-08-01' },
			{ id: 't4', name: 'D', date: '2026-08-12', createdAt: '2026-08-01' }
		];
		const taskCompletions: TaskCompletion[] = [
			{ taskId: 't1', done: true },
			{ taskId: 't3', done: true }
		];
		render(WeekMonthTable, {
			dates: weekDates,
			habits: [],
			habitCompletions: [],
			tasks,
			taskCompletions,
			today: '2026-08-12'
		});

		// Jour passé à 50 % → traité comme « manqué », mais le pourcentage reste affiché ET
		// restitué au lecteur d'écran.
		const monday = screen.getByLabelText('Tâches — lundi 10 août — 50 % — manqué');
		expect(monday).toHaveTextContent('50%');
		expect(monday).toHaveAttribute('data-state', 'missed');
		// Jour passé à 100 % → traité comme « fait ».
		expect(screen.getByLabelText('Tâches — mardi 11 août — 100 % — fait')).toHaveTextContent(
			'100%'
		);
		// Aujourd'hui, en dessous de 100 % → « à faire », jamais « manqué ».
		expect(screen.getByLabelText('Tâches — mercredi 12 août — 0 % — à faire')).toHaveTextContent(
			'0%'
		);
		// Aucune tâche → neutre, avec le tiret historique.
		expect(screen.getByLabelText('Tâches — jeudi 13 août — aucune tâche')).toHaveTextContent('—');
		// Aucun symbole d'habitude dans cette ligne (décision PO).
		const tasksRow = screen.getByRole('rowheader', { name: 'Tâches' }).closest('tr') as HTMLElement;
		expect(tasksRow.textContent).not.toContain('✅');
		expect(tasksRow.textContent).not.toContain('❌');
		expect(tasksRow.textContent).not.toContain('⬜');
	});

	it('scénario 10 — la vue mois utilise exactement les mêmes symboles que la vue semaine', () => {
		render(WeekMonthTable, {
			dates: weekDates,
			habits: [habit],
			habitCompletions: [{ habitId: 'h1', date: '2026-08-10', done: true }],
			tasks: [],
			taskCompletions: [],
			period: 'month',
			today: '2026-08-12'
		});

		expect(screen.getByLabelText('Yoga — lundi 10 août — fait')).toHaveTextContent('✅');
		expect(screen.getByLabelText('Yoga — mercredi 12 août — à faire')).toHaveTextContent('⬜');
		expect(screen.getByRole('list', { name: 'Légende des symboles' })).toBeInTheDocument();
	});
});

describe('WeekMonthTable — indicateur de tâches (US-005 scénarios 4/5)', () => {
	const tasks: Task[] = [
		{ id: 't1', name: 'A', date: '2026-08-10', createdAt: '2026-08-01' },
		{ id: 't2', name: 'B', date: '2026-08-10', createdAt: '2026-08-01' }
	];

	it('affiche le pourcentage de tâches validées un jour concerné (scénario 4)', () => {
		const completions: TaskCompletion[] = [{ taskId: 't1', done: true }];
		render(WeekMonthTable, {
			dates,
			habits: [],
			habitCompletions: [],
			tasks,
			taskCompletions: completions,
			today
		});
		expect(screen.getByText('50%')).toBeInTheDocument();
	});

	it('affiche une valeur neutre pour un jour sans tâche (scénario 5)', () => {
		render(WeekMonthTable, {
			dates,
			habits: [],
			habitCompletions: [],
			tasks: [],
			taskCompletions: [],
			today
		});
		expect(screen.getAllByText('—').length).toBe(dates.length);
	});
});
