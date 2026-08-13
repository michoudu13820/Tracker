import type {
	Habit,
	HabitCompletion,
	ReminderSettings,
	Task,
	TaskCompletion,
	WeeklyReviewSettings
} from '$lib/domain/types';
import {
	computeReminderWindow,
	computeTaskReminderWindow,
	computeWeeklyReviewWindow
} from '$lib/domain/reminders';
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
	 *
	 * `tasks`/`taskCompletions` alimentent le second canal de rappels — nominatif, à l'heure
	 * limite d'une tâche (US-022) — synchronisé en même temps que le récap matinal des
	 * habitudes. `weeklyReview` alimente le troisième canal — la revue hebdomadaire poussée
	 * (US-028), indépendante de `settings.enabled` sur son propre réglage mais nécessitant la
	 * même souscription active.
	 */
	async enable(
		habits: Habit[],
		settings: ReminderSettings,
		completions: HabitCompletion[] = [],
		tasks: Task[] = [],
		taskCompletions: TaskCompletion[] = [],
		weeklyReview?: WeeklyReviewSettings
	): Promise<PushSubscription | null> {
		const sub = await this.#client.subscribe();
		this.subscription = sub;
		if (sub) await this.sync(habits, settings, completions, tasks, taskCompletions, weeklyReview);
		return sub;
	}

	/** Désactive les rappels côté serveur (US-007 scénario 6) : coupe aussi les canaux nominatif
	 * des tâches à heure limite (US-022 scénario 6) et de revue hebdomadaire (US-028), la
	 * souscription entière étant supprimée. */
	async disable(): Promise<void> {
		if (!this.subscription) return;
		await this.#client.unsubscribe(this.subscription);
		this.subscription = null;
	}

	/**
	 * Recalcule les trois fenêtres glissantes localement et les re-pousse au serveur (US-007
	 * scénarios 7/8/10, US-022, US-028) : le récap générique des habitudes (`reminders`), les
	 * rappels nominatifs des tâches à heure limite (`taskReminders`) et la revue hebdomadaire
	 * poussée (`weeklyReviewReminders`). À appeler à chaque ouverture de l'app et après tout
	 * changement d'habitudes, de tâches, de complétions ou de réglage d'heure.
	 */
	async sync(
		habits: Habit[],
		settings: ReminderSettings,
		completions: HabitCompletion[] = [],
		tasks: Task[] = [],
		taskCompletions: TaskCompletion[] = [],
		weeklyReview?: WeeklyReviewSettings
	): Promise<void> {
		if (!this.subscription || !settings.enabled) return;
		this.syncStatus = 'syncing';
		try {
			const now = new Date();
			const window = computeReminderWindow(habits, settings, 30, now, completions);
			const taskWindow = computeTaskReminderWindow(tasks, settings, 30, now, taskCompletions);
			const weeklyReviewWindow = weeklyReview
				? computeWeeklyReviewWindow(weeklyReview, 30, now)
				: [];
			await this.#client.pushSchedule(this.subscription, window, taskWindow, weeklyReviewWindow);
			this.syncStatus = 'ok';
		} catch {
			this.syncStatus = 'error';
		}
	}
}

/** Instance unique partagée par l'app. */
export const remindersStore = new RemindersStore();
