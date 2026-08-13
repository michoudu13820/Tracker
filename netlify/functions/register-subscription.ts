import type { Context } from '@netlify/functions';
import {
	saveSubscription,
	type PushSubscriptionJSON,
	type ScheduledReminder,
	type ScheduledTaskReminder
} from './_shared/store';

/**
 * POST /.netlify/functions/register-subscription
 * Reçoit du client : { subscription, reminders, taskReminders?, weeklyReviewReminders? } et le
 * persiste dans Netlify Blobs. Appelé à chaque ouverture de l'app / changement de données
 * (fenêtre glissante) — et, pour `taskReminders`/`weeklyReviewReminders`, à chaque
 * resynchronisation (US-023).
 *
 * `reminders` (récap générique des habitudes, US-007) et `weeklyReviewReminders` (revue
 * hebdomadaire poussée, US-028) ne contiennent AUCUNE donnée métier — uniquement des instants
 * d'envoi. `taskReminders` (heure limite d'une tâche, US-022) est la seule dérogation actée
 * (amendement 2026-08-12 à ADR-001) : il transporte un contenu nominatif déjà composé côté
 * client. Politique de purge de ce contenu : (1) le client recalcule et REMPLACE intégralement
 * `taskReminders` à chaque synchronisation (jamais de fusion/append côté serveur — voir
 * `saveSubscription`), ce qui élimine déjà toute entrée obsolète au moment du resync ; (2) on
 * filtre ici, défensivement, toute entrée déjà passée (`sendAt` <= maintenant) avant écriture,
 * pour ne jamais persister plus longtemps que nécessaire un libellé qui n'a plus lieu d'être
 * envoyé.
 */
export default async function handler(req: Request, _context: Context): Promise<Response> {
	if (req.method !== 'POST') {
		return new Response('Method Not Allowed', { status: 405 });
	}

	let body: {
		subscription?: PushSubscriptionJSON;
		reminders?: ScheduledReminder[];
		taskReminders?: ScheduledTaskReminder[];
		weeklyReviewReminders?: ScheduledReminder[];
	};
	try {
		body = await req.json();
	} catch {
		return new Response('Invalid JSON', { status: 400 });
	}

	if (!body.subscription?.endpoint || !Array.isArray(body.reminders)) {
		return new Response('Missing subscription or reminders', { status: 400 });
	}
	if (body.taskReminders !== undefined && !Array.isArray(body.taskReminders)) {
		return new Response('Invalid taskReminders', { status: 400 });
	}
	if (body.weeklyReviewReminders !== undefined && !Array.isArray(body.weeklyReviewReminders)) {
		return new Response('Invalid weeklyReviewReminders', { status: 400 });
	}

	const now = Date.now();
	const taskReminders = (body.taskReminders ?? []).filter((r) => r.sendAt > now);
	const weeklyReviewReminders = (body.weeklyReviewReminders ?? []).filter((r) => r.sendAt > now);

	await saveSubscription({
		subscription: body.subscription,
		reminders: body.reminders,
		taskReminders,
		weeklyReviewReminders,
		updatedAt: now
	});

	return new Response(JSON.stringify({ ok: true }), {
		status: 200,
		headers: { 'content-type': 'application/json' }
	});
}
