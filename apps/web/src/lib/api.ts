const API_BASE = "/api";

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${path}`;

  const headers: Record<string, string> = {
    ...options.headers as Record<string, string>,
  };

  // Only set Content-Type for requests with a body
  if (options.body) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url, {
    ...options,
    credentials: "include",
    headers,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status,
      body.error || body.message || `Request failed with status ${response.status}`,
      body.details
    );
  }

  return response.json();
}

export const api = {
  get: <T>(path: string) => request<T>(path),

  post: <T>(path: string, data: unknown) =>
    request<T>(path, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  put: <T>(path: string, data: unknown) =>
    request<T>(path, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: <T>(path: string) =>
    request<T>(path, { method: "DELETE" }),
};

export { ApiError };
