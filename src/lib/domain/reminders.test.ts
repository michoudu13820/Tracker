import { describe, it, expect } from 'vitest';
import { computeReminderWindow, computeTaskReminderWindow, computeWeeklyReviewWindow } from './reminders';
import type {
	Habit,
	HabitCompletion,
	ReminderSettings,
	Task,
	TaskCompletion,
	WeeklyReviewSettings
} from './types';

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

/**
 * US-033 scénario 6 — le récap matinal (US-007) doit compter une habitude « jours du mois »
 * (US-032) comme due les seuls jours où elle l'est réellement, replis compris. Aucune règle
 * d'US-007 n'est modifiée : la limite best-effort (ADR-001) reste inchangée.
 */
describe('computeReminderWindow et fréquence « jours du mois » (US-033)', () => {
	const monthly: Habit = {
		id: 'hm',
		name: 'Sauvegarde',
		emoji: '💾',
		createdAt: '2026-08-01',
		frequency: { kind: 'monthdays', monthdays: [1] }
	};

	it('scénario 6 — programme un rappel le 1 du mois, et aucun les autres jours', () => {
		const now = new Date(2026, 7, 25, 6, 0, 0); // 25 août 2026, 06:00
		const window = computeReminderWindow([monthly], settings, 15, now);
		expect(window.map((r) => r.date)).toEqual(['2026-09-01']);
	});

	it('scénario 6 — aucune occurrence sur une fenêtre qui ne contient aucun jour dû', () => {
		const now = new Date(2026, 7, 5, 6, 0, 0); // du 5 au 9 août : pas de 1er
		expect(computeReminderWindow([monthly], settings, 5, now)).toEqual([]);
	});

	it('scénario 6 — le repli fin de mois déclenche bien un rappel le dernier jour du mois', () => {
		const lastDay: Habit = {
			...monthly,
			id: 'hm2',
			frequency: { kind: 'monthdays', monthdays: [31] }
		};
		const now = new Date(2026, 3, 25, 6, 0, 0); // 25 avril 2026 (avril = 30 jours)
		const window = computeReminderWindow([lastDay], settings, 6, now);
		expect(window.map((r) => r.date)).toEqual(['2026-04-30']);
	});

	it('scénario 6 — best-effort inchangé : une occurrence mensuelle déjà cochée n’est plus rappelée', () => {
		const now = new Date(2026, 8, 1, 6, 0, 0); // 1er septembre 2026, 06:00
		const completions: HabitCompletion[] = [{ habitId: 'hm', date: '2026-09-01', done: true }];
		expect(computeReminderWindow([monthly], settings, 1, now, completions)).toEqual([]);
	});

	it('scénario 6 — une habitude mensuelle en pause ne déclenche aucun rappel', () => {
		const now = new Date(2026, 7, 25, 6, 0, 0);
		const paused: Habit = { ...monthly, id: 'hm3', status: 'paused' };
		expect(computeReminderWindow([paused], settings, 15, now)).toEqual([]);
	});
});

describe('computeTaskReminderWindow (US-022)', () => {
	const now = new Date(2026, 7, 10, 6, 0, 0); // 2026-08-10 06:00

	const edf: Task = {
		id: 't1',
		name: 'Payer facture EDF',
		date: '2026-08-10',
		createdAt: '2026-08-01',
		dueTime: '18:00'
	};
	const plumber: Task = {
		id: 't2',
		name: 'Appeler le plombier',
		date: '2026-08-10',
		createdAt: '2026-08-01',
		dueTime: '18:00'
	};

	it('scénario 1 — nomme explicitement une tâche unique', () => {
		const window = computeTaskReminderWindow([edf], settings, 30, now);
		expect(window).toHaveLength(1);
		expect(window[0].body).toBe('Payer facture EDF — à faire avant 18:00');
		expect(window[0].sendAt).toBe(new Date(2026, 7, 10, 18, 0, 0).getTime());
	});

	it('scénario 2 — groupe en un seul rappel les tâches du même créneau de 15 minutes', () => {
		const window = computeTaskReminderWindow([edf, plumber], settings, 30, now);
		expect(window).toHaveLength(1);
		expect(window[0].body).toBe(
			'2 tâches arrivent à échéance : Payer facture EDF, Appeler le plombier'
		);
	});

	it("ne fusionne pas deux créneaux différents de la même journée", () => {
		const later: Task = { ...plumber, id: 't3', dueTime: '18:15' };
		const window = computeTaskReminderWindow([edf, later], settings, 30, now);
		expect(window).toHaveLength(2);
	});

	it("scénario 3 — aucun rappel pour une tâche sans heure limite", () => {
		const noTime: Task = { ...edf, dueTime: undefined };
		const window = computeTaskReminderWindow([noTime], settings, 30, now);
		expect(window).toEqual([]);
	});

	/**
	 * US-037 scénario 13 : la couleur de carte ne doit modifier ni le contenu du push, ni les
	 * données transmises au micro-scheduler (frontière ADR-001, dont la dérogation reste
	 * strictement limitée au libellé de la tâche).
	 */
	it('scénario 13 (US-037) — la couleur ne change rien au push ni aux données transmises', () => {
		const reference = computeTaskReminderWindow([edf], settings, 30, now);

		const window = computeTaskReminderWindow([{ ...edf, color: 'menthe' }], settings, 30, now);

		expect(window).toEqual(reference);
		expect(Object.keys(window[0]).sort()).toEqual(['body', 'sendAt', 'title']);
		expect(JSON.stringify(window)).not.toMatch(/menthe/i);
	});

	/**
	 * US-039 scénario 12 : l'urgence est un outil de priorisation d'affichage, jamais un mécanisme
	 * d'insistance. Contenu du push identique, même instant d'envoi, aucune donnée supplémentaire
	 * transmise au micro-scheduler (frontière ADR-001 non élargie), et aucun rappel inventé pour
	 * une tâche urgente sans heure limite.
	 */
	it('scénario 12 (US-039) — une tâche urgente déclenche exactement le même rappel', () => {
		const reference = computeTaskReminderWindow([edf], settings, 30, now);

		const window = computeTaskReminderWindow([{ ...edf, urgent: true }], settings, 30, now);

		expect(window).toEqual(reference);
		expect(Object.keys(window[0]).sort()).toEqual(['body', 'sendAt', 'title']);
		expect(JSON.stringify(window)).not.toMatch(/urgent|‼/i);
	});

	it("scénario 12 (US-039) — une tâche urgente SANS heure limite ne déclenche aucun rappel", () => {
		const urgentSansHeure: Task = { ...edf, dueTime: undefined, urgent: true };
		expect(computeTaskReminderWindow([urgentSansHeure], settings, 30, now)).toEqual([]);
	});

	it('scénario 4 — best-effort : aucun rappel pour une tâche déjà faite (resynchronisée)', () => {
		const completions: TaskCompletion[] = [{ taskId: edf.id, done: true }];
		const window = computeTaskReminderWindow([edf], settings, 30, now, completions);
		expect(window).toEqual([]);
	});

	it('scénario 4 — sans resynchronisation (pas de complétion transmise), le rappel reste programmé malgré la complétion réelle', () => {
		// Pas de `completions` passé : comportement par défaut avant réouverture de l'app.
		const window = computeTaskReminderWindow([edf], settings, 30, now);
		expect(window).toHaveLength(1);
	});

	it('scénario 6 — aucun rappel si les rappels sont désactivés globalement', () => {
		const window = computeTaskReminderWindow([edf], { ...settings, enabled: false }, 30, now);
		expect(window).toEqual([]);
	});

	it('exclut une tâche supprimée (US-014, soft-delete)', () => {
		const deleted: Task = { ...edf, status: 'deleted' };
		const window = computeTaskReminderWindow([deleted], settings, 30, now);
		expect(window).toEqual([]);
	});

	it("exclut un instant déjà passé", () => {
		const past: Task = { ...edf, dueTime: '05:00' };
		const window = computeTaskReminderWindow([past], settings, 30, now);
		expect(window).toEqual([]);
	});

	it("exclut une tâche datée au-delà de l'horizon de la fenêtre", () => {
		const farAway: Task = { ...edf, date: '2026-12-25' };
		const window = computeTaskReminderWindow([farAway], settings, 5, now);
		expect(window).toEqual([]);
	});
});

describe('computeWeeklyReviewWindow (US-028)', () => {
	const weeklySettings: WeeklyReviewSettings = { enabled: true, weekday: 0, time: '18:00' }; // dimanche 18h

	it('scénario 1 — programme un rappel chaque semaine au jour/heure choisis', () => {
		const now = new Date(2026, 7, 10, 6, 0, 0); // lundi 10/08/2026
		const window = computeWeeklyReviewWindow(weeklySettings, 30, now);
		expect(window.map((r) => r.date)).toEqual([
			'2026-08-16',
			'2026-08-23',
			'2026-08-30',
			'2026-09-06'
		]);
		expect(window[0].sendAt).toBe(new Date(2026, 7, 16, 18, 0, 0).getTime());
	});

	it('scénario 3 — ne programme rien si désactivée', () => {
		const now = new Date(2026, 7, 10, 6, 0, 0);
		expect(computeWeeklyReviewWindow({ ...weeklySettings, enabled: false }, 30, now)).toEqual([]);
	});

	it("exclut l'instant déjà passé le jour même", () => {
		const mondaySettings: WeeklyReviewSettings = { enabled: true, weekday: 1, time: '08:00' };
		const now = new Date(2026, 7, 10, 9, 0, 0); // lundi 09:00, après 08:00
		const window = computeWeeklyReviewWindow(mondaySettings, 8, now);
		expect(window.map((r) => r.date)).toEqual(['2026-08-17']);
	});
});
