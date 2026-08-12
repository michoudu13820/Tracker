/// <reference types="vitest/config" />
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	// Requis pour les tests de composants (@testing-library/svelte) : sans cela, Vite compile
	// les .svelte en mode SSR sous Vitest et `mount()` échoue ("not available on the server").
	// Voir https://svelte.dev/docs/svelte/testing
	resolve: process.env.VITEST ? { conditions: ['browser'] } : undefined,
	test: {
		// Tests unitaires du domaine/data : environnement node par défaut.
		// Les tests de composants (.svelte) basculent en jsdom via un commentaire
		// `// @vitest-environment jsdom` en tête de fichier.
		environment: 'node',
		include: ['src/**/*.{test,spec}.{js,ts}'],
		globals: true,
		setupFiles: ['src/lib/test/setup.ts']
	}
});
