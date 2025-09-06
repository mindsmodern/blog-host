<script lang="ts">
	import type { HTMLButtonAttributes } from 'svelte/elements';
	interface InputProps extends HTMLButtonAttributes {
		value?: string;
		size: 'small' | 'medium' | 'large';
	}

	let { value = $bindable(''), size = 'medium', ...restProps }: InputProps = $props();
</script>

<input bind:value class={size} />

<style lang="scss">
	@use '@mindsmodern/design-primitives/styles.scss' as *;

	input {
		box-sizing: border-box;
		border-radius: $size-control-radius-medium;
		border: $size-layout-thickness-thick solid $palette-functional-border;
		padding: 0.3rem 0.5rem;
		background-color: inherit;

		&:focus-visible {
			border: none;
			outline: $size-layout-thickness-thicker solid $palette-functional-primary;
			outline-offset: -$size-layout-thickness-thicker;
		}
	}
</style>
