import { describe, it, expect } from 'vitest';
import { computeReminderWindow } from './reminders';
import type { Habit, HabitCompletion, ReminderSettings } from './types';

const settings: ReminderSettings = { enabled: true, time: '08:00', timezone: 'Europe/Paris' };

// Habitude tous les 2 jours, ancrée le 2026-08-10.
const habit: Habit = {
	id: 'h1',
	name: 'Boire de l\'eau',
	emoji: '💧',
	createdAt: '2026-08-10',
	frequency: { kind: 'interval', days: 2, anchor: '2026-08-10' }
};

describe('computeReminderWindow', () => {
	it('ne renvoie rien si les rappels sont désactivés', () => {
		const off = computeReminderWindow([habit], { ...settings, enabled: false });
		expect(off).toEqual([]);
	});

	it('ne programme que les jours à occurrence, dans l\'horizon', () => {
		// "now" = 2026-08-10 06:00 (avant l'heure de rappel du jour).
		const now = new Date(2026, 7, 10, 6, 0, 0);
		const window = computeReminderWindow([habit], settings, 5, now);
		// Jours dus dans [10, 14] : 10, 12, 14 → 3 rappels.
		expect(window.map((r) => r.date)).toEqual(['2026-08-10', '2026-08-12', '2026-08-14']);
	});

	it('exclut l\'instant déjà passé aujourd\'hui', () => {
		// "now" = 2026-08-10 09:00 (après 08:00) → le rappel du jour même est écarté.
		const now = new Date(2026, 7, 10, 9, 0, 0);
		const window = computeReminderWindow([habit], settings, 5, now);
		expect(window.map((r) => r.date)).toEqual(['2026-08-12', '2026-08-14']);
	});

	it('scénario 3 — ignore une habitude en pause ou supprimée (ne compte pas comme occurrence)', () => {
		const now = new Date(2026, 7, 10, 6, 0, 0);
		const paused: Habit = { ...habit, id: 'h2', status: 'paused' };
		const deleted: Habit = { ...habit, id: 'h3', status: 'deleted' };
		const window = computeReminderWindow([paused, deleted], settings, 3, now);
		expect(window).toEqual([]);
	});

	it('scénario 3 — un jour où seule une autre habitude a une occurrence déclenche quand même un rappel', () => {
		// 2026-08-11 est un mardi. "Yoga" (lundi/mercredi/vendredi) n'y est pas due, mais une
		// autre habitude ("Autre habitude", programmée le mardi) l'est : le rappel générique
		// part quand même ce jour-là, sans lien avec "Yoga".
		const yoga: Habit = {
			id: 'h2',
			name: 'Yoga',
			emoji: '🧘',
			createdAt: '2026-08-01',
			frequency: { kind: 'weekdays', weekdays: [1, 3, 5] }
		};
		const other: Habit = {
			id: 'h3',
			name: 'Autre habitude',
			emoji: '📌',
			createdAt: '2026-08-01',
			frequency: { kind: 'weekdays', weekdays: [2] }
		};
		const now = new Date(2026, 7, 11, 6, 0, 0); // mardi 11/08/2026
		const window = computeReminderWindow([yoga, other], settings, 1, now);
		expect(window.map((r) => r.date)).toEqual(['2026-08-11']);
	});

	it('scénario 8 — best-effort : aucun rappel si toutes les habitudes dues sont déjà cochées', () => {
		const now = new Date(2026, 7, 10, 6, 0, 0);
		const completions: HabitCompletion[] = [{ habitId: habit.id, date: '2026-08-10', done: true }];
		const window = computeReminderWindow([habit], settings, 1, now, completions);
		expect(window).toEqual([]);
	});

	it('scénario 8 — sans resynchronisation (pas de complétion transmise), le rappel générique reste programmé', () => {
		const now = new Date(2026, 7, 10, 6, 0, 0);
		// Pas de `completions` passé (comportement par défaut avant réouverture de l'app).
		const window = computeReminderWindow([habit], settings, 1, now);
		expect(window.map((r) => r.date)).toEqual(['2026-08-10']);
	});
});
