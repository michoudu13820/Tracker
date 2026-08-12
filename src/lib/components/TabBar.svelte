<script lang="ts">
	/**
	 * Barre d'onglets de navigation (coquille applicative, pas de logique métier).
	 * Structure de navigation principale de la PWA — voir ADR-002 (routes + onglets).
	 * Les libellés/icônes sont provisoires : à affiner avec l'UI lors des US.
	 */
	import { page } from '$app/state';

	const tabs = [
		{ href: '/', label: "Aujourd'hui", icon: '📅' },
		{ href: '/habitudes', label: 'Habitudes', icon: '🔁' },
		{ href: '/taches', label: 'Tâches', icon: '✅' },
		{ href: '/resume', label: 'Résumé', icon: '📊' },
		{ href: '/reglages', label: 'Réglages', icon: '⚙️' }
	];

	function isActive(href: string): boolean {
		return href === '/' ? page.url.pathname === '/' : page.url.pathname.startsWith(href);
	}
</script>

<nav aria-label="Navigation principale">
	{#each tabs as tab (tab.href)}
		<a href={tab.href} aria-current={isActive(tab.href) ? 'page' : undefined}>
			<span class="icon" aria-hidden="true">{tab.icon}</span>
			<span class="label">{tab.label}</span>
		</a>
	{/each}
</nav>

<style>
	nav {
		position: sticky;
		bottom: 0;
		display: flex;
		justify-content: space-around;
		background: var(--surface);
		border-top: 1px solid var(--surface-border);
		box-shadow: var(--surface-shadow);
		padding: 0.5rem 0 calc(0.5rem + env(safe-area-inset-bottom));
	}
	a {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.15rem;
		color: var(--muted);
		text-decoration: none;
		font-size: 0.7rem;
	}
	a[aria-current='page'] {
		color: var(--accent-text);
		font-weight: 600;
	}
	.icon {
		font-size: 1.3rem;
	}
</style>
