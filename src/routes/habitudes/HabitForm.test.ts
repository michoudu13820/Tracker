// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import HabitForm from './HabitForm.svelte';
import type { Habit } from '$lib/domain/types';

describe('HabitForm (US-001)', () => {
	it('bloque la création et affiche un message si le nom est manquant (scénario 5)', async () => {
		const onSave = vi.fn();
		render(HabitForm, { habit: undefined, onSave, onCancel: vi.fn() });

		await fireEvent.click(screen.getByRole('button', { name: 'Intervalle en jours' }));
		await fireEvent.input(screen.getByLabelText('Tous les combien de jours ?'), {
			target: { value: '2' }
		});
		await fireEvent.click(screen.getByRole('button', { name: 'Créer' }));

		expect(onSave).not.toHaveBeenCalled();
		expect(screen.getByRole('alert')).toHaveTextContent('Le nom est obligatoire.');
	});

	it('bloque la création et affiche un message si aucun mode de fréquence n’est choisi (scénario 5)', async () => {
		const onSave = vi.fn();
		render(HabitForm, { habit: undefined, onSave, onCancel: vi.fn() });

		await fireEvent.input(screen.getByLabelText('Nom'), { target: { value: 'Marcher' } });
		await fireEvent.click(screen.getByRole('button', { name: 'Créer' }));

		expect(onSave).not.toHaveBeenCalled();
		expect(screen.getByRole('alert')).toHaveTextContent('fréquence');
	});

	it('crée une habitude avec fréquence intervalle (scénario 1)', async () => {
		const onSave = vi.fn();
		render(HabitForm, { habit: undefined, onSave, onCancel: vi.fn() });

		await fireEvent.input(screen.getByLabelText('Nom'), { target: { value: "Boire de l'eau" } });
		await fireEvent.input(screen.getByLabelText('Emoji'), { target: { value: '💧' } });
		await fireEvent.click(screen.getByRole('button', { name: 'Intervalle en jours' }));
		await fireEvent.input(screen.getByLabelText('Tous les combien de jours ?'), {
			target: { value: '2' }
		});
		await fireEvent.click(screen.getByRole('button', { name: 'Créer' }));

		expect(onSave).toHaveBeenCalledTimes(1);
		const saved = onSave.mock.calls[0][0] as Habit;
		expect(saved.name).toBe("Boire de l'eau");
		expect(saved.emoji).toBe('💧');
		expect(saved.frequency).toEqual(
			expect.objectContaining({ kind: 'interval', days: 2 })
		);
	});

	it('crée une habitude avec fréquence jours de semaine (scénario 2)', async () => {
		const onSave = vi.fn();
		render(HabitForm, { habit: undefined, onSave, onCancel: vi.fn() });

		await fireEvent.input(screen.getByLabelText('Nom'), { target: { value: 'Yoga' } });
		await fireEvent.input(screen.getByLabelText('Emoji'), { target: { value: '🧘' } });
		await fireEvent.click(screen.getByRole('button', { name: 'Jours de la semaine' }));
		await fireEvent.click(screen.getByLabelText('lundi'));
		await fireEvent.click(screen.getByLabelText('mercredi'));
		await fireEvent.click(screen.getByLabelText('vendredi'));
		await fireEvent.click(screen.getByRole('button', { name: 'Créer' }));

		expect(onSave).toHaveBeenCalledTimes(1);
		const saved = onSave.mock.calls[0][0] as Habit;
		expect(saved.frequency).toEqual({ kind: 'weekdays', weekdays: [1, 3, 5] });
	});

	it('bascule de mode réinitialise l’autre mode (scénario 3 — exclusivité)', async () => {
		render(HabitForm, { habit: undefined, onSave: vi.fn(), onCancel: vi.fn() });

		await fireEvent.click(screen.getByRole('button', { name: 'Intervalle en jours' }));
		await fireEvent.input(screen.getByLabelText('Tous les combien de jours ?'), {
			target: { value: '5' }
		});
		await fireEvent.click(screen.getByRole('button', { name: 'Jours de la semaine' }));

		// Le champ intervalle a disparu (mode masqué / réinitialisé).
		expect(screen.queryByLabelText('Tous les combien de jours ?')).toBeNull();
		// Aucun jour de semaine pré-coché suite à la réinitialisation.
		expect(screen.getByLabelText('lundi')).not.toBeChecked();
	});

	it('pré-remplit le formulaire en édition et conserve l’id (scénario 6)', async () => {
		const habit: Habit = {
			id: 'h1',
			name: 'Marcher',
			emoji: '🚶',
			frequency: { kind: 'weekdays', weekdays: [1, 2] },
			createdAt: '2026-01-01'
		};
		const onSave = vi.fn();
		render(HabitForm, { habit, onSave, onCancel: vi.fn() });

		expect(screen.getByLabelText('Nom')).toHaveValue('Marcher');
		await fireEvent.click(screen.getByRole('button', { name: 'Intervalle en jours' }));
		await fireEvent.input(screen.getByLabelText('Tous les combien de jours ?'), {
			target: { value: '3' }
		});
		await fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

		expect(onSave).toHaveBeenCalledTimes(1);
		const saved = onSave.mock.calls[0][0] as Habit;
		expect(saved.id).toBe('h1');
		expect(saved.frequency).toEqual(
			expect.objectContaining({ kind: 'interval', days: 3 })
		);
	});
});

describe('HabitForm — cible chiffrée (US-017)', () => {
	it('crée une habitude sans cible par défaut (scénario 1 — rétrocompatibilité)', async () => {
		const onSave = vi.fn();
		render(HabitForm, { habit: undefined, onSave, onCancel: vi.fn() });

		expect(screen.queryByLabelText('Valeur cible')).toBeNull();

		await fireEvent.input(screen.getByLabelText('Nom'), { target: { value: "Boire de l'eau" } });
		await fireEvent.click(screen.getByRole('button', { name: 'Intervalle en jours' }));
		await fireEvent.input(screen.getByLabelText('Tous les combien de jours ?'), {
			target: { value: '1' }
		});
		await fireEvent.click(screen.getByRole('button', { name: 'Créer' }));

		expect(onSave).toHaveBeenCalledTimes(1);
		const saved = onSave.mock.calls[0][0] as Habit;
		expect(saved.target).toBeUndefined();
	});

	it('crée une habitude avec une cible chiffrée (scénario 2)', async () => {
		const onSave = vi.fn();
		render(HabitForm, { habit: undefined, onSave, onCancel: vi.fn() });

		await fireEvent.input(screen.getByLabelText('Nom'), { target: { value: "Boire de l'eau" } });
		await fireEvent.click(screen.getByRole('button', { name: 'Intervalle en jours' }));
		await fireEvent.input(screen.getByLabelText('Tous les combien de jours ?'), {
			target: { value: '1' }
		});
		await fireEvent.click(screen.getByLabelText('Suivre une quantité'));
		await fireEvent.input(screen.getByLabelText('Valeur cible'), { target: { value: '1.5' } });
		await fireEvent.change(screen.getByLabelText('Unité'), { target: { value: 'L' } });
		await fireEvent.click(screen.getByRole('button', { name: 'Créer' }));

		expect(onSave).toHaveBeenCalledTimes(1);
		const saved = onSave.mock.calls[0][0] as Habit;
		expect(saved.target).toEqual({ value: 1.5, unit: 'L' });
	});

	it('propose la liste fermée des unités prédéfinies (scénario 3)', async () => {
		render(HabitForm, { habit: undefined, onSave: vi.fn(), onCancel: vi.fn() });

		await fireEvent.click(screen.getByLabelText('Suivre une quantité'));

		const select = screen.getByLabelText('Unité') as HTMLSelectElement;
		const options = Array.from(select.options).map((o) => o.textContent);
		expect(options).toEqual([
			'Litres (L)',
			'Millilitres (mL)',
			'Minutes (min)',
			'Heures (h)',
			'Kilomètres (km)',
			'Répétitions/Nombre (x)'
		]);
	});

	it('bloque la validation avec une cible vide, nulle ou négative (scénario 4)', async () => {
		const onSave = vi.fn();
		render(HabitForm, { habit: undefined, onSave, onCancel: vi.fn() });

		await fireEvent.input(screen.getByLabelText('Nom'), { target: { value: 'Yoga' } });
		await fireEvent.click(screen.getByRole('button', { name: 'Intervalle en jours' }));
		await fireEvent.input(screen.getByLabelText('Tous les combien de jours ?'), {
			target: { value: '1' }
		});
		await fireEvent.click(screen.getByLabelText('Suivre une quantité'));
		await fireEvent.click(screen.getByRole('button', { name: 'Créer' }));

		expect(onSave).not.toHaveBeenCalled();
		expect(screen.getByRole('alert')).toHaveTextContent(
			'La cible doit être un nombre strictement positif.'
		);
	});

	it('pré-remplit la cible existante en édition et permet de la modifier (scénario 5)', async () => {
		const habit: Habit = {
			id: 'h1',
			name: "Boire de l'eau",
			emoji: '💧',
			frequency: { kind: 'interval', days: 1, anchor: '2026-01-01' },
			createdAt: '2026-01-01',
			target: { value: 1.5, unit: 'L' }
		};
		const onSave = vi.fn();
		render(HabitForm, { habit, onSave, onCancel: vi.fn() });

		expect(screen.getByLabelText('Suivre une quantité')).toBeChecked();
		expect(screen.getByLabelText('Valeur cible')).toHaveValue(1.5);

		await fireEvent.input(screen.getByLabelText('Valeur cible'), { target: { value: '2' } });
		await fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

		expect(onSave).toHaveBeenCalledTimes(1);
		const saved = onSave.mock.calls[0][0] as Habit;
		expect(saved.target).toEqual({ value: 2, unit: 'L' });
	});

	it('retire la cible chiffrée quand on désactive l’option (scénario 6)', async () => {
		const habit: Habit = {
			id: 'h1',
			name: "Boire de l'eau",
			emoji: '💧',
			frequency: { kind: 'interval', days: 1, anchor: '2026-01-01' },
			createdAt: '2026-01-01',
			target: { value: 1.5, unit: 'L' }
		};
		const onSave = vi.fn();
		render(HabitForm, { habit, onSave, onCancel: vi.fn() });

		await fireEvent.click(screen.getByLabelText('Suivre une quantité'));
		expect(screen.queryByLabelText('Valeur cible')).toBeNull();
		await fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

		expect(onSave).toHaveBeenCalledTimes(1);
		const saved = onSave.mock.calls[0][0] as Habit;
		expect(saved.target).toBeUndefined();
	});
});
