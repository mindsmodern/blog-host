import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './+server.js';

// Mock the resolve function
vi.mock('$lib/content/media/resolve.js', () => ({
	resolveMediaUrl: vi.fn()
}));

// Mock SvelteKit functions - these will be mocked at the module level
vi.mock('@sveltejs/kit', async () => {
	const actual = await vi.importActual('@sveltejs/kit');
	return {
		...actual,
		error: vi.fn((status: number, message: string) => {
			const err = new Error(message) as any;
			err.status = status;
			throw err;
		}),
		redirect: vi.fn((status: number, location: string) => {
			const err = new Error(`Redirect to ${location}`) as any;
			err.status = status;
			err.location = location;
			throw err;
		})
	};
});

import { resolveMediaUrl } from '$lib/content/media/resolve.js';
import { error, redirect } from '@sveltejs/kit';

// Create mock request event
const createMockEvent = (searchParams: Record<string, string | null> = {}) => {
	const url = new URL('http://localhost/api/content/media');

	Object.entries(searchParams).forEach(([key, value]) => {
		if (value !== null) {
			url.searchParams.set(key, value);
		}
	});

	return {
		url,
		locals: {
			supabase: {} // Mock Supabase client
		}
	};
};

describe('API Endpoint: GET /api/content/media', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should redirect to media URL for valid media ID', async () => {
		const mediaId = '123e4567-e89b-12d3-a456-426614174000/987fcdeb-51a2-43d1-9f47-123456789abc.jpg';
		const event = createMockEvent({ id: mediaId });

		(resolveMediaUrl as any).mockReturnValue({
			src: 'https://storage.example.com/media/test.jpg',
			type: 'image',
			metadata: {}
		});

		// Expect redirect to throw with status and location
		await expect(GET(event as any)).rejects.toThrow();

		try {
			await GET(event as any);
		} catch (e: any) {
			expect(e.status).toBe(302);
			expect(e.location).toBe('https://storage.example.com/media/test.jpg');
		}

		expect(resolveMediaUrl).toHaveBeenCalledWith(mediaId, event.locals.supabase);
		expect(redirect).toHaveBeenCalledWith(302, 'https://storage.example.com/media/test.jpg');
	});

	it('should return 400 error when media ID is missing', async () => {
		const event = createMockEvent({}); // No 'id' parameter

		await expect(GET(event as any)).rejects.toThrow();

		try {
			await GET(event as any);
		} catch (e: any) {
			expect(e.status).toBe(400);
			expect(e.message).toBe('Media ID is required. Use ?id=your-media-id');
		}

		expect(error).toHaveBeenCalledWith(400, 'Media ID is required. Use ?id=your-media-id');
	});

	it('should return 400 error when media ID is empty string', async () => {
		const event = createMockEvent({ id: '' });

		await expect(GET(event as any)).rejects.toThrow();

		try {
			await GET(event as any);
		} catch (e: any) {
			expect(e.status).toBe(400);
			expect(e.message).toBe('Media ID is required. Use ?id=your-media-id');
		}

		expect(error).toHaveBeenCalledWith(400, 'Media ID is required. Use ?id=your-media-id');
	});

	it('should return 404 error when media is not found', async () => {
		const mediaId = 'invalid-media-id';
		const event = createMockEvent({ id: mediaId });

		(resolveMediaUrl as any).mockReturnValue(null); // Media not found

		await expect(GET(event as any)).rejects.toThrow();

		try {
			await GET(event as any);
		} catch (e: any) {
			expect(e.status).toBe(404);
			expect(e.message).toBe('Media not found or invalid media ID');
		}

		expect(resolveMediaUrl).toHaveBeenCalledWith(mediaId, event.locals.supabase);
		expect(error).toHaveBeenCalledWith(404, 'Media not found or invalid media ID');
	});

	it('should handle video media types correctly', async () => {
		const mediaId = '123e4567-e89b-12d3-a456-426614174000/987fcdeb-51a2-43d1-9f47-123456789abc.mp4';
		const event = createMockEvent({ id: mediaId });

		(resolveMediaUrl as any).mockReturnValue({
			src: 'https://storage.example.com/media/video.mp4',
			type: 'video',
			metadata: {}
		});

		try {
			await GET(event as any);
		} catch (e: any) {
			expect(e.status).toBe(302);
			expect(e.location).toBe('https://storage.example.com/media/video.mp4');
		}

		expect(resolveMediaUrl).toHaveBeenCalledWith(mediaId, event.locals.supabase);
		expect(redirect).toHaveBeenCalledWith(302, 'https://storage.example.com/media/video.mp4');
	});

	it('should handle URL encoded media IDs', async () => {
		const mediaId = '123e4567-e89b-12d3-a456-426614174000/987fcdeb-51a2-43d1-9f47-123456789abc.jpg';
		const encodedMediaId = encodeURIComponent(mediaId);
		const event = createMockEvent({ id: encodedMediaId });

		(resolveMediaUrl as any).mockReturnValue({
			src: 'https://storage.example.com/media/test.jpg',
			type: 'image',
			metadata: {}
		});

		try {
			await GET(event as any);
		} catch (e: any) {
			expect(e.status).toBe(302);
			expect(e.location).toBe('https://storage.example.com/media/test.jpg');
		}

		// Should pass the encoded ID as-is (URL decoding happens automatically in browser)
		expect(resolveMediaUrl).toHaveBeenCalledWith(encodedMediaId, event.locals.supabase);
	});

	it('should pass through Supabase client from locals', async () => {
		const mediaId = '123e4567-e89b-12d3-a456-426614174000/987fcdeb-51a2-43d1-9f47-123456789abc.jpg';
		const mockSupabaseClient = { mock: 'client' };
		const event = {
			...createMockEvent({ id: mediaId }),
			locals: {
				supabase: mockSupabaseClient
			}
		};

		(resolveMediaUrl as any).mockReturnValue({
			src: 'https://storage.example.com/media/test.jpg',
			type: 'image',
			metadata: {}
		});

		try {
			await GET(event as any);
		} catch (e: any) {
			// Expected redirect
		}

		expect(resolveMediaUrl).toHaveBeenCalledWith(mediaId, mockSupabaseClient);
	});

	it('should ignore extra query parameters', async () => {
		const mediaId = '123e4567-e89b-12d3-a456-426614174000/987fcdeb-51a2-43d1-9f47-123456789abc.jpg';
		const url = new URL('http://localhost/api/content/media');
		url.searchParams.set('id', mediaId);
		url.searchParams.set('other', 'param'); // Extra parameter should be ignored

		const event = {
			url,
			locals: { supabase: {} }
		};

		(resolveMediaUrl as any).mockReturnValue({
			src: 'https://storage.example.com/media/test.jpg',
			type: 'image',
			metadata: {}
		});

		try {
			await GET(event as any);
		} catch (e: any) {
			expect(e.status).toBe(302);
		}

		expect(resolveMediaUrl).toHaveBeenCalledWith(mediaId, event.locals.supabase);
	});

	it('should work with different media file extensions', async () => {
		const extensions = ['jpg', 'png', 'gif', 'webp', 'mp4', 'webm', 'ogg'];

		for (const ext of extensions) {
			vi.clearAllMocks();

			const mediaId = `123e4567-e89b-12d3-a456-426614174000/987fcdeb-51a2-43d1-9f47-123456789abc.${ext}`;
			const event = createMockEvent({ id: mediaId });

			(resolveMediaUrl as any).mockReturnValue({
				src: `https://storage.example.com/media/test.${ext}`,
				type: ['mp4', 'webm', 'ogg'].includes(ext) ? 'video' : 'image',
				metadata: {}
			});

			try {
				await GET(event as any);
			} catch (e: any) {
				expect(e.status).toBe(302);
				expect(e.location).toBe(`https://storage.example.com/media/test.${ext}`);
			}

			expect(resolveMediaUrl).toHaveBeenCalledWith(mediaId, event.locals.supabase);
		}
	});
});
