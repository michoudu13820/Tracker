// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import TaskForm from './TaskForm.svelte';
import type { Task } from '$lib/domain/types';
import { CARD_COLORS } from '$lib/domain/card-colors';

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

/** Remplit le minimum valide (nom + date), pour les tests de couleur/urgence. */
async function fillValidTask() {
	await fireEvent.input(screen.getByLabelText('Nom'), { target: { value: 'Payer facture EDF' } });
	await fireEvent.input(screen.getByLabelText('Date'), { target: { value: '2026-08-20' } });
}

describe('TaskForm — couleur de carte (US-037)', () => {
	it('scénario 1 — propose exactement la palette d’US-036, dans le même ordre', () => {
		const { container } = render(TaskForm, { task: undefined, onSave: vi.fn(), onCancel: vi.fn() });

		const radios = screen.getAllByRole('radio');
		expect(radios.map((r) => (r as HTMLInputElement).value)).toEqual([...CARD_COLORS]);
		expect(radios.map((r) => r.getAttribute('name'))).toEqual(CARD_COLORS.map(() => 'task-color'));
		expect(container.querySelector('input[type="color"]')).toBeNull();
	});

	it('scénario 3 — sans choix explicite, aucune couleur n’est enregistrée', async () => {
		const onSave = vi.fn();
		render(TaskForm, { task: undefined, onSave, onCancel: vi.fn() });

		await fillValidTask();
		await fireEvent.click(screen.getByRole('button', { name: 'Créer' }));

		const saved = onSave.mock.calls[0][0] as Task;
		expect(saved.color).toBeUndefined();
	});

	it('scénario 2 — enregistre la teinte choisie à la création', async () => {
		const onSave = vi.fn();
		render(TaskForm, { task: undefined, onSave, onCancel: vi.fn() });

		await fillValidTask();
		await fireEvent.click(screen.getByRole('radio', { name: 'Ciel' }));
		await fireEvent.click(screen.getByRole('button', { name: 'Créer' }));

		const saved = onSave.mock.calls[0][0] as Task;
		expect(saved.color).toBe('ciel');
	});

	it('scénario 5 — change puis retire la couleur en édition', async () => {
		const task: Task = {
			id: 't1',
			name: 'Payer facture EDF',
			date: '2026-08-20',
			createdAt: '2026-08-01',
			color: 'ciel'
		};
		const onSave = vi.fn();
		const { unmount } = render(TaskForm, { task, onSave, onCancel: vi.fn() });

		expect(screen.getByRole('radio', { name: 'Ciel' })).toBeChecked();

		await fireEvent.click(screen.getByRole('radio', { name: 'Sable' }));
		await fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
		expect((onSave.mock.calls[0][0] as Task).color).toBe('sable');

		unmount();

		const onSave2 = vi.fn();
		render(TaskForm, { task: { ...task, color: 'sable' }, onSave: onSave2, onCancel: vi.fn() });
		await fireEvent.click(screen.getByRole('radio', { name: 'Lavande' }));
		await fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
		expect((onSave2.mock.calls[0][0] as Task).color).toBeUndefined();
	});

	it('scénario 4 — une tâche créée avant l’évolution s’édite sans perdre de données', async () => {
		const legacy: Task = {
			id: 't-legacy',
			name: 'Dentiste',
			date: '2026-08-15',
			createdAt: '2026-08-01',
			dueTime: '09:00'
		};
		const onSave = vi.fn();
		render(TaskForm, { task: legacy, onSave, onCancel: vi.fn() });

		expect(screen.getByRole('radio', { name: 'Lavande' })).toBeChecked();

		await fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

		expect(onSave.mock.calls[0][0]).toEqual(legacy);
	});

	it('scénario 6 — disponible dans l’ajout rapide, sans régresser la date pré-remplie', async () => {
		const onSave = vi.fn();
		render(TaskForm, { task: undefined, defaultDate: '2026-08-20', onSave, onCancel: vi.fn() });

		expect(screen.getByLabelText('Date')).toHaveValue('2026-08-20');
		expect(screen.getByRole('radio', { name: 'Lavande' })).toBeChecked();

		await fireEvent.input(screen.getByLabelText('Nom'), { target: { value: 'Courses' } });
		await fireEvent.click(screen.getByRole('radio', { name: 'Menthe' }));
		await fireEvent.click(screen.getByRole('button', { name: 'Créer' }));

		const saved = onSave.mock.calls[0][0] as Task;
		expect(saved.date).toBe('2026-08-20');
		expect(saved.color).toBe('menthe');
	});
});

describe('TaskForm — marquage « Urgente » (US-039)', () => {
	it('scénario 1 — enregistre la tâche comme urgente quand le marquage est activé', async () => {
		const onSave = vi.fn();
		render(TaskForm, { task: undefined, onSave, onCancel: vi.fn() });

		await fillValidTask();
		await fireEvent.click(screen.getByLabelText('Urgente'));
		await fireEvent.click(screen.getByRole('button', { name: 'Créer' }));

		expect((onSave.mock.calls[0][0] as Task).urgent).toBe(true);
	});

	it('scénario 2 — désactivé par défaut : rien n’est enregistré si on n’y touche pas', async () => {
		const onSave = vi.fn();
		render(TaskForm, { task: undefined, onSave, onCancel: vi.fn() });

		expect(screen.getByLabelText('Urgente')).not.toBeChecked();

		await fillValidTask();
		await fireEvent.click(screen.getByRole('button', { name: 'Créer' }));

		expect((onSave.mock.calls[0][0] as Task).urgent).toBeUndefined();
	});

	it('scénario 4 — ajoute puis retire l’urgence en édition', async () => {
		const base: Task = {
			id: 't1',
			name: 'Payer facture EDF',
			date: '2026-08-20',
			createdAt: '2026-08-01'
		};
		const onSave = vi.fn();
		const { unmount } = render(TaskForm, { task: base, onSave, onCancel: vi.fn() });

		expect(screen.getByLabelText('Urgente')).not.toBeChecked();
		await fireEvent.click(screen.getByLabelText('Urgente'));
		await fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
		expect((onSave.mock.calls[0][0] as Task).urgent).toBe(true);

		unmount();

		const onSave2 = vi.fn();
		render(TaskForm, { task: { ...base, urgent: true }, onSave: onSave2, onCancel: vi.fn() });

		expect(screen.getByLabelText('Urgente')).toBeChecked();
		await fireEvent.click(screen.getByLabelText('Urgente'));
		await fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
		expect((onSave2.mock.calls[0][0] as Task).urgent).toBeUndefined();
	});

	it('scénario 3 — une tâche existante sans urgence s’édite sans perdre de données', async () => {
		const legacy: Task = {
			id: 't-legacy',
			name: 'Dentiste',
			date: '2026-08-15',
			createdAt: '2026-08-01',
			dueTime: '09:00',
			color: 'ciel'
		};
		const onSave = vi.fn();
		render(TaskForm, { task: legacy, onSave, onCancel: vi.fn() });

		await fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

		expect(onSave.mock.calls[0][0]).toEqual(legacy);
	});

	it('scénario 11 — disponible dans l’ajout rapide, désactivé par défaut', async () => {
		const onSave = vi.fn();
		render(TaskForm, { task: undefined, defaultDate: '2026-08-20', onSave, onCancel: vi.fn() });

		expect(screen.getByLabelText('Urgente')).not.toBeChecked();

		await fireEvent.input(screen.getByLabelText('Nom'), { target: { value: 'Courses' } });
		await fireEvent.click(screen.getByLabelText('Urgente'));
		await fireEvent.click(screen.getByRole('button', { name: 'Créer' }));

		const saved = onSave.mock.calls[0][0] as Task;
		expect(saved.urgent).toBe(true);
		expect(saved.date).toBe('2026-08-20');
	});

	it('scénario 10 — l’urgence n’impose aucune teinte : la couleur reste modifiable', async () => {
		const onSave = vi.fn();
		render(TaskForm, { task: undefined, onSave, onCancel: vi.fn() });

		await fillValidTask();
		await fireEvent.click(screen.getByLabelText('Urgente'));
		await fireEvent.click(screen.getByRole('radio', { name: 'Menthe' }));
		await fireEvent.click(screen.getByRole('button', { name: 'Créer' }));

		const saved = onSave.mock.calls[0][0] as Task;
		expect(saved.urgent).toBe(true);
		expect(saved.color).toBe('menthe');
	});
});
