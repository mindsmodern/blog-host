import { JSDOM } from 'jsdom';
import { renderContent } from '@mindsmodern/grid-editor';
import { supabaseAnon } from '$lib/server/supabase';
import { BASE_URL } from '$env/static/private';
import { UAParser } from 'ua-parser-js';
import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const ssr = true;

export const load: PageServerLoad = async ({ url, request, fetch }) => {
	let domain: string | null;

	if (url.hostname === 'localhost') {
		domain = 'modernpromenader';
	} else if (url.hostname.endsWith(BASE_URL)) {
		domain = url.hostname.split('.')[0] || null;
	} else {
		domain = null;
	}

	if (domain === null) {
		error(404, 'Page not found');
	}

	const slug = url.pathname;

	const type =
		url.searchParams.get('param') ||
		(UAParser(request.headers.get('user-agent') || '').device.type === 'mobile'
			? 'mobile'
			: 'default');

	console.log(domain, slug, type);

	if (!slug) {
		error(404, 'Page not found');
	}

	// Fetch the document from Supabase based on domain and slug
	const { data: documents, error: docError } = await supabaseAnon
		.from('documents')
		.select(
			`
			id,
			content,
			tag,
			width,
			posts!inner(
				id,
				title,
				slug,
				meta_description,
				domains!inner(
					id,
					domain_name,
					title,
					description
				)
			)
		`
		)
		.eq('posts.domains.domain_name', domain)
		.eq('posts.slug', slug)
		.not('posts.slug', 'is', null); // Only published posts

	if (docError) {
		error(500, `Failed to fetch document: ${docError.message}`);
	}

	if (!documents || documents.length === 0) {
		error(404, 'Page not found');
	}

	// Find document matching the requested type/tag, or fall back to first document
	const document = documents.find((doc) => doc.tag === type) || documents[0];

	const post = document.posts;

	/**
	 * Checks if a string is a valid UUID (document ID)
	 */
	function isValidUUID(str: string): boolean {
		const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
		return uuidRegex.test(str);
	}

	// Server-side content fetcher function for windows
	async function fetchContent(urlOrId: string): Promise<string> {
		try {
			let fetchUrl: string;
			// If it's a UUID (document ID), convert to API endpoint
			if (isValidUUID(urlOrId)) {
				fetchUrl = `/api/content/window?id=${urlOrId}`;
			} else {
				// Otherwise treat as a regular URL
				fetchUrl = urlOrId;
			}

			const response = await fetch(fetchUrl);
			if (!response.ok) {
				throw new Error(`HTTP ${response.status}`);
			}
			return await response.text();
		} catch (error) {
			console.warn(`Failed to fetch content for ${urlOrId}:`, error);
			return '<div style="padding: 1rem; color: #cc0000; border: 1px solid #cc0000; border-radius: 4px; background-color: #fff5f5;">Content not available</div>';
		}
	}

	// Create JSDOM document for serialization
	const dom = new JSDOM();
	const domDocument = dom.window.document;

	// Get the ProseMirror document from the content field
	const doc = document.content as any; // Cast Json to ProseMirror Node type
	// Render the document to HTML using the new renderContent API
	const renderedHtml = await renderContent(doc, {
		document: domDocument as unknown as Document,
		renderWindows: true,
		getContent: fetchContent,
		getPath: (url: string) => `/api/redirect?id=${url}`,
		isAllowedUrl: (urlOrId: string) => isValidUUID(urlOrId) // Only allow document IDs
	});

	return {
		post: {
			title: post.title,
			description: post.meta_description,
			content: renderedHtml,
			width: document.width,
			slug
		}
	};
};
