import webpush from 'web-push';
import { subscriptionsStore, saveSubscription, deleteSubscription, type StoredSubscription } from './store';

const GENERIC = {
	title: 'Tracker',
	body: "Tu as des habitudes prévues aujourd'hui.",
	tag: 'daily-reminder'
};

export function configureVapid(): void {
	const publicKey = process.env.VAPID_PUBLIC_KEY;
	const privateKey = process.env.VAPID_PRIVATE_KEY;
	const subject = process.env.VAPID_SUBJECT ?? 'mailto:admin@example.com';
	if (!publicKey || !privateKey) {
		throw new Error('VAPID keys manquantes (VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY).');
	}
	webpush.setVapidDetails(subject, publicKey, privateKey);
}

/**
 * Envoie un push pour chaque abonnement ayant au moins un rappel dû et pas déjà envoyé.
 * Partagé entre la fonction planifiée (cron) et le déclenchement manuel de test.
 * Voir docs/architecture/ADR-001.
 */
export async function sendDueReminders(now = Date.now()): Promise<number> {
	configureVapid();

	const store = subscriptionsStore();
	const { blobs } = await store.list();
	let sent = 0;

	for (const { key } of blobs) {
		const data = (await store.get(key, { type: 'json' })) as StoredSubscription | null;
		if (!data) continue;

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
			sent++;

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

	return sent;
}
