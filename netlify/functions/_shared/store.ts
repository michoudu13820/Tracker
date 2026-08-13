import { getStore } from '@netlify/blobs';
import { createHash } from 'node:crypto';

/**
 * Stockage serveur MINIMAL (Netlify Blobs — clé/valeur, inclus dans l'offre gratuite).
 * Pas de base de données, pas de compte utilisateur.
 *
 * Ce qui est stocké par abonnement (et RIEN d'autre) :
 *  - la souscription Web Push (endpoint + clés de chiffrement du navigateur)
 *  - la liste des instants de rappel calculés PAR LE CLIENT (aucune donnée métier)
 *
 * L'endpoint de la souscription sert d'identifiant implicite : on le hache (SHA-256)
 * pour obtenir une clé de blob stable. Voir docs/architecture/ADR-001.
 */

export interface ScheduledReminder {
	date: string;
	sendAt: number;
}

/**
 * Rappel nominatif de tâche à heure limite (US-022) : contrairement à `ScheduledReminder`
 * (récap générique des habitudes, US-007), transporte un contenu déjà composé côté client
 * (`title`/`body`), qui NOMME la ou les tâches concernées.
 *
 * Dérogation explicitement actée et circonscrite par l'amendement du 2026-08-12 à ADR-001:
 * c'est la SEULE donnée métier autorisée à transiter et être persistée côté serveur, et
 * uniquement le temps de l'émission — voir la politique de purge dans `send-due.ts`
 * (`sendDueReminders`) et le filtrage défensif à l'écriture dans `register-subscription.ts`.
 */
export interface ScheduledTaskReminder {
	sendAt: number;
	title: string;
	body: string;
}

export interface StoredSubscription {
	subscription: PushSubscriptionJSON;
	reminders: ScheduledReminder[];
	/** Rappels nominatifs de tâches à heure limite en attente d'émission (US-022). Optionnel
	 * pour rester rétro-compatible avec les abonnements enregistrés avant cette US. */
	taskReminders?: ScheduledTaskReminder[];
	/** Rappels de revue hebdomadaire poussée en attente d'émission (US-028). Contenu générique
	 * (non nominatif, aucune donnée métier — même forme que `reminders`) ; optionnel pour rester
	 * rétro-compatible avec les abonnements enregistrés avant cette US. */
	weeklyReviewReminders?: ScheduledReminder[];
	/** Marque anti-doublon du récap générique : dernier `sendAt` déjà envoyé. */
	lastSentAt?: number;
	/** Marque anti-doublon des rappels nominatifs de tâches (US-022) — distincte de
	 * `lastSentAt` : deux canaux de contenu différents, purgés indépendamment. */
	lastTaskSentAt?: number;
	/** Marque anti-doublon de la revue hebdomadaire (US-028) — canal indépendant des deux autres. */
	lastWeeklyReviewSentAt?: number;
	updatedAt: number;
}

/** Type minimal de la souscription telle que sérialisée par le navigateur. */
export interface PushSubscriptionJSON {
	endpoint: string;
	keys: { p256dh: string; auth: string };
}

const STORE_NAME = 'push-subscriptions';

export function keyFor(endpoint: string): string {
	return createHash('sha256').update(endpoint).digest('hex');
}

export function subscriptionsStore() {
	return getStore(STORE_NAME);
}

export async function saveSubscription(data: StoredSubscription): Promise<void> {
	const store = subscriptionsStore();
	await store.setJSON(keyFor(data.subscription.endpoint), data);
}

export async function deleteSubscription(endpoint: string): Promise<void> {
	const store = subscriptionsStore();
	await store.delete(keyFor(endpoint));
}
