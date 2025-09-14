import type { MMDesignPrimitives } from '@mindsmodern/design-primitives';

export function relativizeTheme(theme: MMDesignPrimitives): MMDesignPrimitives {
	function convertValue(value: any): any {
		if (typeof value === 'string') {
			// Convert px to em (assuming 16px = 1rem = 1em base)
			if (value.endsWith('px')) {
				const pxValue = parseFloat(value);
				return `${pxValue / 16}em`;
			}
			// Convert rem to em (1rem = 1em)
			if (value.endsWith('rem')) {
				const remValue = parseFloat(value);
				return `${remValue}em`;
			}
			// Return other string values unchanged
			return value;
		}
		
		if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
			// Recursively process object properties
			const result: any = {};
			for (const [key, val] of Object.entries(value)) {
				result[key] = convertValue(val);
			}
			return result;
		}
		
		// Return primitives and arrays unchanged
		return value;
	}

	return convertValue(theme);
}
