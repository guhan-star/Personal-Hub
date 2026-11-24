import React, { useState } from 'react';
import {
  Settings,
  User,
  Sun,
  Moon,
  Laptop,
  Download,
  Database,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  FileSpreadsheet,
  FileJson,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { ExportService } from '@/services/exportService';
import { isSupabaseConfigured } from '@/lib/supabase';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import type { ThemeMode } from '@/types';

export const SettingsPage: React.FC = () => {
  const { user, profile, updateProfile, isDemoMode, resetDemoData, signOut } = useAuth();
  const { theme, setTheme } = useTheme();

  const [displayName, setDisplayName] = useState(profile?.displayName || 'Aarav Sharma');
  const [email, setEmail] = useState(profile?.email || 'aarav@example.com');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl || '');
  const [isSaved, setIsSaved] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile({
      displayName: displayName.trim(),
      email: email.trim(),
      avatarUrl: avatarUrl.trim() || undefined,
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleResetDemo = async () => {
    if (window.confirm('Reset all demo records back to default sample data? Any added demo records will be refreshed.')) {
      setIsResetting(true);
      try {
        await resetDemoData();
      } finally {
        setIsResetting(false);
      }
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-hub-text dark:text-hub-text-dark flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-hub-primary" />
          <span>Settings & Personalisation</span>
        </h2>
        <p className="text-xs sm:text-sm text-hub-muted dark:text-hub-muted-dark">
          Manage your personal profile, appearance themes, database connection, and data backups
        </p>
      </div>

      {/* 1. Profile Section */}
      <Card>
        <div className="flex items-center gap-2 pb-3 mb-4 border-b border-hub-border dark:border-hub-border-dark">
          <User className="w-4 h-4 text-hub-primary" />
          <h3 className="font-bold text-sm text-hub-text dark:text-hub-text-dark">User Profile</h3>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Display Name"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
            <Input
              label="Email Address"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <Input
            label="Profile Photo URL"
            type="url"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://..."
          />

          <div className="flex items-center justify-between pt-2">
            {isSaved ? (
              <span className="text-xs text-hub-positive flex items-center gap-1 font-semibold">
                <CheckCircle2 className="w-4 h-4" /> Profile saved successfully!
              </span>
            ) : <span />}

            <Button type="submit" size="sm">
              Save Changes
            </Button>
          </div>
        </form>
      </Card>

      {/* 2. Appearance & Theme */}
      <Card>
        <div className="flex items-center gap-2 pb-3 mb-4 border-b border-hub-border dark:border-hub-border-dark">
          <Sun className="w-4 h-4 text-hub-primary" />
          <h3 className="font-bold text-sm text-hub-text dark:text-hub-text-dark">Appearance & Theme</h3>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { id: 'light', label: 'Light Mode', icon: Sun },
            { id: 'dark', label: 'Dark Mode', icon: Moon },
            { id: 'system', label: 'System Default', icon: Laptop },
          ].map((mode) => {
            const Icon = mode.icon;
            const isSelected = theme === mode.id;
            return (
              <button
                type="button"
                key={mode.id}
                onClick={() => setTheme(mode.id as ThemeMode)}
                className={`p-4 rounded-hub-sm border flex flex-col items-center justify-center gap-2 transition-all text-xs font-semibold ${
                  isSelected
                    ? 'border-hub-primary bg-hub-primary/10 text-hub-primary shadow-xs'
                    : 'border-hub-border dark:border-hub-border-dark bg-hub-bg dark:bg-hub-card-subtle-dark text-hub-muted hover:text-hub-text'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{mode.label}</span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* 3. Data Export & Backups */}
      <Card>
        <div className="flex items-center gap-2 pb-3 mb-4 border-b border-hub-border dark:border-hub-border-dark">
          <Download className="w-4 h-4 text-hub-primary" />
          <h3 className="font-bold text-sm text-hub-text dark:text-hub-text-dark">Data Export & Backups</h3>
        </div>

        <p className="text-xs text-hub-muted dark:text-hub-muted-dark mb-4">
          Export your personal data into CSV spreadsheets or download a complete encrypted JSON backup file for offline archival.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => user && ExportService.exportModuleToCSV('transactions', user.id)}
            className="flex items-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4 text-hub-positive" />
            <span>Transactions (CSV)</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => user && ExportService.exportModuleToCSV('accounts', user.id)}
            className="flex items-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4 text-blue-500" />
            <span>Accounts (CSV)</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => user && ExportService.exportModuleToCSV('loans', user.id)}
            className="flex items-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4 text-amber-500" />
            <span>Loans (CSV)</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => user && ExportService.exportModuleToCSV('tasks', user.id)}
            className="flex items-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4 text-teal-500" />
            <span>Tasks (CSV)</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => user && ExportService.exportModuleToCSV('goals', user.id)}
            className="flex items-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4 text-purple-500" />
            <span>Goals (CSV)</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => user && ExportService.exportCompleteBackup(user.id)}
            className="flex items-center gap-2 bg-gradient-to-r from-hub-primary to-hub-secondary text-white"
          >
            <FileJson className="w-4 h-4" />
            <span>Full JSON Backup</span>
          </Button>
        </div>
      </Card>

      {/* 4. Supabase Cloud Connection & Local Demo Status */}
      <Card>
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-hub-border dark:border-hub-border-dark">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-hub-primary" />
            <h3 className="font-bold text-sm text-hub-text dark:text-hub-text-dark">Cloud Sync & Persistence Engine</h3>
          </div>
          <Badge variant={isSupabaseConfigured ? 'positive' : 'warning'}>
            {isSupabaseConfigured ? 'Supabase Connected' : 'Local IndexedDB (Demo Mode)'}
          </Badge>
        </div>

        <div className="space-y-3 text-xs text-hub-muted dark:text-hub-muted-dark">
          <p>
            {isSupabaseConfigured
              ? 'Your application is connected to a remote Supabase PostgreSQL database. Changes sync automatically in real-time.'
              : 'The application is running in local offline demo mode using browser IndexedDB. All changes, transactions, tasks and saved items are safely persisted locally on your device.'}
          </p>

          <div className="p-3.5 rounded-hub-sm bg-hub-bg dark:bg-hub-card-subtle-dark border border-hub-border dark:border-hub-border-dark space-y-2">
            <span className="font-bold text-hub-text dark:text-hub-text-dark block">
              To link your own Supabase project:
            </span>
            <ol className="list-decimal list-inside space-y-1 font-mono text-[11px]">
              <li>Execute the SQL schema in <code className="text-hub-primary">supabase/migrations/001_initial_schema.sql</code>.</li>
              <li>Execute ledger functions in <code className="text-hub-primary">supabase/migrations/002_financial_ledger_functions.sql</code>.</li>
              <li>Add <code className="text-hub-primary">VITE_SUPABASE_URL</code> and <code className="text-hub-primary">VITE_SUPABASE_ANON_KEY</code> to your <code className="text-hub-primary">.env</code> file.</li>
              <li>Restart Vite dev server or rebuild.</li>
            </ol>
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResetDemo}
              isLoading={isResetting}
              className="flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Demo Seed Records</span>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
