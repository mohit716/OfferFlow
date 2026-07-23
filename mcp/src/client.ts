import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// Load mcp/.env regardless of the process working directory, since the MCP
// host (e.g. Cursor) may launch this server from anywhere.
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env') });

const API_URL = process.env.OFFERFLOW_API_URL || 'http://localhost:5000/api';

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

/**
 * Authenticated request to the OfferFlow API.
 * Returns parsed JSON, or null for 204 responses.
 */
export async function apiRequest<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getToken();

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

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
