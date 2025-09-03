import type { WindowSchemaConfig } from '@mindsmodern/grid-editor';

/**
 * Creates a window configuration for grid-editor that integrates with our API endpoints
 *
 * This configuration handles:
 * - Content fetching from various sources (documents, books, custom URLs)
 * - URL validation for security
 * - Error handling for failed content loads
 *
 * @returns WindowSchemaConfig for use with grid-editor
 */
export function createWindowSchemaConfig(): WindowSchemaConfig {
	// Content fetcher for Window nodes
	const getContent = async (url: string): Promise<string> => {
		try {
			const response = await fetch(url);
			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}
			return await response.text();
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return `<div style="padding: 1rem; color: #cc0000; border: 1px solid #cc0000; border-radius: 4px; background-color: #fff5f5; font-family: system-ui, sans-serif;">
				<strong>Failed to load content:</strong> ${errorMessage}
			</div>`;
		}
	};

	return {
		getContent,
		renderWindows: true,
		isAllowedUrl: (url: string) => {
			// Allow local API endpoints
			if (url.startsWith('/api/')) {
				return true;
			}
			// Block HTTP and other protocols for security
			return false;
		}
	};
}
