import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '$lib/util';

/**
 * Result of a successful media upload
 */
export interface MediaUploadResult {
	/**
	 * The media handle (storage path) that can be used to reference this media
	 * Format: {domain_id}/{media_id}.{ext}
	 */
	handle: string;
	/**
	 * The full URL to access the uploaded media
	 */
	url: string;
}

/**
 * Allowed media file types
 */
const ALLOWED_MIME_TYPES = [
	// Images
	'image/jpeg',
	'image/jpg',
	'image/png',
	'image/gif',
	'image/webp',
	'image/svg+xml',
	// Videos
	'video/mp4',
	'video/webm',
	'video/ogg'
] as const;

/**
 * Maximum file size in bytes (50MB)
 */
const MAX_FILE_SIZE = 50 * 1024 * 1024;

/**
 * Validates that a domain ID is a valid UUID format
 */
function isValidUUID(uuid: string): boolean {
	const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
	return uuidRegex.test(uuid);
}

/**
 * Gets file extension from MIME type
 */
function getExtensionFromMimeType(mimeType: string): string {
	const mimeToExt: Record<string, string> = {
		'image/jpeg': 'jpg',
		'image/jpg': 'jpg',
		'image/png': 'png',
		'image/gif': 'gif',
		'image/webp': 'webp',
		'image/svg+xml': 'svg',
		'video/mp4': 'mp4',
		'video/webm': 'webm',
		'video/ogg': 'ogg'
	};
	return mimeToExt[mimeType] || 'bin';
}

/**
 * Uploads a media file to Supabase Storage following their documented patterns
 *
 * @param file - The file to upload
 * @param domainId - The domain ID that owns this media (must be a valid UUID)
 * @param supabase - The Supabase client instance
 * @returns Promise that resolves to MediaUploadResult with handle and URL
 * @throws Error if upload fails or validation fails
 */
export async function uploadMedia(
	file: File,
	domainId: string,
	supabase: SupabaseClient<Database>
): Promise<MediaUploadResult> {
	// Validate inputs
	if (!file) {
		throw new Error('File is required');
	}

	if (!domainId || !isValidUUID(domainId)) {
		throw new Error('Valid domain ID (UUID) is required');
	}

	// Validate domain ownership using our helper function
	const { data: ownsData, error: ownsError } = await supabase.rpc('user_owns_domain', {
		domain_uuid: domainId
	});

	if (ownsError) {
		throw new Error(`Failed to verify domain ownership: ${ownsError.message}`);
	}

	if (!ownsData) {
		throw new Error('You do not have permission to upload media to this domain');
	}

	// Validate file size
	if (file.size > MAX_FILE_SIZE) {
		throw new Error(`File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
	}

	// Validate MIME type
	if (!ALLOWED_MIME_TYPES.includes(file.type as any)) {
		throw new Error(
			`File type ${file.type} is not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`
		);
	}

	// Generate unique media ID and construct path
	const mediaId = crypto.randomUUID();
	const extension = getExtensionFromMimeType(file.type);
	const path = `${domainId}/${mediaId}.${extension}`;

	// Upload using Supabase's documented method
	const { data, error } = await supabase.storage.from('media').upload(path, file, {
		cacheControl: '3600',
		upsert: false,
		contentType: file.type
	});

	if (error) {
		throw new Error(`Failed to upload media: ${error.message}`);
	}

	// Get the public URL using Supabase's documented method
	const { data: urlData } = supabase.storage.from('media').getPublicUrl(path);

	return {
		handle: path,
		url: urlData.publicUrl
	};
}
