<script lang="ts">
	import * as numberInput from '@zag-js/number-input';
	import { normalizeProps, useMachine } from '@zag-js/svelte';
	import { ChevronDown, ChevronUp } from '@lucide/svelte';

	const id = $props.id();

	let {
		min,
		max,
		step = 1,
		value = $bindable(min ?? max ?? 0),
		label,
		fill = false
	}: {
		min?: number;
		max?: number;
		step?: number;
		value?: number;
		label?: string;
		fill: boolean;
	} = $props();

	const service = useMachine(numberInput.machine, {
		id,
		get value() {
			return value.toString();
		},
		onValueChange(details) {
			console.log(details.valueAsNumber);
			if (Number.isNaN(details.valueAsNumber)) {
				value = min || 1;
				return;
			}
			value = details.valueAsNumber;
		},
		min,
		max,
		step,
		formatOptions: {
			maximumFractionDigits: 0
		}
	});
	const api = $derived(numberInput.connect(service, normalizeProps));
</script>

<div class:fill {...api.getRootProps()}>
	{#if label}
		<label {...api.getLabelProps()}>Enter number:</label>
	{/if}
	<input {...api.getInputProps()} />
	<div class="trigger">
		<button {...api.getIncrementTriggerProps()}><ChevronUp width={1} size={16} /></button>
		<button {...api.getDecrementTriggerProps()}><ChevronDown width={1} size={16} /></button>
	</div>
</div>

<style lang="scss">
	@use './theme-variables.scss' as *;

	[data-part='root'] {
		border: none;
		font-family: $typography-family-sans;
		font-weight: $typography-weight-medium;
		transition: all 0.15s ease-in-out;
		text-decoration: none;
		white-space: nowrap;
		user-select: none;

		display: flex;
		flex-direction: row;
		position: relative;

		max-width: 100%;
		height: fit-content;
		width: fit-content;
		border-radius: $size-control-radius-medium;

		&.fill {
			width: 100%;
			height: 100%;
		}
	}

	.trigger {
		display: flex;
		flex-direction: column;
		width: 1.25rem;
		height: 100%;
		position: absolute;
		right: 0;
	}

	[data-part='input'] {
		border: $size-layout-thickness-thick solid $palette-functional-border;
		padding: $size-layout-padding-condensed;
		padding-left: 0.5rem;
		padding-right: 1.25rem;
		border-radius: $size-control-radius-medium;
		background-color: transparent;

		&[data-disabled] {
			cursor: not-allowed;
			opacity: 0.5;
		}

		&:focus {
			border-radius: $size-control-radius-medium;
			outline: $size-layout-thickness-thicker solid $palette-functional-primary;
			outline-offset: calc($size-layout-thickness-thicker * -1);
		}

		.fill & {
			width: 100%;
			height: 100%;
			border: none;
			border-radius: 0;
			padding-top: 0;
			padding-bottom: 0;
		}
	}

	[data-part='increment-trigger'],
	[data-part='decrement-trigger'] {
		border: none;
		outline: none;
		&:focus {
			outline: none;
		}
		background-color: inherit;
		transition: all 0.15s ease-in-out;

		margin: 0;
		padding: 0;
		&:hover {
			background-color: color-mix(in oklab, $palette-functional-primary, transparent 80%);
		}
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;

		border-radius: $size-control-radius-medium;
		.fill & {
			border-radius: 0;
		}
	}
</style>
