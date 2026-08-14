import { describe, it, expect } from 'vitest';
import { habitsDueOn, isDueOn, resolveMonthDays } from './occurrences';
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

describe('resolveMonthDays — repli et déduplication (US-032 scénarios 6/7/8)', () => {
	it('scénario 6 — conserve le quantième dans un mois qui le contient', () => {
		expect(resolveMonthDays([31], 2026, 1)).toEqual([31]); // janvier, 31 jours
		expect(resolveMonthDays([1, 15], 2026, 4)).toEqual([1, 15]);
	});

	it('scénario 6 — replie le 31 sur le 30 en avril (mois de 30 jours)', () => {
		expect(resolveMonthDays([31], 2026, 4)).toEqual([30]);
	});

	it('scénario 6 — replie le 31 sur le 28 en février non bissextile, le 29 en bissextile', () => {
		expect(resolveMonthDays([31], 2026, 2)).toEqual([28]);
		expect(resolveMonthDays([31], 2028, 2)).toEqual([29]);
	});

	it('scénario 7 — deux quantièmes repliés sur la même date ne produisent qu’une occurrence', () => {
		expect(resolveMonthDays([30, 31], 2026, 2)).toEqual([28]);
		expect(resolveMonthDays([29, 30, 31], 2026, 2)).toEqual([28]);
		// En avril (30 jours), le 30 et le 31 se replient aussi sur la même date.
		expect(resolveMonthDays([30, 31], 2026, 4)).toEqual([30]);
	});

	it('scénario 8 — le 29 tombe le 28 en année non bissextile, le 29 en bissextile', () => {
		expect(resolveMonthDays([29], 2026, 2)).toEqual([28]);
		expect(resolveMonthDays([29], 2028, 2)).toEqual([29]);
	});

	it('scénario 8 — aucun mois n’est laissé sans occurrence à cause du repli', () => {
		for (let month = 1; month <= 12; month++) {
			expect(resolveMonthDays([31], 2026, month).length).toBe(1);
		}
	});

	it('rend toujours des quantièmes triés en ordre croissant', () => {
		expect(resolveMonthDays([28, 1, 15], 2026, 3)).toEqual([1, 15, 28]);
	});
});

describe('isDueOn — fréquence par jours du mois (US-032)', () => {
	const monthly: Habit = { ...base, frequency: { kind: 'monthdays', monthdays: [1, 15] } };

	it('scénario 9 — est due le 1 et le 15, et aucun autre jour du mois', () => {
		expect(isDueOn(monthly, '2026-08-01')).toBe(true);
		expect(isDueOn(monthly, '2026-08-15')).toBe(true);
		expect(isDueOn(monthly, '2026-08-14')).toBe(false);
		expect(isDueOn(monthly, '2026-08-16')).toBe(false);
		expect(isDueOn(monthly, '2026-08-31')).toBe(false);
	});

	it('scénario 9 — se répète à l’identique le mois suivant', () => {
		expect(isDueOn(monthly, '2026-09-01')).toBe(true);
		expect(isDueOn(monthly, '2026-09-15')).toBe(true);
	});

	it('scénario 6 — le 31 se replie sur le dernier jour du mois quand il n’existe pas', () => {
		const last: Habit = { ...base, frequency: { kind: 'monthdays', monthdays: [31] } };
		expect(isDueOn(last, '2026-04-30')).toBe(true); // avril : 30 jours
		expect(isDueOn(last, '2026-04-29')).toBe(false);
		expect(isDueOn(last, '2026-02-28')).toBe(true); // février non bissextile
		expect(isDueOn(last, '2028-02-29')).toBe(true); // février bissextile
		expect(isDueOn(last, '2028-02-28')).toBe(false);
		expect(isDueOn(last, '2026-01-31')).toBe(true); // mois de 31 jours
	});

	it('scénario 7 — 30 et 31 ne produisent qu’un seul jour dû en février', () => {
		const twice: Habit = { ...base, frequency: { kind: 'monthdays', monthdays: [30, 31] } };
		const februaryDueDays = Array.from({ length: 28 }, (_, i) =>
			`2026-02-${String(i + 1).padStart(2, '0')}`
		).filter((d) => isDueOn(twice, d));
		expect(februaryDueDays).toEqual(['2026-02-28']);
	});
});

describe('habitsDueOn — exclusion des habitudes en pause/supprimées (US-013/US-015)', () => {
	const dueEveryDay: Habit = { ...base, frequency: { kind: 'interval', days: 1, anchor: '2026-08-01' } };

	it('inclut une habitude active due ce jour-là', () => {
		expect(habitsDueOn([dueEveryDay], '2026-08-12')).toEqual([dueEveryDay]);
	});

	it("n'inclut pas une habitude en pause, même due selon sa fréquence (US-015 scénario 2)", () => {
		const paused: Habit = { ...dueEveryDay, id: 'h2', status: 'paused' };
		expect(habitsDueOn([paused], '2026-08-12')).toEqual([]);
	});

	it("n'inclut pas une habitude supprimée, même due selon sa fréquence (US-013 scénario 3)", () => {
		const deleted: Habit = { ...dueEveryDay, id: 'h3', status: 'deleted' };
		expect(habitsDueOn([deleted], '2026-08-12')).toEqual([]);
	});

	it('US-032 scénario 12 — une habitude « jours du mois » en pause/supprimée disparaît aussi du planning', () => {
		const monthly: Habit = { ...base, frequency: { kind: 'monthdays', monthdays: [15] } };
		expect(habitsDueOn([monthly], '2026-08-15')).toEqual([monthly]);
		expect(habitsDueOn([{ ...monthly, status: 'paused' }], '2026-08-15')).toEqual([]);
		expect(habitsDueOn([{ ...monthly, status: 'deleted' }], '2026-08-15')).toEqual([]);
	});

	it('US-032 scénario 9/7 — une habitude « jours du mois » n’apparaît qu’une seule fois dans la liste du jour', () => {
		const twice: Habit = { ...base, frequency: { kind: 'monthdays', monthdays: [30, 31] } };
		expect(habitsDueOn([twice], '2026-02-28')).toHaveLength(1);
	});
});
