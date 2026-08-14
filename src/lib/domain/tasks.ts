import type { IsoDate, Task, TaskCompletion, TaskRecordStatus } from './types';
import { daysBetween } from './dates';
import { cardColorToPersist, resolveCardColor, type CardColor } from './card-colors';

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
 * Une tâche est marquée urgente (US-039). Marquage **manuel** uniquement : une tâche sans champ
 * `urgent` (persistée avant l'introduction de ce champ) est non urgente, comme une tâche dont le
 * marquage a été retiré.
 */
export function isTaskUrgent(task: Task): boolean {
	return task.urgent === true;
}

/**
 * Ordre d'affichage de deux tâches d'un **même jour** (US-038, étendu par US-039) :
 * 1. toutes les tâches **urgentes** avant toutes les non urgentes (US-039) ;
 * 2. au sein des **urgentes** : celles **sans** heure limite d'abord (« à faire dès que
 *    possible »), puis les autres par heure croissante ;
 * 3. au sein des **non urgentes** : les tâches à heure limite par heure croissante, puis celles
 *    **sans** heure limite à la fin (« pas de contrainte horaire ») ;
 * 4. à égalité, départage par **ordre de création** (`createdAt`), jamais alphabétique.
 *
 * L'asymétrie de traitement des « sans heure limite » entre les deux groupes (2 vs 3) est
 * **voulue par l'utilisateur** (US-039 notes) : elle ne doit pas être « harmonisée ».
 *
 * Volontairement indépendant de l'état de complétion (US-038 scénario 5, US-039 scénario 9) et du
 * statut « en retard » (US-038 scénario 6) : cocher une tâche ne doit jamais la déplacer sous le
 * doigt, et le retard ne crée aucune hiérarchie d'insistance.
 *
 * Renvoie 0 quand les deux tâches sont totalement à égalité — c'est `sortTasksForDay` qui garantit
 * alors la stabilité par l'ordre d'insertion (US-038 scénario 4, US-039 scénario 6).
 */
export function compareTasksSameDay(a: Task, b: Task): number {
	// 1. Groupe prioritaire : les urgentes d'abord (US-039 scénario 5).
	const aUrgent = isTaskUrgent(a);
	const bUrgent = isTaskUrgent(b);
	if (aUrgent !== bUrgent) return aUrgent ? -1 : 1;

	const aHasTime = a.dueTime !== undefined;
	const bHasTime = b.dueTime !== undefined;
	if (aHasTime !== bHasTime) {
		// Chez les urgentes, l'absence d'heure passe DEVANT ; chez les non urgentes, elle passe
		// DERRIÈRE — asymétrie assumée (US-039 notes).
		if (aUrgent) return aHasTime ? 1 : -1;
		return aHasTime ? -1 : 1;
	}

	// Heures au format `HH:MM` zéro-paddé : la comparaison lexicographique EST la comparaison
	// chronologique, sans conversion ni fuseau. Ordre croissant dans les deux groupes.
	if (aHasTime && bHasTime && a.dueTime !== b.dueTime) {
		return (a.dueTime as string).localeCompare(b.dueTime as string);
	}

	return a.createdAt.localeCompare(b.createdAt);
}

/**
 * Trie les tâches d'un même jour selon `compareTasksSameDay` (US-038). Le tri est rendu
 * **totalement déterministe** par un départage final sur la position d'origine dans le tableau
 * persisté : `createdAt` étant un jour calendaire (sans heure), deux tâches créées le même jour
 * seraient sinon à égalité stricte. L'ordre du tableau persisté est l'ordre de création (`upsert`
 * ajoute en fin de liste), donc « la plus anciennement créée en premier » reste vrai, y compris
 * après fermeture/réouverture de l'application (scénario 4).
 */
export function sortTasksForDay(tasks: Task[]): Task[] {
	return tasks
		.map((task, index) => ({ task, index }))
		.sort((a, b) => compareTasksSameDay(a.task, b.task) || a.index - b.index)
		.map(({ task }) => task);
}

/**
 * Trie une liste de tâches **multi-jours** (écran `/taches`, US-038 scénario 9) : date croissante
 * en critère principal — inchangé — puis exactement la même règle intra-jour que le planning.
 */
export function sortTasksByDateThenDay(tasks: Task[]): Task[] {
	return tasks
		.map((task, index) => ({ task, index }))
		.sort(
			(a, b) =>
				a.task.date.localeCompare(b.task.date) ||
				compareTasksSameDay(a.task, b.task) ||
				a.index - b.index
		)
		.map(({ task }) => task);
}

/**
 * Statut de gestion résolu d'une tâche (US-014, soft-delete) : une tâche sans champ `status`
 * (persistée avant l'introduction de ce champ) est considérée `'active'`. À ne pas confondre
 * avec `TaskStatus`/`taskStatus` ci-dessus (statut du jour : fait/à faire/en retard).
 */
export function taskRecordStatus(task: Task): TaskRecordStatus {
	return task.status ?? 'active';
}

/** Une tâche supprimée (US-014, soft-delete) : absente de toute liste/planning, irréversible. */
export function isTaskDeleted(task: Task): boolean {
	return taskRecordStatus(task) === 'deleted';
}

/** Tâches à afficher dans les listes de gestion (`/taches`) et le planning : jamais les supprimées. */
export function visibleTasks(tasks: Task[]): Task[] {
	return tasks.filter((t) => !isTaskDeleted(t));
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
	/** Heure limite optionnelle saisie (US-021), format `HH:MM` ou `null`/vide si non renseignée.
	 * Arrondie au quart d'heure au moment de la construction du `Task` (voir `TaskForm`). */
	dueTime?: string | null;
	/** Teinte de carte sélectionnée (US-037), issue de la palette fermée d'US-036. Absente =
	 * teinte par défaut ; persistée seulement si elle diffère du défaut. */
	color?: CardColor;
	/** Marquage « Urgente » (US-039), désactivé par défaut. Persisté seulement s'il est activé. */
	urgent?: boolean;
}

/** Marquage d'urgence à persister à partir d'un brouillon (US-039 scénarios 2/4) : `undefined`
 * quand il n'est pas activé, pour rester indiscernable d'une tâche d'avant cette évolution. */
export function draftToUrgent(draft: TaskDraft): true | undefined {
	return draft.urgent ? true : undefined;
}

/** Teinte à présélectionner dans le formulaire pour une tâche existante (US-037 scénario 5) :
 * sa teinte enregistrée, ou la teinte par défaut si elle n'en a jamais eu (scénario 4). */
export function taskColorToDraft(color?: CardColor): Pick<TaskDraft, 'color'> {
	return { color: resolveCardColor(color) };
}

/** Teinte à persister à partir d'un brouillon (US-037 scénarios 3/5) : `undefined` quand la
 * teinte par défaut est sélectionnée, pour rester indiscernable d'une tâche sans couleur. */
export function draftToTaskColor(draft: TaskDraft): CardColor | undefined {
	return cardColorToPersist(resolveCardColor(draft.color));
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
