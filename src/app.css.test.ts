import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { CARD_COLORS, DEFAULT_CARD_COLOR } from '$lib/domain/card-colors';

// Lu directement depuis le disque (plutôt qu'un import `?raw`) : le plugin CSS de Vite
// intercepte les imports `.css` avant que le suffixe `?raw` ne s'applique dans ce projet,
// ce qui renvoyait une chaîne vide sous Vitest.
const rawCss = readFileSync(fileURLToPath(new URL('./app.css', import.meta.url)), 'utf-8');
// Les commentaires mentionnent des noms de variables : on les retire avant toute extraction
// pour ne jamais confondre documentation et déclaration.
const css = rawCss.replace(/\/\*[\s\S]*?\*\//g, '');

const lightBlock = css.match(/:root\s*\{([^}]*)\}/)?.[1] ?? '';
const darkBlock =
	css.match(/@media \(prefers-color-scheme: dark\)\s*\{\s*:root\s*\{([^}]*)\}/)?.[1] ?? '';

/** Déclarations `--nom: valeur;` d'un bloc, indexées par nom. */
function varsOf(block: string): Record<string, string> {
	const out: Record<string, string> = {};
	for (const m of block.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) out[m[1]] = m[2].trim();
	return out;
}

const lightVars = varsOf(lightBlock);
const darkVars = varsOf(darkBlock);

/** Luminance relative WCAG 2.1 d'une couleur `#rrggbb`. */
function relativeLuminance(hex: string): number {
	const h = hex.replace('#', '');
	const channels = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
	const [r, g, b] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Ratio de contraste WCAG 2.1 entre deux couleurs `#rrggbb` (1:1 à 21:1). */
function contrastRatio(a: string, b: string): number {
	const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
	return (hi + 0.05) / (lo + 0.05);
}

const THEMES = [
	{ name: 'clair', vars: lightVars },
	{ name: 'sombre', vars: darkVars }
] as const;

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
		const COLOR_VAR_PREFIXES = [
			'--bg',
			'--surface',
			'--text',
			'--muted',
			'--accent',
			'--success',
			'--danger',
			'--warning',
			'--habit',
			// Palette de carte (US-036) : chaque teinte doit exister dans les deux thèmes.
			'--tint'
		];

		const colorVars = Object.keys(lightVars).filter((v) =>
			COLOR_VAR_PREFIXES.some((p) => v.startsWith(p))
		);
		expect(colorVars.length).toBeGreaterThan(0);
		for (const v of colorVars) {
			expect(darkVars).toHaveProperty(v);
		}
	});

	it('scénario 2 — ne modifie pas la palette claire par défaut (US-009 inchangée)', () => {
		expect(css).toMatch(/--bg:\s*#fdf2f6;/);
		expect(css).toMatch(/--accent:\s*#c9a6e6;/);
	});

	it('bascule color-scheme sur "dark" pour les contrôles natifs (dates, cases à cocher)', () => {
		expect(darkBlock).toMatch(/color-scheme:\s*dark/);
	});
});

/**
 * Palette de carte (US-036, réutilisée par US-037) — la palette est une **liste fermée** vivant
 * dans `app.css` (source de vérité unique d'US-009/US-029) ; `$lib/domain/card-colors` n'en
 * connaît que les identifiants. Ces tests verrouillent le contrat entre les deux et les
 * garanties de contraste/accessibilité du scénario 8, non vérifiables à l'œil en CI.
 */
describe('Palette de couleurs de carte (US-036)', () => {
	it('scénario 1 — liste fermée de 6 à 8 teintes, alignée sur le domaine', () => {
		expect(CARD_COLORS.length).toBeGreaterThanOrEqual(6);
		expect(CARD_COLORS.length).toBeLessThanOrEqual(8);

		const declared = Object.keys(lightVars)
			.map((v) => v.match(/^--tint-(.+)-bg$/)?.[1])
			.filter((v): v is string => v !== undefined);
		expect(declared.sort()).toEqual([...CARD_COLORS].sort());
	});

	it('déclare pour chaque teinte un fond ET un liseré, dans les deux thèmes', () => {
		for (const { vars } of THEMES) {
			for (const color of CARD_COLORS) {
				expect(vars[`--tint-${color}-bg`]).toMatch(/^#[0-9a-f]{6}$/);
				expect(vars[`--tint-${color}-border`]).toMatch(/^#[0-9a-f]{6}$/);
			}
		}
	});

	it("scénario 8 — le texte de la carte garde un contraste >= 4,5:1 sur chaque teinte, dans les deux thèmes", () => {
		for (const { name, vars } of THEMES) {
			for (const color of CARD_COLORS) {
				const bg = vars[`--tint-${color}-bg`];
				for (const fg of ['--text', '--muted']) {
					const ratio = contrastRatio(vars[fg], bg);
					expect(
						ratio,
						`${fg} sur --tint-${color}-bg (thème ${name}) : ${ratio.toFixed(2)}:1`
					).toBeGreaterThanOrEqual(4.5);
				}
			}
		}
	});

	it('scénario 9 — chaque carte reste identifiable : son liseré se détache de son propre fond', () => {
		for (const { name, vars } of THEMES) {
			for (const color of CARD_COLORS) {
				const ratio = contrastRatio(vars[`--tint-${color}-border`], vars[`--tint-${color}-bg`]);
				expect(ratio, `liseré ${color} (thème ${name}) : ${ratio.toFixed(2)}:1`).toBeGreaterThan(
					1.5
				);
			}
		}
	});

	it('scénario 9 — deux teintes ne partagent jamais la même valeur (fonds et liserés distincts)', () => {
		for (const { vars } of THEMES) {
			const bgs = CARD_COLORS.map((c) => vars[`--tint-${c}-bg`]);
			const borders = CARD_COLORS.map((c) => vars[`--tint-${c}-border`]);
			expect(new Set(bgs).size).toBe(CARD_COLORS.length);
			expect(new Set(borders).size).toBe(CARD_COLORS.length);
		}
	});

	it("scénario 8 — chaque teinte a bien une déclinaison propre au thème (jamais la même valeur brute)", () => {
		for (const color of CARD_COLORS) {
			expect(lightVars[`--tint-${color}-bg`]).not.toBe(darkVars[`--tint-${color}-bg`]);
			if (color !== DEFAULT_CARD_COLOR) {
				// Seul le liseré de la teinte par défaut est volontairement identique dans les deux
				// thèmes : il DOIT rester égal à `--habit-border`, lui-même déjà invariant (US-029).
				expect(lightVars[`--tint-${color}-border`]).not.toBe(darkVars[`--tint-${color}-border`]);
			}
		}
	});

	it('scénarios 3/4/6 — la teinte par défaut reproduit exactement le rendu actuel des cartes', () => {
		expect(lightVars[`--tint-${DEFAULT_CARD_COLOR}-bg`]).toBe(lightVars['--surface']);
		expect(lightVars[`--tint-${DEFAULT_CARD_COLOR}-border`]).toBe(lightVars['--habit-border']);
		expect(darkVars[`--tint-${DEFAULT_CARD_COLOR}-bg`]).toBe(darkVars['--surface']);
		expect(darkVars[`--tint-${DEFAULT_CARD_COLOR}-border`]).toBe(darkVars['--habit-border']);
	});

	it("scénarios 11/12 — n'altère aucune couleur sémantique existante (statuts, résumé)", () => {
		expect(lightVars['--success-bg']).toBe('#d9f0df');
		expect(lightVars['--danger-bg']).toBe('#fbdce3');
		expect(lightVars['--warning-bg']).toBe('#faeec2');
		expect(lightVars['--habit-border']).toBe('#c9a6e6');
		expect(darkVars['--success-bg']).toBe('#1f3a28');
		expect(darkVars['--danger-bg']).toBe('#3a1f28');
		expect(darkVars['--warning-bg']).toBe('#3a3018');
	});
});
