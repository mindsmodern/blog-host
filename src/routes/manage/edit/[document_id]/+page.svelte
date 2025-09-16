<script lang="ts">
	import { Editable, ThemeProvider, DimensionProvider } from '@mindsmodern/grid-editor';
	import theme from '@mindsmodern/design-primitives'; // TODO: Fix - relative sized theme
	import MediaSelector from './media-selector.svelte';
	import WindowSelector from './window-selector.svelte';
	import { createMediaSchemaConfig } from '$lib/content/media';
	import { createWindowSchemaConfig } from '$lib/content/window';

	let mediaSelector: { selector: MediaSelectorType };
	let windowSelector: { selector: WindowSelectorType };

	import type { MediaSelector as MediaSelectorType } from '@mindsmodern/grid-editor';
	import type { WindowSelector as WindowSelectorType } from '@mindsmodern/grid-editor';
	import { relativizeTheme } from '$lib/theme';
	import StatusBar from '$lib/layout/status-bar.svelte';
	import NumberInput from '$lib/components/number-input.svelte';
	import Button from '$lib/components/Button.svelte';
	import { invalidateAll } from '$app/navigation';
	import { onMount } from 'svelte';

	let { data } = $props();
	let title = $state(data.post.title || 'Untitled');
	let width = $state(data.document.width || 32);
	let content = $state(data.document.content);

	// Original values for tracking modifications
	const originalTitle = data.post.title || 'Untitled';
	const originalWidth = data.document.width || 32;
	const originalContent = JSON.stringify(data.document.content);

	// Save status tracking
	let saveStatus = $state<'idle' | 'saving' | 'success' | 'error'>('idle');

	// Track if any values have been modified
	let hasModifications = $derived(
		title !== originalTitle ||
			width !== originalWidth ||
			JSON.stringify(content) !== originalContent
	);

	const handleSave = async () => {
		if (!hasModifications) return;

		saveStatus = 'saving';

		try {
			const supabase = data.supabase;
			const promises = [];

			// Update post title if changed
			if (title !== originalTitle) {
				promises.push(supabase.from('posts').update({ title }).eq('id', data.post.id));
			}

			// Update document width and content if changed
			const documentUpdates: any = {};
			if (width !== originalWidth) {
				documentUpdates.width = width;
			}
			if (JSON.stringify(content) !== originalContent) {
				documentUpdates.content = content;
			}

			if (Object.keys(documentUpdates).length > 0) {
				promises.push(
					supabase.from('documents').update(documentUpdates).eq('id', data.document.id)
				);
			}

			// Execute all updates
			const results = await Promise.all(promises);

			// Check for errors
			const errors = results.filter((result) => result.error);
			if (errors.length > 0) {
				throw new Error(errors.map((e) => e.error!.message).join(', '));
			}

			saveStatus = 'success';

			// Hook for preserving custom state - store any info you need before reload
			// You can extend this object with whatever state you want to preserve
			const preservedInfo = {
				timestamp: Date.now()
				// Add your custom preservation data here
				// Example: cursorPosition, selectedElements, etc.
			};
			sessionStorage.setItem('editorPreservedInfo', JSON.stringify(preservedInfo));

			// Reload the page data
			await invalidateAll();

			// Reset status after 2 seconds
			setTimeout(() => {
				saveStatus = 'idle';
			}, 2000);
		} catch (error) {
			console.error('Save failed:', error);
			saveStatus = 'error';

			// Reset error status after 5 seconds
			setTimeout(() => {
				saveStatus = 'idle';
			}, 5000);
		}
	};
	// Hook for restoring preserved info after page reload
	$effect(() => {
		const preserved = sessionStorage.getItem('editorPreservedInfo');
		if (preserved) {
			try {
				const preservedInfo = JSON.parse(preserved);
				console.log('Restored preserved info:', preservedInfo);

				// Clear the preserved info after use
				sessionStorage.removeItem('editorPreservedInfo');

				// You can add custom restoration logic here
				// Example: restore cursor position, selected elements, etc.
			} catch (e) {
				console.warn('Failed to parse preserved info:', e);
				sessionStorage.removeItem('editorPreservedInfo');
			}
		}
	});

	// Warn user before closing window with unsaved changes
	onMount(() => {
		const handleBeforeUnload = (event: BeforeUnloadEvent) => {
			if (hasModifications) {
				event.preventDefault();
				// Modern browsers will show their own confirmation dialog
				// The custom message is ignored in most browsers for security reasons
				return 'You have unsaved changes. Are you sure you want to leave?';
			}
		};

		window.addEventListener('beforeunload', handleBeforeUnload);

		return () => {
			window.removeEventListener('beforeunload', handleBeforeUnload);
		};
	});

	// Create configurations using our centralized config functions
	const mediaConfig = createMediaSchemaConfig();
	const windowConfig = createWindowSchemaConfig();
</script>

<svelte:head>
	<title>{title}</title>
</svelte:head>

<StatusBar {data}>
	{#snippet control()}
		<div class="editor-controls">
			<div class="control-group">
				<label for="title-input">Title</label>
				<input id="title-input" type="text" bind:value={title} />
			</div>
			<div class="control-group">
				<label for="width-input">Width</label>
				<NumberInput bind:value={width} fill={false}></NumberInput>
			</div>
			<div class="control-group">
				<Button
					variant="primary"
					size="small"
					fill={false}
					disabled={!hasModifications || saveStatus === 'saving'}
					onclick={handleSave}
				>
					{saveStatus === 'saving' ? 'Saving...' : 'Save'}
				</Button>
			</div>
			<div class="status-indicator">
				{#if saveStatus === 'saving'}
					<span class="status syncing">Saving...</span>
				{:else if saveStatus === 'success'}
					<span class="status success">Saved ✓</span>
				{:else if saveStatus === 'error'}
					<span class="status error">Error saving</span>
				{/if}
			</div>
		</div>
	{/snippet}
	<ThemeProvider theme={relativizeTheme(theme)}>
		<MediaSelector bind:this={mediaSelector} />
		<WindowSelector bind:this={windowSelector} availableDocuments={data.availableDocuments} />
		<DimensionProvider {width}>
			<Editable
				bind:doc={content}
				options={{
					schema: {
						media: mediaConfig,
						window: windowConfig
					},
					menu: {
						overlay: {
							empty: {
								mediaSelector,
								windowSelector
							}
						}
					}
				}}
			/>
		</DimensionProvider>
	</ThemeProvider>

	<style lang="scss">
		@use '@mindsmodern/design-primitives/styles.scss' as *;

		:global(html, body) {
			margin: 0;
			width: 100vw;
			height: 100vh;
		}

		.editor-controls {
			display: flex;
			gap: $size-layout-gap-normal;
			align-items: center;
		}

		.control-group {
			display: flex;
			flex-direction: column;
			gap: $size-layout-gap-condensed;

			label {
				font-size: $typography-dimension-small-size;
				font-weight: $typography-weight-medium;
				color: $palette-functional-foreground;
			}

			input {
				padding: $size-layout-padding-condensed;
				border: $size-layout-thickness-thin solid $palette-functional-border;
				border-radius: $size-control-radius-small;
				background: $palette-functional-background;
				color: $palette-functional-foreground;
				font-size: $typography-dimension-small-size;
				min-width: 6rem;

				&:focus {
					outline: $size-layout-thickness-thin solid $palette-functional-primary;
					border-color: $palette-functional-primary;
				}

				&[type='number'] {
					min-width: 4rem;
				}
			}
		}

		.status-indicator {
			display: flex;
			align-items: center;
			min-width: 8rem;
		}

		.status {
			padding: $size-layout-padding-condensed;
			border-radius: $size-control-radius-small;
			font-size: $typography-dimension-small-size;
			font-weight: $typography-weight-medium;
			white-space: nowrap;
			text-align: center;
			width: 100%;
		}

		.status.syncing {
			background: $palette-functional-tertiary;
			color: $palette-functional-background;
		}

		.status.success {
			background: $palette-functional-secondary;
			color: $palette-functional-background;
		}

		.status.error {
			background: $palette-functional-primary;
			color: $palette-functional-background;
		}
	</style>
</StatusBar>
