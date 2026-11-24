import React from 'react';
import { Search, Sun, Moon, Plus, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useSync } from '@/context/SyncContext';
import { Button } from '@/components/ui/Button';

interface TopNavbarProps {
  onOpenSearch: () => void;
  onOpenQuickAction: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({ onOpenSearch, onOpenQuickAction }) => {
  const { profile } = useAuth();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { isOnline, pendingCount, isSyncing, syncNow } = useSync();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const formattedDate = format(new Date(), 'EEEE, d MMMM yyyy');

  return (
    <header className="sticky top-0 z-20 bg-white/80 dark:bg-hub-card-dark/80 backdrop-blur-md border-b border-hub-border dark:border-hub-border-dark px-4 sm:px-6 py-3.5 flex items-center justify-between transition-colors">
      {/* Left: Greeting & Date */}
      <div>
        <h2 className="text-base sm:text-lg font-bold text-hub-text dark:text-hub-text-dark leading-tight flex items-center gap-2">
          <span>{getGreeting()}, {profile?.displayName?.split(' ')[0] || 'Aarav'}</span>
          <span className="hidden sm:inline-block text-xl">👋</span>
        </h2>
        <p className="text-xs text-hub-muted dark:text-hub-muted-dark font-medium">
          {formattedDate}
        </p>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Universal Search Button */}
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2 px-3 py-1.5 rounded-hub-sm bg-hub-bg dark:bg-hub-card-subtle-dark border border-hub-border dark:border-hub-border-dark text-hub-muted hover:text-hub-text dark:hover:text-hub-text-dark text-xs font-medium transition-all"
          title="Universal Search (Ctrl+K)"
        >
          <Search className="w-3.5 h-3.5 text-hub-primary" />
          <span className="hidden md:inline">Universal Search</span>
          <kbd className="hidden md:inline text-[9px] bg-white dark:bg-hub-card-dark px-1.5 py-0.5 rounded border border-hub-border dark:border-hub-border-dark">
            Ctrl K
          </kbd>
        </button>

        {/* Sync Status Button */}
        <button
          onClick={syncNow}
          disabled={!isOnline || isSyncing}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-hub-sm bg-hub-bg dark:bg-hub-card-subtle-dark border border-hub-border dark:border-hub-border-dark text-xs font-medium text-hub-muted hover:text-hub-text transition-all disabled:opacity-50"
          title={isOnline ? 'Online - click to sync' : 'Offline'}
        >
          {isOnline ? (
            <Wifi className="w-3.5 h-3.5 text-hub-positive" />
          ) : (
            <WifiOff className="w-3.5 h-3.5 text-hub-warning" />
          )}
          <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin text-hub-primary' : ''}`} />
          {pendingCount > 0 && (
            <span className="w-2 h-2 rounded-full bg-hub-warning animate-pulse" />
          )}
        </button>

        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-hub-sm bg-hub-bg dark:bg-hub-card-subtle-dark border border-hub-border dark:border-hub-border-dark text-hub-text dark:text-hub-text-dark hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title={`Switch to ${resolvedTheme === 'dark' ? 'Light' : 'Dark'} mode`}
          aria-label="Toggle theme"
        >
          {resolvedTheme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-hub-primary" />
          )}
        </button>

        {/* Desktop Quick Action */}
        <div className="hidden sm:block">
          <Button onClick={onOpenQuickAction} size="sm" className="shadow-sm">
            <Plus className="w-4 h-4" />
            <span>Action</span>
          </Button>
        </div>
      </div>
    </header>
  );
};
