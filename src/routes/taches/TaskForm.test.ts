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
