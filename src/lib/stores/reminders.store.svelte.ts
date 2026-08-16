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
import { isOffline as defaultIsOffline } from '$lib/offline/connectivity';

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
	#isOffline: () => boolean;

	/** Souscription active (null tant que non abonné / refusé). */
	subscription = $state<PushSubscription | null>(null);
	/**
	 * Dernier résultat de synchronisation de la fenêtre au serveur.
	 *
	 * `pending` (US-040 scénario 7) se distingue d'`error` : l'intention est comprise et sera
	 * rejouée automatiquement au retour du réseau, alors qu'`error` signale un échec définitif
	 * que l'utilisateur doit connaître — sans quoi il croirait son rappel actif à tort.
	 */
	syncStatus = $state<'idle' | 'syncing' | 'ok' | 'error' | 'pending'>('idle');
	/** Vrai tant qu'une intention attend le retour du réseau pour être appliquée côté serveur. */
	pendingServerSync = $state(false);

	constructor(client: PushClient = defaultPushClient, isOffline: () => boolean = defaultIsOffline) {
		this.#client = client;
		this.#isOffline = isOffline;
	}

	/**
	 * Qualifie l'échec d'un appel serveur : hors ligne → à rejouer plus tard ; en ligne → échec
	 * définitif à signaler. Centralisé pour que les trois actions (activer, désactiver, changer
	 * l'heure) se comportent identiquement.
	 */
	#recordFailure(): 'pending' | 'error' {
		if (this.#isOffline()) {
			this.pendingServerSync = true;
			this.syncStatus = 'pending';
			return 'pending';
		}
		this.syncStatus = 'error';
		return 'error';
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
		let sub: PushSubscription | null;
		try {
			sub = await this.#client.subscribe();
		} catch (error) {
			// US-040 scénario 7 : la souscription elle-même a besoin du réseau (elle contacte le
			// service de push). Hors ligne, on retient l'intention plutôt que d'échouer — la
			// préférence « rappels activés » est persistée localement par l'appelant, et
			// `flushPendingReminders` réessaiera la souscription au retour du réseau.
			if (this.#recordFailure() === 'pending') return null;
			throw error;
		}
		this.subscription = sub;
		if (sub) await this.sync(habits, settings, completions, tasks, taskCompletions, weeklyReview);
		return sub;
	}

	/** Désactive les rappels côté serveur (US-007 scénario 6) : coupe aussi les canaux nominatif
	 * des tâches à heure limite (US-022 scénario 6) et de revue hebdomadaire (US-028), la
	 * souscription entière étant supprimée. */
	async disable(): Promise<void> {
		if (!this.subscription) return;
		try {
			await this.#client.unsubscribe(this.subscription);
		} catch (error) {
			// US-040 scénario 7 : hors ligne, on CONSERVE volontairement la souscription. La
			// supprimer localement rendrait la coupure impossible à propager, et le serveur
			// continuerait d'envoyer des rappels sans qu'on puisse jamais le lui dire.
			if (this.#recordFailure() === 'pending') return;
			throw error;
		}
		this.subscription = null;
		this.pendingServerSync = false;
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
			this.pendingServerSync = false;
		} catch {
			this.#recordFailure();
		}
	}
}

/** Instance unique partagée par l'app. */
export const remindersStore = new RemindersStore();
