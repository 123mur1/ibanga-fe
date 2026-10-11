const TOKEN_KEY = "ibanga-auth-token";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
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

export async function api<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, "");
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured for the frontend.");
  }

  const headers = new Headers(init.headers);
  if (init.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const token = readAuthToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path.startsWith("/") ? path : `/${path}`}`, {
      ...init,
      headers,
    });
  } catch {
    throw new Error(`Could not reach the iBanga API at ${baseUrl}.`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  const payload: unknown = response.status === 204
    ? null
    : contentType.includes("application/json")
      ? await response.json()
      : await response.text();

  if (!response.ok) {
    let message = `API request failed (${response.status}).`;
    if (typeof payload === "string" && payload.trim()) {
      message = payload;
    } else if (typeof payload === "object" && payload !== null && "message" in payload) {
      const apiMessage = payload.message;
      message = Array.isArray(apiMessage)
        ? apiMessage.filter((item): item is string => typeof item === "string").join(" ")
        : typeof apiMessage === "string" ? apiMessage : message;
    }
    throw new ApiError(message, response.status);
  }

  return payload as T;
}
