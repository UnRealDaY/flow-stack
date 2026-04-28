// API request / response shapes shared between frontend and core-api

// ── Auth ─────────────────────────────────────────────────────────────────────
export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  accessToken: string;
}

// ── Workspaces ────────────────────────────────────────────────────────────────
export interface CreateWorkspaceRequest {
  name: string;
  slug: string;
}

export interface InviteMemberRequest {
  email: string;
  role: 'ADMIN' | 'MEMBER';
}

// ── Files ─────────────────────────────────────────────────────────────────────
export interface UploadResponse {
  fileId: string;
  taskId: string;
  status: 'pending';
}

// ── Pagination ────────────────────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    hasNextPage: boolean;
  };
}

// ── Error envelope ────────────────────────────────────────────────────────────
export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}
