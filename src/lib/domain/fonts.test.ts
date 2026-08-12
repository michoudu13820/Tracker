import { describe, it, expect } from 'vitest';
import {
	DEFAULT_FONT_CHOICE,
	FONT_OPTIONS,
	fontOptionById,
	googleFontsStylesheetUrl,
	SYSTEM_FONT_STACK
} from './fonts';

describe('FONT_OPTIONS (US-016 — catalogue de polices, étendu par US-020)', () => {
	it('propose onze polices (US-016 : 10 + Dancing Script, US-020), dont la police système en tête', () => {
		expect(FONT_OPTIONS.length).toBe(11);
		expect(FONT_OPTIONS[0].id).toBe('system');
		expect(FONT_OPTIONS[0].label).toBe('Système');
	});

	it("la police système par défaut n'a pas de famille Google Fonts (aucun réseau)", () => {
		expect(fontOptionById('system').googleFontFamily).toBeUndefined();
	});

	it('chaque option Google Fonts empile la pile système en repli final (critère hors-ligne)', () => {
		const googleOptions = FONT_OPTIONS.filter((o) => o.googleFontFamily);
		expect(googleOptions.length).toBe(10);
		for (const option of googleOptions) {
			expect(option.cssFontFamily.endsWith(SYSTEM_FONT_STACK)).toBe(true);
		}
	});

	it("Dancing Script est la 11ᵉ option du catalogue, marquée comme police par défaut (US-020 scénario 1)", () => {
		const dancingScript = fontOptionById('dancing-script');
		expect(FONT_OPTIONS[FONT_OPTIONS.length - 1]).toBe(dancingScript);
		expect(dancingScript.label).toBe('Dancing Script (par défaut)');
		expect(dancingScript.googleFontFamily).toBe('Dancing Script');
		expect(dancingScript.cssFontFamily).toBe(`'Dancing Script', ${SYSTEM_FONT_STACK}`);
	});

	it('la nouvelle police par défaut est Dancing Script (US-020, remplace la police système)', () => {
		expect(DEFAULT_FONT_CHOICE).toBe('dancing-script');
		expect(fontOptionById(DEFAULT_FONT_CHOICE).cssFontFamily).toBe(
			`'Dancing Script', ${SYSTEM_FONT_STACK}`
		);
	});
});

describe('fontOptionById', () => {
	it('résout une option connue', () => {
		expect(fontOptionById('inter').label).toBe('Inter');
	});

	it('résout Dancing Script', () => {
		expect(fontOptionById('dancing-script').id).toBe('dancing-script');
	});

	it('se replie sur la police système pour un id inconnu (défensif)', () => {
		// @ts-expect-error id volontairement invalide pour tester le repli défensif
		expect(fontOptionById('inconnu').id).toBe('system');
	});
});

describe('googleFontsStylesheetUrl (US-016 scénario 2 — aperçu combiné, US-020 étend au catalogue à 11)', () => {
	it('combine toutes les familles Google Fonts en une seule URL, dont Dancing Script', () => {
		const url = googleFontsStylesheetUrl();
		expect(url).toContain('https://fonts.googleapis.com/css2?');
		expect(url).toContain('family=Inter:wght@400;600');
		expect(url).toContain('family=Playfair+Display:wght@400;600');
		expect(url).toContain('family=Dancing+Script:wght@400;600');
		expect(url).toContain('display=swap');
	});

	it("n'inclut jamais la police système (aucune famille Google Fonts)", () => {
		const url = googleFontsStylesheetUrl();
		expect(url).not.toContain('family=Syst%C3%A8me');
		expect(url).not.toContain('family=Système');
	});
});
