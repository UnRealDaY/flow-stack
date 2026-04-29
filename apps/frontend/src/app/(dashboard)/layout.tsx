'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import NextLink from 'next/link';
import {
  AppBar, Box, Drawer, IconButton, List, ListItem,
  ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography,
} from '@mui/material';
import DashboardIcon   from '@mui/icons-material/Dashboard';
import GroupIcon       from '@mui/icons-material/Group';
import UploadFileIcon  from '@mui/icons-material/UploadFile';
import PaymentIcon     from '@mui/icons-material/Payment';
import LogoutIcon      from '@mui/icons-material/Logout';
import toast           from 'react-hot-toast';
import { useAuth }     from '@/lib/auth';

const DRAWER = 220;

const NAV = [
  { label: 'Overview',  href: '/',        icon: <DashboardIcon /> },
  { label: 'Members',   href: '/members', icon: <GroupIcon /> },
  { label: 'Files',     href: '/files',   icon: <UploadFileIcon /> },
  { label: 'Billing',   href: '/billing', icon: <PaymentIcon /> },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router   = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  if (loading || !user) return null;

  const handleLogout = async () => {
    await logout();
    toast.success('Signed out.');
    router.replace('/login');
  };

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER,
          '& .MuiDrawer-paper': { width: DRAWER, boxSizing: 'border-box' },
        }}
      >
        <Toolbar>
          <Typography variant="h6" color="primary" fontWeight={700}>
            FlowStack
          </Typography>
        </Toolbar>

        <List dense sx={{ flex: 1 }}>
          {NAV.map(({ label, href, icon }) => (
            <ListItem key={href} disablePadding>
              <ListItemButton
                component={NextLink}
                href={href}
                selected={pathname === href}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>{icon}</ListItemIcon>
                <ListItemText primary={label} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        <List dense>
          <ListItem disablePadding>
            <ListItemButton onClick={handleLogout}>
              <ListItemIcon sx={{ minWidth: 36 }}><LogoutIcon /></ListItemIcon>
              <ListItemText primary="Sign out" />
            </ListItemButton>
          </ListItem>
        </List>
      </Drawer>

      {/* Main */}
      <Box component="main" sx={{ flex: 1, minHeight: '100vh', bgcolor: 'background.default' }}>
        <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Toolbar>
            <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
              {user.email}
            </Typography>
          </Toolbar>
        </AppBar>

        <Box sx={{ p: 3 }}>{children}</Box>
      </Box>
    </Box>
  );
}
