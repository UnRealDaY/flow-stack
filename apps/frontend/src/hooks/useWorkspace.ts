import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export type Workspace = {
  id: string;
  name: string;
  slug: string;
  plan: string;
  createdAt: string;
};

export type WorkspaceMember = {
  userId: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  user: { id: string; name: string; email: string };
};

export const WS_KEY = 'workspaces';

export function useWorkspaces() {
  return useQuery<Workspace[]>({
    queryKey: [WS_KEY],
    queryFn: () => api.get('/workspaces').then((r) => r.data.data),
  });
}

export function useWorkspace(id: string) {
  return useQuery<Workspace>({
    queryKey: [WS_KEY, id],
    queryFn: () => api.get(`/workspaces/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useMembers(workspaceId: string) {
  return useQuery<WorkspaceMember[]>({
    queryKey: [WS_KEY, workspaceId, 'members'],
    queryFn: () => api.get(`/workspaces/${workspaceId}/members`).then((r) => r.data.data),
    enabled: !!workspaceId,
  });
}

export function useInviteMember(workspaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (email: string) =>
      api.post(`/workspaces/${workspaceId}/invites`, { email }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [WS_KEY, workspaceId, 'members'] });
    },
  });
}

export function useRemoveMember(workspaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      api.delete(`/workspaces/${workspaceId}/members/${userId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [WS_KEY, workspaceId, 'members'] });
    },
  });
}
