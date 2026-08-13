// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { HabitsStore } from './habits.store.svelte';
import type { Habit } from '$lib/domain/types';
import type { HabitsRepository } from '$lib/data/repositories';

/**
 * Régression BUG-001 : une habitude fraîchement créée disparaissait du planning (`/`) car
 * `upsert()` passait le tableau `$state` (donc des Proxy réactifs) directement à
 * `repo.saveAll()`. En production, `idb-keyval.set()` utilise `structuredClone` en interne
 * (via `IDBObjectStore.put`), qui rejette les Proxy avec `DataCloneError` — la promesse de
 * sauvegarde échouait silencieusement (« Uncaught (in promise) »), donc IndexedDB ne
 * contenait jamais le nouvel élément malgré son affichage en mémoire.
 *
 * Le repository de test ci-dessous appelle `structuredClone` avant de "sauvegarder", pour
 * reproduire fidèlement ce point de rupture sans dépendre d'IndexedDB réelle.
 *
 * Nécessite l'environnement `jsdom` (et non `node`, le défaut pour domain/data) : sous
 * Vitest en environnement `node`, Svelte compile `$state` en no-op côté SSR (aucun Proxy
 * créé), ce qui masquerait entièrement le bug — voir investigation BUG-001.
 */
function fakeRepo(): HabitsRepository & { saved: Habit[][] } {
	const saved: Habit[][] = [];
	return {
		saved,
		async getAll() {
			return [];
		},
		async saveAll(habits) {
			// Mime le comportement réel d'idb-keyval/IndexedDB : rejette les Proxy réactifs.
			saved.push(structuredClone(habits));
		}
	};
}

const habit: Habit = {
	id: 'h1',
	name: "Boire de l'eau",
	emoji: '💧',
	frequency: { kind: 'interval', days: 1, anchor: '2026-08-12' },
	createdAt: '2026-08-12'
};

describe('HabitsStore.upsert (régression BUG-001)', () => {
	it('persiste une habitude fraîchement créée sans DataCloneError', async () => {
		const repo = fakeRepo();
		const store = new HabitsStore(repo);

		await expect(store.upsert(habit)).resolves.toBeUndefined();

		expect(repo.saved).toHaveLength(1);
		expect(repo.saved[0]).toEqual([habit]);
	});
});

describe('HabitsStore.remove / setStatus (US-013 suppression, mécanisme réutilisé par US-015)', () => {
	it('marque une habitude comme supprimée sans la retirer du repository (soft-delete)', async () => {
		const repo = fakeRepo();
		const store = new HabitsStore(repo);
		await store.upsert(habit);

		await store.remove(habit.id);

		expect(store.habits).toHaveLength(1);
		expect(store.habits[0].status).toBe('deleted');
		expect(repo.saved.at(-1)).toEqual([{ ...habit, status: 'deleted' }]);
	});

	it('ne fait rien si l\'habitude ciblée est introuvable', async () => {
		const repo = fakeRepo();
		const store = new HabitsStore(repo);
		await store.upsert(habit);

		await store.remove('inconnu');

		expect(store.habits[0].status).toBeUndefined();
	});

	it('setStatus bascule vers un statut arbitraire (réutilisé par la pause US-015)', async () => {
		const repo = fakeRepo();
		const store = new HabitsStore(repo);
		await store.upsert(habit);

		await store.setStatus(habit.id, 'paused');
		expect(store.habits[0].status).toBe('paused');

		await store.setStatus(habit.id, 'active');
		expect(store.habits[0].status).toBe('active');
	});
});

describe('HabitsStore — date de reprise automatique (US-027)', () => {
	it('setResumeAt programme une date de reprise sur une habitude en pause (scénario 3)', async () => {
		const repo = fakeRepo();
		const store = new HabitsStore(repo);
		await store.upsert(habit);
		await store.setStatus(habit.id, 'paused');

		await store.setResumeAt(habit.id, '2026-09-01');

		expect(store.habits[0].resumeAt).toBe('2026-09-01');
		expect(store.habits[0].status).toBe('paused');
	});

	it('setResumeAt ne fait rien si l\'habitude ciblée n\'est pas en pause', async () => {
		const repo = fakeRepo();
		const store = new HabitsStore(repo);
		await store.upsert(habit);

		await store.setResumeAt(habit.id, '2026-09-01');

		expect(store.habits[0].resumeAt).toBeUndefined();
	});

	it('setResumeAt(undefined) retire la date de reprise (scénario 5)', async () => {
		const repo = fakeRepo();
		const store = new HabitsStore(repo);
		await store.upsert(habit);
		await store.setStatus(habit.id, 'paused');
		await store.setResumeAt(habit.id, '2026-09-01');

		await store.setResumeAt(habit.id, undefined);

		expect(store.habits[0].resumeAt).toBeUndefined();
		expect(store.habits[0].status).toBe('paused');
	});

	it('setStatus retire toute date de reprise en quittant la pause (réactivation manuelle ou suppression)', async () => {
		const repo = fakeRepo();
		const store = new HabitsStore(repo);
		await store.upsert(habit);
		await store.setStatus(habit.id, 'paused');
		await store.setResumeAt(habit.id, '2026-09-01');

		await store.setStatus(habit.id, 'active');

		expect(store.habits[0].resumeAt).toBeUndefined();
	});

	it('applyAutoResume réactive les habitudes dont la date de reprise est atteinte (scénario 4)', async () => {
		const repo = fakeRepo();
		const store = new HabitsStore(repo);
		const dueHabit = { ...habit, id: 'h2' };
		await store.upsert(habit);
		await store.upsert(dueHabit);
		await store.setStatus(habit.id, 'paused');
		await store.setStatus(dueHabit.id, 'paused');
		await store.setResumeAt(habit.id, '2026-09-01'); // pas encore atteinte
		await store.setResumeAt(dueHabit.id, '2026-08-01'); // déjà atteinte

		await store.applyAutoResume('2026-08-15');

		expect(store.habits.find((h) => h.id === habit.id)?.status).toBe('paused');
		expect(store.habits.find((h) => h.id === dueHabit.id)?.status).toBe('active');
		expect(store.habits.find((h) => h.id === dueHabit.id)?.resumeAt).toBeUndefined();
	});

	it("applyAutoResume ne touche pas une habitude en pause sans date de reprise", async () => {
		const repo = fakeRepo();
		const store = new HabitsStore(repo);
		await store.upsert(habit);
		await store.setStatus(habit.id, 'paused');

		await store.applyAutoResume('2026-08-15');

		expect(store.habits[0].status).toBe('paused');
	});
});
