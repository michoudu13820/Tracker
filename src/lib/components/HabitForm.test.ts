// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/svelte';
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

describe('HabitForm — fréquence « jours du mois » (US-032)', () => {
	it('scénario 1 — crée une habitude avec un seul jour du mois', async () => {
		const onSave = vi.fn();
		render(HabitForm, { habit: undefined, onSave, onCancel: vi.fn() });

		await fireEvent.input(screen.getByLabelText('Nom'), {
			target: { value: 'Relevé de compteur' }
		});
		await fireEvent.input(screen.getByLabelText('Emoji'), { target: { value: '📊' } });
		await fireEvent.click(screen.getByRole('button', { name: 'Jours du mois' }));
		await fireEvent.click(screen.getByLabelText('1er du mois'));
		await fireEvent.click(screen.getByRole('button', { name: 'Créer' }));

		expect(onSave).toHaveBeenCalledTimes(1);
		const saved = onSave.mock.calls[0][0] as Habit;
		expect(saved.frequency).toEqual({ kind: 'monthdays', monthdays: [1] });
	});

	it('scénario 2 — sélection multiple enregistrée en ordre croissant quel que soit l’ordre de cochage', async () => {
		const onSave = vi.fn();
		render(HabitForm, { habit: undefined, onSave, onCancel: vi.fn() });

		await fireEvent.input(screen.getByLabelText('Nom'), { target: { value: 'Sauvegarde' } });
		await fireEvent.click(screen.getByRole('button', { name: 'Jours du mois' }));
		await fireEvent.click(screen.getByLabelText('15 du mois'));
		await fireEvent.click(screen.getByLabelText('1er du mois'));
		await fireEvent.click(screen.getByRole('button', { name: 'Créer' }));

		const saved = onSave.mock.calls[0][0] as Habit;
		expect(saved.frequency).toEqual({ kind: 'monthdays', monthdays: [1, 15] });
	});

	it('scénario 3 — propose exactement les jours 1 à 31, par bascule cocher/décocher', async () => {
		render(HabitForm, { habit: undefined, onSave: vi.fn(), onCancel: vi.fn() });
		await fireEvent.click(screen.getByRole('button', { name: 'Jours du mois' }));

		const group = screen.getByRole('group', { name: 'Jours du mois' });
		const boxes = within(group).getAllByRole('checkbox');
		expect(boxes).toHaveLength(31);
		expect(screen.getByLabelText('31 du mois')).toBeInTheDocument();
		expect(screen.queryByLabelText('32 du mois')).toBeNull();
		expect(screen.queryByLabelText('0 du mois')).toBeNull();

		// Bascule : cocher puis décocher le 15.
		await fireEvent.click(screen.getByLabelText('15 du mois'));
		expect(screen.getByLabelText('15 du mois')).toBeChecked();
		await fireEvent.click(screen.getByLabelText('15 du mois'));
		expect(screen.getByLabelText('15 du mois')).not.toBeChecked();
	});

	it('scénario 4 — basculer vers « jours du mois » réinitialise les autres modes, et réciproquement', async () => {
		render(HabitForm, { habit: undefined, onSave: vi.fn(), onCancel: vi.fn() });

		await fireEvent.click(screen.getByRole('button', { name: 'Jours de la semaine' }));
		await fireEvent.click(screen.getByLabelText('lundi'));
		await fireEvent.click(screen.getByRole('button', { name: 'Jours du mois' }));
		expect(screen.queryByLabelText('lundi')).toBeNull();

		await fireEvent.click(screen.getByLabelText('15 du mois'));
		await fireEvent.click(screen.getByRole('button', { name: 'Jours de la semaine' }));
		expect(screen.queryByLabelText('15 du mois')).toBeNull();

		// Retour au mode « jours du mois » : la sélection précédente a bien été réinitialisée.
		await fireEvent.click(screen.getByRole('button', { name: 'Jours du mois' }));
		expect(screen.getByLabelText('15 du mois')).not.toBeChecked();
	});

	it('scénario 5 — bloque la création si aucun jour du mois n’est sélectionné', async () => {
		const onSave = vi.fn();
		render(HabitForm, { habit: undefined, onSave, onCancel: vi.fn() });

		await fireEvent.input(screen.getByLabelText('Nom'), { target: { value: 'Sauvegarde' } });
		await fireEvent.click(screen.getByRole('button', { name: 'Jours du mois' }));
		await fireEvent.click(screen.getByRole('button', { name: 'Créer' }));

		expect(onSave).not.toHaveBeenCalled();
		expect(screen.getByRole('alert')).toHaveTextContent('Sélectionnez au moins un jour du mois.');
	});

	it('scénario 10 — édition depuis « jours de la semaine » vers « jours du mois »', async () => {
		const habit: Habit = {
			id: 'h1',
			name: 'Ménage de fond',
			emoji: '🧹',
			frequency: { kind: 'weekdays', weekdays: [1, 3] },
			createdAt: '2026-01-01'
		};
		const onSave = vi.fn();
		render(HabitForm, { habit, onSave, onCancel: vi.fn() });

		await fireEvent.click(screen.getByRole('button', { name: 'Jours du mois' }));
		await fireEvent.click(screen.getByLabelText('1er du mois'));
		await fireEvent.click(screen.getByLabelText('15 du mois'));
		await fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

		const saved = onSave.mock.calls[0][0] as Habit;
		expect(saved.id).toBe('h1');
		expect(saved.createdAt).toBe('2026-01-01');
		expect(saved.frequency).toEqual({ kind: 'monthdays', monthdays: [1, 15] });
	});

	it('scénario 10 — rouvre l’édition avec le mode « jours du mois » pré-sélectionné et les jours cochés', () => {
		const habit: Habit = {
			id: 'h1',
			name: 'Ménage de fond',
			emoji: '🧹',
			frequency: { kind: 'monthdays', monthdays: [1, 15] },
			createdAt: '2026-01-01'
		};
		render(HabitForm, { habit, onSave: vi.fn(), onCancel: vi.fn() });

		expect(screen.getByRole('button', { name: 'Jours du mois' })).toHaveAttribute(
			'aria-pressed',
			'true'
		);
		expect(screen.getByLabelText('1er du mois')).toBeChecked();
		expect(screen.getByLabelText('15 du mois')).toBeChecked();
		expect(screen.getByLabelText('2 du mois')).not.toBeChecked();
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

/** Remplit le minimum valide (nom + fréquence), pour les tests de couleur (US-036). */
async function fillValidHabit() {
	await fireEvent.input(screen.getByLabelText('Nom'), { target: { value: 'Yoga' } });
	await fireEvent.click(screen.getByRole('button', { name: 'Intervalle en jours' }));
	await fireEvent.input(screen.getByLabelText('Tous les combien de jours ?'), {
		target: { value: '1' }
	});
}

describe('HabitForm — couleur de carte (US-036)', () => {
	it('scénario 1 — propose la palette fermée, sans sélecteur libre ni code hexadécimal', () => {
		const { container } = render(HabitForm, { habit: undefined, onSave: vi.fn(), onCancel: vi.fn() });

		expect(screen.getByRole('radio', { name: 'Menthe' })).toBeInTheDocument();
		expect(screen.getByRole('radio', { name: 'Lavande' })).toBeInTheDocument();
		expect(container.querySelector('input[type="color"]')).toBeNull();
	});

	it('scénario 3 — sans choix explicite, aucune couleur n’est enregistrée (rendu par défaut)', async () => {
		const onSave = vi.fn();
		render(HabitForm, { habit: undefined, onSave, onCancel: vi.fn() });

		await fillValidHabit();
		await fireEvent.click(screen.getByRole('button', { name: 'Créer' }));

		const saved = onSave.mock.calls[0][0] as Habit;
		expect(saved.color).toBeUndefined();
	});

	it('scénario 2 — enregistre la teinte choisie à la création', async () => {
		const onSave = vi.fn();
		render(HabitForm, { habit: undefined, onSave, onCancel: vi.fn() });

		await fillValidHabit();
		await fireEvent.click(screen.getByRole('radio', { name: 'Menthe' }));
		await fireEvent.click(screen.getByRole('button', { name: 'Créer' }));

		const saved = onSave.mock.calls[0][0] as Habit;
		expect(saved.color).toBe('menthe');
	});

	it('scénario 5 — présélectionne la teinte enregistrée en édition et la remplace', async () => {
		const habit: Habit = {
			id: 'h1',
			name: 'Yoga',
			emoji: '🧘',
			frequency: { kind: 'interval', days: 1, anchor: '2026-01-01' },
			createdAt: '2026-01-01',
			color: 'menthe'
		};
		const onSave = vi.fn();
		render(HabitForm, { habit, onSave, onCancel: vi.fn() });

		expect(screen.getByRole('radio', { name: 'Menthe' })).toBeChecked();

		await fireEvent.click(screen.getByRole('radio', { name: 'Ciel' }));
		await fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

		const saved = onSave.mock.calls[0][0] as Habit;
		expect(saved.color).toBe('ciel');
		expect(saved.id).toBe('h1');
		expect(saved.createdAt).toBe('2026-01-01');
		expect(saved.frequency).toEqual({ kind: 'interval', days: 1, anchor: '2026-01-01' });
	});

	it('scénario 6 — resélectionner la teinte par défaut retire la couleur enregistrée', async () => {
		const habit: Habit = {
			id: 'h1',
			name: 'Yoga',
			emoji: '🧘',
			frequency: { kind: 'interval', days: 1, anchor: '2026-01-01' },
			createdAt: '2026-01-01',
			color: 'menthe'
		};
		const onSave = vi.fn();
		render(HabitForm, { habit, onSave, onCancel: vi.fn() });

		await fireEvent.click(screen.getByRole('radio', { name: 'Lavande' }));
		await fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

		const saved = onSave.mock.calls[0][0] as Habit;
		expect(saved.color).toBeUndefined();
	});

	it('scénario 4 — une habitude créée avant l’évolution s’édite sans perdre de données', async () => {
		const legacy: Habit = {
			id: 'h-legacy',
			name: 'Marcher',
			emoji: '🚶',
			frequency: { kind: 'weekdays', weekdays: [1, 3, 5] },
			createdAt: '2026-01-01'
		};
		const onSave = vi.fn();
		render(HabitForm, { habit: legacy, onSave, onCancel: vi.fn() });

		expect(screen.getByRole('radio', { name: 'Lavande' })).toBeChecked();

		await fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

		const saved = onSave.mock.calls[0][0] as Habit;
		expect(saved).toEqual(legacy);
	});

	it('scénario 5 — une édition ne réinitialise pas le statut ni la date de reprise automatique', async () => {
		const paused: Habit = {
			id: 'h1',
			name: 'Yoga',
			emoji: '🧘',
			frequency: { kind: 'interval', days: 1, anchor: '2026-01-01' },
			createdAt: '2026-01-01',
			status: 'paused',
			resumeAt: '2026-09-01'
		};
		const onSave = vi.fn();
		render(HabitForm, { habit: paused, onSave, onCancel: vi.fn() });

		await fireEvent.click(screen.getByRole('radio', { name: 'Sable' }));
		await fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

		const saved = onSave.mock.calls[0][0] as Habit;
		expect(saved.status).toBe('paused');
		expect(saved.resumeAt).toBe('2026-09-01');
		expect(saved.color).toBe('sable');
	});
});

describe('HabitForm — aucune notion d’urgence sur une habitude (US-039 scénario 13)', () => {
	it("ne propose jamais de marquage « Urgente » dans le formulaire d'habitude", () => {
		render(HabitForm, { habit: undefined, onSave: vi.fn(), onCancel: vi.fn() });
		expect(screen.queryByLabelText(/urgente/i)).toBeNull();
	});
});

