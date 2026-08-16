import { describe, it, expect } from 'vitest';
import {
	COMPLETED_TASKS_VISIBLE_DAYS,
	draftToTaskColor,
	draftToUrgent,
	isRecentCompletion,
	isTaskDeleted,
	isTaskOverdue,
	isTaskUrgent,
	partitionByCompletion,
	recentlyCompletedTasks,
	sortTasksByDateThenDay,
	sortTasksForDay,
	taskColorToDraft,
	taskRecordStatus,
	taskStatus,
	tasksOn,
	validateTaskDraft,
	validateReschedule,
	visibleTasks
} from './tasks';
import { DEFAULT_CARD_COLOR } from './card-colors';
import type { IsoDate, Task, TaskCompletion } from './types';

const task: Task = {
	id: 't1',
	name: 'Appeler le plombier',
	date: '2026-08-12',
	createdAt: '2026-08-10'
};

describe('tasksOn', () => {
	it('ne retourne que les tâches datées du jour demandé', () => {
		const other: Task = { ...task, id: 't2', date: '2026-08-13' };
		expect(tasksOn([task, other], '2026-08-12')).toEqual([task]);
	});
});

describe('isTaskOverdue — bascule à minuit le lendemain (US-003 scénario 1bis)', () => {
	it("n'est pas en retard le jour même", () => {
		expect(isTaskOverdue(task, false, '2026-08-12')).toBe(false);
	});
	it('est en retard dès le lendemain si non cochée', () => {
		expect(isTaskOverdue(task, false, '2026-08-13')).toBe(true);
	});
	it("n'est jamais en retard si cochée (US-003 scénario 4)", () => {
		expect(isTaskOverdue(task, true, '2026-08-20')).toBe(false);
	});
});

describe('taskStatus', () => {
	it('résout done / due / overdue', () => {
		expect(taskStatus(task, true, '2026-08-20')).toBe('done');
		expect(taskStatus(task, false, '2026-08-12')).toBe('due');
		expect(taskStatus(task, false, '2026-08-13')).toBe('overdue');
	});
});

describe('validateTaskDraft (US-002 scénario 3)', () => {
	it('valide un brouillon complet (scénario 1)', () => {
		expect(validateTaskDraft({ name: 'Prendre rendez-vous dentiste', date: '2026-08-15' })).toEqual(
			{ valid: true, errors: [] }
		);
	});

	it('bloque et signale le nom manquant', () => {
		const result = validateTaskDraft({ name: '', date: '2026-08-15' });
		expect(result.valid).toBe(false);
		expect(result.errors).toContain('Le nom est obligatoire.');
	});

	it('bloque et signale la date manquante', () => {
		const result = validateTaskDraft({ name: 'Dentiste', date: null });
		expect(result.valid).toBe(false);
		expect(result.errors).toContain('La date est obligatoire.');
	});

	it('signale les deux champs si les deux manquent', () => {
		const result = validateTaskDraft({ name: '', date: null });
		expect(result.errors).toHaveLength(2);
	});
});

describe('taskRecordStatus / visibleTasks (US-014 — soft-delete, rétro-compatibilité)', () => {
	it("résout 'active' pour une tâche sans champ status (persistée avant la fonctionnalité)", () => {
		expect(taskRecordStatus(task)).toBe('active');
		expect(isTaskDeleted(task)).toBe(false);
	});

	it("résout 'deleted' quand le statut est explicite", () => {
		const deleted: Task = { ...task, status: 'deleted' };
		expect(taskRecordStatus(deleted)).toBe('deleted');
		expect(isTaskDeleted(deleted)).toBe(true);
	});

	it('exclut les tâches supprimées de la liste visible (US-014 scénario 3)', () => {
		const other: Task = { ...task, id: 't2', status: 'deleted' };
		expect(visibleTasks([task, other])).toEqual([task]);
	});
});

describe('validateReschedule (US-003 scénario 3)', () => {
	it('bloque une reprogrammation sans date', () => {
		const result = validateReschedule(null);
		expect(result.valid).toBe(false);
		expect(result.errors).toContain('Choisissez une nouvelle date.');
	});

	it('valide une reprogrammation avec date', () => {
		expect(validateReschedule('2026-09-01')).toEqual({ valid: true, errors: [] });
	});
});

/**
 * US-038 — ordre d'affichage des tâches d'un même jour. Cette US **introduit** un ordre là où il
 * n'en existait aucun : `tasksOn` n'était qu'un filtre, la liste sortait dans son ordre
 * d'insertion. Les tâches sont volontairement déclarées ici dans un ordre de création différent
 * de l'ordre attendu, pour qu'aucun test ne puisse passer « par accident ».
 */
describe('sortTasksForDay (US-038)', () => {
	/** Fabrique une tâche du 20/08/2026 ; `createdAt` porte l'ordre de création. */
	function t(id: string, dueTime: string | undefined, createdAt = '2026-08-01'): Task {
		return { id, name: id, date: '2026-08-20', createdAt, ...(dueTime ? { dueTime } : {}) };
	}

	it('scénario 1 — trie les tâches à heure limite par heure croissante', () => {
		const courses = t('Courses', '18:00');
		const plombier = t('Appeler le plombier', '09:00');
		const facture = t('Payer facture', '14:30');

		const sorted = sortTasksForDay([courses, plombier, facture]);

		expect(sorted.map((x) => x.id)).toEqual(['Appeler le plombier', 'Payer facture', 'Courses']);
	});

	it("scénario 1 — l'ordre est indépendant de l'ordre de création", () => {
		const a = t('a', '18:00', '2026-08-01');
		const b = t('b', '09:00', '2026-08-05');

		expect(sortTasksForDay([a, b]).map((x) => x.id)).toEqual(['b', 'a']);
		expect(sortTasksForDay([b, a]).map((x) => x.id)).toEqual(['b', 'a']);
	});

	it('scénario 2 — relègue les tâches sans heure limite à la fin', () => {
		const sansA = t('sans-a', undefined);
		const avec1 = t('avec-09', '09:00');
		const sansB = t('sans-b', undefined);
		const avec2 = t('avec-17', '17:00');

		const sorted = sortTasksForDay([sansA, avec1, sansB, avec2]);

		expect(sorted.map((x) => x.id)).toEqual(['avec-09', 'avec-17', 'sans-a', 'sans-b']);
	});

	it('scénario 3 — un jour sans aucune heure limite reste ordonné et stable', () => {
		const a = t('a', undefined);
		const b = t('b', undefined);
		const c = t('c', undefined);

		expect(sortTasksForDay([a, b, c]).map((x) => x.id)).toEqual(['a', 'b', 'c']);
		expect(sortTasksForDay(sortTasksForDay([a, b, c])).map((x) => x.id)).toEqual(['a', 'b', 'c']);
	});

	it('scénario 3 — une liste vide ne provoque aucune erreur', () => {
		expect(sortTasksForDay([])).toEqual([]);
	});

	it('scénario 4 — départage les égalités par ordre de création (la plus ancienne en premier)', () => {
		const recente = t('recente', '10:00', '2026-08-10');
		const ancienne = t('ancienne', '10:00', '2026-08-01');

		expect(sortTasksForDay([recente, ancienne]).map((x) => x.id)).toEqual([
			'ancienne',
			'recente'
		]);
	});

	it("scénario 4 — deux tâches créées le même jour gardent l'ordre d'insertion persisté", () => {
		const premiere = t('premiere', undefined, '2026-08-01');
		const seconde = t('seconde', undefined, '2026-08-01');

		// Même entrée = même sortie, appel après appel (pas de dépendance à un tri instable).
		for (let i = 0; i < 3; i++) {
			expect(sortTasksForDay([premiere, seconde]).map((x) => x.id)).toEqual([
				'premiere',
				'seconde'
			]);
		}
	});

	it('scénario 5 — la fonction ne connaît pas la complétion : cocher ne peut pas déplacer une carte', () => {
		const list = [t('a', '09:00'), t('b', '12:00'), t('c', undefined)];
		// Le tri ne prend qu'un `Task[]` : aucune complétion n'entre dans la décision, par
		// construction. On verrouille malgré tout l'invariance de la sortie.
		expect(sortTasksForDay(list).map((x) => x.id)).toEqual(['a', 'b', 'c']);
	});

	it('scénario 6 — le statut « en retard » ne remonte ni ne relègue une tâche', () => {
		// Toutes ces tâches sont sur un jour passé (donc en retard si non faites) : l'ordre reste
		// strictement celui de l'heure limite.
		const passe = (id: string, dueTime?: string): Task => ({
			id,
			name: id,
			date: '2026-01-05',
			createdAt: '2026-01-01',
			...(dueTime ? { dueTime } : {})
		});

		const sorted = sortTasksForDay([passe('sans'), passe('tard', '18:00'), passe('tot', '08:00')]);

		expect(sorted.map((x) => x.id)).toEqual(['tot', 'tard', 'sans']);
	});

	it('scénario 7 — une tâche reprogrammée s’insère à sa place chronologique', () => {
		const huit = t('08h', '08:00');
		const douze = t('12h', '12:00');
		// Reprogrammée depuis un autre jour : créée plus tard, heure limite inchangée.
		const reprogrammee = t('reprogrammee-09h', '09:00', '2026-08-15');

		const sorted = sortTasksForDay([huit, douze, reprogrammee]);

		expect(sorted.map((x) => x.id)).toEqual(['08h', 'reprogrammee-09h', '12h']);
	});

	it('scénario 8 — vider l’heure limite renvoie la tâche dans le groupe de fin', () => {
		const tard = t('tard', '18:00');
		const autres = [t('a', '09:00'), t('b', '12:00')];

		expect(sortTasksForDay([...autres, tard]).map((x) => x.id)).toEqual(['a', 'b', 'tard']);
		expect(
			sortTasksForDay([...autres, { ...tard, dueTime: undefined }]).map((x) => x.id)
		).toEqual(['a', 'b', 'tard']);
		expect(sortTasksForDay([...autres, { ...tard, dueTime: '07:00' }]).map((x) => x.id)).toEqual([
			'tard',
			'a',
			'b'
		]);
	});

	it('ne modifie pas le tableau d’entrée', () => {
		const list = [t('b', '18:00'), t('a', '09:00')];
		const snapshot = [...list];

		sortTasksForDay(list);

		expect(list).toEqual(snapshot);
	});
});

/**
 * US-039 — l'ordre d'US-038 est étendu d'un critère de groupe placé AVANT tous les autres, avec
 * une règle interne propre au groupe urgent (« sans heure limite d'abord »), volontairement
 * inverse de celle des non urgentes.
 */
describe('Tâches urgentes — ordre et marquage (US-039)', () => {
	function t(id: string, opts: { dueTime?: string; urgent?: boolean; createdAt?: string } = {}): Task {
		return {
			id,
			name: id,
			date: '2026-08-20',
			createdAt: opts.createdAt ?? '2026-08-01',
			...(opts.dueTime ? { dueTime: opts.dueTime } : {}),
			...(opts.urgent ? { urgent: true } : {})
		};
	}

	it('scénario 3 — une tâche sans champ `urgent` est non urgente (rétro-compatibilité)', () => {
		expect(isTaskUrgent(t('legacy'))).toBe(false);
		expect(isTaskUrgent({ ...t('x'), urgent: false })).toBe(false);
		expect(isTaskUrgent({ ...t('x'), urgent: true })).toBe(true);
	});

	it('scénario 5 — ordre complet exact : A, C, B, E, F, D', () => {
		const a = t('A', { urgent: true });
		const b = t('B', { urgent: true, dueTime: '15:00' });
		const c = t('C', { urgent: true, dueTime: '08:00' });
		const d = t('D');
		const e = t('E', { dueTime: '09:00' });
		const f = t('F', { dueTime: '17:00' });

		// Entrée volontairement désordonnée.
		const sorted = sortTasksForDay([d, f, a, e, b, c]);

		expect(sorted.map((x) => x.id)).toEqual(['A', 'C', 'B', 'E', 'F', 'D']);
	});

	it('scénario 5 (1) — toutes les urgentes passent devant toutes les non urgentes', () => {
		const urgenteTard = t('urgente-23h', { urgent: true, dueTime: '23:00' });
		const ordinaireTot = t('ordinaire-01h', { dueTime: '01:00' });

		expect(sortTasksForDay([ordinaireTot, urgenteTard]).map((x) => x.id)).toEqual([
			'urgente-23h',
			'ordinaire-01h'
		]);
	});

	it('scénario 5 (2) — chez les urgentes, celles sans heure limite passent en tête', () => {
		const sansHeure = t('urgente-sans', { urgent: true });
		const avecHeure = t('urgente-08h', { urgent: true, dueTime: '08:00' });

		expect(sortTasksForDay([avecHeure, sansHeure]).map((x) => x.id)).toEqual([
			'urgente-sans',
			'urgente-08h'
		]);
	});

	it('scénario 5 (3) — chez les non urgentes, celles sans heure limite restent à la fin', () => {
		const sansHeure = t('ordinaire-sans');
		const avecHeure = t('ordinaire-08h', { dueTime: '08:00' });

		expect(sortTasksForDay([sansHeure, avecHeure]).map((x) => x.id)).toEqual([
			'ordinaire-08h',
			'ordinaire-sans'
		]);
	});

	it('scénario 6 — deux urgentes à égalité sont départagées par ordre de création', () => {
		const recente = t('recente', { urgent: true, dueTime: '10:00', createdAt: '2026-08-10' });
		const ancienne = t('ancienne', { urgent: true, dueTime: '10:00', createdAt: '2026-08-01' });
		const recenteSans = t('recente-sans', { urgent: true, createdAt: '2026-08-10' });
		const ancienneSans = t('ancienne-sans', { urgent: true, createdAt: '2026-08-01' });

		expect(sortTasksForDay([recente, ancienne]).map((x) => x.id)).toEqual([
			'ancienne',
			'recente'
		]);
		expect(sortTasksForDay([recenteSans, ancienneSans]).map((x) => x.id)).toEqual([
			'ancienne-sans',
			'recente-sans'
		]);
	});

	it('scénario 6 — ordre stable d’un appel à l’autre', () => {
		const list = [t('a', { urgent: true }), t('b', { urgent: true }), t('c', { dueTime: '09:00' })];

		const once = sortTasksForDay(list).map((x) => x.id);
		expect(sortTasksForDay(sortTasksForDay(list)).map((x) => x.id)).toEqual(once);
		expect(once).toEqual(['a', 'b', 'c']);
	});

	it('scénario 14 — un jour entièrement urgent reste ordonné par la règle interne du groupe', () => {
		const list = [
			t('u-17h', { urgent: true, dueTime: '17:00' }),
			t('u-sans-2', { urgent: true, createdAt: '2026-08-05' }),
			t('u-08h', { urgent: true, dueTime: '08:00' }),
			t('u-sans-1', { urgent: true, createdAt: '2026-08-01' })
		];

		expect(sortTasksForDay(list).map((x) => x.id)).toEqual([
			'u-sans-1',
			'u-sans-2',
			'u-08h',
			'u-17h'
		]);
	});

	it('scénario 2 — sans urgence, l’ordre d’US-038 est strictement inchangé', () => {
		const list = [t('sans'), t('18h', { dueTime: '18:00' }), t('09h', { dueTime: '09:00' })];

		expect(sortTasksForDay(list).map((x) => x.id)).toEqual(['09h', '18h', 'sans']);
	});

	it('scénario 9 — le comparateur ignore la complétion : une urgente cochée ne bouge pas', () => {
		// Le comparateur ne reçoit que des `Task` : la complétion ne peut pas entrer en jeu.
		const list = [t('u', { urgent: true }), t('o', { dueTime: '09:00' })];
		expect(sortTasksForDay(list).map((x) => x.id)).toEqual(['u', 'o']);
	});

	it('scénarios 2/4 — le marquage n’est persisté que s’il est activé', () => {
		expect(draftToUrgent({ name: 'x', date: '2026-08-20' })).toBeUndefined();
		expect(draftToUrgent({ name: 'x', date: '2026-08-20', urgent: false })).toBeUndefined();
		expect(draftToUrgent({ name: 'x', date: '2026-08-20', urgent: true })).toBe(true);
	});
});

describe('sortTasksByDateThenDay — écran « Tâches » (US-038 scénario 9)', () => {
	function t(id: string, date: IsoDate, dueTime?: string, createdAt = '2026-08-01'): Task {
		return { id, name: id, date, createdAt, ...(dueTime ? { dueTime } : {}) };
	}

	it('conserve le tri principal par date', () => {
		const tard = t('20-aout', '2026-08-20', '08:00');
		const tot = t('15-aout', '2026-08-15', '23:00');

		expect(sortTasksByDateThenDay([tard, tot]).map((x) => x.id)).toEqual(['15-aout', '20-aout']);
	});

	it('applique, à date égale, exactement la règle intra-jour du planning', () => {
		const list = [
			t('j2-sans', '2026-08-21'),
			t('j1-sans', '2026-08-20'),
			t('j1-18h', '2026-08-20', '18:00'),
			t('j2-09h', '2026-08-21', '09:00'),
			t('j1-09h', '2026-08-20', '09:00')
		];

		expect(sortTasksByDateThenDay(list).map((x) => x.id)).toEqual([
			'j1-09h',
			'j1-18h',
			'j1-sans',
			'j2-09h',
			'j2-sans'
		]);
	});

	it('départage les égalités par ordre de création, comme le planning', () => {
		const recente = t('recente', '2026-08-20', '10:00', '2026-08-10');
		const ancienne = t('ancienne', '2026-08-20', '10:00', '2026-08-01');

		expect(sortTasksByDateThenDay([recente, ancienne]).map((x) => x.id)).toEqual([
			'ancienne',
			'recente'
		]);
	});
});

describe('Couleur de carte d’une tâche (US-037)', () => {
	it('scénario 1 — réutilise strictement la palette d’US-036, sans teinte propre aux tâches', () => {
		// Le brouillon de tâche n'accepte que des identifiants de la palette partagée : toute
		// autre valeur retombe sur le défaut via `resolveCardColor`.
		expect(taskColorToDraft('menthe')).toEqual({ color: 'menthe' });
		expect(taskColorToDraft(undefined)).toEqual({ color: DEFAULT_CARD_COLOR });
	});

	it('scénario 3 — la teinte par défaut n’est pas persistée', () => {
		expect(draftToTaskColor({ name: 'x', date: '2026-08-20', color: DEFAULT_CARD_COLOR })).toBeUndefined();
		expect(draftToTaskColor({ name: 'x', date: '2026-08-20' })).toBeUndefined();
	});

	it('scénario 2 — persiste toute autre teinte choisie', () => {
		expect(draftToTaskColor({ name: 'x', date: '2026-08-20', color: 'ciel' })).toBe('ciel');
	});
});

describe('Regroupement des tâches accomplies (US-041)', () => {
	const task = (id: string, overrides: Partial<Task> = {}): Task => ({
		id,
		name: `Tâche ${id}`,
		date: '2026-08-16',
		createdAt: '2026-08-01',
		...overrides
	});

	describe('partitionByCompletion', () => {
		it('scénario 1 — sépare les tâches à faire des tâches accomplies', () => {
			const tasks = [task('a'), task('b'), task('c')];
			const completions: TaskCompletion[] = [{ taskId: 'b', done: true, doneAt: '2026-08-16' }];

			const { pending, completed } = partitionByCompletion(tasks, completions);

			expect(pending.map((t) => t.id)).toEqual(['a', 'c']);
			expect(completed.map((t) => t.id)).toEqual(['b']);
		});

		it("préserve strictement l'ordre reçu dans chaque groupe (non-régression US-038/US-039)", () => {
			// L'ordre entrant est celui produit par le tri d'US-038/US-039. Le regroupement retire
			// des éléments, il n'en réordonne aucun — c'est le principal risque de cette US.
			const tasks = [task('urgente'), task('a-9h'), task('b-14h'), task('sans-heure')];
			const completions: TaskCompletion[] = [{ taskId: 'a-9h', done: true, doneAt: '2026-08-16' }];

			const { pending, completed } = partitionByCompletion(tasks, completions);

			expect(pending.map((t) => t.id)).toEqual(['urgente', 'b-14h', 'sans-heure']);
			expect(completed.map((t) => t.id)).toEqual(['a-9h']);
		});

		it('une complétion décochée compte comme « à faire »', () => {
			const completions: TaskCompletion[] = [{ taskId: 'a', done: false, doneAt: '2026-08-16' }];

			const { pending, completed } = partitionByCompletion([task('a')], completions);

			expect(pending.map((t) => t.id)).toEqual(['a']);
			expect(completed).toEqual([]);
		});

		it('sans aucune complétion, tout reste à faire', () => {
			const { pending, completed } = partitionByCompletion([task('a'), task('b')], []);

			expect(pending).toHaveLength(2);
			expect(completed).toEqual([]);
		});
	});

	describe('isRecentCompletion (scénario 6)', () => {
		const today = '2026-08-16';

		it('accomplie le jour même : récente', () => {
			expect(isRecentCompletion({ taskId: 'a', done: true, doneAt: today }, today, 7)).toBe(true);
		});

		it('accomplie il y a exactement 7 jours : encore visible', () => {
			expect(
				isRecentCompletion({ taskId: 'a', done: true, doneAt: '2026-08-09' }, today, 7)
			).toBe(true);
		});

		it('accomplie il y a 8 jours : masquée', () => {
			expect(
				isRecentCompletion({ taskId: 'a', done: true, doneAt: '2026-08-08' }, today, 7)
			).toBe(false);
		});

		it('scénario 9 — sans date d’accomplissement : considérée ancienne, donc masquée', () => {
			expect(isRecentCompletion({ taskId: 'a', done: true }, today, 7)).toBe(false);
		});

		it('une tâche non cochée n’est jamais une complétion récente', () => {
			expect(
				isRecentCompletion({ taskId: 'a', done: false, doneAt: today }, today, 7)
			).toBe(false);
		});

		it('sans complétion du tout : faux, sans lever d’erreur', () => {
			expect(isRecentCompletion(undefined, today, 7)).toBe(false);
		});
	});

	describe('recentlyCompletedTasks (scénarios 6/9)', () => {
		const today = '2026-08-16';

		it('ne garde que les tâches accomplies au cours des 7 derniers jours', () => {
			const tasks = [task('recente'), task('ancienne'), task('sans-date')];
			const completions: TaskCompletion[] = [
				{ taskId: 'recente', done: true, doneAt: '2026-08-14' },
				{ taskId: 'ancienne', done: true, doneAt: '2026-07-30' },
				{ taskId: 'sans-date', done: true }
			];

			const visible = recentlyCompletedTasks(tasks, completions, today);

			expect(visible.map((t) => t.id)).toEqual(['recente']);
		});

		it("le seuil se compte depuis l'accomplissement, pas depuis la date prévue de la tâche", () => {
			// Tâche très en retard, mais cochée hier : elle doit rester visible (arbitrage 2026-08-16).
			const enRetard = task('vieille-tache', { date: '2026-06-01' });
			const completions: TaskCompletion[] = [
				{ taskId: 'vieille-tache', done: true, doneAt: '2026-08-15' }
			];

			expect(recentlyCompletedTasks([enRetard], completions, today).map((t) => t.id)).toEqual([
				'vieille-tache'
			]);
		});

		it('applique le seuil fixe de 7 jours par défaut', () => {
			expect(COMPLETED_TASKS_VISIBLE_DAYS).toBe(7);
			const completions: TaskCompletion[] = [
				{ taskId: 'a', done: true, doneAt: '2026-08-09' },
				{ taskId: 'b', done: true, doneAt: '2026-08-08' }
			];

			const visible = recentlyCompletedTasks([task('a'), task('b')], completions, today);

			expect(visible.map((t) => t.id)).toEqual(['a']);
		});
	});
});
