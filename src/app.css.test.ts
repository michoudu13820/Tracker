import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Lu directement depuis le disque (plutôt qu'un import `?raw`) : le plugin CSS de Vite
// intercepte les imports `.css` avant que le suffixe `?raw` ne s'applique dans ce projet,
// ce qui renvoyait une chaîne vide sous Vitest.
const css = readFileSync(fileURLToPath(new URL('./app.css', import.meta.url)), 'utf-8');

/**
 * Mode sombre (US-029) — toute la charte de couleurs est centralisée en variables CSS
 * (`:root`, US-009) : aucun composant ne code une couleur en dur (voir CONVENTIONS.md), donc le
 * mode sombre se réduit à décliner ces mêmes variables sous `@media (prefers-color-scheme:
 * dark)`. Ce test garantit qu'aucune variable de couleur du thème clair n'est oubliée dans la
 * déclinaison sombre (parité), sans dépendre d'un rendu réel du média query (non simulable en
 * jsdom/Vitest).
 */
describe('Mode sombre — prefers-color-scheme (US-029)', () => {
	it('scénario 1/3 — déclare un bloc @media (prefers-color-scheme: dark)', () => {
		expect(css).toMatch(/@media \(prefers-color-scheme: dark\)/);
	});

	it('décline en mode sombre toutes les variables de couleur définies en mode clair (parité)', () => {
		const rootBlock = css.match(/:root\s*\{([^}]*)\}/)?.[1] ?? '';
		const darkBlock =
			css.match(/@media \(prefers-color-scheme: dark\)\s*\{\s*:root\s*\{([^}]*)\}/)?.[1] ?? '';

		const COLOR_VAR_PREFIXES = [
			'--bg',
			'--surface',
			'--text',
			'--muted',
			'--accent',
			'--success',
			'--danger',
			'--warning',
			'--habit'
		];
		const lightVars = [...rootBlock.matchAll(/--([\w-]+)\s*:/g)].map((m) => `--${m[1]}`);
		const darkVars = new Set([...darkBlock.matchAll(/--([\w-]+)\s*:/g)].map((m) => `--${m[1]}`));

		const colorVars = lightVars.filter((v) => COLOR_VAR_PREFIXES.some((p) => v.startsWith(p)));
		expect(colorVars.length).toBeGreaterThan(0);
		for (const v of colorVars) {
			expect(darkVars.has(v)).toBe(true);
		}
	});

	it('scénario 2 — ne modifie pas la palette claire par défaut (US-009 inchangée)', () => {
		expect(css).toMatch(/--bg:\s*#fdf2f6;/);
		expect(css).toMatch(/--accent:\s*#c9a6e6;/);
	});

	it('bascule color-scheme sur "dark" pour les contrôles natifs (dates, cases à cocher)', () => {
		const darkBlock =
			css.match(/@media \(prefers-color-scheme: dark\)\s*\{\s*:root\s*\{([^}]*)\}/)?.[1] ?? '';
		expect(darkBlock).toMatch(/color-scheme:\s*dark/);
	});
});
