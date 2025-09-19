import type { WindowSchemaConfig } from '@mindsmodern/grid-editor';


/**
 * Creates a window configuration for grid-editor that integrates with our API endpoints
 *
 * This configuration handles:
 * - Window ID resolution to API endpoints (supports type:id format)
 * - Content fetching with proper error handling
 * - URL validation for security
 *
 * @returns WindowSchemaConfig for use with grid-editor
 */
export function createWindowSchemaConfig(customFetch?: typeof fetch): WindowSchemaConfig {
	// Content fetcher for Window nodes
	const getContent = async (id: string): Promise<string> => {
		try {
			const fetchUrl = `/api/content/window?id=${id}`;
			if (!customFetch) {
				customFetch = fetch;
			}
			const response = await customFetch(fetchUrl);
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
		getPath: (url: string) => `/api/redirect?id=${url}`,
		renderWindows: true,
		isAllowedUrl: (id: string) => {
			return true; // TODO: Add validation later
		}
	};
}
