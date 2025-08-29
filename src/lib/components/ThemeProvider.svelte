<script lang="ts" module>
	const uniqueContextId = 'mm-theme-provider-container-90uc9ahseu';
	export const getContainer = () =>
		(getContext(uniqueContextId) as { dom: HTMLElement | null }).dom;
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import { theme } from '@mindsmodern/design-primitives';
	import { deepMerge, generateCSSVariables } from './utils/theme-utils.js';
	import { getContext, setContext } from 'svelte';

	interface Props {
		children: Snippet;
		customTheme?: Record<string, any>;
	}

	const { children, customTheme }: Props = $props();

	// Merge default theme with custom overrides
	const mergedTheme = $derived(customTheme ? deepMerge(theme, customTheme) : theme);

	const cssVariables = $derived(() => generateCSSVariables(mergedTheme));

	const styleAttribute = $derived(
		Object.entries(cssVariables())
			.map(([key, value]) => `${key}: ${value}`)
			.join('; ')
	);
	let container = $state<{ dom: HTMLElement | null }>({
		dom: null
	});
	// const container: { container: HTMLElement | null } = { container: null }
	setContext(uniqueContextId, container);
</script>

<div bind:this={container.dom} style={styleAttribute}>
	{@render children()}
</div>

<style lang="scss">
	@use './theme-variables.scss' as *;

	div {
		/* Ensure CSS variables are inherited by all children */
		position: absolute;
		top: 0;
		left: 0;
		overflow: auto;
		width: 100dvw;
		height: 100dvh;
		background-color: $palette-functional-background;
		color: $palette-functional-foreground;
		color-scheme: light;
		font-family: $typography-family-sans;
		font-weight: $typography-weight-normal;
		font-size: $typography-dimension-medium-size;
		line-height: $typography-dimension-medium-height;
	}
</style>
