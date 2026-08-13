/// <reference types="@sveltejs/kit" />
/// <reference lib="webworker" />

import { build, files, version } from '$service-worker';

/**
 * Service worker natif SvelteKit.
 *  1. Offline : precache de l'app shell (build + assets statiques) → l'app fonctionne
 *     sans réseau une fois installée sur l'écran d'accueil.
 *  2. Web Push : reçoit l'événement `push` déclenché par le micro-serveur et AFFICHE
 *     la notification. Le SW ne PEUT PAS programmer un envoi futur seul (contrainte iOS) —
 *     c'est le scheduler Netlify qui décide du moment. Voir docs/architecture/ADR-001.
 *
 * On garde le payload volontairement générique : le serveur n'envoie pas de données
 * métier, juste un rappel. L'utilisateur ouvre l'app pour voir sa liste (locale).
 */

const sw = self as unknown as ServiceWorkerGlobalScope;
const CACHE = `cache-${version}`;
const ASSETS = [...build, ...files];

// Cache "runtime" séparé pour les polices Google Fonts (US-016) : nom STABLE (pas suffixé par
// `version`), pour survivre aux mises à jour de l'app shell — une police déjà téléchargée une
// fois en ligne reste disponible hors-ligne, sans redemander le réseau à chaque déploiement.
const FONT_CACHE = 'tracker-google-fonts-v1';
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

sw.addEventListener('install', (event) => {
	event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => sw.skipWaiting()));
});

sw.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) =>
				Promise.all(keys.filter((k) => k !== CACHE && k !== FONT_CACHE).map((k) => caches.delete(k)))
			)
			.then(() => sw.clients.claim())
	);
});

sw.addEventListener('fetch', (event) => {
	const { request } = event;
	if (request.method !== 'GET') return;

	if (FONT_HOSTS.includes(new URL(request.url).hostname)) {
		event.respondWith(handleFontRequest(request));
		return;
	}

	event.respondWith(
		caches.match(request).then((cached) => cached ?? fetch(request).catch(() => caches.match('/')) as Promise<Response>)
	);
});

/**
 * Stratégie cache-first + mise en cache "runtime" pour les polices Google Fonts (US-016) :
 * sert depuis le cache si déjà téléchargée, sinon va au réseau et met en cache pour la
 * prochaine fois. Si ni le cache ni le réseau ne répondent (hors-ligne, jamais chargée), laisse
 * l'échec se propager normalement : chaque `cssFontFamily` du catalogue (`$lib/domain/fonts`)
 * empile toujours la pile système en repli, donc l'app reste lisible sans erreur visible.
 */
async function handleFontRequest(request: Request): Promise<Response> {
	const cache = await caches.open(FONT_CACHE);
	const cached = await cache.match(request);
	if (cached) return cached;

	const response = await fetch(request);
	if (response.ok) await cache.put(request, response.clone());
	return response;
}

sw.addEventListener('push', (event) => {
	const data = safeJson(event);
	const title = data.title ?? 'Tracker';
	const body = data.body ?? "Tu as des habitudes à faire aujourd'hui.";
	event.waitUntil(
		sw.registration.showNotification(title, {
			body,
			icon: '/icons/icon-192.png',
			badge: '/icons/icon-192.png',
			tag: data.tag ?? 'daily-reminder'
		})
	);
});

/**
 * Destination d'ouverture selon le type de rappel (`tag`, voir `sendDueReminders` côté serveur) :
 * la revue hebdomadaire poussée (US-028 scénario 2) ouvre directement `/resume`, où le
 * récapitulatif de la semaine (US-005) est déjà consultable ; tout le reste (récap quotidien
 * générique, rappel nominatif de tâche) ouvre le planning `/` comme avant.
 */
function urlForTag(tag: string | undefined): string {
	return tag === 'weekly-review' ? '/resume' : '/';
}

sw.addEventListener('notificationclick', (event) => {
	const url = urlForTag(event.notification.tag);
	event.notification.close();
	event.waitUntil(
		sw.clients.matchAll({ type: 'window' }).then((clients) => {
			const existing = clients.find((c) => 'focus' in c);
			if (existing) return existing.focus().then(() => existing.navigate(url));
			return sw.clients.openWindow(url);
		})
	);
});

function safeJson(event: PushEvent): { title?: string; body?: string; tag?: string } {
	try {
		return event.data?.json() ?? {};
	} catch {
		return {};
	}
}
