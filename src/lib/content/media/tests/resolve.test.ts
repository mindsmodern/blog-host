import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resolveMediaUrl, resolveMultipleMediaUrls } from '../resolve.js';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '$lib/util';

// Mock Supabase client
const mockSupabase = {
	storage: {
		from: vi.fn().mockReturnThis(),
		getPublicUrl: vi.fn()
	}
} as unknown as SupabaseClient<Database>;

describe('resolveMediaUrl', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.spyOn(console, 'warn').mockImplementation(() => {});
		vi.spyOn(console, 'error').mockImplementation(() => {});
	});

	it('should resolve a valid image handle successfully', () => {
		const handle = '123e4567-e89b-12d3-a456-426614174000/987fcdeb-51a2-43d1-9f47-123456789abc.jpg';
		
		(mockSupabase.storage.getPublicUrl as any).mockReturnValue({
			data: { publicUrl: 'https://example.com/storage/media/123e4567-e89b-12d3-a456-426614174000/987fcdeb-51a2-43d1-9f47-123456789abc.jpg' }
		});

		const result = resolveMediaUrl(handle, mockSupabase);

		expect(result).toEqual({
			src: 'https://example.com/storage/media/123e4567-e89b-12d3-a456-426614174000/987fcdeb-51a2-43d1-9f47-123456789abc.jpg',
			type: 'image',
			metadata: {
				filename: '987fcdeb-51a2-43d1-9f47-123456789abc.jpg',
				contentType: 'image/jpg'
			}
		});

		expect(mockSupabase.storage.getPublicUrl).toHaveBeenCalledWith(handle);
	});

	it('should resolve a valid video handle successfully', () => {
		const handle = '123e4567-e89b-12d3-a456-426614174000/987fcdeb-51a2-43d1-9f47-123456789abc.mp4';
		
		(mockSupabase.storage.getPublicUrl as any).mockReturnValue({
			data: { publicUrl: 'https://example.com/video.mp4' }
		});

		const result = resolveMediaUrl(handle, mockSupabase);

		expect(result).toEqual({
			src: 'https://example.com/video.mp4',
			type: 'video',
			metadata: {
				filename: '987fcdeb-51a2-43d1-9f47-123456789abc.mp4',
				contentType: 'video/mp4'
			}
		});
	});

	it('should determine correct media types for different extensions', () => {
		const testCases = [
			{ ext: 'jpg', expectedType: 'image' },
			{ ext: 'png', expectedType: 'image' },
			{ ext: 'gif', expectedType: 'image' },
			{ ext: 'webp', expectedType: 'image' },
			{ ext: 'svg', expectedType: 'image' },
			{ ext: 'mp4', expectedType: 'video' },
			{ ext: 'webm', expectedType: 'video' },
			{ ext: 'ogg', expectedType: 'video' }
		];

		testCases.forEach(({ ext, expectedType }) => {
			const handle = `123e4567-e89b-12d3-a456-426614174000/987fcdeb-51a2-43d1-9f47-123456789abc.${ext}`;
			
			(mockSupabase.storage.getPublicUrl as any).mockReturnValue({
				data: { publicUrl: `https://example.com/test.${ext}` }
			});

			const result = resolveMediaUrl(handle, mockSupabase);
			
			expect(result?.type).toBe(expectedType);
			expect(result?.metadata?.contentType).toBe(`${expectedType}/${ext}`);
		});
	});

	it('should return null for invalid handle format', () => {
		const invalidHandles = [
			'', // Empty string
			'invalid', // No UUID format
			'123/456.jpg', // Invalid UUIDs
			'123e4567-e89b-12d3-a456-426614174000/invalid.jpg', // Invalid second UUID
			'invalid/987fcdeb-51a2-43d1-9f47-123456789abc.jpg', // Invalid first UUID
			'123e4567-e89b-12d3-a456-426614174000/987fcdeb-51a2-43d1-9f47-123456789abc.txt', // Invalid extension
			'123e4567-e89b-12d3-a456-426614174000/987fcdeb-51a2-43d1-9f47-123456789abc', // No extension
			'123e4567-e89b-12d3-a456-426614174000-987fcdeb-51a2-43d1-9f47-123456789abc.jpg' // Missing slash
		];

		invalidHandles.forEach(handle => {
			const result = resolveMediaUrl(handle, mockSupabase);
			expect(result).toBeNull();
		});

		// Verify console.warn was called for each invalid handle
		expect(console.warn).toHaveBeenCalledTimes(invalidHandles.length);
	});

	it('should handle null/undefined handle', () => {
		expect(resolveMediaUrl(null as any, mockSupabase)).toBeNull();
		expect(resolveMediaUrl(undefined as any, mockSupabase)).toBeNull();
	});

	it('should handle errors gracefully', () => {
		const handle = '123e4567-e89b-12d3-a456-426614174000/987fcdeb-51a2-43d1-9f47-123456789abc.jpg';
		
		(mockSupabase.storage.getPublicUrl as any).mockImplementation(() => {
			throw new Error('Storage error');
		});

		const result = resolveMediaUrl(handle, mockSupabase);
		
		expect(result).toBeNull();
		expect(console.error).toHaveBeenCalledWith(
			expect.stringContaining('Error resolving media URL'),
			expect.any(Error)
		);
	});
});

describe('resolveMultipleMediaUrls', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.spyOn(console, 'warn').mockImplementation(() => {});
	});

	it('should resolve multiple valid handles', () => {
		const handles = [
			'123e4567-e89b-12d3-a456-426614174000/987fcdeb-51a2-43d1-9f47-123456789abc.jpg',
			'123e4567-e89b-12d3-a456-426614174000/987fcdeb-51a2-43d1-9f47-123456789def.mp4'
		];

		(mockSupabase.storage.getPublicUrl as any)
			.mockReturnValueOnce({
				data: { publicUrl: 'https://example.com/image.jpg' }
			})
			.mockReturnValueOnce({
				data: { publicUrl: 'https://example.com/video.mp4' }
			});

		const results = resolveMultipleMediaUrls(handles, mockSupabase);

		expect(results.size).toBe(2);
		expect(results.get(handles[0])).toEqual({
			src: 'https://example.com/image.jpg',
			type: 'image',
			metadata: {
				filename: '987fcdeb-51a2-43d1-9f47-123456789abc.jpg',
				contentType: 'image/jpg'
			}
		});
		expect(results.get(handles[1])).toEqual({
			src: 'https://example.com/video.mp4',
			type: 'video',
			metadata: {
				filename: '987fcdeb-51a2-43d1-9f47-123456789def.mp4',
				contentType: 'video/mp4'
			}
		});
	});

	it('should handle mix of valid and invalid handles', () => {
		const handles = [
			'123e4567-e89b-12d3-a456-426614174000/987fcdeb-51a2-43d1-9f47-123456789abc.jpg', // Valid
			'invalid-handle', // Invalid
			'123e4567-e89b-12d3-a456-426614174000/987fcdeb-51a2-43d1-9f47-123456789def.mp4' // Valid
		];

		(mockSupabase.storage.getPublicUrl as any)
			.mockReturnValueOnce({
				data: { publicUrl: 'https://example.com/image.jpg' }
			})
			.mockReturnValueOnce({
				data: { publicUrl: 'https://example.com/video.mp4' }
			});

		const results = resolveMultipleMediaUrls(handles, mockSupabase);

		expect(results.size).toBe(3);
		expect(results.get(handles[0])).not.toBeNull();
		expect(results.get(handles[1])).toBeNull();
		expect(results.get(handles[2])).not.toBeNull();
	});

	it('should handle empty array', () => {
		const results = resolveMultipleMediaUrls([], mockSupabase);
		expect(results.size).toBe(0);
	});
});