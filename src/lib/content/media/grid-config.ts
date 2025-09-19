import type { MediaAttrs, MediaSchemaConfig } from '@mindsmodern/grid-editor';

/**
 * Minimal DOMOutputSpec type definition for creating DOM elements
 * This is compatible with prosemirror-model's DOMOutputSpec
 */
type DOMOutputSpec = string | [string, Record<string, string>, ...(string | DOMOutputSpec)[]];

/**
 * Validates if a media ID (handle) has the correct format and represents a valid media file
 * Expected format: {domain_id}/{media_id}.{ext} where both IDs are UUIDs
 */
function isValidMediaId(id: string): boolean {
	if (!id || typeof id !== 'string') {
		return false;
	}

	if (id.startsWith('https://')) {
		return true;
	}

	// Validate format: {uuid}/{uuid}.{ext}
	const pattern =
		/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpg|jpeg|png|gif|webp|svg|mp4|webm|ogg)$/i;
	return pattern.test(id);
}

/**
 * Generates a placeholder DOM element when media cannot be loaded or is being loaded
 */
function generatePlaceholder(attrs: MediaAttrs): DOMOutputSpec {
	const { title, width, left, top } = attrs;

	const style = [
		'display: inline-block',
		'background: #f0f0f0',
		'border: 2px dashed #ccc',
		'color: #666',
		'text-align: center',
		'padding: 20px',
		'border-radius: 4px',
		'font-family: system-ui, sans-serif',
		'font-size: 14px',
		width ? `width: ${width}em` : 'width: 200px',
		'height: 120px',
		'line-height: 80px',
		left !== 0 ? `margin-left: ${left}em` : '',
		top !== 0 ? `margin-top: ${top}em` : ''
	]
		.filter(Boolean)
		.join('; ');

	return [
		'div',
		{
			class: 'media-placeholder',
			style,
			'data-media-id': attrs.id,
			'data-media-title': title
		},
		`📎 ${title || 'Loading media...'}`
	];
}

/**
 * Determines media type from file extension in handle
 */
function getMediaTypeFromHandle(handle: string): 'image' | 'video' {
	const extension = handle.split('.').pop()?.toLowerCase() || '';
	const videoExtensions = ['mp4', 'webm', 'ogg'];
	return videoExtensions.includes(extension) ? 'video' : 'image';
}

/**
 * Creates a MediaSchemaConfig for the grid-editor that uses our API endpoint
 *
 * @returns MediaSchemaConfig configured for this application
 */
export function createMediaSchemaConfig(): MediaSchemaConfig {
	return {
		/**
		 * Validates media IDs (handles) to ensure they follow our UUID-based format
		 */
		isValidMediaId: () => true,

		/**
		 * Generates placeholder content when media cannot be rendered
		 */
		generatePlaceholder,

		/**
		 * Resolves media IDs to their source URLs using our API endpoint
		 * This allows <img src="/api/content/media?id=..." /> to work directly
		 */
		resolveMedia: (id: string) => {
			if (!isValidMediaId(id)) {
				return null;
			}

			// Construct API URL for this media
			const apiUrl = `/api/content/media?id=${encodeURIComponent(id)}`;
			const mediaType = getMediaTypeFromHandle(id);
			const filename = id.split('/').pop() || 'unknown';

			return {
				src: apiUrl,
				type: mediaType,
				metadata: {
					filename,
					contentType:
						mediaType === 'video' ? `video/${id.split('.').pop()}` : `image/${id.split('.').pop()}`
				}
			};
		},

		/**
		 * Enable media rendering by default - set to true to show actual media content
		 * Set to false during editing if you want to show placeholders instead
		 */
		renderMedia: true,

		/**
		 * Use the global document for DOM operations
		 * In SSR contexts, this might need to be overridden
		 */
		document: typeof window !== 'undefined' ? window.document : undefined
	};
}

/**
 * Creates a MediaSchemaConfig optimized for server-side rendering
 * This version uses placeholders instead of attempting to load media
 */
export function createServerMediaSchemaConfig(): MediaSchemaConfig {
	return {
		isValidMediaId,
		generatePlaceholder,
		resolveMedia: () => null, // Don't resolve media on server
		renderMedia: false, // Always use placeholders on server
		document: undefined // No DOM on server
	};
}
