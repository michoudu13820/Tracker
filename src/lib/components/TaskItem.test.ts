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

describe("TaskItem — pas de mise en pause pour les tâches (US-015 scénario 5)", () => {
	it("ne propose jamais d'action de mise en pause, même avec toutes les actions actives", () => {
		render(TaskItem, {
			task,
			done: false,
			today: '2026-08-12',
			onToggle: vi.fn(),
			onReschedule: vi.fn(),
			onEdit: vi.fn(),
			onDelete: vi.fn()
		});
		expect(screen.queryByRole('button', { name: /pause/i })).toBeNull();
		expect(screen.queryByRole('button', { name: /réactiver/i })).toBeNull();
	});
});

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

describe('TaskItem — heure limite optionnelle (US-021 scénario 1)', () => {
	it("affiche l'heure limite sur la carte quand elle est renseignée", () => {
		render(TaskItem, {
			task: { ...task, dueTime: '14:30' },
			done: false,
			today: '2026-08-12',
			onToggle: vi.fn(),
			onReschedule: vi.fn()
		});
		expect(screen.getByText(/14:30/)).toBeInTheDocument();
	});

	it("n'affiche rien de plus si l'heure limite n'est pas renseignée (scénario 2, US-002 non régressée)", () => {
		render(TaskItem, {
			task,
			done: false,
			today: '2026-08-12',
			onToggle: vi.fn(),
			onReschedule: vi.fn()
		});
		expect(screen.queryByText(/jusqu'à/)).toBeNull();
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

function pointer(el: Element, type: 'pointerdown' | 'pointerup', clientX: number) {
	return fireEvent(el, new MouseEvent(type, { clientX, bubbles: true, cancelable: true }));
}

describe('TaskItem — suppression par glisser + confirmation (US-014)', () => {
	it("n'active pas le geste de suppression si onDelete n'est pas fourni (scénario 6 — planning)", async () => {
		const onReveal = vi.fn();
		render(TaskItem, {
			task,
			done: false,
			today: '2026-08-12',
			onToggle: vi.fn(),
			onReschedule: vi.fn(),
			revealed: false,
			onReveal
		});

		const checkbox = screen.getByRole('checkbox');
		await pointer(checkbox, 'pointerdown', 200);
		await pointer(checkbox, 'pointerup', 100);

		expect(onReveal).not.toHaveBeenCalled();
		expect(screen.queryByRole('button', { name: /Supprimer/ })).toBeNull();
	});

	it('révèle le bouton poubelle au glissement quand onDelete est fourni (scénario 1)', async () => {
		const onReveal = vi.fn();
		render(TaskItem, {
			task,
			done: false,
			today: '2026-08-12',
			onToggle: vi.fn(),
			onReschedule: vi.fn(),
			revealed: false,
			onReveal,
			onDelete: vi.fn()
		});

		const checkbox = screen.getByRole('checkbox');
		await pointer(checkbox, 'pointerdown', 200);
		await pointer(checkbox, 'pointerup', 100);

		expect(onReveal).toHaveBeenCalledTimes(1);
	});

	it('demande confirmation au clic sur le bouton poubelle, avec le nom et la date de la tâche (scénario 2)', async () => {
		render(TaskItem, {
			task,
			done: false,
			today: '2026-08-12',
			onToggle: vi.fn(),
			onReschedule: vi.fn(),
			revealed: true,
			onDelete: vi.fn()
		});

		await fireEvent.click(screen.getByRole('button', { name: 'Supprimer « Appeler le plombier »' }));

		const dialog = screen.getByRole('alertdialog');
		expect(dialog).toHaveTextContent('Appeler le plombier');
		expect(dialog).toHaveTextContent('12/08/2026');
		expect(dialog).toHaveTextContent('définitive');
	});

	it('supprime effectivement après confirmation (scénario 3)', async () => {
		const onDelete = vi.fn();
		const onCloseReveal = vi.fn();
		render(TaskItem, {
			task,
			done: false,
			today: '2026-08-12',
			onToggle: vi.fn(),
			onReschedule: vi.fn(),
			revealed: true,
			onCloseReveal,
			onDelete
		});

		await fireEvent.click(screen.getByRole('button', { name: 'Supprimer « Appeler le plombier »' }));
		await fireEvent.click(screen.getByRole('button', { name: 'Supprimer' }));

		expect(onDelete).toHaveBeenCalledWith('t1');
		expect(onCloseReveal).toHaveBeenCalled();
	});

	it('annule sans supprimer quand on choisit Annuler (scénario 4)', async () => {
		const onDelete = vi.fn();
		render(TaskItem, {
			task,
			done: false,
			today: '2026-08-12',
			onToggle: vi.fn(),
			onReschedule: vi.fn(),
			revealed: true,
			onDelete
		});

		await fireEvent.click(screen.getByRole('button', { name: 'Supprimer « Appeler le plombier »' }));
		await fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));

		expect(onDelete).not.toHaveBeenCalled();
		expect(screen.queryByRole('alertdialog')).toBeNull();
	});

	it("referme le bouton poubelle sans suppression si on interagit ailleurs sur la carte (scénario 5)", async () => {
		const onCloseReveal = vi.fn();
		const onToggle = vi.fn();
		render(TaskItem, {
			task,
			done: false,
			today: '2026-08-12',
			onToggle,
			onReschedule: vi.fn(),
			revealed: true,
			onCloseReveal,
			onDelete: vi.fn()
		});

		await fireEvent.click(screen.getByRole('checkbox'));

		expect(onCloseReveal).toHaveBeenCalledTimes(1);
		expect(onToggle).not.toHaveBeenCalled();
	});
});
