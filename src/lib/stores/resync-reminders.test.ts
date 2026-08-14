// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resyncReminders } from './resync-reminders';
import { settingsStore } from './settings.store.svelte';
import { habitsStore } from './habits.store.svelte';
import { tasksStore } from './tasks.store.svelte';
import { completionsStore } from './completions.store.svelte';
import { remindersStore } from './reminders.store.svelte';
import type {
	Habit,
	HabitCompletion,
	ReminderSettings,
	Task,
	TaskCompletion,
	WeeklyReviewSettings
} from '$lib/domain/types';

/**
 * Tests de `resyncReminders` (US-023) — coordination inter-stores explicite, testée en
 * manipulant directement l'état des stores singleton (mêmes champs `$state` publics que ceux
 * lus/écrits par les routes) et en espionnant `remindersStore.sync` (déjà testé isolément dans
 * `reminders.store.svelte.test.ts`).
 */
const settings: ReminderSettings = { enabled: true, time: '08:00', timezone: 'Europe/Paris' };
const habit: Habit = {
	id: 'h1',
	name: "Boire de l'eau",
	emoji: '💧',
	createdAt: '2026-08-10',
	frequency: { kind: 'interval', days: 1, anchor: '2026-08-10' }
};
const task: Task = {
	id: 't1',
	name: 'Payer facture EDF',
	date: '2026-08-10',
	createdAt: '2026-08-01',
	dueTime: '18:00'
};

beforeEach(() => {
	settingsStore.reminder = null;
	settingsStore.weeklyReview = null;
	habitsStore.habits = [];
	tasksStore.tasks = [];
	completionsStore.habitCompletions = [];
	completionsStore.taskCompletions = [];
	vi.restoreAllMocks();
});

describe('resyncReminders (US-023)', () => {
	it("ne fait rien si les réglages ne sont pas encore chargés", async () => {
		const sync = vi.spyOn(remindersStore, 'sync').mockResolvedValue();
		await resyncReminders();
		expect(sync).not.toHaveBeenCalled();
	});

	it('scénario 1/2 — repousse les deux fenêtres (habitudes ET tâches) avec l\'état courant des stores', async () => {
		settingsStore.reminder = settings;
		habitsStore.habits = [habit];
		tasksStore.tasks = [task];
		const habitCompletions: HabitCompletion[] = [{ habitId: habit.id, date: '2026-08-10', done: true }];
		const taskCompletions: TaskCompletion[] = [{ taskId: task.id, done: true }];
		completionsStore.habitCompletions = habitCompletions;
		completionsStore.taskCompletions = taskCompletions;

		const sync = vi.spyOn(remindersStore, 'sync').mockResolvedValue();
		await resyncReminders();

		expect(sync).toHaveBeenCalledWith(
			[habit],
			settings,
			habitCompletions,
			[task],
			taskCompletions,
			undefined
		);
	});

	it('scénario 5 — appelle la resynchronisation même sans aucune tâche à heure limite', async () => {
		settingsStore.reminder = settings;
		habitsStore.habits = [habit];

		const sync = vi.spyOn(remindersStore, 'sync').mockResolvedValue();
		await resyncReminders();

		expect(sync).toHaveBeenCalledTimes(1);
	});

	it('US-033 scénario 7 — resynchronise à l’identique pour une habitude à fréquence « jours du mois »', async () => {
		// Aucun cas particulier : `resyncReminders` transmet les habitudes telles quelles, quel
		// que soit leur mode de fréquence — la sélection des jours dus reste faite en aval par
		// `isDueOn`. La limite best-effort d'ADR-001/US-023 scénario 3 est donc inchangée.
		const monthly: Habit = {
			id: 'hm',
			name: 'Sauvegarde',
			emoji: '💾',
			createdAt: '2026-08-01',
			frequency: { kind: 'monthdays', monthdays: [1, 15] }
		};
		settingsStore.reminder = settings;
		habitsStore.habits = [monthly];
		const habitCompletions: HabitCompletion[] = [
			{ habitId: monthly.id, date: '2026-08-15', done: true }
		];
		completionsStore.habitCompletions = habitCompletions;

		const sync = vi.spyOn(remindersStore, 'sync').mockResolvedValue();
		await resyncReminders();

		expect(sync).toHaveBeenCalledWith([monthly], settings, habitCompletions, [], [], undefined);
	});

	it('transmet également les réglages de revue hebdomadaire (US-028) quand ils sont chargés', async () => {
		const weeklyReview: WeeklyReviewSettings = { enabled: true, weekday: 0, time: '18:00' };
		settingsStore.reminder = settings;
		settingsStore.weeklyReview = weeklyReview;

		const sync = vi.spyOn(remindersStore, 'sync').mockResolvedValue();
		await resyncReminders();

		expect(sync).toHaveBeenCalledWith([], settings, [], [], [], weeklyReview);
	});
});
