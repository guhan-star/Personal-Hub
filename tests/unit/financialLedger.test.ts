import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/lib/db';
import { FinancialLedgerService } from '@/services/financialLedgerService';
import { generateUUID } from '@/utils';
import type { FinancialAccount, Person } from '@/types';

describe('FinancialLedgerService Unit Tests (18 Acceptance Criteria)', () => {
  const testUserId = 'test-user-uuid-1';
  let bankA: FinancialAccount;
  let bankB: FinancialAccount;
  let cashAcc: FinancialAccount;
  let personRahul: Person;
  let personArun: Person;

  beforeEach(async () => {
    // Clear in-memory database tables
    await db.accounts.clear();
    await db.events.clear();
    await db.entries.clear();
    await db.loans.clear();
    await db.people.clear();
    await db.auditEvents.clear();

    const now = new Date().toISOString();

    bankA = {
      id: generateUUID(),
      userId: testUserId,
      name: 'Bank A',
      accountType: 'savings_bank',
      openingBalance: 10000,
      currentBalance: 10000,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    bankB = {
      id: generateUUID(),
      userId: testUserId,
      name: 'Bank B',
      accountType: 'savings_bank',
      openingBalance: 5000,
      currentBalance: 5000,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    cashAcc = {
      id: generateUUID(),
      userId: testUserId,
      name: 'Cash in Hand',
      accountType: 'cash',
      openingBalance: 2000,
      currentBalance: 2000,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    personRahul = {
      id: generateUUID(),
      userId: testUserId,
      name: 'Rahul',
      createdAt: now,
    };

    personArun = {
      id: generateUUID(),
      userId: testUserId,
      name: 'Arun',
      createdAt: now,
    };

    await db.accounts.bulkPut([bankA, bankB, cashAcc]);
    await db.people.bulkPut([personRahul, personArun]);
  });

  // 1. Income increases account balance
  it('1. Income increases account balance', async () => {
    await FinancialLedgerService.recordEvent({
      userId: testUserId,
      eventType: 'income',
      amount: 5000,
      eventDate: '2026-11-15',
      description: 'Consulting Income',
      accountId: bankA.id,
      paymentMethod: 'bank_transfer',
    });

    const updated = await db.accounts.get(bankA.id);
    expect(updated?.currentBalance).toBe(15000);
  });

  // 2. Expense decreases account balance
  it('2. Expense decreases account balance', async () => {
    await FinancialLedgerService.recordEvent({
      userId: testUserId,
      eventType: 'expense',
      amount: 3000,
      eventDate: '2026-11-15',
      description: 'Grocery Shopping',
      accountId: bankA.id,
      paymentMethod: 'upi',
    });

    const updated = await db.accounts.get(bankA.id);
    expect(updated?.currentBalance).toBe(7000);
  });

  // 3. Transfer decreases source and increases destination
  it('3. Transfer decreases source and increases destination', async () => {
    await FinancialLedgerService.recordEvent({
      userId: testUserId,
      eventType: 'transfer',
      amount: 2000,
      eventDate: '2026-11-15',
      description: 'Transfer Bank A to Bank B',
      accountId: bankA.id,
      toAccountId: bankB.id,
      paymentMethod: 'bank_transfer',
    });

    const updatedA = await db.accounts.get(bankA.id);
    const updatedB = await db.accounts.get(bankB.id);

    expect(updatedA?.currentBalance).toBe(8000);
    expect(updatedB?.currentBalance).toBe(7000);
  });

  // 4. Transfer does not affect income or expenses
  it('4. Transfer does not affect income or expenses', async () => {
    await FinancialLedgerService.recordEvent({
      userId: testUserId,
      eventType: 'transfer',
      amount: 2000,
      eventDate: '2026-11-15',
      description: 'Transfer',
      accountId: bankA.id,
      toAccountId: bankB.id,
      paymentMethod: 'bank_transfer',
    });

    const summary = await FinancialLedgerService.getSummary(testUserId);
    expect(summary.currentMonthIncome).toBe(0);
    expect(summary.currentMonthExpense).toBe(0);
    expect(summary.totalBalance).toBe(17000); // 8000 + 7000 + 2000
  });

  // 5. Borrowing increases cash and liabilities
  it('5. Borrowing increases cash and liabilities', async () => {
    await FinancialLedgerService.recordEvent({
      userId: testUserId,
      eventType: 'borrow',
      amount: 4000,
      eventDate: '2026-11-15',
      description: 'Borrowed from Rahul',
      accountId: bankA.id,
      personId: personRahul.id,
      paymentMethod: 'upi',
    });

    const updatedA = await db.accounts.get(bankA.id);
    expect(updatedA?.currentBalance).toBe(14000);

    const summary = await FinancialLedgerService.getSummary(testUserId);
    expect(summary.totalPayables).toBe(4000);
    expect(summary.currentMonthIncome).toBe(0); // Borrowing is not income!
  });

  // 6. Lending decreases cash and increases receivables
  it('6. Lending decreases cash and increases receivables', async () => {
    await FinancialLedgerService.recordEvent({
      userId: testUserId,
      eventType: 'lend',
      amount: 2500,
      eventDate: '2026-11-15',
      description: 'Lent to Arun',
      accountId: bankA.id,
      personId: personArun.id,
      paymentMethod: 'upi',
    });

    const updatedA = await db.accounts.get(bankA.id);
    expect(updatedA?.currentBalance).toBe(7500);

    const summary = await FinancialLedgerService.getSummary(testUserId);
    expect(summary.totalReceivables).toBe(2500);
    expect(summary.currentMonthExpense).toBe(0); // Lending is not expense!
  });

  // 7. Borrowed-money repayment reduces liabilities
  it('7. Borrowed-money repayment reduces liabilities', async () => {
    // First borrow
    const borrowEvt = await FinancialLedgerService.recordEvent({
      userId: testUserId,
      eventType: 'borrow',
      amount: 5000,
      eventDate: '2026-11-15',
      description: 'Borrow from Rahul',
      accountId: bankA.id,
      personId: personRahul.id,
      paymentMethod: 'upi',
    });

    // Then repay
    await FinancialLedgerService.recordEvent({
      userId: testUserId,
      eventType: 'loan_repayment',
      amount: 2000,
      eventDate: '2026-11-15',
      description: 'Partial repayment to Rahul',
      accountId: bankA.id,
      loanId: borrowEvt.loanId,
      paymentMethod: 'upi',
    });

    const loan = await db.loans.get(borrowEvt.loanId!);
    expect(loan?.outstandingAmount).toBe(3000);
    expect(loan?.repaidAmount).toBe(2000);
    expect(loan?.status).toBe('active');

    const summary = await FinancialLedgerService.getSummary(testUserId);
    expect(summary.totalPayables).toBe(3000);
  });

  // 8. Received repayment reduces receivables
  it('8. Received repayment reduces receivables', async () => {
    const lendEvt = await FinancialLedgerService.recordEvent({
      userId: testUserId,
      eventType: 'lend',
      amount: 6000,
      eventDate: '2026-11-15',
      description: 'Lend to Arun',
      accountId: bankA.id,
      personId: personArun.id,
      paymentMethod: 'upi',
    });

    await FinancialLedgerService.recordEvent({
      userId: testUserId,
      eventType: 'loan_repayment',
      amount: 4000,
      eventDate: '2026-11-15',
      description: 'Arun repayment',
      accountId: bankA.id,
      loanId: lendEvt.loanId,
      paymentMethod: 'upi',
    });

    const loan = await db.loans.get(lendEvt.loanId!);
    expect(loan?.outstandingAmount).toBe(2000);
    expect(loan?.repaidAmount).toBe(4000);

    const summary = await FinancialLedgerService.getSummary(testUserId);
    expect(summary.totalReceivables).toBe(2000);
  });

  // 9. Partial repayment works
  it('9. Partial repayment works', async () => {
    const lendEvt = await FinancialLedgerService.recordEvent({
      userId: testUserId,
      eventType: 'lend',
      amount: 1000,
      eventDate: '2026-11-15',
      description: 'Loan 1000',
      accountId: bankA.id,
      personId: personArun.id,
      paymentMethod: 'upi',
    });

    await FinancialLedgerService.recordEvent({
      userId: testUserId,
      eventType: 'loan_repayment',
      amount: 300,
      eventDate: '2026-11-15',
      description: 'Part 1',
      accountId: bankA.id,
      loanId: lendEvt.loanId,
      paymentMethod: 'upi',
    });

    const loan = await db.loans.get(lendEvt.loanId!);
    expect(loan?.outstandingAmount).toBe(700);
    expect(loan?.status).toBe('active');
  });

  // 10. Full repayment works
  it('10. Full repayment works', async () => {
    const lendEvt = await FinancialLedgerService.recordEvent({
      userId: testUserId,
      eventType: 'lend',
      amount: 1000,
      eventDate: '2026-11-15',
      description: 'Loan 1000',
      accountId: bankA.id,
      personId: personArun.id,
      paymentMethod: 'upi',
    });

    await FinancialLedgerService.recordEvent({
      userId: testUserId,
      eventType: 'loan_repayment',
      amount: 1000,
      eventDate: '2026-11-15',
      description: 'Full payoff',
      accountId: bankA.id,
      loanId: lendEvt.loanId,
      paymentMethod: 'upi',
    });

    const loan = await db.loans.get(lendEvt.loanId!);
    expect(loan?.outstandingAmount).toBe(0);
    expect(loan?.repaidAmount).toBe(1000);
    expect(loan?.status).toBe('repaid');
  });

  // 11. Overpayment is rejected
  it('11. Overpayment is rejected', async () => {
    const lendEvt = await FinancialLedgerService.recordEvent({
      userId: testUserId,
      eventType: 'lend',
      amount: 1000,
      eventDate: '2026-11-15',
      description: 'Loan 1000',
      accountId: bankA.id,
      personId: personArun.id,
      paymentMethod: 'upi',
    });

    await expect(
      FinancialLedgerService.recordEvent({
        userId: testUserId,
        eventType: 'loan_repayment',
        amount: 1500, // exceeds 1000
        eventDate: '2026-11-15',
        description: 'Overpayment attempt',
        accountId: bankA.id,
        loanId: lendEvt.loanId,
        paymentMethod: 'upi',
      })
    ).rejects.toThrow(/exceeds outstanding loan balance/i);
  });

  // 12. Refund reduces net expense
  it('12. Refund reduces net expense', async () => {
    // Initial Purchase: 1000 expense
    await FinancialLedgerService.recordEvent({
      userId: testUserId,
      eventType: 'expense',
      amount: 1000,
      eventDate: '2026-11-15',
      description: 'Online purchase',
      accountId: bankA.id,
      paymentMethod: 'card',
    });

    // Refund: 200 credited back
    await FinancialLedgerService.recordEvent({
      userId: testUserId,
      eventType: 'refund',
      amount: 200,
      eventDate: '2026-11-15',
      description: 'Partial refund',
      accountId: bankA.id,
      paymentMethod: 'card',
    });

    const updatedA = await db.accounts.get(bankA.id);
    expect(updatedA?.currentBalance).toBe(9200); // 10000 - 1000 + 200

    const summary = await FinancialLedgerService.getSummary(testUserId);
    expect(summary.currentMonthExpense).toBe(800); // Net expense: 800
  });

  // 13. Cash withdrawal is an internal transfer
  it('13. Cash withdrawal is an internal transfer', async () => {
    await FinancialLedgerService.recordEvent({
      userId: testUserId,
      eventType: 'cash_withdrawal',
      amount: 1500,
      eventDate: '2026-11-15',
      description: 'ATM Cash Withdrawal',
      accountId: bankA.id,
      toAccountId: cashAcc.id,
      paymentMethod: 'cash',
    });

    const updatedBank = await db.accounts.get(bankA.id);
    const updatedCash = await db.accounts.get(cashAcc.id);

    expect(updatedBank?.currentBalance).toBe(8500); // 10000 - 1500
    expect(updatedCash?.currentBalance).toBe(3500); // 2000 + 1500

    const summary = await FinancialLedgerService.getSummary(testUserId);
    expect(summary.currentMonthExpense).toBe(0); // Internal movement, no expense!
    expect(summary.currentMonthIncome).toBe(0);
  });

  // 14. Cash deposit is an internal transfer
  it('14. Cash deposit is an internal transfer', async () => {
    await FinancialLedgerService.recordEvent({
      userId: testUserId,
      eventType: 'cash_deposit',
      amount: 500,
      eventDate: '2026-11-15',
      description: 'Cash deposit at CDM kiosk',
      accountId: cashAcc.id,
      toAccountId: bankA.id,
      paymentMethod: 'cash',
    });

    const updatedCash = await db.accounts.get(cashAcc.id);
    const updatedBank = await db.accounts.get(bankA.id);

    expect(updatedCash?.currentBalance).toBe(1500);
    expect(updatedBank?.currentBalance).toBe(10500);
  });

  // 15. Editing a transaction corrects balances
  it('15. Editing a transaction corrects balances', async () => {
    const evt = await FinancialLedgerService.recordEvent({
      userId: testUserId,
      eventType: 'expense',
      amount: 1000,
      eventDate: '2026-11-15',
      description: 'Typo Expense',
      accountId: bankA.id,
      paymentMethod: 'upi',
    });

    // Initial check: balance is 9000
    let acc = await db.accounts.get(bankA.id);
    expect(acc?.currentBalance).toBe(9000);

    // Edit transaction: corrected amount to 400
    await FinancialLedgerService.updateEvent(evt.id, testUserId, {
      amount: 400,
      description: 'Corrected Expense',
    });

    acc = await db.accounts.get(bankA.id);
    expect(acc?.currentBalance).toBe(9600); // 10000 - 400
  });

  // 16. Deleting a transaction preserves financial consistency
  it('16. Deleting a transaction preserves financial consistency', async () => {
    const evt = await FinancialLedgerService.recordEvent({
      userId: testUserId,
      eventType: 'expense',
      amount: 2500,
      eventDate: '2026-11-15',
      description: 'Cancelled Expense',
      accountId: bankA.id,
      paymentMethod: 'upi',
    });

    let acc = await db.accounts.get(bankA.id);
    expect(acc?.currentBalance).toBe(7500);

    // Delete event
    await FinancialLedgerService.deleteEvent(evt.id, testUserId);

    acc = await db.accounts.get(bankA.id);
    expect(acc?.currentBalance).toBe(10000); // Correctly restored!
  });

  // 17. Duplicate submission is prevented
  it('17. Duplicate submission is prevented', async () => {
    const clientId = 'unique-client-id-123';

    const evt1 = await FinancialLedgerService.recordEvent({
      userId: testUserId,
      eventType: 'expense',
      amount: 500,
      eventDate: '2026-11-15',
      description: 'Payment',
      accountId: bankA.id,
      paymentMethod: 'upi',
      clientId,
    });

    // Duplicate submission attempt with same clientId
    const evt2 = await FinancialLedgerService.recordEvent({
      userId: testUserId,
      eventType: 'expense',
      amount: 500,
      eventDate: '2026-11-15',
      description: 'Payment duplicate',
      accountId: bankA.id,
      paymentMethod: 'upi',
      clientId,
    });

    expect(evt1.id).toBe(evt2.id);

    const acc = await db.accounts.get(bankA.id);
    expect(acc?.currentBalance).toBe(9500); // Decreased only once!
  });

  // 18. Decimal currency handling is accurate
  it('18. Decimal currency handling is accurate', async () => {
    // 0.1 + 0.2 floating point pitfall test:
    // ₹10.10 + ₹20.20 = exactly ₹30.30
    await FinancialLedgerService.recordEvent({
      userId: testUserId,
      eventType: 'income',
      amount: 10.10,
      eventDate: '2026-11-15',
      description: 'Micro Dividend A',
      accountId: bankA.id,
      paymentMethod: 'bank_transfer',
    });

    await FinancialLedgerService.recordEvent({
      userId: testUserId,
      eventType: 'income',
      amount: 20.20,
      eventDate: '2026-11-15',
      description: 'Micro Dividend B',
      accountId: bankA.id,
      paymentMethod: 'bank_transfer',
    });

    const acc = await db.accounts.get(bankA.id);
    expect(acc?.currentBalance).toBe(10030.30);
  });
});
