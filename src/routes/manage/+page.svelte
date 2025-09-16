<script lang="ts">
	import { type Post, syncPosts, type SyncResult } from '$lib/manage';
	import PostManage from '$lib/manage/post-manage.svelte';
	import PostSelector, { idCheckPost, idGetType } from '$lib/manage/post-selector.svelte';
	import Button from '$lib/components/Button.svelte';
	import type { PageProps } from './$types';
	import StatusBar from '$lib/layout/status-bar.svelte';

	let { data }: PageProps = $props();
	let posts = $state<typeof data.posts>(JSON.parse(JSON.stringify(data.posts)));
	let path = $state<string>('pub:/');
	let post = $derived.by(() => {
		if (!path) {
			return null;
		}
		const res = posts.filter((value: any) => idCheckPost(value, path));
		console.log(res);

		if (res.length) {
			return res[0];
		} else {
			return null;
		}
	});

	// Editing states for the current post
	let editingTitle = $state('');
	let editingSlug = $state<string | null>('');

	// Update editing states when post changes
	$effect(() => {
		if (post) {
			editingTitle = post.title;
			editingSlug = post.slug;
		}
	});

	// Validation logic
	let titleIsValid = $derived(editingTitle.length > 0);
	let slugIsValid = $derived(
		editingSlug === null ||
			editingSlug === undefined ||
			editingSlug === '/' ||
			/^\/?[A-Za-z0-9-]+(?:\/[A-Za-z0-9-]+)*$/.test(editingSlug)
	);
	let slugHasConflict = $derived(
		!!editingSlug && posts.some((p) => post && p.id !== post.id && p.slug === editingSlug)
	);

	let canSave = $derived(titleIsValid && slugIsValid && !slugHasConflict);

	// Check if current post is unpublished
	let isUnpublished = $derived(!!(post && post.slug === null));

	// Get validation message for header
	let validationMessage = $derived(() => {
		if (post && !canSave) {
			if (!titleIsValid) return 'Title cannot be empty';
			if (isUnpublished && (!editingSlug || editingSlug === ''))
				return 'Path cannot be empty to publish';
			if (!slugIsValid) return 'The path is invalid';
			if (slugHasConflict) return 'The path is already taken';
		}
		return null;
	});

	let syncStatus = $state<'idle' | 'syncing' | 'success' | 'error'>('idle');
	let syncResult = $state<SyncResult | null>(null);

	const updatePost = async (updates: { [key in keyof Partial<Post>]: unknown }) => {
		if (post === null) {
			return;
		}

		// Update local state
		const updatedPost = { ...post, ...updates };
		posts = [...posts.filter((value: any) => value.id !== post.id), updatedPost];

		// Update selection/expansion state for slug changes
		if ('slug' in updates) {
			const newSlug = updates.slug;
			if (newSlug === null) {
				path = 'unpub:' + updatedPost.id;
			} else {
				path = 'pub:' + newSlug;
				console.log(newSlug);
			}
		}

		// Auto-sync changes to database
		try {
			syncStatus = 'syncing';
			const result = await syncPosts(data.supabase, data.domain, posts, data.posts);

			syncResult = result;

			if (result.success && result.conflicts.length === 0) {
				syncStatus = 'success';
				// Update original data to match current state
				data.posts = JSON.parse(JSON.stringify(posts));

				// Reset status after 2 seconds
				setTimeout(() => {
					syncStatus = 'idle';
					syncResult = null;
				}, 2000);
			} else {
				syncStatus = 'error';
			}
		} catch (error) {
			console.error('Sync failed:', error);
			syncStatus = 'error';
			syncResult = {
				success: false,
				conflicts: [],
				errors: [error instanceof Error ? error.message : 'Unknown error']
			};
		}
	};

	const createNewPost = async (slug: string) => {
		// Create a new post with the specified slug
		const newPost: Omit<Post, 'id'> & { id?: string } = {
			title: 'New Post',
			slug: slug,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
			meta_description: null,
			theme_id: null,
			domain_id: data.domain.id,
			documents: []
		};

		// Add to local posts array (will get proper ID from sync)
		const tempId = `temp-${Date.now()}`;
		posts = [...posts, { ...newPost, id: tempId }];

		// Set path to select the new post
		path = `pub:${slug}`;

		// Sync to database
		try {
			syncStatus = 'syncing';
			const result = await syncPosts(data.supabase, data.domain, posts, data.posts);

			if (result.success && result.conflicts.length === 0) {
				syncStatus = 'success';
				data.posts = JSON.parse(JSON.stringify(posts));
				setTimeout(() => {
					syncStatus = 'idle';
					syncResult = null;
				}, 2000);
			} else {
				syncStatus = 'error';
				syncResult = result;
			}
		} catch (error) {
			console.error('Create post failed:', error);
			syncStatus = 'error';
			syncResult = {
				success: false,
				conflicts: [],
				errors: [error instanceof Error ? error.message : 'Unknown error']
			};
		}
	};

	$inspect(path);
</script>

<StatusBar {data}>
	<div class="manage-container">
		<div class="selector-panel">
			<PostSelector
				bind:path
				domain={data.domain}
				createPost={(slug) => alert(slug)}
				data={posts}
			/>
		</div>
		<div class="content-panel">
			{#if post}
				<div class="post-header">
					<div class="sync-status">
						{#if validationMessage()}
							<span class="status validation">{validationMessage()}</span>
						{:else if syncStatus === 'syncing'}
							<span class="status syncing">Saving...</span>
						{:else if syncStatus === 'success'}
							<span class="status success">Saved ✓</span>
						{:else if syncStatus === 'error'}
							<span class="status error">
								{#if syncResult?.conflicts.length}
									Slug conflicts: {syncResult.conflicts.join(', ')}
								{:else if syncResult?.errors.length}
									{syncResult.errors.join(', ')}
								{:else}
									Error!
								{/if}
							</span>
						{/if}
					</div>
				</div>
				<div class="post-manage-wrapper">
					<PostManage
						{post}
						{updatePost}
						supabase={data.supabase}
						{canSave}
						{isUnpublished}
						bind:title={editingTitle}
						bind:slug={editingSlug}
					/>
				</div>
			{:else if path && idGetType(path) === 'pub'}
				<!-- Empty state for selected path without post -->
				<div class="empty-state">
					<div class="empty-content">
						<h2>No post at <code>{path.replace('pub:', '')}</code></h2>
						<Button
							fill={false}
							variant="primary"
							onclick={() => createNewPost(path.replace('pub:', ''))}
						>
							Create post here
						</Button>
					</div>
				</div>
			{:else}
				<!-- Default empty state -->
				<div class="empty-state">
					<div class="empty-content">
						<h2>Select a post</h2>
						<p>Choose a post from the sidebar to start editing</p>
					</div>
				</div>
			{/if}
		</div>
	</div>
</StatusBar>

<style lang="scss">
	@use '$lib/components/grid-helper.scss' as grid;
	@use '@mindsmodern/design-primitives/styles.scss' as *;

	.manage-container {
		display: grid;
		grid-template-columns: 1fr;
		grid-template-rows: auto 1fr;
		width: 100%;
		height: 100%;

		@include grid.respond-to(sm) {
			grid-template-columns: 20rem 1fr;
			grid-template-rows: 1fr;
		}

		border-left: $size-layout-thickness-thick solid $palette-functional-border;
		border-right: $size-layout-thickness-thick solid $palette-functional-border;
		box-sizing: border-box;
	}

	.selector-panel {
		grid-column: 1 / 2;
		grid-row: 1 / 2;
		background-color: $palette-functional-background;
		overflow: auto;
		display: flex;
		flex-direction: column;
		min-height: 0;
		border-bottom: $size-layout-thickness-thick solid $palette-functional-border;

		@include grid.respond-to(sm) {
			grid-column: 1 / 2;
			grid-row: 1 / 2;
			border-bottom: none;
			border-right: $size-layout-thickness-thick solid $palette-functional-border;
		}
	}

	.content-panel {
		grid-column: 1 / 2;
		grid-row: 2 / 3;
		background-color: $palette-functional-background;
		overflow: auto;
		display: flex;
		flex-direction: column;
		min-height: 0;

		@include grid.respond-to(sm) {
			grid-column: 2 / 3;
			grid-row: 1 / 2;
		}
	}

	.post-manage-wrapper {
		flex: 1;
		display: flex;
		flex-direction: column;
		min-height: 0;
		overflow: auto;
	}

	.post-header {
		height: 3rem;
		border-bottom: $size-layout-thickness-thin solid $palette-functional-border;
		flex-shrink: 0;
		display: flex;
		align-items: center;
		box-sizing: border-box;
	}

	.sync-status {
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

	.status.validation {
		background: $palette-functional-border;
	}

	.empty-state {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem;
	}

	.empty-content {
		text-align: center;
		max-width: 400px;

		h2 {
			margin: 0 0 0.5rem 0;
			font-weight: $typography-weight-semibold;
			color: $palette-functional-foreground;
		}

		code {
			background: $palette-functional-border;
			padding: 0.125rem 0.25rem;
			font-weight: $typography-weight-normal;
			border-radius: $size-control-radius-small;
			font-family: monospace;
		}
	}
</style>
