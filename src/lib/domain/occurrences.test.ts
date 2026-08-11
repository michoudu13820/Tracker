import { describe, it, expect } from 'vitest';
import { isDueOn } from './occurrences';
import type { Habit } from './types';

const base = { id: 'h1', name: 'Test', emoji: '✅', createdAt: '2026-01-01' } as const;

describe('isDueOn — fréquence par intervalle', () => {
	const habit: Habit = { ...base, frequency: { kind: 'interval', days: 2, anchor: '2026-08-10' } };

	it('est due le jour d\'ancrage', () => {
		expect(isDueOn(habit, '2026-08-10')).toBe(true);
	});
	it('est due tous les 2 jours', () => {
		expect(isDueOn(habit, '2026-08-12')).toBe(true);
		expect(isDueOn(habit, '2026-08-11')).toBe(false);
	});
	it('n\'est jamais due avant l\'ancrage', () => {
		expect(isDueOn(habit, '2026-08-09')).toBe(false);
	});
});

describe('isDueOn — fréquence par jours de semaine', () => {
	// lundi=1, mercredi=3, vendredi=5
	const habit: Habit = { ...base, frequency: { kind: 'weekdays', weekdays: [1, 3, 5] } };

	it('est due un mercredi (2026-08-12)', () => {
		expect(isDueOn(habit, '2026-08-12')).toBe(true);
	});
	it('n\'est pas due un mardi (2026-08-11)', () => {
		expect(isDueOn(habit, '2026-08-11')).toBe(false);
	});
});
