<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import type { Post, Document } from '.';
	import { fetchPostDocuments, createDocument } from '.';
	import type { SupabaseClient } from '@supabase/supabase-js';
	import type { Database } from '$lib/util';

	let {
		post = $bindable(),
		updatePost,
		supabase,
		canSave = true,
		isUnpublished = false,
		slug = $bindable(post.slug),
		title = $bindable(post.title),
		createChildPost,
		removePost,
		duplicatePost
	}: {
		post: Post;
		updatePost: (arg: { [key in keyof Partial<Post>]: unknown }) => void;
		supabase: SupabaseClient<Database>;
		canSave?: boolean;
		isUnpublished?: boolean;
		slug?: string | null;
		title?: string;
		createChildPost?: () => void;
		removePost?: () => void;
		duplicatePost?: () => void;
	} = $props();

	let loading = $state(false);
	let documents = $derived.by(() => {
		const obj: { [key: string]: string } = {};
		for (const { id, tag } of post.documents) {
			obj[tag!] = id;
		}
		return obj;
	});

	const tags = ['default', 'mobile'] as const;

	async function handleDocumentAction(tag: string | null) {
		if (documents[tag!]) {
			// Navigate to existing document
			goto(`/manage/edit/${documents[tag!]}`);
		} else {
			// Navigate to create new document
			const tagParam = tag ? `&tag=${encodeURIComponent(tag)}` : '';
			goto(`/manage/new?post=${encodeURIComponent(post.id)}${tagParam}`);
		}
	}
</script>

<div class="container">
	<span>Title</span>
	<input class="title" bind:value={title} />
	<span>Path</span>
	<input class="slug" bind:value={slug} />
	<div class="button-group">
		{#if isUnpublished}
			<Button
				fill={false}
				variant="primary"
				disabled={!canSave || !slug || slug === ''}
				onclick={() => updatePost({ slug, title })}
			>
				Publish
			</Button>
		{:else}
			<Button
				fill={false}
				variant="secondary"
				disabled={!canSave}
				onclick={() => updatePost({ slug, title })}
			>
				Save
			</Button>
			<Button fill={false} variant="secondary" onclick={() => updatePost({ slug: null })}>
				Unpublish
			</Button>
		{/if}
		{#if createChildPost && !isUnpublished}
			<Button fill={false} variant="secondary" onclick={createChildPost}>Create child post</Button>
		{/if}
		{#if duplicatePost}
			<Button fill={false} variant="tertiary" onclick={duplicatePost}>Duplicate</Button>
		{/if}
		{#if removePost}
			<Button fill={false} variant="tertiary" onclick={removePost}>Remove</Button>
		{/if}
	</div>

	<div class="documents-section">
		<span>Documents</span>
		{#if loading}
			<span class="loading">Loading documents...</span>
		{:else}
			<div class="document-buttons">
				{#each tags as tag}
					<Button
						fill={false}
						variant={documents[tag!] ? 'secondary' : 'tertiary'}
						onclick={() => handleDocumentAction(tag)}
					>
						{{ default: 'Desktop', mobile: 'Mobile' }[tag]}
						{documents[tag!] ? '| Edit' : '| Create'}
					</Button>
				{/each}
			</div>
		{/if}
	</div>
</div>

<style lang="scss">
	@use '@mindsmodern/design-primitives/styles.scss' as *;
	.container {
		container-type: inline-size;
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1rem;
		box-sizing: border-box;
		min-height: 0; // Allow shrinking in flex parent
	}

	.title {
		font-weight: $typography-weight-semibold;
		font-size: $typography-dimension-large-size;
		line-height: $typography-dimension-large-height;
		background: transparent;
		width: 100%;
		padding: 0;
	}

	.slug {
		background: transparent;
		width: 100%;
		padding: 0;
		font-size: $typography-dimension-medium-size;
		line-height: $typography-dimension-medium-height;
	}

	.button-group {
		display: flex;
		flex-wrap: wrap;
		gap: $size-layout-gap-condensed;
	}

	.documents-section {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.document-buttons {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.loading {
		color: $palette-functional-foreground;
		opacity: 0.7;
		font-size: 0.875rem;
	}

	input.title,
	input.slug {
		outline: none;
		border: none;
		border-bottom: $size-layout-thickness-thick solid $palette-functional-border;
		&:focus {
			border-bottom: $size-layout-thickness-thick solid $palette-functional-primary;
		}
	}
</style>
