// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { fireEvent } from '@testing-library/svelte';
import DateStrip from './DateStrip.svelte';
import { dateStripRange } from '$lib/domain/dates';

/**
 * Frise de dates (US-011) : rendu (jour du mois dans un rond, jour de semaine abrégé
 * au-dessus), sélection au clic, jour sélectionné visuellement distingué, plage couvrant
 * plusieurs semaines.
 */
describe('DateStrip (US-011)', () => {
	it('affiche chaque jour avec le chiffre du jour et les 3 lettres du jour de semaine (scénario 2)', () => {
		const dates = dateStripRange('2026-08-12', 0, 0); // un seul jour : mercredi 12 août
		render(DateStrip, { dates, selected: '2026-08-12', onSelect: vi.fn() });

		const button = screen.getByRole('button', { name: 'mercredi 12 août' });
		expect(button).toBeInTheDocument();
		expect(button).toHaveTextContent('Mer');
		expect(button).toHaveTextContent('12');
	});

	it('appelle onSelect avec la date tapée (scénario 3)', async () => {
		const dates = dateStripRange('2026-08-12', 1, 1);
		const onSelect = vi.fn();
		render(DateStrip, { dates, selected: '2026-08-12', onSelect });

		await fireEvent.click(screen.getByRole('button', { name: 'jeudi 13 août' }));
		expect(onSelect).toHaveBeenCalledWith('2026-08-13');
	});

	it('distingue visuellement le jour sélectionné (scénario 4)', () => {
		const dates = dateStripRange('2026-08-12', 1, 1);
		render(DateStrip, { dates, selected: '2026-08-13', onSelect: vi.fn() });

		const selectedButton = screen.getByRole('button', { name: 'jeudi 13 août' });
		const otherButton = screen.getByRole('button', { name: 'mercredi 12 août' });
		expect(selectedButton).toHaveAttribute('aria-current', 'date');
		expect(otherButton).not.toHaveAttribute('aria-current');
	});

	it('couvre plusieurs semaines passées et futures autour du centre (scénario 6)', () => {
		const dates = dateStripRange('2026-08-12', 2, 2);
		render(DateStrip, { dates, selected: '2026-08-12', onSelect: vi.fn() });

		// 2 semaines avant + 2 semaines après + le jour = 29 jours = plusieurs semaines.
		expect(screen.getAllByRole('button')).toHaveLength(29);
		expect(screen.getByRole('button', { name: /29 juillet/ })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /26 août/ })).toBeInTheDocument();
	});
});
