import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMediaSchemaConfig, createServerMediaSchemaConfig } from '../grid-config.js';

// Mock global document
const mockDocument = {
	createElement: vi.fn()
};

// Mock window object for browser environment tests
const mockWindow = {
	document: mockDocument
};

describe('createMediaSchemaConfig', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// Setup browser environment
		Object.defineProperty(global, 'window', {
			value: mockWindow,
			writable: true
		});
	});

	it('should create a valid MediaSchemaConfig', () => {
		const config = createMediaSchemaConfig();

		expect(config).toHaveProperty('isValidMediaId');
		expect(config).toHaveProperty('generatePlaceholder');
		expect(config).toHaveProperty('resolveMedia');
		expect(config.renderMedia).toBe(true);
		expect(config.document).toBe(mockDocument);
	});

	describe('isValidMediaId', () => {
		it('should validate correct UUID-based media handles', () => {
			const config = createMediaSchemaConfig();
			const validHandles = [
				'123e4567-e89b-12d3-a456-426614174000/987fcdeb-51a2-43d1-9f47-123456789abc.jpg',
				'123e4567-e89b-12d3-a456-426614174000/987fcdeb-51a2-43d1-9f47-123456789abc.png',
				'123e4567-e89b-12d3-a456-426614174000/987fcdeb-51a2-43d1-9f47-123456789abc.gif',
				'123e4567-e89b-12d3-a456-426614174000/987fcdeb-51a2-43d1-9f47-123456789abc.webp',
				'123e4567-e89b-12d3-a456-426614174000/987fcdeb-51a2-43d1-9f47-123456789abc.svg',
				'123e4567-e89b-12d3-a456-426614174000/987fcdeb-51a2-43d1-9f47-123456789abc.mp4',
				'123e4567-e89b-12d3-a456-426614174000/987fcdeb-51a2-43d1-9f47-123456789abc.webm',
				'123e4567-e89b-12d3-a456-426614174000/987fcdeb-51a2-43d1-9f47-123456789abc.ogg'
			];

			validHandles.forEach((handle) => {
				expect(config.isValidMediaId!(handle)).toBe(true);
			});
		});

		it('should reject invalid media handles', () => {
			const config = createMediaSchemaConfig();
			const invalidHandles = [
				'', // Empty
				'invalid', // Not UUID format
				'123/456.jpg', // Invalid UUIDs
				'123e4567-e89b-12d3-a456-426614174000/invalid.jpg', // Invalid second UUID
				'invalid/987fcdeb-51a2-43d1-9f47-123456789abc.jpg', // Invalid first UUID
				'123e4567-e89b-12d3-a456-426614174000/987fcdeb-51a2-43d1-9f47-123456789abc.txt', // Invalid extension
				'123e4567-e89b-12d3-a456-426614174000/987fcdeb-51a2-43d1-9f47-123456789abc', // No extension
				null,
				undefined,
				42 as any
			];

			invalidHandles.forEach((handle) => {
				expect(config.isValidMediaId!(handle)).toBe(false);
			});
		});
	});

	describe('generatePlaceholder', () => {
		it('should generate placeholder with all attributes', () => {
			const config = createMediaSchemaConfig();
			const attrs = {
				id: '123e4567-e89b-12d3-a456-426614174000/987fcdeb-51a2-43d1-9f47-123456789abc.jpg',
				title: 'Test Image',
				width: 20,
				left: 5,
				top: 10
			};

			const placeholder = config.generatePlaceholder!(attrs);

			expect(placeholder).toEqual([
				'div',
				{
					class: 'media-placeholder',
					style: expect.stringContaining('width: 20em'),
					'data-media-id': attrs.id,
					'data-media-title': attrs.title
				},
				'📎 Test Image'
			]);

			// Check that style includes positioning
			const style = (placeholder as any)[1].style;
			expect(style).toContain('margin-left: 5em');
			expect(style).toContain('margin-top: 10em');
		});

		it('should generate placeholder with minimal attributes', () => {
			const config = createMediaSchemaConfig();
			const attrs = {
				id: '123e4567-e89b-12d3-a456-426614174000/987fcdeb-51a2-43d1-9f47-123456789abc.jpg',
				title: 'Test',
				width: null,
				left: 0,
				top: 0
			};

			const placeholder = config.generatePlaceholder!(attrs);
			const style = (placeholder as any)[1].style;

			expect(style).toContain('width: 200px'); // Default width
			expect(style).not.toContain('margin-left');
			expect(style).not.toContain('margin-top');
		});

		it('should handle missing title', () => {
			const config = createMediaSchemaConfig();
			const attrs = {
				id: '123e4567-e89b-12d3-a456-426614174000/987fcdeb-51a2-43d1-9f47-123456789abc.jpg',
				title: '',
				width: null,
				left: 0,
				top: 0
			};

			const placeholder = config.generatePlaceholder!(attrs);

			expect(placeholder[2]).toBe('📎 Loading media...');
		});
	});

	describe('resolveMedia', () => {
		it('should resolve valid image handle to API URL', () => {
			const config = createMediaSchemaConfig();
			const handle =
				'123e4567-e89b-12d3-a456-426614174000/987fcdeb-51a2-43d1-9f47-123456789abc.jpg';

			const result = config.resolveMedia!(handle);

			expect(result).toEqual({
				src: `/api/content/media?id=${encodeURIComponent(handle)}`,
				type: 'image',
				metadata: {
					filename: '987fcdeb-51a2-43d1-9f47-123456789abc.jpg',
					contentType: 'image/jpg'
				}
			});
		});

		it('should resolve valid video handle to API URL', () => {
			const config = createMediaSchemaConfig();
			const handle =
				'123e4567-e89b-12d3-a456-426614174000/987fcdeb-51a2-43d1-9f47-123456789abc.mp4';

			const result = config.resolveMedia!(handle);

			expect(result).toEqual({
				src: `/api/content/media?id=${encodeURIComponent(handle)}`,
				type: 'video',
				metadata: {
					filename: '987fcdeb-51a2-43d1-9f47-123456789abc.mp4',
					contentType: 'video/mp4'
				}
			});
		});

		it('should return null for invalid handles', () => {
			const config = createMediaSchemaConfig();

			expect(config.resolveMedia!('invalid')).toBeNull();
			expect(config.resolveMedia!('')).toBeNull();
			expect(config.resolveMedia!(null as any)).toBeNull();
		});

		it('should handle special characters in handle by URL encoding', () => {
			const config = createMediaSchemaConfig();
			const handle =
				'123e4567-e89b-12d3-a456-426614174000/987fcdeb-51a2-43d1-9f47-123456789abc.jpg';

			const result = config.resolveMedia!(handle);

			// The handle should be URL encoded in the API URL
			expect(result?.src).toBe(`/api/content/media?id=${encodeURIComponent(handle)}`);
		});
	});

	it('should set document to undefined in non-browser environment', () => {
		// Remove window object to simulate server environment
		Object.defineProperty(global, 'window', {
			value: undefined,
			writable: true
		});

		const config = createMediaSchemaConfig();

		expect(config.document).toBeUndefined();
	});
});

describe('createServerMediaSchemaConfig', () => {
	it('should create server-optimized config', () => {
		const config = createServerMediaSchemaConfig();

		expect(config).toHaveProperty('isValidMediaId');
		expect(config).toHaveProperty('generatePlaceholder');
		expect(config).toHaveProperty('resolveMedia');
		expect(config.renderMedia).toBe(false); // Should be false for server
		expect(config.document).toBeUndefined(); // No DOM on server
	});

	it('should always return null from resolveMedia on server', () => {
		const config = createServerMediaSchemaConfig();

		const validHandle =
			'123e4567-e89b-12d3-a456-426614174000/987fcdeb-51a2-43d1-9f47-123456789abc.jpg';
		const result = config.resolveMedia!(validHandle);

		expect(result).toBeNull();
	});

	it('should still validate media IDs on server', () => {
		const config = createServerMediaSchemaConfig();

		const validHandle =
			'123e4567-e89b-12d3-a456-426614174000/987fcdeb-51a2-43d1-9f47-123456789abc.jpg';
		const invalidHandle = 'invalid';

		expect(config.isValidMediaId!(validHandle)).toBe(true);
		expect(config.isValidMediaId!(invalidHandle)).toBe(false);
	});

	it('should still generate placeholders on server', () => {
		const config = createServerMediaSchemaConfig();
		const attrs = {
			id: '123e4567-e89b-12d3-a456-426614174000/987fcdeb-51a2-43d1-9f47-123456789abc.jpg',
			title: 'Server Image',
			width: null,
			left: 0,
			top: 0
		};

		const placeholder = config.generatePlaceholder!(attrs);

		expect(placeholder).toEqual([
			'div',
			expect.objectContaining({
				class: 'media-placeholder',
				'data-media-id': attrs.id,
				'data-media-title': attrs.title
			}),
			'📎 Server Image'
		]);
	});
});
