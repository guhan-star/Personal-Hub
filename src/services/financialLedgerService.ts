import { db } from '@/lib/db';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { generateUUID, toPaise, fromPaise } from '@/utils';
import type {
  FinancialAccount,
  FinancialEvent,
  FinancialEventType,
  Loan,
  AccountEntry,
  PaymentMethod,
} from '@/types';

export interface CreateFinancialEventParams {
  userId: string;
  eventType: FinancialEventType;
  amount: number;
  eventDate: string; // YYYY-MM-DD
  description: string;
  accountId: string;
  notes?: string;
  categoryId?: string;
  toAccountId?: string;
  personId?: string;
  loanId?: string;
  originalEventId?: string;
  paymentMethod: PaymentMethod;
  attachmentUrl?: string;
  clientId?: string;
}

export interface FinancialSummary {
  totalBalance: number;
  currentMonthIncome: number;
  currentMonthExpense: number;
  totalReceivables: number; // money lent to others
  totalPayables: number;    // money borrowed from others
  netCashFlow: number;
}

/**
 * Service to execute atomic double-entry ledger operations
 */
export class FinancialLedgerService {
  /**
   * Record a financial event atomically
   */
  static async recordEvent(params: CreateFinancialEventParams): Promise<FinancialEvent> {
    const {
      userId,
      eventType,
      amount,
      eventDate,
      description,
      accountId,
      notes,
      categoryId,
      toAccountId,
      personId,
      loanId,
      originalEventId,
      paymentMethod,
      attachmentUrl,
      clientId = generateUUID(),
    } = params;

    // 1. Validation
    if (amount <= 0) {
      throw new Error('Transaction amount must be strictly greater than zero');
    }

    if (!accountId) {
      throw new Error('A valid source account is required');
    }

    // Check duplicate submission if clientId provided
    const existingClientEvent = await db.events.where('clientId').equals(clientId).first();
    if (existingClientEvent) {
      return existingClientEvent;
    }

    const sourceAccount = await db.accounts.get(accountId);
    if (!sourceAccount) {
      throw new Error('Source account not found');
    }

    const eventId = generateUUID();
    const now = new Date().toISOString();

    let resolvedLoanId = loanId;

    // Handle atomic operations inside Dexie transaction
    await db.transaction('rw', [db.accounts, db.events, db.entries, db.loans, db.people, db.auditEvents], async () => {
      const amountPaise = toPaise(amount);

      switch (eventType) {
        // ----------------------------------------------------------------------
        // INCOME
        // ----------------------------------------------------------------------
        case 'income': {
          const newBalPaise = toPaise(sourceAccount.currentBalance) + amountPaise;
          await db.accounts.update(accountId, {
            currentBalance: fromPaise(newBalPaise),
            updatedAt: now,
          });

          await db.entries.put({
            id: generateUUID(),
            userId,
            eventId,
            accountId,
            entryType: 'credit',
            amount,
            createdAt: now,
          });
          break;
        }

        // ----------------------------------------------------------------------
        // EXPENSE
        // ----------------------------------------------------------------------
        case 'expense': {
          const newBalPaise = toPaise(sourceAccount.currentBalance) - amountPaise;
          await db.accounts.update(accountId, {
            currentBalance: fromPaise(newBalPaise),
            updatedAt: now,
          });

          await db.entries.put({
            id: generateUUID(),
            userId,
            eventId,
            accountId,
            entryType: 'debit',
            amount,
            createdAt: now,
          });
          break;
        }

        // ----------------------------------------------------------------------
        // TRANSFERS, CASH WITHDRAWALS, CASH DEPOSITS
        // ----------------------------------------------------------------------
        case 'transfer':
        case 'cash_withdrawal':
        case 'cash_deposit': {
          if (!toAccountId || toAccountId === accountId) {
            throw new Error('Transfers require a distinct destination account');
          }
          const destAccount = await db.accounts.get(toAccountId);
          if (!destAccount) {
            throw new Error('Destination account not found');
          }

          // Debit source
          const srcBalPaise = toPaise(sourceAccount.currentBalance) - amountPaise;
          await db.accounts.update(accountId, {
            currentBalance: fromPaise(srcBalPaise),
            updatedAt: now,
          });
          await db.entries.put({
            id: generateUUID(),
            userId,
            eventId,
            accountId,
            entryType: 'debit',
            amount,
            createdAt: now,
          });

          // Credit destination
          const dstBalPaise = toPaise(destAccount.currentBalance) + amountPaise;
          await db.accounts.update(toAccountId, {
            currentBalance: fromPaise(dstBalPaise),
            updatedAt: now,
          });
          await db.entries.put({
            id: generateUUID(),
            userId,
            eventId,
            accountId: toAccountId,
            entryType: 'credit',
            amount,
            createdAt: now,
          });
          break;
        }

        // ----------------------------------------------------------------------
        // LENDING (User gives money to someone -> cash decreases, receivable asset increases)
        // ----------------------------------------------------------------------
        case 'lend': {
          if (!personId) {
            throw new Error('Lending requires a person contact');
          }
          // Debit account
          const newBalPaise = toPaise(sourceAccount.currentBalance) - amountPaise;
          await db.accounts.update(accountId, {
            currentBalance: fromPaise(newBalPaise),
            updatedAt: now,
          });

          await db.entries.put({
            id: generateUUID(),
            userId,
            eventId,
            accountId,
            entryType: 'debit',
            amount,
            createdAt: now,
          });

          // Create or associate loan
          if (!resolvedLoanId) {
            resolvedLoanId = generateUUID();
            await db.loans.put({
              id: resolvedLoanId,
              userId,
              personId,
              type: 'lend',
              amount,
              repaidAmount: 0,
              outstandingAmount: amount,
              status: 'active',
              notes,
              createdAt: now,
              updatedAt: now,
            });
          }
          break;
        }

        // ----------------------------------------------------------------------
        // BORROWING (User takes money from someone -> cash increases, payable liability increases)
        // ----------------------------------------------------------------------
        case 'borrow': {
          if (!personId) {
            throw new Error('Borrowing requires a person contact');
          }
          // Credit account
          const newBalPaise = toPaise(sourceAccount.currentBalance) + amountPaise;
          await db.accounts.update(accountId, {
            currentBalance: fromPaise(newBalPaise),
            updatedAt: now,
          });

          await db.entries.put({
            id: generateUUID(),
            userId,
            eventId,
            accountId,
            entryType: 'credit',
            amount,
            createdAt: now,
          });

          if (!resolvedLoanId) {
            resolvedLoanId = generateUUID();
            await db.loans.put({
              id: resolvedLoanId,
              userId,
              personId,
              type: 'borrow',
              amount,
              repaidAmount: 0,
              outstandingAmount: amount,
              status: 'active',
              notes,
              createdAt: now,
              updatedAt: now,
            });
          }
          break;
        }

        // ----------------------------------------------------------------------
        // LOAN REPAYMENT
        // ----------------------------------------------------------------------
        case 'loan_repayment': {
          if (!loanId) {
            throw new Error('Repayment must reference an active loan');
          }
          const targetLoan = await db.loans.get(loanId);
          if (!targetLoan) {
            throw new Error('Referenced loan not found');
          }

          const outstandingPaise = toPaise(targetLoan.outstandingAmount);
          if (amountPaise > outstandingPaise) {
            throw new Error(
              `Repayment amount (₹${amount}) exceeds outstanding loan balance (₹${targetLoan.outstandingAmount})`
            );
          }

          if (targetLoan.type === 'lend') {
            // Someone is paying us back: cash increases
            const newBalPaise = toPaise(sourceAccount.currentBalance) + amountPaise;
            await db.accounts.update(accountId, {
              currentBalance: fromPaise(newBalPaise),
              updatedAt: now,
            });
            await db.entries.put({
              id: generateUUID(),
              userId,
              eventId,
              accountId,
              entryType: 'credit',
              amount,
              createdAt: now,
            });
          } else {
            // We are repaying borrowed money: cash decreases
            const newBalPaise = toPaise(sourceAccount.currentBalance) - amountPaise;
            await db.accounts.update(accountId, {
              currentBalance: fromPaise(newBalPaise),
              updatedAt: now,
            });
            await db.entries.put({
              id: generateUUID(),
              userId,
              eventId,
              accountId,
              entryType: 'debit',
              amount,
              createdAt: now,
            });
          }

          // Update loan repaid and outstanding balances
          const newRepaidPaise = toPaise(targetLoan.repaidAmount) + amountPaise;
          const newOutstandingPaise = toPaise(targetLoan.outstandingAmount) - amountPaise;
          const newStatus = newOutstandingPaise === 0 ? 'repaid' : 'active';

          await db.loans.update(loanId, {
            repaidAmount: fromPaise(newRepaidPaise),
            outstandingAmount: fromPaise(newOutstandingPaise),
            status: newStatus,
            updatedAt: now,
          });
          break;
        }

        // ----------------------------------------------------------------------
        // REFUND (Reduces net expense, credited back to account)
        // ----------------------------------------------------------------------
        case 'refund': {
          const newBalPaise = toPaise(sourceAccount.currentBalance) + amountPaise;
          await db.accounts.update(accountId, {
            currentBalance: fromPaise(newBalPaise),
            updatedAt: now,
          });

          await db.entries.put({
            id: generateUUID(),
            userId,
            eventId,
            accountId,
            entryType: 'credit',
            amount,
            createdAt: now,
          });
          break;
        }

        default:
          throw new Error(`Unsupported event type: ${eventType}`);
      }

      // Record the financial event
      await db.events.put({
        id: eventId,
        userId,
        eventType,
        amount,
        eventDate,
        description,
        notes,
        categoryId,
        accountId,
        toAccountId,
        personId,
        loanId: resolvedLoanId,
        originalEventId,
        paymentMethod,
        attachmentUrl,
        clientId,
        syncStatus: isSupabaseConfigured ? 'pending' : 'synced',
        createdAt: now,
        updatedAt: now,
      });

      // Audit log
      await db.auditEvents.put({
        id: generateUUID(),
        userId,
        entityType: 'financial_event',
        entityId: eventId,
        action: 'create',
        afterState: { eventType, amount, accountId, toAccountId, loanId: resolvedLoanId },
        createdAt: now,
      });
    });

    const createdEvent = await db.events.get(eventId);
    return createdEvent!;
  }

  /**
   * Delete a financial event with complete reversal of ledger effects
   */
  static async deleteEvent(eventId: string, userId: string): Promise<void> {
    const event = await db.events.get(eventId);
    if (!event) throw new Error('Transaction event not found');

    const now = new Date().toISOString();

    await db.transaction('rw', [db.accounts, db.events, db.entries, db.loans, db.auditEvents], async () => {
      const amountPaise = toPaise(event.amount);
      const sourceAccount = await db.accounts.get(event.accountId);

      if (sourceAccount) {
        switch (event.eventType) {
          case 'income':
          case 'refund': {
            // Reversal: decrease balance
            const newBalPaise = toPaise(sourceAccount.currentBalance) - amountPaise;
            await db.accounts.update(event.accountId, { currentBalance: fromPaise(newBalPaise), updatedAt: now });
            break;
          }
          case 'expense': {
            // Reversal: increase balance
            const newBalPaise = toPaise(sourceAccount.currentBalance) + amountPaise;
            await db.accounts.update(event.accountId, { currentBalance: fromPaise(newBalPaise), updatedAt: now });
            break;
          }
          case 'transfer':
          case 'cash_withdrawal':
          case 'cash_deposit': {
            // Reversal: source increased, destination decreased
            const srcBalPaise = toPaise(sourceAccount.currentBalance) + amountPaise;
            await db.accounts.update(event.accountId, { currentBalance: fromPaise(srcBalPaise), updatedAt: now });

            if (event.toAccountId) {
              const destAccount = await db.accounts.get(event.toAccountId);
              if (destAccount) {
                const dstBalPaise = toPaise(destAccount.currentBalance) - amountPaise;
                await db.accounts.update(event.toAccountId, { currentBalance: fromPaise(dstBalPaise), updatedAt: now });
              }
            }
            break;
          }
          case 'lend': {
            // Reversal: cash increased back, loan removed/updated
            const newBalPaise = toPaise(sourceAccount.currentBalance) + amountPaise;
            await db.accounts.update(event.accountId, { currentBalance: fromPaise(newBalPaise), updatedAt: now });
            if (event.loanId) {
              await db.loans.delete(event.loanId);
            }
            break;
          }
          case 'borrow': {
            // Reversal: cash decreased back, loan removed/updated
            const newBalPaise = toPaise(sourceAccount.currentBalance) - amountPaise;
            await db.accounts.update(event.accountId, { currentBalance: fromPaise(newBalPaise), updatedAt: now });
            if (event.loanId) {
              await db.loans.delete(event.loanId);
            }
            break;
          }
          case 'loan_repayment': {
            if (event.loanId) {
              const loan = await db.loans.get(event.loanId);
              if (loan) {
                if (loan.type === 'lend') {
                  // Borrower paid us -> reversal: cash decreases, receivable increases
                  const newBalPaise = toPaise(sourceAccount.currentBalance) - amountPaise;
                  await db.accounts.update(event.accountId, { currentBalance: fromPaise(newBalPaise), updatedAt: now });
                } else {
                  // We paid lender -> reversal: cash increases, payable increases
                  const newBalPaise = toPaise(sourceAccount.currentBalance) + amountPaise;
                  await db.accounts.update(event.accountId, { currentBalance: fromPaise(newBalPaise), updatedAt: now });
                }
                const newRepaidPaise = toPaise(loan.repaidAmount) - amountPaise;
                const newOutstandingPaise = toPaise(loan.outstandingAmount) + amountPaise;
                await db.loans.update(event.loanId, {
                  repaidAmount: Math.max(0, fromPaise(newRepaidPaise)),
                  outstandingAmount: fromPaise(newOutstandingPaise),
                  status: 'active',
                  updatedAt: now,
                });
              }
            }
            break;
          }
        }
      }

      // Delete entries & event
      await db.entries.where('eventId').equals(eventId).delete();
      await db.events.delete(eventId);

      // Audit log
      await db.auditEvents.put({
        id: generateUUID(),
        userId,
        entityType: 'financial_event',
        entityId: eventId,
        action: 'delete',
        beforeState: event,
        createdAt: now,
      });
    });
  }

  /**
   * Edit an existing event with correct reversal and re-application
   */
  static async updateEvent(
    eventId: string,
    userId: string,
    newParams: Partial<CreateFinancialEventParams>
  ): Promise<FinancialEvent> {
    const existing = await db.events.get(eventId);
    if (!existing) throw new Error('Transaction not found');

    // First reverse existing ledger impact
    await this.deleteEvent(eventId, userId);

    // Then re-apply with merged parameters
    const mergedParams: CreateFinancialEventParams = {
      userId,
      eventType: newParams.eventType || existing.eventType,
      amount: newParams.amount !== undefined ? newParams.amount : existing.amount,
      eventDate: newParams.eventDate || existing.eventDate,
      description: newParams.description || existing.description,
      accountId: newParams.accountId || existing.accountId,
      notes: newParams.notes !== undefined ? newParams.notes : existing.notes,
      categoryId: newParams.categoryId !== undefined ? newParams.categoryId : existing.categoryId,
      toAccountId: newParams.toAccountId !== undefined ? newParams.toAccountId : existing.toAccountId,
      personId: newParams.personId !== undefined ? newParams.personId : existing.personId,
      loanId: newParams.loanId !== undefined ? newParams.loanId : existing.loanId,
      originalEventId: newParams.originalEventId !== undefined ? newParams.originalEventId : existing.originalEventId,
      paymentMethod: newParams.paymentMethod || existing.paymentMethod,
      attachmentUrl: newParams.attachmentUrl !== undefined ? newParams.attachmentUrl : existing.attachmentUrl,
      clientId: existing.clientId,
    };

    return await this.recordEvent(mergedParams);
  }

  /**
   * Calculate overall financial summary metrics
   */
  static async getSummary(userId: string): Promise<FinancialSummary> {
    const accounts = await db.accounts.where('userId').equals(userId).and(a => a.isActive).toArray();
    const totalBalance = accounts.reduce((acc, a) => acc + a.currentBalance, 0);

    const now = new Date();
    const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const events = await db.events.where('userId').equals(userId).toArray();
    let currentMonthIncome = 0;
    let currentMonthExpense = 0;

    for (const evt of events) {
      if (evt.eventDate && evt.eventDate.startsWith(currentMonthPrefix)) {
        if (evt.eventType === 'income') {
          currentMonthIncome += evt.amount;
        } else if (evt.eventType === 'expense') {
          currentMonthExpense += evt.amount;
        } else if (evt.eventType === 'refund') {
          // Refunds reduce net monthly expense
          currentMonthExpense -= evt.amount;
        }
      }
    }

    const loans = await db.loans.where('userId').equals(userId).and(l => l.status === 'active').toArray();
    let totalReceivables = 0;
    let totalPayables = 0;

    for (const loan of loans) {
      if (loan.type === 'lend') {
        totalReceivables += loan.outstandingAmount;
      } else if (loan.type === 'borrow') {
        totalPayables += loan.outstandingAmount;
      }
    }

    return {
      totalBalance: fromPaise(toPaise(totalBalance)),
      currentMonthIncome: Math.max(0, fromPaise(toPaise(currentMonthIncome))),
      currentMonthExpense: Math.max(0, fromPaise(toPaise(currentMonthExpense))),
      totalReceivables: fromPaise(toPaise(totalReceivables)),
      totalPayables: fromPaise(toPaise(totalPayables)),
      netCashFlow: fromPaise(toPaise(currentMonthIncome - currentMonthExpense)),
    };
  }

  /**
   * Fetch all accounts for a user
   */
  static async getAccounts(userId: string): Promise<FinancialAccount[]> {
    return await db.accounts.where('userId').equals(userId).toArray();
  }

  /**
   * Fetch all categories
   */
  static async getCategories(userId: string): Promise<any[]> {
    return await db.categories.where('userId').equals(userId).toArray();
  }

  /**
   * Fetch all loans
   */
  static async getLoans(userId: string): Promise<Loan[]> {
    const loans = await db.loans.where('userId').equals(userId).toArray();
    const people = await db.people.where('userId').equals(userId).toArray();
    const personMap = new Map(people.map(p => [p.id, p.name]));

    return loans.map(l => ({
      ...l,
      personName: personMap.get(l.personId) || 'Unknown Contact',
    }));
  }

  /**
   * Fetch transactions with populated joins
   */
  static async getTransactions(userId: string): Promise<FinancialEvent[]> {
    const [events, accounts, categories, people] = await Promise.all([
      db.events.where('userId').equals(userId).reverse().sortBy('eventDate'),
      db.accounts.where('userId').equals(userId).toArray(),
      db.categories.where('userId').equals(userId).toArray(),
      db.people.where('userId').equals(userId).toArray(),
    ]);

    const accMap = new Map(accounts.map(a => [a.id, a.name]));
    const catMap = new Map(categories.map(c => [c.id, c]));
    const personMap = new Map(people.map(p => [p.id, p.name]));

    return events.map(e => ({
      ...e,
      accountName: accMap.get(e.accountId) || 'Account',
      toAccountName: e.toAccountId ? accMap.get(e.toAccountId) : undefined,
      categoryName: e.categoryId ? catMap.get(e.categoryId)?.name : undefined,
      categoryColor: e.categoryId ? catMap.get(e.categoryId)?.color : undefined,
      personName: e.personId ? personMap.get(e.personId) : undefined,
    }));
  }
}
