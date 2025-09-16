<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	interface ButtonProps extends HTMLButtonAttributes {
		variant?: 'primary' | 'secondary' | 'tertiary';
		size?: 'small' | 'medium' | 'large';
		children?: Snippet;
		fill?: boolean;
	}

	const {
		variant = 'primary',
		size = 'medium',
		children,
		class: className = '',
		fill = true,
		...restProps
	}: ButtonProps = $props();

	const buttonClass = $derived(`button--${variant} button--${size} ${className}`.trim());
</script>

<button class={buttonClass} class:fill {...restProps}>
	{#if children}
		{@render children()}
	{/if}
</button>

<style lang="scss">
	@use './theme-variables.scss' as *;

	button {
		border: none;
		border-radius: 0;
		cursor: pointer;
		font-family: $typography-family-sans;
		font-weight: $typography-weight-medium;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		transition: all 0.15s ease-in-out;
		text-decoration: none;
		white-space: nowrap;
		user-select: none;
		width: 100%;
		height: 100%;
		box-sizing: border-box;

		&:not(.fill) {
			max-width: 100%;
			width: fit-content;
			height: fit-content;
			border-radius: $size-control-radius-medium;
		}

		&:disabled {
			cursor: not-allowed;
			opacity: 0.5;
		}

		&:focus-visible {
			border-radius: $size-control-radius-medium;
			outline: $size-layout-thickness-thicker solid $palette-functional-primary;
			outline-offset: $size-layout-thickness-thicker;
		}
	}

	.button--primary {
		background-color: $palette-functional-primary;
		color: $palette-functional-background;
		border: $size-layout-thickness-thick solid $palette-functional-primary;

		&:hover:not(:disabled) {
			opacity: 0.9;
		}

		&:active:not(:disabled) {
			opacity: 0.8;
		}
	}

	.button--secondary {
		background-color: transparent;
		color: $palette-functional-foreground;
		border: $size-layout-thickness-thick solid $palette-functional-primary;

		&:hover:not(:disabled) {
			background-color: color-mix(in oklab, $palette-functional-primary, transparent 80%);
		}

		&:active:not(:disabled) {
			opacity: 0.8;
		}
	}

	.button--tertiary {
		background-color: transparent;
		color: $palette-functional-foreground;
		border: $size-layout-thickness-thick solid transparent;

		&:hover:not(:disabled) {
			background-color: $palette-functional-border;
		}

		&:active:not(:disabled) {
			opacity: 0.8;
		}
	}

	button:not(.fill) {
		&.button--small {
			font-size: $typography-dimension-small-size;
			line-height: $typography-dimension-small-height;
			padding: 0.1em 0.4em;
		}

		&.button--medium {
			padding: 0.3em 0.6em;
		}

		&.button--large {
			padding: 0.6em 1.2em;
		}
	}
</style>
