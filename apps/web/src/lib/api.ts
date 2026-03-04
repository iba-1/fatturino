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
    if (response.status === 401) {
      window.location.href = "/login";
      return new Promise(() => {}); // Hang the promise — page is redirecting
    }

    const body = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status,
      body.error || body.message || `Request failed with status ${response.status}`,
      body.details
    );
  }

  return response.json();
}

async function downloadFile(path: string, filename: string): Promise<void> {
  const url = `${API_BASE}${path}`;
  const response = await fetch(url, { credentials: "include" });

  if (!response.ok) {
    if (response.status === 401) {
      window.location.href = "/login";
      return new Promise(() => {});
    }

    const body = await response.json().catch(() => ({}));
    throw new ApiError(response.status, body.error || "Download failed", body.details);
  }

  const blob = await response.blob();
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
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

  patch: <T>(path: string, data: unknown) =>
    request<T>(path, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: <T>(path: string) =>
    request<T>(path, { method: "DELETE" }),

  download: downloadFile,
};

export function parseApiFieldErrors(error: unknown): Record<string, string> {
  if (!(error instanceof ApiError) || !Array.isArray(error.details)) {
    return {};
  }
  const fieldErrors: Record<string, string> = {};
  for (const detail of error.details) {
    if (
      detail &&
      Array.isArray(detail.path) &&
      detail.path.length > 0 &&
      typeof detail.message === "string"
    ) {
      fieldErrors[detail.path[0]] = detail.message;
    }
  }
  return fieldErrors;
}

export { ApiError };
