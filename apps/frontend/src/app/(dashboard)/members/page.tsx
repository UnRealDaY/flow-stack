'use client';

import React, { useState } from 'react';
import {
  Avatar, Box, Button, Card, CardContent, Chip, Dialog,
  DialogActions, DialogContent, DialogTitle, IconButton,
  List, ListItem, ListItemAvatar, ListItemText,
  Skeleton, Stack, TextField, Typography,
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import DeleteIcon    from '@mui/icons-material/Delete';
import toast         from 'react-hot-toast';
import { useWorkspaces, useMembers, useInviteMember, useRemoveMember, WorkspaceMember } from '@/hooks/useWorkspace';
import { extractMessage } from '@/lib/api';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useAuth } from '@/lib/auth';

// ── Invite dialog ──────────────────────────────────────────────────────────

function InviteDialog({ workspaceId, open, onClose }: { workspaceId: string; open: boolean; onClose: () => void }) {
  const [email, setEmail] = useState('');
  const invite = useInviteMember(workspaceId);

  const submit = async () => {
    if (!email.trim()) return;
    try {
      await invite.mutateAsync(email.trim());
      toast.success(`Invite sent to ${email}`);
      setEmail('');
      onClose();
    } catch (err) {
      toast.error(extractMessage(err));
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Invite member</DialogTitle>
      <DialogContent>
        <TextField
          label="Email address"
          type="email"
          fullWidth
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          sx={{ mt: 1 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={submit} loading={invite.isPending}>Send invite</Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Member row ─────────────────────────────────────────────────────────────

function MemberRow({ member, workspaceId, canRemove }: { member: WorkspaceMember; workspaceId: string; canRemove: boolean }) {
  const remove = useRemoveMember(workspaceId);
  const { user: me } = useAuth();

  const handleRemove = async () => {
    try {
      await remove.mutateAsync(member.userId);
      toast.success('Member removed.');
    } catch (err) {
      toast.error(extractMessage(err));
    }
  };

  const initials = member.user.name.split(' ').map((s) => s[0]).join('').toUpperCase().slice(0, 2);

  return (
    <ListItem
      secondaryAction={
        canRemove && me?.id !== member.userId ? (
          <IconButton edge="end" onClick={handleRemove} disabled={remove.isPending} size="small">
            <DeleteIcon fontSize="small" />
          </IconButton>
        ) : null
      }
    >
      <ListItemAvatar>
        <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36, fontSize: 14 }}>
          {initials}
        </Avatar>
      </ListItemAvatar>
      <ListItemText
        primary={member.user.name}
        secondary={member.user.email}
      />
      <Chip
        label={member.role}
        size="small"
        color={member.role === 'OWNER' ? 'primary' : 'default'}
        sx={{ mr: canRemove ? 4 : 0 }}
      />
    </ListItem>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

function MembersContent() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: workspaces }        = useWorkspaces();
  const ws = workspaces?.[0];

  const { data: members, isLoading } = useMembers(ws?.id ?? '');

  if (!ws) return <Skeleton height={200} />;

  const isOwnerOrAdmin = members?.some(
    (m) => m.role !== 'MEMBER'
  ) ?? false;

  return (
    <>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Typography variant="h4">Members</Typography>
        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          onClick={() => setDialogOpen(true)}
        >
          Invite
        </Button>
      </Stack>

      <Card>
        <CardContent sx={{ p: 0 }}>
          {isLoading ? (
            <Stack spacing={1} sx={{ p: 2 }}>
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} height={52} variant="rectangular" sx={{ borderRadius: 1 }} />
              ))}
            </Stack>
          ) : !members?.length ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">No members yet.</Typography>
            </Box>
          ) : (
            <List disablePadding>
              {members.map((m) => (
                <MemberRow
                  key={m.userId}
                  member={m}
                  workspaceId={ws.id}
                  canRemove={isOwnerOrAdmin}
                />
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      <InviteDialog workspaceId={ws.id} open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </>
  );
}

export default function MembersPage() {
  return <ErrorBoundary><MembersContent /></ErrorBoundary>;
}
