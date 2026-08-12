// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
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
