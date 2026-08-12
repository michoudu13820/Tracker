import { describe, it, expect } from 'vitest';
import {
	toIsoDate,
	fromIsoDate,
	daysBetween,
	addDays,
	formatIsoDateFr,
	weekdayOf,
	startOfWeek,
	startOfMonth,
	daysInMonth,
	addMonths,
	addYears,
	monthLabelFr,
	weekdayShortLabelFr,
	dateStripRange,
	formatIsoDateLongFr,
	formatPlanningTitleFr
} from './dates';

describe('toIsoDate / fromIsoDate', () => {
	it('convertit une Date locale en YYYY-MM-DD et inversement', () => {
		const d = new Date(2026, 7, 12); // 12 août 2026 (mois 0-indexé)
		expect(toIsoDate(d)).toBe('2026-08-12');
		expect(fromIsoDate('2026-08-12').getFullYear()).toBe(2026);
		expect(fromIsoDate('2026-08-12').getMonth()).toBe(7);
		expect(fromIsoDate('2026-08-12').getDate()).toBe(12);
	});
});

describe('daysBetween', () => {
	it('calcule le nombre de jours entre deux dates ISO', () => {
		expect(daysBetween('2026-08-10', '2026-08-12')).toBe(2);
		expect(daysBetween('2026-08-12', '2026-08-10')).toBe(-2);
		expect(daysBetween('2026-08-12', '2026-08-12')).toBe(0);
	});
});

describe('addDays', () => {
	it('ajoute des jours à une date ISO', () => {
		expect(addDays('2026-08-30', 3)).toBe('2026-09-02');
		expect(addDays('2026-08-12', -1)).toBe('2026-08-11');
	});
});

describe('formatIsoDateFr', () => {
	it('formate une date ISO en DD/MM/YYYY', () => {
		expect(formatIsoDateFr('2026-08-15')).toBe('15/08/2026');
	});
});

describe('weekdayOf', () => {
	it('retourne le jour de la semaine (0=dimanche)', () => {
		expect(weekdayOf('2026-08-12')).toBe(3); // mercredi
		expect(weekdayOf('2026-08-09')).toBe(0); // dimanche
	});
});

describe('startOfWeek (lundi)', () => {
	it('retourne le lundi de la semaine pour un jour en milieu de semaine', () => {
		expect(startOfWeek('2026-08-12')).toBe('2026-08-10'); // mercredi -> lundi
	});
	it('retourne le même jour si déjà lundi', () => {
		expect(startOfWeek('2026-08-10')).toBe('2026-08-10');
	});
	it('recule de 6 jours si dimanche', () => {
		expect(startOfWeek('2026-08-09')).toBe('2026-08-03');
	});
});

describe('startOfMonth', () => {
	it('retourne le 1er du mois', () => {
		expect(startOfMonth('2026-08-12')).toBe('2026-08-01');
	});
});

describe('daysInMonth', () => {
	it('retourne le nombre de jours du mois', () => {
		expect(daysInMonth(2026, 8)).toBe(31);
		expect(daysInMonth(2026, 2)).toBe(28);
		expect(daysInMonth(2024, 2)).toBe(29); // bissextile
	});
});

describe('addMonths', () => {
	it('ajoute des mois à une date calée sur le 1er', () => {
		expect(addMonths('2026-08-01', 1)).toBe('2026-09-01');
		expect(addMonths('2026-01-01', -1)).toBe('2025-12-01');
	});
});

describe('addYears', () => {
	it('ajoute des années', () => {
		expect(addYears('2026-08-12', 1)).toBe('2027-08-12');
		expect(addYears('2026-08-12', -1)).toBe('2025-08-12');
	});
});

describe('monthLabelFr', () => {
	it('retourne le libellé français du mois', () => {
		expect(monthLabelFr(1)).toBe('janvier');
		expect(monthLabelFr(8)).toBe('août');
		expect(monthLabelFr(12)).toBe('décembre');
	});
});

describe('weekdayShortLabelFr (US-011)', () => {
	it('retourne les 3 premières lettres capitalisées du jour de semaine', () => {
		expect(weekdayShortLabelFr('2026-08-12')).toBe('Mer'); // mercredi
		expect(weekdayShortLabelFr('2026-08-09')).toBe('Dim'); // dimanche
		expect(weekdayShortLabelFr('2026-08-10')).toBe('Lun'); // lundi
		expect(weekdayShortLabelFr('2026-08-15')).toBe('Sam'); // samedi
	});
});

describe('dateStripRange (US-011)', () => {
	it('génère une plage continue centrée sur la date, en ordre chronologique croissant', () => {
		const range = dateStripRange('2026-08-12', 1, 1);
		expect(range).toHaveLength(15); // 7 jours avant + le jour + 7 jours après
		expect(range[0]).toBe('2026-08-05');
		expect(range.at(-1)).toBe('2026-08-19');
		expect(range).toContain('2026-08-12');
		// Ordre chronologique strictement croissant, sans trou.
		for (let i = 1; i < range.length; i++) {
			expect(daysBetween(range[i - 1], range[i])).toBe(1);
		}
	});

	it('gère des plages asymétriques (plus de semaines futures que passées)', () => {
		const range = dateStripRange('2026-08-12', 0, 2);
		expect(range[0]).toBe('2026-08-12');
		expect(range.at(-1)).toBe('2026-08-26');
		expect(range).toHaveLength(15);
	});
});

describe('formatIsoDateLongFr (US-012)', () => {
	it('formate "jour_semaine JJ mois" en minuscules', () => {
		expect(formatIsoDateLongFr('2026-08-12')).toBe('mercredi 12 août');
		expect(formatIsoDateLongFr('2026-01-01')).toBe('jeudi 1 janvier');
	});
});

describe('formatPlanningTitleFr (US-012)', () => {
	it("affiche « Planning d'aujourd'hui » quand le jour sélectionné est le jour courant", () => {
		expect(formatPlanningTitleFr('2026-08-12', '2026-08-12')).toBe("Planning d'aujourd'hui");
	});

	it('affiche « Planning du <date en toutes lettres> » pour un jour différent du jour courant', () => {
		expect(formatPlanningTitleFr('2026-08-13', '2026-08-12')).toBe('Planning du jeudi 13 août');
		expect(formatPlanningTitleFr('2026-08-05', '2026-08-12')).toBe('Planning du mercredi 5 août');
	});

	it('repasse à « Planning d\'aujourd\'hui » en revenant sur le jour courant', () => {
		const today = '2026-08-12';
		expect(formatPlanningTitleFr('2026-08-20', today)).not.toBe("Planning d'aujourd'hui");
		expect(formatPlanningTitleFr(today, today)).toBe("Planning d'aujourd'hui");
	});
});
