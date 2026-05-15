import type { AuthResponse, AuthUser, BoardBootstrap, BoardSummary } from "@canvasflow/shared";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit, token?: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  const data = (await response.json().catch(() => ({}))) as { error?: { message?: string } };

  if (!response.ok) {
    throw new ApiError(data.error?.message ?? "Request failed", response.status);
  }

  return data as T;
}

export const api = {
  register: (body: { email: string; password: string; displayName: string }) =>
    request<AuthResponse>("/auth/register", { method: "POST", body: JSON.stringify(body) }),
  login: (body: { email: string; password: string }) =>
    request<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify(body) }),
  guest: (body: { displayName: string }) =>
    request<AuthResponse>("/auth/guest", { method: "POST", body: JSON.stringify(body) }),
  me: (token: string) => request<{ user: AuthUser }>("/auth/me", undefined, token),
  boards: {
    list: (token: string) => request<{ boards: BoardSummary[] }>("/boards", undefined, token),
    create: (token: string, body: { title: string; visibility: "private" | "shared" }) =>
      request<{ board: BoardSummary }>("/boards", { method: "POST", body: JSON.stringify(body) }, token),
    join: (token: string, roomId: string) =>
      request<{ board: BoardSummary }>("/boards/join", { method: "POST", body: JSON.stringify({ roomId }) }, token),
    bootstrap: (token: string, boardId: string) => request<BoardBootstrap>(`/boards/${boardId}/bootstrap`, undefined, token),
    delete: (token: string, boardId: string) => request<void>(`/boards/${boardId}`, { method: "DELETE" }, token),
  },
};

export { API_URL };
