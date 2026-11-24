import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingDown,
  TrendingUp,
  ArrowLeftRight,
  HandCoins,
  BookmarkPlus,
  CheckSquare,
  CalendarPlus,
  X,
} from 'lucide-react';
import { cn } from '@/utils';

interface QuickActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction: (actionKey: string) => void;
}

export const QuickActionModal: React.FC<QuickActionModalProps> = ({
  isOpen,
  onClose,
  onSelectAction,
}) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const actions = [
    {
      id: 'add_expense',
      title: 'Add Expense',
      description: 'Record food, bills, shopping',
      icon: TrendingDown,
      color: 'bg-red-500 text-white',
      route: '/spendwise?action=expense',
    },
    {
      id: 'add_income',
      title: 'Receive Money',
      description: 'Record salary, gifts, allowance',
      icon: TrendingUp,
      color: 'bg-emerald-500 text-white',
      route: '/spendwise?action=income',
    },
    {
      id: 'transfer_money',
      title: 'Transfer Money',
      description: 'Move between bank, UPI & cash',
      icon: ArrowLeftRight,
      color: 'bg-indigo-500 text-white',
      route: '/spendwise?action=transfer',
    },
    {
      id: 'lend_borrow',
      title: 'Lend or Borrow',
      description: 'Record personal loans & debt',
      icon: HandCoins,
      color: 'bg-amber-500 text-white',
      route: '/spendwise?action=loan',
    },
    {
      id: 'save_vault',
      title: 'Save Content',
      description: 'URL, document or note',
      icon: BookmarkPlus,
      color: 'bg-purple-500 text-white',
      route: '/brainvault?action=new',
    },
    {
      id: 'add_task',
      title: 'Add Task',
      description: 'To-do item with due date',
      icon: CheckSquare,
      color: 'bg-teal-500 text-white',
      route: '/tasks?action=new',
    },
    {
      id: 'add_event',
      title: 'Calendar Event',
      description: 'Meeting or schedule reminder',
      icon: CalendarPlus,
      color: 'bg-orange-500 text-white',
      route: '/calendar?action=new',
    },
  ];

  const handleAction = (item: typeof actions[0]) => {
    onClose();
    onSelectAction(item.id);
    navigate(item.route);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white dark:bg-hub-card-dark rounded-hub border border-hub-border dark:border-hub-border-dark shadow-hub-lg z-10 p-5 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-hub-border dark:border-hub-border-dark">
          <div>
            <h3 className="text-base font-bold text-hub-text dark:text-hub-text-dark">Quick Actions</h3>
            <p className="text-xs text-hub-muted dark:text-hub-muted-dark">Select what you would like to create or record</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-hub-card-subtle-dark text-hub-muted"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {actions.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleAction(item)}
                className="flex items-start gap-3 p-3 rounded-hub-sm border border-hub-border dark:border-hub-border-dark bg-hub-bg/50 dark:bg-hub-card-subtle-dark/50 hover:bg-hub-primary/5 hover:border-hub-primary/30 transition-all text-left group"
              >
                <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm', item.color)}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-hub-text dark:text-hub-text-dark group-hover:text-hub-primary transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-xs text-hub-muted dark:text-hub-muted-dark leading-tight mt-0.5">
                    {item.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
