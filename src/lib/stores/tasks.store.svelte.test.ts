// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { TasksStore } from './tasks.store.svelte';
import type { Task } from '$lib/domain/types';
import type { TasksRepository } from '$lib/data/repositories';

/**
 * Régression BUG-001 (même patron que HabitsStore, voir habits.store.svelte.test.ts) :
 * `upsert()` doit dé-proxifier `this.tasks` avant `repo.saveAll()`, sinon `structuredClone`
 * (utilisé en interne par idb-keyval/IndexedDB) rejette les Proxy réactifs `$state` avec un
 * `DataCloneError`, faisant échouer la persistance en silence.
 */
function fakeRepo(): TasksRepository & { saved: Task[][] } {
	const saved: Task[][] = [];
	return {
		saved,
		async getAll() {
			return [];
		},
		async saveAll(tasks) {
			saved.push(structuredClone(tasks));
		}
	};
}

const task: Task = {
	id: 't1',
	name: 'Appeler le plombier',
	date: '2026-08-12',
	createdAt: '2026-08-12'
};

describe('TasksStore.upsert (régression BUG-001)', () => {
	it('persiste une tâche fraîchement créée sans DataCloneError', async () => {
		const repo = fakeRepo();
		const store = new TasksStore(repo);

		await expect(store.upsert(task)).resolves.toBeUndefined();

		expect(repo.saved).toHaveLength(1);
		expect(repo.saved[0]).toEqual([task]);
	});
});

describe('TasksStore.remove (US-014 — soft-delete)', () => {
	it('marque une tâche comme supprimée sans la retirer du repository', async () => {
		const repo = fakeRepo();
		const store = new TasksStore(repo);
		await store.upsert(task);

		await store.remove(task.id);

		expect(store.tasks).toHaveLength(1);
		expect(store.tasks[0].status).toBe('deleted');
		expect(repo.saved.at(-1)).toEqual([{ ...task, status: 'deleted' }]);
	});

	it("n'inclut plus une tâche supprimée dans onDate (scénario 3)", async () => {
		const repo = fakeRepo();
		const store = new TasksStore(repo);
		await store.upsert(task);
		await store.remove(task.id);

		expect(store.onDate(task.date)).toEqual([]);
	});

	it("ne fait rien si la tâche ciblée est introuvable", async () => {
		const repo = fakeRepo();
		const store = new TasksStore(repo);
		await store.upsert(task);

		await store.remove('inconnu');

		expect(store.tasks[0].status).toBeUndefined();
	});
});

/**
 * US-037 scénario 4 — rétro-compatibilité stricte de l'ajout du champ optionnel `color` : aucune
 * migration, aucune réécriture, aucun champ ajouté aux tâches déjà persistées. Même patron de
 * vérification que `HabitsStore` pour US-032/US-036.
 */
describe('TasksStore — rétro-compatibilité de la couleur de carte (US-037 scénario 4)', () => {
	const legacy: Task = {
		id: 'legacy-1',
		name: 'Payer facture EDF',
		date: '2026-08-20',
		createdAt: '2026-08-01',
		dueTime: '14:30'
	};

	function repoWith(tasks: Task[]): TasksRepository & { saved: Task[][] } {
		const repo = fakeRepo();
		return { ...repo, getAll: async () => structuredClone(tasks) };
	}

	it('relit une tâche sans couleur à l’identique, sans lui ajouter de champ', async () => {
		const store = new TasksStore(repoWith([legacy]));

		await store.load();

		expect(store.tasks).toEqual([legacy]);
		expect(store.tasks[0].color).toBeUndefined();
		expect(Object.keys(store.tasks[0])).not.toContain('color');
	});

	it('ne réécrit pas le stockage au chargement (aucune migration au démarrage)', async () => {
		const repo = repoWith([legacy]);
		const store = new TasksStore(repo);

		await store.load();

		expect(repo.saved).toHaveLength(0);
	});

	it('scénario 7 (US-037) — la couleur survit à une reprogrammation vers une autre date', async () => {
		const repo = fakeRepo();
		const store = new TasksStore(repo);
		const colored: Task = { ...task, color: 'ciel' };
		await store.upsert(colored);

		await store.upsert({ ...colored, date: '2026-08-25' });

		expect(store.onDate('2026-08-12')).toEqual([]);
		expect(store.onDate('2026-08-25')[0].color).toBe('ciel');
	});
});

/**
 * US-038 — `onDate()` était un simple filtre : la liste du planning sortait dans l'ordre
 * d'insertion. Ces tests verrouillent le branchement de la règle d'ordre au niveau du store,
 * c'est-à-dire sur le chemin réellement emprunté par la route `/`.
 */
describe('TasksStore.onDate — ordre d’affichage du jour (US-038)', () => {
	function t(id: string, dueTime?: string, createdAt = '2026-08-01'): Task {
		return { id, name: id, date: '2026-08-20', createdAt, ...(dueTime ? { dueTime } : {}) };
	}

	async function storeWith(tasks: Task[]) {
		const store = new TasksStore(fakeRepo());
		for (const task of tasks) await store.upsert(task);
		return store;
	}

	it('scénarios 1/2 — heure limite croissante, puis les tâches sans heure limite', async () => {
		const store = await storeWith([t('Courses', '18:00'), t('Sans heure'), t('Plombier', '09:00')]);

		expect(store.onDate('2026-08-20').map((x) => x.id)).toEqual([
			'Plombier',
			'Courses',
			'Sans heure'
		]);
	});

	it('scénario 8 — réordonne immédiatement après modification d’une heure limite', async () => {
		const store = await storeWith([t('a', '09:00'), t('b', '12:00'), t('tard', '18:00')]);
		expect(store.onDate('2026-08-20').map((x) => x.id)).toEqual(['a', 'b', 'tard']);

		await store.upsert({ ...t('tard', '07:00'), id: 'tard' });
		expect(store.onDate('2026-08-20').map((x) => x.id)).toEqual(['tard', 'a', 'b']);

		await store.upsert({ id: 'tard', name: 'tard', date: '2026-08-20', createdAt: '2026-08-01' });
		expect(store.onDate('2026-08-20').map((x) => x.id)).toEqual(['a', 'b', 'tard']);
	});

	it('scénario 4 — ordre stable d’un appel à l’autre et après rechargement du stockage', async () => {
		const persisted = [t('premiere'), t('seconde')];
		const store = new TasksStore({
			...fakeRepo(),
			getAll: async () => structuredClone(persisted)
		});
		await store.load();

		expect(store.onDate('2026-08-20').map((x) => x.id)).toEqual(['premiere', 'seconde']);
		expect(store.onDate('2026-08-20').map((x) => x.id)).toEqual(['premiere', 'seconde']);

		await store.load(); // simule une réouverture de l'application
		expect(store.onDate('2026-08-20').map((x) => x.id)).toEqual(['premiere', 'seconde']);
	});

	it('scénario 7 — une tâche reprogrammée s’insère à sa place chronologique du nouveau jour', async () => {
		const store = await storeWith([t('08h', '08:00'), t('12h', '12:00')]);
		await store.upsert({
			id: 'retard-09h',
			name: 'retard-09h',
			date: '2026-08-01',
			createdAt: '2026-07-01',
			dueTime: '09:00'
		});

		await store.upsert({
			id: 'retard-09h',
			name: 'retard-09h',
			date: '2026-08-20',
			createdAt: '2026-07-01',
			dueTime: '09:00'
		});

		expect(store.onDate('2026-08-20').map((x) => x.id)).toEqual(['08h', 'retard-09h', '12h']);
		expect(store.onDate('2026-08-01')).toEqual([]);
	});

	it('scénario 6 — les tâches supprimées restent exclues du tri', async () => {
		const store = await storeWith([t('a', '09:00'), t('b', '10:00')]);
		await store.remove('a');

		expect(store.onDate('2026-08-20').map((x) => x.id)).toEqual(['b']);
	});
});

/**
 * US-039 — rétro-compatibilité du champ optionnel `urgent` et remontée effective en tête de la
 * liste du jour, sur le chemin réel du planning (`onDate`).
 */
describe('TasksStore — tâches urgentes (US-039)', () => {
	function t(id: string, opts: { dueTime?: string; urgent?: boolean } = {}): Task {
		return {
			id,
			name: id,
			date: '2026-08-20',
			createdAt: '2026-08-01',
			...(opts.dueTime ? { dueTime: opts.dueTime } : {}),
			...(opts.urgent ? { urgent: true } : {})
		};
	}

	it('scénario 3 — relit une tâche sans champ `urgent` à l’identique, sans migration', async () => {
		const legacy = t('legacy', { dueTime: '09:00' });
		const repo = { ...fakeRepo(), getAll: async () => structuredClone([legacy]) };
		const store = new TasksStore(repo);

		await store.load();

		expect(store.tasks).toEqual([legacy]);
		expect(Object.keys(store.tasks[0])).not.toContain('urgent');
		expect(repo.saved).toHaveLength(0);
	});

	it('scénario 4 — activer l’urgence remonte immédiatement la tâche en tête du jour', async () => {
		const store = new TasksStore(fakeRepo());
		for (const task of [t('a', { dueTime: '09:00' }), t('b', { dueTime: '12:00' }), t('c')])
			await store.upsert(task);
		expect(store.onDate('2026-08-20').map((x) => x.id)).toEqual(['a', 'b', 'c']);

		await store.upsert(t('c', { urgent: true }));
		expect(store.onDate('2026-08-20').map((x) => x.id)).toEqual(['c', 'a', 'b']);

		// Retrait de l'urgence : la tâche reprend sa place dans l'ordre d'US-038.
		await store.upsert(t('c'));
		expect(store.onDate('2026-08-20').map((x) => x.id)).toEqual(['a', 'b', 'c']);
	});

	it('scénario 5 — applique l’ordre complet A, C, B, E, F, D sur le planning', async () => {
		const store = new TasksStore(fakeRepo());
		const list = [
			t('D'),
			t('F', { dueTime: '17:00' }),
			t('A', { urgent: true }),
			t('E', { dueTime: '09:00' }),
			t('B', { urgent: true, dueTime: '15:00' }),
			t('C', { urgent: true, dueTime: '08:00' })
		];
		for (const task of list) await store.upsert(task);

		expect(store.onDate('2026-08-20').map((x) => x.id)).toEqual([
			'A',
			'C',
			'B',
			'E',
			'F',
			'D'
		]);
	});

	it('scénario 12 — aucune tâche ne devient urgente d’elle-même', async () => {
		const store = new TasksStore(fakeRepo());
		// Tâche largement passée, donc « en retard », et proche de son heure limite : rien ne doit
		// la marquer urgente — le marquage est exclusivement manuel.
		await store.upsert({
			id: 'vieille',
			name: 'vieille',
			date: '2026-01-01',
			createdAt: '2026-01-01',
			dueTime: '08:00'
		});

		expect(store.tasks[0].urgent).toBeUndefined();
		expect(store.onDate('2026-01-01')[0].urgent).toBeUndefined();
	});
});
