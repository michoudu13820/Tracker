import type { ColorThresholds } from './types';

export const DEFAULT_THRESHOLDS: ColorThresholds = { green: 80, yellow: 40 };

export type CellColor = 'green' | 'yellow' | 'red';

/**
 * Code couleur du résumé annuel (US-005 / US-006) à partir d'un pourcentage
 * de complétion et des seuils (par défaut vert >= 80, jaune >= 40, rouge sinon).
 */
export function colorFor(percent: number, thresholds: ColorThresholds = DEFAULT_THRESHOLDS): CellColor {
	if (percent >= thresholds.green) return 'green';
	if (percent >= thresholds.yellow) return 'yellow';
	return 'red';
}

/** Valide la cohérence des seuils (US-006, scénario 3). */
export function areThresholdsValid(t: ColorThresholds): boolean {
	const inRange = (n: number) => n >= 0 && n <= 100;
	return inRange(t.green) && inRange(t.yellow) && t.yellow < t.green;
}
