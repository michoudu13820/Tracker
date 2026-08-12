// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import YearTable from './YearTable.svelte';
import { DEFAULT_THRESHOLDS } from '$lib/domain/summary';
import type { Habit, HabitCompletion, Task, TaskCompletion } from '$lib/domain/types';

const months = [
	{ year: 2026, month: 1 },
	{ year: 2026, month: 2 }
];

describe('YearTable (US-005 scénarios 3/3ter/3quater/6bis)', () => {
	it('affiche un pourcentage coloré vert avec les seuils par défaut (scénario 3ter)', () => {
		// Habitude due tous les jours de janvier (31/31 cochés = 100%).
		const habit: Habit = {
			id: 'h1',
			name: 'Marcher',
			emoji: '🚶',
			frequency: { kind: 'interval', days: 1, anchor: '2026-01-01' },
			createdAt: '2026-01-01'
		};
		const completions: HabitCompletion[] = Array.from({ length: 31 }, (_, i) => ({
			habitId: 'h1',
			date: `2026-01-${String(i + 1).padStart(2, '0')}`,
			done: true
		}));
		render(YearTable, {
			months,
			habits: [habit],
			habitCompletions: completions,
			tasks: [],
			taskCompletions: [],
			thresholds: DEFAULT_THRESHOLDS
		});
		const cell = screen.getByLabelText('Marcher — janvier — 100%');
		expect(cell).toHaveAttribute('data-color', 'green');
	});

	it('affiche une cellule neutre pour un mois sans occurrence prévue (scénario 6bis)', () => {
		const habit: Habit = {
			id: 'h1',
			name: 'Marcher',
			emoji: '🚶',
			// Ancrée en mars -> aucune occurrence en janvier/février.
			frequency: { kind: 'interval', days: 1, anchor: '2026-03-01' },
			createdAt: '2026-01-01'
		};
		render(YearTable, {
			months,
			habits: [habit],
			habitCompletions: [],
			tasks: [],
			taskCompletions: [],
			thresholds: DEFAULT_THRESHOLDS
		});
		const cell = screen.getByLabelText('Marcher — janvier — aucune occurrence prévue');
		expect(cell).toHaveAttribute('data-neutral', 'true');
		expect(cell).not.toHaveAttribute('data-color');
	});

	it('applique des seuils personnalisés (scénario 3quater)', () => {
		// 50% de complétion : vert avec seuils par défaut (>=80 exigé donc non), jaune avec défaut
		// (>=40), mais rouge avec des seuils personnalisés vert=90/jaune=60.
		const habit: Habit = {
			id: 'h1',
			name: 'Marcher',
			emoji: '🚶',
			frequency: { kind: 'interval', days: 1, anchor: '2026-01-01' },
			createdAt: '2026-01-01'
		};
		const completions: HabitCompletion[] = Array.from({ length: 16 }, (_, i) => ({
			habitId: 'h1',
			date: `2026-01-${String(i + 1).padStart(2, '0')}`,
			done: true
		})); // ~52% de 31 jours

		const { unmount } = render(YearTable, {
			months,
			habits: [habit],
			habitCompletions: completions,
			tasks: [],
			taskCompletions: [],
			thresholds: DEFAULT_THRESHOLDS
		});
		expect(screen.getAllByText(/52%/)[0]).toHaveAttribute('data-color', 'yellow');
		unmount();

		render(YearTable, {
			months,
			habits: [habit],
			habitCompletions: completions,
			tasks: [],
			taskCompletions: [],
			thresholds: { green: 90, yellow: 60 }
		});
		expect(screen.getAllByText(/52%/)[0]).toHaveAttribute('data-color', 'red');
	});
});

describe('YearTable — indicateur de tâches (US-005 scénarios 4bis/5)', () => {
	it('affiche le pourcentage de tâches validées par mois (scénario 4bis)', () => {
		const tasks: Task[] = [
			{ id: 't1', name: 'A', date: '2026-01-05', createdAt: '2026-01-01' },
			{ id: 't2', name: 'B', date: '2026-01-20', createdAt: '2026-01-01' }
		];
		const taskCompletions: TaskCompletion[] = [{ taskId: 't1', done: true }];
		render(YearTable, {
			months,
			habits: [],
			habitCompletions: [],
			tasks,
			taskCompletions,
			thresholds: DEFAULT_THRESHOLDS
		});
		expect(screen.getByText('50%')).toBeInTheDocument();
	});

	it('affiche une valeur neutre pour un mois sans tâche (scénario 5)', () => {
		render(YearTable, {
			months,
			habits: [],
			habitCompletions: [],
			tasks: [],
			taskCompletions: [],
			thresholds: DEFAULT_THRESHOLDS
		});
		expect(screen.getAllByText('—')).toHaveLength(2);
	});
});
