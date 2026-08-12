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

/**
 * Statut de gestion d'une habitude (US-013/US-015) : `active` par défaut, `paused` pendant
 * une pause temporaire réversible (US-015), `deleted` après une suppression définitive
 * (soft-delete, US-013) — l'historique de complétion reste conservé dans les deux cas.
 * Champ optionnel pour rester rétro-compatible avec les habitudes déjà persistées avant
 * l'introduction de ce statut : `undefined` est équivalent à `'active'`, voir
 * `$lib/domain/habits#habitStatus`.
 */
export type HabitStatus = 'active' | 'paused' | 'deleted';

/**
 * Unité fermée pour une cible chiffrée d'habitude (US-017 scénario 3) : liste fixe et non
 * extensible depuis l'UI (pas d'unité personnalisée en texte libre, pas de conversion entre
 * unités — décision produit tranchée, voir US-017 notes).
 */
export type HabitTargetUnit = 'L' | 'mL' | 'min' | 'h' | 'km' | 'x';

/** Cible chiffrée optionnelle d'une habitude (US-017) : valeur strictement positive + unité. */
export interface HabitTarget {
	value: number;
	unit: HabitTargetUnit;
}

export interface Habit {
	id: string;
	name: string;
	emoji: string;
	frequency: Frequency;
	createdAt: IsoDate;
	status?: HabitStatus;
	/** Cible chiffrée optionnelle (US-017). `undefined` = habitude « case à cocher » classique
	 * (comportement historique inchangé, US-001/US-004), rétro-compatible par défaut. */
	target?: HabitTarget;
}

/**
 * Statut de gestion d'une tâche ponctuelle (US-014) : `active` par défaut, `deleted` après
 * une suppression définitive (soft-delete) — la complétion éventuellement enregistrée reste
 * conservée. Champ optionnel pour rester rétro-compatible, comme `Habit.status`.
 * Nommé `TaskRecordStatus` (et non `TaskStatus`) pour ne pas entrer en collision avec
 * `TaskStatus` de `$lib/domain/tasks` (statut du jour : fait/à faire/en retard) — deux
 * notions de statut distinctes portées par le même objet `Task`.
 */
export type TaskRecordStatus = 'active' | 'deleted';

export interface Task {
	id: string;
	name: string;
	date: IsoDate;
	createdAt: IsoDate;
	status?: TaskRecordStatus;
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

/**
 * Progression cumulée d'une habitude à cible chiffrée pour un jour donné (US-018) : une seule
 * valeur cumulée par (habitId, date), qui repart implicitement à 0 chaque jour (aucune entrée
 * = 0). Pas d'historique détaillé des ajouts individuels — hypothèse produit tranchée, voir
 * US-018 notes : la valeur cumulée elle-même est directement corrigible (scénario 9).
 */
export interface HabitProgress {
	habitId: string;
	date: IsoDate;
	value: number;
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
