/// <reference types="vitest/config" />
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		// Tests unitaires du domaine/data : environnement node par défaut.
		// Les tests de composants (.svelte) basculent en jsdom via un commentaire
		// `// @vitest-environment jsdom` en tête de fichier.
		environment: 'node',
		include: ['src/**/*.{test,spec}.{js,ts}'],
		globals: true
	}
});
