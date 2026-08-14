// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import CardColorPicker from './CardColorPicker.svelte';
import { CARD_COLORS, DEFAULT_CARD_COLOR, cardColorLabel } from '$lib/domain/card-colors';

describe('CardColorPicker — palette fermée (US-036 scénario 1)', () => {
	it('propose exactement les teintes de la palette, et aucune autre', () => {
		render(CardColorPicker, { value: DEFAULT_CARD_COLOR, onChange: vi.fn() });

		const radios = screen.getAllByRole('radio');
		expect(radios).toHaveLength(CARD_COLORS.length);
		expect(radios.map((r) => (r as HTMLInputElement).value)).toEqual([...CARD_COLORS]);
	});

	it('nomme chaque teinte en toutes lettres (jamais une pastille colorée seule)', () => {
		render(CardColorPicker, { value: DEFAULT_CARD_COLOR, onChange: vi.fn() });

		for (const color of CARD_COLORS) {
			expect(screen.getByRole('radio', { name: cardColorLabel(color) })).toBeInTheDocument();
		}
	});

	it("n'offre ni sélecteur de couleur libre, ni saisie de code hexadécimal", () => {
		const { container } = render(CardColorPicker, {
			value: DEFAULT_CARD_COLOR,
			onChange: vi.fn()
		});

		expect(container.querySelector('input[type="color"]')).toBeNull();
		expect(container.querySelector('input[type="text"]')).toBeNull();
		expect(screen.queryByPlaceholderText(/#/)).toBeNull();
	});

	it('présélectionne la teinte fournie', () => {
		render(CardColorPicker, { value: 'menthe', onChange: vi.fn() });
		expect(screen.getByRole('radio', { name: cardColorLabel('menthe') })).toBeChecked();
		expect(screen.getByRole('radio', { name: cardColorLabel('ciel') })).not.toBeChecked();
	});

	it('remonte la teinte sélectionnée au parent', async () => {
		const onChange = vi.fn();
		render(CardColorPicker, { value: DEFAULT_CARD_COLOR, onChange });

		await fireEvent.click(screen.getByRole('radio', { name: cardColorLabel('ciel') }));
		expect(onChange).toHaveBeenCalledWith('ciel');
	});

	it("scénario 10 — la pastille colorée est décorative et n'est jamais annoncée seule", () => {
		const { container } = render(CardColorPicker, {
			value: DEFAULT_CARD_COLOR,
			onChange: vi.fn()
		});

		const swatches = container.querySelectorAll('.swatch');
		expect(swatches).toHaveLength(CARD_COLORS.length);
		for (const swatch of swatches) expect(swatch.getAttribute('aria-hidden')).toBe('true');
	});
});
