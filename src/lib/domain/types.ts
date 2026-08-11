/**
 * Modèle métier — types purs, sans dépendance au framework ni au stockage.
 * Ces types sont la source de vérité partagée entre `domain`, `data` et `stores`.
 */

/** Jour de la semaine, 0 = dimanche … 6 = samedi (aligné sur Date.getDay()). */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** Fréquence d'une habitude : soit un intervalle de N jours, soit des jours de semaine fixes. */
export type Frequency =
	| { kind: 'interval'; days: number; anchor: IsoDate }
	| { kind: 'weekdays'; weekdays: Weekday[] };

/** Date locale au format ISO `YYYY-MM-DD` (sans heure ni fuseau — c'est un jour calendaire). */
export type IsoDate = string;

export interface Habit {
	id: string;
	name: string;
	emoji: string;
	frequency: Frequency;
	createdAt: IsoDate;
}

export interface Task {
	id: string;
	name: string;
	date: IsoDate;
	createdAt: IsoDate;
}

/** Complétion d'une habitude un jour donné (historique 100% local). */
export interface HabitCompletion {
	habitId: string;
	date: IsoDate;
	done: boolean;
}

/** Complétion d'une tâche ponctuelle. */
export interface TaskCompletion {
	taskId: string;
	done: boolean;
	doneAt?: IsoDate;
}

/** Réglages de rappel (US-007). Seul ce bloc « scheduling » remonte au serveur. */
export interface ReminderSettings {
	enabled: boolean;
	/** Heure locale du rappel quotidien, format `HH:MM`. */
	time: string;
	/** Fuseau IANA de l'appareil, ex. `Europe/Paris`. */
	timezone: string;
}

/** Seuils de couleur du résumé annuel (US-005 / US-006). */
export interface ColorThresholds {
	/** Vert si complétion >= green (0-100). */
	green: number;
	/** Jaune si complétion >= yellow et < green ; rouge sinon. */
	yellow: number;
}
