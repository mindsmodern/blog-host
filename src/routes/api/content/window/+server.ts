import { JSDOM } from 'jsdom';
import type { RequestHandler } from './$types';
import { renderContent, type WindowSchemaConfig } from '@mindsmodern/grid-editor';
import { supabaseAnon } from '$lib/server/supabase';
import { error } from '@sveltejs/kit';
import { createMediaSchemaConfig } from '$lib/content/media';

export const GET: RequestHandler = async ({ url }) => {
	const documentId = url.searchParams.get('id');

	if (!documentId) {
		throw error(400, 'Document ID is required');
	}

	// Fetch document from database using shared anon client
	const { data: document, error: docError } = await supabaseAnon
		.from('documents')
		.select('content')
		.eq('id', documentId)
		.single();

	if (docError || !document) {
		throw error(404, 'Document not found');
	}

	// Create JSDOM document for serialization
	const dom = new JSDOM();
	const domDocument = dom.window.document as unknown as Document;

	// Parse the document content (assuming it's a ProseMirror document)
	const doc = document.content as any;

	const windowConfig: WindowSchemaConfig = {
		document: domDocument,
		renderWindows: false,
		isAllowedUrl: (url: string) => url.startsWith('/') || url.startsWith('http')
	};

	// Use renderContent to serialize to HTML with server-safe configs
	const html = await renderContent(doc, {
		window: windowConfig,
		media: createMediaSchemaConfig()
	});

	return new Response(html, {
		headers: {
			'Content-Type': 'text/html',
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET',
			'Access-Control-Allow-Headers': 'Content-Type'
		}
	});
};
