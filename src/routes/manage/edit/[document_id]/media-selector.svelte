<script lang="ts">
	import type { MediaSelector, MediaSelectorAttrs } from '@mindsmodern/grid-editor';
	import { blur } from 'svelte/transition';
	import { uploadMedia } from '$lib/content/media';
	import { page } from '$app/stores';

	let current = $state<((value: MediaSelectorAttrs | null) => void) | null>(null);
	let selectedFile = $state<File | null>(null);
	let isUploading = $state(false);
	let uploadError = $state('');

	export const selector: MediaSelector = (type) => {
		if (current !== null) {
			return Promise.reject({ cause: 'Another selection is in process.' });
		}

		return new Promise((resolve, reject) => {
			current = (value) => {
				if (value === null) {
					reject({ cause: 'User cancelled selection' });
				} else {
					resolve(value);
				}
				current = null;
				selectedFile = null;
				uploadError = '';
			};
		});
	};

	const handleFileSelect = (event: Event) => {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (file) {
			selectedFile = file;
		}
	};

	const uploadAndSelect = async () => {
		if (!selectedFile || !current) return;

		// Get domain ID from page data - this should come from the document/post context
		const domainId = $page.data.domain?.id;

		if (!domainId) {
			uploadError = 'No domain context found. Cannot upload media.';
			return;
		}

		isUploading = true;
		uploadError = '';

		try {
			const result = await uploadMedia(selectedFile, domainId, $page.data.supabase);

			current({
				id: result.handle,
				title: selectedFile.name,
				width: null,
				left: 0,
				top: 0
			});
		} catch (error) {
			uploadError = error instanceof Error ? error.message : 'Upload failed';
			isUploading = false;
		}
	};
</script>

{#if current !== null}
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div
		transition:blur={{ duration: 100 }}
		class="wrapper"
		role="dialog"
		onclick={(event) => {
			if (event.target === event.currentTarget) {
				current?.(null);
			}
		}}
		onkeydown={(event) => {
			event.preventDefault();
			if (event.key === ' ' || event.key === 'Esc') {
				current?.(null);
			}
		}}
	>
		<div class="modal">
			<div class="instruction">
				<p class="inst1">Upload Media File</p>
				<p class="inst2">Select an image or video file to add to your blog post.</p>
			</div>
			<div class="controls">
				<div class="control-group">
					<input
						type="file"
						accept="image/*,video/*"
						onchange={handleFileSelect}
						disabled={isUploading}
					/>
				</div>
			</div>
			{#if uploadError}
				<div class="error">
					<p>❌ {uploadError}</p>
				</div>
			{/if}
			<div class="button">
				<button
					onclick={uploadAndSelect}
					disabled={!selectedFile || isUploading}
					class:uploading={isUploading}
				>
					{isUploading ? 'Uploading...' : 'Upload & Add Media'}
				</button>
			</div>
		</div>
	</div>
{/if}

<style lang="scss">
	@use '@mindsmodern/design-primitives/styles.scss' as theme;

	.wrapper {
		position: fixed;
		z-index: 9999;
		width: 100vw;
		height: 100vh;
		backdrop-filter: blur(1px);
		background-color: color-mix(in hsl, theme.$palette-functional-background, transparent 40%);
		display: grid;
		align-items: center;
		justify-items: center;
	}

	.instruction {
		display: flex;
		flex-direction: column;
		gap: theme.$size-layout-gap-condensed;
		font-size: 0.8em;
		padding-left: theme.$size-layout-gap-condensed;
		padding-right: theme.$size-layout-gap-condensed;
	}

	.inst1 {
		margin: 0px;
		color: theme.$palette-functional-foreground;
	}

	.inst2 {
		margin: 0px;
		color: color-mix(
			in hsl,
			theme.$palette-functional-foreground,
			theme.$palette-functional-background 60%
		);
	}

	.controls {
		display: flex;
		flex-direction: column;
		gap: theme.$size-layout-gap-condensed;
		flex: 1;
	}

	.control-group {
		display: flex;
		flex-direction: column;
		gap: 0.5em;
	}

	.control-group label {
		font-size: 0.9em;
		font-weight: 500;
		color: theme.$palette-functional-foreground;
	}

	.control-group select,
	.control-group input {
		padding: 0.5em;
		border: 1px solid color-mix(in hsl, theme.$palette-functional-foreground, transparent 70%);
		border-radius: 4px;
		background-color: theme.$palette-functional-background;
		color: theme.$palette-functional-foreground;
		font-size: 0.9em;
	}

	.control-group select:focus,
	.control-group input:focus {
		outline: 2px solid theme.$palette-functional-primary;
		border-color: theme.$palette-functional-primary;
	}

	.control-group input[type='file'] {
		padding: 0.3em;
		border: 2px dashed color-mix(in hsl, theme.$palette-functional-foreground, transparent 70%);
		border-radius: 4px;
		background-color: color-mix(in hsl, theme.$palette-functional-foreground, transparent 97%);
		cursor: pointer;
	}

	.control-group input[type='file']:hover {
		border-color: color-mix(in hsl, theme.$palette-functional-foreground, transparent 50%);
		background-color: color-mix(in hsl, theme.$palette-functional-foreground, transparent 95%);
	}

	.file-info {
		padding: 0.5em;
		background-color: color-mix(in hsl, theme.$palette-functional-foreground, transparent 95%);
		border-radius: 4px;
		font-size: 0.85em;
	}

	.file-info p {
		margin: 0.2em 0;
		color: color-mix(in hsl, theme.$palette-functional-foreground, transparent 20%);
	}

	.error {
		padding: 0.5em;
		background-color: color-mix(in hsl, #ff4444, transparent 90%);
		border: 1px solid color-mix(in hsl, #ff4444, transparent 50%);
		border-radius: 4px;
		font-size: 0.9em;
	}

	.error p {
		margin: 0;
		color: #cc0000;
	}

	.modal {
		font-size: 1rem;
		height: clamp(20rem, 60%, 40rem);
		width: clamp(20rem, 60%, 40rem);
		background-color: theme.$palette-functional-background;
		border-radius: theme.$size-layout-gap-spacious;
		padding: theme.$size-layout-gap-spacious;
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		gap: theme.$size-layout-gap-condensed;
	}

	.button {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	button {
		font-size: 1rem;
		margin: 0;
		padding: 0.3em 0.4em 0.3em 0.4em;
		line-height: 1em;
		border: none;
		color: theme.$palette-functional-foreground;
		background-color: transparent;
	}

	button:hover {
		border: none;
		color: theme.$palette-functional-background;
		background-color: theme.$palette-functional-foreground;
		cursor: pointer;
	}

	button:focus {
		outline-color: theme.$palette-functional-primary;
	}

	button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		background-color: transparent;
		color: color-mix(in hsl, theme.$palette-functional-foreground, transparent 50%);
	}

	button.uploading {
		animation: pulse 1.5s ease-in-out infinite;
	}

	@keyframes pulse {
		0% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
		100% {
			opacity: 1;
		}
	}
</style>
