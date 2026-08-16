// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { flushPendingReminders, watchReconnection } from './reminders-reconnect';
import { settingsStore } from './settings.store.svelte';
import { habitsStore } from './habits.store.svelte';
import { tasksStore } from './tasks.store.svelte';
import { completionsStore } from './completions.store.svelte';
import { remindersStore } from './reminders.store.svelte';
import type { Habit, ReminderSettings } from '$lib/domain/types';

/**
 * Tests du rejeu au retour du réseau (US-040 scénario 7). Même patron que
 * `resync-reminders.test.ts` : on manipule l'état des stores singleton et on espionne
 * `remindersStore`, déjà testé isolément.
 */
const enabled: ReminderSettings = { enabled: true, time: '08:00', timezone: 'Europe/Paris' };
const disabled: ReminderSettings = { enabled: false, time: '08:00', timezone: 'Europe/Paris' };
const habit: Habit = {
	id: 'h1',
	name: "Boire de l'eau",
	emoji: '💧',
	createdAt: '2026-08-10',
	frequency: { kind: 'interval', days: 1, anchor: '2026-08-10' }
};

function fakeSubscription(): PushSubscription {
	return { endpoint: 'https://push.example/abc' } as unknown as PushSubscription;
}

beforeEach(() => {
	settingsStore.reminder = null;
	settingsStore.weeklyReview = null;
	habitsStore.habits = [];
	tasksStore.tasks = [];
	completionsStore.habitCompletions = [];
	completionsStore.taskCompletions = [];
	remindersStore.subscription = null;
	remindersStore.pendingServerSync = false;
	vi.restoreAllMocks();
});

describe('flushPendingReminders (US-040 scénario 7)', () => {
	it('ne fait rien tant que les réglages ne sont pas chargés', async () => {
		const sync = vi.spyOn(remindersStore, 'sync').mockResolvedValue();
		const enable = vi.spyOn(remindersStore, 'enable').mockResolvedValue(null);

		await flushPendingReminders();

		expect(sync).not.toHaveBeenCalled();
		expect(enable).not.toHaveBeenCalled();
	});

	it("réalise l'activation demandée hors ligne dès que le réseau revient", async () => {
		settingsStore.reminder = enabled;
		habitsStore.habits = [habit];
		remindersStore.subscription = null;
		vi.spyOn(remindersStore, 'permission').mockReturnValue('granted');
		const enable = vi.spyOn(remindersStore, 'enable').mockResolvedValue(fakeSubscription());

		await flushPendingReminders();

		expect(enable).toHaveBeenCalledTimes(1);
		expect(enable).toHaveBeenCalledWith([habit], enabled, [], [], [], undefined);
	});

	it("ne déclenche jamais de demande de permission sans geste de l'utilisateur", async () => {
		settingsStore.reminder = enabled;
		remindersStore.subscription = null;
		vi.spyOn(remindersStore, 'permission').mockReturnValue('default');
		const enable = vi.spyOn(remindersStore, 'enable').mockResolvedValue(null);

		await flushPendingReminders();

		expect(enable).not.toHaveBeenCalled();
	});

	it('propage au serveur la coupure demandée hors ligne', async () => {
		settingsStore.reminder = disabled;
		remindersStore.subscription = fakeSubscription();
		const disable = vi.spyOn(remindersStore, 'disable').mockResolvedValue();

		await flushPendingReminders();

		expect(disable).toHaveBeenCalledTimes(1);
	});

	it("n'appelle pas le serveur si les rappels sont coupés et qu'aucune souscription ne subsiste", async () => {
		settingsStore.reminder = disabled;
		remindersStore.subscription = null;
		const disable = vi.spyOn(remindersStore, 'disable').mockResolvedValue();

		await flushPendingReminders();

		expect(disable).not.toHaveBeenCalled();
	});

	it("n'applique que l'état final après plusieurs modifications successives hors ligne", async () => {
		// L'utilisateur a changé l'heure trois fois sans réseau. Le rejeu ne doit pas rejouer les
		// étapes intermédiaires : il repart de l'état courant, qui est déjà le dernier.
		settingsStore.reminder = enabled;
		remindersStore.subscription = fakeSubscription();
		const sync = vi.spyOn(remindersStore, 'sync').mockResolvedValue();

		settingsStore.reminder = { ...enabled, time: '08:30' };
		settingsStore.reminder = { ...enabled, time: '09:00' };
		const finalSettings = { ...enabled, time: '09:15' };
		settingsStore.reminder = finalSettings;

		await flushPendingReminders();

		expect(sync).toHaveBeenCalledTimes(1);
		expect(sync).toHaveBeenCalledWith([], finalSettings, [], [], [], undefined);
	});

	it('est idempotent : deux rejeux consécutifs produisent le même état', async () => {
		settingsStore.reminder = enabled;
		remindersStore.subscription = fakeSubscription();
		const sync = vi.spyOn(remindersStore, 'sync').mockResolvedValue();

		await flushPendingReminders();
		await flushPendingReminders();

		expect(sync).toHaveBeenNthCalledWith(1, [], enabled, [], [], [], undefined);
		expect(sync).toHaveBeenNthCalledWith(2, [], enabled, [], [], [], undefined);
	});
});

describe('watchReconnection (US-040 scénario 7)', () => {
	it("rejoue automatiquement à l'événement `online`, sans action de l'utilisateur", async () => {
		settingsStore.reminder = enabled;
		remindersStore.subscription = fakeSubscription();
		const sync = vi.spyOn(remindersStore, 'sync').mockResolvedValue();

		const stop = watchReconnection();
		window.dispatchEvent(new Event('online'));
		await vi.waitFor(() => expect(sync).toHaveBeenCalledTimes(1));

		stop();
	});

	it('ne rejoue plus après désabonnement', async () => {
		settingsStore.reminder = enabled;
		remindersStore.subscription = fakeSubscription();
		const sync = vi.spyOn(remindersStore, 'sync').mockResolvedValue();

		const stop = watchReconnection();
		stop();
		window.dispatchEvent(new Event('online'));

		expect(sync).not.toHaveBeenCalled();
	});
});
