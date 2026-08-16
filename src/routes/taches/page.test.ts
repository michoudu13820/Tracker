// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import Page from './+page.svelte';
import { tasksStore } from '$lib/stores/tasks.store.svelte';
import { completionsStore } from '$lib/stores/completions.store.svelte';
import { settingsStore } from '$lib/stores/settings.store.svelte';
import { remindersStore } from '$lib/stores/reminders.store.svelte';
import { toIsoDate } from '$lib/domain/dates';
import type { ReminderSettings, Task } from '$lib/domain/types';

/**
 * Test d'assemblage de la route « Tâches » (US-023 uniquement — la création/édition/suppression
 * est déjà couverte par les tests dédiés de `TaskForm`/`TaskItem`) : vérifie que cocher une
 * tâche resynchronise immédiatement la fenêtre de rappels (scénarios 1/2/5). `idb-keyval` est
 * mocké en mémoire, mêmes conventions que `routes/page.test.ts`.
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
const task: Task = { id: 't1', name: 'Appeler le plombier', date: today, createdAt: today };

const enabledSettings: ReminderSettings = { enabled: true, time: '08:00', timezone: 'Europe/Paris' };

beforeEach(async () => {
	await idbSet('tasks', [task]);
	await idbSet('habit-completions', []);
	await idbSet('task-completions', []);
	await idbSet('habit-progress', []);
	tasksStore.loaded = false;
	completionsStore.loaded = false;
	settingsStore.reminder = enabledSettings;
});

afterEach(() => {
	settingsStore.reminder = null;
	vi.restoreAllMocks();
});

describe('Tâches — resynchronisation des rappels au cochage (US-023)', () => {
	it('scénario 1/5 — cocher une tâche resynchronise immédiatement la fenêtre de rappels', async () => {
		const sync = vi.spyOn(remindersStore, 'sync').mockResolvedValue();
		render(Page);
		await screen.findByText('Appeler le plombier');

		await fireEvent.click(
			screen.getByRole('checkbox', { name: 'Marquer « Appeler le plombier » comme faite' })
		);

		expect(sync).toHaveBeenCalledTimes(1);
	});

	it('scénario 2 — décocher une tâche resynchronise également la fenêtre', async () => {
		const sync = vi.spyOn(remindersStore, 'sync').mockResolvedValue();
		render(Page);
		await screen.findByText('Appeler le plombier');

		const label = 'Marquer « Appeler le plombier » comme faite';
		await fireEvent.click(screen.getByRole('checkbox', { name: label }));

		// Depuis US-041, une tâche cochée rejoint aussitôt la section « Tâches accomplies »,
		// repliée par défaut : il faut la déplier pour retrouver sa case et la décocher.
		await fireEvent.click(screen.getByRole('button', { name: /Tâches accomplies/ }));
		await fireEvent.click(await screen.findByRole('checkbox', { name: label }));

		expect(sync).toHaveBeenCalledTimes(2);
	});
});

/**
 * US-038 scénario 9 — l'écran « Tâches » ne triait que par date (`a.date.localeCompare(b.date)`),
 * sans second critère : deux tâches d'un même jour y sortaient dans un ordre non maîtrisé.
 */
describe('Tâches — ordre d’affichage (US-038 scénario 9)', () => {
	function taskNames(): string[] {
		return Array.from(document.querySelectorAll('.task-item .name')).map(
			(el) => el.textContent ?? ''
		);
	}

	beforeEach(async () => {
		await idbSet('tasks', [
			{ id: 'a', name: 'J2 sans heure', date: '2026-09-02', createdAt: '2026-08-01' },
			{ id: 'b', name: 'J1 18h', date: '2026-09-01', createdAt: '2026-08-01', dueTime: '18:00' },
			{ id: 'c', name: 'J1 sans heure', date: '2026-09-01', createdAt: '2026-08-01' },
			{ id: 'd', name: 'J2 09h', date: '2026-09-02', createdAt: '2026-08-01', dueTime: '09:00' },
			{ id: 'e', name: 'J1 09h', date: '2026-09-01', createdAt: '2026-08-01', dueTime: '09:00' }
		]);
		tasksStore.loaded = false;
	});

	it('conserve le tri par date et applique la règle du planning à date égale', async () => {
		render(Page);
		await screen.findByText('J1 09h');

		expect(taskNames()).toEqual([
			'J1 09h',
			'J1 18h',
			'J1 sans heure',
			'J2 09h',
			'J2 sans heure'
		]);
	});
});

/**
 * US-041 — regroupement des tâches accomplies et horizon de 7 jours sur cet écran.
 * `today` est figé par les données de test (dates relatives à `today` réel calculé ci-dessus).
 */
describe('Tâches — section « Tâches accomplies » (US-041)', () => {
	const daysAgo = (n: number): string => {
		const d = new Date();
		d.setDate(d.getDate() - n);
		return toIsoDate(d);
	};

	const aFaire: Task = { id: 'p1', name: 'Ranger le garage', date: today, createdAt: today };
	const finieHier: Task = { id: 'c1', name: 'Finie hier', date: daysAgo(1), createdAt: daysAgo(1) };
	const finieIlYaLongtemps: Task = {
		id: 'c2',
		name: 'Finie il y a longtemps',
		date: daysAgo(30),
		createdAt: daysAgo(30)
	};
	const finieSansDate: Task = {
		id: 'c3',
		name: 'Finie sans date connue',
		date: daysAgo(2),
		createdAt: daysAgo(2)
	};

	beforeEach(async () => {
		await idbSet('tasks', [aFaire, finieHier, finieIlYaLongtemps, finieSansDate]);
		await idbSet('task-completions', [
			{ taskId: 'c1', done: true, doneAt: daysAgo(1) },
			{ taskId: 'c2', done: true, doneAt: daysAgo(30) },
			{ taskId: 'c3', done: true }
		]);
		tasksStore.loaded = false;
		completionsStore.loaded = false;
	});

	it('scénario 5 — les tâches accomplies sont repliées par défaut, seules les tâches à faire sont visibles', async () => {
		render(Page);
		await screen.findByText('Ranger le garage');

		expect(screen.queryByText('Finie hier')).not.toBeInTheDocument();
		const toggle = screen.getByRole('button', { name: /Tâches accomplies/ });
		expect(toggle).toHaveAttribute('aria-expanded', 'false');
	});

	it('scénario 1 — le compteur est lisible sans déplier', async () => {
		render(Page);
		await screen.findByText('Ranger le garage');

		// Une seule tâche accomplie est comptée : les deux autres sont hors horizon.
		expect(screen.getByRole('button', { name: /Tâches accomplies/ })).toHaveTextContent('1');
	});

	it('scénario 2 — déplier affiche les tâches accomplies, replier les masque à nouveau', async () => {
		render(Page);
		await screen.findByText('Ranger le garage');
		const toggle = screen.getByRole('button', { name: /Tâches accomplies/ });

		await fireEvent.click(toggle);
		expect(await screen.findByText('Finie hier')).toBeInTheDocument();
		expect(toggle).toHaveAttribute('aria-expanded', 'true');

		await fireEvent.click(toggle);
		expect(screen.queryByText('Finie hier')).not.toBeInTheDocument();
	});

	it('scénario 6 — une tâche accomplie il y a plus de 7 jours n’apparaît pas, même dépliée', async () => {
		render(Page);
		await screen.findByText('Ranger le garage');

		await fireEvent.click(screen.getByRole('button', { name: /Tâches accomplies/ }));

		await screen.findByText('Finie hier');
		expect(screen.queryByText('Finie il y a longtemps')).not.toBeInTheDocument();
	});

	it('scénario 9 — une tâche accomplie sans date d’accomplissement est masquée de cet écran', async () => {
		render(Page);
		await screen.findByText('Ranger le garage');

		await fireEvent.click(screen.getByRole('button', { name: /Tâches accomplies/ }));

		await screen.findByText('Finie hier');
		expect(screen.queryByText('Finie sans date connue')).not.toBeInTheDocument();
	});

	it('scénario 7 — les tâches masquées ne sont pas supprimées du stockage', async () => {
		render(Page);
		await screen.findByText('Ranger le garage');

		// Le masquage est un choix d'affichage : les quatre tâches restent en mémoire, intactes.
		expect(tasksStore.tasks.map((t) => t.id).sort()).toEqual(['c1', 'c2', 'c3', 'p1']);
		expect(completionsStore.taskCompletions).toHaveLength(3);
	});

	it('scénario 4 — sans aucune tâche accomplie récente, la section n’apparaît pas du tout', async () => {
		await idbSet('tasks', [aFaire]);
		await idbSet('task-completions', []);
		tasksStore.loaded = false;
		completionsStore.loaded = false;

		render(Page);
		await screen.findByText('Ranger le garage');

		expect(screen.queryByRole('button', { name: /Tâches accomplies/ })).not.toBeInTheDocument();
	});
});
