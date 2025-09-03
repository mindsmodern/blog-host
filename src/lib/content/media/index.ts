/**
 * Media handling module for Blog Host
 * 
 * This module provides functions for uploading media to Supabase Storage and
 * integrating with @mindsmodern/grid-editor for rich content editing.
 * 
 * Key features:
 * - Upload images and videos to Supabase Storage with proper RLS security
 * - Resolve media handles to public URLs for serving content
 * - Grid-editor integration with MediaSchemaConfig
 * - Domain-based access control (only domain owners can upload)
 * - Public read access for published content
 */

// Upload functionality
export { uploadMedia } from './upload.js';
export type { MediaUploadResult } from './upload.js';

// URL resolution functionality
export { resolveMediaUrl, resolveMultipleMediaUrls } from './resolve.js';
export type { MediaResolution } from './resolve.js';

// Grid-editor integration
export { createMediaSchemaConfig, createServerMediaSchemaConfig } from './grid-config.js';

// Re-export useful types from grid-editor for convenience
export type { 
	MediaAttrs, 
	MediaTypes,
	MediaSchemaConfig 
} from '@mindsmodern/grid-editor';