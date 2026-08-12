// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import TaskItem from './TaskItem.svelte';
import type { Task } from '$lib/domain/types';

const task: Task = {
	id: 't1',
	name: 'Appeler le plombier',
	date: '2026-08-12',
	createdAt: '2026-08-01'
};

describe('TaskItem — statut (US-003)', () => {
	it('signale une tâche en retard (scénario 1)', () => {
		render(TaskItem, {
			task,
			done: false,
			today: '2026-08-13',
			onToggle: vi.fn(),
			onReschedule: vi.fn()
		});
		expect(screen.getByText('En retard')).toBeInTheDocument();
	});

	it("n'est pas en retard le jour même, avant minuit (scénario 1bis)", () => {
		render(TaskItem, {
			task,
			done: false,
			today: '2026-08-12',
			onToggle: vi.fn(),
			onReschedule: vi.fn()
		});
		expect(screen.getByText('À faire')).toBeInTheDocument();
		expect(screen.queryByText('En retard')).toBeNull();
	});

	it('bascule en retard dès le lendemain à 00h00 (scénario 1bis)', () => {
		render(TaskItem, {
			task,
			done: false,
			today: '2026-08-13',
			onToggle: vi.fn(),
			onReschedule: vi.fn()
		});
		expect(screen.getByText('En retard')).toBeInTheDocument();
	});

	it("une tâche validée n'est jamais en retard, même à une date passée (scénario 4)", () => {
		render(TaskItem, {
			task,
			done: true,
			today: '2026-08-20',
			onToggle: vi.fn(),
			onReschedule: vi.fn()
		});
		expect(screen.getByText('Faite')).toBeInTheDocument();
		expect(screen.queryByText('En retard')).toBeNull();
	});
});

describe('TaskItem — reprogrammation (US-003 scénarios 2/3)', () => {
	it('reprogrammation bloquée sans nouvelle date (scénario 3)', async () => {
		const onReschedule = vi.fn();
		render(TaskItem, {
			task,
			done: false,
			today: '2026-08-13',
			onToggle: vi.fn(),
			onReschedule
		});

		await fireEvent.click(screen.getByRole('button', { name: 'Reprogrammer' }));
		await fireEvent.click(screen.getByRole('button', { name: 'Valider' }));

		expect(onReschedule).not.toHaveBeenCalled();
		expect(screen.getByRole('alert')).toHaveTextContent('Choisissez une nouvelle date.');
	});

	it('reprogramme la tâche à une nouvelle date (scénario 2)', async () => {
		const onReschedule = vi.fn();
		render(TaskItem, {
			task,
			done: false,
			today: '2026-08-13',
			onToggle: vi.fn(),
			onReschedule
		});

		await fireEvent.click(screen.getByRole('button', { name: 'Reprogrammer' }));
		await fireEvent.input(screen.getByLabelText('Nouvelle date'), {
			target: { value: '2026-08-20' }
		});
		await fireEvent.click(screen.getByRole('button', { name: 'Valider' }));

		expect(onReschedule).toHaveBeenCalledWith('t1', '2026-08-20');
	});

	it("n'affiche pas d'action de reprogrammation si la tâche n'est pas en retard", () => {
		render(TaskItem, {
			task,
			done: false,
			today: '2026-08-12',
			onToggle: vi.fn(),
			onReschedule: vi.fn()
		});
		expect(screen.queryByRole('button', { name: 'Reprogrammer' })).toBeNull();
	});
});

describe('TaskItem — cochage (US-004 scénario 4/5, câblage réutilisé)', () => {
	it('appelle onToggle avec le nouvel état coché', async () => {
		const onToggle = vi.fn();
		render(TaskItem, {
			task,
			done: false,
			today: '2026-08-12',
			onToggle,
			onReschedule: vi.fn()
		});

		await fireEvent.click(screen.getByRole('checkbox'));
		expect(onToggle).toHaveBeenCalledWith('t1', true);
	});
});

describe('TaskItem — carte horizontale pleine largeur (US-010 scénario 5)', () => {
	it("affiche le nom complet sans le tronquer même s'il est très long", () => {
		const longName =
			'Préparer le dossier complet de renouvellement du passeport pour toute la famille avant la fin du mois';
		render(TaskItem, {
			task: { ...task, name: longName },
			done: false,
			today: '2026-08-12',
			onToggle: vi.fn(),
			onReschedule: vi.fn()
		});
		expect(screen.getByText(longName)).toBeInTheDocument();
	});
});

describe('TaskItem — édition optionnelle', () => {
	it("n'affiche pas de bouton Modifier si onEdit n'est pas fourni", () => {
		render(TaskItem, {
			task,
			done: false,
			today: '2026-08-12',
			onToggle: vi.fn(),
			onReschedule: vi.fn()
		});
		expect(screen.queryByRole('button', { name: 'Modifier' })).toBeNull();
	});

	it('appelle onEdit avec la tâche quand fourni', async () => {
		const onEdit = vi.fn();
		render(TaskItem, {
			task,
			done: false,
			today: '2026-08-12',
			onToggle: vi.fn(),
			onReschedule: vi.fn(),
			onEdit
		});
		await fireEvent.click(screen.getByRole('button', { name: 'Modifier' }));
		expect(onEdit).toHaveBeenCalledWith(task);
	});
});
