import { fontOptionById, googleFontsStylesheetUrl, type FontChoice } from '$lib/domain/fonts';

/**
 * Client d'application de la police choisie — côté navigateur uniquement (touche le DOM),
 * même patron que `$lib/push/client` : effets de bord isolés hors de `domain`/`stores`.
 *
 * Exception documentée à ADR-001 (« aucun appel réseau hors micro-scheduler ») : le
 * chargement d'une police Google Fonts est un appel à un CDN de polices statique, pas à un
 * backend applicatif, et a été explicitement approuvé par l'utilisateur dans US-016 malgré
 * la dépendance réseau qu'il introduit. Aucune donnée personnelle ne transite : seule une
 * requête anonyme de feuille de style/police est envoyée à `fonts.googleapis.com`.
 *
 * Repli hors-ligne : chaque `cssFontFamily` du catalogue (`$lib/domain/fonts`) empile
 * toujours la pile système en dernier repli — si la police Google Fonts n'a pas pu être
 * chargée (jamais utilisée en ligne, ou hors-ligne sans cache), le navigateur bascule seul
 * dessus via le mécanisme CSS standard, sans code supplémentaire nécessaire ici.
 */

const LINK_ID = 'tracker-google-fonts';

/**
 * Injecte (une seule fois, idempotent) la feuille de style combinée de toutes les polices
 * Google Fonts du catalogue, pour que chaque option du sélecteur (US-016 scénario « liste »)
 * puisse s'afficher avec son propre rendu, et que la police effectivement choisie soit
 * disponible.
 */
export function ensureGoogleFontsLoaded(): void {
	if (typeof document === 'undefined') return;
	if (document.getElementById(LINK_ID)) return;

	const link = document.createElement('link');
	link.id = LINK_ID;
	link.rel = 'stylesheet';
	link.href = googleFontsStylesheetUrl();
	document.head.appendChild(link);
}

/**
 * Applique la police choisie à toute l'application (US-016 scénario 3 : bascule immédiate,
 * sans rechargement) en mettant à jour la variable CSS centralisée `--font-family`
 * (`app.css`, dans l'esprit de la centralisation des couleurs US-009). Charge la feuille de
 * style Google Fonts si nécessaire.
 */
export function applyFontChoice(choice: FontChoice): void {
	if (typeof document === 'undefined') return;
	const option = fontOptionById(choice);
	document.documentElement.style.setProperty('--font-family', option.cssFontFamily);
	if (option.googleFontFamily) {
		ensureGoogleFontsLoaded();
	}
}
