/**
 * Utility functions for JSON operations
 */

/**
 * Safely parse a JSON string with a default value if parsing fails
 */
export function safeParseJSON<T>(str: string | null, defaultValue: T): T {
	if (!str) return defaultValue;
	try {
		return JSON.parse(str);
	} catch (error) {
		console.error('Error parsing JSON:', error);
		return defaultValue;
	}
}

/**
 * Safely stringify a value with a default string if stringification fails
 */
export function safeStringifyJSON(value: any, defaultValue: string = '{}'): string {
	if (!value) return defaultValue;
	try {
		return JSON.stringify(value);
	} catch (error) {
		console.error('Error stringifying JSON:', error);
		return defaultValue;
	}
}