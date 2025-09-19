import type { RequestHandler } from './$types';
import { supabaseAnon } from '$lib/server/supabase';
import { error } from '@sveltejs/kit';
import { getWindowRenderer } from '$lib/content/window/registry';

export const GET: RequestHandler = async ({ url }) => {
	const id = url.searchParams.get('id');

	if (!id) {
		throw error(400, 'ID is required');
	}

	// Extract type from id (e.g., "content:123" -> type="content", documentId="123")
	const [type, documentId] = id.includes(':') ? id.split(':', 2) : [null, id];

	// Get the appropriate renderer based on type
	const renderer = getWindowRenderer(type);

	if (!renderer) {
		throw error(400, `Unknown type: ${type}`);
	}

	try {
		// Render using the selected renderer
		const result = await renderer(documentId);

		return new Response(result.html, {
			headers: result.headers || {}
		});
	} catch (renderError) {
		console.error('Render error:', renderError);
		throw error(500, 'Failed to render content');
	}
};
