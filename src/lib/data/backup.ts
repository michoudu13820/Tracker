import type {
	ColorThresholds,
	Habit,
	HabitCompletion,
	HabitProgress,
	ReminderSettings,
	Task,
	TaskCompletion
} from '$lib/domain/types';
import { idbRepositories } from './repositories';

/**
 * Sauvegarde / restauration (US-008) — export et import JSON de l'INTÉGRALITÉ des
 * données métier locales. Filet de sécurité contre la purge du stockage iOS (ADR-001).
 *
 * Concern isolé de `repositories.ts` : le backup connaît la forme complète du modèle
 * (l'« enveloppe »), là où chaque repository ne connaît que son agrégat. Stratégie
 * d'import = REPLACE (remplace tout), jamais merge (décision US-008).
 *
 * La souscription Web Push n'est PAS sauvegardée : ce n'est pas une donnée métier, elle
 * est liée à l'appareil/navigateur et se réactive séparément (US-008, hors périmètre).
 */

/** Version courante du format d'export. Incrémenter en cas de migration de schéma. */
export const BACKUP_VERSION = 1;

/** Enveloppe versionnée — contrat unique partagé par l'export et l'import. */
export interface BackupData {
	version: number;
	habits: Habit[];
	tasks: Task[];
	habitCompletions: HabitCompletion[];
	taskCompletions: TaskCompletion[];
	reminder: ReminderSettings;
	thresholds: ColorThresholds;
	/** Progression cumulée quotidienne des habitudes à cible chiffrée (US-018). Optionnel côté
	 * import pour rester compatible avec les exports réalisés avant son introduction : traité
	 * comme un tableau vide si absent (voir `isValidBackup`/`restoreBackup`). */
	habitProgress?: HabitProgress[];
}

/** Assemble l'ensemble des données locales en une enveloppe sérialisable (US-008 scénario 1/2). */
export async function collectBackup(): Promise<BackupData> {
	const [habits, tasks, habitCompletions, taskCompletions, habitProgress, reminder, thresholds] =
		await Promise.all([
			idbRepositories.habits.getAll(),
			idbRepositories.tasks.getAll(),
			idbRepositories.completions.getHabitCompletions(),
			idbRepositories.completions.getTaskCompletions(),
			idbRepositories.completions.getHabitProgress(),
			idbRepositories.settings.getReminderSettings(),
			idbRepositories.settings.getColorThresholds()
		]);
	return {
		version: BACKUP_VERSION,
		habits,
		tasks,
		habitCompletions,
		taskCompletions,
		habitProgress,
		reminder,
		thresholds
	};
}

/** Sérialise le backup en JSON indenté (prêt à télécharger). */
export async function exportAllData(): Promise<string> {
	return JSON.stringify(await collectBackup(), null, 2);
}

/** Nom de fichier d'export daté (US-008 scénario 1), ex. `tracker-export-2026-08-12.json`. */
export function backupFileName(now: Date = new Date()): string {
	const y = now.getFullYear();
	const m = String(now.getMonth() + 1).padStart(2, '0');
	const d = String(now.getDate()).padStart(2, '0');
	return `tracker-export-${y}-${m}-${d}.json`;
}

/**
 * Garde de validation structurelle (US-008 scénario 4) : rejette tout fichier qui n'est
 * pas un export reconnu, sans jamais toucher aux données actuelles. Volontairement
 * défensive et non exhaustive — vérifie l'ossature, pas chaque champ de chaque entité.
 */
export function isValidBackup(value: unknown): value is BackupData {
	if (typeof value !== 'object' || value === null) return false;
	const v = value as Record<string, unknown>;
	return (
		typeof v.version === 'number' &&
		Array.isArray(v.habits) &&
		Array.isArray(v.tasks) &&
		Array.isArray(v.habitCompletions) &&
		Array.isArray(v.taskCompletions) &&
		(v.habitProgress === undefined || Array.isArray(v.habitProgress)) &&
		typeof v.reminder === 'object' &&
		v.reminder !== null &&
		typeof v.thresholds === 'object' &&
		v.thresholds !== null
	);
}

/** Parse + valide une chaîne JSON. Lève si le fichier n'est pas un export valide. */
export function parseBackup(json: string): BackupData {
	let parsed: unknown;
	try {
		parsed = JSON.parse(json);
	} catch {
		throw new Error("Le fichier n'est pas un JSON valide.");
	}
	if (!isValidBackup(parsed)) {
		throw new Error("Le fichier n'est pas reconnu comme un export valide de Tracker.");
	}
	return parsed;
}

/**
 * Restaure un backup (stratégie REPLACE — écrase toutes les données locales). L'appelant
 * (US-008) est responsable de la confirmation utilisateur AVANT d'invoquer cette fonction
 * (scénarios 3/5/6). Après import, les stores doivent recharger leur état.
 */
export async function restoreBackup(data: BackupData): Promise<void> {
	await Promise.all([
		idbRepositories.habits.saveAll(data.habits),
		idbRepositories.tasks.saveAll(data.tasks),
		idbRepositories.completions.saveHabitCompletions(data.habitCompletions),
		idbRepositories.completions.saveTaskCompletions(data.taskCompletions),
		idbRepositories.completions.saveHabitProgress(data.habitProgress ?? []),
		idbRepositories.settings.saveReminderSettings(data.reminder),
		idbRepositories.settings.saveColorThresholds(data.thresholds)
	]);
}

/** Import de bout en bout : parse + valide + restaure (US-008 scénario 3/4). */
export async function importAllData(json: string): Promise<void> {
	await restoreBackup(parseBackup(json));
}
