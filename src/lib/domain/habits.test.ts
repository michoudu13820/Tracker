import { describe, it, expect } from 'vitest';
import {
	draftToFrequency,
	draftToTarget,
	describeFrequency,
	describeTarget,
	emptyHabitDraft,
	formatTargetNumber,
	frequencyToDraft,
	activeHabits,
	habitStatus,
	hasNumericTarget,
	isDueForAutoResume,
	isHabitActive,
	isHabitDeleted,
	isHabitPaused,
	pausedOrDeletedHabits,
	targetToDraft,
	TARGET_UNITS,
	targetUnitLabel,
	validateHabitDraft,
	visibleHabits,
	type HabitDraft
} from './habits';
import type { Habit } from './types';

describe('validateHabitDraft', () => {
	it('valide un brouillon avec fréquence intervalle (US-001 scénario 1)', () => {
		const draft: HabitDraft = {
			...emptyHabitDraft(),
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
			...emptyHabitDraft(),
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
			...emptyHabitDraft(),
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
			...emptyHabitDraft(),
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

const baseHabit: Habit = {
	id: 'h1',
	name: 'Yoga',
	emoji: '🧘',
	frequency: { kind: 'interval', days: 1, anchor: '2026-01-01' },
	createdAt: '2026-01-01'
};

describe('habitStatus (US-013/US-015 — rétro-compatibilité)', () => {
	it("résout 'active' pour une habitude sans champ status (persistée avant la fonctionnalité)", () => {
		expect(habitStatus(baseHabit)).toBe('active');
		expect(isHabitActive(baseHabit)).toBe(true);
		expect(isHabitPaused(baseHabit)).toBe(false);
		expect(isHabitDeleted(baseHabit)).toBe(false);
	});

	it("résout le statut explicite quand il est renseigné", () => {
		expect(habitStatus({ ...baseHabit, status: 'paused' })).toBe('paused');
		expect(isHabitPaused({ ...baseHabit, status: 'paused' })).toBe(true);
		expect(isHabitDeleted({ ...baseHabit, status: 'deleted' })).toBe(true);
	});
});

describe('visibleHabits (US-013 scénario 3 — liste de gestion)', () => {
	it('exclut les habitudes supprimées mais garde les actives et en pause', () => {
		const active = baseHabit;
		const paused = { ...baseHabit, id: 'h2', status: 'paused' as const };
		const deleted = { ...baseHabit, id: 'h3', status: 'deleted' as const };
		expect(visibleHabits([active, paused, deleted])).toEqual([active, paused]);
	});
});

describe('activeHabits / pausedOrDeletedHabits (US-027 scénario 1 — regroupement par section)', () => {
	const active = baseHabit;
	const paused = { ...baseHabit, id: 'h2', status: 'paused' as const };
	const deleted = { ...baseHabit, id: 'h3', status: 'deleted' as const };

	it('activeHabits ne garde que les habitudes actives', () => {
		expect(activeHabits([active, paused, deleted])).toEqual([active]);
	});

	it('pausedOrDeletedHabits regroupe en pause et supprimées, jamais les actives', () => {
		expect(pausedOrDeletedHabits([active, paused, deleted])).toEqual([paused, deleted]);
	});
});

describe('isDueForAutoResume (US-027 scénarios 3/4)', () => {
	it('scénario 4 — vrai si en pause avec une date de reprise déjà atteinte', () => {
		const habit = { ...baseHabit, status: 'paused' as const, resumeAt: '2026-08-10' };
		expect(isDueForAutoResume(habit, '2026-08-10')).toBe(true);
		expect(isDueForAutoResume(habit, '2026-08-15')).toBe(true);
	});

	it("faux si la date de reprise n'est pas encore atteinte", () => {
		const habit = { ...baseHabit, status: 'paused' as const, resumeAt: '2026-08-20' };
		expect(isDueForAutoResume(habit, '2026-08-10')).toBe(false);
	});

	it('scénario 3 — faux sans date de reprise programmée (pause indéfinie, comportement US-015 inchangé)', () => {
		const habit = { ...baseHabit, status: 'paused' as const };
		expect(isDueForAutoResume(habit, '2026-08-10')).toBe(false);
	});

	it("faux pour une habitude active ou supprimée, même avec une date passée", () => {
		expect(isDueForAutoResume({ ...baseHabit, resumeAt: '2026-08-01' }, '2026-08-10')).toBe(false);
		expect(
			isDueForAutoResume({ ...baseHabit, status: 'deleted', resumeAt: '2026-08-01' }, '2026-08-10')
		).toBe(false);
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

describe('validateHabitDraft — cible chiffrée (US-017 scénario 4)', () => {
	const validBase: HabitDraft = {
		...emptyHabitDraft(),
		name: "Boire de l'eau",
		frequencyMode: 'interval',
		intervalDays: 1
	};

	it('valide un brouillon sans cible activée (scénario 1 — rétrocompatibilité)', () => {
		expect(validateHabitDraft(validBase)).toEqual({ valid: true, errors: [] });
	});

	it('valide une cible activée avec une valeur positive', () => {
		const draft: HabitDraft = { ...validBase, hasTarget: true, targetValue: 1.5, targetUnit: 'L' };
		expect(validateHabitDraft(draft)).toEqual({ valid: true, errors: [] });
	});

	it('bloque une cible activée sans valeur renseignée', () => {
		const draft: HabitDraft = { ...validBase, hasTarget: true, targetValue: null };
		const result = validateHabitDraft(draft);
		expect(result.valid).toBe(false);
		expect(result.errors).toContain('La cible doit être un nombre strictement positif.');
	});

	it('bloque une cible nulle', () => {
		const draft: HabitDraft = { ...validBase, hasTarget: true, targetValue: 0 };
		expect(validateHabitDraft(draft).valid).toBe(false);
	});

	it('bloque une cible négative', () => {
		const draft: HabitDraft = { ...validBase, hasTarget: true, targetValue: -3 };
		expect(validateHabitDraft(draft).valid).toBe(false);
	});
});

describe('draftToTarget / targetToDraft (US-017 scénarios 2/5/6)', () => {
	it('construit la cible finale quand l’option est activée', () => {
		const draft: HabitDraft = {
			...emptyHabitDraft(),
			name: 'Test',
			hasTarget: true,
			targetValue: 1.5,
			targetUnit: 'L'
		};
		expect(draftToTarget(draft)).toEqual({ value: 1.5, unit: 'L' });
	});

	it('retourne undefined quand l’option est désactivée (scénario 1)', () => {
		expect(draftToTarget(emptyHabitDraft())).toBeUndefined();
	});

	it('reconstruit un brouillon depuis une cible existante (édition, scénario 5)', () => {
		expect(targetToDraft({ value: 30, unit: 'min' })).toEqual({
			hasTarget: true,
			targetValue: 30,
			targetUnit: 'min'
		});
	});

	it('reconstruit un brouillon désactivé quand l’habitude n’a pas de cible (scénario 1)', () => {
		expect(targetToDraft(undefined)).toEqual({
			hasTarget: false,
			targetValue: null,
			targetUnit: 'L'
		});
	});

	it('round-trip cible -> brouillon -> cible (scénario 6, retour à une habitude simple)', () => {
		const draft: HabitDraft = { ...emptyHabitDraft(), name: 'Test', ...targetToDraft(undefined) };
		expect(draftToTarget(draft)).toBeUndefined();
	});
});

describe('hasNumericTarget / describeTarget (US-017 scénario 2)', () => {
	it("détecte une habitude à cible chiffrée", () => {
		expect(hasNumericTarget({ ...baseHabit, target: { value: 1.5, unit: 'L' } })).toBe(true);
		expect(hasNumericTarget(baseHabit)).toBe(false);
	});

	it('décrit une cible avec une virgule décimale française', () => {
		expect(describeTarget({ value: 1.5, unit: 'L' })).toBe('1,5 L');
	});

	it('décrit une cible entière sans décimale superflue', () => {
		expect(describeTarget({ value: 30, unit: 'min' })).toBe('30 min');
	});
});

describe('formatTargetNumber', () => {
	it('évite les artefacts de virgule flottante', () => {
		expect(formatTargetNumber(0.1 + 0.2)).toBe('0,3');
	});
});

describe('TARGET_UNITS / targetUnitLabel (US-017 scénario 3 — liste fermée)', () => {
	it('expose exactement les 6 unités prédéfinies', () => {
		expect(TARGET_UNITS).toEqual(['L', 'mL', 'min', 'h', 'km', 'x']);
	});

	it('fournit un libellé lisible pour chaque unité', () => {
		expect(targetUnitLabel('L')).toBe('Litres (L)');
		expect(targetUnitLabel('mL')).toBe('Millilitres (mL)');
		expect(targetUnitLabel('min')).toBe('Minutes (min)');
		expect(targetUnitLabel('h')).toBe('Heures (h)');
		expect(targetUnitLabel('km')).toBe('Kilomètres (km)');
		expect(targetUnitLabel('x')).toBe('Répétitions/Nombre (x)');
	});
});
