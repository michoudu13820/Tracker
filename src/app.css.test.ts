import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
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

/* ----------------------------------------------------------------------------------------------
   BUG-003 — zoom automatique au focus d'un champ sur iPhone.

   Safari iOS zoome la page au focus d'un champ de saisie dont le texte fait MOINS de 16 px, et le
   zoom ne se retire pas à la fermeture du clavier : l'app reste zoomée. La règle est donc binaire
   et vérifiable statiquement — d'où ces tests sur la source CSS, à la manière de ceux d'US-029/
   US-036 ci-dessus (le zoom natif de WebKit n'étant, lui, pas observable en jsdom).

   Deux garanties, complémentaires :
    1. `app.css` impose un plancher global à tous les champs ;
    2. AUCUN composant ne repasse sous ce plancher — une règle scopée Svelte est plus spécifique
       que la règle globale et la neutraliserait silencieusement sur son écran.
   -------------------------------------------------------------------------------------------- */

/** Taille de texte en dessous de laquelle Safari iOS zoome au focus d'un champ. */
const IOS_MIN_FIELD_FONT_PX = 16;

/** Champs de saisie concernés : ceux qui ouvrent le clavier ou un sélecteur natif. */
const FIELD_ELEMENTS = ['input', 'select', 'textarea'] as const;

/**
 * Types d'`input` hors sujet : ils n'ouvrent pas de clavier, ne déclenchent donc aucun zoom, et
 * sont volontairement dimensionnés à la main dans l'app (interrupteurs, quantièmes, pastilles).
 */
const NON_TEXT_INPUT = /\[type=['"]?(checkbox|radio|range|color|file)['"]?\]/;

/** `input`/`select`/`textarea` en tant qu'ÉLÉMENT, jamais en tant que morceau de nom de classe. */
const FIELD_ELEMENT_TOKEN = new RegExp(`(^|[\\s>+~(])(${FIELD_ELEMENTS.join('|')})(?![\\w-])`);

/** Convertit une valeur de `font-size` en pixels ; `undefined` si l'unité n'est pas comparable. */
function fontSizeInPx(value: string): number | undefined {
	const m = value.trim().match(/^(\d*\.?\d+)(px|rem)$/);
	if (!m) return undefined;
	return m[2] === 'rem' ? Number(m[1]) * 16 : Number(m[1]);
}

/**
 * Règles `sélecteur { déclarations }` d'une feuille de style. Le motif ne traversant pas les
 * accolades, les règles imbriquées (`@media`) sont capturées telles quelles, l'enrobage ignoré —
 * suffisant ici, où seul le couple sélecteur/`font-size` nous intéresse.
 */
function rulesOf(stylesheet: string): { selector: string; declarations: string }[] {
	const withoutComments = stylesheet.replace(/\/\*[\s\S]*?\*\//g, '');
	return [...withoutComments.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({
		selector: m[1].trim(),
		declarations: m[2]
	}));
}

/** `font-size` déclarée par une règle, en pixels ; `undefined` si la règle n'en déclare pas. */
function declaredFontSizePx(declarations: string): number | undefined {
	const raw = [...declarations.matchAll(/(?:^|;)\s*font-size\s*:\s*([^;]+)/g)].at(-1)?.[1];
	return raw === undefined ? undefined : fontSizeInPx(raw);
}

/** Sélecteurs d'une liste `a, b` qui ciblent un champ de saisie ouvrant un clavier. */
function fieldSelectors(selector: string): string[] {
	return selector
		.split(',')
		.map((s) => s.trim())
		.filter((s) => FIELD_ELEMENT_TOKEN.test(s) && !NON_TEXT_INPUT.test(s));
}

const srcDir = fileURLToPath(new URL('.', import.meta.url));
const svelteFiles = readdirSync(srcDir, { recursive: true, encoding: 'utf-8' })
	.filter((f) => f.endsWith('.svelte'))
	.sort();

describe('Zoom au focus des champs de saisie sur iOS (BUG-003)', () => {
	it('app.css impose à tout champ de saisie une taille de texte >= 16px', () => {
		// Le défaut d'origine : aucune règle de `app.css` ne visait `input`/`select`/`textarea`,
		// qui retombaient donc sur la taille par défaut de WebKit (~13px) et zoomaient au focus.
		for (const element of FIELD_ELEMENTS) {
			const sizes = rulesOf(css)
				.filter((r) => r.selector.split(',').some((s) => s.trim() === element))
				.map((r) => declaredFontSizePx(r.declarations))
				.filter((px): px is number => px !== undefined);

			expect(sizes, `aucune règle globale ne fixe la taille de texte de <${element}>`).not.toEqual(
				[]
			);
			for (const px of sizes) {
				expect(px, `<${element}> : ${px}px`).toBeGreaterThanOrEqual(IOS_MIN_FIELD_FONT_PX);
			}
		}
	});

	it('aucun composant ne repasse un champ sous ce plancher (la règle scopée gagnerait)', () => {
		const offenders: string[] = [];

		for (const file of svelteFiles) {
			const source = readFileSync(new URL(file.replaceAll('\\', '/'), import.meta.url), 'utf-8');
			for (const style of source.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) {
				for (const rule of rulesOf(style[1])) {
					const px = declaredFontSizePx(rule.declarations);
					if (px === undefined || px >= IOS_MIN_FIELD_FONT_PX) continue;
					for (const selector of fieldSelectors(rule.selector)) {
						offenders.push(`${file} — "${selector}" : ${px}px`);
					}
				}
			}
		}

		expect(offenders).toEqual([]);
	});

	it("laisse le zoom manuel possible : le viewport n'interdit pas le pincement", () => {
		// Corollaire d'accessibilité posé par la fiche BUG-003 : on corrige le zoom SUBI, on ne
		// confisque pas le zoom VOULU. `user-scalable=no` / `maximum-scale` sont donc proscrits.
		const appHtml = readFileSync(fileURLToPath(new URL('./app.html', import.meta.url)), 'utf-8');
		const viewport = appHtml.match(/<meta name="viewport" content="([^"]*)"/)?.[1] ?? '';

		expect(viewport).not.toBe('');
		expect(viewport).not.toMatch(/user-scalable\s*=\s*no/);
		expect(viewport).not.toMatch(/maximum-scale/);
	});
});
