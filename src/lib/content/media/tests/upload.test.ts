import { describe, it, expect, vi, beforeEach } from 'vitest';
import { uploadMedia } from '../upload.js';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '$lib/util';

// Mock Supabase client
const mockSupabase = {
	storage: {
		from: vi.fn().mockReturnThis(),
		upload: vi.fn(),
		getPublicUrl: vi.fn()
	}
} as unknown as SupabaseClient<Database>;

// Type-safe mock functions
const mockUpload = mockSupabase.storage.upload as ReturnType<typeof vi.fn>;
const mockGetPublicUrl = mockSupabase.storage.getPublicUrl as ReturnType<typeof vi.fn>;

// Mock file for testing
const createMockFile = (name: string, type: string, size: number): File => {
	const file = new File(['test content'], name, { type });
	Object.defineProperty(file, 'size', { value: size });
	return file;
};

describe('uploadMedia', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should upload a valid image file successfully', async () => {
		const mockFile = createMockFile('test.jpg', 'image/jpeg', 1024);
		const domainId = '123e4567-e89b-12d3-a456-426614174000';

		// Mock successful upload
		mockUpload.mockResolvedValue({
			data: { path: `${domainId}/some-uuid.jpg` },
			error: null
		});

		mockGetPublicUrl.mockReturnValue({
			data: {
				publicUrl:
					'https://example.com/storage/media/123e4567-e89b-12d3-a456-426614174000/some-uuid.jpg'
			}
		});

		const result = await uploadMedia(mockFile, domainId, mockSupabase);

		expect(result).toHaveProperty('handle');
		expect(result).toHaveProperty('url');
		expect(result.handle).toMatch(new RegExp(`^${domainId}/[0-9a-f-]{36}\\.jpg$`));
		expect(result.url).toBe(
			'https://example.com/storage/media/123e4567-e89b-12d3-a456-426614174000/some-uuid.jpg'
		);

		// Verify upload was called with correct parameters
		expect(mockSupabase.storage.upload).toHaveBeenCalledWith(
			expect.stringMatching(`^${domainId}/[0-9a-f-]{36}\\.jpg$`),
			mockFile,
			{
				cacheControl: '3600',
				upsert: false,
				contentType: 'image/jpeg'
			}
		);
	});

	it('should upload a valid video file successfully', async () => {
		const mockFile = createMockFile('test.mp4', 'video/mp4', 2048);
		const domainId = '123e4567-e89b-12d3-a456-426614174000';

		mockUpload.mockResolvedValue({
			data: { path: `${domainId}/some-uuid.mp4` },
			error: null
		});

		mockGetPublicUrl.mockReturnValue({
			data: { publicUrl: 'https://example.com/storage/media/test.mp4' }
		});

		const result = await uploadMedia(mockFile, domainId, mockSupabase);

		expect(result.handle).toMatch(new RegExp(`^${domainId}/[0-9a-f-]{36}\\.mp4$`));
		expect(mockSupabase.storage.upload).toHaveBeenCalledWith(
			expect.stringMatching(`^${domainId}/[0-9a-f-]{36}\\.mp4$`),
			mockFile,
			expect.objectContaining({ contentType: 'video/mp4' })
		);
	});

	it('should throw error for missing file', async () => {
		const domainId = '123e4567-e89b-12d3-a456-426614174000';

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		await expect(uploadMedia(null as any, domainId, mockSupabase)).rejects.toThrow(
			'File is required'
		);
	});

	it('should throw error for invalid domain ID', async () => {
		const mockFile = createMockFile('test.jpg', 'image/jpeg', 1024);

		await expect(uploadMedia(mockFile, 'invalid-uuid', mockSupabase)).rejects.toThrow(
			'Valid domain ID (UUID) is required'
		);
	});

	it('should throw error for missing domain ID', async () => {
		const mockFile = createMockFile('test.jpg', 'image/jpeg', 1024);

		await expect(uploadMedia(mockFile, '', mockSupabase)).rejects.toThrow(
			'Valid domain ID (UUID) is required'
		);
	});

	it('should throw error for file too large', async () => {
		const largeFile = createMockFile('large.jpg', 'image/jpeg', 60 * 1024 * 1024); // 60MB
		const domainId = '123e4567-e89b-12d3-a456-426614174000';

		await expect(uploadMedia(largeFile, domainId, mockSupabase)).rejects.toThrow(
			'File size exceeds maximum allowed size of 50MB'
		);
	});

	it('should throw error for unsupported file type', async () => {
		const mockFile = createMockFile('test.txt', 'text/plain', 1024);
		const domainId = '123e4567-e89b-12d3-a456-426614174000';

		await expect(uploadMedia(mockFile, domainId, mockSupabase)).rejects.toThrow(
			'File type text/plain is not allowed'
		);
	});

	it('should handle upload error from Supabase', async () => {
		const mockFile = createMockFile('test.jpg', 'image/jpeg', 1024);
		const domainId = '123e4567-e89b-12d3-a456-426614174000';

		mockUpload.mockResolvedValue({
			data: null,
			error: { message: 'Storage error' }
		});

		await expect(uploadMedia(mockFile, domainId, mockSupabase)).rejects.toThrow(
			'Failed to upload media: Storage error'
		);
	});

	it('should generate correct file extensions for different MIME types', async () => {
		const testCases = [
			{ type: 'image/png', expectedExt: 'png' },
			{ type: 'image/gif', expectedExt: 'gif' },
			{ type: 'image/webp', expectedExt: 'webp' },
			{ type: 'video/webm', expectedExt: 'webm' },
			{ type: 'video/ogg', expectedExt: 'ogg' }
		];

		const domainId = '123e4567-e89b-12d3-a456-426614174000';

		for (const testCase of testCases) {
			const mockFile = createMockFile(`test.${testCase.expectedExt}`, testCase.type, 1024);

			mockUpload.mockResolvedValue({
				data: { path: `${domainId}/some-uuid.${testCase.expectedExt}` },
				error: null
			});

			mockGetPublicUrl.mockReturnValue({
				data: { publicUrl: `https://example.com/test.${testCase.expectedExt}` }
			});

			const result = await uploadMedia(mockFile, domainId, mockSupabase);

			expect(result.handle).toMatch(
				new RegExp(`^${domainId}/[0-9a-f-]{36}\\.${testCase.expectedExt}$`)
			);
		}
	});
});
