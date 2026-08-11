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

export interface StoredSubscription {
	subscription: PushSubscriptionJSON;
	reminders: ScheduledReminder[];
	/** Marque anti-doublon : dernier `sendAt` déjà envoyé. */
	lastSentAt?: number;
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
