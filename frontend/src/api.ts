import axios, { AxiosError, AxiosInstance, AxiosResponse } from 'axios';

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

/**
 * Determines if an error should trigger a retry.
 */
const shouldRetry = (error: AxiosError): boolean => {
    // Retry on network errors or 5xx server errors
    if (!error.response) return true; // Network error
    const status = error.response.status;
    return status >= 500 && status < 600;
};

/**
 * Creates the API client with interceptors for error handling.
 */
const createApiClient = (): AxiosInstance => {
    const client = axios.create({
        baseURL: process.env.REACT_APP_API_URL || '',
        timeout: API_TIMEOUT_MS,
        headers: {
            'Content-Type': 'application/json',
        },
    });

    // Request interceptor - add common headers
    client.interceptors.request.use(
        (config) => {
            // Could add auth headers, request logging, etc.
            return config;
        },
        (error) => {
            return Promise.reject(error);
        }
    );

    // Response interceptor - handle errors consistently
    client.interceptors.response.use(
        (response: AxiosResponse) => {
            return response;
        },
        async (error: AxiosError) => {
            const config = error.config;

            // Initialize retry count
            const retryCount = (config as any)?._retryCount || 0;

            // Check if we should retry
            if (config && shouldRetry(error) && retryCount < MAX_RETRIES) {
                (config as any)._retryCount = retryCount + 1;

                // Wait before retrying
                await delay(RETRY_DELAY_MS * (retryCount + 1));

                // Retry the request
                return client(config);
            }

            // Transform error into ApiError
            const message = getErrorMessage(error);
            const statusCode = error.response?.status;
            throw new ApiError(message, statusCode, error);
        }
    );

    return client;
};

/**
 * Extracts a user-friendly error message from an Axios error.
 */
const getErrorMessage = (error: AxiosError): string => {
    if (!error.response) {
        // Network error
        return 'Unable to connect to server. Please check your internet connection.';
    }

    const status = error.response.status;
    const data = error.response.data as { detail?: string };

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

// Create and export the singleton API client
const api = createApiClient();

export default api;
