/**
 * Catalogue des polices proposées à l'utilisateur (US-016, étendu par US-020) — données pures
 * et testables, sans dépendance au framework ni au DOM (l'application effective du CSS/
 * chargement réseau vit dans `$lib/fonts/client`, colocalisée avec les autres modules « client »
 * à effet de bord comme `$lib/push/client`). Liste et choix produit tranchés dans l'US (11
 * options : les 10 de US-016 + Dancing Script, US-020).
 *
 * Chaque `cssFontFamily` empile systématiquement la pile système d'origine en dernier repli :
 * si une police Google Fonts n'est pas chargée (hors-ligne, jamais utilisée en ligne), le
 * navigateur bascule silencieusement dessus sans JS supplémentaire (US-016, critère hors-ligne ;
 * US-020 réutilise ce mécanisme tel quel pour Dancing Script, aucun traitement spécial).
 */

export type FontChoice =
	| 'system'
	| 'inter'
	| 'poppins'
	| 'nunito'
	| 'quicksand'
	| 'roboto'
	| 'lato'
	| 'merriweather'
	| 'playfair-display'
	| 'jetbrains-mono'
	| 'dancing-script';

export interface FontOption {
	id: FontChoice;
	label: string;
	/** Pile CSS complète à appliquer, système inclus en repli final. */
	cssFontFamily: string;
	/** Nom de famille attendu par Google Fonts ; absent pour la police système (aucun réseau). */
	googleFontFamily?: string;
}

/** Pile système actuelle de l'app (US-009/US-016) — inchangée, reprise telle quelle
 * (mêmes guillemets simples qu'actuellement dans `app.css`, pour une valeur strictement
 * identique, caractère pour caractère, à l'existant — US-016 scénario 1). */
export const SYSTEM_FONT_STACK = `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;

/**
 * Nouvelle police par défaut (US-020) — remplace `'system'` (US-016). Seule cette constante
 * change : le mécanisme de persistance existant (`SettingsRepository.getFontChoice`, absence de
 * clé stockée = valeur par défaut) suffit nativement à ne jamais écraser un choix explicite déjà
 * fait avant cette US, y compris un choix explicite de `'system'` (voir US-020, critères
 * d'acceptation « non-écrasement »).
 */
export const DEFAULT_FONT_CHOICE: FontChoice = 'dancing-script';

function googleOption(id: FontChoice, label: string, family: string): FontOption {
	return { id, label, cssFontFamily: `'${family}', ${SYSTEM_FONT_STACK}`, googleFontFamily: family };
}

export const FONT_OPTIONS: FontOption[] = [
	// Le libellé ne porte plus la mention « (par défaut) » depuis US-020 : la police système
	// n'est plus la valeur par défaut de l'app, seulement une option parmi d'autres.
	{ id: 'system', label: 'Système', cssFontFamily: SYSTEM_FONT_STACK },
	googleOption('inter', 'Inter', 'Inter'),
	googleOption('poppins', 'Poppins', 'Poppins'),
	googleOption('nunito', 'Nunito', 'Nunito'),
	googleOption('quicksand', 'Quicksand', 'Quicksand'),
	googleOption('roboto', 'Roboto', 'Roboto'),
	googleOption('lato', 'Lato', 'Lato'),
	googleOption('merriweather', 'Merriweather', 'Merriweather'),
	googleOption('playfair-display', 'Playfair Display', 'Playfair Display'),
	googleOption('jetbrains-mono', 'JetBrains Mono', 'JetBrains Mono'),
	// 11ᵉ option (US-020) — nouvelle police par défaut de l'application, cf. libellé marquant.
	googleOption('dancing-script', 'Dancing Script (par défaut)', 'Dancing Script')
];

/** Résout une option par id, avec repli sur la police système si l'id est inconnu (défensif). */
export function fontOptionById(id: FontChoice): FontOption {
	return FONT_OPTIONS.find((option) => option.id === id) ?? FONT_OPTIONS[0];
}

/**
 * URL Google Fonts combinant toutes les familles Google Fonts du catalogue en une seule requête
 * (utilisée pour l'aperçu de chaque option dans le sélecteur, US-016 scénario 2, et pour
 * l'application de la police choisie). Poids 400 (texte) et 600 (titres/boutons, cf. usages
 * `font-weight: 600` déjà présents dans l'app).
 */
export function googleFontsStylesheetUrl(options: FontOption[] = FONT_OPTIONS): string {
	const families = options
		.filter((option): option is FontOption & { googleFontFamily: string } => Boolean(option.googleFontFamily))
		.map((option) => `family=${option.googleFontFamily.replace(/ /g, '+')}:wght@400;600`)
		.join('&');
	return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}
