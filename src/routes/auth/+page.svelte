<script>
	import Button from '$lib/components/Button.svelte';
</script>

<h2>White Chamber</h2>
<form method="POST" action="?/login">
	<main>
		<div class="inputs">
			<label class="email" for="email">Email</label>
			<input name="email" id="email" type="email" />
			<label class="password" for="password">Password</label>
			<input id="password" name="password" type="password" />
		</div>
		<div class="actions">
			<Button type="submit">Login</Button>
			<Button type="submit" variant="tertiary" disabled formaction="?/signup">Sign up</Button>
		</div>
	</main>
</form>

<style lang="scss">
	@use '$lib/components/grid-helper.scss' as *;
	@use '$lib/components/theme-variables.scss' as *;

	h2 {
		font-weight: $typography-weight-semibold;
		font-size: $typography-dimension-large-size;
		line-height: $typography-dimension-large-height;
		margin: 0;
		letter-spacing: -0.03em;
	}

	$main-col: (
		default: (
			1fr
		)
	);
	$main-row: (
		default: (
			auto 1fr
		)
	);
	$actions-col: (
		default: (
			1fr 1fr
		)
	);
	$actions-row: (
		default: (
			1fr
		)
	);
	$inputs-col: (
		default: (
			auto 1fr
		)
	);
	$inputs-row: (
		default: (
			1fr 1fr
		)
	);

	form {
		display: contents;
	}

	main {
		@include grid-container($main-col, $main-row);
		border: $size-layout-thickness-thick solid $palette-functional-border;
		border-left: none;
		border-right: none;
		width: 100%;
	}

	.inputs {
		@include grid-cell(
			(
				default: 1 1
			),
			$main-col,
			$main-row
		);

		@include grid-container($inputs-col, $inputs-row);
	}

	.email {
		@include grid-cell(
			(
				default: 1 1
			),
			$inputs-col,
			$inputs-row
		);
	}

	.password {
		@include grid-cell(
			(
				default: 1 2
			),
			$inputs-col,
			$inputs-row
		);
	}

	label,
	h2,
	input {
		padding: $size-layout-padding-condensed;

		@include respond-to(sm) {
			padding: $size-layout-padding-normal;
		}
	}

	#email {
		@include grid-cell(
			(
				default: 2 1
			),
			$inputs-col,
			$inputs-row
		);
	}

	input {
		border-left: none;
		border-top: none;
		background-color: inherit;
		transition: all 0.15s ease-in-out;
	}

	input:focus-visible {
		outline: $size-layout-thickness-thicker solid $palette-functional-primary;
		outline-offset: $size-layout-thickness-thicker;
		border-radius: $size-control-radius-small;
	}

	#password {
		@include grid-cell(
			(
				default: 2 2
			),
			$inputs-col,
			$inputs-row
		);
	}

	.actions {
		@include grid-cell(
			(
				default: 1 2
			),
			$main-col,
			$main-row
		);
		height: 3em;

		@include grid-container($actions-col, $actions-row);
	}
</style>
