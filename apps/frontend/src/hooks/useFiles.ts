import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { connectSocket, disconnectSocket } from '@/lib/socket';

export type FileRecord = {
  id: string;
  filename: string;
  status: 'pending' | 'processing' | 'done' | 'failed';
  url?: string;
  createdAt: string;
};

const BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace('4000', '5000') ?? 'http://localhost:5000';

export const FILES_KEY = 'files';

export function useFiles(workspaceId: string) {
  return useQuery<FileRecord[]>({
    queryKey: [FILES_KEY, workspaceId],
    queryFn: () =>
      api.get(`${BASE_URL}/upload/image`, { baseURL: '' })
        .then((r) => r.data.data ?? []),
    enabled: !!workspaceId,
  });
}

export function useFileSocket(workspaceId: string) {
  const qc      = useQueryClient();
  const joined  = useRef(false);

  useEffect(() => {
    if (!workspaceId || joined.current) return;
    joined.current = true;

    const socket = connectSocket(workspaceId);

    socket.on('file:updated', (payload: FileRecord) => {
      qc.setQueryData<FileRecord[]>([FILES_KEY, workspaceId], (prev = []) =>
        prev.map((f) => (f.id === payload.id ? { ...f, ...payload } : f)),
      );
    });

    return () => {
      socket.off('file:updated');
      disconnectSocket();
      joined.current = false;
    };
  }, [workspaceId, qc]);
}

export function useUploadFile(workspaceId: string) {
  const qc = useQueryClient();

  return useCallback(async (file: File) => {
    const idempotencyKey = `${workspaceId}-${file.name}-${file.size}-${Date.now()}`;
    const form = new FormData();
    form.append('file', file);

    const { data } = await api.post<FileRecord>(
      `${BASE_URL}/upload/image`,
      form,
      {
        baseURL: '',
        headers: {
          'X-Idempotency-Key': idempotencyKey,
          'Content-Type': 'multipart/form-data',
        },
      },
    );

    // Optimistically add the pending record
    qc.setQueryData<FileRecord[]>([FILES_KEY, workspaceId], (prev = []) => [data, ...prev]);

    return data;
  }, [workspaceId, qc]);
}
