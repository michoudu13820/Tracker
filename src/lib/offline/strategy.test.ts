import { describe, expect, it, vi } from 'vitest';
import {
	buildPrecacheList,
	OFFLINE_FALLBACK_PATH,
	respondToAsset,
	respondToNavigation,
	type OfflineDeps
} from './strategy';

/**
 * Tests de la stratégie hors ligne du service worker (US-040).
 *
 * Chaque bloc rejoue un critère d'acceptation de l'US. Le fil rouge commun : **aucune branche ne
 * doit produire autre chose qu'un `Response`** — c'est le défaut exact de BUG-002.
 */

/** Fabrique un jeu de dépendances où l'on choisit ce que contient le cache et si le réseau répond. */
function makeDeps(options: {
	cache?: Record<string, string>;
	network?: 'down' | Record<string, string>;
}): OfflineDeps & { fetchNetwork: ReturnType<typeof vi.fn> } {
	const cache = options.cache ?? {};
	const network = options.network ?? 'down';

	const fetchNetwork = vi.fn(async (request: Request) => {
		if (network === 'down') throw new TypeError('Failed to fetch');
		const body = network[new URL(request.url).pathname];
		if (body === undefined) return new Response('not found', { status: 404 });
		return new Response(body, { status: 200 });
	});

	return {
		matchCache: async (request) => {
			const body = cache[new URL(request.url).pathname];
			return body === undefined ? undefined : new Response(body, { status: 200 });
		},
		matchPath: async (path) => {
			const body = cache[path];
			return body === undefined ? undefined : new Response(body, { status: 200 });
		},
		fetchNetwork
	};
}

/**
 * Requête de navigation. Pas de `mode: 'navigate'` : la spec fetch interdit de le construire à la
 * main. Ce n'est pas gênant — le tri navigation / sous-ressource est fait par le service worker,
 * qui reçoit de vraies requêtes ; `respondToNavigation` est volontairement agnostique du mode.
 */
const navigationTo = (path: string) => new Request(`https://tracker.test${path}`);

describe('buildPrecacheList', () => {
	it("inclut les pages prérendues, absentes de build et files (cause racine de BUG-002)", () => {
		const list = buildPrecacheList(
			['/_app/immutable/app.js'],
			['/icons/icon-192.png'],
			['/', '/habitudes', '/taches', '/resume', '/reglages', OFFLINE_FALLBACK_PATH]
		);

		expect(list).toContain('/');
		expect(list).toContain('/resume');
		expect(list).toContain(OFFLINE_FALLBACK_PATH);
		expect(list).toContain('/_app/immutable/app.js');
		expect(list).toContain('/icons/icon-192.png');
	});

	it('dédoublonne une ressource présente dans deux listes', () => {
		const list = buildPrecacheList(['/a.js'], ['/a.js'], ['/']);
		expect(list.filter((entry) => entry === '/a.js')).toHaveLength(1);
	});
});

describe('respondToNavigation', () => {
	it("scénario 1 — ouvre le planning depuis le cache sans réseau, sans jamais échouer", async () => {
		const deps = makeDeps({ cache: { '/': 'planning' }, network: 'down' });

		const response = await respondToNavigation(navigationTo('/'), deps);

		expect(response).toBeInstanceOf(Response);
		await expect(response.text()).resolves.toBe('planning');
	});

	it("scénario 2 — sert un écran jamais visité depuis l'installation, hors ligne", async () => {
		// `/resume` n'a jamais été ouvert dans cette session : il n'est en cache que parce qu'il a
		// été précaché à l'installation, ce que ne faisait pas l'ancienne implémentation.
		const deps = makeDeps({ cache: { '/': 'planning', '/resume': 'resume' }, network: 'down' });

		const response = await respondToNavigation(navigationTo('/resume'), deps);

		await expect(response.text()).resolves.toBe('resume');
	});

	it("scénario 4 — une navigation directe hors ligne aboutit sur l'écran demandé, pas sur le planning", async () => {
		const deps = makeDeps({ cache: { '/': 'planning', '/taches': 'taches' }, network: 'down' });

		const response = await respondToNavigation(navigationTo('/taches'), deps);

		const body = await response.text();
		expect(body).toBe('taches');
		expect(body).not.toBe('planning');
	});

	it("scénario 5 — repli sur l'écran hors ligne quand la page n'est ni en cache ni joignable", async () => {
		const deps = makeDeps({
			cache: { '/': 'planning', [OFFLINE_FALLBACK_PATH]: 'ecran-hors-ligne' },
			network: 'down'
		});

		const response = await respondToNavigation(navigationTo('/page-jamais-visitee'), deps);

		await expect(response.text()).resolves.toBe('ecran-hors-ligne');
	});

	it("scénario 5 — dernier filet : une page autonome, jamais une réponse nulle, même sans écran de repli en cache", async () => {
		const deps = makeDeps({ cache: {}, network: 'down' });

		const response = await respondToNavigation(navigationTo('/page-jamais-visitee'), deps);

		expect(response).toBeInstanceOf(Response);
		// Statut 200 : un 5xx serait remplacé par la page d'erreur du navigateur, ce que
		// le scénario 5 interdit.
		expect(response.status).toBe(200);
		const html = await response.text();
		expect(html).toContain('Contenu non disponible hors connexion');
		expect(html).toContain('href="/"');
	});

	it('en ligne, une page absente du cache est servie par le réseau', async () => {
		const deps = makeDeps({ cache: {}, network: { '/resume': 'resume-frais' } });

		const response = await respondToNavigation(navigationTo('/resume'), deps);

		await expect(response.text()).resolves.toBe('resume-frais');
	});

	it("ne va pas au réseau quand la page est déjà en cache", async () => {
		const deps = makeDeps({ cache: { '/': 'planning' }, network: { '/': 'planning-reseau' } });

		await respondToNavigation(navigationTo('/'), deps);

		expect(deps.fetchNetwork).not.toHaveBeenCalled();
	});
});

describe('respondToAsset', () => {
	it('sert une sous-ressource depuis le cache hors ligne', async () => {
		const deps = makeDeps({ cache: { '/app.js': 'bundle' }, network: 'down' });

		const response = await respondToAsset(new Request('https://tracker.test/app.js'), deps);

		await expect(response.text()).resolves.toBe('bundle');
	});

	it("renvoie une réponse 503 explicite, et non un rejet, quand une sous-ressource manque hors ligne", async () => {
		const deps = makeDeps({ cache: {}, network: 'down' });

		const response = await respondToAsset(new Request('https://tracker.test/absent.js'), deps);

		expect(response).toBeInstanceOf(Response);
		expect(response.status).toBe(503);
	});
});
