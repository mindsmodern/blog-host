<script module lang="ts">
	export type ListElem = {
		slug: string | null;
	};

	export type TreeNode<L extends ListElem> = {
		id: string;
		name: string;
		elem?: L;
		children: TreeNode<L>[];
	};

	function findName<L extends ListElem>(children: TreeNode<L>[], name: string): TreeNode<L> | null {
		const res = children.filter((child) => child.name === name);
		if (res.length) {
			return res[0];
		} else {
			return null;
		}
	}

	function listToTree<L extends ListElem>(list: L[], domain: string): TreeNode<L> {
		list = list
			.filter((value) => value.slug !== null)
			.sort((a, b) => a.slug!.localeCompare(b.slug!));

		let rootChildren: TreeNode<L>[] = [];

		let root: TreeNode<L> = { name: domain, children: rootChildren, id: 'domain' };

		for (const elem of list) {
			const chunks = (domain + elem.slug!).split('/').filter((value) => value.length);
			let ptr = root;
			let slug = '';
			for (const chunk of chunks) {
				slug += '/' + chunk;
				let child = findName(ptr.children, chunk);
				if (child === null) {
					child = {
						name: chunk,
						children: [],
						id: slug
					};
					ptr.children.push(child);
				}
				ptr = child;
			}
			ptr.elem = elem;
		}
		const addNew = (node: TreeNode<L>) => {
			node.children.push({ name: 'New Post', children: [], id: 'new:' + node.id });
			for (const child of node.children) {
				if (child.id.startsWith('new:')) {
					continue;
				}
				addNew(child);
			}
		};
		for (const child of root.children) {
			addNew(child);
		}

		return root;
	}

	interface PostSelectorProps<L extends ListElem> {
		data: L[];
		slug?: string;
		label?: string;
		newPost: (slug: string) => void;
		domain: string;
	}
</script>

<script lang="ts" generics="L extends ListElem">
	import { normalizeProps, useMachine } from '@zag-js/svelte';
	import * as tree from '@zag-js/tree-view';

	let {
		data,
		slug = $bindable(undefined),
		label,
		newPost,
		domain
	}: PostSelectorProps<L> = $props();
	const initialSlug = slug?.toString();

	const rootNode = $derived(listToTree(data, domain));

	const collection = $derived(
		tree.collection<TreeNode<L>>({
			nodeToValue: (node) => node.id.toString(),
			nodeToString: (node) => node.name,
			rootNode
		})
	);

	const id = $props.id();
	let service = $derived.by(() => {
		let defaultSelectedValue: string[] | undefined = undefined;
		let defaultExpandedValue: string[] | undefined = undefined;
		if (initialSlug) {
			defaultSelectedValue = [initialSlug];
			defaultExpandedValue = [];
			let fragment = '';
			for (const chunk of initialSlug.split('/')) {
				if (chunk === '') {
					continue;
				}
				fragment += '/';
				fragment += chunk;
				defaultExpandedValue.push(fragment);
			}
		}

		return useMachine(tree.machine, {
			id,
			collection,
			onSelectionChange: (details) => {
				slug = details.selectedNodes[0].id;
			},
			defaultSelectedValue,
			defaultExpandedValue
		});
	});

	interface TreeNodeProps {
		node: TreeNode<L>;
		indexPath: number[];
		api: tree.Api;
	}

	const api = $derived(tree.connect(service, normalizeProps));

	$effect(() => {
		if (slug?.startsWith('new:')) {
			const currentSlug = slug.replace('new:', '');
			newPost(currentSlug);
			api.setSelectedValue([currentSlug]);
		}
	});

	import { ChevronDown, ChevronRight, Plus } from '@lucide/svelte';
</script>

{#snippet treeNode(nodeProps: TreeNodeProps)}
	{@const { node, indexPath, api } = nodeProps}
	{@const nodeState = api.getNodeState({ indexPath, node })}

	{#if nodeState.isBranch}
		<div {...api.getBranchProps({ indexPath, node })}>
			<div {...api.getBranchControlProps({ indexPath, node })}>
				<span {...api.getBranchIndicatorProps({ indexPath, node })}>
					{#if nodeState.expanded}
						<ChevronDown strokeWidth={1.5} />
					{:else}
						<ChevronRight strokeWidth={1.5} />
					{/if}
				</span><span {...api.getBranchTextProps({ indexPath, node })}>{node.name}</span>
			</div>
			<div {...api.getBranchContentProps({ indexPath, node })}>
				<div {...api.getBranchIndentGuideProps({ indexPath, node })}></div>
				{#each node.children || [] as childNode, index}
					{@render treeNode({
						node: childNode,
						indexPath: [...indexPath, index],
						api
					})}
				{/each}
			</div>
		</div>
	{:else}
		<div {...api.getItemProps({ indexPath, node })}>
			<span class="indicator"><Plus strokeWidth={1.5} /></span>
			<div class="name">{node.name}</div>
		</div>
	{/if}
{/snippet}

<!-- 3. Create the tree view -->

<div {...api.getRootProps()}>
	{#if label}<h3 {...api.getLabelProps()}>{label}</h3>{/if}
	<div class="container">
		<div {...api.getTreeProps()}>
			{#each collection.rootNode.children || [] as node, index}
				{@render treeNode({ node, indexPath: [index], api })}
			{/each}
		</div>
	</div>
</div>

<style lang="scss">
	@use '@mindsmodern/design-primitives/styles.scss' as *;

	[data-part='root'] {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		user-select: none;
	}

	[data-part='label'] {
		flex: 0 0 fit-content;
		overflow: clip;
	}

	.container {
		flex: 1;
		overflow: auto;
		border-top: $size-layout-thickness-thin solid $palette-functional-border;
	}

	[data-part='tree'] {
		min-width: 100%;
		min-height: 100%;
		width: fit-content;
		height: fit-content;
	}

	[data-part='branch-control'] {
		height: 2rem;
		align-items: center;
		display: flex;
	}

	[data-part='item'],
	[data-part='branch-control'] {
		padding-left: calc(2rem * (var(--depth) - 1));
		border-bottom: $size-layout-thickness-thin solid $palette-functional-border;
		transition: background-color 0.15s ease-in-out;
		&[data-selected] {
			color: $palette-functional-primary;
		}
		&:hover {
			background-color: color-mix(in oklab, $palette-functional-foreground, transparent 95%);
		}
	}

	[data-part='branch-indicator'],
	[data-part='item'] > .indicator {
		border-left: $size-layout-thickness-thin solid $palette-functional-border;
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		flex: 0 0 2rem;
		user-select: none;
		box-sizing: border-box;
	}

	[data-part='branch-text'],
	[data-part='item'] > .name {
		display: flex;
		align-items: center;
		padding-left: 0.5rem;
		padding-right: 0.5rem;
		height: 100%;
		flex: 1 0 fit-content;
		border-left: $size-layout-thickness-thin solid $palette-functional-border;
		box-sizing: border-box;
	}

	[data-focus]:focus-visible {
		outline: $size-layout-thickness-thicker solid $palette-functional-primary;
		outline-offset: -$size-layout-thickness-thicker;
		border: none;
		border-radius: $size-control-radius-medium;
	}

	[data-part='item'] {
		height: 2rem;
		display: flex;
		align-items: center;
	}

	[data-part='branch-indent-guide'] {
		left: calc(2rem * var(--depth) - 1rem);
		height: 100%;
		width: $size-layout-thickness-thick;
		background-color: $palette-functional-border;
		transform: translateX(-50%);
	}
</style>
