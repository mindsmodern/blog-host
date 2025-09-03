import { JSDOM } from 'jsdom';
import type { RequestHandler } from './$types';
import { WindowContentRenderer } from '@mindsmodern/grid-editor';
import { supabaseAnon } from '$lib/server/supabase';
import { error } from '@sveltejs/kit';

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
	const doc = document.content;

	// Use WindowContentRenderer to serialize to HTML
	const renderer = new WindowContentRenderer(
		{
			renderWindows: false,
			isAllowedUrl: (url) => url.startsWith('/') || url.startsWith('http')
		},
		domDocument
	);

	const html = renderer.serializeToHTML(doc, null);

	return new Response(html, {
		headers: {
			'Content-Type': 'text/html',
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET',
			'Access-Control-Allow-Headers': 'Content-Type'
		}
	});
};
