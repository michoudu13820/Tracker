// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import Page from './+page.svelte';
import { habitsStore } from '$lib/stores/habits.store.svelte';
import { tasksStore } from '$lib/stores/tasks.store.svelte';
import { completionsStore } from '$lib/stores/completions.store.svelte';
import { settingsStore } from '$lib/stores/settings.store.svelte';
import { toIsoDate } from '$lib/domain/dates';
import type { Habit } from '$lib/domain/types';

/**
 * Test d'assemblage de la route `/resume` (US-005) : sélection de période par défaut,
 * bascule semaine/mois/année, navigation. Le rendu détaillé des cellules est couvert par
 * `WeekMonthTable.test.ts` / `YearTable.test.ts` — ce fichier vérifie le câblage de la page.
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

const habit: Habit = {
	id: 'h1',
	name: "Boire de l'eau",
	emoji: '💧',
	frequency: { kind: 'interval', days: 1, anchor: today },
	createdAt: today
};

beforeEach(async () => {
	await idbSet('habits', [habit]);
	await idbSet('tasks', []);
	await idbSet('habit-completions', []);
	await idbSet('task-completions', []);
	await idbSet('reminder-settings', undefined);
	await idbSet('color-thresholds', undefined);
	habitsStore.loaded = false;
	tasksStore.loaded = false;
	completionsStore.loaded = false;
	settingsStore.loaded = false;
});

describe('Résumé — /resume (US-005)', () => {
	it('scénario 1 — la période par défaut est la semaine, avec des colonnes en jours', async () => {
		render(Page);
		await screen.findByText("Boire de l'eau");

		expect(screen.getByRole('button', { name: 'Semaine' })).toHaveAttribute(
			'aria-pressed',
			'true'
		);
		expect(screen.getByText(/Semaine du/)).toBeInTheDocument();
	});

	it('scénario 2/3bis — bascule vers « mois » : toujours des colonnes en jours', async () => {
		render(Page);
		await screen.findByText("Boire de l'eau");

		await fireEvent.click(screen.getByRole('button', { name: 'Mois' }));

		expect(screen.getByRole('button', { name: 'Mois' })).toHaveAttribute('aria-pressed', 'true');
		// Pas de "Semaine du..." affiché, mais toujours le tableau jour par jour (binaire, pas de %).
		expect(screen.queryByText(/Semaine du/)).toBeNull();
		expect(screen.queryByText(/%/)).toBeNull();
	});

	it('scénario 3/3bis — seule la période « année » bascule en colonnes mensuelles', async () => {
		render(Page);
		await screen.findByText("Boire de l'eau");

		await fireEvent.click(screen.getByRole('button', { name: 'Année' }));

		expect(screen.getByRole('button', { name: 'Année' })).toHaveAttribute('aria-pressed', 'true');
		// En vue année, la cellule affiche un pourcentage (contrairement à semaine/mois).
		expect(screen.getAllByText(/%/).length).toBeGreaterThan(0);
	});

	it('scénario 7 — navigation vers la période précédente met à jour le libellé', async () => {
		render(Page);
		await screen.findByText("Boire de l'eau");

		const initialLabel = screen.getByText(/Semaine du/).textContent;
		await fireEvent.click(screen.getByRole('button', { name: 'Période précédente' }));

		expect(screen.getByText(/Semaine du/).textContent).not.toBe(initialLabel);
	});
});
