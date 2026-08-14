/**
 * Modèle métier — types purs, sans dépendance au framework ni au stockage.
 * Ces types sont la source de vérité partagée entre `domain`, `data` et `stores`.
 */

import type { CardColor } from './card-colors';

/** Jour de la semaine, 0 = dimanche … 6 = samedi (aligné sur Date.getDay()). */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Quantième du mois retenu par la fréquence « jours du mois » (US-032), borné à 1–31 (scénario 3).
 * Un quantième absent du mois consulté (31 en avril, 29/30/31 en février) ne fait pas disparaître
 * l'occurrence : elle est repliée sur le **dernier jour du mois** — règle produit tranchée et non
 * renégociable, voir `$lib/domain/occurrences#resolveMonthDays`.
 */
export type MonthDay = number;

/**
 * Fréquence d'une habitude : intervalle de N jours, jours de semaine fixes, ou quantièmes du
 * mois (US-032). Union discriminée par `kind` — **jamais** de champ commun : une habitude déjà
 * persistée avec `interval`/`weekdays` reste lue et interprétée exactement comme avant
 * l'ajout de `monthdays` (rétro-compatibilité stricte, aucune migration — US-032 scénario 11).
 */
export type Frequency =
	| { kind: 'interval'; days: number; anchor: IsoDate }
	| { kind: 'weekdays'; weekdays: Weekday[] }
	| { kind: 'monthdays'; monthdays: MonthDay[] };

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
	/**
	 * Date de reprise automatique optionnelle (US-027), pertinente uniquement quand
	 * `status === 'paused'` : dès que ce jour est atteint (à l'ouverture de l'app, best-effort
	 * — pas de mécanisme serveur dédié), l'habitude redevient automatiquement `'active'` et ce
	 * champ est retiré. `undefined` = pause indéfinie jusqu'à réactivation manuelle
	 * (comportement historique d'US-015, inchangé par défaut).
	 */
	resumeAt?: IsoDate;
	/**
	 * Teinte de carte choisie par l'utilisateur (US-036), parmi la palette **fermée** de
	 * `$lib/domain/card-colors`. Repère personnel : ne signifie jamais un état, un statut ni
	 * une priorité. `undefined` = teinte par défaut, rendu strictement identique à celui d'avant
	 * l'introduction de la palette — aucune migration des habitudes déjà persistées (même
	 * principe que `status` et `target`).
	 */
	color?: CardColor;
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
	/**
	 * Heure limite optionnelle (US-021), format `HH:MM`, toujours alignée sur le quart d'heure
	 * (`:00`, `:15`, `:30`, `:45` — cf. `$lib/domain/dates#roundTimeToQuarterHour`). `undefined` =
	 * pas d'heure limite (comportement historique inchangé, US-002/US-004). Consommée par le
	 * rappel push nominatif (US-022) : granularité du scheduler serveur (~15 min, ADR-001), jamais
	 * de précision à la minute.
	 */
	dueTime?: string;
	/**
	 * Teinte de carte choisie par l'utilisateur (US-037) — **exactement la même palette fermée**
	 * que les habitudes (US-036), aucune teinte propre aux tâches. Repère personnel : ne signifie
	 * jamais un statut, une échéance ni une priorité (la priorisation, c'est `urgent`).
	 * `undefined` = teinte par défaut, rendu strictement identique à celui d'avant US-037 —
	 * aucune migration (même principe que `status` et `dueTime`).
	 */
	color?: CardColor;
	/**
	 * Marquage « urgente » (US-039) : **purement manuel**, sans escalade — aucune tâche ne devient
	 * jamais urgente d'elle-même (ni à l'approche de son heure limite, ni en passant en retard).
	 * Réservé aux tâches ponctuelles : les habitudes n'ont pas d'équivalent. `undefined` = non
	 * urgente, comportement historique inchangé — aucune migration (même principe que `status` et
	 * `dueTime`). Ne modifie ni les instants d'envoi ni le contenu des rappels push (US-022).
	 */
	urgent?: boolean;
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

/**
 * Réglages de la revue hebdomadaire poussée (US-028) : activation **indépendante** du rappel
 * quotidien (US-007, scénario 3), mais nécessite tout de même une souscription push active
 * (elle-même conditionnée à `ReminderSettings.enabled`) pour pouvoir être envoyée — pas de canal
 * push séparé. Contenu du push générique, non nominatif : ne remonte au serveur qu'un second
 * jeu d'instants d'envoi (même principe qu'ADR-001).
 */
export interface WeeklyReviewSettings {
	enabled: boolean;
	/** Jour de la semaine du créneau (0 = dimanche … 6 = samedi, aligné sur `Weekday`). */
	weekday: Weekday;
	/** Heure locale, format `HH:MM`, alignée sur le quart d'heure (même granularité qu'US-021,
	 * dictée par le scheduler serveur ~15 min). */
	time: string;
}

/** Seuils de couleur du résumé annuel (US-005 / US-006). */
export interface ColorThresholds {
	/** Vert si complétion >= green (0-100). */
	green: number;
	/** Jaune si complétion >= yellow et < green ; rouge sinon. */
	yellow: number;
}
