import type { HabitProgress, IsoDate } from './types';

/**
 * Domaine de la progression quotidienne d'une habitude à cible chiffrée (US-018). Une seule
 * valeur cumulée par (habitId, date), qui repart implicitement à 0 chaque jour (aucune entrée
 * enregistrée = 0, scénario 1/7). Pas d'historique détaillé des ajouts individuels — hypothèse
 * produit tranchée (voir US-018 notes) : la valeur cumulée est directement corrigible
 * (scénario 9) plutôt que reconstruite depuis un journal d'ajouts.
 *
 * Fonctions pures, sans dépendance au framework ni au stockage — la persistance et
 * l'orchestration (dérivation du statut fait/pas fait) sont déléguées à `CompletionsStore`.
 */

export interface AmountValidation {
	valid: boolean;
	error?: string;
}

const INVALID_AMOUNT_ERROR = 'La quantité doit être un nombre strictement positif.';

/** Parse une saisie utilisateur en nombre, en acceptant la virgule décimale française. */
export function parseAmount(raw: string): number {
	return Number(raw.trim().replace(',', '.'));
}

/** Valide une saisie de quantité (US-018 scénario 6) : nombre strictement positif obligatoire. */
export function validateAmount(raw: string): AmountValidation {
	const value = parseAmount(raw);
	if (raw.trim() === '' || !Number.isFinite(value) || value <= 0) {
		return { valid: false, error: INVALID_AMOUNT_ERROR };
	}
	return { valid: true };
}

/** Arrondit à 2 décimales pour éviter les artefacts de virgule flottante (ex. 0.2 + 0.3). */
export function roundAmount(n: number): number {
	return Math.round(n * 100) / 100;
}

/** Valeur cumulée du jour pour une habitude (0 par défaut — réinitialisation quotidienne
 * implicite, US-018 scénarios 1/7/8 : chaque jour est une entrée indépendante). */
export function progressValue(progress: HabitProgress[], habitId: string, date: IsoDate): number {
	return progress.find((p) => p.habitId === habitId && p.date === date)?.value ?? 0;
}

/** Pourcentage cumul/cible, sans limite haute (peut dépasser 100 — US-018 scénario 5). */
export function progressPercent(value: number, targetValue: number): number {
	if (targetValue <= 0) return 0;
	return Math.round((value / targetValue) * 100);
}

/** Une habitude à cible chiffrée est « faite » un jour donné dès que le cumul atteint ou
 * dépasse la cible (US-018 scénario 4), sans jamais bloquer la saisie au-delà (scénario 5). */
export function isTargetReached(value: number, targetValue: number): boolean {
	return value >= targetValue;
}
