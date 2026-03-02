import { Logger } from '@nestjs/common';

const logger = new Logger('MarketplaceAPI');

export interface FetchRetryOptions extends RequestInit {
    retries?: number;
    timeout?: number;
    marketplace?: string;
    storeId?: string;
}

/**
 * Masks a token for safe logging.
 * Keeps first 3 and last 3 chars.
 */
export function maskToken(token: string): string {
    if (!token) return '';
    if (token.length <= 6) return '***';
    return `${token.substring(0, 3)}***${token.substring(token.length - 3)}`;
}

/**
 * Perform a fetch request with timeout and retry logic.
 * Retries on 500, 502, 503 and network timeouts/abort errors.
 * Does NOT retry on 401, 403, 404.
 */
export async function fetchWithRetry(url: string, options: FetchRetryOptions = {}): Promise<Response> {
    const { retries = 2, timeout = 8000, marketplace = 'unknown', storeId = 'unknown', ...fetchOptions } = options;

    let attempt = 0;
    while (attempt <= retries) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        const config = { ...fetchOptions, signal: controller.signal };

        try {
            const response = await fetch(url, config);
            clearTimeout(timeoutId);

            // Retry on 5xx
            if (response.status >= 500 && attempt < retries) {
                logger.warn(`${marketplace} API (storeId=${storeId}) returned ${response.status}. Retrying (${attempt + 1}/${retries})...`);
                attempt++;
                await new Promise(r => setTimeout(r, 1000 * attempt)); // exponential backoff wait
                continue;
            }

            return response;
        } catch (error: any) {
            clearTimeout(timeoutId);

            const isTimeout = error.name === 'AbortError' || error.message?.includes('timeout');
            if ((isTimeout || error.message?.includes('fetch')) && attempt < retries) {
                logger.warn(`${marketplace} API (storeId=${storeId}) failed (${isTimeout ? 'timeout' : error.message}). Retrying (${attempt + 1}/${retries})...`);
                attempt++;
                await new Promise(r => setTimeout(r, 1000 * attempt));
                continue;
            }

            // Exhausted retries or non-retriable error
            throw error;
        }
    }
    throw new Error('Unreachable code');
}
