import type { Context } from '@netlify/functions';
import { deleteSubscription } from './_shared/store';

/**
 * POST /.netlify/functions/unregister-subscription
 * Coupe les rappels côté serveur (US-007, scénario 6 — désactivation globale).
 * Corps : { endpoint }.
 */
export default async function handler(req: Request, _context: Context): Promise<Response> {
	if (req.method !== 'POST') {
		return new Response('Method Not Allowed', { status: 405 });
	}

	let body: { endpoint?: string };
	try {
		body = await req.json();
	} catch {
		return new Response('Invalid JSON', { status: 400 });
	}

	if (!body.endpoint) {
		return new Response('Missing endpoint', { status: 400 });
	}

	await deleteSubscription(body.endpoint);
	return new Response(JSON.stringify({ ok: true }), {
		status: 200,
		headers: { 'content-type': 'application/json' }
	});
}
