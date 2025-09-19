import { NAVER_CLIENT_ID, NAVER_CLIENT_SECRET } from '$env/static/private';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const query = url.searchParams.get('query');
	const display = url.searchParams.get('display') || '10';
	const start = url.searchParams.get('start') || '1';
	const sort = url.searchParams.get('sort') || 'sim';
	
	if (!query) {
		return new Response(JSON.stringify({ error: 'Query parameter is required' }), {
			status: 400,
			headers: {
				'Content-Type': 'application/json'
			}
		});
	}

	if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
		return new Response(JSON.stringify({ error: 'Naver API credentials not configured' }), {
			status: 500,
			headers: {
				'Content-Type': 'application/json'
			}
		});
	}

	try {
		const searchUrl = `https://openapi.naver.com/v1/search/book.json?query=${encodeURIComponent(query)}&display=${display}&start=${start}&sort=${sort}`;
		
		const response = await fetch(searchUrl, {
			headers: {
				'X-Naver-Client-Id': NAVER_CLIENT_ID,
				'X-Naver-Client-Secret': NAVER_CLIENT_SECRET
			}
		});

		if (!response.ok) {
			throw new Error(`Naver API request failed: ${response.status}`);
		}

		const data = await response.json();
		
		return new Response(JSON.stringify(data), {
			headers: {
				'Content-Type': 'application/json',
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Methods': 'GET',
				'Access-Control-Allow-Headers': 'Content-Type'
			}
		});
	} catch (error) {
		console.error('Book search failed:', error);
		return new Response(JSON.stringify({ 
			error: 'Search failed',
			details: error instanceof Error ? error.message : 'Unknown error'
		}), {
			status: 500,
			headers: {
				'Content-Type': 'application/json'
			}
		});
	}
};