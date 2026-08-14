import { describe, it, expect } from 'vitest';
import {
	DEFAULT_THRESHOLDS,
	colorFor,
	areThresholdsValid,
	weekDates,
	monthDates,
	yearMonths,
	habitCellStatus,
	habitCellState,
	habitMonthPercent,
	taskDayPercent,
	taskDayState,
	taskMonthPercent,
	shiftReference
} from './summary';
import type { Habit, HabitCompletion, Task, TaskCompletion } from './types';

describe('colorFor', () => {
	it('applique les seuils par défaut (US-005 scénario 3ter)', () => {
		expect(colorFor(80)).toBe('green');
		expect(colorFor(79)).toBe('yellow');
		expect(colorFor(40)).toBe('yellow');
		expect(colorFor(39)).toBe('red');
	});

	it('applique des seuils personnalisés (US-006 scénario 2)', () => {
		const custom = { green: 90, yellow: 50 };
		expect(colorFor(90, custom)).toBe('green');
		expect(colorFor(89, custom)).toBe('yellow');
		expect(colorFor(50, custom)).toBe('yellow');
		expect(colorFor(49, custom)).toBe('red');
	});
});

describe('areThresholdsValid', () => {
	it('valide des seuils cohérents', () => {
		expect(areThresholdsValid(DEFAULT_THRESHOLDS)).toBe(true);
	});
	it('rejette jaune >= vert', () => {
		expect(areThresholdsValid({ green: 80, yellow: 85 })).toBe(false);
		expect(areThresholdsValid({ green: 80, yellow: 80 })).toBe(false);
	});
	it('rejette des valeurs hors 0-100', () => {
		expect(areThresholdsValid({ green: 110, yellow: 40 })).toBe(false);
		expect(areThresholdsValid({ green: 80, yellow: -5 })).toBe(false);
	});
});

describe('weekDates (US-005 scénario 1)', () => {
	it('retourne les 7 jours lundi -> dimanche de la semaine', () => {
		expect(weekDates('2026-08-12')).toEqual([
			'2026-08-10',
			'2026-08-11',
			'2026-08-12',
			'2026-08-13',
			'2026-08-14',
			'2026-08-15',
			'2026-08-16'
		]);
	});
});

describe('monthDates (US-005 scénario 2)', () => {
	it('retourne tous les jours du mois', () => {
		const dates = monthDates('2026-02-15');
		expect(dates).toHaveLength(28);
		expect(dates[0]).toBe('2026-02-01');
		expect(dates.at(-1)).toBe('2026-02-28');
	});
});

describe('yearMonths (US-005 scénario 3)', () => {
	it('retourne les 12 mois de l’année', () => {
		const months = yearMonths('2026-08-12');
		expect(months).toHaveLength(12);
		expect(months[0]).toEqual({ year: 2026, month: 1 });
		expect(months[11]).toEqual({ year: 2026, month: 12 });
	});
});

describe('habitCellStatus (US-005 scénarios 1/6)', () => {
	const habit: Habit = {
		id: 'h1',
		name: 'Test',
		emoji: '✅',
		frequency: { kind: 'weekdays', weekdays: [1, 3] }, // lundi, mercredi
		createdAt: '2026-01-01'
	};

	it("est 'not-due' un jour où l'habitude n'est pas prévue (mardi, scénario 6)", () => {
		expect(habitCellStatus(habit, '2026-08-11', [])).toBe('not-due'); // mardi
	});

	it("est 'not-done' un jour prévu non coché", () => {
		expect(habitCellStatus(habit, '2026-08-10', [])).toBe('not-done'); // lundi
	});

	it("est 'done' un jour prévu coché", () => {
		const completions: HabitCompletion[] = [{ habitId: 'h1', date: '2026-08-10', done: true }];
		expect(habitCellStatus(habit, '2026-08-10', completions)).toBe('done');
	});
});

describe('habitMonthPercent (US-005 scénarios 3/6bis)', () => {
	it('retourne null si aucune occurrence prévue ce mois (scénario 6bis)', () => {
		const habit: Habit = {
			id: 'h1',
			name: 'Test',
			emoji: '✅',
			// Ancrée après la fin du mois testé -> aucune occurrence en août.
			frequency: { kind: 'interval', days: 5, anchor: '2026-09-01' },
			createdAt: '2026-01-01'
		};
		expect(habitMonthPercent(habit, 2026, 8, [])).toBeNull();
	});

	it('calcule le pourcentage jours cochés / jours dus (scénario 3)', () => {
		const habit: Habit = {
			id: 'h1',
			name: 'Test',
			emoji: '✅',
			frequency: { kind: 'weekdays', weekdays: [1] }, // tous les lundis
			createdAt: '2026-01-01'
		};
		// Août 2026 compte 4 lundis : 3, 10, 17, 24, 31 -> en fait 5 lundis (03,10,17,24,31).
		const completions: HabitCompletion[] = [
			{ habitId: 'h1', date: '2026-08-03', done: true },
			{ habitId: 'h1', date: '2026-08-10', done: true }
		];
		const percent = habitMonthPercent(habit, 2026, 8, completions);
		expect(percent).toBe(40); // 2 cochés / 5 lundis
	});

	it('continue de compter l\'historique d\'une habitude en pause ou supprimée (US-015 scénario 3 / US-013 scénario 3 — non-régression)', () => {
		const paused: Habit = {
			id: 'h2',
			name: 'Test en pause',
			emoji: '✅',
			frequency: { kind: 'weekdays', weekdays: [1] },
			createdAt: '2026-01-01',
			status: 'paused'
		};
		const deleted: Habit = { ...paused, id: 'h3', name: 'Test supprimée', status: 'deleted' };
		const completions: HabitCompletion[] = [
			{ habitId: 'h2', date: '2026-08-03', done: true },
			{ habitId: 'h3', date: '2026-08-03', done: true }
		];
		// Le statut de gestion (US-013/US-015) n'affecte pas le calcul du résumé, qui reste
		// une fonction pure du couple (fréquence, complétions) — la route `/resume` continue de
		// fournir la liste complète des habitudes, indépendamment de leur statut.
		expect(habitMonthPercent(paused, 2026, 8, completions)).toBe(20); // 1 coché / 5 lundis
		expect(habitMonthPercent(deleted, 2026, 8, completions)).toBe(20);
	});
});

/**
 * US-033 — le résumé (US-005/US-006) doit traiter la fréquence « jours du mois » (US-032)
 * exactement comme les deux modes historiques, replis et déduplication compris. Aucune règle
 * produit n'est modifiée ici : ces tests prouvent la bonne prise en compte du nouveau mode.
 */
describe('Résumé et fréquence « jours du mois » (US-033)', () => {
	const monthly: Habit = {
		id: 'hm',
		name: 'Sauvegarde',
		emoji: '💾',
		frequency: { kind: 'monthdays', monthdays: [1, 15] },
		createdAt: '2026-01-01'
	};

	it('scénario 1 — seules les colonnes du 1 et du 15 sont « prévues », les autres sont neutres', () => {
		expect(habitCellStatus(monthly, '2026-08-01', [])).toBe('not-done');
		expect(habitCellStatus(monthly, '2026-08-15', [])).toBe('not-done');
		expect(habitCellStatus(monthly, '2026-08-02', [])).toBe('not-due');
		expect(habitCellStatus(monthly, '2026-08-14', [])).toBe('not-due');
		expect(habitCellStatus(monthly, '2026-08-31', [])).toBe('not-due');
	});

	it('scénario 1 — une occurrence cochée est bien « fait », distincte de « non fait »', () => {
		const completions: HabitCompletion[] = [{ habitId: 'hm', date: '2026-08-15', done: true }];
		expect(habitCellStatus(monthly, '2026-08-15', completions)).toBe('done');
		expect(habitCellStatus(monthly, '2026-08-01', completions)).toBe('not-done');
	});

	it('scénario 2 — vue année : 1 jour fait sur 2 prévus en mars = 50 %', () => {
		const completions: HabitCompletion[] = [{ habitId: 'hm', date: '2026-03-01', done: true }];
		expect(habitMonthPercent(monthly, 2026, 3, completions)).toBe(50);
	});

	it('scénario 2 — le code couleur des seuils configurés s’applique normalement', () => {
		expect(colorFor(50, { green: 80, yellow: 40 })).toBe('yellow');
		expect(colorFor(100, { green: 80, yellow: 40 })).toBe('green');
	});

	it('scénario 3 — 30 et 31 repliés sur le 28 février ne comptent qu’un seul jour prévu', () => {
		const twice: Habit = {
			...monthly,
			id: 'hm2',
			frequency: { kind: 'monthdays', monthdays: [30, 31] }
		};
		// Un seul jour prévu en février : le 28 (année non bissextile).
		expect(habitCellStatus(twice, '2026-02-28', [])).toBe('not-done');
		expect(habitCellStatus(twice, '2026-02-27', [])).toBe('not-due');

		const completions: HabitCompletion[] = [{ habitId: 'hm2', date: '2026-02-28', done: true }];
		// 100 % (1/1) et non 50 % (1/2) : la déduplication est bien répercutée en vue année.
		expect(habitMonthPercent(twice, 2026, 2, completions)).toBe(100);
		// En janvier (31 jours), les deux quantièmes existent : 2 jours prévus.
		expect(habitMonthPercent(twice, 2026, 1, [])).toBe(0);
		expect(habitCellStatus(twice, '2026-01-30', [])).toBe('not-done');
		expect(habitCellStatus(twice, '2026-01-31', [])).toBe('not-done');
	});

	it('scénario 2 — un mois est toujours pourvu d’au moins une occurrence (jamais null)', () => {
		const lastDayOfMonth: Habit = {
			...monthly,
			id: 'hm3',
			frequency: { kind: 'monthdays', monthdays: [31] }
		};
		for (let month = 1; month <= 12; month++) {
			expect(habitMonthPercent(lastDayOfMonth, 2026, month, [])).toBe(0);
		}
	});

	it('scénario 9 — non-régression : les fréquences historiques donnent les mêmes chiffres qu’avant', () => {
		const weekly: Habit = {
			id: 'hw',
			name: 'Yoga',
			emoji: '🧘',
			frequency: { kind: 'weekdays', weekdays: [1] },
			createdAt: '2026-01-01'
		};
		const interval: Habit = {
			id: 'hi',
			name: 'Marcher',
			emoji: '🚶',
			frequency: { kind: 'interval', days: 2, anchor: '2026-08-10' },
			createdAt: '2026-01-01'
		};
		expect(habitCellStatus(weekly, '2026-08-10', [])).toBe('not-done'); // lundi
		expect(habitCellStatus(weekly, '2026-08-11', [])).toBe('not-due');
		expect(habitCellStatus(interval, '2026-08-12', [])).toBe('not-done');
		expect(habitCellStatus(interval, '2026-08-11', [])).toBe('not-due');
		expect(habitMonthPercent(weekly, 2026, 8, [])).toBe(0); // 5 lundis, 0 coché
	});
});

/**
 * US-035 — trois états (fait / à faire / manqué) + cellule neutre. Chaque test correspond à un
 * scénario de l'US ; `today` est toujours injecté pour rester déterministe.
 */
describe('habitCellState (US-035)', () => {
	// Habitude quotidienne, créée le 1er août 2026.
	const daily: Habit = {
		id: 'h1',
		name: 'Marcher',
		emoji: '🚶',
		frequency: { kind: 'interval', days: 1, anchor: '2026-08-01' },
		createdAt: '2026-08-01'
	};
	const today = '2026-08-12';
	const done = (date: string): HabitCompletion[] => [{ habitId: 'h1', date, done: true }];

	it('scénario 1 — « fait » quel que soit le jour concerné (passé, aujourd’hui, à venir)', () => {
		expect(habitCellState(daily, '2026-08-05', done('2026-08-05'), today)).toBe('done');
		expect(habitCellState(daily, today, done(today), today)).toBe('done');
		expect(habitCellState(daily, '2026-08-20', done('2026-08-20'), today)).toBe('done');
	});

	it('scénario 2 — un jour à venir est « à faire », jamais « manqué »', () => {
		expect(habitCellState(daily, '2026-08-13', [], today)).toBe('todo');
		expect(habitCellState(daily, '2026-09-30', [], today)).toBe('todo');
	});

	it('scénario 3 — aujourd’hui reste « à faire » toute la journée (la journée n’est écoulée que demain)', () => {
		expect(habitCellState(daily, today, [], today)).toBe('todo');
	});

	it('scénario 4 — un jour passé non coché est « manqué »', () => {
		expect(habitCellState(daily, '2026-08-11', [], today)).toBe('missed');
	});

	it('scénario 5 — un jour non prévu par la fréquence est neutre', () => {
		const weekly: Habit = { ...daily, frequency: { kind: 'weekdays', weekdays: [1] } };
		expect(habitCellState(weekly, '2026-08-11', [], today)).toBe('not-due'); // mardi
	});

	it('scénario 6 — bascule ⬜ → ✅ au cochage, retour à ⬜ (et non ❌) au décochage', () => {
		expect(habitCellState(daily, today, [], today)).toBe('todo');
		expect(habitCellState(daily, today, done(today), today)).toBe('done');
		// Décochage = complétion retirée (ou passée à false) : la journée n'est pas écoulée.
		expect(habitCellState(daily, today, [{ habitId: 'h1', date: today, done: false }], today)).toBe(
			'todo'
		);
	});

	it('scénario 7 — jamais de « manqué » avant la date de création de l’habitude', () => {
		// Créée le jeudi 13 août, prévue les lundis et mercredis.
		const created: Habit = {
			...daily,
			frequency: { kind: 'weekdays', weekdays: [1, 3] },
			createdAt: '2026-08-13'
		};
		const now = '2026-08-13';
		expect(habitCellState(created, '2026-08-10', [], now)).toBe('not-due'); // lundi précédent
		expect(habitCellState(created, '2026-08-12', [], now)).toBe('not-due'); // mercredi précédent
		// Même règle en vue mois, sur un jour prévu bien antérieur.
		expect(habitCellState(created, '2026-08-03', [], now)).toBe('not-due');
		// À partir de la création, la règle normale reprend.
		expect(habitCellState(created, '2026-08-17', [], '2026-08-18')).toBe('missed'); // lundi
	});

	it('scénario 8 — jamais de « manqué » pour une habitude en pause ou supprimée', () => {
		const paused: Habit = { ...daily, status: 'paused' };
		const deleted: Habit = { ...daily, status: 'deleted' };
		expect(habitCellState(paused, '2026-08-11', [], today)).toBe('not-due');
		expect(habitCellState(deleted, '2026-08-11', [], today)).toBe('not-due');
		// Historique préservé : les complétions réelles restent « fait » (US-019 scénario 4).
		expect(habitCellState(paused, '2026-08-11', done('2026-08-11'), today)).toBe('done');
		expect(habitCellState(deleted, '2026-08-11', done('2026-08-11'), today)).toBe('done');
	});

	it('scénario 9 — une habitude à cible chiffrée utilise le même statut binaire dérivé', () => {
		const withTarget: Habit = { ...daily, target: { value: 1.5, unit: 'L' } };
		expect(habitCellState(withTarget, '2026-08-11', done('2026-08-11'), today)).toBe('done');
		expect(habitCellState(withTarget, '2026-08-11', [], today)).toBe('missed');
	});

	it('scénario 17 — semaine entièrement passée : ✅ / ❌ ; semaine entièrement future : ⬜ seulement', () => {
		const pastWeek = ['2026-08-03', '2026-08-04', '2026-08-05'];
		const pastStates = pastWeek.map((d) => habitCellState(daily, d, done('2026-08-04'), today));
		expect(pastStates).toEqual(['missed', 'done', 'missed']);

		const futureWeek = ['2026-08-17', '2026-08-18', '2026-08-19'];
		const futureStates = futureWeek.map((d) => habitCellState(daily, d, [], today));
		expect(futureStates).toEqual(['todo', 'todo', 'todo']);
		expect(futureStates).not.toContain('missed');
	});

	it('US-033 — s’applique à l’identique à une fréquence « jours du mois », replis compris', () => {
		const monthly: Habit = {
			...daily,
			frequency: { kind: 'monthdays', monthdays: [1, 31] },
			createdAt: '2026-01-01'
		};
		expect(habitCellState(monthly, '2026-08-01', [], today)).toBe('missed');
		expect(habitCellState(monthly, '2026-08-02', [], today)).toBe('not-due');
		// Repli du 31 sur le dernier jour de février.
		expect(habitCellState(monthly, '2026-02-28', [], today)).toBe('missed');
		expect(habitCellState(monthly, '2026-02-27', [], today)).toBe('not-due');
	});
});

describe('taskDayState (US-035 scénario 12)', () => {
	const today = '2026-08-12';

	it('aucune tâche ce jour-là → neutre', () => {
		expect(taskDayState(null, '2026-08-10', today)).toBe('not-due');
		expect(taskDayState(null, today, today)).toBe('not-due');
	});

	it('100 % → traité comme « fait », quel que soit le jour', () => {
		expect(taskDayState(100, '2026-08-10', today)).toBe('done');
		expect(taskDayState(100, today, today)).toBe('done');
		expect(taskDayState(100, '2026-08-20', today)).toBe('done');
	});

	it('jour non écoulé et < 100 % → traité comme « à faire »', () => {
		expect(taskDayState(0, today, today)).toBe('todo');
		expect(taskDayState(50, today, today)).toBe('todo');
		expect(taskDayState(50, '2026-08-20', today)).toBe('todo');
	});

	it('jour passé et < 100 % → traité comme « manqué »', () => {
		expect(taskDayState(0, '2026-08-11', today)).toBe('missed');
		expect(taskDayState(99, '2026-08-11', today)).toBe('missed');
	});
});

describe('taskDayPercent (US-005 scénarios 4/5)', () => {
	const tasks: Task[] = [
		{ id: 't1', name: 'A', date: '2026-08-12', createdAt: '2026-08-01' },
		{ id: 't2', name: 'B', date: '2026-08-12', createdAt: '2026-08-01' },
		{ id: 't3', name: 'C', date: '2026-08-12', createdAt: '2026-08-01' }
	];

	it('retourne null si aucune tâche ce jour (scénario 5)', () => {
		expect(taskDayPercent(tasks, [], '2026-08-13')).toBeNull();
	});

	it('calcule le pourcentage de tâches validées (scénario 4 — 2/3 = 67%)', () => {
		const completions: TaskCompletion[] = [
			{ taskId: 't1', done: true },
			{ taskId: 't2', done: true },
			{ taskId: 't3', done: false }
		];
		expect(taskDayPercent(tasks, completions, '2026-08-12')).toBe(67);
	});
});

describe('taskMonthPercent (US-005 scénarios 4bis/5)', () => {
	const tasks: Task[] = [
		{ id: 't1', name: 'A', date: '2026-08-05', createdAt: '2026-08-01' },
		{ id: 't2', name: 'B', date: '2026-08-20', createdAt: '2026-08-01' }
	];

	it('retourne null si aucune tâche ce mois', () => {
		expect(taskMonthPercent(tasks, [], 2026, 9)).toBeNull();
	});

	it('agrège le pourcentage sur le mois', () => {
		const completions: TaskCompletion[] = [{ taskId: 't1', done: true }];
		expect(taskMonthPercent(tasks, completions, 2026, 8)).toBe(50);
	});
});

describe('habitCellStatus / habitMonthPercent — habitude à cible chiffrée (US-019)', () => {
	// US-019 : le statut fait/pas fait d'une habitude à cible chiffrée est dérivé (par
	// CompletionsStore, voir US-018) dans le même `HabitCompletion.done` qu'une habitude « case
	// à cocher ». Ces fonctions du domaine n'ont donc besoin d'aucune connaissance de `target`/
	// `HabitProgress` : elles continuent de fonctionner à l'identique, ce que ces tests vérifient
	// explicitement pour ne pas casser silencieusement cette hypothèse d'implémentation.
	const targetHabit: Habit = {
		id: 'h1',
		name: "Boire de l'eau",
		emoji: '💧',
		frequency: { kind: 'interval', days: 1, anchor: '2026-08-01' },
		createdAt: '2026-08-01',
		target: { value: 1.5, unit: 'L' }
	};

	it('scénario 1 — cellule binaire fait/non fait identique à une habitude case à cocher', () => {
		const completions: HabitCompletion[] = [
			{ habitId: 'h1', date: '2026-08-12', done: true } // cumul >= cible ce jour-là
		];
		expect(habitCellStatus(targetHabit, '2026-08-12', completions)).toBe('done');
		expect(habitCellStatus(targetHabit, '2026-08-13', completions)).toBe('not-done');
	});

	it('scénario 2 — pourcentage mensuel identique à une habitude case à cocher', () => {
		const completions: HabitCompletion[] = [
			{ habitId: 'h1', date: '2026-08-03', done: true },
			{ habitId: 'h1', date: '2026-08-10', done: true }
		];
		// Habitude due tous les jours d'août (31 jours) : 2 jours "faits" (cible atteinte) / 31.
		expect(habitMonthPercent(targetHabit, 2026, 8, completions)).toBe(6);
	});

	it('scénario 4 — historique conservé pour une habitude à cible chiffrée en pause/supprimée', () => {
		const paused: Habit = { ...targetHabit, id: 'h2', status: 'paused' };
		const deleted: Habit = { ...targetHabit, id: 'h3', status: 'deleted' };
		const completions: HabitCompletion[] = [
			{ habitId: 'h2', date: '2026-08-03', done: true },
			{ habitId: 'h3', date: '2026-08-03', done: true }
		];
		expect(habitCellStatus(paused, '2026-08-03', completions)).toBe('done');
		expect(habitCellStatus(deleted, '2026-08-03', completions)).toBe('done');
	});
});

describe('shiftReference (US-005 scénario 7)', () => {
	it('avance/recule d’une semaine', () => {
		expect(shiftReference('week', '2026-08-12', 1)).toBe('2026-08-19');
		expect(shiftReference('week', '2026-08-12', -1)).toBe('2026-08-05');
	});
	it('avance/recule d’un mois (calé sur le 1er)', () => {
		expect(shiftReference('month', '2026-08-12', 1)).toBe('2026-09-01');
		expect(shiftReference('month', '2026-08-12', -1)).toBe('2026-07-01');
	});
	it('avance/recule d’une année', () => {
		expect(shiftReference('year', '2026-08-12', 1)).toBe('2027-08-12');
		expect(shiftReference('year', '2026-08-12', -1)).toBe('2025-08-12');
	});
});

/**
 * US-036 scénario 12 / US-037 scénario 12 / US-039 scénario 16 — le résumé ignore totalement la
 * couleur de carte et le marquage d'urgence : ni teinte, ni pondération, ni changement de
 * pourcentage. Vérifié en comparant des données strictement identiques à ces deux champs près.
 */
describe('Résumé — insensible à la couleur de carte et à l’urgence (US-036/037/039)', () => {
	const plain: Task[] = [
		{ id: 't1', name: 'A', date: '2026-08-12', createdAt: '2026-08-01' },
		{ id: 't2', name: 'B', date: '2026-08-12', createdAt: '2026-08-01' }
	];
	const decorated: Task[] = [
		{ ...plain[0], color: 'menthe', urgent: true },
		{ ...plain[1], color: 'ciel' }
	];
	const completions: TaskCompletion[] = [{ taskId: 't1', done: true }];

	it('le pourcentage de tâches du jour est strictement inchangé', () => {
		expect(taskDayPercent(decorated, completions, '2026-08-12')).toBe(
			taskDayPercent(plain, completions, '2026-08-12')
		);
		expect(taskDayPercent(decorated, completions, '2026-08-12')).toBe(50);
	});

	it('le pourcentage de tâches du mois est strictement inchangé', () => {
		expect(taskMonthPercent(decorated, completions, 2026, 8)).toBe(
			taskMonthPercent(plain, completions, 2026, 8)
		);
	});

	it('l’état à trois valeurs de la cellule « Tâches » est strictement inchangé', () => {
		const decoratedPercent = taskDayPercent(decorated, completions, '2026-08-12');
		const plainPercent = taskDayPercent(plain, completions, '2026-08-12');

		expect(taskDayState(decoratedPercent, '2026-08-12', '2026-08-13')).toEqual(
			taskDayState(plainPercent, '2026-08-12', '2026-08-13')
		);
	});

	it('une habitude colorée produit exactement le même état de cellule', () => {
		const habit: Habit = {
			id: 'h1',
			name: 'Yoga',
			emoji: '🧘',
			frequency: { kind: 'interval', days: 1, anchor: '2026-08-01' },
			createdAt: '2026-08-01'
		};
		const done: HabitCompletion[] = [{ habitId: 'h1', date: '2026-08-12', done: true }];

		expect(habitCellState({ ...habit, color: 'menthe' }, '2026-08-12', done, '2026-08-13')).toEqual(
			habitCellState(habit, '2026-08-12', done, '2026-08-13')
		);
	});
});
