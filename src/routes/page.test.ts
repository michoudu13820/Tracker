// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/svelte';
import Page from './+page.svelte';
import { habitsStore } from '$lib/stores/habits.store.svelte';
import { tasksStore } from '$lib/stores/tasks.store.svelte';
import { completionsStore } from '$lib/stores/completions.store.svelte';
import { toIsoDate, addDays, formatIsoDateLongFr } from '$lib/domain/dates';
import type { Habit, Task } from '$lib/domain/types';

/**
 * Test d'assemblage de la route « Aujourd'hui » (US-004) : filtrage des habitudes/tâches du
 * jour, sections distinctes, cochage, navigation via la frise de dates (US-011) et titre
 * dynamique (US-012). `idb-keyval` est mocké en mémoire (pas d'IndexedDB réelle en jsdom) —
 * les stores et repositories réels sont utilisés tels quels, seule la source de données est
 * remplacée (approche recommandée par CONVENTIONS.md §5). Les comportements fins de
 * `HabitCheckItem` / `TaskItem` / `DateStrip` sont déjà couverts par leurs tests dédiés : ce
 * fichier vérifie uniquement le câblage (filtrage par date, sections, navigation, titre).
 */
vi.mock('idb-keyval', () => {
	const store = new Map<string, unknown>();
	return {
		get: vi.fn((key: string) => Promise.resolve(store.get(key))),
		set: vi.fn((key: string, value: unknown) => {
			store.set(key, value);
			return Promise.resolve();
		})
	};
});

const { set: idbSet } = await import('idb-keyval');

const today = toIsoDate(new Date());

const habitAlwaysDue: Habit = {
	id: 'h1',
	name: "Boire de l'eau",
	emoji: '💧',
	// Ancrée bien avant aujourd'hui pour rester due sur toute la plage testée (hier → demain).
	frequency: { kind: 'interval', days: 1, anchor: addDays(today, -10) },
	createdAt: today
};

const habitEvery3Days: Habit = {
	id: 'h2',
	name: 'Yoga',
	emoji: '🧘',
	frequency: { kind: 'interval', days: 3, anchor: today },
	createdAt: today
};

const taskToday: Task = { id: 't1', name: 'Appeler le plombier', date: today, createdAt: today };
const taskTomorrow: Task = {
	id: 't2',
	name: 'Autre tâche',
	date: addDays(today, 1),
	createdAt: today
};

beforeEach(async () => {
	await idbSet('habits', [habitAlwaysDue, habitEvery3Days]);
	await idbSet('tasks', [taskToday, taskTomorrow]);
	await idbSet('habit-completions', []);
	await idbSet('task-completions', []);
	habitsStore.loaded = false;
	tasksStore.loaded = false;
	completionsStore.loaded = false;
});

describe('Planning quotidien — / (US-004)', () => {
	it('scénario 1/8 — affiche le jour courant, habitudes et tâches dans des sections distinctes', async () => {
		render(Page);

		const habitsSection = (await screen.findByRole('heading', { name: /Habitudes/ }))
			.closest('section') as HTMLElement;
		const tasksSection = screen.getByRole('heading', { name: /Tâches/ }).closest(
			'section'
		) as HTMLElement;

		expect(within(habitsSection).getByText("Boire de l'eau")).toBeInTheDocument();
		expect(within(habitsSection).getByText('Yoga')).toBeInTheDocument();
		expect(within(tasksSection).getByText('Appeler le plombier')).toBeInTheDocument();
		expect(within(tasksSection).queryByText('Autre tâche')).toBeNull();
	});

	it('scénario 2/7 — taper sur le jour suivant dans la frise met à jour les habitudes (intervalle) et les tâches (US-011)', async () => {
		render(Page);
		await screen.findByText("Boire de l'eau");

		const tomorrow = addDays(today, 1);
		await fireEvent.click(screen.getByRole('button', { name: formatIsoDateLongFr(tomorrow) }));

		// h2 (tous les 3 jours, ancré aujourd'hui) n'est pas due le lendemain.
		await screen.findByText('Autre tâche');
		expect(screen.getByText("Boire de l'eau")).toBeInTheDocument();
		expect(screen.queryByText('Yoga')).toBeNull();
		expect(screen.queryByText('Appeler le plombier')).toBeNull();
	});

	it('scénario 6 — taper sur un jour passé dans la frise affiche le planning de ce jour-là (US-011)', async () => {
		render(Page);
		await screen.findByText("Boire de l'eau");

		const yesterday = addDays(today, -1);
		await fireEvent.click(screen.getByRole('button', { name: formatIsoDateLongFr(yesterday) }));

		// Avant l'ancrage : h2 (intervalle) n'est pas due, aucune tâche ce jour-là.
		await screen.findByText('Aucune tâche prévue ce jour.');
		expect(screen.getByText("Boire de l'eau")).toBeInTheDocument();
		expect(screen.queryByText('Yoga')).toBeNull();
	});

	it('scénario US-011 — le jour sélectionné dans la frise est visuellement distingué', async () => {
		render(Page);
		await screen.findByText("Boire de l'eau");

		expect(screen.getByRole('button', { name: formatIsoDateLongFr(today) })).toHaveAttribute(
			'aria-current',
			'date'
		);

		const tomorrow = addDays(today, 1);
		await fireEvent.click(screen.getByRole('button', { name: formatIsoDateLongFr(tomorrow) }));

		expect(screen.getByRole('button', { name: formatIsoDateLongFr(tomorrow) })).toHaveAttribute(
			'aria-current',
			'date'
		);
		expect(screen.getByRole('button', { name: formatIsoDateLongFr(today) })).not.toHaveAttribute(
			'aria-current'
		);
	});

	it('scénario US-012 — le titre affiche « Planning d\'aujourd\'hui » par défaut, puis « Planning du... » sur un autre jour, et repasse à aujourd\'hui au retour', async () => {
		render(Page);
		await screen.findByText("Boire de l'eau");

		expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent("Planning d'aujourd'hui");

		const tomorrow = addDays(today, 1);
		await fireEvent.click(screen.getByRole('button', { name: formatIsoDateLongFr(tomorrow) }));
		expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
			`Planning du ${formatIsoDateLongFr(tomorrow)}`
		);

		await fireEvent.click(screen.getByRole('button', { name: formatIsoDateLongFr(today) }));
		expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent("Planning d'aujourd'hui");
	});

	it('scénario 4/5 — cocher puis décocher une habitude bascule son état', async () => {
		render(Page);
		await screen.findByText("Boire de l'eau");

		const checkbox = screen.getByRole('checkbox', {
			name: "Marquer « Boire de l'eau » comme faite"
		});
		expect(checkbox).not.toBeChecked();

		await fireEvent.click(checkbox);
		expect(checkbox).toBeChecked();

		await fireEvent.click(checkbox);
		expect(checkbox).not.toBeChecked();
	});
});
