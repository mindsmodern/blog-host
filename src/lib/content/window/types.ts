export interface WindowRenderContext {
	documentId: string;
	document: any;
}

export interface WindowRenderResult {
	html: string;
	headers?: Record<string, string | undefined>;
}

export type WindowRenderer = (context: WindowRenderContext) => Promise<WindowRenderResult>;

export interface WindowRendererRegistry {
	[fragment: string]: WindowRenderer;
}