import { describe, it, expect } from 'vitest';
import {
	draftToFrequency,
	describeFrequency,
	emptyHabitDraft,
	frequencyToDraft,
	validateHabitDraft,
	type HabitDraft
} from './habits';

describe('validateHabitDraft', () => {
	it('valide un brouillon avec fréquence intervalle (US-001 scénario 1)', () => {
		const draft: HabitDraft = {
			name: "Boire de l'eau",
			emoji: '💧',
			frequencyMode: 'interval',
			intervalDays: 2,
			weekdays: []
		};
		expect(validateHabitDraft(draft)).toEqual({ valid: true, errors: [] });
	});

	it('valide un brouillon avec fréquence jours de semaine (US-001 scénario 2)', () => {
		const draft: HabitDraft = {
			name: 'Yoga',
			emoji: '🧘',
			frequencyMode: 'weekdays',
			intervalDays: null,
			weekdays: [1, 3, 5]
		};
		expect(validateHabitDraft(draft)).toEqual({ valid: true, errors: [] });
	});

	it('bloque et signale le nom manquant (US-001 scénario 5)', () => {
		const draft: HabitDraft = { ...emptyHabitDraft(), frequencyMode: 'interval', intervalDays: 2 };
		const result = validateHabitDraft(draft);
		expect(result.valid).toBe(false);
		expect(result.errors).toContain('Le nom est obligatoire.');
	});

	it('bloque et signale le mode de fréquence manquant (US-001 scénario 5)', () => {
		const draft: HabitDraft = { ...emptyHabitDraft(), name: 'Marcher' };
		const result = validateHabitDraft(draft);
		expect(result.valid).toBe(false);
		expect(result.errors.some((e) => e.includes('fréquence'))).toBe(true);
	});

	it('bloque un intervalle non renseigné', () => {
		const draft: HabitDraft = { ...emptyHabitDraft(), name: 'Marcher', frequencyMode: 'interval' };
		expect(validateHabitDraft(draft).valid).toBe(false);
	});

	it('bloque des jours de semaine vides', () => {
		const draft: HabitDraft = { ...emptyHabitDraft(), name: 'Marcher', frequencyMode: 'weekdays' };
		expect(validateHabitDraft(draft).valid).toBe(false);
	});
});

describe('draftToFrequency (US-001 scénario 3 — exclusivité des modes)', () => {
	it("construit une fréquence 'interval' sans trace de jours de semaine", () => {
		const draft: HabitDraft = {
			name: 'Test',
			emoji: '✅',
			frequencyMode: 'interval',
			intervalDays: 3,
			weekdays: [1, 2]
		};
		expect(draftToFrequency(draft, '2026-08-12')).toEqual({
			kind: 'interval',
			days: 3,
			anchor: '2026-08-12'
		});
	});

	it("construit une fréquence 'weekdays' sans trace d'intervalle", () => {
		const draft: HabitDraft = {
			name: 'Test',
			emoji: '✅',
			frequencyMode: 'weekdays',
			intervalDays: 5,
			weekdays: [1, 3, 5]
		};
		expect(draftToFrequency(draft, '2026-08-12')).toEqual({
			kind: 'weekdays',
			weekdays: [1, 3, 5]
		});
	});
});

describe('frequencyToDraft (édition — US-001 scénario 6)', () => {
	it('reconstruit un brouillon depuis une fréquence weekdays existante', () => {
		expect(frequencyToDraft({ kind: 'weekdays', weekdays: [1, 3, 5] })).toEqual({
			frequencyMode: 'weekdays',
			intervalDays: null,
			weekdays: [1, 3, 5]
		});
	});

	it('reconstruit un brouillon depuis une fréquence interval existante', () => {
		expect(frequencyToDraft({ kind: 'interval', days: 4, anchor: '2026-01-01' })).toEqual({
			frequencyMode: 'interval',
			intervalDays: 4,
			weekdays: []
		});
	});
});

describe('describeFrequency', () => {
	it('décrit un intervalle', () => {
		expect(describeFrequency({ kind: 'interval', days: 2, anchor: '2026-01-01' })).toBe(
			'Tous les 2 jours'
		);
	});

	it('décrit des jours de semaine dans l’ordre lundi → dimanche', () => {
		expect(describeFrequency({ kind: 'weekdays', weekdays: [5, 1, 3] })).toBe(
			'lundi, mercredi, vendredi'
		);
	});
});
