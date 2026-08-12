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
