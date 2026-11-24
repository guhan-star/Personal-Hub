import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  Circle,
  Clock,
  Calendar as CalendarIcon,
  Bookmark,
  Target,
  ArrowRight,
  Plus,
} from 'lucide-react';
import { FinancialLedgerService, type FinancialSummary } from '@/services/financialLedgerService';
import { TaskService } from '@/services/taskService';
import { BrainVaultService } from '@/services/brainVaultService';
import { GoalWishlistService } from '@/services/goalWishlistService';
import { CalendarService } from '@/services/calendarService';
import { useAuth } from '@/context/AuthContext';
import { formatINR, formatRelativeDate, formatDate } from '@/utils';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { IncomeExpenseChart, CategoryDonutChart, SpendingTrendChart } from '@/components/charts/FinancialCharts';
import type { FinancialAccount, FinancialEvent, Task, SavedItem, Goal, CalendarEvent } from '@/types';

export const HomeDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [summary, setSummary] = useState<FinancialSummary>({
    totalBalance: 0,
    currentMonthIncome: 0,
    currentMonthExpense: 0,
    totalReceivables: 0,
    totalPayables: 0,
    netCashFlow: 0,
  });

  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<FinancialEvent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [recentVault, setRecentVault] = useState<SavedItem[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [categoriesData, setCategoriesData] = useState<{ name: string; amount: number; color?: string }[]>([]);
  const [spendingTrend, setSpendingTrend] = useState<{ date: string; amount: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [
        sum,
        accs,
        txns,
        allTasks,
        items,
        allGoals,
        calEvents,
        cats,
      ] = await Promise.all([
        FinancialLedgerService.getSummary(user.id),
        FinancialLedgerService.getAccounts(user.id),
        FinancialLedgerService.getTransactions(user.id),
        TaskService.getTasks(user.id),
        BrainVaultService.getItems(user.id),
        GoalWishlistService.getGoals(user.id),
        CalendarService.getEvents(user.id),
        FinancialLedgerService.getCategories(user.id),
      ]);

      setSummary(sum);
      setAccounts(accs);
      setRecentTransactions(txns.slice(0, 5));
      setTasks(allTasks);
      setRecentVault(items.slice(0, 4));
      setGoals(allGoals.filter(g => g.status === 'active').slice(0, 3));
      setEvents(calEvents.slice(0, 3));

      // Calculate category breakdown
      const catSpendMap = new Map<string, number>();
      for (const t of txns) {
        if (t.eventType === 'expense' && t.categoryName) {
          catSpendMap.set(t.categoryName, (catSpendMap.get(t.categoryName) || 0) + t.amount);
        }
      }
      const catList = Array.from(catSpendMap.entries()).map(([name, amount]) => ({
        name,
        amount,
        color: cats.find(c => c.name === name)?.color,
      }));
      setCategoriesData(catList);

      // Trend data (last 7 recorded expense events)
      const trendMap = new Map<string, number>();
      for (const t of txns) {
        if (t.eventType === 'expense') {
          const dateLabel = formatDate(t.eventDate, 'dd MMM');
          trendMap.set(dateLabel, (trendMap.get(dateLabel) || 0) + t.amount);
        }
      }
      const trendArray = Array.from(trendMap.entries())
        .map(([date, amount]) => ({ date, amount }))
        .slice(-7);
      setSpendingTrend(trendArray);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const toggleTaskStatus = async (task: Task) => {
    const nextStatus = task.status === 'completed' ? 'todo' : 'completed';
    await TaskService.updateTask(task.id, { status: nextStatus });
    loadData();
  };

  const { todayTasks, upcomingTasks } = TaskService.categorizeTasks(tasks);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. FINANCIAL SUMMARY METRICS */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Total Available Balance */}
        <Card className="col-span-2 lg:col-span-1 bg-gradient-to-br from-hub-primary to-hub-secondary text-white border-none shadow-md shadow-hub-primary/20">
          <div className="flex items-center justify-between opacity-80 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Available Balance</span>
            <Wallet className="w-4 h-4" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {formatINR(summary.totalBalance)}
          </div>
          <p className="text-[11px] text-white/80 mt-2 font-medium">
            Across {accounts.filter(a => a.isActive).length} active accounts
          </p>
        </Card>

        {/* Current Month Income */}
        <Card hoverable>
          <div className="flex items-center justify-between text-xs font-semibold text-hub-muted dark:text-hub-muted-dark uppercase tracking-wider mb-1.5">
            <span>Month Income</span>
            <div className="w-6 h-6 rounded-md bg-hub-positive/10 text-hub-positive flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-hub-positive">
            {formatINR(summary.currentMonthIncome)}
          </div>
          <p className="text-[11px] text-hub-muted dark:text-hub-muted-dark mt-1">
            Cash in this month
          </p>
        </Card>

        {/* Current Month Expense */}
        <Card hoverable>
          <div className="flex items-center justify-between text-xs font-semibold text-hub-muted dark:text-hub-muted-dark uppercase tracking-wider mb-1.5">
            <span>Month Expenses</span>
            <div className="w-6 h-6 rounded-md bg-hub-negative/10 text-hub-negative flex items-center justify-center">
              <TrendingDown className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-hub-negative">
            {formatINR(summary.currentMonthExpense)}
          </div>
          <p className="text-[11px] text-hub-muted dark:text-hub-muted-dark mt-1">
            Net cash outflow
          </p>
        </Card>

        {/* Total Receivables (Lent) */}
        <Card hoverable>
          <div className="flex items-center justify-between text-xs font-semibold text-hub-muted dark:text-hub-muted-dark uppercase tracking-wider mb-1.5">
            <span>Receivables</span>
            <div className="w-6 h-6 rounded-md bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-hub-text dark:text-hub-text-dark">
            {formatINR(summary.totalReceivables)}
          </div>
          <p className="text-[11px] text-hub-muted dark:text-hub-muted-dark mt-1">
            Money lent to others
          </p>
        </Card>

        {/* Total Payables (Borrowed) */}
        <Card hoverable>
          <div className="flex items-center justify-between text-xs font-semibold text-hub-muted dark:text-hub-muted-dark uppercase tracking-wider mb-1.5">
            <span>Payables</span>
            <div className="w-6 h-6 rounded-md bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <ArrowDownLeft className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-hub-text dark:text-hub-text-dark">
            {formatINR(summary.totalPayables)}
          </div>
          <p className="text-[11px] text-hub-muted dark:text-hub-muted-dark mt-1">
            Money borrowed
          </p>
        </Card>
      </div>

      {/* 2. FINANCIAL OVERVIEW & CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Account Balances List */}
        <Card className="flex flex-col">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-hub-border dark:border-hub-border-dark">
            <h3 className="font-semibold text-sm text-hub-text dark:text-hub-text-dark">Accounts</h3>
            <button
              onClick={() => navigate('/spendwise?tab=accounts')}
              className="text-xs font-medium text-hub-primary hover:underline flex items-center gap-1"
            >
              <span>Manage</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2.5 flex-1 overflow-y-auto">
            {accounts.map((acc) => (
              <div
                key={acc.id}
                className="flex items-center justify-between p-2.5 rounded-hub-sm bg-hub-bg/50 dark:bg-hub-card-subtle-dark/50 border border-hub-border dark:border-hub-border-dark"
              >
                <div>
                  <h4 className="text-sm font-semibold text-hub-text dark:text-hub-text-dark truncate">
                    {acc.name}
                  </h4>
                  <p className="text-[11px] text-hub-muted dark:text-hub-muted-dark capitalize">
                    {acc.institution || acc.accountType.replace('_', ' ')}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-hub-text dark:text-hub-text-dark">
                    {formatINR(acc.currentBalance)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Income vs Expense Chart */}
        <Card className="flex flex-col">
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-hub-border dark:border-hub-border-dark">
            <h3 className="font-semibold text-sm text-hub-text dark:text-hub-text-dark">Income vs Expense</h3>
            <span className="text-xs text-hub-muted">Current Month</span>
          </div>
          <IncomeExpenseChart
            income={summary.currentMonthIncome}
            expense={summary.currentMonthExpense}
          />
        </Card>

        {/* Expense Category Breakdown */}
        <Card className="flex flex-col">
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-hub-border dark:border-hub-border-dark">
            <h3 className="font-semibold text-sm text-hub-text dark:text-hub-text-dark">Category Distribution</h3>
            <button
              onClick={() => navigate('/spendwise?tab=analytics')}
              className="text-xs font-medium text-hub-primary hover:underline"
            >
              Analytics
            </button>
          </div>
          <CategoryDonutChart categories={categoriesData} />
        </Card>
      </div>

      {/* 3. RECENT ACTIVITY & PERSONAL PRODUCTIVITY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Today's Tasks */}
        <Card>
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-hub-border dark:border-hub-border-dark">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-module-tasks" />
              <h3 className="font-semibold text-sm text-hub-text dark:text-hub-text-dark">
                Today's Tasks ({todayTasks.length})
              </h3>
            </div>
            <button
              onClick={() => navigate('/tasks')}
              className="text-xs font-medium text-hub-primary hover:underline flex items-center gap-1"
            >
              <span>All Tasks</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2">
            {todayTasks.length === 0 ? (
              <p className="text-xs text-hub-muted py-4 text-center">No pending tasks for today. You're all caught up!</p>
            ) : (
              todayTasks.slice(0, 4).map((t) => (
                <div
                  key={t.id}
                  className="flex items-start gap-2.5 p-2 rounded-hub-sm hover:bg-gray-50 dark:hover:bg-hub-card-subtle-dark transition-colors group cursor-pointer"
                  onClick={() => toggleTaskStatus(t)}
                >
                  <button className="mt-0.5 text-hub-muted group-hover:text-hub-primary">
                    {t.status === 'completed' ? (
                      <CheckCircle2 className="w-4 h-4 text-hub-positive" />
                    ) : (
                      <Circle className="w-4 h-4" />
                    )}
                  </button>
                  <div className="flex-1 overflow-hidden">
                    <p className={`text-xs font-medium ${t.status === 'completed' ? 'line-through text-hub-muted' : 'text-hub-text dark:text-hub-text-dark'}`}>
                      {t.title}
                    </p>
                    {t.dueTime && (
                      <span className="text-[10px] text-hub-muted flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" /> {t.dueTime}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Upcoming Events & Goals */}
        <Card>
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-hub-border dark:border-hub-border-dark">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-module-calendar" />
              <h3 className="font-semibold text-sm text-hub-text dark:text-hub-text-dark">Calendar & Goals</h3>
            </div>
            <button
              onClick={() => navigate('/calendar')}
              className="text-xs font-medium text-hub-primary hover:underline"
            >
              Calendar
            </button>
          </div>

          <div className="space-y-3">
            {events.map((ev) => (
              <div
                key={ev.id}
                className="p-2.5 rounded-hub-sm bg-hub-bg/50 dark:bg-hub-card-subtle-dark/50 border border-hub-border dark:border-hub-border-dark flex items-start justify-between"
              >
                <div>
                  <h5 className="text-xs font-semibold text-hub-text dark:text-hub-text-dark truncate">
                    {ev.title}
                  </h5>
                  <p className="text-[11px] text-hub-muted mt-0.5">
                    {formatDate(ev.eventDate)} • {ev.startTime}
                  </p>
                </div>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 capitalize">
                  {ev.category}
                </span>
              </div>
            ))}

            {/* Active Goals mini-progress */}
            <div className="pt-2">
              <h6 className="text-[11px] font-bold uppercase tracking-wider text-hub-muted mb-2 flex items-center justify-between">
                <span>Active Goals</span>
                <button onClick={() => navigate('/goals')} className="text-hub-primary hover:underline">
                  View
                </button>
              </h6>
              {goals.slice(0, 2).map((g) => {
                const pct = Math.min(100, Math.round((g.currentValue / g.targetValue) * 100));
                return (
                  <div key={g.id} className="mb-2">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-medium text-hub-text dark:text-hub-text-dark truncate max-w-[180px]">
                        {g.title}
                      </span>
                      <span className="font-semibold text-hub-primary">{pct}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-hub-positive h-full rounded-full transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Recent BrainVault Items */}
        <Card>
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-hub-border dark:border-hub-border-dark">
            <div className="flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-module-brainvault" />
              <h3 className="font-semibold text-sm text-hub-text dark:text-hub-text-dark">Saved in BrainVault</h3>
            </div>
            <button
              onClick={() => navigate('/brainvault')}
              className="text-xs font-medium text-hub-primary hover:underline flex items-center gap-1"
            >
              <span>Vault</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2.5">
            {recentVault.length === 0 ? (
              <p className="text-xs text-hub-muted py-4 text-center">No saved items yet.</p>
            ) : (
              recentVault.map((item) => (
                <div
                  key={item.id}
                  onClick={() => item.url && window.open(item.url, '_blank')}
                  className="p-2.5 rounded-hub-sm border border-hub-border dark:border-hub-border-dark hover:border-hub-primary/30 hover:bg-hub-primary/5 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-semibold text-hub-text dark:text-hub-text-dark truncate max-w-[200px] group-hover:text-hub-primary transition-colors">
                      {item.title}
                    </h5>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 uppercase">
                      {item.contentType}
                    </span>
                  </div>
                  {item.personalNote && (
                    <p className="text-[11px] text-hub-muted dark:text-hub-muted-dark line-clamp-1 mt-1">
                      {item.personalNote}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* 4. RECENT FINANCIAL TRANSACTIONS */}
      <Card>
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-hub-border dark:border-hub-border-dark">
          <h3 className="font-semibold text-sm text-hub-text dark:text-hub-text-dark">Recent Transactions</h3>
          <button
            onClick={() => navigate('/spendwise')}
            className="text-xs font-medium text-hub-primary hover:underline flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="divide-y divide-hub-border dark:divide-hub-border-dark">
          {recentTransactions.length === 0 ? (
            <p className="text-xs text-hub-muted py-4 text-center">No transactions recorded yet.</p>
          ) : (
            recentTransactions.map((tx) => (
              <div key={tx.id} className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      tx.eventType === 'income' || tx.eventType === 'refund'
                        ? 'bg-hub-positive/10 text-hub-positive'
                        : 'bg-hub-negative/10 text-hub-negative'
                    }`}
                  >
                    {tx.eventType === 'income' || tx.eventType === 'refund' ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <h5 className="text-xs sm:text-sm font-semibold text-hub-text dark:text-hub-text-dark truncate">
                      {tx.description}
                    </h5>
                    <p className="text-[11px] text-hub-muted truncate">
                      {tx.accountName} • {formatRelativeDate(tx.eventDate)} • {tx.paymentMethod.toUpperCase()}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`text-xs sm:text-sm font-bold ${
                      tx.eventType === 'income' || tx.eventType === 'refund'
                        ? 'text-hub-positive'
                        : 'text-hub-text dark:text-hub-text-dark'
                    }`}
                  >
                    {tx.eventType === 'income' || tx.eventType === 'refund' ? '+' : '-'}
                    {formatINR(tx.amount)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};
