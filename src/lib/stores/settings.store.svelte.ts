import type { ColorThresholds, ReminderSettings } from '$lib/domain/types';
import { DEFAULT_THRESHOLDS } from '$lib/domain/summary';
import { idbRepositories, type SettingsRepository } from '$lib/data/repositories';

/**
 * État partagé des réglages PERSISTÉS (Svelte 5 runes) : seuils de couleur (US-005/US-006)
 * et réglages de rappel (heure, activation, fuseau — US-007). Ce store ne gère QUE les
 * préférences enregistrées ; l'orchestration runtime du push (permission, souscription,
 * synchronisation de la fenêtre) vit dans `reminders.store` pour séparer prefs et état device.
 */
export class SettingsStore {
	#repo: SettingsRepository;
	reminder = $state<ReminderSettings | null>(null);
	thresholds = $state<ColorThresholds>({ ...DEFAULT_THRESHOLDS });
	loaded = $state(false);

	constructor(repo: SettingsRepository = idbRepositories.settings) {
		this.#repo = repo;
	}

	async load() {
		[this.reminder, this.thresholds] = await Promise.all([
			this.#repo.getReminderSettings(),
			this.#repo.getColorThresholds()
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

	/** Enregistre les seuils de couleur (US-006). La validation métier est dans `domain/summary`. */
	async saveThresholds(thresholds: ColorThresholds) {
		this.thresholds = thresholds;
		await this.#repo.saveColorThresholds($state.snapshot(thresholds));
	}
}

/** Instance unique partagée par l'app. */
export const settingsStore = new SettingsStore();
