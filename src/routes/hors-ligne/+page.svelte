<script lang="ts">
	/**
	 * Écran de repli hors connexion (US-040 scénario 5).
	 *
	 * Affiché par le service worker quand une navigation ne peut aboutir ni par le cache ni par
	 * le réseau — typiquement une URL jamais ouverte sur cet appareil. C'est une route normale,
	 * donc prérendue et précachée avec les autres : elle est disponible hors ligne sans
	 * traitement particulier.
	 *
	 * Deux exigences du scénario : un message compréhensible (pas l'erreur brute du navigateur)
	 * et une **issue explicite** vers le planning, qui lui est toujours disponible localement —
	 * l'utilisateur ne doit jamais se retrouver dans un cul-de-sac.
	 *
	 * Aucun indicateur global de connexion ici : l'arbitrage produit du 2026-08-16 l'exclut
	 * volontairement du périmètre.
	 */
</script>

<svelte:head><title>Hors connexion — Tracker</title></svelte:head>

<h1>Contenu non disponible hors connexion</h1>

<div class="notice" role="status">
	<p>Cette page n'a pas encore été enregistrée sur cet appareil, et le réseau est indisponible.</p>
	<p>Tes habitudes, tes tâches et ton historique restent accessibles : ils sont stockés localement.</p>
</div>

<a class="action" href="/">Revenir au planning</a>

<style>
	h1 {
		font-size: 1.25rem;
		margin-bottom: 1rem;
	}
	.notice {
		background: var(--surface);
		border: 1px solid var(--surface-border);
		border-radius: 0.75rem;
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 1.25rem;
	}
	.notice p {
		margin: 0;
	}
	.action {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 44px;
		padding: 0 1.25rem;
		border-radius: 0.5rem;
		background: var(--surface);
		border: 1px solid var(--surface-border);
		color: var(--text);
		text-decoration: none;
	}
</style>
