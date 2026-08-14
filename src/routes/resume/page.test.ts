// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/svelte';
import Page from './+page.svelte';
import PlanningPage from '../+page.svelte';
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

describe('Résumé — compatibilité habitude à cible chiffrée (US-019, intégration bout-en-bout)', () => {
	const targetHabit: Habit = {
		id: 'h2',
		name: 'Boire beaucoup d’eau',
		emoji: '💧',
		frequency: { kind: 'interval', days: 1, anchor: today },
		createdAt: today,
		target: { value: 1.5, unit: 'L' }
	};

	beforeEach(async () => {
		await idbSet('habits', [targetHabit]);
	});

	it('scénario 1 — une quantité atteinte via le planning (US-018) est comptée « fait » dans le résumé semaine', async () => {
		// Étape 1 : sur le planning du jour (US-018), ajoute une quantité qui atteint la cible.
		const { unmount } = render(PlanningPage);
		await screen.findByText(targetHabit.name);
		await fireEvent.click(
			screen.getByRole('button', { name: `Ajouter une quantité pour « ${targetHabit.name} »` })
		);
		await fireEvent.input(screen.getByLabelText('Quantité à ajouter'), {
			target: { value: '1.5' }
		});
		await fireEvent.click(screen.getByRole('button', { name: 'OK' }));
		await screen.findByText('1,5 / 1,5 L');
		unmount();

		// Étape 2 : le résumé (US-005/US-019) doit refléter ce jour comme « fait », en binaire —
		// avec le symbole et le libellé accessible du langage à trois états (US-035).
		render(Page);
		const cell = await screen.findByLabelText(new RegExp(`${targetHabit.name} — .* — fait$`));
		expect(cell).toHaveTextContent('✅');
		expect(within(cell.closest('table') as HTMLElement).queryByText(/%/)).toBeNull();
	});
});
