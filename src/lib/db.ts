import Dexie, { type Table } from 'dexie';
import type {
  FinancialAccount,
  FinancialEvent,
  AccountEntry,
  Loan,
  Person,
  TransactionCategory,
  Folder,
  Tag,
  SavedItem,
  Task,
  Subject,
  StudyTopic,
  StudyNote,
  Goal,
  WishlistItem,
  CalendarEvent,
  SyncQueueItem,
  AuditEvent,
  UserProfile,
  UserSettings,
} from '@/types';

export class PersonalHubDatabase extends Dexie {
  profiles!: Table<UserProfile, string>;
  userSettings!: Table<UserSettings, string>;
  accounts!: Table<FinancialAccount, string>;
  categories!: Table<TransactionCategory, string>;
  people!: Table<Person, string>;
  loans!: Table<Loan, string>;
  events!: Table<FinancialEvent, string>;
  entries!: Table<AccountEntry, string>;
  folders!: Table<Folder, string>;
  tags!: Table<Tag, string>;
  savedItems!: Table<SavedItem, string>;
  tasks!: Table<Task, string>;
  subjects!: Table<Subject, string>;
  topics!: Table<StudyTopic, string>;
  studyNotes!: Table<StudyNote, string>;
  goals!: Table<Goal, string>;
  wishlist!: Table<WishlistItem, string>;
  calendarEvents!: Table<CalendarEvent, string>;
  syncQueue!: Table<SyncQueueItem, string>;
  auditEvents!: Table<AuditEvent, string>;

  constructor() {
    super('PersonalHubDB');
    this.version(1).stores({
      profiles: 'id, email',
      userSettings: 'userId',
      accounts: 'id, userId, accountType, isActive',
      categories: 'id, userId, type',
      people: 'id, userId, name',
      loans: 'id, userId, personId, type, status',
      events: 'id, userId, eventType, eventDate, accountId, categoryId, personId, loanId, clientId, syncStatus',
      entries: 'id, userId, eventId, accountId',
      folders: 'id, userId, name',
      tags: 'id, userId, name',
      savedItems: 'id, userId, folderId, contentType, url, isPinned, isArchived, *tags',
      tasks: 'id, userId, status, priority, dueDate',
      subjects: 'id, userId, name',
      topics: 'id, userId, subjectId, status',
      studyNotes: 'id, userId, subjectId, topicId',
      goals: 'id, userId, status, isFinancial',
      wishlist: 'id, userId, status, priority',
      calendarEvents: 'id, userId, eventDate, category',
      syncQueue: 'id, status, entityType, createdAt',
      auditEvents: 'id, userId, entityType, entityId, createdAt',
    });
  }
}

export const db = new PersonalHubDatabase();

// Default demo user ID
export const DEMO_USER_ID = 'demo-user-0000-0000-0000-000000000001';

/**
 * Seed initial local data into IndexedDB if empty or requested
 */
export async function seedLocalDatabase(force = false) {
  const accountCount = await db.accounts.count();
  if (accountCount > 0 && !force) {
    return; // Already populated
  }

  if (force) {
    await db.accounts.clear();
    await db.categories.clear();
    await db.people.clear();
    await db.loans.clear();
    await db.events.clear();
    await db.entries.clear();
    await db.folders.clear();
    await db.tags.clear();
    await db.savedItems.clear();
    await db.tasks.clear();
    await db.subjects.clear();
    await db.topics.clear();
    await db.studyNotes.clear();
    await db.goals.clear();
    await db.wishlist.clear();
    await db.calendarEvents.clear();
    await db.syncQueue.clear();
  }

  const now = new Date().toISOString();
  const today = new Date().toISOString().split('T')[0];

  // 1. Profile
  await db.profiles.put({
    id: DEMO_USER_ID,
    displayName: 'Aarav Sharma',
    email: 'aarav.sharma@personalhub.local',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    currency: 'INR',
    language: 'en',
    theme: 'system',
    timezone: 'Asia/Kolkata',
    createdAt: now,
    updatedAt: now,
  });

  await db.userSettings.put({
    userId: DEMO_USER_ID,
    dateFormat: 'dd/MM/yyyy',
    timeFormat: '12h',
    weekStartsOn: 1,
    notificationsEnabled: true,
    taskReminders: true,
    calendarReminders: true,
    demoModeEnabled: true,
  });

  // 2. Accounts
  const accHdfc = 'acc-hdfc-01';
  const accSbi = 'acc-sbi-02';
  const accCash = 'acc-cash-03';
  const accPaytm = 'acc-paytm-04';

  await db.accounts.bulkPut([
    {
      id: accHdfc,
      userId: DEMO_USER_ID,
      name: 'HDFC Salary Account',
      accountType: 'savings_bank',
      openingBalance: 45000,
      currentBalance: 78500,
      institution: 'HDFC Bank',
      description: 'Primary salary credit & bill payment account',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: accSbi,
      userId: DEMO_USER_ID,
      name: 'SBI Savings & UPI',
      accountType: 'upi_linked',
      openingBalance: 12000,
      currentBalance: 19400,
      institution: 'State Bank of India',
      description: 'UPI QR scans and everyday personal expenses',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: accCash,
      userId: DEMO_USER_ID,
      name: 'Cash in Hand',
      accountType: 'cash',
      openingBalance: 5000,
      currentBalance: 3200,
      institution: 'Physical Wallet',
      description: 'Cash notes for local purchases',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: accPaytm,
      userId: DEMO_USER_ID,
      name: 'Paytm Wallet',
      accountType: 'digital_wallet',
      openingBalance: 1500,
      currentBalance: 850,
      institution: 'Paytm',
      description: 'Transit, fastag and quick micro-payments',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  ]);

  // 3. Categories
  await db.categories.bulkPut([
    { id: 'cat-food', userId: DEMO_USER_ID, name: 'Food & Dining', type: 'expense', icon: 'Utensils', color: '#E56B73', isDefault: true },
    { id: 'cat-shop', userId: DEMO_USER_ID, name: 'Shopping', type: 'expense', icon: 'ShoppingBag', color: '#8E83F5', isDefault: true },
    { id: 'cat-travel', userId: DEMO_USER_ID, name: 'Travel & Commute', type: 'expense', icon: 'Car', color: '#5599E8', isDefault: true },
    { id: 'cat-bills', userId: DEMO_USER_ID, name: 'Bills & Utilities', type: 'expense', icon: 'Receipt', color: '#F59E0B', isDefault: true },
    { id: 'cat-edu', userId: DEMO_USER_ID, name: 'Education & Courses', type: 'expense', icon: 'GraduationCap', color: '#7167E8', isDefault: true },
    { id: 'cat-salary', userId: DEMO_USER_ID, name: 'Salary', type: 'income', icon: 'Briefcase', color: '#22A879', isDefault: true },
    { id: 'cat-freelance', userId: DEMO_USER_ID, name: 'Freelance & Projects', type: 'income', icon: 'Code', color: '#10B981', isDefault: true },
    { id: 'cat-interest', userId: DEMO_USER_ID, name: 'Interest & Dividends', type: 'income', icon: 'TrendingUp', color: '#0D9488', isDefault: true },
  ]);

  // 4. People
  const personRahul = 'person-rahul-01';
  const personArun = 'person-arun-02';

  await db.people.bulkPut([
    { id: personRahul, userId: DEMO_USER_ID, name: 'Rahul Verma', phone: '+91 98765 43210', email: 'rahul@example.com', notes: 'Colleague from work', createdAt: now },
    { id: personArun, userId: DEMO_USER_ID, name: 'Arun Kumar', phone: '+91 98765 12345', email: 'arun@example.com', notes: 'College friend', createdAt: now },
  ]);

  // 5. Loans
  const loanArun = 'loan-arun-01'; // lent money to Arun
  const loanRahul = 'loan-rahul-02'; // borrowed money from Rahul

  await db.loans.bulkPut([
    {
      id: loanArun,
      userId: DEMO_USER_ID,
      personId: personArun,
      type: 'lend',
      amount: 4000,
      repaidAmount: 1500,
      outstandingAmount: 2500,
      status: 'active',
      dueDate: '2026-12-01',
      notes: 'Lent for exam application fees',
      createdAt: now,
      updatedAt: now,
      personName: 'Arun Kumar',
    },
    {
      id: loanRahul,
      userId: DEMO_USER_ID,
      personId: personRahul,
      type: 'borrow',
      amount: 2000,
      repaidAmount: 0,
      outstandingAmount: 2000,
      status: 'active',
      dueDate: '2026-11-25',
      notes: 'Borrowed for urgent team gift contribution',
      createdAt: now,
      updatedAt: now,
      personName: 'Rahul Verma',
    },
  ]);

  // 6. Financial Events & History
  await db.events.bulkPut([
    {
      id: 'evt-01',
      userId: DEMO_USER_ID,
      eventType: 'income',
      amount: 85000,
      eventDate: today,
      description: 'Monthly Tech Salary Credit',
      accountId: accHdfc,
      categoryId: 'cat-salary',
      paymentMethod: 'bank_transfer',
      syncStatus: 'synced',
      createdAt: now,
      updatedAt: now,
      accountName: 'HDFC Salary Account',
      categoryName: 'Salary',
    },
    {
      id: 'evt-02',
      userId: DEMO_USER_ID,
      eventType: 'expense',
      amount: 2850,
      eventDate: today,
      description: 'Weekly Grocery & Organic Vegetables',
      accountId: accSbi,
      categoryId: 'cat-food',
      paymentMethod: 'upi',
      syncStatus: 'synced',
      createdAt: now,
      updatedAt: now,
      accountName: 'SBI Savings & UPI',
      categoryName: 'Food & Dining',
    },
    {
      id: 'evt-03',
      userId: DEMO_USER_ID,
      eventType: 'transfer',
      amount: 10000,
      eventDate: today,
      description: 'UPI Buffer top-up from HDFC to SBI',
      accountId: accHdfc,
      toAccountId: accSbi,
      paymentMethod: 'bank_transfer',
      syncStatus: 'synced',
      createdAt: now,
      updatedAt: now,
      accountName: 'HDFC Salary Account',
      toAccountName: 'SBI Savings & UPI',
    },
    {
      id: 'evt-04',
      userId: DEMO_USER_ID,
      eventType: 'lend',
      amount: 4000,
      eventDate: today,
      description: 'Lent to Arun for exam fee',
      accountId: accSbi,
      personId: personArun,
      loanId: loanArun,
      paymentMethod: 'upi',
      syncStatus: 'synced',
      createdAt: now,
      updatedAt: now,
      accountName: 'SBI Savings & UPI',
      personName: 'Arun Kumar',
    },
    {
      id: 'evt-05',
      userId: DEMO_USER_ID,
      eventType: 'loan_repayment',
      amount: 1500,
      eventDate: today,
      description: 'Partial repayment received from Arun',
      accountId: accSbi,
      personId: personArun,
      loanId: loanArun,
      paymentMethod: 'upi',
      syncStatus: 'synced',
      createdAt: now,
      updatedAt: now,
      accountName: 'SBI Savings & UPI',
      personName: 'Arun Kumar',
    },
    {
      id: 'evt-06',
      userId: DEMO_USER_ID,
      eventType: 'borrow',
      amount: 2000,
      eventDate: today,
      description: 'Borrowed from Rahul for group gift',
      accountId: accCash,
      personId: personRahul,
      loanId: loanRahul,
      paymentMethod: 'cash',
      syncStatus: 'synced',
      createdAt: now,
      updatedAt: now,
      accountName: 'Cash in Hand',
      personName: 'Rahul Verma',
    },
  ]);

  // 7. BrainVault Folders & Items
  const folderTech = 'folder-tech-01';
  const folderFin = 'folder-fin-02';
  const folderEdu = 'folder-edu-03';

  await db.folders.bulkPut([
    { id: folderTech, userId: DEMO_USER_ID, name: 'Technology', color: '#7167E8', icon: 'Code', isDefault: true, createdAt: now, updatedAt: now },
    { id: folderFin, userId: DEMO_USER_ID, name: 'Finance & Tax', color: '#22A879', icon: 'TrendingUp', isDefault: true, createdAt: now, updatedAt: now },
    { id: folderEdu, userId: DEMO_USER_ID, name: 'Study & Research', color: '#5599E8', icon: 'BookOpen', isDefault: true, createdAt: now, updatedAt: now },
    { id: 'folder-personal', userId: DEMO_USER_ID, name: 'Personal & Health', color: '#EC4899', icon: 'Heart', isDefault: true, createdAt: now, updatedAt: now },
  ]);

  await db.tags.bulkPut([
    { id: 'tag-react', userId: DEMO_USER_ID, name: 'React', color: '#38BDF8' },
    { id: 'tag-python', userId: DEMO_USER_ID, name: 'Python', color: '#FACC15' },
    { id: 'tag-tax', userId: DEMO_USER_ID, name: 'Tax 80C', color: '#4ADE80' },
    { id: 'tag-ai', userId: DEMO_USER_ID, name: 'AI Architecture', color: '#A855F7' },
  ]);

  await db.savedItems.bulkPut([
    {
      id: 'item-01',
      userId: DEMO_USER_ID,
      folderId: folderTech,
      title: 'Building Resilient Offline Web Apps with IndexedDB',
      contentType: 'url',
      url: 'https://web.dev/indexeddb-best-practices/',
      description: 'Crucial patterns for managing schema upgrades, transactions and atomic writes in client-side storage.',
      personalNote: 'Adopt transaction batching pattern for SpendWise sync queue.',
      isPinned: true,
      isArchived: false,
      tags: ['React', 'Architecture'],
      createdAt: now,
      updatedAt: now,
      folderName: 'Technology',
    },
    {
      id: 'item-02',
      userId: DEMO_USER_ID,
      folderId: folderFin,
      title: 'Complete Guide to New Tax Regime vs Old Regime in India',
      contentType: 'url',
      url: 'https://cleartax.in/s/new-tax-regime-vs-old-tax-regime',
      description: 'Deductions checklist for 80C, 80D, NPS (80CCD 1B) and home loan interest.',
      personalNote: 'Keep proof slips for mutual fund ELSS investments ready by January.',
      isPinned: true,
      isArchived: false,
      tags: ['Tax 80C', 'Finance'],
      createdAt: now,
      updatedAt: now,
      folderName: 'Finance & Tax',
    },
    {
      id: 'item-03',
      userId: DEMO_USER_ID,
      folderId: folderEdu,
      title: 'FastAPI and Modern Async Python Masterclass',
      contentType: 'youtube',
      url: 'https://www.youtube.com/watch?v=kCgGjBg4Bcw',
      description: 'Comprehensive 4-hour walkthrough of asyncio event loops and connection pooling.',
      personalNote: 'Watch sections on background tasks and exception handlers.',
      isPinned: false,
      isArchived: false,
      tags: ['Python'],
      createdAt: now,
      updatedAt: now,
      folderName: 'Study & Research',
    },
  ]);

  // 8. Tasks
  await db.tasks.bulkPut([
    {
      id: 'task-01',
      userId: DEMO_USER_ID,
      title: 'Pay BESCOM Electricity Bill',
      description: 'Clear consumer ID 8493021 via UPI before due date to avoid surcharge',
      dueDate: today,
      category: 'Bills',
      priority: 'high',
      status: 'todo',
      isCalendarSynced: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'task-02',
      userId: DEMO_USER_ID,
      title: 'Submit Tax Saving Investment Proofs',
      description: 'Upload PPF receipt and NPS tier-1 acknowledgment to company payroll portal',
      dueDate: today,
      category: 'Finance',
      priority: 'urgent',
      status: 'todo',
      isCalendarSynced: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'task-03',
      userId: DEMO_USER_ID,
      title: 'Review System Design Chapter 4',
      description: 'Read database indexing and B-Tree versus LSM-Tree storage engines',
      dueDate: '2026-11-18',
      category: 'Study',
      priority: 'medium',
      status: 'todo',
      isCalendarSynced: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'task-04',
      userId: DEMO_USER_ID,
      title: 'Schedule Annual Vehicle Servicing',
      description: 'Book morning slot with authorized service center',
      dueDate: '2026-11-20',
      category: 'Personal',
      priority: 'low',
      status: 'completed',
      completedAt: now,
      isCalendarSynced: false,
      createdAt: now,
      updatedAt: now,
    },
  ]);

  // 9. StudySpace
  const subPython = 'sub-python-01';
  const subFinance = 'sub-fin-02';

  await db.subjects.bulkPut([
    {
      id: subPython,
      userId: DEMO_USER_ID,
      name: 'Python Systems & Distributed Architecture',
      description: 'Concurrency, event-driven backends and database internals',
      accentColor: '#7167E8',
      icon: 'Code',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: subFinance,
      userId: DEMO_USER_ID,
      name: 'Personal Financial Engineering',
      description: 'Asset allocation, asset rebalancing and Indian tax efficiency',
      accentColor: '#22A879',
      icon: 'TrendingUp',
      createdAt: now,
      updatedAt: now,
    },
  ]);

  await db.topics.bulkPut([
    {
      id: 'topic-01',
      userId: DEMO_USER_ID,
      subjectId: subPython,
      name: 'AsyncIO & Concurrency Primitives',
      description: 'Coroutines, event loops, tasks, semaphore locks',
      status: 'in_progress',
      progressPercentage: 65,
      sortOrder: 1,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'topic-02',
      userId: DEMO_USER_ID,
      subjectId: subPython,
      name: 'PostgreSQL Connection Pooling & Transactions',
      description: 'ACID guarantees, isolation levels and connection pool tuning',
      status: 'not_started',
      progressPercentage: 20,
      sortOrder: 2,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'topic-03',
      userId: DEMO_USER_ID,
      subjectId: subFinance,
      name: 'Index Funds & Factor Investing in India',
      description: 'Nifty 50, Nifty Next 50, Alpha 50 momentum strategy',
      status: 'completed',
      progressPercentage: 100,
      sortOrder: 1,
      createdAt: now,
      updatedAt: now,
    },
  ]);

  await db.studyNotes.bulkPut([
    {
      id: 'note-01',
      userId: DEMO_USER_ID,
      subjectId: subPython,
      topicId: 'topic-01',
      title: 'Key Rules of Python Async Programming',
      content: '1. Never call blocking I/O functions (like time.sleep or requests.get) inside async coroutines.\n2. Always use asyncio.gather() with return_exceptions=True for fan-out queries.\n3. Keep background tasks referenced to prevent premature garbage collection.',
      linkedSavedItemIds: ['item-03'],
      createdAt: now,
      updatedAt: now,
    },
  ]);

  // 10. Goals
  const goalLaptop = 'goal-laptop-01';

  await db.goals.bulkPut([
    {
      id: goalLaptop,
      userId: DEMO_USER_ID,
      title: 'M3 MacBook Air Development Machine',
      description: 'Target: ₹1,15,000 savings in dedicated reserve account',
      category: 'Gadgets',
      targetValue: 115000,
      currentValue: 75000,
      unit: '₹',
      startDate: '2026-09-01',
      targetDate: '2026-12-31',
      status: 'active',
      isFinancial: true,
      linkedAccountId: accHdfc,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'goal-books-02',
      userId: DEMO_USER_ID,
      title: 'Read 12 Technical Architecture Books',
      description: 'Engineering leadership and distributed systems books',
      category: 'Learning',
      targetValue: 12,
      currentValue: 7,
      unit: 'books',
      startDate: '2026-01-01',
      targetDate: '2026-12-31',
      status: 'active',
      isFinancial: false,
      createdAt: now,
      updatedAt: now,
    },
  ]);

  // 11. Wishlist
  await db.wishlist.bulkPut([
    {
      id: 'wish-01',
      userId: DEMO_USER_ID,
      title: 'Sony WH-1000XM5 Wireless Headphones',
      description: 'Industry-leading noise cancellation for uninterrupted deep focus coding sessions.',
      expectedPrice: 26990,
      priority: 'high',
      category: 'Electronics',
      status: 'saving',
      productUrl: 'https://amazon.in/dp/B09XS7JWHH',
      linkedGoalId: goalLaptop,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'wish-02',
      userId: DEMO_USER_ID,
      title: 'Featherlite Ergonomic Mesh Task Chair',
      description: 'High-back ergonomic chair with adjustable 3D armrests and lumbar support.',
      expectedPrice: 14500,
      priority: 'medium',
      category: 'Home Office',
      status: 'want',
      productUrl: 'https://featherlitefurniture.com',
      createdAt: now,
      updatedAt: now,
    },
  ]);

  // 12. Calendar Events
  await db.calendarEvents.bulkPut([
    {
      id: 'cal-01',
      userId: DEMO_USER_ID,
      title: 'Quarterly Financial Planning & Rebalance',
      description: 'Review portfolio asset allocations, rebalance equity and debt mutual funds',
      eventDate: today,
      startTime: '10:00',
      endTime: '11:30',
      location: 'Home Office',
      category: 'finance',
      reminderMinutes: 15,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'cal-02',
      userId: DEMO_USER_ID,
      title: 'Python Systems Architecture Discussion',
      description: 'Online deep-dive on modern concurrent Python applications',
      eventDate: '2026-11-19',
      startTime: '18:00',
      endTime: '19:30',
      location: 'Google Meet',
      category: 'study',
      reminderMinutes: 30,
      createdAt: now,
      updatedAt: now,
    },
  ]);
}
