// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/svelte';
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
	it(
		'supprime une habitude après glissement + confirmation : elle quitte la liste active et ' +
			'rejoint la section « En pause / Supprimées » (US-027 scénario 1)',
		async () => {
			render(Page);
			await screen.findByText("Boire de l'eau");

			const row = screen.getByRole('button', { name: /Boire de l'eau/ });
			await fireEvent(row, new MouseEvent('pointerdown', { clientX: 200, bubbles: true }));
			await fireEvent(row, new MouseEvent('pointerup', { clientX: 100, bubbles: true }));

			await fireEvent.click(screen.getByRole('button', { name: /Supprimer « Boire de l'eau »/ }));
			await fireEvent.click(screen.getByRole('button', { name: 'Supprimer' }));

			// N'apparaît plus comme carte active cliquable...
			expect(screen.queryByRole('button', { name: /Boire de l'eau/ })).toBeNull();
			// ...mais reste visible, en lecture seule, dans la nouvelle section dédiée (US-027).
			const section = screen.getByRole('heading', { name: 'En pause / Supprimées' }).closest(
				'section'
			) as HTMLElement;
			expect(within(section).getByText("Boire de l'eau")).toBeInTheDocument();
			expect(within(section).getByText('Supprimée')).toBeInTheDocument();
		}
	);
});

describe('Section « En pause / Supprimées » (US-027)', () => {
	beforeEach(async () => {
		const paused: Habit = { ...habits[0], id: 'h3', name: 'Yoga', status: 'paused' };
		const deleted: Habit = { ...habits[0], id: 'h4', name: 'Course à pied', status: 'deleted' };
		await idbSet('habits', [habits[0], paused, deleted]);
		habitsStore.loaded = false;
	});

	it('scénario 1 — regroupe pause et supprimées dans une section distincte de la liste active', async () => {
		render(Page);
		await screen.findByText("Boire de l'eau");

		const activeSection = screen.getByRole('button', { name: /Boire de l'eau/ }).closest('ul');
		const pausedDeletedSection = screen
			.getByRole('heading', { name: 'En pause / Supprimées' })
			.closest('section') as HTMLElement;

		expect(within(pausedDeletedSection).getByText('Yoga')).toBeInTheDocument();
		expect(within(pausedDeletedSection).getByText('Course à pied')).toBeInTheDocument();
		expect(activeSection ? within(activeSection).queryByText('Yoga') : null).toBeNull();
	});

	it('scénario 2 — distingue visuellement pause (réactivable) et supprimée', async () => {
		render(Page);
		await screen.findByText('Yoga');

		const pausedDeletedSection = screen
			.getByRole('heading', { name: 'En pause / Supprimées' })
			.closest('section') as HTMLElement;

		expect(within(pausedDeletedSection).getByText('En pause')).toBeInTheDocument();
		expect(within(pausedDeletedSection).getByText('Supprimée')).toBeInTheDocument();
		expect(
			within(pausedDeletedSection).getByRole('button', { name: 'Réactiver' })
		).toBeInTheDocument();
	});
});

describe('Date de reprise automatique (US-027 scénarios 3/4/5)', () => {
	beforeEach(async () => {
		const paused: Habit = { ...habits[0], id: 'h3', name: 'Yoga', status: 'paused' };
		await idbSet('habits', [paused]);
		habitsStore.loaded = false;
	});

	it('scénario 3 — programme une date de reprise automatique sur une habitude en pause', async () => {
		render(Page);
		await screen.findByText('Yoga');

		await fireEvent.click(screen.getByRole('button', { name: '+ Date de reprise automatique' }));
		await fireEvent.input(screen.getByLabelText('Date de reprise automatique (optionnel)'), {
			target: { value: '2026-09-01' }
		});
		await fireEvent.click(screen.getByRole('button', { name: 'Valider' }));

		expect(await screen.findByText('🔁 Reprise auto : 01/09/2026')).toBeInTheDocument();
	});

	it('scénario 5 — retire une date de reprise automatique déjà programmée', async () => {
		render(Page);
		await screen.findByText('Yoga');

		await fireEvent.click(screen.getByRole('button', { name: '+ Date de reprise automatique' }));
		await fireEvent.input(screen.getByLabelText('Date de reprise automatique (optionnel)'), {
			target: { value: '2026-09-01' }
		});
		await fireEvent.click(screen.getByRole('button', { name: 'Valider' }));
		await screen.findByText('🔁 Reprise auto : 01/09/2026');

		await fireEvent.click(screen.getByRole('button', { name: '🔁 Reprise auto : 01/09/2026' }));
		await fireEvent.input(screen.getByLabelText('Date de reprise automatique (optionnel)'), {
			target: { value: '' }
		});
		await fireEvent.click(screen.getByRole('button', { name: 'Valider' }));

		expect(await screen.findByText('+ Date de reprise automatique')).toBeInTheDocument();
		expect(screen.queryByText(/Reprise auto :/)).toBeNull();
	});
});

describe('Reprise automatique effective à l\'ouverture (US-027 scénario 4)', () => {
	it('réactive automatiquement une habitude en pause dont la date de reprise est atteinte', async () => {
		const today = new Date().toISOString().slice(0, 10);
		const dueForResume: Habit = {
			...habits[0],
			id: 'h5',
			name: 'Étirements',
			status: 'paused',
			resumeAt: today
		};
		await idbSet('habits', [dueForResume]);
		habitsStore.loaded = false;

		render(Page);

		await screen.findByRole('button', { name: /Étirements/ });
		expect(screen.queryByText('En pause')).toBeNull();
		expect(screen.queryByRole('heading', { name: 'En pause / Supprimées' })).toBeNull();
	});

	it('ne réactive pas une habitude dont la date de reprise n\'est pas encore atteinte', async () => {
		const farFuture: Habit = {
			...habits[0],
			id: 'h6',
			name: 'Piano',
			status: 'paused',
			resumeAt: '2099-01-01'
		};
		await idbSet('habits', [farFuture]);
		habitsStore.loaded = false;

		render(Page);

		await screen.findByText('Piano');
		expect(screen.getByText('En pause')).toBeInTheDocument();
	});
});
