import { describe, it, expect } from 'vitest';
import { computeReminderWindow } from './reminders';
import type { Habit, ReminderSettings } from './types';

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
});
