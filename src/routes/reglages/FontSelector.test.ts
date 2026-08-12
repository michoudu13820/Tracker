// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import FontSelector from './FontSelector.svelte';

afterEach(() => {
	document.getElementById('tracker-google-fonts')?.remove();
});

describe('FontSelector (US-016, étendu par US-020)', () => {
	it('présélectionne Dancing Script comme nouvelle police par défaut (US-020 scénario 1)', () => {
		render(FontSelector, { selected: 'dancing-script', onSave: vi.fn(), onReset: vi.fn() });

		expect(
			screen.getByRole('radio', { name: /Dancing Script \(par défaut\)/ })
		).toHaveAttribute('aria-checked', 'true');
	});

	it("la police système n'est plus marquée comme la police par défaut (US-020 scénario 1)", () => {
		render(FontSelector, { selected: 'dancing-script', onSave: vi.fn(), onReset: vi.fn() });

		const systemOption = screen.getByRole('radio', { name: /^Système$/ });
		expect(systemOption).toHaveAttribute('aria-checked', 'false');
	});

	it('propose onze polices nommées (US-020 : catalogue étendu), chacune avec son propre style (scénario liste)', () => {
		render(FontSelector, { selected: 'dancing-script', onSave: vi.fn(), onReset: vi.fn() });

		const options = screen.getAllByRole('radio');
		expect(options.length).toBe(11);
		const inter = screen.getByRole('radio', { name: /^Inter/ });
		expect(inter.getAttribute('style')).toContain('Inter');
		const dancingScript = screen.getByRole('radio', { name: /^Dancing Script/ });
		expect(dancingScript.getAttribute('style')).toContain('Dancing Script');
	});

	it('applique immédiatement une police différente, sans action supplémentaire (scénario 3)', async () => {
		const onSave = vi.fn();
		render(FontSelector, { selected: 'dancing-script', onSave, onReset: vi.fn() });

		await fireEvent.click(screen.getByRole('radio', { name: /^Poppins/ }));

		expect(onSave).toHaveBeenCalledWith('poppins');
	});

	it("n'appelle pas onSave en re-cliquant sur la police déjà sélectionnée", async () => {
		const onSave = vi.fn();
		render(FontSelector, { selected: 'inter', onSave, onReset: vi.fn() });

		await fireEvent.click(screen.getByRole('radio', { name: /^Inter/ }));

		expect(onSave).not.toHaveBeenCalled();
	});

	it('réinitialise vers la police par défaut au clic sur le bouton de réinitialisation (US-020 scénario reset)', async () => {
		const onReset = vi.fn();
		render(FontSelector, { selected: 'quicksand', onSave: vi.fn(), onReset });

		await fireEvent.click(screen.getByRole('button', { name: 'Réinitialiser à la police par défaut' }));

		expect(onReset).toHaveBeenCalledTimes(1);
	});

	it("le libellé du bouton de réinitialisation ne mentionne plus spécifiquement la police système (US-020)", () => {
		render(FontSelector, { selected: 'quicksand', onSave: vi.fn(), onReset: vi.fn() });

		expect(screen.queryByRole('button', { name: /police système/i })).toBeNull();
	});

	it('désactive le bouton de réinitialisation quand Dancing Script (nouvelle police par défaut) est déjà active', () => {
		render(FontSelector, { selected: 'dancing-script', onSave: vi.fn(), onReset: vi.fn() });

		expect(
			screen.getByRole('button', { name: 'Réinitialiser à la police par défaut' })
		).toBeDisabled();
	});

	it('active le bouton de réinitialisation quand la police système (non par défaut depuis US-020) est sélectionnée', () => {
		render(FontSelector, { selected: 'system', onSave: vi.fn(), onReset: vi.fn() });

		expect(
			screen.getByRole('button', { name: 'Réinitialiser à la police par défaut' })
		).toBeEnabled();
	});

	it('charge la feuille de style Google Fonts combinée pour prévisualiser les options', () => {
		render(FontSelector, { selected: 'dancing-script', onSave: vi.fn(), onReset: vi.fn() });

		expect(document.getElementById('tracker-google-fonts')).not.toBeNull();
	});
});
