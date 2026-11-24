// ==============================================================================
// PERSONALHUB TYPES
// Strict TypeScript domain definitions
// ==============================================================================

export type ThemeMode = 'light' | 'dark' | 'system';

export interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  avatarUrl?: string;
  currency: string;
  language: string;
  theme: ThemeMode;
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserSettings {
  id?: string;
  userId: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  weekStartsOn: 0 | 1 | 6; // 0=Sun, 1=Mon, 6=Sat
  notificationsEnabled: boolean;
  taskReminders: boolean;
  calendarReminders: boolean;
  defaultAccountId?: string;
  demoModeEnabled: boolean;
}

// ------------------------------------------------------------------------------
// SPENDWISE TYPES
// ------------------------------------------------------------------------------

export type AccountType = 
  | 'cash' 
  | 'savings_bank' 
  | 'current_bank' 
  | 'upi_linked' 
  | 'digital_wallet' 
  | 'other';

export interface FinancialAccount {
  id: string;
  userId: string;
  name: string;
  accountType: AccountType;
  openingBalance: number; // in INR (stored as number with 2 decimal precision)
  currentBalance: number;
  institution?: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type FinancialEventType = 
  | 'income' 
  | 'expense' 
  | 'transfer' 
  | 'lend' 
  | 'borrow' 
  | 'loan_repayment' 
  | 'refund' 
  | 'cash_withdrawal' 
  | 'cash_deposit';

export type PaymentMethod = 'cash' | 'upi' | 'bank_transfer' | 'card' | 'wallet' | 'other';

export interface TransactionCategory {
  id: string;
  userId: string;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
  isDefault: boolean;
}

export interface Person {
  id: string;
  userId: string;
  name: string;
  phone?: string;
  email?: string;
  notes?: string;
  createdAt: string;
}

export interface Loan {
  id: string;
  userId: string;
  personId: string;
  type: 'lend' | 'borrow'; // 'lend': user gave money (receivable); 'borrow': user took money (payable)
  amount: number;
  repaidAmount: number;
  outstandingAmount: number;
  status: 'active' | 'repaid' | 'forgiven';
  dueDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  // Join fields
  personName?: string;
}

export interface FinancialEvent {
  id: string;
  userId: string;
  eventType: FinancialEventType;
  amount: number;
  eventDate: string; // YYYY-MM-DD
  description: string;
  notes?: string;
  categoryId?: string;
  accountId: string;
  toAccountId?: string;
  personId?: string;
  loanId?: string;
  originalEventId?: string;
  paymentMethod: PaymentMethod;
  attachmentUrl?: string;
  clientId?: string;
  createdAt: string;
  updatedAt: string;
  syncStatus?: 'synced' | 'pending' | 'failed' | 'conflict';
  // Join fields
  accountName?: string;
  toAccountName?: string;
  categoryName?: string;
  categoryColor?: string;
  personName?: string;
}

export interface AccountEntry {
  id: string;
  userId: string;
  eventId: string;
  accountId: string;
  entryType: 'debit' | 'credit';
  amount: number;
  createdAt: string;
}

// ------------------------------------------------------------------------------
// BRAINVAULT TYPES
// ------------------------------------------------------------------------------

export type ContentType = 
  | 'url' 
  | 'youtube' 
  | 'instagram' 
  | 'whatsapp' 
  | 'image' 
  | 'pdf' 
  | 'document' 
  | 'note' 
  | 'other';

export interface Folder {
  id: string;
  userId: string;
  name: string;
  color: string;
  icon: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  itemCount?: number;
}

export interface Tag {
  id: string;
  userId: string;
  name: string;
  color: string;
}

export interface SavedItem {
  id: string;
  userId: string;
  folderId?: string;
  title: string;
  contentType: ContentType;
  url?: string;
  description?: string;
  personalNote?: string;
  attachmentUrl?: string;
  fileName?: string;
  fileSize?: number;
  sourceApp?: string;
  isPinned: boolean;
  isArchived: boolean;
  tags: string[]; // tag names or IDs
  createdAt: string;
  updatedAt: string;
  // Join fields
  folderName?: string;
}

// ------------------------------------------------------------------------------
// PRODUCTIVITY MODULES TYPES
// ------------------------------------------------------------------------------

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'cancelled';

export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  dueDate?: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm
  category: string;
  priority: TaskPriority;
  status: TaskStatus;
  completedAt?: string;
  isCalendarSynced: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Subject {
  id: string;
  userId: string;
  name: string;
  description?: string;
  accentColor: string;
  icon: string;
  createdAt: string;
  updatedAt: string;
  topicCount?: number;
  averageProgress?: number;
}

export interface StudyTopic {
  id: string;
  userId: string;
  subjectId: string;
  name: string;
  description?: string;
  status: 'not_started' | 'in_progress' | 'completed';
  progressPercentage: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface StudyNote {
  id: string;
  userId: string;
  subjectId: string;
  topicId?: string;
  title: string;
  content: string;
  linkedSavedItemIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  description?: string;
  category: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  startDate: string;
  targetDate?: string;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  isFinancial: boolean;
  linkedAccountId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WishlistItem {
  id: string;
  userId: string;
  title: string;
  description?: string;
  imageUrl?: string;
  productUrl?: string;
  expectedPrice: number;
  priority: 'low' | 'medium' | 'high';
  category: string;
  status: 'want' | 'planning' | 'saving' | 'purchased' | 'cancelled';
  linkedGoalId?: string;
  notes?: string;
  purchasedDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEvent {
  id: string;
  userId: string;
  title: string;
  description?: string;
  eventDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  location?: string;
  category: 'personal' | 'work' | 'study' | 'finance' | 'task' | 'other';
  reminderMinutes: number;
  linkedTaskId?: string;
  createdAt: string;
  updatedAt: string;
}

// ------------------------------------------------------------------------------
// OFFLINE & INFRASTRUCTURE TYPES
// ------------------------------------------------------------------------------

export interface SyncQueueItem {
  id: string;
  entityType: 'financial_event' | 'task' | 'saved_item' | 'goal' | 'study_note' | 'calendar_event';
  action: 'insert' | 'update' | 'delete';
  payload: any;
  idempotencyKey: string;
  status: 'pending' | 'syncing' | 'synced' | 'failed' | 'conflict';
  retryCount: number;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditEvent {
  id: string;
  userId: string;
  entityType: string;
  entityId: string;
  action: 'create' | 'update' | 'delete' | 'reverse';
  beforeState?: any;
  afterState?: any;
  createdAt: string;
}

export interface UniversalSearchResult {
  id: string;
  module: 'spendwise' | 'brainvault' | 'tasks' | 'studyspace' | 'goals' | 'wishlist' | 'calendar';
  title: string;
  subtitle: string;
  description?: string;
  date?: string;
  badge?: string;
  badgeColor?: string;
  url?: string;
  rawItem: any;
}
