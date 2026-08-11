import type { IsoDate } from './types';

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
