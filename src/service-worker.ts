/// <reference types="@sveltejs/kit" />
/// <reference lib="webworker" />

import { build, files, prerendered, version } from '$service-worker';
import {
	buildPrecacheList,
	respondToAsset,
	respondToNavigation,
	type OfflineDeps
} from '$lib/offline/strategy';

/**
 * Service worker natif SvelteKit.
 *  1. Offline : precache de l'app shell **et de toutes les pages prérendues** → l'app
 *     s'ouvre et se navigue sans réseau une fois installée sur l'écran d'accueil (US-040).
 *  2. Web Push : reçoit l'événement `push` déclenché par le micro-serveur et AFFICHE
 *     la notification. Le SW ne PEUT PAS programmer un envoi futur seul (contrainte iOS) —
 *     c'est le scheduler Netlify qui décide du moment. Voir docs/architecture/ADR-001.
 *
 * On garde le payload volontairement générique : le serveur n'envoie pas de données
 * métier, juste un rappel. L'utilisateur ouvre l'app pour voir sa liste (locale).
 *
 * La logique de réponse aux requêtes vit dans `$lib/offline/strategy` : elle y est testable
 * sans navigateur, ce qui manquait quand BUG-002 est passé en production.
 */

const sw = self as unknown as ServiceWorkerGlobalScope;
const CACHE = `cache-${version}`;
const ASSETS = buildPrecacheList(build, files, prerendered);

// Cache "runtime" séparé pour les polices Google Fonts (US-016) : nom STABLE (pas suffixé par
// `version`), pour survivre aux mises à jour de l'app shell — une police déjà téléchargée une
// fois en ligne reste disponible hors-ligne, sans redemander le réseau à chaque déploiement.
const FONT_CACHE = 'tracker-google-fonts-v1';
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

/**
 * Precache best-effort : chaque ressource est ajoutée individuellement, et un échec isolé
 * n'annule pas l'installation. `cache.addAll` est atomique — une seule ressource introuvable
 * ferait échouer tout le precache, laissant l'app SANS aucune page hors ligne, c'est-à-dire
 * exactement le symptôme que US-040 corrige. Mieux vaut un cache incomplet qu'un cache vide.
 *
 * Pas de `skipWaiting()` (US-040 scénario 6bis, arbitrage produit du 2026-08-16) : la nouvelle
 * version se télécharge en arrière-plan et attend que l'app soit fermée pour prendre la main.
 * L'utilisateur termine ce qu'il fait sur la version déjà chargée, sans rechargement subi ni
 * mélange entre l'ancienne page affichée et les nouveaux assets.
 */
sw.addEventListener('install', (event) => {
	event.waitUntil(
		caches
			.open(CACHE)
			.then((cache) => Promise.all(ASSETS.map((asset) => cache.add(asset).catch(() => undefined))))
			.then(() => undefined)
	);
});

/**
 * `clients.claim()` est conservé : à la toute première installation (aucun SW précédent),
 * l'activation est immédiate et il permet de contrôler la page déjà ouverte. Lors d'une MISE À
 * JOUR, l'activation n'a lieu qu'une fois l'app fermée — il n'y a alors plus de client à
 * réclamer, donc il ne contredit pas le scénario 6bis.
 */
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

/** Accès réels injectés dans la stratégie testable de `$lib/offline/strategy`. */
const offlineDeps: OfflineDeps = {
	// `ignoreVary` : une réponse précachée peut porter un en-tête `Vary` (Netlify) qui ferait
	// échouer la correspondance avec la requête de navigation réelle, alors que le contenu est bon.
	matchCache: (request) => caches.match(request, { ignoreVary: true }),
	matchPath: (path) => caches.match(path, { ignoreVary: true }),
	fetchNetwork: (request) => fetch(request)
};

sw.addEventListener('fetch', (event) => {
	const { request } = event;
	if (request.method !== 'GET') return;

	if (FONT_HOSTS.includes(new URL(request.url).hostname)) {
		event.respondWith(handleFontRequest(request));
		return;
	}

	// Les navigations (ouverture de l'app, rechargement, lien direct) sont le cas critique de
	// US-040 : elles doivent aboutir sur la page demandée, ou sur l'écran de repli — jamais sur
	// une réponse vide.
	event.respondWith(
		request.mode === 'navigate'
			? respondToNavigation(request, offlineDeps)
			: respondToAsset(request, offlineDeps)
	);
});

/**
 * Stratégie cache-first + mise en cache "runtime" pour les polices Google Fonts (US-016) :
 * sert depuis le cache si déjà téléchargée, sinon va au réseau et met en cache pour la
 * prochaine fois. Si ni le cache ni le réseau ne répondent (hors-ligne, jamais chargée), laisse
 * l'échec se traduire par un 503 : chaque `cssFontFamily` du catalogue (`$lib/domain/fonts`)
 * empile toujours la pile système en repli, donc l'app reste lisible sans erreur visible.
 *
 * US-040 : renvoie un `Response` d'échec plutôt que de laisser la promesse se rejeter, pour
 * respecter l'invariant « `respondWith` reçoit toujours un `Response` » sur tous les chemins.
 */
async function handleFontRequest(request: Request): Promise<Response> {
	const cache = await caches.open(FONT_CACHE);
	const cached = await cache.match(request);
	if (cached) return cached;

	try {
		const response = await fetch(request);
		if (response.ok) await cache.put(request, response.clone());
		return response;
	} catch {
		return new Response('', { status: 503, statusText: 'Hors connexion' });
	}
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
