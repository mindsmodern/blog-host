<script lang="ts">
	import Button from './Button.svelte';
	import NumberInput from './number-input.svelte';

	let {
		width = $bindable(500),
		onSave
	}: {
		width?: number;
		onSave?: (width: number) => void | Promise<void>;
	} = $props();
	let saveStatus = $state<'idle' | 'saving' | 'success'>('idle');

	const handleSave = async () => {
		if (onSave) {
			saveStatus = 'saving';

			try {
				await onSave(width);
				saveStatus = 'success';

				// Reset status after 2 seconds
				setTimeout(() => {
					saveStatus = 'idle';
				}, 2000);
			} catch (error) {
				console.error('Save failed:', error);
				saveStatus = 'idle';
			}
		}
	};
</script>

<div class="control-panel">
	<div class="panel-header">
		<div class="status-bar">
			{#if saveStatus === 'saving'}
				<span class="status saving">Saving...</span>
			{:else if saveStatus === 'success'}
				<span class="status success">Saved ✓</span>
			{:else}
				<span class="status idle">Width Control Panel</span>
			{/if}
		</div>
	</div>

	<div class="panel-content">
		<div class="width-control">
			<label>Width (px)</label>
			<div class="input-wrapper">
				<NumberInput
					bind:value={width}
					min={100}
					max={2000}
					step={10}
					fill={false}
				/>
			</div>
		</div>

		<div class="save-section">
			<Button
				variant="primary"
				fill={false}
				onclick={handleSave}
				disabled={saveStatus === 'saving'}
			>
				{saveStatus === 'saving' ? 'Saving...' : 'Save Width'}
			</Button>
		</div>
	</div>
</div>

<style lang="scss">
	@use '$lib/components/grid-helper.scss' as grid;
	@use '@mindsmodern/design-primitives/styles.scss' as *;

	.control-panel {
		display: flex;
		flex-direction: column;
		width: 100%;
		max-width: 400px;
		border: $size-layout-thickness-thick solid $palette-functional-border;
		border-radius: $size-control-radius-medium;
		background-color: $palette-functional-background;
		overflow: hidden;
	}

	.panel-header {
		height: 3rem;
		border-bottom: $size-layout-thickness-thin solid $palette-functional-border;
		flex-shrink: 0;
		display: flex;
		align-items: center;
		box-sizing: border-box;
	}

	.status-bar {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.status {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: $typography-weight-medium;
		white-space: nowrap;
		border-radius: 0;
	}

	.status.saving {
		background: $palette-functional-tertiary;
		color: $palette-functional-background;
	}

	.status.success {
		background: $palette-functional-secondary;
		color: $palette-functional-background;
	}

	.status.idle {
		background: $palette-functional-border;
		color: $palette-functional-foreground;
	}

	.panel-content {
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.width-control {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;

		label {
			font-weight: $typography-weight-medium;
			color: $palette-functional-foreground;
			font-size: $typography-dimension-small-size;
		}
	}

	.input-wrapper {
		display: flex;
		align-items: center;
	}

	.save-section {
		display: flex;
		justify-content: center;
	}
</style>