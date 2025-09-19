import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getDocumentSlugAndTag } from '$lib/server/supabase';
import { NAVER_CLIENT_ID, NAVER_CLIENT_SECRET } from '$env/static/private';
import { XMLParser } from 'fast-xml-parser';

export const load: PageServerLoad = async ({ url }) => {
	if (url.searchParams.has('id')) {
		const idParam = url.searchParams.get('id')!;

		// Extract type from id (e.g., "book:123" -> type="book", id="123")
		const [type, actualId] = idParam.includes(':') ? idParam.split(':', 2) : [null, idParam];

		// Handle different redirect types
		switch (type) {
			case 'book': {
				const searchUrl = `https://openapi.naver.com/v1/search/book_adv.xml?d_isbn=${encodeURIComponent(actualId)}`;

				const response = await fetch(searchUrl, {
					headers: {
						'X-Naver-Client-Id': NAVER_CLIENT_ID,
						'X-Naver-Client-Secret': NAVER_CLIENT_SECRET
					}
				});

				if (!response.ok) {
					throw new Error(`Naver API request failed: ${response.status}`);
				}

				const xmlData = await response.text();

				// Initialize XML parser with proper options
				const parser = new XMLParser({
					ignoreAttributes: false,
					parseAttributeValue: false,
					trimValues: true
				});

				const parsedData = parser.parse(xmlData);

				// Navigate through the RSS structure to get book items
				const items = parsedData?.rss?.channel?.item;
				const bookItem = Array.isArray(items) ? items[0] : items;

				if (!bookItem) {
					return {
						html: `<div style="padding: 1.5em; color: red; border: 0.03125em solid red; border-radius: 0.5em;">
								Book not found
							</div>`,
						headers: {
							'Content-Type': 'text/html'
						}
					};
				}
				// For books, redirect to external book store or custom book page
				throw redirect(308, bookItem.link);
			}

			case 'content':
			case null:
			default: {
				// Default behavior for document content
				const { slug } = await getDocumentSlugAndTag(actualId);
				if (slug === null) {
					throw error(404);
				} else {
					throw redirect(308, slug);
				}
			}
		}
	}
};
