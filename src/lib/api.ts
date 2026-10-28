const TOKEN_KEY = "ibanga-auth-token";
const DEFAULT_API_URL =
  process.env.NODE_ENV === "production"
    ? "https://ibanga-be-1.onrender.com"
    : "http://localhost:3001";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly fieldErrors?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function readFieldErrors(payload: unknown): Record<string, string> | undefined {
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("fieldErrors" in payload)
  ) {
    return undefined;
  }
  const value = payload.fieldErrors;
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return undefined;
  }
  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string",
    ),
  );
}

export function saveAuthToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function readAuthToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function clearAuthToken() {
  localStorage.removeItem(TOKEN_KEY);
}

function apiBaseUrl() {
  return (process.env.NEXT_PUBLIC_API_URL?.trim() || DEFAULT_API_URL).replace(
    /\/+$/,
    "",
  );
}

/** Absolute URL for an API path such as a truck photo (`/trucks/:id/photos/0`). */
export function apiUrl(path: string) {
  return `${apiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const baseUrl = apiBaseUrl();

  const headers = new Headers(init.headers);
  if (init.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const token = readAuthToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(
      `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`,
      {
        ...init,
        headers,
      },
    );
  } catch {
    throw new Error(`Could not reach the iBanga API at ${baseUrl}.`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  const payload: unknown =
    response.status === 204
      ? null
      : contentType.includes("application/json")
        ? await response.json()
        : await response.text();

  if (!response.ok) {
    let message = `API request failed (${response.status}).`;
    let fieldErrors: Record<string, string> | undefined;
    if (typeof payload === "string" && payload.trim()) {
      message = payload;
    } else if (
      typeof payload === "object" &&
      payload !== null &&
      "message" in payload
    ) {
      const apiMessage = payload.message;
      fieldErrors = readFieldErrors(payload);
      message = Array.isArray(apiMessage)
        ? apiMessage
            .filter((item): item is string => typeof item === "string")
            .join(" ")
        : typeof apiMessage === "string"
          ? apiMessage
          : message;
    }
    throw new ApiError(message, response.status, fieldErrors);
  }

  return payload as T;
}
