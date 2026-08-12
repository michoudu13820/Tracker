// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { applyFontChoice, ensureGoogleFontsLoaded } from './client';

afterEach(() => {
	document.getElementById('tracker-google-fonts')?.remove();
	document.documentElement.style.removeProperty('--font-family');
});

describe('applyFontChoice (US-016 scénario 3 — bascule immédiate)', () => {
	it("applique la pile système sans charger de feuille de style Google Fonts pour 'system'", () => {
		applyFontChoice('system');

		expect(document.documentElement.style.getPropertyValue('--font-family')).toContain(
			'-apple-system'
		);
		expect(document.getElementById('tracker-google-fonts')).toBeNull();
	});

	it('applique la police Google Fonts choisie et charge sa feuille de style', () => {
		applyFontChoice('inter');

		expect(document.documentElement.style.getPropertyValue('--font-family')).toContain('Inter');
		const link = document.getElementById('tracker-google-fonts') as HTMLLinkElement | null;
		expect(link).not.toBeNull();
		expect(link?.rel).toBe('stylesheet');
		expect(link?.href).toContain('fonts.googleapis.com');
	});

	it('applique Dancing Script (nouvelle police par défaut, US-020) comme toute autre police Google Fonts', () => {
		applyFontChoice('dancing-script');

		expect(document.documentElement.style.getPropertyValue('--font-family')).toContain(
			'Dancing Script'
		);
		const link = document.getElementById('tracker-google-fonts') as HTMLLinkElement | null;
		expect(link).not.toBeNull();
		expect(link?.href).toContain('fonts.googleapis.com');
	});
});

describe('ensureGoogleFontsLoaded (US-016 scénario 2 — aperçu, idempotent)', () => {
	it("n'injecte le lien qu'une seule fois même appelé plusieurs fois", () => {
		ensureGoogleFontsLoaded();
		ensureGoogleFontsLoaded();
		ensureGoogleFontsLoaded();

		expect(document.querySelectorAll('#tracker-google-fonts').length).toBe(1);
	});
});
