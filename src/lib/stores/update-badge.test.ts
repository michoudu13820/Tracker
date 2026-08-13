// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateBadge } from './update-badge';
import { habitsStore } from './habits.store.svelte';
import { tasksStore } from './tasks.store.svelte';
import { completionsStore } from './completions.store.svelte';
import { badgeStore } from './badge.store.svelte';
import { toIsoDate } from '$lib/domain/dates';
import type { Habit, Task } from '$lib/domain/types';

/**
 * Tests de `updateBadge` (US-031) — coordination inter-stores, testée en manipulant directement
 * l'état des stores singleton et en espionnant `badgeStore.update` (déjà testé isolément dans
 * `badge.store.svelte.test.ts`).
 */
const today = toIsoDate(new Date());
const habit: Habit = {
	id: 'h1',
	name: "Boire de l'eau",
	emoji: '💧',
	createdAt: today,
	frequency: { kind: 'interval', days: 1, anchor: today }
};
const task: Task = { id: 't1', name: 'Appeler le plombier', date: today, createdAt: today };

beforeEach(() => {
	habitsStore.habits = [];
	tasksStore.tasks = [];
	completionsStore.habitCompletions = [];
	completionsStore.taskCompletions = [];
	vi.restoreAllMocks();
});

describe('updateBadge (US-031)', () => {
	it("recalcule et applique le badge à partir de l'état courant des stores, pour aujourd'hui", async () => {
		habitsStore.habits = [habit];
		tasksStore.tasks = [task];

		const update = vi.spyOn(badgeStore, 'update').mockResolvedValue();
		await updateBadge();

		expect(update).toHaveBeenCalledWith([habit], [], [task], [], today);
	});
});
