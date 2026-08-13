// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import TaskForm from './TaskForm.svelte';
import type { Task } from '$lib/domain/types';

describe('TaskForm (US-002)', () => {
	it('crée une tâche avec nom et date (scénario 1)', async () => {
		const onSave = vi.fn();
		render(TaskForm, { task: undefined, onSave, onCancel: vi.fn() });

		await fireEvent.input(screen.getByLabelText('Nom'), {
			target: { value: 'Prendre rendez-vous dentiste' }
		});
		await fireEvent.input(screen.getByLabelText('Date'), { target: { value: '2026-08-15' } });
		await fireEvent.click(screen.getByRole('button', { name: 'Créer' }));

		expect(onSave).toHaveBeenCalledTimes(1);
		const saved = onSave.mock.calls[0][0] as Task;
		expect(saved.name).toBe('Prendre rendez-vous dentiste');
		expect(saved.date).toBe('2026-08-15');
	});

	it('bloque la création et signale le nom manquant (scénario 3)', async () => {
		const onSave = vi.fn();
		render(TaskForm, { task: undefined, onSave, onCancel: vi.fn() });

		await fireEvent.input(screen.getByLabelText('Date'), { target: { value: '2026-08-15' } });
		await fireEvent.click(screen.getByRole('button', { name: 'Créer' }));

		expect(onSave).not.toHaveBeenCalled();
		expect(screen.getByRole('alert')).toHaveTextContent('Le nom est obligatoire.');
	});

	it('bloque la création et signale la date manquante (scénario 3)', async () => {
		const onSave = vi.fn();
		render(TaskForm, { task: undefined, onSave, onCancel: vi.fn() });

		await fireEvent.input(screen.getByLabelText('Nom'), { target: { value: 'Dentiste' } });
		await fireEvent.click(screen.getByRole('button', { name: 'Créer' }));

		expect(onSave).not.toHaveBeenCalled();
		expect(screen.getByRole('alert')).toHaveTextContent('La date est obligatoire.');
	});

	it('édite une tâche existante en conservant son id (scénario 4)', async () => {
		const task: Task = {
			id: 't1',
			name: 'Prendre rendez-vous dentiste',
			date: '2026-08-15',
			createdAt: '2026-08-01'
		};
		const onSave = vi.fn();
		render(TaskForm, { task, onSave, onCancel: vi.fn() });

		expect(screen.getByLabelText('Nom')).toHaveValue('Prendre rendez-vous dentiste');
		expect(screen.getByLabelText('Date')).toHaveValue('2026-08-15');

		await fireEvent.input(screen.getByLabelText('Date'), { target: { value: '2026-08-20' } });
		await fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

		expect(onSave).toHaveBeenCalledTimes(1);
		const saved = onSave.mock.calls[0][0] as Task;
		expect(saved.id).toBe('t1');
		expect(saved.date).toBe('2026-08-20');
	});
});

describe('TaskForm — date pré-remplie depuis le planning (US-026 scénario 3)', () => {
	it('pré-remplit la date avec defaultDate à la création', () => {
		render(TaskForm, { task: undefined, defaultDate: '2026-08-20', onSave: vi.fn(), onCancel: vi.fn() });
		expect(screen.getByLabelText('Date')).toHaveValue('2026-08-20');
	});

	it('la date pré-remplie reste modifiable', async () => {
		const onSave = vi.fn();
		render(TaskForm, {
			task: undefined,
			defaultDate: '2026-08-20',
			onSave,
			onCancel: vi.fn()
		});

		await fireEvent.input(screen.getByLabelText('Nom'), { target: { value: 'Courses' } });
		await fireEvent.input(screen.getByLabelText('Date'), { target: { value: '2026-08-25' } });
		await fireEvent.click(screen.getByRole('button', { name: 'Créer' }));

		const saved = onSave.mock.calls[0][0] as Task;
		expect(saved.date).toBe('2026-08-25');
	});

	it("ignore defaultDate en édition (la date déjà enregistrée de la tâche prévaut)", () => {
		const task: Task = {
			id: 't1',
			name: 'Dentiste',
			date: '2026-08-15',
			createdAt: '2026-08-01'
		};
		render(TaskForm, { task, defaultDate: '2026-08-20', onSave: vi.fn(), onCancel: vi.fn() });
		expect(screen.getByLabelText('Date')).toHaveValue('2026-08-15');
	});
});

describe('TaskForm — heure limite optionnelle (US-021)', () => {
	it('crée une tâche avec une heure limite alignée sur le quart d\'heure (scénario 1)', async () => {
		const onSave = vi.fn();
		render(TaskForm, { task: undefined, onSave, onCancel: vi.fn() });

		await fireEvent.input(screen.getByLabelText('Nom'), { target: { value: 'Payer la facture' } });
		await fireEvent.input(screen.getByLabelText('Date'), { target: { value: '2026-08-15' } });
		await fireEvent.input(screen.getByLabelText('Heure limite (optionnelle)'), {
			target: { value: '14:30' }
		});
		await fireEvent.click(screen.getByRole('button', { name: 'Créer' }));

		const saved = onSave.mock.calls[0][0] as Task;
		expect(saved.dueTime).toBe('14:30');
	});

	it('crée une tâche sans heure limite si le champ est laissé vide (scénario 2)', async () => {
		const onSave = vi.fn();
		render(TaskForm, { task: undefined, onSave, onCancel: vi.fn() });

		await fireEvent.input(screen.getByLabelText('Nom'), { target: { value: 'Payer la facture' } });
		await fireEvent.input(screen.getByLabelText('Date'), { target: { value: '2026-08-15' } });
		await fireEvent.click(screen.getByRole('button', { name: 'Créer' }));

		const saved = onSave.mock.calls[0][0] as Task;
		expect(saved.dueTime).toBeUndefined();
	});

	it('arrondit une heure limite non alignée au quart d\'heure le plus proche avant enregistrement (scénario 3)', async () => {
		const onSave = vi.fn();
		render(TaskForm, { task: undefined, onSave, onCancel: vi.fn() });

		await fireEvent.input(screen.getByLabelText('Nom'), { target: { value: 'Payer la facture' } });
		await fireEvent.input(screen.getByLabelText('Date'), { target: { value: '2026-08-15' } });
		await fireEvent.input(screen.getByLabelText('Heure limite (optionnelle)'), {
			target: { value: '14:23' }
		});
		await fireEvent.click(screen.getByRole('button', { name: 'Créer' }));

		const saved = onSave.mock.calls[0][0] as Task;
		expect(saved.dueTime).toBe('14:30');
	});

	it("retire l'heure limite en édition quand le champ est vidé (scénario 4)", async () => {
		const task: Task = {
			id: 't1',
			name: 'Payer la facture',
			date: '2026-08-15',
			createdAt: '2026-08-01',
			dueTime: '14:30'
		};
		const onSave = vi.fn();
		render(TaskForm, { task, onSave, onCancel: vi.fn() });

		expect(screen.getByLabelText('Heure limite (optionnelle)')).toHaveValue('14:30');

		await fireEvent.input(screen.getByLabelText('Heure limite (optionnelle)'), {
			target: { value: '' }
		});
		await fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

		const saved = onSave.mock.calls[0][0] as Task;
		expect(saved.dueTime).toBeUndefined();
	});

	it("remplace l'heure limite existante par la nouvelle valeur en édition (scénario 5)", async () => {
		const task: Task = {
			id: 't1',
			name: 'Payer la facture',
			date: '2026-08-15',
			createdAt: '2026-08-01',
			dueTime: '14:30'
		};
		const onSave = vi.fn();
		render(TaskForm, { task, onSave, onCancel: vi.fn() });

		await fireEvent.input(screen.getByLabelText('Heure limite (optionnelle)'), {
			target: { value: '09:15' }
		});
		await fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

		const saved = onSave.mock.calls[0][0] as Task;
		expect(saved.dueTime).toBe('09:15');
	});
});
