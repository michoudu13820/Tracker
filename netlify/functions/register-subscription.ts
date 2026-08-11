import type { Context } from '@netlify/functions';
import { saveSubscription, type PushSubscriptionJSON, type ScheduledReminder } from './_shared/store';

/**
 * POST /.netlify/functions/register-subscription
 * Reçoit du client : { subscription, reminders } et le persiste dans Netlify Blobs.
 * Appelé à chaque ouverture de l'app / changement de données (fenêtre glissante).
 *
 * Le corps ne contient AUCUNE donnée métier — uniquement la souscription push et des
 * instants d'envoi. Voir docs/architecture/ADR-001.
 */
export default async function handler(req: Request, _context: Context): Promise<Response> {
	if (req.method !== 'POST') {
		return new Response('Method Not Allowed', { status: 405 });
	}

	let body: { subscription?: PushSubscriptionJSON; reminders?: ScheduledReminder[] };
	try {
		body = await req.json();
	} catch {
		return new Response('Invalid JSON', { status: 400 });
	}

	if (!body.subscription?.endpoint || !Array.isArray(body.reminders)) {
		return new Response('Missing subscription or reminders', { status: 400 });
	}

	await saveSubscription({
		subscription: body.subscription,
		reminders: body.reminders,
		updatedAt: Date.now()
	});

	return new Response(JSON.stringify({ ok: true }), {
		status: 200,
		headers: { 'content-type': 'application/json' }
	});
}
