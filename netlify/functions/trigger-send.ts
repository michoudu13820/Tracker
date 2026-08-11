import type { Context } from '@netlify/functions';
import { sendDueReminders } from './_shared/send-due';

/**
 * POST /.netlify/functions/trigger-send
 * Déclenchement manuel du même envoi que le cron (`send-reminders.ts`) — utile pour
 * tester un rappel sans attendre jusqu'à 15 min. Netlify interdit l'appel HTTP direct
 * des fonctions planifiées ; ceci est donc une fonction ordinaire séparée, protégée par
 * un secret partagé pour éviter tout déclenchement public non désiré (en-tête
 * `x-trigger-secret`, doit correspondre à la variable d'env `TRIGGER_SEND_SECRET`).
 */
export default async function handler(req: Request, _context: Context): Promise<Response> {
	if (req.method !== 'POST') {
		return new Response('Method Not Allowed', { status: 405 });
	}

	const secret = process.env.TRIGGER_SEND_SECRET;
	const provided = req.headers.get('x-trigger-secret');
	if (!secret || provided !== secret) {
		return new Response('Unauthorized', { status: 401 });
	}

	const sent = await sendDueReminders();
	return new Response(JSON.stringify({ ok: true, sent }), {
		status: 200,
		headers: { 'content-type': 'application/json' }
	});
}
