<script lang="ts">
	import type { WindowSelector, WindowSelectorAttrs } from '@mindsmodern/grid-editor';
	import { blur } from 'svelte/transition';

	interface DocumentOption {
		id: string;
		title: string;
		slug?: string | null;
		tag?: string | null;
		width?: number | null;
	}

	interface Props {
		availableDocuments?: DocumentOption[];
	}

	let { availableDocuments = [] }: Props = $props();

	// State variables
	let current = $state<((value: WindowSelectorAttrs | null) => void) | null>(null);
	let title = $state('');
	let selectedDocument = $state<DocumentOption | null>(null);

	// Selection handler
	const selectDocument = (document: DocumentOption) => {
		selectedDocument = document;
		title = document.title || 'Document Content';
	};

	// Exported selector function
	export const selector: WindowSelector = () => {
		if (current !== null) {
			return Promise.reject({ cause: 'Another window selection is in process.' });
		}

		// Reset form
		title = '';
		selectedDocument = null;

		return new Promise((resolve, reject) => {
			current = (value) => {
				if (value === null) {
					reject({ cause: 'User cancelled window selection' });
				} else {
					resolve(value);
				}
				current = null;
			};
		});
	};

	const submit = () => {
		if (!selectedDocument) {
			alert('Please select a document');
			return;
		}

		const windowTitle = title || selectedDocument.title;

		current?.({
			url: selectedDocument.id, // Store document ID as URL
			title: windowTitle
		});
	};

	const cancel = () => {
		current?.(null);
	};
</script>

{#if current !== null}
	<div
		transition:blur={{ duration: 100 }}
		class="wrapper"
		role="dialog"
		tabindex="-1"
		onclick={(event) => {
			if (event.target === event.currentTarget) {
				cancel();
			}
		}}
		onkeydown={(event) => {
			if (event.key === 'Escape') {
				event.preventDefault();
				cancel();
			}
		}}
	>
		<div class="modal">
			<div class="header">
				<h2>Insert Window</h2>
				<p>Select a document from this domain to embed</p>
			</div>

			<div class="form">
				{#if availableDocuments.length > 0}
					<div class="form-group">
						<label for="document-select">Select Document:</label>
						<select id="document-select" bind:value={selectedDocument} class="document-select">
							<option value={null}>Choose document...</option>
							{#each availableDocuments as doc}
								<option value={doc}>{doc.title}{doc.tag ? ` (${doc.tag})` : ''}</option>
							{/each}
						</select>
					</div>

					{#if selectedDocument}
						<div class="document-preview">
							<h3>Selected Document</h3>
							<p><strong>Title:</strong> {selectedDocument.title}</p>
							{#if selectedDocument.tag}
								<p><strong>Tag:</strong> {selectedDocument.tag}</p>
							{/if}
							{#if selectedDocument.width}
								<p><strong>Width:</strong> {selectedDocument.width}px</p>
							{/if}
						</div>
					{/if}

					<div class="form-group">
						<label for="title">Window Title (optional):</label>
						<input
							id="title"
							type="text"
							bind:value={title}
							placeholder={selectedDocument ? selectedDocument.title : 'Window title'}
							class="text-input"
						/>
					</div>
				{:else}
					<div class="no-documents">
						<p>No other published documents found in this domain.</p>
						<p>Create and publish more documents to embed them as windows.</p>
					</div>
				{/if}
			</div>

			<div class="actions">
				<button onclick={cancel} class="cancel-btn">Cancel</button>
				<button onclick={submit} disabled={!selectedDocument} class="submit-btn">
					Insert Window
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

	.modal {
		background-color: theme.$palette-functional-background;
		border-radius: theme.$size-layout-gap-spacious;
		padding: theme.$size-layout-gap-spacious;
		box-sizing: border-box;
		width: clamp(20rem, 60%, 35rem);
		max-height: 80vh;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: theme.$size-layout-gap-normal;
	}

	.header {
		text-align: center;

		h2 {
			margin: 0 0 0.5rem 0;
			color: theme.$palette-functional-foreground;
			font-size: 1.2em;
		}

		p {
			margin: 0;
			color: color-mix(
				in hsl,
				theme.$palette-functional-foreground,
				theme.$palette-functional-background 40%
			);
			font-size: 0.9em;
		}
	}

	.form {
		display: flex;
		flex-direction: column;
		gap: theme.$size-layout-gap-normal;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;

		label {
			font-weight: 500;
			color: theme.$palette-functional-foreground;
			font-size: 0.9em;
		}
	}

	.document-select,
	.text-input {
		padding: 0.75rem;
		border: 1px solid color-mix(in hsl, theme.$palette-functional-foreground, transparent 70%);
		border-radius: 4px;
		background-color: theme.$palette-functional-background;
		color: theme.$palette-functional-foreground;
		font-size: 0.9em;

		&:focus {
			outline: 2px solid theme.$palette-functional-primary;
			outline-offset: -2px;
		}
	}

	.document-preview {
		padding: 1rem;
		background-color: color-mix(in hsl, theme.$palette-functional-foreground, transparent 95%);
		border-radius: 4px;
		border-left: 3px solid theme.$palette-functional-primary;

		h3 {
			margin: 0 0 0.5rem 0;
			color: theme.$palette-functional-foreground;
			font-size: 1em;
		}

		p {
			margin: 0.25rem 0;
			color: color-mix(in hsl, theme.$palette-functional-foreground, transparent 20%);
			font-size: 0.85em;
		}
	}

	.no-documents {
		text-align: center;
		padding: 2rem 1rem;
		color: color-mix(in hsl, theme.$palette-functional-foreground, transparent 40%);

		p {
			margin: 0.5rem 0;
			font-size: 0.9em;

			&:first-child {
				font-weight: 500;
			}
		}
	}

	.actions {
		display: flex;
		justify-content: flex-end;
		gap: theme.$size-layout-gap-condensed;
		margin-top: theme.$size-layout-gap-normal;
	}

	.cancel-btn,
	.submit-btn {
		padding: 0.6rem 1.2rem;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.9em;
		transition:
			background-color 0.2s,
			opacity 0.2s;

		&:focus {
			outline: 2px solid theme.$palette-functional-primary;
			outline-offset: 2px;
		}
	}

	.cancel-btn {
		background-color: transparent;
		color: theme.$palette-functional-foreground;
		border: 1px solid color-mix(in hsl, theme.$palette-functional-foreground, transparent 70%);

		&:hover {
			background-color: color-mix(in hsl, theme.$palette-functional-foreground, transparent 90%);
		}
	}

	.submit-btn {
		background-color: theme.$palette-functional-primary;
		color: theme.$palette-functional-background;

		&:hover:not(:disabled) {
			background-color: color-mix(in hsl, theme.$palette-functional-primary, black 10%);
		}

		&:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}
	}
</style>
