import { describe, it, expect } from 'vitest';
import {
	CARD_COLORS,
	DEFAULT_CARD_COLOR,
	cardColorLabel,
	cardColorStyle,
	cardColorToPersist,
	isCardColor,
	resolveCardColor
} from './card-colors';

describe('Palette fermée (US-036 scénario 1)', () => {
	it('propose entre 6 et 8 teintes, et rien d’autre', () => {
		expect(CARD_COLORS.length).toBeGreaterThanOrEqual(6);
		expect(CARD_COLORS.length).toBeLessThanOrEqual(8);
		expect(new Set(CARD_COLORS).size).toBe(CARD_COLORS.length);
	});

	it('donne à chaque teinte un libellé lisible distinct (jamais une pastille seule)', () => {
		const labels = CARD_COLORS.map(cardColorLabel);
		for (const label of labels) expect(label.trim().length).toBeGreaterThan(0);
		expect(new Set(labels).size).toBe(CARD_COLORS.length);
	});

	it('inclut la teinte par défaut dans la liste sélectionnable', () => {
		expect(CARD_COLORS).toContain(DEFAULT_CARD_COLOR);
	});

	it('rejette toute valeur hors de la liste fermée (pas de code hexadécimal libre)', () => {
		expect(isCardColor('menthe')).toBe(true);
		expect(isCardColor('#ff0000')).toBe(false);
		expect(isCardColor('turquoise')).toBe(false);
		expect(isCardColor(undefined)).toBe(false);
		expect(isCardColor(42)).toBe(false);
	});
});

describe('resolveCardColor — couleur par défaut et rétro-compatibilité (US-036 scénarios 3/4)', () => {
	it('scénario 4 — un élément sans couleur (persisté avant l’évolution) prend la teinte par défaut', () => {
		expect(resolveCardColor(undefined)).toBe(DEFAULT_CARD_COLOR);
	});

	it('conserve une teinte connue telle quelle', () => {
		expect(resolveCardColor('menthe')).toBe('menthe');
	});

	it('retombe sur la teinte par défaut pour une valeur inconnue, sans casser l’affichage', () => {
		expect(resolveCardColor('fuchsia-neon')).toBe(DEFAULT_CARD_COLOR);
	});
});

describe('cardColorStyle — branchement des variables CSS (US-009 : aucune couleur en dur)', () => {
	it('ne référence que des variables CSS, jamais une valeur de couleur', () => {
		const style = cardColorStyle('menthe');
		expect(style).toContain('--card-tint: var(--tint-menthe-bg)');
		expect(style).toContain('--card-accent: var(--tint-menthe-border)');
		expect(style).not.toMatch(/#[0-9a-f]{3,6}/i);
		expect(style).not.toMatch(/rgb|hsl/i);
	});

	it('scénario 3 — sans couleur choisie, branche les variables de la teinte par défaut', () => {
		expect(cardColorStyle(undefined)).toBe(cardColorStyle(DEFAULT_CARD_COLOR));
	});
});

describe('cardColorToPersist — retour à la couleur par défaut (US-036 scénario 6)', () => {
	it('ne persiste pas la teinte par défaut : indiscernable d’un élément sans couleur', () => {
		expect(cardColorToPersist(DEFAULT_CARD_COLOR)).toBeUndefined();
	});

	it('persiste toute autre teinte choisie', () => {
		expect(cardColorToPersist('ciel')).toBe('ciel');
	});
});
