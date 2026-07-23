import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// Load mcp/.env regardless of the process working directory, since the MCP
// host (e.g. Cursor) may launch this server from anywhere.
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env') });

const API_URL = process.env.OFFERFLOW_API_URL || 'http://localhost:5000/api';

// A statically-provided token can't be refreshed by us; a token obtained via
// login can be re-fetched when it expires.
const staticToken = !!process.env.OFFERFLOW_TOKEN;
let cachedToken: string | null = process.env.OFFERFLOW_TOKEN || null;

/**
 * Resolve a JWT for the OfferFlow API.
 * Priority:
 *   1. OFFERFLOW_TOKEN (used as-is)
 *   2. OFFERFLOW_EMAIL + OFFERFLOW_PASSWORD (logs in once, then caches)
 */
async function getToken(): Promise<string> {
  if (cachedToken) return cachedToken;

  const email = process.env.OFFERFLOW_EMAIL;
  const password = process.env.OFFERFLOW_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'No credentials configured. Set OFFERFLOW_TOKEN, or OFFERFLOW_EMAIL and OFFERFLOW_PASSWORD.'
    );
  }

  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = (await res.json()) as { token?: string; error?: string };

  if (!res.ok || !data.token) {
    throw new Error(`Login failed: ${data.error || res.statusText}`);
  }

  cachedToken = data.token;
  return cachedToken;
}

async function doFetch(endpoint: string, options: RequestInit, token: string) {
  return fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
}

/**
 * Authenticated request to the OfferFlow API.
 * Returns parsed JSON, or undefined for 204 responses.
 *
 * Access tokens are short-lived, so on a 401 we re-authenticate once (unless
 * a static OFFERFLOW_TOKEN was provided, which we cannot refresh).
 */
export async function apiRequest<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  let token = await getToken();
  let res = await doFetch(endpoint, options, token);

  if (res.status === 401 && !staticToken) {
    // Token likely expired — drop it, log in again, and retry once.
    cachedToken = null;
    token = await getToken();
    res = await doFetch(endpoint, options, token);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message =
      (data as { error?: string }).error || `Request failed (${res.status})`;
    throw new Error(message);
  }

  return data as T;
}

export { API_URL };
