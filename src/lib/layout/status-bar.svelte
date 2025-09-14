<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import type { SupabaseClient } from '@supabase/supabase-js';
	import type { Snippet } from 'svelte';

	let {
		data,
		children,
		control
	}: {
		data: {
			supabase: SupabaseClient;
		};
		children?: Snippet;
		control?: Snippet;
	} = $props();
	let { supabase } = $derived(data);
	const logout = async () => {
		const { error } = await supabase.auth.signOut();
		if (error) {
			console.error(error);
		}
	};
</script>

<div class="layout-container">
	<header>
		<nav>
			<h2>White Chamber</h2>
			{#if control}
				<div class="control">
					{@render control?.()}
				</div>
			{/if}
			<div>
				<Button variant="tertiary" onclick={logout}>Logout</Button>
			</div>
		</nav>
	</header>
	<main>
		{@render children?.()}
	</main>
</div>

<style lang="scss">
	@use '$lib/components/grid-helper.scss' as *;
	@use '@mindsmodern/design-primitives/styles.scss' as *;

	header {
		user-select: none;
	}
	h2 {
		font-weight: $typography-weight-semibold;
		font-size: $typography-dimension-large-size;
		line-height: $typography-dimension-large-height;
		margin: 0;
		letter-spacing: -0.03em;
		padding: $size-layout-padding-condensed;
		@include respond-to(sm) {
			padding: $size-layout-padding-normal;
		}
	}

	h2,
	.control {
		border-right: $size-layout-thickness-thick solid $palette-functional-border;
	}

	.control {
		flex: 1;
	}

	.layout-container {
		display: flex;
		flex-direction: column;
		width: 100%;
		height: 100%;
		border: $size-layout-thickness-thick solid $palette-functional-border;
		border-left: none;
		border-right: none;
	}

	header {
		border-bottom: $size-layout-thickness-thick solid $palette-functional-border;
	}

	nav {
		display: flex;
		justify-content: space-between;

		a {
			text-decoration: none;
			color: $palette-functional-foreground;

			&:hover {
				color: $palette-functional-primary;
			}
		}
	}

	.actions {
		padding: $size-layout-padding-condensed;

		@include respond-to(sm) {
			padding: $size-layout-padding-normal;
		}
	}
	main {
		overflow: auto;
		min-height: 0;
		flex: 1 0;
	}
</style>
