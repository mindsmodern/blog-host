import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '$lib/util';
import type { MediaTypes } from '@mindsmodern/grid-editor';

/**
 * Media resolution result matching grid-editor's expected format
 */
export interface MediaResolution {
	src: string;
	type: MediaTypes;
	metadata?: {
		filename?: string;
		contentType?: string;
	};
}

/**
 * Validates that a media handle has the correct format: {uuid}/{uuid}.{ext}
 */
function isValidMediaHandle(handle: string): boolean {
	// Pattern: {domain_id}/{media_id}.{ext}
	// Both domain_id and media_id should be UUIDs
	const pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpg|jpeg|png|gif|webp|svg|mp4|webm|ogg)$/i;
	return pattern.test(handle);
}

/**
 * Determines media type from file extension
 */
function getMediaTypeFromExtension(extension: string): MediaTypes {
	const videoExtensions = ['mp4', 'webm', 'ogg'];
	return videoExtensions.includes(extension.toLowerCase()) ? 'video' : 'image';
}

/**
 * Extracts filename from handle for metadata
 */
function getFilenameFromHandle(handle: string): string {
	const parts = handle.split('/');
	return parts[parts.length - 1] || 'unknown';
}

/**
 * Resolves a media handle to its public URL and metadata using Supabase's documented methods
 * 
 * @param handle - The media handle (storage path) in format: {domain_id}/{media_id}.{ext}
 * @param supabase - The Supabase client instance
 * @returns MediaResolution object with src URL, type, and metadata, or null if invalid/not found
 */
export function resolveMediaUrl(
	handle: string,
	supabase: SupabaseClient<Database>
): MediaResolution | null {
	// Validate handle format
	if (!handle || !isValidMediaHandle(handle)) {
		console.warn(`Invalid media handle format: ${handle}`);
		return null;
	}
	
	try {
		// Use Supabase's documented getPublicUrl method
		const { data } = supabase.storage
			.from('media')
			.getPublicUrl(handle);
		
		// Extract file extension to determine type
		const extension = handle.split('.').pop() || '';
		const mediaType = getMediaTypeFromExtension(extension);
		const filename = getFilenameFromHandle(handle);
		
		return {
			src: data.publicUrl,
			type: mediaType,
			metadata: {
				filename: filename,
				contentType: mediaType === 'video' ? `video/${extension}` : `image/${extension}`
			}
		};
	} catch (error) {
		console.error(`Error resolving media URL for handle ${handle}:`, error);
		return null;
	}
}

/**
 * Batch resolves multiple media handles efficiently
 * 
 * @param handles - Array of media handles to resolve
 * @param supabase - The Supabase client instance
 * @returns Map of handle to MediaResolution (or null if resolution failed)
 */
export function resolveMultipleMediaUrls(
	handles: string[],
	supabase: SupabaseClient<Database>
): Map<string, MediaResolution | null> {
	const results = new Map<string, MediaResolution | null>();
	
	for (const handle of handles) {
		results.set(handle, resolveMediaUrl(handle, supabase));
	}
	
	return results;
}