import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  BrainCircuit,
  WalletCards,
  Grid,
  Plus,
  CheckSquare,
  GraduationCap,
  Target,
  Gift,
  Calendar,
  X,
  Settings,
} from 'lucide-react';
import { cn } from '@/utils';

interface MobileBottomNavProps {
  onOpenQuickAction: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ onOpenQuickAction }) => {
  const [isActivitiesOpen, setIsActivitiesOpen] = useState(false);

  const activities = [
    { name: 'Tasks', path: '/tasks', icon: CheckSquare, color: 'bg-teal-500' },
    { name: 'StudySpace', path: '/studyspace', icon: GraduationCap, color: 'bg-blue-500' },
    { name: 'Goals', path: '/goals', icon: Target, color: 'bg-emerald-500' },
    { name: 'Wishlist', path: '/wishlist', icon: Gift, color: 'bg-pink-500' },
    { name: 'Calendar', path: '/calendar', icon: Calendar, color: 'bg-orange-500' },
    { name: 'Settings', path: '/settings', icon: Settings, color: 'bg-gray-600' },
  ];

  return (
    <>
      {/* Activities Sheet Popup */}
      {isActivitiesOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsActivitiesOpen(false)}
          />
          <div className="fixed bottom-16 inset-x-0 bg-white dark:bg-hub-card-dark rounded-t-2xl border-t border-hub-border dark:border-hub-border-dark p-5 shadow-hub-lg z-50 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-hub-border dark:border-hub-border-dark">
              <h4 className="font-semibold text-sm text-hub-text dark:text-hub-text-dark">Activities & Modules</h4>
              <button
                onClick={() => setIsActivitiesOpen(false)}
                className="p-1 rounded-full text-hub-muted hover:text-hub-text"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {activities.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsActivitiesOpen(false)}
                    className="flex flex-col items-center justify-center p-3 rounded-hub-sm bg-hub-bg dark:bg-hub-card-subtle-dark border border-hub-border dark:border-hub-border-dark active:scale-95 transition-all"
                  >
                    <div className={cn('w-10 h-10 rounded-xl text-white flex items-center justify-center mb-1.5 shadow-sm', item.color)}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-medium text-hub-text dark:text-hub-text-dark text-center">
                      {item.name}
                    </span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Bottom Nav Bar */}
      <nav className="fixed bottom-0 inset-x-0 z-30 lg:hidden bg-white/95 dark:bg-hub-card-dark/95 backdrop-blur-md border-t border-hub-border dark:border-hub-border-dark px-3 py-1.5 flex items-center justify-between shadow-lg">
        <NavLink
          to="/"
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center justify-center w-14 py-1 text-[11px] font-medium transition-colors',
              isActive ? 'text-hub-primary font-bold' : 'text-hub-muted dark:text-hub-muted-dark'
            )
          }
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span>Home</span>
        </NavLink>

        <NavLink
          to="/brainvault"
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center justify-center w-14 py-1 text-[11px] font-medium transition-colors',
              isActive ? 'text-module-brainvault font-bold' : 'text-hub-muted dark:text-hub-muted-dark'
            )
          }
        >
          <BrainCircuit className="w-5 h-5 mb-0.5" />
          <span>Vault</span>
        </NavLink>

        {/* Center Prominent Quick Action Button */}
        <div className="relative -top-3">
          <button
            onClick={onOpenQuickAction}
            className="w-12 h-12 rounded-full bg-gradient-to-tr from-hub-primary to-hub-secondary text-white flex items-center justify-center shadow-lg shadow-hub-primary/30 active:scale-90 transition-transform"
            aria-label="Quick Action"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        <NavLink
          to="/spendwise"
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center justify-center w-14 py-1 text-[11px] font-medium transition-colors',
              isActive ? 'text-module-spendwise font-bold' : 'text-hub-muted dark:text-hub-muted-dark'
            )
          }
        >
          <WalletCards className="w-5 h-5 mb-0.5" />
          <span>Finance</span>
        </NavLink>

        <button
          onClick={() => setIsActivitiesOpen(!isActivitiesOpen)}
          className={cn(
            'flex flex-col items-center justify-center w-14 py-1 text-[11px] font-medium transition-colors',
            isActivitiesOpen ? 'text-hub-primary font-bold' : 'text-hub-muted dark:text-hub-muted-dark'
          )}
        >
          <Grid className="w-5 h-5 mb-0.5" />
          <span>Activities</span>
        </button>
      </nav>
    </>
  );
};
