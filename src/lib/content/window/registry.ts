import type { WindowRendererRegistry } from './types';
import { contentWindowRenderer } from './renderers/content';
import { bookWindowRenderer } from './renderers/book';

export const windowRendererRegistry: WindowRendererRegistry = {
	content: contentWindowRenderer,
	book: bookWindowRenderer,
};

export function getWindowRenderer(type: string | null) {
	// Default to content renderer if no type specified
	const rendererKey = type || 'content';
	return windowRendererRegistry[rendererKey];
}