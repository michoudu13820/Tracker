import type { IsoDate, Weekday } from './types';

/** Convertit une Date locale en clé `YYYY-MM-DD` (jour calendaire local). */
export function toIsoDate(d: Date): IsoDate {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${y}-${m}-${day}`;
}

/** Parse une clé `YYYY-MM-DD` en Date locale à minuit. */
export function fromIsoDate(iso: IsoDate): Date {
	const [y, m, d] = iso.split('-').map(Number);
	return new Date(y, m - 1, d);
}

/** Nombre de jours calendaires entre deux dates ISO (b - a), en ignorant l'heure. */
export function daysBetween(a: IsoDate, b: IsoDate): number {
	const MS = 24 * 60 * 60 * 1000;
	const da = fromIsoDate(a).getTime();
	const db = fromIsoDate(b).getTime();
	return Math.round((db - da) / MS);
}

/** Ajoute n jours à une date ISO. */
export function addDays(iso: IsoDate, n: number): IsoDate {
	const d = fromIsoDate(iso);
	d.setDate(d.getDate() + n);
	return toIsoDate(d);
}

/** Formate une date ISO `YYYY-MM-DD` en `DD/MM/YYYY` pour l'affichage (fr). */
export function formatIsoDateFr(iso: IsoDate): string {
	const [y, m, d] = iso.split('-');
	return `${d}/${m}/${y}`;
}

/** Jour de la semaine (0 = dimanche … 6 = samedi) d'une date ISO. */
export function weekdayOf(iso: IsoDate): Weekday {
	return fromIsoDate(iso).getDay() as Weekday;
}

/**
 * Premier jour (lundi) de la semaine calendaire contenant `iso` — convention française/
 * européenne (US-005 : le résumé "semaine" liste les jours en colonnes, lundi → dimanche).
 */
export function startOfWeek(iso: IsoDate): IsoDate {
	const weekday = weekdayOf(iso); // 0 (dimanche) … 6 (samedi)
	const offsetFromMonday = weekday === 0 ? 6 : weekday - 1;
	return addDays(iso, -offsetFromMonday);
}

/** Premier jour du mois calendaire contenant `iso`. */
export function startOfMonth(iso: IsoDate): IsoDate {
	const [y, m] = iso.split('-');
	return `${y}-${m}-01`;
}

/** Nombre de jours dans un mois donné (`month` 1-12). */
export function daysInMonth(year: number, month: number): number {
	return new Date(year, month, 0).getDate();
}

/** Ajoute n mois à une date ISO (calé sur le 1er du mois pour éviter les débordements de fin de mois). */
export function addMonths(iso: IsoDate, n: number): IsoDate {
	const [y, m, d] = iso.split('-').map(Number);
	const date = new Date(y, m - 1 + n, 1);
	return toIsoDate(new Date(date.getFullYear(), date.getMonth(), d));
}

/** Ajoute n années à une date ISO. */
export function addYears(iso: IsoDate, n: number): IsoDate {
	const [y, m, d] = iso.split('-').map(Number);
	return toIsoDate(new Date(y + n, m - 1, d));
}

const MONTH_LABELS_FR = [
	'janvier',
	'février',
	'mars',
	'avril',
	'mai',
	'juin',
	'juillet',
	'août',
	'septembre',
	'octobre',
	'novembre',
	'décembre'
];

/** Libellé français d'un mois (1-12), pour l'affichage (ex. résumé annuel, US-005). */
export function monthLabelFr(month: number): string {
	return MONTH_LABELS_FR[month - 1];
}

const WEEKDAY_LABELS_FR: Record<Weekday, string> = {
	0: 'dimanche',
	1: 'lundi',
	2: 'mardi',
	3: 'mercredi',
	4: 'jeudi',
	5: 'vendredi',
	6: 'samedi'
};

/** Libellé court (3 lettres, capitalisé) du jour de semaine d'une date ISO — ex. "Mer" pour
 * mercredi (US-011 : frise de dates). */
const WEEKDAY_SHORT_LABELS_FR: Record<Weekday, string> = {
	0: 'Dim',
	1: 'Lun',
	2: 'Mar',
	3: 'Mer',
	4: 'Jeu',
	5: 'Ven',
	6: 'Sam'
};

/** Libellé court (3 lettres) du jour de la semaine d'une date ISO, ex. "Mer" pour mercredi
 * (US-011, frise de dates : affiché au-dessus du rond du jour). */
export function weekdayShortLabelFr(iso: IsoDate): string {
	return WEEKDAY_SHORT_LABELS_FR[weekdayOf(iso)];
}

/**
 * Génère une plage de dates ISO consécutives (ordre chronologique croissant), centrée sur
 * `center` et couvrant `weeksBefore` semaines avant et `weeksAfter` semaines après (US-011 :
 * frise de dates scrollable sur plusieurs semaines passées/futures).
 */
export function dateStripRange(center: IsoDate, weeksBefore: number, weeksAfter: number): IsoDate[] {
	const totalDays = (weeksBefore + weeksAfter) * 7 + 1;
	const start = addDays(center, -weeksBefore * 7);
	return Array.from({ length: totalDays }, (_, i) => addDays(start, i));
}

/**
 * Libellé long en français « jour_semaine JJ mois » (ex. "mercredi 12 août"), tout en
 * minuscules — utilisé pour le titre dynamique du planning (US-012).
 */
export function formatIsoDateLongFr(iso: IsoDate): string {
	const [, m, d] = iso.split('-');
	const day = Number(d);
	const month = Number(m);
	return `${WEEKDAY_LABELS_FR[weekdayOf(iso)]} ${day} ${monthLabelFr(month)}`;
}

/**
 * Titre du planning (US-012) : « Planning d'aujourd'hui » si `selectedDate` est le jour
 * courant (`today`), sinon « Planning du <jour de la semaine> <jour du mois> <mois> » en
 * français (ex. "Planning du mercredi 12 août").
 */
export function formatPlanningTitleFr(selectedDate: IsoDate, today: IsoDate): string {
	if (selectedDate === today) return "Planning d'aujourd'hui";
	return `Planning du ${formatIsoDateLongFr(selectedDate)}`;
}
