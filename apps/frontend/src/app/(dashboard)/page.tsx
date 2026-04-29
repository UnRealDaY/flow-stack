'use client';

import React from 'react';
import {
  Box, Card, CardContent, Grid, Skeleton, Stack, Typography,
} from '@mui/material';
import GroupIcon      from '@mui/icons-material/Group';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import PaymentIcon    from '@mui/icons-material/Payment';
import { useWorkspaces } from '@/hooks/useWorkspace';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function StatCard({ label, value, icon, loading }: {
  label: string; value: string | number; icon: React.ReactNode; loading?: boolean;
}) {
  return (
    <Card>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Box sx={{ color: 'primary.main' }}>{icon}</Box>
          <Box>
            <Typography variant="body2" color="text.secondary">{label}</Typography>
            {loading
              ? <Skeleton width={60} height={32} />
              : <Typography variant="h5">{value}</Typography>}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function WorkspaceInfo() {
  const { data: workspaces, isLoading } = useWorkspaces();
  const ws = workspaces?.[0];

  return (
    <>
      <Box sx={{ mb: 3 }}>
        {isLoading
          ? <Skeleton width={200} height={36} />
          : <Typography variant="h4">{ws?.name ?? 'My Workspace'}</Typography>}
        <Typography variant="body2" color="text.secondary">
          Plan: {isLoading ? '—' : ws?.plan ?? 'FREE'}
        </Typography>
      </Box>

      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <StatCard label="Members"   value="—" icon={<GroupIcon />}           loading={isLoading} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard label="Files"     value="—" icon={<InsertDriveFileIcon />} loading={isLoading} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard label="Subscription" value={ws?.plan ?? '—'} icon={<PaymentIcon />} loading={isLoading} />
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Recent activity</Typography>
          {isLoading
            ? <Stack spacing={1}>{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={24} />)}</Stack>
            : <Typography variant="body2" color="text.secondary">No recent events.</Typography>}
        </CardContent>
      </Card>
    </>
  );
}

export default function OverviewPage() {
  return (
    <ErrorBoundary>
      <WorkspaceInfo />
    </ErrorBoundary>
  );
}
