// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import Page from './+page.svelte';
import { habitsStore } from '$lib/stores/habits.store.svelte';
import type { Habit } from '$lib/domain/types';

/**
 * Test de rendu de la liste `/habitudes` (US-010 scénario 3/5) : chaque habitude est
 * présentée comme une carte horizontale pleine largeur, cohérente avec le planning ; un
 * nom long ne casse pas la mise en page (affiché en entier, non tronqué). `idb-keyval` est
 * mocké en mémoire, comme dans `routes/page.test.ts` (CONVENTIONS.md §5).
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

const longName =
	'Ranger et trier entièrement le bureau, les tiroirs et les étagères de la chambre avant le week-end';

const habits: Habit[] = [
	{
		id: 'h1',
		name: "Boire de l'eau",
		emoji: '💧',
		frequency: { kind: 'interval', days: 1, anchor: '2026-01-01' },
		createdAt: '2026-01-01'
	},
	{
		id: 'h2',
		name: longName,
		emoji: '🧹',
		frequency: { kind: 'interval', days: 7, anchor: '2026-01-01' },
		createdAt: '2026-01-01'
	}
];

beforeEach(async () => {
	await idbSet('habits', habits);
	habitsStore.loaded = false;
});

describe('Liste des habitudes — /habitudes (US-010 scénario 3/5)', () => {
	it('affiche chaque habitude comme une carte pleine largeur cliquable', async () => {
		render(Page);
		const row = await screen.findByRole('button', { name: /Boire de l'eau/ });
		expect(row).toBeInTheDocument();
	});

	it("affiche le nom complet d'une habitude, même très long, sans le tronquer", async () => {
		render(Page);
		expect(await screen.findByText(longName)).toBeInTheDocument();
	});
});

describe('Liste des habitudes — mise en pause/reprise (US-015, intégration store réel)', () => {
	it('met une habitude en pause puis la réactive, avec badge et bascule d\'action', async () => {
		render(Page);
		await screen.findByText("Boire de l'eau");

		const pauseButtons = screen.getAllByRole('button', { name: 'Mettre en pause' });
		await fireEvent.click(pauseButtons[0]);

		await screen.findByText('En pause');
		expect(screen.getByRole('button', { name: 'Réactiver' })).toBeInTheDocument();

		await fireEvent.click(screen.getByRole('button', { name: 'Réactiver' }));

		expect(screen.queryByText('En pause')).toBeNull();
	});
});

describe('Liste des habitudes — suppression (US-013, intégration store réel)', () => {
	it('supprime une habitude après glissement + confirmation : elle disparaît de la liste', async () => {
		render(Page);
		await screen.findByText("Boire de l'eau");

		const row = screen.getByRole('button', { name: /Boire de l'eau/ });
		await fireEvent(row, new MouseEvent('pointerdown', { clientX: 200, bubbles: true }));
		await fireEvent(row, new MouseEvent('pointerup', { clientX: 100, bubbles: true }));

		await fireEvent.click(screen.getByRole('button', { name: /Supprimer « Boire de l'eau »/ }));
		await fireEvent.click(screen.getByRole('button', { name: 'Supprimer' }));

		expect(screen.queryByText("Boire de l'eau")).toBeNull();
	});
});
