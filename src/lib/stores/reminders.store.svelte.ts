import type { Habit, HabitCompletion, ReminderSettings } from '$lib/domain/types';
import { computeReminderWindow } from '$lib/domain/reminders';
import { defaultPushClient, type PushClient } from '$lib/push/client';

/**
 * Orchestration RUNTIME des rappels Web Push (US-007) — état lié à l'appareil/navigateur,
 * distinct des préférences persistées (heure, activation) qui vivent dans `settings.store`.
 *
 * Responsabilités : refléter la disponibilité du push (PWA installée ? permission ?),
 * (dé)clencher la souscription, et RE-POUSSER la fenêtre glissante de rappels au serveur
 * à chaque ouverture / changement de données (l'app statique ne peut pas se réveiller seule).
 *
 * Le client push (`$lib/push/client`) est injecté (même patron que les repositories de
 * `$lib/data`) : mockable en test, sans navigateur ni service worker réels.
 */

/** Disponibilité du canal de rappel, dérivée de l'environnement (US-007 scénario 3bis). */
export type PushAvailability =
	| 'unsupported' // navigateur sans Web Push
	| 'needs-install' // PWA non installée sur l'écran d'accueil (iOS) → push impossible
	| 'available'; // installable/utilisable, permission à demander

export class RemindersStore {
	#client: PushClient;

	/** Souscription active (null tant que non abonné / refusé). */
	subscription = $state<PushSubscription | null>(null);
	/** Dernier résultat de synchronisation de la fenêtre au serveur. */
	syncStatus = $state<'idle' | 'syncing' | 'ok' | 'error'>('idle');

	constructor(client: PushClient = defaultPushClient) {
		this.#client = client;
	}

	/** Disponibilité courante du push selon l'environnement (US-007 scénario 3bis). */
	availability(): PushAvailability {
		if (!this.#client.isPushSupported()) return 'unsupported';
		if (!this.#client.isStandalone()) return 'needs-install';
		return 'available';
	}

	/** Permission navigateur courante, sans jamais la demander (US-007 scénario 5, affichage). */
	permission(): NotificationPermission | 'unsupported' {
		return this.#client.notificationPermission();
	}

	/**
	 * Retrouve, au démarrage de l'app, une souscription déjà acceptée lors d'une session
	 * précédente (l'état en mémoire ne survit pas à un rechargement). Ne demande jamais la
	 * permission — c'est une lecture, pas une activation (voir `enable`).
	 */
	async restore(): Promise<void> {
		if (this.availability() !== 'available') return;
		this.subscription = await this.#client.getExistingSubscription();
	}

	/**
	 * Active les rappels (US-007 scénario 4) : demande la permission, souscrit, puis pousse
	 * la fenêtre. Retourne la souscription, ou null si non supporté / permission refusée
	 * (scénario 5 : l'appelant doit alors afficher un état visible, pas d'échec silencieux).
	 */
	async enable(
		habits: Habit[],
		settings: ReminderSettings,
		completions: HabitCompletion[] = []
	): Promise<PushSubscription | null> {
		const sub = await this.#client.subscribe();
		this.subscription = sub;
		if (sub) await this.sync(habits, settings, completions);
		return sub;
	}

	/** Désactive les rappels côté serveur (US-007 scénario 6). */
	async disable(): Promise<void> {
		if (!this.subscription) return;
		await this.#client.unsubscribe(this.subscription);
		this.subscription = null;
	}

	/**
	 * Recalcule la fenêtre glissante localement et la re-pousse au serveur (US-007 scénarios
	 * 7/8/10). À appeler à chaque ouverture de l'app et après tout changement d'habitudes,
	 * de complétions ou de réglage d'heure.
	 */
	async sync(
		habits: Habit[],
		settings: ReminderSettings,
		completions: HabitCompletion[] = []
	): Promise<void> {
		if (!this.subscription || !settings.enabled) return;
		this.syncStatus = 'syncing';
		try {
			const window = computeReminderWindow(habits, settings, 30, new Date(), completions);
			await this.#client.pushSchedule(this.subscription, window);
			this.syncStatus = 'ok';
		} catch {
			this.syncStatus = 'error';
		}
	}
}

/** Instance unique partagée par l'app. */
export const remindersStore = new RemindersStore();
