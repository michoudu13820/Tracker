import type { Habit, IsoDate, ReminderSettings } from './types';
import { addDays, toIsoDate } from './dates';
import { isDueOn } from './occurrences';

/**
 * Un « rappel programmé » : la seule donnée qui transite vers le micro-serveur.
 * Volontairement PAUVRE — aucune donnée métier (pas de nom d'habitude, pas
 * d'historique). Le serveur ne voit que « à cet instant UTC, déclenche un push ».
 * Voir docs/architecture/ADR-001.
 */
export interface ScheduledReminder {
	/** Jour local concerné (sert de clé d'idempotence côté serveur). */
	date: IsoDate;
	/** Instant d'envoi en epoch millisecondes UTC. */
	sendAt: number;
}

/**
 * Calcule la fenêtre glissante des rappels à venir à partir des habitudes locales.
 *
 * Le client est le cerveau : il décide QUELS jours ont au moins une occurrence et
 * À QUELLE HEURE envoyer, puis pousse cette liste au serveur. Le serveur est un
 * simple relai temporel. On borne l'horizon (fenêtre glissante) et on re-planifie
 * à chaque ouverture de l'app / changement de données — l'app statique ne pouvant
 * pas se réveiller seule en tâche de fond.
 *
 * @param habits      habitudes locales
 * @param settings    réglages de rappel (heure, fuseau, activation)
 * @param horizonDays profondeur de la fenêtre (défaut 30 jours)
 * @param now         instant courant (injecté pour testabilité)
 */
export function computeReminderWindow(
	habits: Habit[],
	settings: ReminderSettings,
	horizonDays = 30,
	now: Date = new Date()
): ScheduledReminder[] {
	if (!settings.enabled) return [];

	const [hh, mm] = settings.time.split(':').map(Number);
	const today = toIsoDate(now);
	const reminders: ScheduledReminder[] = [];

	for (let offset = 0; offset < horizonDays; offset++) {
		const date = addDays(today, offset);
		const anyDue = habits.some((h) => isDueOn(h, date));
		if (!anyDue) continue;

		const sendAt = sendAtFor(date, hh, mm);
		// N'inclut pas les instants déjà passés (ex. rappel du matin si on est l'après-midi).
		if (sendAt <= now.getTime()) continue;

		reminders.push({ date, sendAt });
	}

	return reminders;
}

/** Instant d'envoi (epoch ms) pour un jour local + heure HH:MM, dans le fuseau local du runtime. */
function sendAtFor(date: IsoDate, hh: number, mm: number): number {
	const [y, m, d] = date.split('-').map(Number);
	return new Date(y, m - 1, d, hh, mm, 0, 0).getTime();
}
