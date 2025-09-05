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
	const { data: { user } } = await supabase.auth.getUser();
	
	if (!user) {
		throw new Error('User not authenticated');
	}

	const { data, error } = await supabase
		.from('posts')
		.select(`
			id,
			title,
			slug,
			created_at,
			updated_at,
			meta_description,
			theme_id,
			domain_id,
			domains!inner(owner_id)
		`)
		.eq('domains.owner_id', user.id)
		.order('created_at', { ascending: false });

	if (error) {
		throw error;
	}

	return data || [];
}

export async function fetchDomainPosts(supabase: SupabaseClient<Database>, domainName: string): Promise<Post[]> {
	const { data, error } = await supabase
		.from('posts')
		.select(`
			id,
			title,
			slug,
			created_at,
			updated_at,
			meta_description,
			theme_id,
			domain_id,
			domains!inner(domain_name)
		`)
		.eq('domains.domain_name', domainName)
		.order('created_at', { ascending: false });

	if (error) {
		throw error;
	}

	return data || [];
}