/**
 * Shared utilities for theme object processing and conversion
 */

/**
 * Deep merge function for theme objects
 */
export function deepMerge(target: any, source: any): any {
	if (source === null || source === undefined) return target;
	if (typeof source !== 'object') return source;

	const result = { ...target };

	for (const key in source) {
		if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
			result[key] = deepMerge(target[key] || {}, source[key]);
		} else {
			result[key] = source[key];
		}
	}

	return result;
}

/**
 * Convert theme object to CSS custom properties
 */
export function generateCSSVariables(obj: any, prefix = ''): Record<string, string> {
	const vars: Record<string, string> = {};

	for (const [key, value] of Object.entries(obj)) {
		const cssKey = prefix ? `${prefix}-${key}` : key;

		if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
			// Recursively process nested objects
			Object.assign(vars, generateCSSVariables(value, cssKey));
		} else {
			// Convert to CSS custom property
			vars[`--${cssKey}`] = String(value);
		}
	}

	return vars;
}

/**
 * Convert theme object to SCSS variable mappings
 */
export function generateScssVariables(obj: any, prefix = ''): string {
	let scss = '';

	for (const [key, value] of Object.entries(obj)) {
		const variableName = prefix ? `${prefix}-${key}` : key;

		if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
			// Recursively process nested objects
			scss += generateScssVariables(value, variableName);
		} else {
			// Generate SCSS variable mapping to CSS custom property
			scss += `$${variableName}: var(--${variableName});\n`;
		}
	}

	return scss;
}
