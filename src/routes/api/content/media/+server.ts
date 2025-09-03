import { error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { resolveMediaUrl } from '$lib/content/media/resolve.js';

/**
 * API endpoint for serving media files
 * GET /api/content/media?id=[media_id]
 *
 * This endpoint takes a media ID (handle) and redirects to the actual media file
 * stored in Supabase Storage. This decouples the grid-editor from direct Supabase access.
 */
export const GET: RequestHandler = async ({ url, locals }) => {
	// Get media ID from query parameters
	const mediaId = url.searchParams.get('id');

	if (!mediaId || mediaId.trim() === '') {
		error(400, 'Media ID is required. Use ?id=your-media-id');
	}

	// Resolve the media URL using our existing function
	const mediaResolution = resolveMediaUrl(mediaId, locals.supabase);

	if (!mediaResolution) {
		error(404, 'Media not found or invalid media ID');
	}

	// Redirect to the actual media file in Supabase Storage
	// This allows <img src="/api/content/media?id=..." /> to work directly
	redirect(302, mediaResolution.src);
};
