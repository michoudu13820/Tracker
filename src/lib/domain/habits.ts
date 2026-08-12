import type { Frequency, Habit, HabitStatus, HabitTarget, HabitTargetUnit, IsoDate, Weekday } from './types';

/**
 * Cœur métier de la création/édition d'une habitude (US-001) : validation du formulaire
 * et construction de la `Frequency` associée. Fonctions pures et testables, sans dépendance
 * au framework ni au stockage — la couche UI (route `habitudes`) délègue ici la logique.
 */

/** Brouillon de formulaire (avant conversion en `Habit`) : les deux modes de fréquence
 * sont mutuellement exclusifs (US-001 scénario 3), représentés par `frequencyMode`. */
export interface HabitDraft {
	name: string;
	emoji: string;
	frequencyMode: 'interval' | 'weekdays' | null;
	intervalDays: number | null;
	weekdays: Weekday[];
	/** Cible chiffrée optionnelle (US-017 scénario 2) : activation indépendante du reste du
	 * formulaire, valeur + unité mutuellement dépendantes de `hasTarget`. */
	hasTarget: boolean;
	targetValue: number | null;
	targetUnit: HabitTargetUnit;
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
		hasTarget: false,
		targetValue: null,
		targetUnit: 'L'
	};
}

/**
 * Valide un brouillon d'habitude (US-001 scénario 5) : nom obligatoire, et exactement
 * un des deux modes de fréquence renseigné avec une valeur exploitable (intervalle >= 1
 * jour, ou au moins un jour de semaine sélectionné).
 */
export function validateHabitDraft(draft: HabitDraft): HabitValidation {
	const errors: string[] = [];

	if (!draft.name.trim()) {
		errors.push('Le nom est obligatoire.');
	}

	if (!draft.frequencyMode) {
		errors.push('Choisissez un mode de fréquence : intervalle en jours ou jours de la semaine.');
	} else if (draft.frequencyMode === 'interval') {
		if (!draft.intervalDays || draft.intervalDays < 1) {
			errors.push("L'intervalle doit être d'au moins 1 jour.");
		}
	} else if (draft.frequencyMode === 'weekdays') {
		if (draft.weekdays.length === 0) {
			errors.push('Sélectionnez au moins un jour de la semaine.');
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
	// 'interval' (seul autre cas valide après validation).
	return { kind: 'interval', days: draft.intervalDays ?? 1, anchor };
}

/** Reconstruit un brouillon de formulaire à partir d'une fréquence existante (édition). */
export function frequencyToDraft(frequency: Frequency): Pick<HabitDraft, 'frequencyMode' | 'intervalDays' | 'weekdays'> {
	if (frequency.kind === 'interval') {
		return { frequencyMode: 'interval', intervalDays: frequency.days, weekdays: [] };
	}
	return { frequencyMode: 'weekdays', intervalDays: null, weekdays: frequency.weekdays };
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

/** Libellé lisible d'une fréquence, pour l'affichage dans la liste des habitudes. */
export function describeFrequency(frequency: Frequency): string {
	if (frequency.kind === 'interval') {
		return frequency.days === 1 ? 'Tous les jours' : `Tous les ${frequency.days} jours`;
	}
	if (frequency.weekdays.length === 0) return 'Aucun jour sélectionné';
	return WEEKDAY_ORDER.filter((d) => frequency.weekdays.includes(d))
		.map(weekdayLabel)
		.join(', ');
}
