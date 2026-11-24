import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, ArrowRight, BrainCircuit, WalletCards, CheckSquare, GraduationCap, Target, Gift, Calendar } from 'lucide-react';
import { SearchService } from '@/services/searchService';
import { useAuth } from '@/context/AuthContext';
import type { UniversalSearchResult } from '@/types';
import { cn } from '@/utils';

interface UniversalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UniversalSearchModal: React.FC<UniversalSearchModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [results, setResults] = useState<Record<string, UniversalSearchResult[]>>({});
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults({});
      return;
    }
  }, [isOpen]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!query.trim() || !user) {
        setResults({});
        return;
      }
      setIsSearching(true);
      try {
        const res = await SearchService.searchAll(user.id, query);
        setResults(res);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query, user]);

  if (!isOpen) return null;

  const totalResults = Object.values(results).reduce((acc, curr) => acc + curr.length, 0);

  const getModuleIcon = (mod: string) => {
    switch (mod) {
      case 'spendwise': return <WalletCards className="w-4 h-4 text-module-spendwise" />;
      case 'brainvault': return <BrainCircuit className="w-4 h-4 text-module-brainvault" />;
      case 'tasks': return <CheckSquare className="w-4 h-4 text-module-tasks" />;
      case 'studyspace': return <GraduationCap className="w-4 h-4 text-module-study" />;
      case 'goals': return <Target className="w-4 h-4 text-module-goals" />;
      case 'wishlist': return <Gift className="w-4 h-4 text-module-wishlist" />;
      case 'calendar': return <Calendar className="w-4 h-4 text-module-calendar" />;
      default: return null;
    }
  };

  const handleNavigate = (res: UniversalSearchResult) => {
    onClose();
    switch (res.module) {
      case 'spendwise': navigate('/spendwise'); break;
      case 'brainvault': navigate('/brainvault'); break;
      case 'tasks': navigate('/tasks'); break;
      case 'studyspace': navigate('/studyspace'); break;
      case 'goals': navigate('/goals'); break;
      case 'wishlist': navigate('/wishlist'); break;
      case 'calendar': navigate('/calendar'); break;
    }
  };

  const modulesList = [
    { id: 'all', label: 'All' },
    { id: 'spendwise', label: 'SpendWise' },
    { id: 'brainvault', label: 'BrainVault' },
    { id: 'tasks', label: 'Tasks' },
    { id: 'studyspace', label: 'StudySpace' },
    { id: 'goals', label: 'Goals' },
    { id: 'wishlist', label: 'Wishlist' },
    { id: 'calendar', label: 'Calendar' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white dark:bg-hub-card-dark rounded-hub border border-hub-border dark:border-hub-border-dark shadow-hub-lg z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-hub-border dark:border-hub-border-dark">
          <Search className="w-5 h-5 text-hub-primary shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search across transactions, vault, notes, tasks, goals..."
            className="w-full bg-transparent text-sm sm:text-base text-hub-text dark:text-hub-text-dark placeholder:text-hub-muted focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 text-hub-muted hover:text-hub-text">
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="text-[10px] bg-gray-100 dark:bg-hub-card-subtle-dark px-2 py-1 rounded text-hub-muted border border-hub-border dark:border-hub-border-dark">
            ESC
          </kbd>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 px-4 py-2 bg-hub-bg/60 dark:bg-hub-card-subtle-dark/40 border-b border-hub-border dark:border-hub-border-dark overflow-x-auto text-xs">
          {modulesList.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelectedModule(m.id)}
              className={cn(
                'px-2.5 py-1 rounded-full font-medium transition-colors shrink-0',
                selectedModule === m.id
                  ? 'bg-hub-primary text-white shadow-xs'
                  : 'bg-white dark:bg-hub-card-dark text-hub-muted hover:text-hub-text border border-hub-border dark:border-hub-border-dark'
              )}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Results Container */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {isSearching && (
            <div className="py-8 text-center text-sm text-hub-muted">Searching across all modules...</div>
          )}

          {!isSearching && query && totalResults === 0 && (
            <div className="py-10 text-center">
              <p className="text-sm font-medium text-hub-text dark:text-hub-text-dark">No matching records found</p>
              <p className="text-xs text-hub-muted mt-1">Try searching for keywords like "salary", "BESCOM", "python", "laptop"</p>
            </div>
          )}

          {!query && (
            <div className="py-8 text-center text-xs text-hub-muted">
              Type keywords to search across personal finance, BrainVault items, tasks, study notes and calendar.
            </div>
          )}

          {Object.entries(results).map(([mod, items]) => {
            if (selectedModule !== 'all' && selectedModule !== mod) return null;
            if (items.length === 0) return null;

            return (
              <div key={mod} className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-hub-muted dark:text-hub-muted-dark px-1">
                  {getModuleIcon(mod)}
                  <span>{mod} ({items.length})</span>
                </div>
                <div className="space-y-1.5">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleNavigate(item)}
                      className="flex items-center justify-between p-3 rounded-hub-sm border border-hub-border dark:border-hub-border-dark bg-white dark:bg-hub-card-dark hover:border-hub-primary/40 hover:bg-hub-primary/5 transition-all cursor-pointer group"
                    >
                      <div className="overflow-hidden pr-3">
                        <div className="flex items-center gap-2">
                          <h5 className="text-sm font-semibold text-hub-text dark:text-hub-text-dark truncate group-hover:text-hub-primary transition-colors">
                            {item.title}
                          </h5>
                          {item.badge && (
                            <span
                              className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                              style={{ backgroundColor: `${item.badgeColor}20`, color: item.badgeColor }}
                            >
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-hub-muted dark:text-hub-muted-dark truncate mt-0.5">
                          {item.subtitle}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-hub-muted group-hover:text-hub-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
