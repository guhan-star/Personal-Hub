import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Plus,
  ArrowLeftRight,
  TrendingUp,
  TrendingDown,
  HandCoins,
  Wallet,
  Search,
  Filter,
  Trash2,
  Edit2,
  CheckCircle,
  AlertCircle,
  Building,
  CreditCard,
  Banknote,
  DollarSign,
} from 'lucide-react';
import { FinancialLedgerService, type FinancialSummary } from '@/services/financialLedgerService';
import { useAuth } from '@/context/AuthContext';
import { formatINR, formatDate, generateUUID } from '@/utils';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { IncomeExpenseChart, CategoryDonutChart, SpendingTrendChart } from '@/components/charts/FinancialCharts';
import type { FinancialAccount, FinancialEvent, FinancialEventType, Loan, PaymentMethod } from '@/types';

export const SpendWisePage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState<'transactions' | 'accounts' | 'loans' | 'analytics'>('transactions');
  const [summary, setSummary] = useState<FinancialSummary>({
    totalBalance: 0,
    currentMonthIncome: 0,
    currentMonthExpense: 0,
    totalReceivables: 0,
    totalPayables: 0,
    netCashFlow: 0,
  });

  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [transactions, setTransactions] = useState<FinancialEvent[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [people, setPeople] = useState<any[]>([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterAccount, setFilterAccount] = useState('all');

  // Modals
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isRepaymentModalOpen, setIsRepaymentModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<FinancialEvent | null>(null);
  const [selectedLoanForRepay, setSelectedLoanForRepay] = useState<Loan | null>(null);

  // Form states for transaction modal
  const [eventType, setEventType] = useState<FinancialEventType>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [sourceAccountId, setSourceAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [personName, setPersonName] = useState('');
  const [selectedLoanId, setSelectedLoanId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states for new account modal
  const [accountName, setAccountName] = useState('');
  const [accountType, setAccountType] = useState<any>('savings_bank');
  const [openingBalance, setOpeningBalance] = useState('');
  const [institution, setInstitution] = useState('');

  // Repayment form
  const [repaymentAmount, setRepaymentAmount] = useState('');
  const [repaymentAccount, setRepaymentAccount] = useState('');

  const loadData = async () => {
    if (!user) return;
    const [sum, accs, txns, lnList, cats] = await Promise.all([
      FinancialLedgerService.getSummary(user.id),
      FinancialLedgerService.getAccounts(user.id),
      FinancialLedgerService.getTransactions(user.id),
      FinancialLedgerService.getLoans(user.id),
      FinancialLedgerService.getCategories(user.id),
    ]);

    setSummary(sum);
    setAccounts(accs);
    setTransactions(txns);
    setLoans(lnList);
    setCategories(cats);

    if (accs.length > 0 && !sourceAccountId) {
      setSourceAccountId(accs[0].id);
      if (accs.length > 1) setToAccountId(accs[1].id);
      setRepaymentAccount(accs[0].id);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Open modal if action parameter is present in URL
  useEffect(() => {
    const action = searchParams.get('action');
    const tab = searchParams.get('tab');
    if (tab && ['transactions', 'accounts', 'loans', 'analytics'].includes(tab)) {
      setActiveTab(tab as any);
    }
    if (action) {
      if (action === 'expense') {
        setEventType('expense');
        setIsTransactionModalOpen(true);
      } else if (action === 'income') {
        setEventType('income');
        setIsTransactionModalOpen(true);
      } else if (action === 'transfer') {
        setEventType('transfer');
        setIsTransactionModalOpen(true);
      } else if (action === 'loan') {
        setEventType('lend');
        setIsTransactionModalOpen(true);
      }
    }
  }, [searchParams]);

  // Handle Save Transaction
  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    const parsedAmount = parseFloat(amount);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormError('Please enter a valid positive amount in ₹');
      return;
    }
    if (!description.trim()) {
      setFormError('Please enter a transaction description');
      return;
    }
    if (!sourceAccountId) {
      setFormError('Please select a source account');
      return;
    }
    if (['transfer', 'cash_withdrawal', 'cash_deposit'].includes(eventType)) {
      if (!toAccountId || toAccountId === sourceAccountId) {
        setFormError('Please choose a different destination account');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      let resolvedPersonId: string | undefined;

      // If lending/borrowing and person name entered, create person contact if needed
      if (['lend', 'borrow'].includes(eventType) && personName.trim()) {
        const existingPerson = people.find(p => p.name.toLowerCase() === personName.trim().toLowerCase());
        if (existingPerson) {
          resolvedPersonId = existingPerson.id;
        } else {
          resolvedPersonId = generateUUID();
          await FinancialLedgerService['recordEvent']; // touch service
        }
      }

      if (editingTransaction) {
        await FinancialLedgerService.updateEvent(editingTransaction.id, user!.id, {
          eventType,
          amount: parsedAmount,
          description: description.trim(),
          eventDate,
          accountId: sourceAccountId,
          toAccountId: ['transfer', 'cash_withdrawal', 'cash_deposit'].includes(eventType) ? toAccountId : undefined,
          categoryId: categoryId || undefined,
          personId: resolvedPersonId,
          paymentMethod,
        });
      } else {
        await FinancialLedgerService.recordEvent({
          userId: user!.id,
          eventType,
          amount: parsedAmount,
          description: description.trim(),
          eventDate,
          accountId: sourceAccountId,
          toAccountId: ['transfer', 'cash_withdrawal', 'cash_deposit'].includes(eventType) ? toAccountId : undefined,
          categoryId: categoryId || undefined,
          personId: resolvedPersonId,
          loanId: selectedLoanId || undefined,
          paymentMethod,
        });
      }

      setIsTransactionModalOpen(false);
      setEditingTransaction(null);
      resetTransactionForm();
      await loadData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetTransactionForm = () => {
    setAmount('');
    setDescription('');
    setPersonName('');
    setEditingTransaction(null);
    setFormError('');
  };

  const handleEditClick = (tx: FinancialEvent) => {
    setEditingTransaction(tx);
    setEventType(tx.eventType);
    setAmount(String(tx.amount));
    setDescription(tx.description);
    setEventDate(tx.eventDate);
    setSourceAccountId(tx.accountId);
    if (tx.toAccountId) setToAccountId(tx.toAccountId);
    if (tx.categoryId) setCategoryId(tx.categoryId);
    setPaymentMethod(tx.paymentMethod);
    setIsTransactionModalOpen(true);
  };

  const handleDeleteClick = async (tx: FinancialEvent) => {
    if (window.confirm(`Are you sure you want to delete "${tx.description}"? Account balances will be safely reversed.`)) {
      await FinancialLedgerService.deleteEvent(tx.id, user!.id);
      await loadData();
    }
  };

  // Handle Repayment
  const handleLoanRepayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoanForRepay) return;
    const parsedAmount = parseFloat(repaymentAmount);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Enter a valid repayment amount');
      return;
    }
    if (parsedAmount > selectedLoanForRepay.outstandingAmount) {
      alert(`Repayment amount cannot exceed outstanding loan of ${formatINR(selectedLoanForRepay.outstandingAmount)}`);
      return;
    }

    try {
      await FinancialLedgerService.recordEvent({
        userId: user!.id,
        eventType: 'loan_repayment',
        amount: parsedAmount,
        eventDate: new Date().toISOString().split('T')[0],
        description: `Loan Repayment (${selectedLoanForRepay.personName || 'Contact'})`,
        accountId: repaymentAccount,
        loanId: selectedLoanForRepay.id,
        paymentMethod: 'upi',
      });

      setIsRepaymentModalOpen(false);
      setSelectedLoanForRepay(null);
      setRepaymentAmount('');
      await loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Filtered transactions
  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch =
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.categoryName && t.categoryName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.accountName && t.accountName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = filterType === 'all' || t.eventType === filterType;
    const matchesAccount = filterAccount === 'all' || t.accountId === filterAccount;

    return matchesSearch && matchesType && matchesAccount;
  });

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-hub-text dark:text-hub-text-dark flex items-center gap-2.5">
            <Wallet className="w-6 h-6 text-hub-primary" />
            <span>SpendWise</span>
          </h2>
          <p className="text-xs sm:text-sm text-hub-muted dark:text-hub-muted-dark">
            Strict double-entry financial ledger, multi-account tracking and personal loans
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => {
              setEditingTransaction(null);
              resetTransactionForm();
              setIsTransactionModalOpen(true);
            }}
            size="sm"
          >
            <Plus className="w-4 h-4" />
            <span>Record Transaction</span>
          </Button>

          <Button
            onClick={() => setIsAccountModalOpen(true)}
            variant="outline"
            size="sm"
          >
            <Building className="w-4 h-4" />
            <span>New Account</span>
          </Button>
        </div>
      </div>

      {/* 2. Top Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <span className="text-xs font-semibold text-hub-muted uppercase">Available Balance</span>
          <p className="text-xl sm:text-2xl font-extrabold text-hub-primary mt-1">
            {formatINR(summary.totalBalance)}
          </p>
          <span className="text-[11px] text-hub-muted">{accounts.length} Accounts Active</span>
        </Card>

        <Card>
          <span className="text-xs font-semibold text-hub-muted uppercase">Month Inflow</span>
          <p className="text-xl sm:text-2xl font-bold text-hub-positive mt-1">
            {formatINR(summary.currentMonthIncome)}
          </p>
          <span className="text-[11px] text-hub-muted">Net Cash Earned</span>
        </Card>

        <Card>
          <span className="text-xs font-semibold text-hub-muted uppercase">Month Outflow</span>
          <p className="text-xl sm:text-2xl font-bold text-hub-negative mt-1">
            {formatINR(summary.currentMonthExpense)}
          </p>
          <span className="text-[11px] text-hub-muted">Net Cash Spent</span>
        </Card>

        <Card>
          <span className="text-xs font-semibold text-hub-muted uppercase">Loans Net</span>
          <p className="text-xl sm:text-2xl font-bold text-hub-text dark:text-hub-text-dark mt-1">
            {formatINR(summary.totalReceivables - summary.totalPayables)}
          </p>
          <span className="text-[11px] text-hub-muted">
            +{formatINR(summary.totalReceivables)} / -{formatINR(summary.totalPayables)}
          </span>
        </Card>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-hub-border dark:border-hub-border-dark pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('transactions')}
          className={`px-4 py-2 rounded-hub-sm text-sm font-semibold transition-all ${
            activeTab === 'transactions'
              ? 'bg-hub-primary text-white shadow-xs'
              : 'text-hub-muted hover:text-hub-text dark:hover:text-hub-text-dark'
          }`}
        >
          Transactions ({transactions.length})
        </button>
        <button
          onClick={() => setActiveTab('accounts')}
          className={`px-4 py-2 rounded-hub-sm text-sm font-semibold transition-all ${
            activeTab === 'accounts'
              ? 'bg-hub-primary text-white shadow-xs'
              : 'text-hub-muted hover:text-hub-text dark:hover:text-hub-text-dark'
          }`}
        >
          Accounts ({accounts.length})
        </button>
        <button
          onClick={() => setActiveTab('loans')}
          className={`px-4 py-2 rounded-hub-sm text-sm font-semibold transition-all ${
            activeTab === 'loans'
              ? 'bg-hub-primary text-white shadow-xs'
              : 'text-hub-muted hover:text-hub-text dark:hover:text-hub-text-dark'
          }`}
        >
          Loans & Debts ({loans.filter(l => l.status === 'active').length})
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 rounded-hub-sm text-sm font-semibold transition-all ${
            activeTab === 'analytics'
              ? 'bg-hub-primary text-white shadow-xs'
              : 'text-hub-muted hover:text-hub-text dark:hover:text-hub-text-dark'
          }`}
        >
          Analytics & Trends
        </button>
      </div>

      {/* 4. TAB CONTENT */}
      {/* 4A. TRANSACTIONS TAB */}
      {activeTab === 'transactions' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="w-full sm:flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-hub-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search transactions by title, category, account..."
                className="w-full pl-9 pr-4 py-2 rounded-hub-sm bg-white dark:bg-hub-card-dark border border-hub-border dark:border-hub-border-dark text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-hub-primary/30"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 rounded-hub-sm bg-white dark:bg-hub-card-dark border border-hub-border dark:border-hub-border-dark text-xs font-medium cursor-pointer"
              >
                <option value="all">All Types</option>
                <option value="expense">Expenses</option>
                <option value="income">Incomes</option>
                <option value="transfer">Transfers</option>
                <option value="lend">Money Lent</option>
                <option value="borrow">Money Borrowed</option>
                <option value="refund">Refunds</option>
              </select>

              <select
                value={filterAccount}
                onChange={(e) => setFilterAccount(e.target.value)}
                className="px-3 py-2 rounded-hub-sm bg-white dark:bg-hub-card-dark border border-hub-border dark:border-hub-border-dark text-xs font-medium cursor-pointer"
              >
                <option value="all">All Accounts</option>
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Transactions List */}
          <Card className="p-0 overflow-hidden">
            <div className="divide-y divide-hub-border dark:divide-hub-border-dark">
              {filteredTransactions.length === 0 ? (
                <div className="p-12 text-center text-sm text-hub-muted">
                  No transactions match the selected filters.
                </div>
              ) : (
                filteredTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-4 flex items-center justify-between hover:bg-gray-50/70 dark:hover:bg-hub-card-subtle-dark/40 transition-colors"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          tx.eventType === 'income' || tx.eventType === 'refund'
                            ? 'bg-hub-positive/10 text-hub-positive'
                            : tx.eventType === 'transfer'
                            ? 'bg-indigo-500/10 text-indigo-500'
                            : 'bg-hub-negative/10 text-hub-negative'
                        }`}
                      >
                        {tx.eventType === 'income' || tx.eventType === 'refund' ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : tx.eventType === 'transfer' ? (
                          <ArrowLeftRight className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                      </div>

                      <div className="overflow-hidden">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-hub-text dark:text-hub-text-dark truncate">
                            {tx.description}
                          </h4>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-hub-muted uppercase">
                            {tx.eventType.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-xs text-hub-muted dark:text-hub-muted-dark truncate mt-0.5">
                          {tx.accountName}
                          {tx.toAccountName && ` → ${tx.toAccountName}`} • {formatDate(tx.eventDate)} • {tx.paymentMethod.toUpperCase()}
                          {tx.categoryName && ` • ${tx.categoryName}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <span
                        className={`text-sm sm:text-base font-bold ${
                          tx.eventType === 'income' || tx.eventType === 'refund'
                            ? 'text-hub-positive'
                            : tx.eventType === 'transfer'
                            ? 'text-indigo-500'
                            : 'text-hub-negative'
                        }`}
                      >
                        {tx.eventType === 'income' || tx.eventType === 'refund' ? '+' : tx.eventType === 'transfer' ? '' : '-'}
                        {formatINR(tx.amount)}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEditClick(tx)}
                          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-hub-muted hover:text-hub-text transition-colors"
                          title="Edit transaction"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(tx)}
                          className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/40 text-hub-muted hover:text-red-500 transition-colors"
                          title="Delete transaction and reverse balance"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}

      {/* 4B. ACCOUNTS TAB */}
      {activeTab === 'accounts' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((acc) => (
            <Card key={acc.id} hoverable className="flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-hub-primary/10 text-hub-primary flex items-center justify-center">
                    {acc.accountType === 'cash' ? <Banknote className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                  </div>
                  <Badge variant={acc.isActive ? 'positive' : 'neutral'}>
                    {acc.isActive ? 'Active' : 'Archived'}
                  </Badge>
                </div>
                <h4 className="text-base font-bold text-hub-text dark:text-hub-text-dark">{acc.name}</h4>
                <p className="text-xs text-hub-muted capitalize mt-0.5">
                  {acc.institution || acc.accountType.replace('_', ' ')}
                </p>
                {acc.description && <p className="text-xs text-hub-muted mt-2">{acc.description}</p>}
              </div>

              <div className="pt-6 border-t border-hub-border dark:border-hub-border-dark mt-4 flex items-baseline justify-between">
                <div>
                  <span className="text-[11px] text-hub-muted uppercase font-semibold">Current Balance</span>
                  <p className="text-xl font-extrabold text-hub-primary mt-0.5">{formatINR(acc.currentBalance)}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-hub-muted uppercase">Opening</span>
                  <p className="text-xs font-semibold text-hub-muted">{formatINR(acc.openingBalance)}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* 4C. LOANS TAB */}
      {activeTab === 'loans' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loans.map((loan) => (
              <Card key={loan.id} className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        loan.type === 'lend'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                      }`}
                    >
                      {loan.type === 'lend' ? 'Lent (Receivable)' : 'Borrowed (Payable)'}
                    </span>
                    <h4 className="text-base font-bold text-hub-text dark:text-hub-text-dark mt-1">
                      {loan.personName || 'Contact'}
                    </h4>
                  </div>
                  <Badge variant={loan.status === 'repaid' ? 'positive' : 'warning'}>
                    {loan.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-2 py-2 bg-hub-bg dark:bg-hub-card-subtle-dark rounded-hub-sm p-3 text-center">
                  <div>
                    <span className="text-[10px] text-hub-muted uppercase">Total Loan</span>
                    <p className="text-xs font-bold text-hub-text dark:text-hub-text-dark">{formatINR(loan.amount)}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-hub-muted uppercase">Repaid</span>
                    <p className="text-xs font-bold text-hub-positive">{formatINR(loan.repaidAmount)}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-hub-muted uppercase">Outstanding</span>
                    <p className="text-xs font-bold text-hub-negative">{formatINR(loan.outstandingAmount)}</p>
                  </div>
                </div>

                {loan.notes && <p className="text-xs text-hub-muted">{loan.notes}</p>}

                {loan.status === 'active' && (
                  <Button
                    onClick={() => {
                      setSelectedLoanForRepay(loan);
                      setRepaymentAmount(String(loan.outstandingAmount));
                      setIsRepaymentModalOpen(true);
                    }}
                    size="sm"
                    className="w-full"
                  >
                    Record Repayment
                  </Button>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 4D. ANALYTICS TAB */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card>
            <h4 className="font-semibold text-sm mb-3">Monthly Income vs Outflow</h4>
            <IncomeExpenseChart
              income={summary.currentMonthIncome}
              expense={summary.currentMonthExpense}
            />
          </Card>

          <Card>
            <h4 className="font-semibold text-sm mb-3">Spending by Category</h4>
            <CategoryDonutChart
              categories={categories.map(c => ({
                name: c.name,
                amount: transactions
                  .filter(t => t.eventType === 'expense' && t.categoryId === c.id)
                  .reduce((acc, curr) => acc + curr.amount, 0),
                color: c.color,
              }))}
            />
          </Card>
        </div>
      )}

      {/* RECORD TRANSACTION MODAL */}
      <Modal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        title={editingTransaction ? 'Edit Transaction' : 'Record Financial Transaction'}
        subtitle="Double-entry atomic ledger record"
        maxWidth="md"
      >
        <form onSubmit={handleSaveTransaction} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 text-xs text-red-600">
              {formError}
            </div>
          )}

          {/* Event Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-hub-muted uppercase mb-1.5">
              Transaction Type
            </label>
            <div className="grid grid-cols-3 gap-1.5 text-xs font-semibold">
              {[
                { id: 'expense', label: 'Expense' },
                { id: 'income', label: 'Income' },
                { id: 'transfer', label: 'Transfer' },
                { id: 'lend', label: 'Lend Money' },
                { id: 'borrow', label: 'Borrow' },
                { id: 'refund', label: 'Refund' },
              ].map(t => (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => setEventType(t.id as any)}
                  className={`py-2 px-1 rounded-hub-sm border transition-all text-center ${
                    eventType === t.id
                      ? 'bg-hub-primary text-white border-hub-primary shadow-xs'
                      : 'border-hub-border dark:border-hub-border-dark hover:bg-gray-50 dark:hover:bg-gray-800 text-hub-text dark:text-hub-text-dark'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Amount (₹)"
              type="number"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 1500"
            />
            <Input
              label="Date"
              type="date"
              required
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
            />
          </div>

          <Input
            label="Description"
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Weekly Groceries, Tech Salary"
          />

          {/* Source Account */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-hub-muted uppercase mb-1.5">
                {eventType === 'transfer' ? 'Source Account' : 'Account'}
              </label>
              <select
                value={sourceAccountId}
                onChange={(e) => setSourceAccountId(e.target.value)}
                className="w-full px-3 py-2 rounded-hub-sm bg-hub-bg dark:bg-hub-card-subtle-dark border border-hub-border dark:border-hub-border-dark text-xs font-medium"
              >
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({formatINR(a.currentBalance)})
                  </option>
                ))}
              </select>
            </div>

            {/* Destination Account (for transfers) */}
            {['transfer', 'cash_withdrawal', 'cash_deposit'].includes(eventType) && (
              <div>
                <label className="block text-xs font-semibold text-hub-muted uppercase mb-1.5">
                  Destination Account
                </label>
                <select
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  className="w-full px-3 py-2 rounded-hub-sm bg-hub-bg dark:bg-hub-card-subtle-dark border border-hub-border dark:border-hub-border-dark text-xs font-medium"
                >
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({formatINR(a.currentBalance)})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Category (for income/expense) */}
            {['income', 'expense'].includes(eventType) && (
              <div>
                <label className="block text-xs font-semibold text-hub-muted uppercase mb-1.5">
                  Category
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 rounded-hub-sm bg-hub-bg dark:bg-hub-card-subtle-dark border border-hub-border dark:border-hub-border-dark text-xs font-medium"
                >
                  <option value="">Select Category</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Person Contact (for Lending/Borrowing) */}
          {['lend', 'borrow'].includes(eventType) && (
            <Input
              label="Contact / Person Name"
              required
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              placeholder="e.g. Arun Kumar, Rahul"
            />
          )}

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-semibold text-hub-muted uppercase mb-1.5">
              Payment Method
            </label>
            <div className="flex gap-2">
              {(['upi', 'cash', 'bank_transfer', 'card'] as PaymentMethod[]).map(pm => (
                <button
                  type="button"
                  key={pm}
                  onClick={() => setPaymentMethod(pm)}
                  className={`px-3 py-1.5 rounded-hub-sm text-xs font-semibold uppercase border transition-all ${
                    paymentMethod === pm
                      ? 'bg-hub-primary text-white border-hub-primary'
                      : 'border-hub-border dark:border-hub-border-dark text-hub-muted'
                  }`}
                >
                  {pm.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-hub-border dark:border-hub-border-dark">
            <Button type="button" variant="outline" onClick={() => setIsTransactionModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {editingTransaction ? 'Save Changes' : 'Record Transaction'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* LOAN REPAYMENT MODAL */}
      <Modal
        isOpen={isRepaymentModalOpen}
        onClose={() => setIsRepaymentModalOpen(false)}
        title="Record Loan Repayment"
        subtitle={`Outstanding: ${selectedLoanForRepay ? formatINR(selectedLoanForRepay.outstandingAmount) : ''}`}
      >
        <form onSubmit={handleLoanRepayment} className="space-y-4">
          <Input
            label="Repayment Amount (₹)"
            type="number"
            step="0.01"
            required
            value={repaymentAmount}
            onChange={(e) => setRepaymentAmount(e.target.value)}
            max={selectedLoanForRepay?.outstandingAmount}
          />

          <div>
            <label className="block text-xs font-semibold text-hub-muted uppercase mb-1.5">
              Account to {selectedLoanForRepay?.type === 'lend' ? 'Deposit Into' : 'Pay From'}
            </label>
            <select
              value={repaymentAccount}
              onChange={(e) => setRepaymentAccount(e.target.value)}
              className="w-full px-3 py-2 rounded-hub-sm bg-hub-bg dark:bg-hub-card-subtle-dark border border-hub-border dark:border-hub-border-dark text-xs font-medium"
            >
              {accounts.map(a => (
                <option key={a.id} value={a.id}>{a.name} ({formatINR(a.currentBalance)})</option>
              ))}
            </select>
          </div>

          <div className="pt-3 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsRepaymentModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Submit Repayment</Button>
          </div>
        </form>
      </Modal>

      {/* NEW ACCOUNT MODAL */}
      <Modal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        title="Create New Financial Account"
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const ob = parseFloat(openingBalance) || 0;
            const now = new Date().toISOString();
            await FinancialLedgerService['recordEvent']; // touch
            const newAcc: FinancialAccount = {
              id: generateUUID(),
              userId: user!.id,
              name: accountName.trim(),
              accountType,
              openingBalance: ob,
              currentBalance: ob,
              institution: institution.trim() || undefined,
              isActive: true,
              createdAt: now,
              updatedAt: now,
            };
            const { db } = await import('@/lib/db');
            await db.accounts.put(newAcc);
            setIsAccountModalOpen(false);
            setAccountName('');
            setOpeningBalance('');
            setInstitution('');
            await loadData();
          }}
          className="space-y-4"
        >
          <Input
            label="Account Name"
            required
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            placeholder="e.g. ICICI Savings, Axis UPI"
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-hub-muted uppercase mb-1.5">
                Type
              </label>
              <select
                value={accountType}
                onChange={(e) => setAccountType(e.target.value as any)}
                className="w-full px-3 py-2 rounded-hub-sm bg-hub-bg dark:bg-hub-card-subtle-dark border border-hub-border dark:border-hub-border-dark text-xs"
              >
                <option value="savings_bank">Savings Bank</option>
                <option value="upi_linked">UPI Linked Account</option>
                <option value="cash">Cash in Hand</option>
                <option value="digital_wallet">Digital Wallet</option>
                <option value="current_bank">Current Bank</option>
              </select>
            </div>
            <Input
              label="Opening Balance (₹)"
              type="number"
              step="0.01"
              value={openingBalance}
              onChange={(e) => setOpeningBalance(e.target.value)}
              placeholder="0.00"
            />
          </div>

          <Input
            label="Financial Institution"
            value={institution}
            onChange={(e) => setInstitution(e.target.value)}
            placeholder="e.g. HDFC Bank, SBI, ICICI"
          />

          <div className="pt-3 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsAccountModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Account</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
