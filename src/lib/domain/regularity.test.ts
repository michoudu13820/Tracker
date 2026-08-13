import { describe, it, expect } from 'vitest';
import { last7DaysRegularity, missedYesterday, monthlyCompletionCount } from './regularity';
import type { Habit, HabitCompletion } from './types';

// Lundi 3 août 2026 → dimanche 9 août 2026 : semaine de référence pour les tests de fenêtre.
const yoga: Habit = {
	id: 'h1',
	name: 'Yoga',
	emoji: '🧘',
	createdAt: '2026-07-01',
	frequency: { kind: 'weekdays', weekdays: [1, 3, 5] } // lundi, mercredi, vendredi
};

describe('last7DaysRegularity (US-024 scénario 1)', () => {
	it('renvoie 7 jours en ordre chronologique croissant, se terminant sur "today"', () => {
		const today = '2026-08-09'; // dimanche
		const days = last7DaysRegularity(yoga, [], today);
		expect(days).toHaveLength(7);
		expect(days[0].date).toBe('2026-08-03');
		expect(days[6].date).toBe('2026-08-09');
	});

	it('scénario 1 — marque "done" les jours dus et faits', () => {
		const today = '2026-08-09';
		const completions: HabitCompletion[] = [
			{ habitId: yoga.id, date: '2026-08-03', done: true }, // lundi
			{ habitId: yoga.id, date: '2026-08-05', done: true }, // mercredi
			{ habitId: yoga.id, date: '2026-08-07', done: true } // vendredi
		];
		const days = last7DaysRegularity(yoga, completions, today);
		const done = days.filter((d) => d.status === 'done').map((d) => d.date);
		expect(done).toEqual(['2026-08-03', '2026-08-05', '2026-08-07']);
	});

	it('scénario 4 — distingue "not-due" (jour non concerné) de "missed" (dû mais non fait)', () => {
		const today = '2026-08-09';
		// Aucune complétion : lundi/mercredi/vendredi sont dus mais non faits → "missed" ;
		// mardi/jeudi/samedi/dimanche ne sont pas dus → "not-due".
		const days = last7DaysRegularity(yoga, [], today);
		const byDate = Object.fromEntries(days.map((d) => [d.date, d.status]));
		expect(byDate['2026-08-03']).toBe('missed'); // lundi
		expect(byDate['2026-08-04']).toBe('not-due'); // mardi
		expect(byDate['2026-08-05']).toBe('missed'); // mercredi
		expect(byDate['2026-08-06']).toBe('not-due'); // jeudi
		expect(byDate['2026-08-07']).toBe('missed'); // vendredi
		expect(byDate['2026-08-08']).toBe('not-due'); // samedi
		expect(byDate['2026-08-09']).toBe('not-due'); // dimanche
	});

	it("n'inclut jamais une notion de série (aucun champ streak/compteur consécutif)", () => {
		const today = '2026-08-09';
		const days = last7DaysRegularity(yoga, [], today);
		for (const day of days) {
			expect(Object.keys(day).sort()).toEqual(['date', 'status']);
		}
	});
});

describe('monthlyCompletionCount (US-024 scénario 2)', () => {
	it('compte uniquement les complétions faites depuis le début du mois courant', () => {
		const today = '2026-08-20';
		const completions: HabitCompletion[] = [
			{ habitId: yoga.id, date: '2026-07-30', done: true }, // mois précédent, exclu
			{ habitId: yoga.id, date: '2026-08-01', done: true },
			{ habitId: yoga.id, date: '2026-08-05', done: false }, // non fait, exclu
			{ habitId: yoga.id, date: '2026-08-10', done: true },
			{ habitId: yoga.id, date: '2026-08-20', done: true },
			{ habitId: 'other', date: '2026-08-15', done: true } // autre habitude, exclu
		];
		expect(monthlyCompletionCount(yoga, completions, today)).toBe(3);
	});

	it('renvoie 0 sans complétion', () => {
		expect(monthlyCompletionCount(yoga, [], '2026-08-20')).toBe(0);
	});
});

describe('missedYesterday (US-025)', () => {
	// 2026-08-13 = jeudi. "Hier" = 2026-08-12 (mercredi, due pour `yoga`).
	const today = '2026-08-13';

	it('scénario 1 — vrai si due hier et non cochée faite', () => {
		expect(missedYesterday(yoga, [], today)).toBe(true);
	});

	it("scénario 2 — faux si l'habitude n'était pas due hier", () => {
		const tuesdayOnly: Habit = { ...yoga, id: 'h2', frequency: { kind: 'weekdays', weekdays: [2] } };
		expect(missedYesterday(tuesdayOnly, [], today)).toBe(false);
	});

	it('scénario 3 — faux si due hier et cochée faite', () => {
		const completions: HabitCompletion[] = [{ habitId: yoga.id, date: '2026-08-12', done: true }];
		expect(missedYesterday(yoga, completions, today)).toBe(false);
	});

	it("scénario 4 — ne porte que sur hier, jamais sur un jour plus ancien manqué", () => {
		// Manquée avant-hier (2026-08-11, mardi — non due pour `yoga`) ; hier (mercredi) est due
		// mais on la coche faite : aucun signal, peu importe l'historique plus ancien.
		const completions: HabitCompletion[] = [
			{ habitId: yoga.id, date: '2026-08-10', done: false }, // lundi, manqué, mais avant-hier
			{ habitId: yoga.id, date: '2026-08-12', done: true } // hier, faite
		];
		expect(missedYesterday(yoga, completions, today)).toBe(false);
	});
});
