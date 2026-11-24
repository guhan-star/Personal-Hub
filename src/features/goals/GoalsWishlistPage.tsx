import React, { useState, useEffect } from 'react';
import {
  Target,
  Gift,
  Plus,
  CheckCircle2,
  ExternalLink,
  Trash2,
  Edit2,
  TrendingUp,
  ShoppingBag,
} from 'lucide-react';
import { GoalWishlistService } from '@/services/goalWishlistService';
import { FinancialLedgerService } from '@/services/financialLedgerService';
import { useAuth } from '@/context/AuthContext';
import { formatINR, formatDate } from '@/utils';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import type { Goal, WishlistItem, FinancialAccount } from '@/types';

export const GoalsWishlistPage: React.FC = () => {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'goals' | 'wishlist'>('goals');
  const [goals, setGoals] = useState<Goal[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);

  // Modals
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isWishlistModalOpen, setIsWishlistModalOpen] = useState(false);
  const [progressModalGoal, setProgressModalGoal] = useState<Goal | null>(null);
  const [progressInput, setProgressInput] = useState('');

  // Form states: Goal
  const [goalTitle, setGoalTitle] = useState('');
  const [goalDesc, setGoalDesc] = useState('');
  const [goalCat, setGoalCat] = useState('Personal');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalCurrent, setGoalCurrent] = useState('0');
  const [goalUnit, setGoalUnit] = useState('%');
  const [goalTargetDate, setGoalTargetDate] = useState('');
  const [goalIsFinancial, setGoalIsFinancial] = useState(false);
  const [goalAccountId, setGoalAccountId] = useState('');

  // Form states: Wishlist
  const [wishTitle, setWishTitle] = useState('');
  const [wishDesc, setWishDesc] = useState('');
  const [wishPrice, setWishPrice] = useState('');
  const [wishPriority, setWishPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [wishCategory, setWishCategory] = useState('Shopping');
  const [wishUrl, setWishUrl] = useState('');
  const [wishLinkedGoalId, setWishLinkedGoalId] = useState('');

  const loadData = async () => {
    if (!user) return;
    const [allGoals, allWish, allAccs] = await Promise.all([
      GoalWishlistService.getGoals(user.id),
      GoalWishlistService.getWishlist(user.id),
      FinancialLedgerService.getAccounts(user.id),
    ]);
    setGoals(allGoals);
    setWishlist(allWish);
    setAccounts(allAccs);
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle.trim() || !user) return;

    await GoalWishlistService.createGoal({
      userId: user.id,
      title: goalTitle.trim(),
      description: goalDesc.trim() || undefined,
      category: goalCat,
      targetValue: parseFloat(goalTarget) || 100,
      currentValue: parseFloat(goalCurrent) || 0,
      unit: goalIsFinancial ? '₹' : goalUnit,
      targetDate: goalTargetDate || undefined,
      isFinancial: goalIsFinancial,
      linkedAccountId: goalAccountId || undefined,
    });

    setIsGoalModalOpen(false);
    resetGoalForm();
    await loadData();
  };

  const resetGoalForm = () => {
    setGoalTitle('');
    setGoalDesc('');
    setGoalTarget('');
    setGoalCurrent('0');
    setGoalUnit('%');
    setGoalTargetDate('');
    setGoalIsFinancial(false);
    setGoalAccountId('');
  };

  const handleUpdateGoalProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!progressModalGoal) return;
    const val = parseFloat(progressInput);
    if (isNaN(val)) return;

    await GoalWishlistService.updateGoalProgress(progressModalGoal.id, val);
    setProgressModalGoal(null);
    setProgressInput('');
    await loadData();
  };

  const handleCreateWishlistItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wishTitle.trim() || !user) return;

    await GoalWishlistService.createWishlistItem({
      userId: user.id,
      title: wishTitle.trim(),
      description: wishDesc.trim() || undefined,
      expectedPrice: parseFloat(wishPrice) || 0,
      priority: wishPriority,
      category: wishCategory,
      productUrl: wishUrl.trim() || undefined,
      linkedGoalId: wishLinkedGoalId || undefined,
    });

    setIsWishlistModalOpen(false);
    resetWishlistForm();
    await loadData();
  };

  const resetWishlistForm = () => {
    setWishTitle('');
    setWishDesc('');
    setWishPrice('');
    setWishUrl('');
    setWishLinkedGoalId('');
  };

  const handleUpdateWishlistStatus = async (item: WishlistItem, newStatus: any) => {
    await GoalWishlistService.updateWishlistItem(item.id, { status: newStatus });
    await loadData();
  };

  const handleDeleteGoal = async (id: string) => {
    if (window.confirm('Delete this goal?')) {
      await GoalWishlistService.deleteGoal(id);
      await loadData();
    }
  };

  const handleDeleteWishlist = async (id: string) => {
    if (window.confirm('Delete this wishlist item?')) {
      await GoalWishlistService.deleteWishlistItem(id);
      await loadData();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-hub-text dark:text-hub-text-dark flex items-center gap-2.5">
            <Target className="w-6 h-6 text-module-goals" />
            <span>Goals & Wishlist</span>
          </h2>
          <p className="text-xs sm:text-sm text-hub-muted dark:text-hub-muted-dark">
            Track life targets, skills, savings milestones and future product purchases
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'goals' ? (
            <Button onClick={() => setIsGoalModalOpen(true)} size="sm">
              <Plus className="w-4 h-4" />
              <span>New Goal</span>
            </Button>
          ) : (
            <Button onClick={() => setIsWishlistModalOpen(true)} size="sm">
              <Plus className="w-4 h-4" />
              <span>Add to Wishlist</span>
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-hub-border dark:border-hub-border-dark pb-2">
        <button
          onClick={() => setActiveTab('goals')}
          className={`flex items-center gap-2 px-4 py-2 rounded-hub-sm font-semibold text-sm transition-all ${
            activeTab === 'goals'
              ? 'bg-module-goals text-white shadow-xs'
              : 'text-hub-muted hover:text-hub-text dark:hover:text-hub-text-dark'
          }`}
        >
          <Target className="w-4 h-4" />
          <span>Active Goals ({goals.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('wishlist')}
          className={`flex items-center gap-2 px-4 py-2 rounded-hub-sm font-semibold text-sm transition-all ${
            activeTab === 'wishlist'
              ? 'bg-module-wishlist text-white shadow-xs'
              : 'text-hub-muted hover:text-hub-text dark:hover:text-hub-text-dark'
          }`}
        >
          <Gift className="w-4 h-4" />
          <span>Wishlist ({wishlist.length})</span>
        </button>
      </div>

      {/* GOALS TAB */}
      {activeTab === 'goals' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((goal) => {
            const pct = Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100));
            return (
              <Card key={goal.id} hoverable className="flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300">
                      {goal.category}
                    </span>
                    <Badge variant={goal.status === 'completed' ? 'positive' : 'info'}>
                      {goal.status}
                    </Badge>
                  </div>

                  <h4 className="text-base font-bold text-hub-text dark:text-hub-text-dark">
                    {goal.title}
                  </h4>
                  {goal.description && (
                    <p className="text-xs text-hub-muted mt-1">{goal.description}</p>
                  )}
                </div>

                <div className="pt-4 border-t border-hub-border dark:border-hub-border-dark mt-4 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span>
                      {goal.isFinancial ? formatINR(goal.currentValue) : `${goal.currentValue} ${goal.unit}`}
                      <span className="text-hub-muted font-normal">
                        {' '}of {goal.isFinancial ? formatINR(goal.targetValue) : `${goal.targetValue} ${goal.unit}`}
                      </span>
                    </span>
                    <span className="text-hub-primary">{pct}%</span>
                  </div>

                  <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-module-goals h-full rounded-full transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[11px] text-hub-muted">
                      {goal.targetDate ? `Target: ${formatDate(goal.targetDate)}` : 'Ongoing'}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setProgressModalGoal(goal);
                          setProgressInput(String(goal.currentValue));
                        }}
                        className="text-xs font-semibold text-hub-primary hover:underline"
                      >
                        Update Progress
                      </button>
                      <button
                        onClick={() => handleDeleteGoal(goal.id)}
                        className="p-1 text-hub-muted hover:text-red-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* WISHLIST TAB */}
      {activeTab === 'wishlist' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {wishlist.map((item) => (
            <Card key={item.id} hoverable className="flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-pink-100 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300">
                    {item.category}
                  </span>
                  <select
                    value={item.status}
                    onChange={(e) => handleUpdateWishlistStatus(item, e.target.value)}
                    className="text-xs font-semibold px-2 py-0.5 rounded bg-hub-bg dark:bg-hub-card-subtle-dark border border-hub-border dark:border-hub-border-dark capitalize"
                  >
                    <option value="want">Want</option>
                    <option value="planning">Planning</option>
                    <option value="saving">Saving</option>
                    <option value="purchased">Purchased</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <h4 className="text-base font-bold text-hub-text dark:text-hub-text-dark">
                  {item.title}
                </h4>
                {item.description && (
                  <p className="text-xs text-hub-muted mt-1">{item.description}</p>
                )}
              </div>

              <div className="pt-4 border-t border-hub-border dark:border-hub-border-dark mt-4">
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-xs text-hub-muted">Expected Price</span>
                  <span className="text-base font-extrabold text-hub-text dark:text-hub-text-dark">
                    {formatINR(item.expectedPrice)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  {item.productUrl ? (
                    <a
                      href={item.productUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-hub-primary hover:underline flex items-center gap-1 font-medium"
                    >
                      <span>View Store</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : <span />}

                  <button
                    onClick={() => handleDeleteWishlist(item.id)}
                    className="p-1 text-hub-muted hover:text-red-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* CREATE GOAL MODAL */}
      <Modal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        title="Create New Goal"
      >
        <form onSubmit={handleCreateGoal} className="space-y-4">
          <Input
            label="Goal Title"
            required
            value={goalTitle}
            onChange={(e) => setGoalTitle(e.target.value)}
            placeholder="e.g. Save for M3 MacBook Air, Read 15 Books"
          />

          <Input
            label="Description / Purpose"
            value={goalDesc}
            onChange={(e) => setGoalDesc(e.target.value)}
            placeholder="Why does this goal matter to you?"
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Target Value"
              type="number"
              required
              value={goalTarget}
              onChange={(e) => setGoalTarget(e.target.value)}
              placeholder="e.g. 100000"
            />
            <Input
              label="Current Progress"
              type="number"
              value={goalCurrent}
              onChange={(e) => setGoalCurrent(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Unit of Measurement"
              value={goalIsFinancial ? '₹ (INR)' : goalUnit}
              disabled={goalIsFinancial}
              onChange={(e) => setGoalUnit(e.target.value)}
              placeholder="e.g. %, books, hours"
            />
            <Input
              label="Target Date"
              type="date"
              value={goalTargetDate}
              onChange={(e) => setGoalTargetDate(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isFinancial"
              checked={goalIsFinancial}
              onChange={(e) => setGoalIsFinancial(e.target.checked)}
              className="rounded text-hub-primary"
            />
            <label htmlFor="isFinancial" className="text-xs font-semibold text-hub-text dark:text-hub-text-dark">
              This is a financial savings target in INR (₹)
            </label>
          </div>

          <div className="pt-3 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsGoalModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Goal</Button>
          </div>
        </form>
      </Modal>

      {/* UPDATE GOAL PROGRESS MODAL */}
      <Modal
        isOpen={Boolean(progressModalGoal)}
        onClose={() => setProgressModalGoal(null)}
        title={`Update Progress: ${progressModalGoal?.title}`}
      >
        <form onSubmit={handleUpdateGoalProgress} className="space-y-4">
          <Input
            label={`Current Value (${progressModalGoal?.unit})`}
            type="number"
            required
            value={progressInput}
            onChange={(e) => setProgressInput(e.target.value)}
          />
          <div className="pt-3 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setProgressModalGoal(null)}>
              Cancel
            </Button>
            <Button type="submit">Save Progress</Button>
          </div>
        </form>
      </Modal>

      {/* CREATE WISHLIST ITEM MODAL */}
      <Modal
        isOpen={isWishlistModalOpen}
        onClose={() => setIsWishlistModalOpen(false)}
        title="Add to Wishlist"
      >
        <form onSubmit={handleCreateWishlistItem} className="space-y-4">
          <Input
            label="Product Name"
            required
            value={wishTitle}
            onChange={(e) => setWishTitle(e.target.value)}
            placeholder="e.g. Sony WH-1000XM5 Headphones"
          />

          <Input
            label="Description"
            value={wishDesc}
            onChange={(e) => setWishDesc(e.target.value)}
            placeholder="Features or purpose..."
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Expected Price (₹)"
              type="number"
              step="0.01"
              required
              value={wishPrice}
              onChange={(e) => setWishPrice(e.target.value)}
              placeholder="e.g. 26990"
            />
            <div>
              <label className="block text-xs font-semibold text-hub-muted uppercase mb-1.5">
                Priority
              </label>
              <select
                value={wishPriority}
                onChange={(e) => setWishPriority(e.target.value as any)}
                className="w-full px-3 py-2 rounded-hub-sm bg-hub-bg dark:bg-hub-card-subtle-dark border border-hub-border dark:border-hub-border-dark text-xs"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <Input
            label="Product Store URL"
            type="url"
            value={wishUrl}
            onChange={(e) => setWishUrl(e.target.value)}
            placeholder="https://amazon.in/..."
          />

          <div className="pt-3 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsWishlistModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Add to Wishlist</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
