import type { ColorThresholds, ReminderSettings, WeeklyReviewSettings } from '$lib/domain/types';
import { DEFAULT_THRESHOLDS } from '$lib/domain/summary';
import { DEFAULT_FONT_CHOICE, type FontChoice } from '$lib/domain/fonts';
import { idbRepositories, type SettingsRepository } from '$lib/data/repositories';

/**
 * État partagé des réglages PERSISTÉS (Svelte 5 runes) : seuils de couleur (US-005/US-006),
 * réglages de rappel (heure, activation, fuseau — US-007) et de revue hebdomadaire poussée
 * (US-028). Ce store ne gère QUE les préférences enregistrées ; l'orchestration runtime du push
 * (permission, souscription, synchronisation de la fenêtre) vit dans `reminders.store` pour
 * séparer prefs et état device.
 */
export class SettingsStore {
	#repo: SettingsRepository;
	reminder = $state<ReminderSettings | null>(null);
	/** Réglages de la revue hebdomadaire poussée (US-028), indépendants du rappel quotidien. */
	weeklyReview = $state<WeeklyReviewSettings | null>(null);
	thresholds = $state<ColorThresholds>({ ...DEFAULT_THRESHOLDS });
	/** Police de caractères choisie (US-016) — `DEFAULT_FONT_CHOICE` (US-020 : Dancing Script) tant
	 * que rien n'a été choisi explicitement. */
	fontChoice = $state<FontChoice>(DEFAULT_FONT_CHOICE);
	loaded = $state(false);

	constructor(repo: SettingsRepository = idbRepositories.settings) {
		this.#repo = repo;
	}

	async load() {
		[this.reminder, this.thresholds, this.fontChoice, this.weeklyReview] = await Promise.all([
			this.#repo.getReminderSettings(),
			this.#repo.getColorThresholds(),
			this.#repo.getFontChoice(),
			this.#repo.getWeeklyReviewSettings()
		]);
		this.loaded = true;
	}

	/** Enregistre les réglages de rappel (US-007). Ne (re)synchronise pas le push : voir reminders.store. */
	async saveReminder(settings: ReminderSettings) {
		this.reminder = settings;
		// Dé-proxifier avant persistance : si l'appelant réinjecte un objet issu d'un champ
		// $state (ex. `this.reminder` relu ailleurs), il ne doit pas atteindre idb-keyval tel
		// quel (structuredClone rejette les Proxy réactifs — voir BUG-001).
		await this.#repo.saveReminderSettings($state.snapshot(settings));
	}

	/** Enregistre les réglages de revue hebdomadaire (US-028). Ne (re)synchronise pas le push :
	 * voir reminders.store, même patron que `saveReminder`. */
	async saveWeeklyReview(settings: WeeklyReviewSettings) {
		this.weeklyReview = settings;
		await this.#repo.saveWeeklyReviewSettings($state.snapshot(settings));
	}

	/** Enregistre les seuils de couleur (US-006). La validation métier est dans `domain/summary`. */
	async saveThresholds(thresholds: ColorThresholds) {
		this.thresholds = thresholds;
		await this.#repo.saveColorThresholds($state.snapshot(thresholds));
	}

	/** Enregistre la police choisie (US-016) et l'applique immédiatement (voir `$lib/fonts/client`). */
	async saveFontChoice(choice: FontChoice) {
		this.fontChoice = choice;
		await this.#repo.saveFontChoice(choice);
	}
}

/** Instance unique partagée par l'app. */
export const settingsStore = new SettingsStore();
