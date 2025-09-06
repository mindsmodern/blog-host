<script lang="ts">
	import { type Post, syncPosts, type SyncResult } from '$lib/manage';
	import PostManage from '$lib/manage/post-manage.svelte';
	import PostSelector, { idCheckPost } from '$lib/manage/post-selector.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let posts = $state(JSON.parse(JSON.stringify(data.posts)));
	let selectedValue = $state<string[]>([]);
	let expandedValue = $state<string[]>([]);
	let post = $derived.by(() => {
		if (selectedValue.length === 0) {
			return null;
		}
		const res = posts.filter((value: any) => idCheckPost(value, selectedValue[0]));
		console.log(res);

		if (res.length) {
			return res[0];
		} else {
			return null;
		}
	});

	let syncStatus = $state<'idle' | 'syncing' | 'success' | 'error'>('idle');
	let syncResult = $state<SyncResult | null>(null);

	const updatePost = async (updates: { [key in keyof Partial<Post>]: unknown }) => {
		if (post === null) {
			return;
		}
		
		// Update local state
		const updatedPost = { ...post, ...updates };
		posts = [
			...posts.filter((value: any) => value.id !== post.id),
			updatedPost
		];
		
		// Update selection/expansion state for slug changes
		if ('slug' in updates) {
			const newSlug = updates.slug;
			if (newSlug === null) {
				selectedValue = ['unpub:' + post.id];
			} else {
				selectedValue = ['pub:' + newSlug];
				expandedValue = ['pub:/'];
				let fragment = 'pub:';
				// TODO: check for the edge case where slug = '/'
				for (const chunk of (newSlug as string)
					.replace('pub:', '')
					.split('/')
					.filter((c) => c.length > 0)) {
					fragment += '/';
					fragment += chunk;
					expandedValue.push(fragment);
				}
				expandedValue.pop();
			}
		}

		// Auto-sync changes to database
		try {
			syncStatus = 'syncing';
			const result = await syncPosts(
				data.supabase,
				data.domain,
				posts,
				data.posts
			);
			
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

	$inspect(selectedValue);
</script>

<div class="d1">
	<div class="d2">
		<PostSelector
			bind:selectedValue
			bind:expandedValue
			domain={data.domain}
			createPost={(slug) => alert(slug)}
			data={posts}
		></PostSelector>
	</div>
	<div class="d3">
		{#if post}
			<div class="post-header">
				<div class="sync-status">
					{#if syncStatus === 'syncing'}
						<span class="status syncing">Saving...</span>
					{:else if syncStatus === 'success'}
						<span class="status success">Saved ✓</span>
					{:else if syncStatus === 'error'}
						<span class="status error">Error!</span>
						{#if syncResult?.conflicts.length}
							<div class="conflicts">
								Slug conflicts: {syncResult.conflicts.join(', ')}
							</div>
						{/if}
						{#if syncResult?.errors.length}
							<div class="errors">
								{syncResult.errors.join(', ')}
							</div>
						{/if}
					{/if}
				</div>
			</div>
			<PostManage {post} {updatePost} />
		{/if}
	</div>
</div>

<style lang="scss">
	.d2 {
		background-color: #f7f7f7;
		width: 20rem;
		height: 20rem;
	}
	.d3 {
		background-color: #f7f7f7;
		width: 20rem;
		height: 20rem;
	}

	.d1 {
		width: 100dvw;
		height: 100dvh;
	}

	:global(html, body) {
		margin: 0;
	}

	.post-header {
		padding: 1rem;
		border-bottom: 1px solid #ddd;
	}

	.sync-status {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.status {
		font-weight: 500;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-size: 0.875rem;
	}

	.status.syncing {
		background: #fff3cd;
		color: #856404;
	}

	.status.success {
		background: #d1edff;
		color: #0f5132;
	}

	.status.error {
		background: #f8d7da;
		color: #721c24;
	}

	.conflicts, .errors {
		font-size: 0.75rem;
		margin-top: 0.25rem;
		opacity: 0.8;
	}
</style>
