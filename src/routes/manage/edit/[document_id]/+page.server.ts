import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, locals }) => {
	const { document_id } = params;

	// Get the document and its associated domain
	const { data: document, error: docError } = await locals.supabase
		.from('documents')
		.select(
			`
			id,
			post_id,
			content,
			tag,
			width,
			posts!inner(
				id,
				title,
				domain_id,
				domains!inner(
					id,
					domain_name,
					title,
					owner_id
				)
			)
		`
		)
		.eq('id', document_id)
		.single();

	if (docError) {
		throw error(404, `Document not found`);
	}

	if (!document) {
		throw error(404, 'Document not found');
	}

	// Extract domain from the nested structure
	const domain = document.posts.domains;
	const post = {
		id: document.posts.id,
		title: document.posts.title,
		domain_id: document.posts.domain_id,
		content: document.content
	};

	// Get other published documents from the same domain (excluding current document)
	const { data: availableDocuments } = await locals.supabase
		.from('documents')
		.select(
			`
			id,
			tag,
			width,
			posts!inner(
				id,
				title,
				slug,
				domain_id
			)
		`
		)
		.eq('posts.domain_id', domain.id)
		.not('posts.slug', 'is', null) // Only published posts
		.neq('id', document_id); // Exclude current document

	// Transform available documents to simpler format
	const transformedDocuments = (availableDocuments || []).map((doc) => ({
		id: doc.id,
		title: doc.posts.title,
		slug: doc.posts.slug,
		tag: doc.tag,
		width: doc.width
	}));

	return {
		document: {
			id: document.id,
			post_id: document.post_id,
			content: document.content,
			tag: document.tag,
			width: document.width
		},
		post,
		domain,
		availableDocuments: transformedDocuments
	};
};
