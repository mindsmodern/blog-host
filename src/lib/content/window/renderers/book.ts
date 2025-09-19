import { NAVER_CLIENT_ID, NAVER_CLIENT_SECRET } from '$env/static/private';
import { XMLParser } from 'fast-xml-parser';
import type { WindowRenderer } from '../types';
import { createMediaSchemaConfig } from '$lib/content/media';
import { renderContent, type WindowSchemaConfig } from '@mindsmodern/grid-editor';
import { JSDOM } from 'jsdom';

export const bookWindowRenderer: WindowRenderer = async (documentId) => {
	const isbn = documentId;

	if (!isbn) {
		return {
			html: `<div style="padding: 1.5em; color: red; border: 0.03125em solid red; border-radius: 0.5em;">
				Error: ISBN parameter is required
			</div>`,
			headers: {
				'Content-Type': 'text/html'
			}
		};
	}

	if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
		return {
			html: `<div style="padding: 1.5em; color: red; border: 0.03125em solid red; border-radius: 0.5em;">
				Error: Naver API credentials not configured
			</div>`,
			headers: {
				'Content-Type': 'text/html'
			}
		};
	}

	try {
		// Use Naver Book Advanced Search API with ISBN
		const searchUrl = `https://openapi.naver.com/v1/search/book_adv.xml?d_isbn=${encodeURIComponent(isbn)}`;

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

		const bookDetail = {
			title: bookItem.title || `도서 정보 (ISBN: ${isbn})`,
			author: bookItem.author || '저자 정보 없음',
			publisher: bookItem.publisher || '출판사 정보 없음',
			pubdate: bookItem.pubdate || '출간일 정보 없음',
			isbn: isbn,
			price: bookItem.price || '0',
			discount: bookItem.discount || '0',
			image: bookItem.image || 'https://via.placeholder.com/200x250/cccccc/666666?text=No+Image',
			description: bookItem.description || '도서 설명이 없습니다.',
			link: bookItem.link || 'https://book.naver.com'
		};

		// Generate only the content div with inline styles using design tokens
		const doc = {
			type: 'doc',
			content: [
				{
					type: 'container',
					content: [
						{
							type: 'cell',
							attrs: {
								color: 'foreground',
								width: 'thicker',
								height: null,
								padding: 'normal',
								background: 'background'
							},
							content: [
								{
									type: 'mediablock',
									content: [
										{
											type: 'image',
											attrs: {
												id: bookDetail.image,
												left: 0,
												title: bookDetail.title,
												width: null
											}
										}
									]
								}
							]
						},
						{
							type: 'cell',
							attrs: {
								color: 'background',
								width: 'thicker',
								background: 'background',
								padding: 'normal',
								height: null
							},
							content: [
								{
									type: 'textblock',
									content: [
										{
											type: 'paragraph',
											attrs: { align: 'left', size: 'medium' },
											content: [
												{ type: 'text', marks: [{ type: 'strong' }], text: bookDetail.title }
											]
										},
										{
											type: 'paragraph',
											attrs: {
												size: 'medium',
												align: 'left'
											}
										},
										{
											type: 'paragraph',
											attrs: { align: 'left', size: 'medium' },
											content: [{ type: 'text', text: bookDetail.author }]
										}
									]
								}
							]
						}
					]
				}
			]
		};

		const dom = new JSDOM();
		const domDocument = dom.window.document as unknown as Document;

		const windowConfig: WindowSchemaConfig = {
			document: domDocument,
			renderWindows: false,
			isAllowedUrl: (url: string) => url.startsWith('/') || url.startsWith('http')
		};

		// Use renderContent to serialize to HTML
		const html = await renderContent(doc, {
			window: windowConfig,
			media: createMediaSchemaConfig()
		});

		return {
			html,
			headers: {
				'Content-Type': 'text/html; charset=utf-8',
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Methods': 'GET',
				'Access-Control-Allow-Headers': 'Content-Type'
			}
		};
	} catch (error) {
		console.error('Book detail fetch failed:', error);
		return {
			html: `<div style="padding: 1.5em; color: red; border: 0.03125em solid red; border-radius: 0.5em;">
				Failed to load book details: ${error}
			</div>`,
			headers: {
				'Content-Type': 'text/html'
			}
		};
	}
};
