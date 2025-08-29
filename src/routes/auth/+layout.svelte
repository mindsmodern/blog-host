<script>
	let { children } = $props();
</script>

<div>{@render children()}</div>

<style lang="scss">
	@use '$lib/components/grid-helper.scss' as *;
	@use '$lib/components/theme-variables.scss' as *;

	div {
		padding: 0;
		height: 100%;
		border: $size-layout-thickness-thick solid $palette-functional-border;
		border-top: none;
		border-bottom: none;

		@include respond-to(sm) {
			margin: 0 $size-layout-padding-spacious3;
		}

		@include respond-to(md) {
			margin: 0 20%;
		}
	}
</style>
