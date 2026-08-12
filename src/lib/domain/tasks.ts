import type { IsoDate, Task, TaskCompletion } from './types';
import { daysBetween } from './dates';

/**
 * Cœur métier des tâches ponctuelles — fonctions pures et testables, sans dépendance
 * au framework ni au stockage. Pendant, côté « tâches », de `occurrences.ts` (côté
 * « habitudes »). Utilisé par le planning (US-004), la reprogrammation (US-003) et le
 * résumé (US-005).
 */

/** Statut d'une tâche à une date de référence (aujourd'hui). */
export type TaskStatus = 'done' | 'due' | 'overdue';

/** Les tâches dont la date correspond exactement au jour donné (US-004). */
export function tasksOn(tasks: Task[], date: IsoDate): Task[] {
	return tasks.filter((t) => t.date === date);
}

/**
 * Une tâche est « en retard » (US-003) si sa date est strictement antérieure à
 * aujourd'hui ET qu'elle n'est pas cochée. Règle produit tranchée (US-003, scénario 1bis) :
 * la bascule se fait à 00h00 le lendemain de la date prévue — une tâche datée du jour même
 * n'est JAMAIS en retard avant minuit. Une tâche cochée n'est jamais en retard (scénario 4).
 *
 * @param today date de référence (injectée pour testabilité)
 */
export function isTaskOverdue(task: Task, done: boolean, today: IsoDate): boolean {
	if (done) return false;
	return daysBetween(task.date, today) > 0;
}

/** Statut résolu d'une tâche à une date de référence, pour l'affichage (US-003/US-004). */
export function taskStatus(task: Task, done: boolean, today: IsoDate): TaskStatus {
	if (done) return 'done';
	return isTaskOverdue(task, done, today) ? 'overdue' : 'due';
}

/** Retrouve l'état de complétion d'une tâche dans une liste de complétions. */
export function isTaskDone(completions: TaskCompletion[], taskId: string): boolean {
	return completions.find((c) => c.taskId === taskId)?.done ?? false;
}

/** Brouillon de formulaire de tâche (US-002), avant construction d'un `Task`. */
export interface TaskDraft {
	name: string;
	date: IsoDate | null;
}

export interface TaskValidation {
	valid: boolean;
	errors: string[];
}

/** Valide un brouillon de tâche (US-002 scénario 3) : nom et date obligatoires. */
export function validateTaskDraft(draft: TaskDraft): TaskValidation {
	const errors: string[] = [];
	if (!draft.name.trim()) errors.push('Le nom est obligatoire.');
	if (!draft.date) errors.push('La date est obligatoire.');
	return { valid: errors.length === 0, errors };
}

/** Valide une nouvelle date de reprogrammation (US-003 scénario 3) : date obligatoire. */
export function validateReschedule(date: IsoDate | null): TaskValidation {
	return date
		? { valid: true, errors: [] }
		: { valid: false, errors: ['Choisissez une nouvelle date.'] };
}
