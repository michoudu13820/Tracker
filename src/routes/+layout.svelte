<script lang="ts">
	import '../app.css';
	import { TabBar } from '$lib/components';

	let { children } = $props();
</script>

<div class="app">
	<main>
		{@render children()}
	</main>
	<TabBar />
</div>

<style>
	.app {
		display: flex;
		flex-direction: column;
		min-height: 100dvh;
	}
	main {
		flex: 1;
		width: 100%;
		max-width: 42rem;
		margin: 0 auto;
		padding: 1.5rem;
	}
</style>
