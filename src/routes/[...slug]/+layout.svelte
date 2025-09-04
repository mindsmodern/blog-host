<script lang="ts">
	import { page } from '$app/state';

	let { children } = $props();
</script>

{#key page.url.pathname}
	{@render children()}
{/key}
