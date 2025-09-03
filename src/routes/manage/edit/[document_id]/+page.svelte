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

	let { data } = $props();

	// Create configurations using our centralized config functions
	const mediaConfig = createMediaSchemaConfig();
	const windowConfig = createWindowSchemaConfig();
</script>

<ThemeProvider {theme}>
	<MediaSelector bind:this={mediaSelector} />
	<WindowSelector bind:this={windowSelector} availableDocuments={data.availableDocuments} />
	<DimensionProvider width={60}>
		<Editable
			doc={data.document.content}
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

<style>
	:global(html, body) {
		margin: 0;
		width: 100vw;
		height: 100vh;
	}
</style>
