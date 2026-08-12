import type { Habit, ReminderSettings } from '$lib/domain/types';
import { computeReminderWindow } from '$lib/domain/reminders';
import {
	isPushSupported,
	isStandalone,
	pushSchedule,
	subscribe,
	unsubscribe
} from '$lib/push/client';

/**
 * Orchestration RUNTIME des rappels Web Push (US-007) — état lié à l'appareil/navigateur,
 * distinct des préférences persistées (heure, activation) qui vivent dans `settings.store`.
 *
 * Responsabilités : refléter la disponibilité du push (PWA installée ? permission ?),
 * (dé)clencher la souscription, et RE-POUSSER la fenêtre glissante de rappels au serveur
 * à chaque ouverture / changement de données (l'app statique ne peut pas se réveiller seule).
 *
 * SQUELETTE : les transitions d'état fines (scénarios 3bis « PWA non installée », 4 demande
 * de permission, 5 refus visible, 8 best-effort) sont à finaliser lors de l'implémentation
 * de US-007. Voir docs/architecture/ADR-001 et US-007.
 */

/** Disponibilité du canal de rappel, dérivée de l'environnement (US-007 scénarios 3bis/5). */
export type PushAvailability =
	| 'unsupported' // navigateur sans Web Push
	| 'needs-install' // PWA non installée sur l'écran d'accueil (iOS) → push impossible
	| 'available'; // installable/utilisable, permission à demander

export class RemindersStore {
	/** Souscription active (null tant que non abonné / refusé). */
	subscription = $state<PushSubscription | null>(null);
	/** Dernier résultat de synchronisation de la fenêtre au serveur. */
	syncStatus = $state<'idle' | 'syncing' | 'ok' | 'error'>('idle');

	/** Disponibilité courante du push selon l'environnement (US-007 scénario 3bis). */
	availability(): PushAvailability {
		if (!isPushSupported()) return 'unsupported';
		if (!isStandalone()) return 'needs-install';
		return 'available';
	}

	/**
	 * Active les rappels (US-007 scénario 4) : demande la permission, souscrit, puis pousse
	 * la fenêtre. Retourne la souscription, ou null si non supporté / permission refusée
	 * (scénario 5 : l'appelant doit alors afficher un état visible, pas d'échec silencieux).
	 */
	async enable(habits: Habit[], settings: ReminderSettings): Promise<PushSubscription | null> {
		const sub = await subscribe();
		this.subscription = sub;
		if (sub) await this.sync(habits, settings);
		return sub;
	}

	/** Désactive les rappels côté serveur (US-007 scénario 6). */
	async disable(): Promise<void> {
		if (!this.subscription) return;
		await unsubscribe(this.subscription);
		this.subscription = null;
	}

	/**
	 * Recalcule la fenêtre glissante localement et la re-pousse au serveur (US-007 scénarios
	 * 7/8/10). À appeler à chaque ouverture de l'app et après tout changement d'habitudes,
	 * de complétions ou de réglage d'heure.
	 */
	async sync(habits: Habit[], settings: ReminderSettings): Promise<void> {
		if (!this.subscription || !settings.enabled) return;
		this.syncStatus = 'syncing';
		try {
			const window = computeReminderWindow(habits, settings);
			await pushSchedule(this.subscription, window);
			this.syncStatus = 'ok';
		} catch {
			this.syncStatus = 'error';
		}
	}
}

/** Instance unique partagée par l'app. */
export const remindersStore = new RemindersStore();
