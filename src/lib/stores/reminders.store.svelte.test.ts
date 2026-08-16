// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { RemindersStore } from './reminders.store.svelte';
import type { PushClient } from '$lib/push/client';
import { toIsoDate } from '$lib/domain/dates';
import type { Habit, HabitCompletion, ReminderSettings, Task, WeeklyReviewSettings } from '$lib/domain/types';

/**
 * Tests de `RemindersStore` (US-007) — le client push (`$lib/push/client`) est injecté
 * (même patron que les repositories) : aucun navigateur/service worker réel requis.
 */
function fakeSubscription(endpoint = 'https://push.example/abc'): PushSubscription {
	return { endpoint } as unknown as PushSubscription;
}

function fakeClient(overrides: Partial<PushClient> = {}): PushClient & {
	scheduled: Array<{
		endpoint: string;
		reminders: unknown[];
		taskReminders: unknown[];
		weeklyReviewReminders: unknown[];
	}>;
	unsubscribed: string[];
} {
	const scheduled: Array<{
		endpoint: string;
		reminders: unknown[];
		taskReminders: unknown[];
		weeklyReviewReminders: unknown[];
	}> = [];
	const unsubscribed: string[] = [];
	return {
		scheduled,
		unsubscribed,
		isPushSupported: () => true,
		isStandalone: () => true,
		notificationPermission: () => 'default',
		subscribe: vi.fn(async () => fakeSubscription()),
		getExistingSubscription: vi.fn(async () => null),
		pushSchedule: vi.fn(async (subscription, reminders, taskReminders = [], weeklyReviewReminders = []) => {
			scheduled.push({ endpoint: subscription.endpoint, reminders, taskReminders, weeklyReviewReminders });
		}),
		unsubscribe: vi.fn(async (subscription) => {
			unsubscribed.push(subscription.endpoint);
		}),
		...overrides
	};
}

const settingsEnabled: ReminderSettings = { enabled: true, time: '08:00', timezone: 'Europe/Paris' };
const habit: Habit = {
	id: 'h1',
	name: "Boire de l'eau",
	emoji: '💧',
	createdAt: '2026-08-10',
	frequency: { kind: 'interval', days: 1, anchor: '2026-08-10' }
};

describe('RemindersStore.availability (US-007 scénario 3bis)', () => {
	it('unsupported si le navigateur ne supporte pas le Web Push', () => {
		const store = new RemindersStore(fakeClient({ isPushSupported: () => false }));
		expect(store.availability()).toBe('unsupported');
	});

	it('needs-install si la PWA n\'est pas installée sur l\'écran d\'accueil', () => {
		const store = new RemindersStore(fakeClient({ isStandalone: () => false }));
		expect(store.availability()).toBe('needs-install');
	});

	it('available si supporté et installé', () => {
		const store = new RemindersStore(fakeClient());
		expect(store.availability()).toBe('available');
	});
});

describe('RemindersStore.enable (US-007 scénarios 4 et 5)', () => {
	it('scénario 4 — permission accordée : souscrit puis pousse la fenêtre de rappels', async () => {
		const client = fakeClient();
		const store = new RemindersStore(client);

		const sub = await store.enable([habit], settingsEnabled);

		expect(sub).not.toBeNull();
		expect(store.subscription).not.toBeNull();
		expect(client.scheduled).toHaveLength(1);
		expect(store.syncStatus).toBe('ok');
	});

	it('scénario 5 — permission refusée : aucune souscription, aucun rappel programmé silencieusement', async () => {
		const client = fakeClient({ subscribe: vi.fn(async () => null) });
		const store = new RemindersStore(client);

		const sub = await store.enable([habit], settingsEnabled);

		expect(sub).toBeNull();
		expect(store.subscription).toBeNull();
		expect(client.scheduled).toHaveLength(0);
	});
});

describe('RemindersStore.disable (US-007 scénario 6)', () => {
	it('désinscrit côté serveur et réinitialise la souscription locale', async () => {
		const client = fakeClient();
		const store = new RemindersStore(client);
		await store.enable([habit], settingsEnabled);

		await store.disable();

		expect(store.subscription).toBeNull();
		expect(client.unsubscribed).toHaveLength(1);
	});

	it('ne fait rien si aucune souscription active', async () => {
		const client = fakeClient();
		const store = new RemindersStore(client);

		await store.disable();

		expect(client.unsubscribed).toHaveLength(0);
	});
});

describe('RemindersStore.sync (US-007 scénarios 7/8/10)', () => {
	it('recalcule et repousse la fenêtre avec la nouvelle heure choisie', async () => {
		const client = fakeClient();
		const store = new RemindersStore(client);
		await store.enable([habit], settingsEnabled);

		await store.sync([habit], { ...settingsEnabled, time: '20:00' });

		expect(client.scheduled).toHaveLength(2);
	});

	it('best-effort (scénario 8) : ne programme plus le jour du rappel une fois marqué complet', async () => {
		const client = fakeClient();
		const store = new RemindersStore(client);
		// Heure tardive pour éviter tout flake proche de minuit lors de l'exécution des tests.
		const settingsLate: ReminderSettings = { ...settingsEnabled, time: '23:59' };
		await store.enable([habit], settingsLate);

		const today = toIsoDate(new Date());
		const completions: HabitCompletion[] = [{ habitId: habit.id, date: today, done: true }];
		await store.sync([habit], settingsLate, completions);

		const last = client.scheduled.at(-1);
		expect(last?.reminders.some((r) => (r as { date: string }).date === today)).toBe(false);
	});

	it('ne fait rien sans souscription active (pas d\'échec silencieux, simplement no-op)', async () => {
		const client = fakeClient();
		const store = new RemindersStore(client);

		await store.sync([habit], settingsEnabled);

		expect(client.scheduled).toHaveLength(0);
		expect(store.syncStatus).toBe('idle');
	});

	it('reflète une erreur réseau via syncStatus (pas d\'échec silencieux)', async () => {
		const client = fakeClient({
			pushSchedule: vi.fn(async () => {
				throw new Error('network down');
			})
		});
		const store = new RemindersStore(client);
		await store.enable([habit], settingsEnabled);

		expect(store.syncStatus).toBe('error');
	});
});

describe('RemindersStore.restore (US-007 scénario 9, reprise au démarrage)', () => {
	it('retrouve une souscription existante si disponible', async () => {
		const existing = fakeSubscription();
		const client = fakeClient({ getExistingSubscription: vi.fn(async () => existing) });
		const store = new RemindersStore(client);

		await store.restore();

		// `store.subscription` est un champ $state : la valeur assignée est enveloppée dans un
		// Proxy réactif, donc pas la même référence — comparaison structurelle (mêmes causes
		// que BUG-001, voir HabitsStore/SettingsStore).
		expect(store.subscription).toEqual(existing);
	});

	it('ne tente rien si le push n\'est pas disponible (PWA non installée)', async () => {
		const client = fakeClient({ isStandalone: () => false, getExistingSubscription: vi.fn(async () => fakeSubscription()) });
		const store = new RemindersStore(client);

		await store.restore();

		expect(store.subscription).toBeNull();
		expect(client.getExistingSubscription).not.toHaveBeenCalled();
	});
});

describe('RemindersStore — rappels nominatifs des tâches à heure limite (US-022)', () => {
	const task: Task = {
		id: 't1',
		name: 'Payer facture EDF',
		date: toIsoDate(new Date()),
		createdAt: '2026-08-01',
		dueTime: '23:45'
	};

	it('scénario 1 — pousse la fenêtre de tâches nominative en même temps que le récap habitudes', async () => {
		const client = fakeClient();
		const store = new RemindersStore(client);

		await store.enable([habit], settingsEnabled, [], [task]);

		const last = client.scheduled.at(-1);
		expect(last?.taskReminders).toHaveLength(1);
		expect((last?.taskReminders[0] as { body: string }).body).toContain('Payer facture EDF');
	});

	it("scénario 3 — aucune entrée de tâche si aucune tâche n'a d'heure limite", async () => {
		const client = fakeClient();
		const store = new RemindersStore(client);
		const noTime: Task = { ...task, dueTime: undefined };

		await store.enable([habit], settingsEnabled, [], [noTime]);

		expect(client.scheduled.at(-1)?.taskReminders).toEqual([]);
	});

	it('scénario 6 — aucun rappel de tâche si les rappels sont désactivés globalement', async () => {
		const client = fakeClient();
		const store = new RemindersStore(client);
		await store.enable([habit], settingsEnabled, [], [task]);

		await store.sync([habit], { ...settingsEnabled, enabled: false }, [], [task]);

		// `sync` est un no-op quand `enabled` est faux (même comportement que le canal habitudes) :
		// la dernière fenêtre poussée reste celle de l'activation initiale.
		expect(client.scheduled).toHaveLength(1);
	});
});

describe('RemindersStore — revue hebdomadaire poussée (US-028)', () => {
	const weeklyReviewEnabled: WeeklyReviewSettings = { enabled: true, weekday: 0, time: '18:00' };

	it('scénario 1 — pousse la fenêtre de revue hebdomadaire en même temps que le récap habitudes', async () => {
		const client = fakeClient();
		const store = new RemindersStore(client);

		await store.enable([habit], settingsEnabled, [], [], [], weeklyReviewEnabled);

		const last = client.scheduled.at(-1);
		expect((last?.weeklyReviewReminders as unknown[]).length).toBeGreaterThan(0);
	});

	it('scénario 3 — aucune entrée de revue hebdomadaire si son propre réglage est désactivé, même si le rappel quotidien est actif', async () => {
		const client = fakeClient();
		const store = new RemindersStore(client);

		await store.enable([habit], settingsEnabled, [], [], [], { ...weeklyReviewEnabled, enabled: false });

		expect(client.scheduled.at(-1)?.weeklyReviewReminders).toEqual([]);
	});

	it("n'ajoute aucune entrée si aucun réglage de revue hebdomadaire n'est fourni", async () => {
		const client = fakeClient();
		const store = new RemindersStore(client);

		await store.enable([habit], settingsEnabled);

		expect(client.scheduled.at(-1)?.weeklyReviewReminders).toEqual([]);
	});
});

/**
 * US-040 scénario 7 — une action de rappel effectuée hors ligne est retenue et rejouée, mais un
 * échec survenu EN LIGNE reste un échec définitif qu'il faut signaler. C'est cette distinction
 * que couvre ce bloc : `pending` (sera appliqué) vs `error` (ne le sera pas tout seul).
 */
describe('RemindersStore hors connexion (US-040 scénario 7)', () => {
	/** Store dont le client échoue sur les appels réseau, avec un état de connexion contrôlé. */
	function offlineStore(offline: boolean, overrides: Partial<PushClient> = {}) {
		const client = fakeClient({
			pushSchedule: vi.fn(async () => {
				throw new TypeError('Failed to fetch');
			}),
			...overrides
		});
		return { client, store: new RemindersStore(client, () => offline) };
	}

	it("met l'intention en attente quand la synchronisation échoue hors ligne", async () => {
		const { store } = offlineStore(true);
		store.subscription = fakeSubscription();

		await store.sync([habit], settingsEnabled);

		expect(store.syncStatus).toBe('pending');
		expect(store.pendingServerSync).toBe(true);
	});

	it('signale un échec définitif quand la synchronisation échoue alors que le réseau est là', async () => {
		const { store } = offlineStore(false);
		store.subscription = fakeSubscription();

		await store.sync([habit], settingsEnabled);

		expect(store.syncStatus).toBe('error');
		expect(store.pendingServerSync).toBe(false);
	});

	it("retient l'activation demandée hors ligne, la souscription étant impossible sans réseau", async () => {
		const { store } = offlineStore(true, {
			subscribe: vi.fn(async () => {
				throw new TypeError('Failed to fetch');
			})
		});

		const subscription = await store.enable([habit], settingsEnabled);

		expect(subscription).toBeNull();
		expect(store.pendingServerSync).toBe(true);
	});

	it('conserve la souscription quand la coupure demandée hors ligne ne peut pas être transmise', async () => {
		// La supprimer localement rendrait la coupure impossible à propager : le serveur
		// continuerait d'envoyer des rappels sans qu'on puisse jamais le lui dire.
		const { store } = offlineStore(true, {
			unsubscribe: vi.fn(async () => {
				throw new TypeError('Failed to fetch');
			})
		});
		store.subscription = fakeSubscription();

		await store.disable();

		expect(store.subscription).not.toBeNull();
		expect(store.pendingServerSync).toBe(true);
	});

	it("lève l'erreur telle quelle si la coupure échoue alors que le réseau est disponible", async () => {
		const { store } = offlineStore(false, {
			unsubscribe: vi.fn(async () => {
				throw new TypeError('Serveur indisponible');
			})
		});
		store.subscription = fakeSubscription();

		await expect(store.disable()).rejects.toThrow('Serveur indisponible');
	});

	it("lève l'attente dès qu'une synchronisation réussit", async () => {
		const client = fakeClient();
		const store = new RemindersStore(client, () => false);
		store.subscription = fakeSubscription();
		store.pendingServerSync = true;

		await store.sync([habit], settingsEnabled);

		expect(store.syncStatus).toBe('ok');
		expect(store.pendingServerSync).toBe(false);
	});
});
