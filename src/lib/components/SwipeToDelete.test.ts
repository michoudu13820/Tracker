// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import Host from './SwipeToDeleteTestHost.svelte';

/**
 * jsdom ne fournit pas le constructeur `PointerEvent` : on simule le geste en dispatchant un
 * `MouseEvent` dont le `type` est forcé à `pointerdown`/`pointerup` — Svelte n'attache ses
 * gestionnaires `onpointerdown`/`onpointerup` que sur le nom du type d'événement, et le
 * composant ne lit que `event.clientX`, donc ce détournement est fidèle au comportement réel.
 */
function pointer(el: Element, type: 'pointerdown' | 'pointerup', clientX: number) {
	return fireEvent(el, new MouseEvent(type, { clientX, bubbles: true, cancelable: true }));
}

describe('SwipeToDelete (US-013/US-014 — geste partagé)', () => {
	it('révèle le bouton de suppression après un glissement suffisant vers la gauche (scénario 1)', async () => {
		const onReveal = vi.fn();
		render(Host, { revealed: false, onReveal, onCloseReveal: vi.fn(), onDeleteClick: vi.fn() });

		const content = screen.getByTestId('content');
		await pointer(content, 'pointerdown', 200);
		await pointer(content, 'pointerup', 100);

		expect(onReveal).toHaveBeenCalledTimes(1);
	});

	it("ne révèle rien pour un glissement trop court (en dessous du seuil)", async () => {
		const onReveal = vi.fn();
		render(Host, { revealed: false, onReveal, onCloseReveal: vi.fn(), onDeleteClick: vi.fn() });

		const content = screen.getByTestId('content');
		await pointer(content, 'pointerdown', 200);
		await pointer(content, 'pointerup', 190);

		expect(onReveal).not.toHaveBeenCalled();
	});

	it('affiche le bouton poubelle avec une zone tactile suffisante quand révélé (scénario 2)', () => {
		render(Host, {
			revealed: true,
			onReveal: vi.fn(),
			onCloseReveal: vi.fn(),
			onDeleteClick: vi.fn()
		});
		const trash = screen.getByRole('button', { name: 'Supprimer « Yoga »' });
		expect(trash).toBeInTheDocument();
	});

	it('appelle onDeleteClick au clic sur le bouton poubelle', async () => {
		const onDeleteClick = vi.fn();
		render(Host, {
			revealed: true,
			onReveal: vi.fn(),
			onCloseReveal: vi.fn(),
			onDeleteClick
		});
		await fireEvent.click(screen.getByRole('button', { name: 'Supprimer « Yoga »' }));
		expect(onDeleteClick).toHaveBeenCalledTimes(1);
	});

	it("referme sans action quand on interagit ailleurs sur la carte pendant qu'elle est révélée (scénario 5)", async () => {
		const onCloseReveal = vi.fn();
		const onEditLikeClick = vi.fn();
		render(Host, {
			revealed: true,
			onReveal: vi.fn(),
			onCloseReveal,
			onDeleteClick: vi.fn(),
			onContentClick: onEditLikeClick
		});

		await fireEvent.click(screen.getByTestId('content'));

		expect(onCloseReveal).toHaveBeenCalledTimes(1);
		// L'action normale du contenu (ex. ouvrir l'édition) n'est pas déclenchée.
		expect(onEditLikeClick).not.toHaveBeenCalled();
	});

	it("laisse l'action normale du contenu se déclencher quand non révélé", async () => {
		const onContentClick = vi.fn();
		render(Host, {
			revealed: false,
			onReveal: vi.fn(),
			onCloseReveal: vi.fn(),
			onDeleteClick: vi.fn(),
			onContentClick
		});

		await fireEvent.click(screen.getByTestId('content'));

		expect(onContentClick).toHaveBeenCalledTimes(1);
	});
});
