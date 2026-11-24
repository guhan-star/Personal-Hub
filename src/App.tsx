import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import { SyncProvider } from '@/context/SyncContext';
import { AppLayout } from '@/components/layout/AppLayout';

import { HomeDashboard } from '@/features/dashboard/HomeDashboard';
import { SpendWisePage } from '@/features/spendwise/SpendWisePage';
import { BrainVaultPage } from '@/features/brainvault/BrainVaultPage';
import { TasksPage } from '@/features/tasks/TasksPage';
import { StudySpacePage } from '@/features/studyspace/StudySpacePage';
import { GoalsWishlistPage } from '@/features/goals/GoalsWishlistPage';
import { CalendarPage } from '@/features/calendar/CalendarPage';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { LoginPage } from '@/features/auth/AuthPages';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <SyncProvider>
            <BrowserRouter>
              <Routes>
                {/* Auth Routes */}
                <Route path="/login" element={<LoginPage />} />

                {/* Main App */}
                <Route path="/" element={<AppLayout />}>
                  <Route index element={<HomeDashboard />} />
                  <Route path="spendwise" element={<SpendWisePage />} />
                  <Route path="brainvault" element={<BrainVaultPage />} />
                  <Route path="tasks" element={<TasksPage />} />
                  <Route path="studyspace" element={<StudySpacePage />} />
                  <Route path="goals" element={<GoalsWishlistPage />} />
                  <Route path="wishlist" element={<GoalsWishlistPage />} />
                  <Route path="calendar" element={<CalendarPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </SyncProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
