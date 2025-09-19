import { JSDOM } from 'jsdom';
import { renderContent, type WindowSchemaConfig } from '@mindsmodern/grid-editor';
import { createMediaSchemaConfig } from '$lib/content/media';
import type { WindowRenderer } from '../types';
import { supabaseAnon } from '$lib/server/supabase';
import { error } from '@sveltejs/kit';

export const contentWindowRenderer: WindowRenderer = async (documentId) => {
	// Fetch document from database using shared anon client
	const { data: document, error: docError } = await supabaseAnon
		.from('documents')
		.select('content, width')
		.eq('id', documentId)
		.single();

	if (docError || !document) {
		throw error(404, 'Document not found');
	}

	// Create JSDOM document for serialization
	const dom = new JSDOM();
	const domDocument = dom.window.document as unknown as Document;

	const windowConfig: WindowSchemaConfig = {
		document: domDocument,
		renderWindows: false,
		isAllowedUrl: (url: string) => url.startsWith('/') || url.startsWith('http')
	};

	// Parse the document content (ProseMirror document)
	const doc = document.content as any;

	// Use renderContent to serialize to HTML
	const html = await renderContent(doc, {
		window: windowConfig,
		media: createMediaSchemaConfig()
	});

	return {
		html: `<div style="container-type: inline-size; font-size: calc(100cqw / ${document.width});">${html}</div>`,
		headers: {
			'Content-Type': 'text/html',
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET',
			'Access-Control-Allow-Headers': 'Content-Type'
		}
	};
};
