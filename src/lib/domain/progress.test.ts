import { describe, it, expect } from 'vitest';
import {
	isTargetReached,
	parseAmount,
	progressPercent,
	progressValue,
	roundAmount,
	validateAmount
} from './progress';
import type { HabitProgress } from './types';

describe('validateAmount (US-018 scénario 6)', () => {
	it('valide un nombre positif avec un point décimal', () => {
		expect(validateAmount('0.2')).toEqual({ valid: true });
	});

	it('valide un nombre positif avec une virgule décimale française', () => {
		expect(validateAmount('0,2')).toEqual({ valid: true });
	});

	it('valide un nombre entier positif', () => {
		expect(validateAmount('3')).toEqual({ valid: true });
	});

	it('rejette une saisie vide', () => {
		const result = validateAmount('');
		expect(result.valid).toBe(false);
		expect(result.error).toBe('La quantité doit être un nombre strictement positif.');
	});

	it('rejette une saisie non numérique', () => {
		expect(validateAmount('abc').valid).toBe(false);
	});

	it('rejette zéro', () => {
		expect(validateAmount('0').valid).toBe(false);
	});

	it('rejette une valeur négative', () => {
		expect(validateAmount('-1').valid).toBe(false);
	});
});

describe('parseAmount', () => {
	it('convertit la virgule en point', () => {
		expect(parseAmount('1,5')).toBe(1.5);
	});
	it('ignore les espaces superflus', () => {
		expect(parseAmount('  2  ')).toBe(2);
	});
});

describe('roundAmount', () => {
	it('évite les artefacts de virgule flottante', () => {
		expect(roundAmount(0.2 + 0.3)).toBe(0.5);
	});
});

describe('progressValue (US-018 scénarios 1/7/8)', () => {
	const progress: HabitProgress[] = [
		{ habitId: 'h1', date: '2026-08-12', value: 0.5 },
		{ habitId: 'h1', date: '2026-08-11', value: 1.2 }
	];

	it('retourne 0 par défaut si aucune entrée pour ce jour (scénario 1 — état initial)', () => {
		expect(progressValue(progress, 'h1', '2026-08-13')).toBe(0);
	});

	it('retourne la valeur cumulée du jour demandé', () => {
		expect(progressValue(progress, 'h1', '2026-08-12')).toBe(0.5);
	});

	it("n'est pas affectée par la valeur d'un autre jour (scénario 7 — réinitialisation quotidienne)", () => {
		expect(progressValue(progress, 'h1', '2026-08-13')).toBe(0);
		expect(progressValue(progress, 'h1', '2026-08-11')).toBe(1.2);
	});

	it("retourne la valeur historique d'un jour passé sans interférence (scénario 8)", () => {
		expect(progressValue(progress, 'h1', '2026-08-11')).toBe(1.2);
	});
});

describe('progressPercent (US-018 scénarios 2/3/5)', () => {
	it('calcule un pourcentage proportionnel (scénario 2 — 0,2/1,5 ≈ 13%)', () => {
		expect(progressPercent(0.2, 1.5)).toBe(13);
	});

	it('calcule le cumul de plusieurs saisies (scénario 3 — 0,5/1,5 ≈ 33%)', () => {
		expect(progressPercent(0.5, 1.5)).toBe(33);
	});

	it('atteint 100% exactement à la cible (scénario 4)', () => {
		expect(progressPercent(1.5, 1.5)).toBe(100);
	});

	it('dépasse 100% sans limite haute (scénario 5 — 1,8/1,5 = 120%)', () => {
		expect(progressPercent(1.8, 1.5)).toBe(120);
	});
});

describe('isTargetReached (US-018 scénarios 4/5)', () => {
	it("n'est pas atteinte sous la cible", () => {
		expect(isTargetReached(1.3, 1.5)).toBe(false);
	});

	it('est atteinte exactement à la cible (scénario 4)', () => {
		expect(isTargetReached(1.5, 1.5)).toBe(true);
	});

	it('reste atteinte au-delà de la cible (scénario 5 — dépassement)', () => {
		expect(isTargetReached(1.8, 1.5)).toBe(true);
	});
});
