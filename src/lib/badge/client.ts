/**
 * Client du badge d'icône PWA — côté navigateur (US-031).
 *
 * Repose sur l'App Badging API (`navigator.setAppBadge()` / `clearAppBadge()`). Son support en
 * PWA **standalone installée sur l'écran d'accueil iOS Safari n'est PAS garanti** et n'a pas pu
 * être validé automatiquement (non simulable en CI) — voir les notes de l'US et le rapport de
 * livraison. Principe non négociable appliqué ici : **détection de fonctionnalité systématique**
 * et **dégradation silencieuse** si l'API est absente ou échoue — jamais d'erreur visible,
 * jamais de log bruyant, jamais de régression du reste de l'app.
 */

/** Type minimal de l'extension navigateur (absente des types TS DOM standard à ce jour). */
type NavigatorWithBadging = Navigator & {
	setAppBadge?: (contents?: number) => Promise<void>;
	clearAppBadge?: () => Promise<void>;
};

function navigatorWithBadging(): NavigatorWithBadging | null {
	return typeof navigator === 'undefined' ? null : (navigator as NavigatorWithBadging);
}

/** L'API de badge est-elle disponible sur ce navigateur ? Simple lecture, jamais d'effet de bord. */
export function isBadgingSupported(): boolean {
	const nav = navigatorWithBadging();
	return !!nav && typeof nav.setAppBadge === 'function';
}

/** Affiche `count` sur l'icône (US-031 scénario 1). No-op silencieux si non supporté ou en échec. */
export async function setBadge(count: number): Promise<void> {
	const nav = navigatorWithBadging();
	if (!nav?.setAppBadge) return;
	try {
		await nav.setAppBadge(count);
	} catch {
		// Dégradation silencieuse assumée (US-031) : aucune erreur visible ni log bruyant.
	}
}

/** Retire le badge (US-031 scénario 2 : plus rien à faire). No-op silencieux si non supporté. */
export async function clearBadge(): Promise<void> {
	const nav = navigatorWithBadging();
	if (!nav?.clearAppBadge) return;
	try {
		await nav.clearAppBadge();
	} catch {
		// Dégradation silencieuse assumée (US-031).
	}
}

/** Interface du client badge, pour injection dans `BadgeStore` (mockable en test — même patron
 * que `$lib/push/client`, voir CONVENTIONS.md et `create-store`). */
export interface BadgeClient {
	isBadgingSupported(): boolean;
	setBadge(count: number): Promise<void>;
	clearBadge(): Promise<void>;
}

/** Implémentation réelle (navigateur), utilisée par défaut par `BadgeStore`. */
export const defaultBadgeClient: BadgeClient = {
	isBadgingSupported,
	setBadge,
	clearBadge
};
