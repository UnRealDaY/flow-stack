// Shared domain types — consumed by core-api, realtime, and frontend

export type WorkspaceRole = 'OWNER' | 'ADMIN' | 'MEMBER';
export type PlanName = 'FREE' | 'PRO' | 'ENTERPRISE';
export type FileStatus = 'pending' | 'processing' | 'done' | 'failed';
export type SubscriptionStatus = 'trialing' | 'active' | 'canceled' | 'past_due';

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  plan: PlanName;
  createdAt: string;
}

export interface WorkspaceMember {
  userId: string;
  workspaceId: string;
  role: WorkspaceRole;
  user: Pick<User, 'id' | 'email' | 'name'>;
}

// ── WebSocket events ──────────────────────────────────────────────────────────

export interface PresenceEvent {
  userId: string;
}

export interface FileProcessedEvent {
  fileId: string;
  status: FileStatus;
  key?: string;
}

export interface PaymentUpdatedEvent {
  status: SubscriptionStatus;
  plan?: PlanName;
}
