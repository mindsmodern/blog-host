import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getDocumentSlugAndTag } from '$lib/server/supabase';

export const load: PageServerLoad = async ({ url }) => {
	if (url.searchParams.has('id')) {
		const { slug } = await getDocumentSlugAndTag(url.searchParams.get('id')!);
		if (slug === null) {
			throw error(404);
		} else {
			throw redirect(308, slug);
		}
	}
};
