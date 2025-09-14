import { redirect } from '@sveltejs/kit';
import { createDocument } from '$lib/manage';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, locals: { supabase } }) => {
	const postId = url.searchParams.get('post');
	const tag = url.searchParams.get('tag');

	if (!postId) {
		throw redirect(302, '/manage');
	}

	// Create the document
	const document = await createDocument(supabase, postId, tag);

	// Redirect to the edit page
	throw redirect(302, `/manage/edit/${document.id}`);
};
