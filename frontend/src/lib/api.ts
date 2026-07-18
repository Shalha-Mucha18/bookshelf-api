import type {
  Book,
  BookCreate,
  BookDetails,
  LoginResponse,
  Review,
  Tag,
  UserWithBooks,
} from "./types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1.0.0";

const ACCESS_KEY = "bookly_access_token";
const REFRESH_KEY = "bookly_refresh_token";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function storeTokens(access: string, refresh?: string) {
  localStorage.setItem(ACCESS_KEY, access);
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function parseError(res: Response): Promise<ApiError> {
  let message = `Request failed (${res.status})`;
  let code: string | undefined;
  try {
    const body = await res.json();
    message = body.message ?? body.detail ?? message;
    code = body.error_code;
    if (typeof message !== "string") message = JSON.stringify(message);
  } catch {
    // non-JSON body; keep default message
  }
  return new ApiError(res.status, message, code);
}

async function tryRefresh(): Promise<boolean> {
  const refresh = getRefreshToken();
  if (!refresh) return false;
  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    headers: { Authorization: `Bearer ${refresh}` },
  });
  if (!res.ok) return false;
  const body = await res.json();
  if (!body.access_token) return false;
  storeTokens(body.access_token);
  return true;
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  auth?: boolean;
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, auth = true } = opts;

  const doFetch = () => {
    const headers: Record<string, string> = {};
    if (body !== undefined) headers["Content-Type"] = "application/json";
    const token = getAccessToken();
    if (auth && token) headers["Authorization"] = `Bearer ${token}`;
    return fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  };

  let res = await doFetch();

  if (res.status === 401 && auth && getRefreshToken()) {
    const refreshed = await tryRefresh();
    if (refreshed) res = await doFetch();
  }

  if (!res.ok) throw await parseError(res);
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

// ---------- Auth ----------

export const api = {
  signUp(data: {
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    password: string;
  }) {
    return request<{ message: string }>("/auth/sign-up", {
      method: "POST",
      body: data,
      auth: false,
    });
  },

  login(email: string, password: string) {
    return request<LoginResponse>("/auth/login", {
      method: "POST",
      body: { email, password },
      auth: false,
    });
  },

  logout() {
    return request<{ message: string }>("/auth/logout", { method: "POST" });
  },

  me() {
    return request<UserWithBooks>("/auth/me");
  },

  verifyEmail(token: string) {
    return request<{ message: string }>(`/auth/verify/${token}`, {
      auth: false,
    });
  },

  requestPasswordReset(email: string) {
    return request<{ message: string }>("/auth/password-reset-request", {
      method: "POST",
      body: { email },
      auth: false,
    });
  },

  confirmPasswordReset(
    token: string,
    new_password: string,
    confirm_new_password: string,
  ) {
    return request<{ message: string }>(
      `/auth/password-reset-confirm/${token}`,
      {
        method: "POST",
        body: { new_password, confirm_new_password },
        auth: false,
      },
    );
  },

  // ---------- Books ----------

  listBooks() {
    return request<BookDetails[]>("/books/");
  },

  getBook(uid: string) {
    return request<BookDetails>(`/books/${uid}`);
  },

  createBook(data: BookCreate) {
    return request<Book>("/books/", { method: "POST", body: data });
  },

  updateBook(uid: string, data: Partial<BookCreate>) {
    return request<Book>(`/books/${uid}`, { method: "PATCH", body: data });
  },

  deleteBook(uid: string) {
    return request<void>(`/books/${uid}`, { method: "DELETE" });
  },

  // ---------- Reviews ----------

  addReview(bookUid: string, rating: number, review_text: string) {
    return request<Review>(`/reviews/book/${bookUid}`, {
      method: "POST",
      body: { rating, review_text },
    });
  },

  deleteReview(reviewUid: string) {
    return request<void>(`/reviews/${reviewUid}`, { method: "DELETE" });
  },

  // ---------- Tags ----------

  listTags() {
    return request<Tag[]>("/tags/");
  },

  createTag(name: string) {
    return request<Tag>("/tags/", { method: "POST", body: { name } });
  },

  addTagToBook(tagUid: string, bookUid: string) {
    return request<Book>(`/tags/${tagUid}/books/${bookUid}`, {
      method: "POST",
    });
  },

  deleteTag(tagUid: string) {
    return request<Tag>(`/tags/${tagUid}`, { method: "DELETE" });
  },
};
