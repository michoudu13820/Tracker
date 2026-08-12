import type { Frequency, IsoDate, Weekday } from './types';

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
}

export interface HabitValidation {
	valid: boolean;
	errors: string[];
}

/** Brouillon vide, point de départ d'une création (US-001 scénario 1/2). */
export function emptyHabitDraft(): HabitDraft {
	return { name: '', emoji: '', frequencyMode: null, intervalDays: null, weekdays: [] };
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
