import { describe, it, expect } from 'vitest';
import { isTaskOverdue, taskStatus, tasksOn, validateTaskDraft, validateReschedule } from './tasks';
import type { Task } from './types';

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
