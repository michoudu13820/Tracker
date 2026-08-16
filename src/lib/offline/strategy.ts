/**
 * Stratégie de réponse du service worker hors connexion (US-040).
 *
 * Extraite du service worker lui-même pour être **testable sans navigateur** : le SW ne fait
 * qu'injecter ses accès réels (Cache API, `fetch`) via `OfflineDeps`, toute la décision vit ici.
 *
 * Invariant central, à ne jamais casser (c'est la cause de BUG-002) : **chaque fonction retourne
 * toujours un `Response`**, jamais `undefined` et jamais une promesse rejetée. Un `respondWith()`
 * qui reçoit autre chose qu'un `Response` produit
 * `FetchEvent.respondWith received an error: Returned response is null`, que Safari traduit par
 * « Safari ne peut pas ouvrir la page ».
 */

/**
 * Écran de repli affiché quand une navigation ne peut aboutir ni par le cache ni par le réseau
 * (US-040 scénario 5). C'est une route normale de l'app, donc prérendue et précachée comme les
 * autres — elle est disponible hors ligne sans traitement particulier.
 */
export const OFFLINE_FALLBACK_PATH = '/hors-ligne';

/** Accès à l'environnement du service worker, injectés pour rendre la stratégie testable. */
export interface OfflineDeps {
	/** Cherche dans le cache la réponse exactement associée à cette requête. */
	matchCache(request: Request): Promise<Response | undefined>;
	/** Cherche dans le cache la réponse associée à un chemin donné (ex. l'écran de repli). */
	matchPath(path: string): Promise<Response | undefined>;
	/** Va au réseau. Rejette si l'appareil est hors ligne. */
	fetchNetwork(request: Request): Promise<Response>;
}

/**
 * Liste des ressources à précacher à l'installation du service worker.
 *
 * `prerendered` est l'ajout décisif de US-040 : `build` (bundle JS/CSS) et `files` (contenu de
 * `static/`) ne contiennent **aucune page HTML**. Sans les routes prérendues, toute navigation
 * hors ligne partait au réseau et échouait — c'est très exactement BUG-002.
 *
 * Dédoublonné en conservant l'ordre : une même ressource peut apparaître dans deux listes.
 */
export function buildPrecacheList(
	build: readonly string[],
	files: readonly string[],
	prerendered: readonly string[]
): string[] {
	return [...new Set([...build, ...files, ...prerendered])];
}

/**
 * Réponse à une requête de **navigation** (ouverture de l'app, rechargement, lien direct vers un
 * écran) — US-040 scénarios 1, 2 et 4.
 *
 * Cache d'abord : le précache est versionné par déploiement, donc une page en cache est toujours
 * celle de la version installée. On sert la page **réellement demandée**, jamais une page fixe :
 * c'est ce qui répare le scénario 4, où l'ancien repli renvoyait systématiquement le planning
 * quelle que soit la route ouverte.
 */
export async function respondToNavigation(
	request: Request,
	deps: OfflineDeps
): Promise<Response> {
	const cached = await deps.matchCache(request);
	if (cached) return cached;

	try {
		return await deps.fetchNetwork(request);
	} catch {
		// Ni cache ni réseau : écran de repli explicite plutôt qu'une erreur de navigateur.
		const fallback = await deps.matchPath(OFFLINE_FALLBACK_PATH);
		return fallback ?? inlineOfflinePage();
	}
}

/**
 * Réponse à une requête de **sous-ressource** (JS, CSS, image, police locale) — même stratégie
 * cache-first, mais sans écran de repli : une sous-ressource manquante ne doit pas renvoyer du
 * HTML. On renvoie un 503 explicite, que le navigateur traite comme un échec de chargement
 * ordinaire, au lieu de laisser la promesse se rejeter.
 */
export async function respondToAsset(request: Request, deps: OfflineDeps): Promise<Response> {
	const cached = await deps.matchCache(request);
	if (cached) return cached;

	try {
		return await deps.fetchNetwork(request);
	} catch {
		return unavailableResponse();
	}
}

/**
 * Dernier filet : page de repli minimale, servie uniquement si même l'écran `/hors-ligne` n'est
 * pas en cache (installation interrompue, cache purgé par iOS). Volontairement autonome — ni CSS,
 * ni JS, ni image — pour ne dépendre d'aucune ressource qui pourrait manquer elle aussi.
 *
 * Statut 200 délibéré : plusieurs navigateurs remplacent le corps d'une réponse 5xx par leur
 * propre page d'erreur, ce que le scénario 5 interdit précisément.
 */
function inlineOfflinePage(): Response {
	const html = `<!doctype html>
<html lang="fr">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Hors connexion — Tracker</title>
<body style="font-family: system-ui, sans-serif; margin: 0; padding: 2rem; line-height: 1.5;">
<h1 style="font-size: 1.25rem;">Contenu non disponible hors connexion</h1>
<p>Cette page n'a pas encore été enregistrée sur cet appareil.</p>
<p><a href="/">Revenir au planning</a></p>
</body>
</html>`;
	return new Response(html, {
		status: 200,
		headers: { 'content-type': 'text/html; charset=utf-8' }
	});
}

/** Échec de sous-ressource, exprimé comme une vraie réponse HTTP plutôt qu'un rejet. */
function unavailableResponse(): Response {
	return new Response('', { status: 503, statusText: 'Hors connexion' });
}
