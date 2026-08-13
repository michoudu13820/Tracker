// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { isBadgingSupported, setBadge, clearBadge } from './client';

/**
 * Tests du client badge (US-031) — `navigator.setAppBadge`/`clearAppBadge` ne sont PAS
 * implémentés par jsdom (comme sur la plupart des navigateurs desktop) : on les simule en les
 * assignant directement sur `navigator`, puis on nettoie après chaque test pour ne pas polluer
 * les autres suites (même environnement jsdom partagé au sein du fichier).
 */
type BadgingNavigator = Navigator & {
	setAppBadge?: (n?: number) => Promise<void>;
	clearAppBadge?: () => Promise<void>;
};

afterEach(() => {
	Reflect.deleteProperty(navigator, 'setAppBadge');
	Reflect.deleteProperty(navigator, 'clearAppBadge');
});

describe('isBadgingSupported (US-031 — détection de fonctionnalité)', () => {
	it("renvoie faux quand l'API est absente (cas jsdom/desktop par défaut)", () => {
		expect(isBadgingSupported()).toBe(false);
	});

	it("renvoie vrai quand navigator.setAppBadge existe", () => {
		(navigator as BadgingNavigator).setAppBadge = vi.fn(async () => {});
		expect(isBadgingSupported()).toBe(true);
	});
});

describe('setBadge (US-031 scénario 1 — dégradation silencieuse)', () => {
	it('appelle navigator.setAppBadge(count) quand supporté', async () => {
		const spy = vi.fn(async () => {});
		(navigator as BadgingNavigator).setAppBadge = spy;

		await setBadge(3);

		expect(spy).toHaveBeenCalledWith(3);
	});

	it("ne fait rien et ne lève jamais si l'API est absente", async () => {
		await expect(setBadge(3)).resolves.toBeUndefined();
	});

	it("avale silencieusement une erreur de l'API sans la propager", async () => {
		(navigator as BadgingNavigator).setAppBadge = vi.fn(async () => {
			throw new Error('unsupported in this context');
		});

		await expect(setBadge(3)).resolves.toBeUndefined();
	});
});

describe('clearBadge (US-031 scénario 2)', () => {
	it('appelle navigator.clearAppBadge quand supporté', async () => {
		const spy = vi.fn(async () => {});
		(navigator as BadgingNavigator).clearAppBadge = spy;

		await clearBadge();

		expect(spy).toHaveBeenCalledTimes(1);
	});

	it("ne fait rien et ne lève jamais si l'API est absente", async () => {
		await expect(clearBadge()).resolves.toBeUndefined();
	});

	it('avale silencieusement une erreur de l\'API sans la propager', async () => {
		(navigator as BadgingNavigator).clearAppBadge = vi.fn(async () => {
			throw new Error('unsupported in this context');
		});

		await expect(clearBadge()).resolves.toBeUndefined();
	});
});
