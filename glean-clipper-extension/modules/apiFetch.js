// Unified API Fetch Helper
// Provides consistent fetch behavior with timeout, retry, and error handling for Glean APIs
// Reference: https://developers.glean.com/api-info/client/authentication/overview

/**
 * Performs a fetch request with timeout, retry logic, and proper error handling
 * @param {string} url - The full URL to fetch
 * @param {Object} options - Fetch options (method, headers, body, etc.)
 * @param {Object} config - Configuration object
 * @param {number} config.timeout - Request timeout in ms (default: 30000)
 * @param {number} config.maxRetries - Maximum retry attempts for 429/5xx (default: 3)
 * @param {boolean} config.isIdempotent - Whether request can be safely retried (default: true)
 * @returns {Promise<Response>} Fetch response
 */
async function fetchWithRetry(url, options = {}, config = {}) {
  const {
    timeout = 30000,
    maxRetries = 3,
    isIdempotent = true,
  } = config;

  let lastError;
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      // Perform fetch with timeout
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Check if we should retry on non-2xx responses
      if (!response.ok && attempt < maxRetries && isIdempotent) {
        const status = response.status;

        // Retry on rate limit (429) or server errors (5xx)
        if (status === 429 || (status >= 500 && status < 600)) {
          attempt++;
          const delay = Math.pow(2, attempt - 1) * 1000; // Exponential backoff: 1s, 2s, 4s
          console.log(`Retrying request (attempt ${attempt}/${maxRetries}) after ${delay}ms due to ${status}`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }

      return response;
    } catch (error) {
      lastError = error;

      // Don't retry on abort (timeout) or network errors unless retries remaining
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeout}ms`);
      }

      // Retry on network errors for idempotent requests
      if (attempt < maxRetries && isIdempotent) {
        attempt++;
        const delay = Math.pow(2, attempt - 1) * 1000;
        console.log(`Retrying request (attempt ${attempt}/${maxRetries}) after ${delay}ms due to network error`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      throw error;
    }
  }

  throw lastError || new Error('Request failed after all retries');
}

/**
 * Performs a JSON fetch request with automatic parsing and error handling
 * @param {string} url - The full URL to fetch
 * @param {Object} options - Fetch options
 * @param {Object} config - Configuration (timeout, maxRetries, isIdempotent)
 * @returns {Promise<Object>} Parsed JSON response
 */
async function fetchJSON(url, options = {}, config = {}) {
  const response = await fetchWithRetry(url, options, config);

  // Get response text first to handle empty responses
  const responseText = await response.text();

  if (!response.ok) {
    // Try to parse error response
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const errorData = responseText ? JSON.parse(responseText) : {};
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch (e) {
      // Use raw text if not JSON
      if (responseText) {
        errorMessage = responseText.substring(0, 200);
      }
    }

    const error = new Error(errorMessage);
    error.status = response.status;
    error.responseText = responseText;
    throw error;
  }

  // Parse JSON response (handle empty responses)
  if (!responseText || responseText.trim() === '') {
    return {};
  }

  try {
    return JSON.parse(responseText);
  } catch (e) {
    // If response is not JSON, return as text
    return { raw: responseText };
  }
}

/**
 * Creates headers for Glean Collections/Client API requests
 * Reference: https://developers.glean.com/api-info/client/authentication/glean-issued
 * 
 * For Glean-issued tokens (from admin console):
 * - User-scoped: Only Authorization header needed
 * - Global: Authorization + X-Glean-ActAs header
 * 
 * For OAuth tokens (from OAuth flow):
 * - Requires X-Glean-Auth-Type: OAUTH header
 * 
 * @param {string} token - Token (Glean-issued or OAuth)
 * @param {Object} additionalHeaders - Additional headers to include (e.g., X-Glean-ActAs for global tokens)
 * @param {boolean} isOAuthToken - Whether this is an OAuth token (default: false for Glean-issued tokens)
 * @returns {Object} Headers object
 */
function createCollectionsAPIHeaders(token, additionalHeaders = {}, isOAuthToken = false) {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Bearer ${token.trim()}`,
    ...additionalHeaders,
  };

  // Only add X-Glean-Auth-Type for OAuth tokens, NOT for Glean-issued tokens
  // Reference: https://developers.glean.com/api-info/client/authentication/glean-issued
  if (isOAuthToken) {
    headers['X-Glean-Auth-Type'] = 'OAUTH';
  }

  return headers;
}

/**
 * Creates headers for Glean Indexing API requests
 * @param {string} token - Indexing API token
 * @param {Object} additionalHeaders - Additional headers to include
 * @returns {Object} Headers object
 */
function createIndexingAPIHeaders(token, additionalHeaders = {}) {
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Bearer ${token.trim()}`,
    // Note: Indexing API does NOT require X-Glean-Auth-Type per docs
    ...additionalHeaders,
  };
}

/**
 * Normalizes Glean domain to backend API format
 * Converts various domain formats to the standard backend API domain
 * @param {string} domain - Input domain (e.g., "app.glean.com", "customer.glean.com")
 * @returns {string} Backend API domain (e.g., "customer-be.glean.com")
 */
function normalizeDomain(domain) {
  if (!domain) {
    throw new Error('Domain is required');
  }

  // Remove protocol and trailing slashes
  let cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');

  // If already in backend format, return as-is
  if (cleanDomain.includes('-be.glean.com')) {
    return `https://${cleanDomain}`;
  }

  // Handle app.glean.com -> linkedin-be.glean.com (special case)
  if (cleanDomain === 'app.glean.com' || cleanDomain.startsWith('app.')) {
    return 'https://linkedin-be.glean.com';
  }

  // Handle customer.glean.com -> customer-be.glean.com
  if (cleanDomain.endsWith('.glean.com') && !cleanDomain.includes('-be')) {
    const company = cleanDomain.replace('.glean.com', '');
    return `https://${company}-be.glean.com`;
  }

  // Handle bare company name
  if (!cleanDomain.includes('.')) {
    return `https://${cleanDomain}-be.glean.com`;
  }

  // Return as-is if we can't determine format
  return `https://${cleanDomain}`;
}

export {
  fetchWithRetry,
  fetchJSON,
  createCollectionsAPIHeaders,
  createIndexingAPIHeaders,
  normalizeDomain,
};

