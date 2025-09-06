<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import type { Post } from '.';

	let {
		post = $bindable(),
		updatePost
	}: {
		post: Post;
		updatePost: (arg: { [key in keyof Partial<Post>]: unknown }) => void;
	} = $props();

	let slug = $state(post.slug);
	let slugIsValid = $derived(/^(\/[a-z0-9]+)+$/g.test(slug) || slug === '/');

	let title = $state(post.title);
	let titleIsValid = $derived(title.length > 0);
</script>

<div class="container">
	<span>Title</span>
	<div
		class="title"
		oninput={(value) => {
			title = value.currentTarget.innerText;
		}}
		contenteditable
	>
		{post.title}
	</div>
	<span>Path</span>
	<div
		class="slug"
		oninput={(value) => {
			slug = value.currentTarget.innerText;
		}}
		contenteditable
	>
		{post.slug}
	</div>
	<div>
		<Button
			fill={false}
			variant="secondary"
			disabled={!slugIsValid || !titleIsValid}
			onclick={() => updatePost({ slug, title })}>Save</Button
		>
		<Button fill={false} variant="secondary" onclick={() => updatePost({ slug: null })}
			>Unpublish</Button
		>
	</div>
</div>

<style lang="scss">
	@use '@mindsmodern/design-primitives/styles.scss' as *;
	.container {
		container-type: inline-size;
		display: flex;
	}

	.title {
		font-weight: $typography-weight-semibold;
		font-size: $typography-dimension-large-size;
		line-height: $typography-dimension-large-height;
	}

	.container {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
	}
</style>
