<script lang="ts">
	import theme from '@mindsmodern/design-primitives';
	import type { PageProps } from './$types';
	import { DimensionProvider, ThemeProvider } from '@mindsmodern/grid-editor';

	let { data }: PageProps = $props();
	let { title, content, width, description } = data.post;
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
</svelte:head>

<ThemeProvider {theme}>
	<DimensionProvider width={width || 32}
		><div class="ProseMirror">{@html content}</div>
	</DimensionProvider>
</ThemeProvider>
