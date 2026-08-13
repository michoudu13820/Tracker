import type {
	Habit,
	HabitCompletion,
	IsoDate,
	ReminderSettings,
	Task,
	TaskCompletion,
	WeeklyReviewSettings
} from './types';
import { addDays, toIsoDate, weekdayOf } from './dates';
import { habitsDueOn } from './occurrences';
import { isTaskDone, visibleTasks } from './tasks';

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

/**
 * Un rappel de tâche à heure limite (US-022) : contrairement à `ScheduledReminder` (habitudes,
 * US-007), ce type transporte un **contenu déjà composé et nominatif** (`title`/`body`).
 *
 * C'est la dérogation explicitement actée par l'amendement du 2026-08-12 à ADR-001 : le
 * libellé des tâches à heure limite est ce qui transite et est persisté côté serveur (Netlify
 * Blobs), le temps de l'émission — voir `netlify/functions/_shared/store.ts` et `send-due.ts`
 * pour la politique de purge. Cette dérogation est strictement circonscrite à ce type ; le
 * récap matinal des habitudes (`ScheduledReminder`) reste, lui, sans aucun libellé.
 */
export interface ScheduledTaskReminder {
	/** Instant d'envoi commun à toutes les tâches groupées (epoch ms UTC, quart d'heure). */
	sendAt: number;
	/** Titre du push (composé côté client, jamais côté serveur). */
	title: string;
	/** Corps du push — nomme la ou les tâches concernées (US-022 scénarios 1/2). */
	body: string;
}

/**
 * Calcule la fenêtre glissante des rappels nominatifs à venir, à partir des tâches ponctuelles
 * ayant une heure limite (US-021/US-022). Pendant, côté « tâches à heure limite », de
 * `computeReminderWindow` (côté « habitudes »).
 *
 * Règles :
 * - seules les tâches **actives** (non supprimées, US-014), **avec une heure limite** (US-021)
 *   et **non déjà faites** (best-effort, mêmes limites que le scénario 8 d'US-007 — voir
 *   ADR-001 amendement 2026-08-12) sont candidates (scénario 3/4) ;
 * - le réglage global d'activation (`settings.enabled`) gate aussi ce canal (scénario 6) ;
 * - les tâches dont l'heure limite tombe **au même instant** (même jour, même `HH:MM` déjà
 *   arrondi au quart d'heure par US-021) sont **groupées en un seul** `ScheduledTaskReminder`
 *   (scénario 2) — jamais de fusion entre créneaux différents.
 *
 * @param tasks       tâches ponctuelles locales
 * @param settings    réglages de rappel (heure du récap matinal non utilisée ici, seule
 *                     `enabled` s'applique — l'heure d'envoi vient de `task.dueTime`)
 * @param horizonDays profondeur de la fenêtre (défaut 30 jours, même horizon que les habitudes)
 * @param now         instant courant (injecté pour testabilité)
 * @param completions historique de complétion des tâches (défaut vide = pas de filtre)
 */
export function computeTaskReminderWindow(
	tasks: Task[],
	settings: ReminderSettings,
	horizonDays = 30,
	now: Date = new Date(),
	completions: TaskCompletion[] = []
): ScheduledTaskReminder[] {
	if (!settings.enabled) return [];

	const nowMs = now.getTime();
	const horizonEnd = addDays(toIsoDate(now), horizonDays);

	const groups = new Map<number, Task[]>();
	for (const task of visibleTasks(tasks)) {
		if (!task.dueTime) continue; // scénario 3 : pas d'heure limite → pas de rappel nominatif.
		if (task.date > horizonEnd) continue;
		if (isTaskDone(completions, task.id)) continue; // scénario 4 (best-effort).

		const [hh, mm] = task.dueTime.split(':').map(Number);
		const sendAt = sendAtFor(task.date, hh, mm);
		if (sendAt <= nowMs) continue;

		const group = groups.get(sendAt);
		if (group) group.push(task);
		else groups.set(sendAt, [task]);
	}

	return [...groups.entries()]
		.sort(([a], [b]) => a - b)
		.map(([sendAt, grouped]) => ({ sendAt, ...composeTaskReminderContent(grouped) }));
}

/** Compose le contenu nominatif du push (US-022 scénarios 1/2) : une tâche seule est nommée
 * directement, plusieurs tâches du même créneau sont listées dans un unique message groupé. */
function composeTaskReminderContent(tasks: Task[]): { title: string; body: string } {
	if (tasks.length === 1) {
		return { title: 'Tracker', body: `${tasks[0].name} — à faire avant ${tasks[0].dueTime}` };
	}
	const names = tasks.map((t) => t.name).join(', ');
	return { title: 'Tracker', body: `${tasks.length} tâches arrivent à échéance : ${names}` };
}

/**
 * Calcule la fenêtre glissante de la revue hebdomadaire poussée (US-028) : un rappel
 * générique — non nominatif, aucune dérogation ADR-001, contrairement à US-022 — programmé
 * chaque semaine au jour/heure choisis, tant que `settings.enabled` (scénario 3 : activation
 * indépendante du rappel quotidien US-007, portée par un champ distinct). Même forme
 * (`ScheduledReminder`) et même horizon par défaut que le récap quotidien des habitudes.
 */
export function computeWeeklyReviewWindow(
	settings: WeeklyReviewSettings,
	horizonDays = 30,
	now: Date = new Date()
): ScheduledReminder[] {
	if (!settings.enabled) return [];

	const [hh, mm] = settings.time.split(':').map(Number);
	const today = toIsoDate(now);
	const reminders: ScheduledReminder[] = [];

	for (let offset = 0; offset < horizonDays; offset++) {
		const date = addDays(today, offset);
		if (weekdayOf(date) !== settings.weekday) continue;

		const sendAt = sendAtFor(date, hh, mm);
		if (sendAt <= now.getTime()) continue;

		reminders.push({ date, sendAt });
	}

	return reminders;
}
