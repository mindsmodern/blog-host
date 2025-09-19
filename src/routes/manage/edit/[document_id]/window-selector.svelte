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
	let contentType = $state<'document' | 'book'>('document');
	let bookQuery = $state('');
	let searchResults = $state<any[]>([]);
	let selectedBook = $state<any>(null);
	let isSearching = $state(false);

	// Selection handlers
	const selectDocument = (document: DocumentOption) => {
		selectedDocument = document;
		title = document.title || 'Document Content';
	};

	const selectBook = (book: any) => {
		selectedBook = book;
		// Extract ISBN from the isbn field (usually contains multiple ISBNs)
		const isbn = book.isbn?.split(' ')[1] || book.isbn?.split(' ')[0] || '';
		title = book.title?.replace(/<[^>]*>/g, '') || 'Book Details';
	};

	// Book search function using existing Naver API
	const searchBooks = async () => {
		if (!bookQuery.trim()) return;

		isSearching = true;
		try {
			const response = await fetch(`/api/book-search?query=${encodeURIComponent(bookQuery)}`);
			if (!response.ok) {
				throw new Error('Search failed');
			}
			const data = await response.json();
			searchResults = data.items || [];
		} catch (error) {
			console.error('Book search failed:', error);
			searchResults = [];
		} finally {
			isSearching = false;
		}
	};

	// Exported selector function
	export const selector: WindowSelector = () => {
		if (current !== null) {
			return Promise.reject({ cause: 'Another window selection is in process.' });
		}

		// Reset form
		title = '';
		selectedDocument = null;
		contentType = 'document';
		bookQuery = '';
		searchResults = [];
		selectedBook = null;
		isSearching = false;

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
		let url = '';
		let windowTitle = '';

		if (contentType === 'book') {
			if (!selectedBook) {
				alert('Please select a book');
				return;
			}
			const isbn = selectedBook.isbn?.split(' ')[1] || selectedBook.isbn?.split(' ')[0] || '';
			url = `book:${isbn}`;
			windowTitle = title || selectedBook.title?.replace(/<[^>]*>/g, '') || 'Book Details';
		} else {
			if (!selectedDocument) {
				alert('Please select a document');
				return;
			}
			url = `content:${selectedDocument.id}`;
			windowTitle = title || selectedDocument.title;
		}

		current?.({
			url,
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
				<p>Select content to embed as a window</p>
			</div>

			<div class="form">
				<!-- Content type selection -->
				<div class="form-group">
					<label>Content Type:</label>
					<div class="radio-group">
						<label class="radio-label">
							<input type="radio" bind:group={contentType} value="document" />
							Document from this domain
						</label>
						<label class="radio-label">
							<input type="radio" bind:group={contentType} value="book" />
							Book search
						</label>
					</div>
				</div>
				<!-- Document selection -->
				{#if contentType === 'document'}
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
					{:else}
						<div class="no-documents">
							<p>No other published documents found in this domain.</p>
							<p>Create and publish more documents to embed them as windows.</p>
						</div>
					{/if}
				{/if}

				<!-- Book search -->
				{#if contentType === 'book'}
					<div class="form-group">
						<label for="book-search">Search Books:</label>
						<div class="search-input-group">
							<input
								id="book-search"
								type="text"
								bind:value={bookQuery}
								placeholder="책 제목을 입력하세요..."
								class="text-input"
								onkeydown={(e) => e.key === 'Enter' && searchBooks()}
							/>
							<button type="button" onclick={searchBooks} disabled={isSearching} class="search-btn">
								{isSearching ? '검색 중...' : '검색'}
							</button>
						</div>
					</div>

					{#if searchResults.length > 0}
						<div class="search-results">
							{#each searchResults as book}
								<div
									class="book-result {selectedBook === book ? 'selected' : ''}"
									onclick={() => selectBook(book)}
								>
									<div class="book-info">
										<div class="book-title">{@html book.title}</div>
										<div class="book-author">{book.author}</div>
										<div class="book-publisher">{book.publisher} · {book.pubdate}</div>
									</div>
									{#if book.image}
										<img src={book.image} alt="Book cover" class="book-cover" />
									{/if}
								</div>
							{/each}
						</div>
					{/if}
				{/if}

				<!-- Title input -->
				<div class="form-group">
					<label for="title">Window Title (optional):</label>
					<input
						id="title"
						type="text"
						bind:value={title}
						placeholder={contentType === 'book' && selectedBook ? selectedBook.title?.replace(/<[^>]*>/g, '') : contentType === 'document' && selectedDocument ? selectedDocument.title : 'Window title'}
						class="text-input"
					/>
				</div>
			</div>

			<div class="actions">
				<button onclick={cancel} class="cancel-btn">Cancel</button>
				<button
					onclick={submit}
					disabled={contentType === 'document' ? !selectedDocument : !selectedBook}
					class="submit-btn"
				>
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

	.radio-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.radio-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-weight: normal;
		cursor: pointer;
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

	.search-input-group {
		display: flex;
		gap: 0.5rem;
		align-items: stretch;
	}

	.search-btn {
		padding: 0.75rem 1rem;
		border: 1px solid theme.$palette-functional-primary;
		border-radius: 4px;
		background-color: theme.$palette-functional-primary;
		color: theme.$palette-functional-background;
		cursor: pointer;
		font-size: 0.9em;
		white-space: nowrap;

		&:hover:not(:disabled) {
			background-color: color-mix(in hsl, theme.$palette-functional-primary, black 10%);
		}

		&:disabled {
			opacity: 0.6;
			cursor: not-allowed;
		}
	}

	.search-results {
		max-height: 300px;
		overflow-y: auto;
		border: 1px solid color-mix(in hsl, theme.$palette-functional-foreground, transparent 80%);
		border-radius: 4px;
		background-color: theme.$palette-functional-background;
	}

	.book-result {
		display: flex;
		align-items: flex-start;
		gap: 1rem;
		padding: 1rem;
		cursor: pointer;
		border-bottom: 1px solid color-mix(in hsl, theme.$palette-functional-foreground, transparent 90%);
		transition: background-color 0.2s;

		&:hover {
			background-color: color-mix(in hsl, theme.$palette-functional-foreground, transparent 95%);
		}

		&.selected {
			background-color: color-mix(in hsl, theme.$palette-functional-primary, transparent 90%);
			border-color: theme.$palette-functional-primary;
		}

		&:last-child {
			border-bottom: none;
		}
	}

	.book-info {
		flex: 1;
		min-width: 0;
	}

	.book-title {
		font-weight: 600;
		color: theme.$palette-functional-foreground;
		margin-bottom: 0.25rem;
		line-height: 1.3;
	}

	.book-author {
		color: color-mix(in hsl, theme.$palette-functional-foreground, transparent 30%);
		font-size: 0.9em;
		margin-bottom: 0.25rem;
	}

	.book-publisher {
		color: color-mix(in hsl, theme.$palette-functional-foreground, transparent 50%);
		font-size: 0.8em;
	}

	.book-cover {
		width: 60px;
		height: auto;
		border-radius: 4px;
		flex-shrink: 0;
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
