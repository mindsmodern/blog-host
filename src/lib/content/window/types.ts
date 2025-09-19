export interface WindowRenderResult {
	html: string;
	headers?: Record<string, string | undefined>;
}

export type WindowRenderer = (documentId: string) => Promise<WindowRenderResult>;

export interface WindowRendererRegistry {
	[fragment: string]: WindowRenderer;
}
