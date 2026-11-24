import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  BrainCircuit,
  WalletCards,
  CheckSquare,
  GraduationCap,
  Target,
  Gift,
  Calendar,
  Search,
  Settings,
  Sparkles,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { cn } from '@/utils';
import { useAuth } from '@/context/AuthContext';
import { useSync } from '@/context/SyncContext';

const navigationItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard, color: 'text-hub-primary' },
  { name: 'BrainVault', path: '/brainvault', icon: BrainCircuit, color: 'text-module-brainvault' },
  { name: 'SpendWise', path: '/spendwise', icon: WalletCards, color: 'text-module-spendwise' },
  { name: 'Tasks', path: '/tasks', icon: CheckSquare, color: 'text-module-tasks' },
  { name: 'StudySpace', path: '/studyspace', icon: GraduationCap, color: 'text-module-study' },
  { name: 'Goals', path: '/goals', icon: Target, color: 'text-module-goals' },
  { name: 'Wishlist', path: '/wishlist', icon: Gift, color: 'text-module-wishlist' },
  { name: 'Calendar', path: '/calendar', icon: Calendar, color: 'text-module-calendar' },
];

interface DesktopSidebarProps {
  onOpenSearch: () => void;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({ onOpenSearch }) => {
  const { profile, isDemoMode } = useAuth();
  const { isOnline, pendingCount } = useSync();

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-hub-border dark:border-hub-border-dark bg-white dark:bg-hub-card-dark h-screen sticky top-0 select-none z-30">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-hub-border dark:border-hub-border-dark">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-hub-primary to-hub-secondary flex items-center justify-center text-white shadow-md shadow-hub-primary/20">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-bold text-lg text-hub-text dark:text-hub-text-dark tracking-tight leading-none">
            PersonalHub
          </h1>
          <p className="text-[11px] text-hub-muted dark:text-hub-muted-dark font-medium mt-1">
            Digital Headquarters
          </p>
        </div>
      </div>

      {/* Mode / Sync Indicator */}
      <div className="px-6 py-3 border-b border-hub-border/60 dark:border-hub-border-dark/60 bg-hub-bg/50 dark:bg-hub-card-subtle-dark/40 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 font-medium">
          {isDemoMode ? (
            <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 font-semibold text-[10px]">
              DEMO MODE
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 font-semibold text-[10px]">
              SUPABASE CONNECTED
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-[11px] text-hub-muted">
          {isOnline ? (
            <span className="flex items-center gap-1 text-hub-positive" title="Online">
              <Wifi className="w-3.5 h-3.5" />
              {pendingCount > 0 ? `${pendingCount} pending` : 'Ready'}
            </span>
          ) : (
            <span className="flex items-center gap-1 text-hub-warning" title="Working offline">
              <WifiOff className="w-3.5 h-3.5" />
              Offline
            </span>
          )}
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {/* Search Quick Action */}
        <button
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-hub-sm text-sm font-medium text-hub-muted hover:text-hub-text dark:hover:text-hub-text-dark bg-hub-bg dark:bg-hub-card-subtle-dark border border-hub-border dark:border-hub-border-dark transition-all mb-4 group"
        >
          <div className="flex items-center gap-2.5">
            <Search className="w-4 h-4 text-hub-muted group-hover:text-hub-primary transition-colors" />
            <span>Search anything...</span>
          </div>
          <kbd className="text-[10px] bg-white dark:bg-hub-card-dark px-1.5 py-0.5 rounded border border-hub-border dark:border-hub-border-dark text-hub-muted shadow-xs">
            Ctrl K
          </kbd>
        </button>

        <div className="text-[11px] font-semibold text-hub-muted dark:text-hub-muted-dark uppercase tracking-wider px-3 pb-1">
          Modules
        </div>

        {navigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3.5 py-2.5 rounded-hub-sm text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-hub-primary text-white shadow-sm font-semibold'
                    : 'text-hub-text dark:text-hub-text-dark hover:bg-gray-100 dark:hover:bg-hub-card-subtle-dark'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={cn('w-4 h-4', isActive ? 'text-white' : item.color)} />
                  <span>{item.name}</span>
                </>
              )}
            </NavLink>
          );
        })}

        <div className="pt-4 text-[11px] font-semibold text-hub-muted dark:text-hub-muted-dark uppercase tracking-wider px-3 pb-1">
          Preferences
        </div>

        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 px-3.5 py-2.5 rounded-hub-sm text-sm font-medium transition-all duration-150',
              isActive
                ? 'bg-hub-primary text-white shadow-sm font-semibold'
                : 'text-hub-text dark:text-hub-text-dark hover:bg-gray-100 dark:hover:bg-hub-card-subtle-dark'
            )
          }
        >
          {({ isActive }) => (
            <>
              <Settings className={cn('w-4 h-4', isActive ? 'text-white' : 'text-hub-muted')} />
              <span>Settings & Data</span>
            </>
          )}
        </NavLink>
      </nav>

      {/* User Footer Profile */}
      <div className="p-4 border-t border-hub-border dark:border-hub-border-dark flex items-center justify-between">
        <NavLink to="/settings" className="flex items-center gap-3 overflow-hidden group">
          <div className="w-9 h-9 rounded-full bg-hub-primary/10 text-hub-primary flex items-center justify-center font-bold text-sm overflow-hidden flex-shrink-0">
            {profile?.avatarUrl ? (
              <img src={profile.avatarUrl} alt={profile.displayName} className="w-full h-full object-cover" />
            ) : (
              profile?.displayName?.charAt(0) || 'U'
            )}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-semibold text-hub-text dark:text-hub-text-dark truncate group-hover:text-hub-primary transition-colors">
              {profile?.displayName || 'PersonalHub User'}
            </p>
            <p className="text-xs text-hub-muted dark:text-hub-muted-dark truncate">
              {profile?.currency || 'INR'} (₹)
            </p>
          </div>
        </NavLink>
      </div>
    </aside>
  );
};
