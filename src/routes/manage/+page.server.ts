import { fetchUserPosts } from '$lib/manage';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase, domain } }) => {
	const posts = await fetchUserPosts(supabase);
	return {
		posts,
		domain
	};
};
