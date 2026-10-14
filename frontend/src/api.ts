// Configuration
const API_TIMEOUT_MS = 10000;
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

/**
 * Custom error class for API errors with additional context.
 */
export class ApiError extends Error {
    constructor(
        message: string,
        public statusCode?: number,
        public originalError?: Error
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

/**
 * Delay utility for retry logic.
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface RequestConfig {
    headers?: Record<string, string>;
}

const baseURL = process.env.REACT_APP_API_URL || '';

/**
 * GET/POST transport preserving the response.data shape used by callers.
 */
const request = async <T>(
    method: 'GET' | 'POST',
    path: string,
    body?: unknown,
    config?: RequestConfig
): Promise<{ data: T }> => {
    const url = baseURL && !/^([a-z][a-z\d+.-]*:)?\/\//i.test(path)
        ? `${baseURL.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`
        : path;
    const headers = new Headers({ Accept: 'application/json, text/plain, */*' });
    // Axios omits Content-Type for requests without a body.
    if (body !== undefined) headers.set('Content-Type', 'application/json');
    Object.entries(config?.headers || {}).forEach(([key, value]) => headers.set(key, value));

    for (let attempt = 0; ; attempt++) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
        let status: number | undefined;
        let data: any;
        try {
            const response = await fetch(url, {
                method,
                headers,
                body: body === undefined ? undefined : JSON.stringify(body),
                signal: controller.signal,
            });
            const text = await response.text();
            // Like Axios, accept empty or non-JSON responses without a parse error.
            try { data = JSON.parse(text); } catch { data = text; }
            status = response.status;
            if (response.ok) return { data };
            throw new Error(`Request failed with status code ${status}`);
        } catch (error) {
            const retryable = status === undefined || (status >= 500 && status < 600);
            if (!retryable || attempt >= MAX_RETRIES) {
                throw new ApiError(getErrorMessage(status, data), status, error as Error);
            }
        } finally {
            clearTimeout(timeout);
        }
        await delay(RETRY_DELAY_MS * (attempt + 1));
    }
};

/**
 * Extracts a user-friendly error message from an API response.
 */
const getErrorMessage = (status?: number, data?: { detail?: string }): string => {
    if (status === undefined) {
        return 'Unable to connect to server. Please check your internet connection.';
    }

    // Use server-provided message if available
    if (data?.detail) {
        return data.detail;
    }

    // Default messages by status code
    switch (status) {
        case 400:
            return 'Invalid request. Please check your input.';
        case 401:
            return 'Authentication required.';
        case 403:
            return 'You do not have permission to perform this action.';
        case 404:
            return 'The requested resource was not found.';
        case 429:
            return 'Too many requests. Please wait a moment and try again.';
        case 500:
            return 'Server error. Please try again later.';
        default:
            return `An error occurred (${status}). Please try again.`;
    }
};

const api = {
    get: <T = any>(url: string, config?: RequestConfig): Promise<{ data: T }> =>
        request<T>('GET', url, undefined, config),
    post: <T = any>(url: string, data?: any, config?: RequestConfig): Promise<{ data: T }> =>
        request<T>('POST', url, data, config),
};

export default api;
