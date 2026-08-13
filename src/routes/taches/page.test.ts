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

		const checkbox = screen.getByRole('checkbox', {
			name: 'Marquer « Appeler le plombier » comme faite'
		});
		await fireEvent.click(checkbox);
		await fireEvent.click(checkbox);

		expect(sync).toHaveBeenCalledTimes(2);
	});
});
