import { get, set } from 'idb-keyval';
import type {
	Habit,
	HabitCompletion,
	IsoDate,
	ReminderSettings,
	Task,
	TaskCompletion,
	ColorThresholds
} from '$lib/domain/types';
import { DEFAULT_THRESHOLDS } from '$lib/domain/summary';

/**
 * Couche d'accès aux données — 100% locale (IndexedDB via idb-keyval).
 * AUCUNE donnée métier ne quitte l'appareil. Le seul flux sortant du projet est la
 * fenêtre de rappels (voir `$lib/push`), qui ne contient pas ces données.
 *
 * Interfaces d'abord : l'UI/les stores dépendent des interfaces, jamais d'IndexedDB
 * directement → implémentation mockable en mémoire pour les tests.
 */

export interface HabitsRepository {
	getAll(): Promise<Habit[]>;
	saveAll(habits: Habit[]): Promise<void>;
}

export interface TasksRepository {
	getAll(): Promise<Task[]>;
	saveAll(tasks: Task[]): Promise<void>;
}

export interface CompletionsRepository {
	getHabitCompletions(): Promise<HabitCompletion[]>;
	saveHabitCompletions(c: HabitCompletion[]): Promise<void>;
	getTaskCompletions(): Promise<TaskCompletion[]>;
	saveTaskCompletions(c: TaskCompletion[]): Promise<void>;
}

export interface SettingsRepository {
	getReminderSettings(): Promise<ReminderSettings>;
	saveReminderSettings(s: ReminderSettings): Promise<void>;
	getColorThresholds(): Promise<ColorThresholds>;
	saveColorThresholds(t: ColorThresholds): Promise<void>;
}

const KEYS = {
	habits: 'habits',
	tasks: 'tasks',
	habitCompletions: 'habit-completions',
	taskCompletions: 'task-completions',
	reminder: 'reminder-settings',
	thresholds: 'color-thresholds'
} as const;

function defaultReminder(): ReminderSettings {
	return {
		enabled: false,
		time: '08:00',
		timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Paris'
	};
}

/** Implémentation IndexedDB (seul endroit qui connaît la source de données). */
export const idbRepositories = {
	habits: {
		async getAll() {
			return (await get<Habit[]>(KEYS.habits)) ?? [];
		},
		async saveAll(habits: Habit[]) {
			await set(KEYS.habits, habits);
		}
	} satisfies HabitsRepository,

	tasks: {
		async getAll() {
			return (await get<Task[]>(KEYS.tasks)) ?? [];
		},
		async saveAll(tasks: Task[]) {
			await set(KEYS.tasks, tasks);
		}
	} satisfies TasksRepository,

	completions: {
		async getHabitCompletions() {
			return (await get<HabitCompletion[]>(KEYS.habitCompletions)) ?? [];
		},
		async saveHabitCompletions(c: HabitCompletion[]) {
			await set(KEYS.habitCompletions, c);
		},
		async getTaskCompletions() {
			return (await get<TaskCompletion[]>(KEYS.taskCompletions)) ?? [];
		},
		async saveTaskCompletions(c: TaskCompletion[]) {
			await set(KEYS.taskCompletions, c);
		}
	} satisfies CompletionsRepository,

	settings: {
		async getReminderSettings() {
			return (await get<ReminderSettings>(KEYS.reminder)) ?? defaultReminder();
		},
		async saveReminderSettings(s: ReminderSettings) {
			await set(KEYS.reminder, s);
		},
		async getColorThresholds() {
			return (await get<ColorThresholds>(KEYS.thresholds)) ?? { ...DEFAULT_THRESHOLDS };
		},
		async saveColorThresholds(t: ColorThresholds) {
			await set(KEYS.thresholds, t);
		}
	} satisfies SettingsRepository
};

// Sauvegarde/restauration JSON (US-008) : voir `$lib/data/backup.ts` — concern isolé qui
// connaît la forme complète du modèle, là où chaque repository ne connaît que son agrégat.
