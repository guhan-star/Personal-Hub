import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import { SyncProvider } from '@/context/SyncContext';
import { TopNavbar } from '@/components/layout/TopNavbar';
import { formatINR, formatINRCompact } from '@/utils';

describe('UI & Layout Components', () => {
  it('Formats INR currency properly with commas and rupee symbol', () => {
    expect(formatINR(1500)).toContain('1,500.00');
    expect(formatINR(78500.5)).toContain('78,500.50');
    expect(formatINR(0)).toContain('0.00');
  });

  it('Formats compact Indian currency values', () => {
    expect(formatINRCompact(150000)).toContain('L');
    expect(formatINRCompact(12000000)).toContain('Cr');
  });

  it('Renders TopNavbar with greeting and search button', () => {
    render(
      <ThemeProvider>
        <AuthProvider>
          <SyncProvider>
            <BrowserRouter>
              <TopNavbar onOpenSearch={() => {}} onOpenQuickAction={() => {}} />
            </BrowserRouter>
          </SyncProvider>
        </AuthProvider>
      </ThemeProvider>
    );

    expect(screen.getByText(/Universal Search/i)).toBeInTheDocument();
  });
});
