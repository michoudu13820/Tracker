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

sw.addEventListener('install', (event) => {
	event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => sw.skipWaiting()));
});

sw.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
			.then(() => sw.clients.claim())
	);
});

sw.addEventListener('fetch', (event) => {
	const { request } = event;
	if (request.method !== 'GET') return;
	event.respondWith(
		caches.match(request).then((cached) => cached ?? fetch(request).catch(() => caches.match('/')) as Promise<Response>)
	);
});

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

sw.addEventListener('notificationclick', (event) => {
	event.notification.close();
	event.waitUntil(
		sw.clients.matchAll({ type: 'window' }).then((clients) => {
			const existing = clients.find((c) => 'focus' in c);
			if (existing) return existing.focus();
			return sw.clients.openWindow('/');
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
