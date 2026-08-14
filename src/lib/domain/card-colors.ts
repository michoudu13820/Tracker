/**
 * Palette de couleurs de carte (US-036) — **liste fermée**, partagée telle quelle par les
 * habitudes (US-036) et les tâches ponctuelles (US-037). Aucun sélecteur libre, aucune roue
 * chromatique, aucune saisie hexadécimale : seules ces teintes existent.
 *
 * Ce module ne contient **aucune valeur de couleur** : les teintes vivent exclusivement dans
 * `src/app.css` (source de vérité unique d'US-009/US-029), sous forme de paires de variables
 * `--tint-<teinte>-bg` / `--tint-<teinte>-border` déclinées en mode clair ET sombre. Ici on ne
 * manipule que l'**identifiant** de la teinte et le nom des variables à consommer.
 */

/** Identifiant d'une teinte de la palette fermée (US-036 scénario 1). */
export type CardColor = 'lavande' | 'rose' | 'peche' | 'sable' | 'menthe' | 'ciel' | 'bleu' | 'gris';

/**
 * Teintes proposées, dans l'ordre d'affichage du sélecteur. 8 teintes = borne haute du cardinal
 * figé par l'US (6 à 8). La teinte par défaut ouvre la liste.
 */
export const CARD_COLORS: readonly CardColor[] = [
	'lavande',
	'rose',
	'peche',
	'sable',
	'menthe',
	'ciel',
	'bleu',
	'gris'
] as const;

/**
 * Teinte par défaut (US-036 décision PO) : le violet lavande actuel. Une habitude/tâche sans
 * couleur choisie (`color === undefined`, cas de tout l'existant persisté) s'affiche exactement
 * comme avant l'introduction de cette palette — `--tint-lavande-*` reprend précisément
 * `--surface` / `--habit-border`.
 */
export const DEFAULT_CARD_COLOR: CardColor = 'lavande';

const CARD_COLOR_LABELS: Record<CardColor, string> = {
	lavande: 'Lavande',
	rose: 'Rose',
	peche: 'Pêche',
	sable: 'Sable',
	menthe: 'Menthe',
	ciel: 'Ciel',
	bleu: 'Bleu',
	gris: 'Gris'
};

/** Libellé lisible d'une teinte (US-036 scénario 1 : jamais une pastille colorée seule). */
export function cardColorLabel(color: CardColor): string {
	return CARD_COLOR_LABELS[color];
}

/** Une valeur persistée est-elle une teinte connue de la palette fermée ? */
export function isCardColor(value: unknown): value is CardColor {
	return typeof value === 'string' && (CARD_COLORS as readonly string[]).includes(value);
}

/**
 * Teinte effective d'un élément (US-036 scénarios 3/4) : `undefined` — cas de tout l'existant
 * persisté avant cette évolution — vaut la teinte par défaut. Une valeur inconnue (donnée
 * corrompue, export d'une version future) retombe aussi sur le défaut plutôt que de casser
 * l'affichage. **Aucune migration** : la valeur n'est jamais réécrite en base.
 */
export function resolveCardColor(color?: string): CardColor {
	return isCardColor(color) ? color : DEFAULT_CARD_COLOR;
}

/**
 * Style inline à poser sur une carte : ne fait que **brancher** les deux variables CSS que les
 * composants de carte consomment (`--card-tint` pour le fond, `--card-accent` pour le liseré
 * gauche d'US-010). Aucune couleur en dur ne quitte `app.css` — le thème clair/sombre reste
 * arbitré par le `@media (prefers-color-scheme: dark)` d'US-029, sans code conditionnel côté JS.
 */
export function cardColorStyle(color?: string): string {
	const tint = resolveCardColor(color);
	return `--card-tint: var(--tint-${tint}-bg); --card-accent: var(--tint-${tint}-border);`;
}

/**
 * Valeur à persister à partir de la sélection du formulaire (US-036 scénario 6) : la teinte par
 * défaut n'est **pas** persistée, pour qu'un élément explicitement remis en « Lavande » soit
 * strictement indiscernable d'un élément n'ayant jamais eu de couleur (même objet, mêmes champs).
 */
export function cardColorToPersist(color: CardColor): CardColor | undefined {
	return color === DEFAULT_CARD_COLOR ? undefined : color;
}
