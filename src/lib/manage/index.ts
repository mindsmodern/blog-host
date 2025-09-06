import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '$lib/util';

export interface Post {
	id: string;
	title: string;
	slug: string | null;
	created_at: string;
	updated_at: string;
	meta_description: string | null;
	theme_id: string | null;
	domain_id: string;
}

export async function fetchUserPosts(supabase: SupabaseClient<Database>): Promise<Post[]> {
	const {
		data: { user }
	} = await supabase.auth.getUser();

	if (!user) {
		throw new Error('User not authenticated');
	}

	const { data, error } = await supabase
		.from('posts')
		.select(
			`
			id,
			title,
			slug,
			created_at,
			updated_at,
			meta_description,
			theme_id,
			domain_id,
			domains!inner(owner_id)
		`
		)
		.eq('domains.owner_id', user.id)
		.order('created_at', { ascending: false });

	if (error) {
		throw error;
	}

	return data || [];
}

export async function fetchDomainPosts(
	supabase: SupabaseClient<Database>,
	domainName: string
): Promise<Post[]> {
	const { data, error } = await supabase
		.from('posts')
		.select(
			`
			id,
			title,
			slug,
			created_at,
			updated_at,
			meta_description,
			theme_id,
			domain_id,
			domains!inner(domain_name)
		`
		)
		.eq('domains.domain_name', domainName)
		.order('created_at', { ascending: false });

	if (error) {
		throw error;
	}

	return data || [];
}

export type ListElem = {
	id: string;
	title: string;
	slug: string | null;
};

export type TreeNode<L extends ListElem> = {
	id: string;
	name: string;
	elem?: L;
	children: TreeNode<L>[];
};

export function findName<L extends ListElem>(
	children: TreeNode<L>[],
	name: string
): TreeNode<L> | null {
	const res = children.filter((child) => child.name === name);
	if (res.length) {
		return res[0];
	} else {
		return null;
	}
}

// Post synchronization types and functions
export interface PostUpdate {
	id: string;
	title?: string;
	slug?: string | null;
	meta_description?: string | null;
	theme_id?: string | null;
}

export interface PostCreate {
	title: string;
	slug?: string | null;
	meta_description?: string | null;
	theme_id?: string | null;
}

export interface PostDifferences {
	updates: PostUpdate[];
	creates: PostCreate[];
	deletes: string[];
}

export interface SyncResult {
	success: boolean;
	conflicts: string[];
	errors: string[];
}

function hasPostChanged(original: Post, current: Post): boolean {
	return (
		original.title !== current.title ||
		original.slug !== current.slug ||
		original.meta_description !== current.meta_description ||
		original.theme_id !== current.theme_id
	);
}

function getPostChanges(original: Post, current: Post): Partial<Post> {
	const changes: Partial<Post> = {};
	
	if (original.title !== current.title) changes.title = current.title;
	if (original.slug !== current.slug) changes.slug = current.slug;
	if (original.meta_description !== current.meta_description) changes.meta_description = current.meta_description;
	if (original.theme_id !== current.theme_id) changes.theme_id = current.theme_id;
	
	return changes;
}

export function findPostDifferences(localPosts: Post[], originalPosts: Post[]): PostDifferences {
	const updates: PostUpdate[] = [];
	const creates: PostCreate[] = [];
	const deletes: string[] = [];

	// Find updates and creates
	for (const localPost of localPosts) {
		const original = originalPosts.find(p => p.id === localPost.id);
		
		if (!original) {
			// New post (has ID but wasn't in original data)
			creates.push({
				title: localPost.title,
				slug: localPost.slug,
				meta_description: localPost.meta_description,
				theme_id: localPost.theme_id
			});
		} else if (hasPostChanged(original, localPost)) {
			// Modified post
			updates.push({
				id: localPost.id,
				...getPostChanges(original, localPost)
			});
		}
	}

	// Find deletes
	for (const originalPost of originalPosts) {
		if (!localPosts.find(p => p.id === originalPost.id)) {
			deletes.push(originalPost.id);
		}
	}

	return { updates, creates, deletes };
}

export async function syncPosts(
	supabase: SupabaseClient<Database>,
	domainName: string,
	localPosts: Post[],
	originalPosts: Post[]
): Promise<SyncResult> {
	const { updates, creates, deletes } = findPostDifferences(localPosts, originalPosts);

	// If no changes, return early
	if (updates.length === 0 && creates.length === 0 && deletes.length === 0) {
		return { success: true, conflicts: [], errors: [] };
	}

	try {
		const { data, error } = await supabase.rpc('sync_posts', {
			domain_name: domainName,
			updates,
			creates,
			deletes
		});

		if (error) {
			return { success: false, conflicts: [], errors: [error.message] };
		}

		return data as SyncResult;
	} catch (err) {
		return {
			success: false,
			conflicts: [],
			errors: [err instanceof Error ? err.message : 'Unknown error']
		};
	}
}
