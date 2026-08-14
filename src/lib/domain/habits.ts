import type {
	Frequency,
	Habit,
	HabitStatus,
	HabitTarget,
	HabitTargetUnit,
	IsoDate,
	MonthDay,
	Weekday
} from './types';
import {
	DEFAULT_CARD_COLOR,
	cardColorToPersist,
	resolveCardColor,
	type CardColor
} from './card-colors';

/**
 * Cœur métier de la création/édition d'une habitude (US-001) : validation du formulaire
 * et construction de la `Frequency` associée. Fonctions pures et testables, sans dépendance
 * au framework ni au stockage — la couche UI (route `habitudes`) délègue ici la logique.
 */

/** Mode de fréquence sélectionné dans le formulaire : les trois modes sont mutuellement
 * exclusifs (US-001 scénario 3, étendu par US-032 scénario 4). */
export type FrequencyMode = 'interval' | 'weekdays' | 'monthdays';

/** Brouillon de formulaire (avant conversion en `Habit`) : les trois modes de fréquence
 * sont mutuellement exclusifs (US-001 scénario 3 / US-032 scénario 4), représentés par
 * `frequencyMode` — les champs des modes non actifs sont réinitialisés, jamais cumulés. */
export interface HabitDraft {
	name: string;
	emoji: string;
	frequencyMode: FrequencyMode | null;
	intervalDays: number | null;
	weekdays: Weekday[];
	/** Quantièmes du mois sélectionnés (US-032), pertinents uniquement en mode `monthdays`. */
	monthdays: MonthDay[];
	/** Cible chiffrée optionnelle (US-017 scénario 2) : activation indépendante du reste du
	 * formulaire, valeur + unité mutuellement dépendantes de `hasTarget`. */
	hasTarget: boolean;
	targetValue: number | null;
	targetUnit: HabitTargetUnit;
	/** Teinte de carte sélectionnée (US-036) — toujours renseignée dans le brouillon (la teinte
	 * par défaut est présélectionnée), mais persistée seulement si elle diffère du défaut. */
	color: CardColor;
}

export interface HabitValidation {
	valid: boolean;
	errors: string[];
}

/** Brouillon vide, point de départ d'une création (US-001 scénario 1/2). */
export function emptyHabitDraft(): HabitDraft {
	return {
		name: '',
		emoji: '',
		frequencyMode: null,
		intervalDays: null,
		weekdays: [],
		monthdays: [],
		hasTarget: false,
		targetValue: null,
		targetUnit: 'L',
		color: DEFAULT_CARD_COLOR
	};
}

/**
 * Valide un brouillon d'habitude (US-001 scénario 5, US-032 scénario 5) : nom obligatoire, et
 * exactement un des trois modes de fréquence renseigné avec une valeur exploitable (intervalle
 * >= 1 jour, au moins un jour de semaine, ou au moins un jour du mois sélectionné).
 */
export function validateHabitDraft(draft: HabitDraft): HabitValidation {
	const errors: string[] = [];

	if (!draft.name.trim()) {
		errors.push('Le nom est obligatoire.');
	}

	if (!draft.frequencyMode) {
		errors.push(
			'Choisissez un mode de fréquence : intervalle en jours, jours de la semaine ou jours du mois.'
		);
	} else if (draft.frequencyMode === 'interval') {
		if (!draft.intervalDays || draft.intervalDays < 1) {
			errors.push("L'intervalle doit être d'au moins 1 jour.");
		}
	} else if (draft.frequencyMode === 'weekdays') {
		if (draft.weekdays.length === 0) {
			errors.push('Sélectionnez au moins un jour de la semaine.');
		}
	} else if (draft.frequencyMode === 'monthdays') {
		if (draft.monthdays.length === 0) {
			errors.push('Sélectionnez au moins un jour du mois.');
		}
	}

	// US-017 scénario 4 : cible chiffrée activée -> valeur strictement positive obligatoire.
	if (draft.hasTarget) {
		if (
			draft.targetValue === null ||
			!Number.isFinite(draft.targetValue) ||
			draft.targetValue <= 0
		) {
			errors.push('La cible doit être un nombre strictement positif.');
		}
	}

	return { valid: errors.length === 0, errors };
}

/**
 * Construit la `Frequency` finale à partir d'un brouillon valide.
 * @param anchor jour d'ancrage pour le mode intervalle : réutilisé tel quel en édition
 *   (pour ne pas décaler les occurrences déjà cochées), ou date du jour à la création.
 */
export function draftToFrequency(draft: HabitDraft, anchor: IsoDate): Frequency {
	if (draft.frequencyMode === 'weekdays') {
		return { kind: 'weekdays', weekdays: draft.weekdays };
	}
	if (draft.frequencyMode === 'monthdays') {
		// Normalisé à l'enregistrement (US-032 scénario 2 : libellé croissant quel que soit
		// l'ordre de cochage) — le tri et la déduplication sont faits ici, une fois pour toutes.
		return { kind: 'monthdays', monthdays: sortedUniqueMonthDays(draft.monthdays) };
	}
	// 'interval' (seul autre cas valide après validation).
	return { kind: 'interval', days: draft.intervalDays ?? 1, anchor };
}

/** Reconstruit un brouillon de formulaire à partir d'une fréquence existante (édition). */
export function frequencyToDraft(
	frequency: Frequency
): Pick<HabitDraft, 'frequencyMode' | 'intervalDays' | 'weekdays' | 'monthdays'> {
	if (frequency.kind === 'interval') {
		return {
			frequencyMode: 'interval',
			intervalDays: frequency.days,
			weekdays: [],
			monthdays: []
		};
	}
	if (frequency.kind === 'monthdays') {
		return {
			frequencyMode: 'monthdays',
			intervalDays: null,
			weekdays: [],
			monthdays: sortedUniqueMonthDays(frequency.monthdays)
		};
	}
	return {
		frequencyMode: 'weekdays',
		intervalDays: null,
		weekdays: frequency.weekdays,
		monthdays: []
	};
}

/** Liste fermée des unités de cible chiffrée (US-017 scénario 3), dans l'ordre d'affichage. */
export const TARGET_UNITS: HabitTargetUnit[] = ['L', 'mL', 'min', 'h', 'km', 'x'];

const TARGET_UNIT_LABELS: Record<HabitTargetUnit, string> = {
	L: 'Litres (L)',
	mL: 'Millilitres (mL)',
	min: 'Minutes (min)',
	h: 'Heures (h)',
	km: 'Kilomètres (km)',
	x: 'Répétitions/Nombre (x)'
};

/** Libellé lisible d'une unité de cible (US-017 scénario 3), pour le sélecteur du formulaire. */
export function targetUnitLabel(unit: HabitTargetUnit): string {
	return TARGET_UNIT_LABELS[unit];
}

/** Construit la cible chiffrée finale à partir d'un brouillon valide, ou `undefined` si
 * l'option est désactivée (US-017 scénario 1 — rétrocompatibilité par défaut). */
export function draftToTarget(draft: HabitDraft): HabitTarget | undefined {
	if (!draft.hasTarget || draft.targetValue === null) return undefined;
	return { value: draft.targetValue, unit: draft.targetUnit };
}

/** Reconstruit la partie « cible » d'un brouillon à partir d'une habitude existante (édition,
 * US-017 scénarios 5/6). Sans cible -> option désactivée, unité par défaut neutre. */
export function targetToDraft(
	target?: HabitTarget
): Pick<HabitDraft, 'hasTarget' | 'targetValue' | 'targetUnit'> {
	if (!target) return { hasTarget: false, targetValue: null, targetUnit: 'L' };
	return { hasTarget: true, targetValue: target.value, targetUnit: target.unit };
}

/** Teinte à présélectionner dans le formulaire pour une habitude existante (US-036 scénario 5) :
 * sa teinte enregistrée, ou la teinte par défaut si elle n'en a jamais eu (scénario 4). */
export function colorToDraft(color?: CardColor): Pick<HabitDraft, 'color'> {
	return { color: resolveCardColor(color) };
}

/** Teinte à persister à partir d'un brouillon (US-036 scénarios 3/6) : `undefined` quand la
 * teinte par défaut est sélectionnée, pour rester indiscernable d'une habitude sans couleur. */
export function draftToColor(draft: HabitDraft): CardColor | undefined {
	return cardColorToPersist(draft.color);
}

/** Une habitude a une cible chiffrée active (US-017/US-018), par opposition à une simple case
 * à cocher (US-001/US-004) — condition de branchement pour le planning (US-018) et la liste. */
export function hasNumericTarget(habit: Habit): boolean {
	return habit.target !== undefined;
}

/** Formate un nombre pour l'affichage français (virgule décimale) en évitant les artefacts de
 * virgule flottante (ex. 0.1 + 0.2 -> "0.30000000000000004"), ex. 1.5 -> "1,5", 2 -> "2". */
export function formatTargetNumber(n: number): string {
	const rounded = Math.round(n * 100) / 100;
	return rounded.toString().replace('.', ',');
}

/** Libellé lisible d'une cible chiffrée, ex. « 1,5 L » (US-017 scénario 2). */
export function describeTarget(target: HabitTarget): string {
	return `${formatTargetNumber(target.value)} ${target.unit}`;
}

const WEEKDAY_LABELS: Record<Weekday, string> = {
	0: 'dimanche',
	1: 'lundi',
	2: 'mardi',
	3: 'mercredi',
	4: 'jeudi',
	5: 'vendredi',
	6: 'samedi'
};

/** Ordre d'affichage usuel (lundi → dimanche) pour les sélecteurs de jours de semaine. */
export const WEEKDAY_ORDER: Weekday[] = [1, 2, 3, 4, 5, 6, 0];

export function weekdayLabel(day: Weekday): string {
	return WEEKDAY_LABELS[day];
}

/** Quantièmes proposés par le sélecteur « jours du mois » (US-032 scénario 3) : 1 à 31 inclus,
 * bornes fermées — aucune autre valeur n'est proposée ni acceptée. */
export const MONTH_DAY_ORDER: MonthDay[] = Array.from({ length: 31 }, (_, i) => i + 1);

/** Un quantième est valide s'il appartient à l'intervalle 1–31 (US-032 scénario 3). */
export function isValidMonthDay(day: number): boolean {
	return Number.isInteger(day) && day >= 1 && day <= 31;
}

/** Trie et déduplique une sélection de quantièmes, en écartant les valeurs hors 1–31 —
 * garantit un libellé et une persistance déterministes (US-032 scénarios 2/3). */
export function sortedUniqueMonthDays(days: MonthDay[]): MonthDay[] {
	return [...new Set(days.filter(isValidMonthDay))].sort((a, b) => a - b);
}

/** Libellé d'un quantième pour l'affichage français : « 1er » pour le 1, le nombre sinon. */
export function monthDayLabel(day: MonthDay): string {
	return day === 1 ? '1er' : String(day);
}

/** Énumération française « a, b et c » (dernier séparateur « et ») pour les libellés lisibles. */
function joinFr(parts: string[]): string {
	if (parts.length <= 1) return parts[0] ?? '';
	return `${parts.slice(0, -1).join(', ')} et ${parts.at(-1)}`;
}

/**
 * Statut de gestion résolu d'une habitude (US-013/US-015) : une habitude sans champ `status`
 * (persistée avant l'introduction de ce champ) est considérée `'active'`, pour ne rien changer
 * au comportement existant tant qu'aucune action de pause/suppression n'a été faite dessus.
 */
export function habitStatus(habit: Habit): HabitStatus {
	return habit.status ?? 'active';
}

/** Une habitude active apparaît dans le planning et la liste de gestion (comportement par défaut). */
export function isHabitActive(habit: Habit): boolean {
	return habitStatus(habit) === 'active';
}

/** Une habitude en pause (US-015) : visible dans la liste avec un badge, absente du planning. */
export function isHabitPaused(habit: Habit): boolean {
	return habitStatus(habit) === 'paused';
}

/** Une habitude supprimée (US-013, soft-delete) : absente de toute liste/planning, irréversible. */
export function isHabitDeleted(habit: Habit): boolean {
	return habitStatus(habit) === 'deleted';
}

/** Habitudes à afficher dans l'écran de gestion « Habitudes » : actives et en pause, jamais les supprimées. */
export function visibleHabits(habits: Habit[]): Habit[] {
	return habits.filter((h) => !isHabitDeleted(h));
}

/** Habitudes actives uniquement (US-027 scénario 1) — la liste « principale » de l'écran
 * Habitudes, séparée de la section « En pause / Supprimées ». */
export function activeHabits(habits: Habit[]): Habit[] {
	return habits.filter((h) => isHabitActive(h));
}

/** Habitudes en pause ou supprimées (US-027 scénario 1), regroupées dans une section dédiée
 * de l'écran Habitudes — distinguées visuellement en scénario 2 via leur statut respectif. */
export function pausedOrDeletedHabits(habits: Habit[]): Habit[] {
	return habits.filter((h) => isHabitPaused(h) || isHabitDeleted(h));
}

/**
 * Une habitude en pause est due pour une reprise automatique (US-027 scénario 4) : une date de
 * reprise est programmée et déjà atteinte (`today >= resumeAt`). Ne concerne jamais les
 * habitudes supprimées (US-013) — pas de restauration automatique pour celles-ci.
 */
export function isDueForAutoResume(habit: Habit, today: IsoDate): boolean {
	return isHabitPaused(habit) && habit.resumeAt !== undefined && habit.resumeAt <= today;
}

/** Libellé lisible d'une fréquence, pour l'affichage dans la liste des habitudes. */
export function describeFrequency(frequency: Frequency): string {
	if (frequency.kind === 'interval') {
		return frequency.days === 1 ? 'Tous les jours' : `Tous les ${frequency.days} jours`;
	}
	if (frequency.kind === 'monthdays') {
		// US-032 scénarios 1/2 : quantièmes toujours énumérés en ordre croissant, quel que soit
		// l'ordre de cochage dans le formulaire.
		const days = sortedUniqueMonthDays(frequency.monthdays);
		if (days.length === 0) return 'Aucun jour sélectionné';
		const article = days.length === 1 ? 'Le' : 'Les';
		return `${article} ${joinFr(days.map(monthDayLabel))} de chaque mois`;
	}
	if (frequency.weekdays.length === 0) return 'Aucun jour sélectionné';
	return WEEKDAY_ORDER.filter((d) => frequency.weekdays.includes(d))
		.map(weekdayLabel)
		.join(', ');
}
