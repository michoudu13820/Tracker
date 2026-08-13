import webpush from 'web-push';
import { subscriptionsStore, saveSubscription, deleteSubscription, type StoredSubscription } from './store';

const GENERIC = {
	title: 'Tracker',
	body: "Tu as des habitudes prévues aujourd'hui.",
	tag: 'daily-reminder'
};

/** Contenu générique de la revue hebdomadaire poussée (US-028) — non nominatif, distinct du
 * récap quotidien (scénario 1) ; le `tag` sert aussi de routage côté service worker vers
 * `/resume` au clic (voir `src/service-worker.ts`, scénario 2). */
const WEEKLY_REVIEW_GENERIC = {
	title: 'Tracker',
	body: 'Ta revue hebdomadaire est prête à consulter.',
	tag: 'weekly-review'
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

/** 404/410 = souscription expirée côté navigateur. */
function isExpiredSubscriptionError(err: unknown): boolean {
	const status = (err as { statusCode?: number }).statusCode;
	return status === 404 || status === 410;
}

function endpointOf(data: StoredSubscription) {
	return { endpoint: data.subscription.endpoint, keys: data.subscription.keys };
}

/**
 * Envoie un push pour chaque abonnement ayant au moins un rappel dû et pas déjà envoyé, sur
 * trois canaux : le récap générique quotidien des habitudes (US-007, contenu non nominatif),
 * les rappels nominatifs des tâches à heure limite (US-022, un push par groupe de tâches du
 * même créneau de 15 min — déjà groupées côté client), et la revue hebdomadaire poussée
 * (US-028, contenu générique distinct du récap quotidien).
 *
 * Politique de purge du libellé des tâches (amendement 2026-08-12 à ADR-001) : dès qu'un
 * groupe de `taskReminders` a été envoyé (ou a échoué pour une raison définitive), il est
 * retiré du tableau persisté — son libellé ne reste donc en mémoire côté serveur qu'entre le
 * moment où le client l'a poussé et son émission effective par le cron suivant.
 *
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

		let next = data;
		let changed = false;
		let expired = false;

		// Récap générique quotidien des habitudes (US-007) — contenu non nominatif, inchangé.
		const dueGeneric = data.reminders.filter(
			(r) => r.sendAt <= now && (data.lastSentAt === undefined || r.sendAt > data.lastSentAt)
		);
		if (dueGeneric.length > 0) {
			try {
				await webpush.sendNotification(endpointOf(data), JSON.stringify(GENERIC));
				sent++;
				const latest = Math.max(...dueGeneric.map((r) => r.sendAt));
				next = {
					...next,
					reminders: next.reminders.filter((r) => r.sendAt > now),
					lastSentAt: latest,
					updatedAt: now
				};
				changed = true;
			} catch (err) {
				if (isExpiredSubscriptionError(err)) expired = true;
			}
		}

		// Rappels nominatifs des tâches à heure limite (US-022) — un push par groupe déjà
		// composé côté client (scénario 2 : plusieurs tâches du même créneau = un seul push).
		if (!expired) {
			const taskReminders = next.taskReminders ?? [];
			const dueTasks = taskReminders.filter(
				(r) => r.sendAt <= now && (next.lastTaskSentAt === undefined || r.sendAt > next.lastTaskSentAt)
			);
			for (const group of dueTasks) {
				try {
					await webpush.sendNotification(
						endpointOf(data),
						JSON.stringify({ title: group.title, body: group.body, tag: `task-reminder-${group.sendAt}` })
					);
					sent++;
				} catch (err) {
					if (isExpiredSubscriptionError(err)) {
						expired = true;
						break;
					}
				}
			}
			if (dueTasks.length > 0 && !expired) {
				const latestTask = Math.max(...dueTasks.map((r) => r.sendAt));
				next = {
					...next,
					// Purge (amendement ADR-001) : les groupes émis disparaissent immédiatement du stockage.
					taskReminders: taskReminders.filter((r) => r.sendAt > now),
					lastTaskSentAt: latestTask,
					updatedAt: now
				};
				changed = true;
			}
		}

		// Revue hebdomadaire poussée (US-028) — contenu générique, même politique anti-doublon
		// que le récap quotidien, canal indépendant.
		if (!expired) {
			const weeklyReviewReminders = next.weeklyReviewReminders ?? [];
			const dueWeeklyReview = weeklyReviewReminders.filter(
				(r) =>
					r.sendAt <= now &&
					(next.lastWeeklyReviewSentAt === undefined || r.sendAt > next.lastWeeklyReviewSentAt)
			);
			if (dueWeeklyReview.length > 0) {
				try {
					await webpush.sendNotification(endpointOf(data), JSON.stringify(WEEKLY_REVIEW_GENERIC));
					sent++;
					const latestWeeklyReview = Math.max(...dueWeeklyReview.map((r) => r.sendAt));
					next = {
						...next,
						weeklyReviewReminders: weeklyReviewReminders.filter((r) => r.sendAt > now),
						lastWeeklyReviewSentAt: latestWeeklyReview,
						updatedAt: now
					};
					changed = true;
				} catch (err) {
					if (isExpiredSubscriptionError(err)) expired = true;
				}
			}
		}

		if (expired) {
			await deleteSubscription(data.subscription.endpoint);
		} else if (changed) {
			await saveSubscription(next);
		}
	}

	return sent;
}
