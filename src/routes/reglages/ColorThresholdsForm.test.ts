// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import ColorThresholdsForm from './ColorThresholdsForm.svelte';
import { DEFAULT_THRESHOLDS } from '$lib/domain/summary';

describe('ColorThresholdsForm (US-006)', () => {
	it('préremplit avec les valeurs par défaut au premier accès (scénario 1)', () => {
		render(ColorThresholdsForm, {
			thresholds: { ...DEFAULT_THRESHOLDS },
			onSave: vi.fn(),
			onReset: vi.fn()
		});
		expect(screen.getByLabelText('Seuil vert (%)')).toHaveValue(80);
		expect(screen.getByLabelText('Seuil jaune (%)')).toHaveValue(40);
	});

	it('enregistre les nouveaux seuils saisis (scénario 2)', async () => {
		const onSave = vi.fn();
		render(ColorThresholdsForm, {
			thresholds: { ...DEFAULT_THRESHOLDS },
			onSave,
			onReset: vi.fn()
		});

		await fireEvent.input(screen.getByLabelText('Seuil vert (%)'), { target: { value: '90' } });
		await fireEvent.input(screen.getByLabelText('Seuil jaune (%)'), { target: { value: '50' } });
		await fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

		expect(onSave).toHaveBeenCalledWith({ green: 90, yellow: 50 });
	});

	it('bloque et signale un seuil jaune >= seuil vert (scénario 3)', async () => {
		const onSave = vi.fn();
		render(ColorThresholdsForm, {
			thresholds: { ...DEFAULT_THRESHOLDS },
			onSave,
			onReset: vi.fn()
		});

		await fireEvent.input(screen.getByLabelText('Seuil vert (%)'), { target: { value: '80' } });
		await fireEvent.input(screen.getByLabelText('Seuil jaune (%)'), { target: { value: '85' } });
		await fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

		expect(onSave).not.toHaveBeenCalled();
		expect(screen.getByRole('alert')).toHaveTextContent(
			'strictement inférieur au seuil vert'
		);
	});

	it('bloque et signale une valeur hors de 0-100 (scénario 3)', async () => {
		const onSave = vi.fn();
		render(ColorThresholdsForm, {
			thresholds: { ...DEFAULT_THRESHOLDS },
			onSave,
			onReset: vi.fn()
		});

		await fireEvent.input(screen.getByLabelText('Seuil vert (%)'), { target: { value: '150' } });
		await fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

		expect(onSave).not.toHaveBeenCalled();
		expect(await screen.findByRole('alert')).toHaveTextContent('comprises entre 0 et 100 %');
	});

	it('réinitialise aux valeurs par défaut (scénario 4)', async () => {
		const onReset = vi.fn();
		render(ColorThresholdsForm, {
			thresholds: { green: 90, yellow: 50 },
			onSave: vi.fn(),
			onReset
		});

		await fireEvent.click(
			screen.getByRole('button', { name: 'Réinitialiser aux valeurs par défaut' })
		);

		expect(onReset).toHaveBeenCalledTimes(1);
		expect(screen.getByLabelText('Seuil vert (%)')).toHaveValue(80);
		expect(screen.getByLabelText('Seuil jaune (%)')).toHaveValue(40);
	});
});
