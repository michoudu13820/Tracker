/**
 * Détection de l'état de connexion, côté application (US-040 scénario 7).
 *
 * Volontairement minimal : l'app n'affiche **aucun indicateur global** en ligne / hors ligne
 * (arbitrage produit du 2026-08-16, tracé dans US-040). Ces helpers servent uniquement à décider
 * si une action qui a besoin du serveur doit être mise en attente, et à savoir quand la rejouer.
 *
 * `navigator.onLine` est une heuristique — il dit « une interface réseau est active », pas
 * « le serveur est joignable ». C'est suffisant ici car il n'est jamais consulté seul : on ne
 * l'interroge qu'**après** l'échec d'une requête, pour distinguer « hors ligne, à rejouer » de
 * « en ligne mais le serveur a refusé, à signaler ».
 */

/** Vrai si l'appareil se déclare sans réseau. Faux dès que l'information n'est pas disponible. */
export function isOffline(): boolean {
	return typeof navigator !== 'undefined' && navigator.onLine === false;
}

/**
 * Exécute `handler` à chaque retour de la connexion. Retourne la fonction de désabonnement.
 * No-op (et désabonnement no-op) hors navigateur, pour rester appelable en test et au prérendu.
 */
export function onReconnect(handler: () => void): () => void {
	if (typeof window === 'undefined') return () => {};
	window.addEventListener('online', handler);
	return () => window.removeEventListener('online', handler);
}
