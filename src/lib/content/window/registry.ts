import type { WindowRendererRegistry } from './types';
import { contentWindowRenderer } from './renderers/content';

export const windowRendererRegistry: WindowRendererRegistry = {
	content: contentWindowRenderer,
	// book: bookWindowRenderer, // TODO: Implement book renderer
};

export function getWindowRenderer(type: string | null) {
	// Default to content renderer if no type specified
	const rendererKey = type || 'content';
	return windowRendererRegistry[rendererKey];
}