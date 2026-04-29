'use client';

import React from 'react';
import { Box, Button, Typography } from '@mui/material';

type Props = { children: React.ReactNode; fallback?: React.ReactNode };
type State = { hasError: boolean; message: string };

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  override render() {
    if (!this.state.hasError) return this.props.children;

    if (this.props.fallback) return this.props.fallback;

    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="error" gutterBottom>
          Something went wrong
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {this.state.message}
        </Typography>
        <Button variant="outlined" onClick={() => this.setState({ hasError: false, message: '' })}>
          Try again
        </Button>
      </Box>
    );
  }
}
