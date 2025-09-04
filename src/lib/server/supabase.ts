import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import type { Database } from '$lib/util';

/**
 * Global Supabase client for server-side anonymous access
 * Shared across API endpoints that need to access public data
 */
export const supabaseAnon = createClient<Database>(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);

export async function getDocumentSlugAndTag(documentId: string) {
	const { data, error } = await supabaseAnon
		.from('documents')
		.select(`
			tag,
			posts (
				slug
			)
		`)
		.eq('id', documentId)
		.single();

	if (error) {
		throw error;
	}

	return {
		slug: data.posts?.slug || null,
		tag: data.tag
	};
}
