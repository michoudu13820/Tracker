import type { Habit, HabitCompletion, IsoDate, ReminderSettings } from './types';
import { addDays, toIsoDate } from './dates';
import { habitsDueOn } from './occurrences';

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
 * Seules les habitudes **actives** (ni en pause US-015, ni supprimées US-013) comptent
 * comme occurrence : une habitude en pause ne doit plus déclencher de rappel, au même
 * titre qu'elle disparaît du planning (`habitsDueOn`).
 *
 * `completions` permet un allègement **best-effort** (US-007 scénario 8) : si, pour un
 * jour donné, toutes les habitudes dues ce jour-là sont déjà marquées faites, aucun
 * rappel n'est programmé pour ce jour. Comme le serveur ne connaît pas l'état de
 * complétion, ceci ne s'applique qu'au moment où le client re-pousse sa fenêtre (donc
 * seulement si l'app a été rouverte après avoir tout coché, avant l'heure d'envoi) —
 * c'est un compromis assumé, pas une garantie.
 *
 * @param habits      habitudes locales
 * @param settings    réglages de rappel (heure, fuseau, activation)
 * @param horizonDays profondeur de la fenêtre (défaut 30 jours)
 * @param now         instant courant (injecté pour testabilité)
 * @param completions historique de complétion des habitudes (défaut vide = pas de filtre)
 */
export function computeReminderWindow(
	habits: Habit[],
	settings: ReminderSettings,
	horizonDays = 30,
	now: Date = new Date(),
	completions: HabitCompletion[] = []
): ScheduledReminder[] {
	if (!settings.enabled) return [];

	const [hh, mm] = settings.time.split(':').map(Number);
	const today = toIsoDate(now);
	const reminders: ScheduledReminder[] = [];

	for (let offset = 0; offset < horizonDays; offset++) {
		const date = addDays(today, offset);
		const due = habitsDueOn(habits, date);
		if (due.length === 0) continue;
		if (due.every((h) => isHabitCompletedOn(h.id, date, completions))) continue;

		const sendAt = sendAtFor(date, hh, mm);
		// N'inclut pas les instants déjà passés (ex. rappel du matin si on est l'après-midi).
		if (sendAt <= now.getTime()) continue;

		reminders.push({ date, sendAt });
	}

	return reminders;
}

function isHabitCompletedOn(habitId: string, date: IsoDate, completions: HabitCompletion[]): boolean {
	return completions.some((c) => c.habitId === habitId && c.date === date && c.done);
}

/** Instant d'envoi (epoch ms) pour un jour local + heure HH:MM, dans le fuseau local du runtime. */
function sendAtFor(date: IsoDate, hh: number, mm: number): number {
	const [y, m, d] = date.split('-').map(Number);
	return new Date(y, m - 1, d, hh, mm, 0, 0).getTime();
}
