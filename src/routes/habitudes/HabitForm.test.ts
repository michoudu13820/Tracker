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
