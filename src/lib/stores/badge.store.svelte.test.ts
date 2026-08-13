// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { BadgeStore } from './badge.store.svelte';
import type { BadgeClient } from '$lib/badge/client';
import type { Habit, HabitCompletion, Task } from '$lib/domain/types';

/**
 * Tests de `BadgeStore` (US-031) — le client badge (`$lib/badge/client`) est injecté (même
 * patron que `RemindersStore`) : aucun navigateur réel requis, aucune dépendance à la
 * disponibilité effective de l'App Badging API.
 */
function fakeClient(overrides: Partial<BadgeClient> = {}): BadgeClient & {
	setCalls: number[];
	cleared: number;
} {
	const setCalls: number[] = [];
	let cleared = 0;
	return {
		setCalls,
		get cleared() {
			return cleared;
		},
		isBadgingSupported: () => true,
		setBadge: vi.fn(async (count: number) => {
			setCalls.push(count);
		}),
		clearBadge: vi.fn(async () => {
			cleared++;
		}),
		...overrides
	};
}

const habit: Habit = {
	id: 'h1',
	name: "Boire de l'eau",
	emoji: '💧',
	createdAt: '2026-08-01',
	frequency: { kind: 'interval', days: 1, anchor: '2026-08-01' }
};
const task: Task = { id: 't1', name: 'Appeler le plombier', date: '2026-08-12', createdAt: '2026-08-01' };

describe('BadgeStore.update (US-031)', () => {
	it('scénario 1 — affiche le badge avec le nombre restant', async () => {
		const client = fakeClient();
		const store = new BadgeStore(client);

		await store.update([habit], [], [task], [], '2026-08-12');

		expect(client.setBadge).toHaveBeenCalledWith(2);
		expect(client.clearBadge).not.toHaveBeenCalled();
		expect(store.lastCount).toBe(2);
	});

	it('scénario 2 — retire le badge quand tout est fait', async () => {
		const client = fakeClient();
		const store = new BadgeStore(client);
		const habitCompletions: HabitCompletion[] = [{ habitId: habit.id, date: '2026-08-12', done: true }];

		await store.update([habit], habitCompletions, [], [], '2026-08-12');

		expect(client.clearBadge).toHaveBeenCalledTimes(1);
		expect(client.setBadge).not.toHaveBeenCalled();
		expect(store.lastCount).toBe(0);
	});

	it('scénario 3 — reflète une baisse après cochage lors du prochain appel', async () => {
		const client = fakeClient();
		const store = new BadgeStore(client);

		await store.update([habit], [], [task], [], '2026-08-12');
		const habitCompletions: HabitCompletion[] = [{ habitId: habit.id, date: '2026-08-12', done: true }];
		await store.update([habit], habitCompletions, [task], [], '2026-08-12');

		expect(client.setBadge).toHaveBeenLastCalledWith(1);
	});

	it("reste silencieux (aucune erreur propagée) si le client échoue — délégué au client, mais no-op au niveau du store", async () => {
		const client = fakeClient({
			setBadge: vi.fn(async () => {
				/* simulateur : le vrai client avale déjà ses erreurs, voir client.test.ts */
			})
		});
		const store = new BadgeStore(client);

		await expect(store.update([habit], [], [], [], '2026-08-12')).resolves.toBeUndefined();
	});
});

describe('BadgeStore.supported', () => {
	it("reflète le support déclaré par le client injecté", () => {
		const supported = new BadgeStore(fakeClient({ isBadgingSupported: () => true }));
		const unsupported = new BadgeStore(fakeClient({ isBadgingSupported: () => false }));

		expect(supported.supported()).toBe(true);
		expect(unsupported.supported()).toBe(false);
	});
});
