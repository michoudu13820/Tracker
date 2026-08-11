import type { Config } from '@netlify/functions';
import webpush from 'web-push';
import {
	subscriptionsStore,
	saveSubscription,
	deleteSubscription,
	type StoredSubscription
} from './_shared/store';

/**
 * FONCTION PLANIFIÉE (cron) — le seul « moteur » du backend.
 * S'exécute périodiquement, lit tous les abonnements et envoie un push pour chaque
 * rappel dont l'instant `sendAt` est arrivé mais pas encore envoyé.
 *
 * Le serveur ne connaît QUE des instants d'envoi : le contenu est un rappel générique.
 * L'app affiche la liste réelle des habitudes localement quand l'utilisateur l'ouvre.
 * Voir docs/architecture/ADR-001.
 *
 * Granularité cron : toutes les 15 min. Le rappel est donc au pire 15 min « en retard »
 * sur l'heure choisie — acceptable pour un rappel quotidien. Réduire à `*\/5 * * * *`
 * si besoin de plus de précision.
 */
export default async function handler(): Promise<Response> {
	configureVapid();

	const store = subscriptionsStore();
	const { blobs } = await store.list();
	const now = Date.now();
	const GENERIC = {
		title: 'Tracker',
		body: "Tu as des habitudes prévues aujourd'hui.",
		tag: 'daily-reminder'
	};

	for (const { key } of blobs) {
		const data = (await store.get(key, { type: 'json' })) as StoredSubscription | null;
		if (!data) continue;

		// Rappels arrivés à échéance et non encore envoyés.
		const due = data.reminders.filter(
			(r) => r.sendAt <= now && (data.lastSentAt === undefined || r.sendAt > data.lastSentAt)
		);
		if (due.length === 0) continue;

		try {
			await webpush.sendNotification(
				{
					endpoint: data.subscription.endpoint,
					keys: data.subscription.keys
				},
				JSON.stringify(GENERIC)
			);

			// Purge les rappels passés + mémorise le dernier envoi (anti-doublon).
			const latest = Math.max(...due.map((r) => r.sendAt));
			await saveSubscription({
				...data,
				reminders: data.reminders.filter((r) => r.sendAt > now),
				lastSentAt: latest,
				updatedAt: now
			});
		} catch (err) {
			// 404/410 = souscription expirée côté navigateur → on nettoie.
			const status = (err as { statusCode?: number }).statusCode;
			if (status === 404 || status === 410) {
				await deleteSubscription(data.subscription.endpoint);
			}
		}
	}

	return new Response('ok');
}

function configureVapid() {
	const publicKey = process.env.VAPID_PUBLIC_KEY;
	const privateKey = process.env.VAPID_PRIVATE_KEY;
	const subject = process.env.VAPID_SUBJECT ?? 'mailto:admin@example.com';
	if (!publicKey || !privateKey) {
		throw new Error('VAPID keys manquantes (VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY).');
	}
	webpush.setVapidDetails(subject, publicKey, privateKey);
}

/** Planification cron : toutes les 15 minutes. */
export const config: Config = {
	schedule: '*/15 * * * *'
};
