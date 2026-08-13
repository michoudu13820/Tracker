import type { Habit, HabitCompletion, IsoDate, Task, TaskCompletion } from './types';
import { habitsDueOn } from './occurrences';
import { isTaskDone, tasksOn, visibleTasks } from './tasks';

/**
 * Cœur métier du badge d'icône PWA (US-031) : combien d'éléments (habitudes + tâches) restent
 * à faire pour un jour donné. Fonction pure, sans dépendance à `navigator` — même principe de
 * séparation que le reste du domaine (voir `$lib/badge/client` pour l'appel API navigateur).
 */

/**
 * Nombre d'éléments restant à faire pour `date` (US-031 scénarios 1/2) : habitudes dues ce
 * jour-là non cochées + tâches datées ce jour-là non cochées (jamais les supprimées). Un simple
 * compte brut, sans pondération ni notion de retard — cohérent avec le planning quotidien
 * (US-004), dont il réutilise les mêmes règles de sélection (`habitsDueOn`, `tasksOn`).
 */
export function remainingCount(
	habits: Habit[],
	habitCompletions: HabitCompletion[],
	tasks: Task[],
	taskCompletions: TaskCompletion[],
	date: IsoDate
): number {
	const dueHabits = habitsDueOn(habits, date);
	const remainingHabits = dueHabits.filter(
		(h) => !habitCompletions.some((c) => c.habitId === h.id && c.date === date && c.done)
	).length;

	const dueTasks = tasksOn(visibleTasks(tasks), date);
	const remainingTasks = dueTasks.filter((t) => !isTaskDone(taskCompletions, t.id)).length;

	return remainingHabits + remainingTasks;
}
