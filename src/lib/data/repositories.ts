import { get, set } from 'idb-keyval';
import type {
	Habit,
	HabitCompletion,
	HabitProgress,
	IsoDate,
	ReminderSettings,
	Task,
	TaskCompletion,
	ColorThresholds,
	WeeklyReviewSettings
} from '$lib/domain/types';
import { DEFAULT_THRESHOLDS } from '$lib/domain/summary';
import { DEFAULT_FONT_CHOICE, type FontChoice } from '$lib/domain/fonts';

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
	/** Progression cumulée quotidienne des habitudes à cible chiffrée (US-018). */
	getHabitProgress(): Promise<HabitProgress[]>;
	saveHabitProgress(p: HabitProgress[]): Promise<void>;
}

export interface SettingsRepository {
	getReminderSettings(): Promise<ReminderSettings>;
	saveReminderSettings(s: ReminderSettings): Promise<void>;
	getColorThresholds(): Promise<ColorThresholds>;
	saveColorThresholds(t: ColorThresholds): Promise<void>;
	/** Police de caractères choisie (US-016). Même agrégat de préférences persistées que les
	 * seuils de couleur et les rappels, comme demandé par la dépendance de l'US. */
	getFontChoice(): Promise<FontChoice>;
	saveFontChoice(choice: FontChoice): Promise<void>;
	/** Réglages de la revue hebdomadaire poussée (US-028), indépendants du rappel quotidien. */
	getWeeklyReviewSettings(): Promise<WeeklyReviewSettings>;
	saveWeeklyReviewSettings(s: WeeklyReviewSettings): Promise<void>;
}

const KEYS = {
	habits: 'habits',
	tasks: 'tasks',
	habitCompletions: 'habit-completions',
	taskCompletions: 'task-completions',
	habitProgress: 'habit-progress',
	reminder: 'reminder-settings',
	thresholds: 'color-thresholds',
	font: 'font-choice',
	weeklyReview: 'weekly-review-settings'
} as const;

function defaultReminder(): ReminderSettings {
	return {
		enabled: false,
		time: '08:00',
		timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Paris'
	};
}

/** Dimanche 18h00 par défaut (US-028), désactivée tant que l'utilisateur ne l'active pas
 * explicitement — même principe que `defaultReminder`. */
function defaultWeeklyReview(): WeeklyReviewSettings {
	return { enabled: false, weekday: 0, time: '18:00' };
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
		},
		async getHabitProgress() {
			return (await get<HabitProgress[]>(KEYS.habitProgress)) ?? [];
		},
		async saveHabitProgress(p: HabitProgress[]) {
			await set(KEYS.habitProgress, p);
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
		},
		async getFontChoice() {
			return (await get<FontChoice>(KEYS.font)) ?? DEFAULT_FONT_CHOICE;
		},
		async saveFontChoice(choice: FontChoice) {
			await set(KEYS.font, choice);
		},
		async getWeeklyReviewSettings() {
			return (await get<WeeklyReviewSettings>(KEYS.weeklyReview)) ?? defaultWeeklyReview();
		},
		async saveWeeklyReviewSettings(s: WeeklyReviewSettings) {
			await set(KEYS.weeklyReview, s);
		}
	} satisfies SettingsRepository
};

// Sauvegarde/restauration JSON (US-008) : voir `$lib/data/backup.ts` — concern isolé qui
// connaît la forme complète du modèle, là où chaque repository ne connaît que son agrégat.
