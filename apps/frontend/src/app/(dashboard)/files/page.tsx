'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box, Card, CardContent, Chip, LinearProgress,
  List, ListItem, ListItemText, Skeleton, Stack, Typography,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon       from '@mui/icons-material/Error';
import HourglassIcon   from '@mui/icons-material/HourglassEmpty';
import toast from 'react-hot-toast';
import { useWorkspaces } from '@/hooks/useWorkspace';
import { useFiles, useFileSocket, useUploadFile, FileRecord } from '@/hooks/useFiles';
import { extractMessage } from '@/lib/api';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

// ── Status chip ────────────────────────────────────────────────────────────

const STATUS_ICON: Record<FileRecord['status'], React.ReactNode> = {
  pending:    <HourglassIcon   fontSize="small" />,
  processing: <HourglassIcon   fontSize="small" />,
  done:       <CheckCircleIcon fontSize="small" />,
  failed:     <ErrorIcon       fontSize="small" />,
};
const STATUS_COLOR: Record<FileRecord['status'], 'default' | 'warning' | 'success' | 'error'> = {
  pending:    'warning',
  processing: 'warning',
  done:       'success',
  failed:     'error',
};

function FileRow({ file }: { file: FileRecord }) {
  const inProgress = file.status === 'pending' || file.status === 'processing';

  return (
    <ListItem divider>
      <ListItemText
        primary={file.filename}
        secondary={
          <>
            {dayjs(file.createdAt).fromNow()}
            {inProgress && <LinearProgress sx={{ mt: 0.5, borderRadius: 1 }} />}
          </>
        }
      />
      <Chip
        icon={STATUS_ICON[file.status] as React.ReactElement}
        label={file.status}
        color={STATUS_COLOR[file.status]}
        size="small"
        sx={{ ml: 2 }}
      />
    </ListItem>
  );
}

// ── Drop zone ──────────────────────────────────────────────────────────────

function DropZone({ onDrop }: { onDrop: (files: File[]) => void }) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: true,
  });

  return (
    <Box
      {...getRootProps()}
      sx={{
        border: '2px dashed',
        borderColor: isDragActive ? 'primary.main' : 'divider',
        borderRadius: 2,
        p: 4,
        textAlign: 'center',
        cursor: 'pointer',
        bgcolor: isDragActive ? 'primary.50' : 'background.default',
        transition: 'all 0.2s',
        '&:hover': { borderColor: 'primary.main' },
      }}
    >
      <input {...getInputProps()} />
      <UploadFileIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
      <Typography variant="body1" color="text.secondary">
        {isDragActive ? 'Drop images here…' : 'Drag & drop images, or click to select'}
      </Typography>
      <Typography variant="caption" color="text.disabled">
        PNG, JPG, WebP up to 10 MB
      </Typography>
    </Box>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

function FilesContent() {
  const { data: workspaces } = useWorkspaces();
  const ws = workspaces?.[0];

  const { data: files, isLoading } = useFiles(ws?.id ?? '');
  useFileSocket(ws?.id ?? '');
  const uploadFile = useUploadFile(ws?.id ?? '');

  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(async (accepted: File[]) => {
    if (!accepted.length) return;
    setUploading(true);
    try {
      await Promise.all(accepted.map((f) => uploadFile(f)));
      toast.success(`${accepted.length} file(s) queued for processing.`);
    } catch (err) {
      toast.error(extractMessage(err));
    } finally {
      setUploading(false);
    }
  }, [uploadFile]);

  return (
    <>
      <Typography variant="h4" sx={{ mb: 3 }}>Files</Typography>

      <Stack spacing={3}>
        <DropZone onDrop={onDrop} />

        {uploading && <LinearProgress />}

        <Card>
          <CardContent sx={{ p: 0 }}>
            {isLoading ? (
              <Stack spacing={1} sx={{ p: 2 }}>
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} height={52} variant="rectangular" sx={{ borderRadius: 1 }} />
                ))}
              </Stack>
            ) : !files?.length ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography color="text.secondary">No files uploaded yet.</Typography>
              </Box>
            ) : (
              <List disablePadding>
                {files.map((f) => <FileRow key={f.id} file={f} />)}
              </List>
            )}
          </CardContent>
        </Card>
      </Stack>
    </>
  );
}

export default function FilesPage() {
  return <ErrorBoundary><FilesContent /></ErrorBoundary>;
}
