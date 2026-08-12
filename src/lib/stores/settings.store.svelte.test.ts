// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { SettingsStore } from './settings.store.svelte';
import type { ColorThresholds, ReminderSettings } from '$lib/domain/types';
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
} {
	const savedReminders: ReminderSettings[] = [];
	const savedThresholds: ColorThresholds[] = [];
	return {
		savedReminders,
		savedThresholds,
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
