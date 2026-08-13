// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { SettingsStore } from './settings.store.svelte';
import type { ColorThresholds, ReminderSettings, WeeklyReviewSettings } from '$lib/domain/types';
import { DEFAULT_FONT_CHOICE, type FontChoice } from '$lib/domain/fonts';
import type { SettingsRepository } from '$lib/data/repositories';

/**
 * Régression BUG-001 (même patron que HabitsStore/TasksStore/CompletionsStore) :
 * `saveReminder()`/`saveThresholds()` assignent d'abord l'argument à un champ `$state`
 * (`this.reminder`/`this.thresholds`), qui devient alors un Proxy réactif. Si cette valeur
 * relue depuis le store (ex. un appelant qui ré-enregistre `store.thresholds` après une
 * première sauvegarde) est repassée telle quelle à une sauvegarde ultérieure, elle doit
 * rester dé-proxifiée avant d'atteindre le repository — sinon `structuredClone`
 * (idb-keyval/IndexedDB) rejette le Proxy avec un `DataCloneError`.
 */
function fakeRepo(): SettingsRepository & {
	savedReminders: ReminderSettings[];
	savedThresholds: ColorThresholds[];
	savedFontChoices: FontChoice[];
	savedWeeklyReviews: WeeklyReviewSettings[];
} {
	const savedReminders: ReminderSettings[] = [];
	const savedThresholds: ColorThresholds[] = [];
	const savedFontChoices: FontChoice[] = [];
	const savedWeeklyReviews: WeeklyReviewSettings[] = [];
	return {
		savedReminders,
		savedThresholds,
		savedFontChoices,
		savedWeeklyReviews,
		async getReminderSettings() {
			return { enabled: false, time: '08:00', timezone: 'Europe/Paris' };
		},
		async saveReminderSettings(s) {
			savedReminders.push(structuredClone(s));
		},
		async getColorThresholds() {
			return { green: 80, yellow: 50 };
		},
		async saveColorThresholds(t) {
			savedThresholds.push(structuredClone(t));
		},
		async getFontChoice() {
			return 'system';
		},
		async saveFontChoice(choice) {
			savedFontChoices.push(choice);
		},
		async getWeeklyReviewSettings() {
			return { enabled: false, weekday: 0, time: '18:00' };
		},
		async saveWeeklyReviewSettings(s) {
			savedWeeklyReviews.push(structuredClone(s));
		}
	};
}

describe('SettingsStore (régression BUG-001)', () => {
	it('re-sauvegarder les seuils lus depuis le store (Proxy $state) ne provoque pas de DataCloneError', async () => {
		const repo = fakeRepo();
		const store = new SettingsStore(repo);

		await store.saveThresholds({ green: 80, yellow: 50 });
		// `store.thresholds` est maintenant un Proxy $state réactif : un appelant qui le
		// relit et le repasse à saveThresholds reproduit le scénario à risque.
		await expect(store.saveThresholds(store.thresholds)).resolves.toBeUndefined();

		expect(repo.savedThresholds).toHaveLength(2);
		expect(repo.savedThresholds[1]).toEqual({ green: 80, yellow: 50 });
	});

	it('re-sauvegarder les réglages de rappel lus depuis le store (Proxy $state) ne provoque pas de DataCloneError', async () => {
		const repo = fakeRepo();
		const store = new SettingsStore(repo);
		const settings: ReminderSettings = { enabled: true, time: '09:00', timezone: 'Europe/Paris' };

		await store.saveReminder(settings);
		await expect(store.saveReminder(store.reminder!)).resolves.toBeUndefined();

		expect(repo.savedReminders).toHaveLength(2);
		expect(repo.savedReminders[1]).toEqual(settings);
	});
});

describe('SettingsStore.weeklyReview (US-028)', () => {
	it('charge les réglages de revue hebdomadaire (indépendants du rappel quotidien)', async () => {
		const repo = fakeRepo();
		const store = new SettingsStore(repo);

		await store.load();

		expect(store.weeklyReview).toEqual({ enabled: false, weekday: 0, time: '18:00' });
	});

	it('enregistre et reflète immédiatement les réglages de revue hebdomadaire', async () => {
		const repo = fakeRepo();
		const store = new SettingsStore(repo);
		const settings: WeeklyReviewSettings = { enabled: true, weekday: 0, time: '18:00' };

		await store.saveWeeklyReview(settings);

		expect(store.weeklyReview).toEqual(settings);
		expect(repo.savedWeeklyReviews).toEqual([settings]);
	});

	it('re-sauvegarder les réglages lus depuis le store (Proxy $state) ne provoque pas de DataCloneError', async () => {
		const repo = fakeRepo();
		const store = new SettingsStore(repo);
		await store.saveWeeklyReview({ enabled: true, weekday: 3, time: '19:30' });

		await expect(store.saveWeeklyReview(store.weeklyReview!)).resolves.toBeUndefined();

		expect(repo.savedWeeklyReviews).toHaveLength(2);
	});
});

describe('SettingsStore.fontChoice (US-016, défaut mis à jour par US-020)', () => {
	it("l'état initial en mémoire (avant tout chargement) correspond à DEFAULT_FONT_CHOICE (US-020 : Dancing Script)", () => {
		const store = new SettingsStore(fakeRepo());

		expect(store.fontChoice).toBe(DEFAULT_FONT_CHOICE);
		expect(store.fontChoice).toBe('dancing-script');
	});

	it("reflète la valeur retournée par le repository après chargement (le repository, pas le store, décide de la valeur par défaut)", async () => {
		const repo = fakeRepo();
		const store = new SettingsStore(repo);

		await store.load();

		expect(store.fontChoice).toBe('system');
	});

	it('enregistre et reflète immédiatement la police choisie', async () => {
		const repo = fakeRepo();
		const store = new SettingsStore(repo);

		await store.saveFontChoice('inter');

		expect(store.fontChoice).toBe('inter');
		expect(repo.savedFontChoices).toEqual(['inter']);
	});

	it('réinitialise vers une police explicite (ex. système, scénario reset générique US-016)', async () => {
		const repo = fakeRepo();
		const store = new SettingsStore(repo);
		await store.saveFontChoice('poppins');

		await store.saveFontChoice('system');

		expect(store.fontChoice).toBe('system');
		expect(repo.savedFontChoices).toEqual(['poppins', 'system']);
	});

	it('réinitialise vers Dancing Script, nouvelle police par défaut (US-020 scénario reset)', async () => {
		const repo = fakeRepo();
		const store = new SettingsStore(repo);
		await store.saveFontChoice('quicksand');

		await store.saveFontChoice(DEFAULT_FONT_CHOICE);

		expect(store.fontChoice).toBe('dancing-script');
		expect(repo.savedFontChoices).toEqual(['quicksand', 'dancing-script']);
	});
});
