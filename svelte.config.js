import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/**
 * App 100% statique (adapter-static) : aucun endpoint SvelteKit côté serveur.
 * Le seul code serveur du projet vit dans `netlify/functions/` (micro-scheduler Web Push),
 * totalement découplé de l'app. Voir docs/architecture/ADR-001.
 *
 * `fallback: '200.html'` : mode SPA — le routage se fait côté client, ce qui
 * permet le fonctionnement offline complet une fois l'app installée sur l'écran d'accueil.
 * @type {import('@sveltejs/kit').Config}
 */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter({
			fallback: '200.html',
			precompress: false
		}),
		// Le service worker natif SvelteKit (src/service-worker.ts) gère offline + Web Push.
		serviceWorker: {
			register: true
		}
	}
};

export default config;
