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

describe('WeekMonthTable (US-005 scénarios 1/2/6)', () => {
	it('affiche une cellule binaire fait/non fait uniquement les jours prévus (scénarios 1/6)', () => {
		const completions: HabitCompletion[] = [{ habitId: 'h1', date: '2026-08-10', done: true }];
		render(WeekMonthTable, {
			dates,
			habits: [habit],
			habitCompletions: completions,
			tasks: [],
			taskCompletions: []
		});

		const doneCell = screen.getByLabelText('Yoga — 10/08 — done');
		const notDoneCell = screen.getByLabelText('Yoga — 12/08 — not-done');
		const notDueCell = screen.getByLabelText('Yoga — 11/08 — not-due'); // mardi, non prévu

		expect(doneCell).toHaveAttribute('data-status', 'done');
		expect(notDoneCell).toHaveAttribute('data-status', 'not-done');
		expect(notDueCell).toHaveAttribute('data-status', 'not-due');
	});

	it('ne montre ni pourcentage ni couleur graduelle sur une cellule binaire', () => {
		render(WeekMonthTable, {
			dates,
			habits: [habit],
			habitCompletions: [],
			tasks: [],
			taskCompletions: []
		});
		expect(screen.queryByText(/%/)).toBeNull();
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
			taskCompletions: completions
		});
		expect(screen.getByText('50%')).toBeInTheDocument();
	});

	it('affiche une valeur neutre pour un jour sans tâche (scénario 5)', () => {
		render(WeekMonthTable, {
			dates,
			habits: [],
			habitCompletions: [],
			tasks: [],
			taskCompletions: []
		});
		expect(screen.getAllByText('—').length).toBe(dates.length);
	});
});
