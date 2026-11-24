# PersonalHub

> **"One place for everything you save, earn, spend, plan and learn."**

PersonalHub is a unified personal productivity and financial management platform designed for desktop browsers, Android smartphones, tablets, and as an installable Progressive Web App (PWA). It brings together knowledge capture, double-entry financial tracking, task management, study curriculum tracking, personal goals, wishlist planning, and calendar events into one digital headquarters.

---

## 🌟 Key Features & Modules

### 1. 🏠 Central Dashboard
- **Time-Aware Greeting & Date**: Contextual Indian time-based greeting (`Good morning`, `Good afternoon`, `Good evening`) with localized date display.
- **Derived Financial Summary**: Total available balance, monthly income, monthly expenses, outstanding receivables (money lent), and payables (money borrowed)—all dynamically calculated from actual ledger entries.
- **Quick Action Center**: Rapid entry shortcuts for expenses, income, account transfers, loans, BrainVault content, tasks, and calendar events.
- **Interactive Visualizations**: Real-time Recharts visualizations (Monthly Income vs. Outflow, Category Distribution, Spending Trends).
- **Consolidated Personal Feed**: Today's tasks with one-click completion, upcoming calendar events, active goals, and recent BrainVault saves.

### 2. 💳 SpendWise — Financial Ledger System
- **Real Double-Entry Accounting**: Backed by atomic balance updates and audit logs.
- **Account Management**: Supports Cash in Hand, Savings Bank Accounts, Current Accounts, UPI-Linked Accounts, and Digital Wallets with opening balances.
- **All 9 Financial Event Types**:
  1. **Income**: Increases account balance and monthly income.
  2. **Expense**: Decreases account balance and tracks category spending.
  3. **Account Transfers**: Atomic debit from source and credit to destination without altering net worth or income/expense figures.
  4. **Lending (Receivables)**: Decreases account balance and creates/updates a loan asset.
  5. **Borrowing (Payables)**: Increases account balance and creates/updates a loan liability.
  6. **Loan Repayments**: Strict validation ensuring repayments never exceed outstanding balances, with automatic status updates (`active` ➔ `repaid`).
  7. **Refunds**: Credited back to source account and nets against monthly expense rather than registering as unrelated income.
  8. **Cash Withdrawals**: Internal transfer from Bank account to Cash in Hand.
  9. **Cash Deposits**: Internal transfer from Cash in Hand to Bank account.
- **Transaction Editing & Deletion**: Reverses previous balance impacts to maintain financial consistency.
- **Precision Currency Arithmetic**: Converts Rupee amounts to integer Paise during operations to eliminate IEEE-754 floating-point errors.
- **Idempotency Protection**: Client ID tokens prevent duplicate submissions upon network retries.

### 3. 🧠 BrainVault — Knowledge Management
- **Universal Capture**: Web URLs, YouTube videos, Instagram posts, WhatsApp snippets, research notes, and documents.
- **Rule-Based Categorization**: Suggests folders (e.g. Technology, Finance, Education, Shopping) and tags based on URL host and title.
- **Duplicate URL Detection**: Identifies already-saved URLs and prompts the user with options to open the existing item, save a duplicate intentionally, or cancel.
- **Folder & Tag Organization**: Custom folder colors, icons, tag filters, and pinned items.

### 4. 📝 Task Manager
- **Smart Views**: Today's tasks, Upcoming, Overdue, Completed, and All tasks.
- **Priority & Status**: Low, Medium, High, and Urgent priority tags with instant completion toggles.
- **Calendar Synchronization**: Optional automatic scheduling of task due dates onto the internal Calendar.

### 5. 🎓 StudySpace
- **Curriculum Architecture**: Organize subjects, learning modules, and topics.
- **Progress Tracking**: Granular progress percentages with visual progress bars.
- **Deep Study Notes**: Write markdown notes attached to specific study topics and linked to BrainVault references.

### 6. 🎯 Goals & Wishlist
- **Milestone Goals**: Track targets across categories (learning, health, projects, gadgets) with percentage completion.
- **Financial Savings Goals**: Dedicated reserve targets in INR (₹) linked to financial accounts without falsely treating progress as money movement.
- **Wishlist**: Track items with priorities, store URLs, expected prices, and progressive statuses (`Want`, `Planning`, `Saving`, `Purchased`).

### 7. 📅 Calendar & Schedule
- **Interactive Month Grid & Day Agenda**: Full calendar navigation with today indicator and day-specific event breakdown.
- **Task Deadlines Overlay**: View scheduled calendar meetings alongside task deadlines.

### 8. 🔍 Universal Search (`Ctrl+K` / `Cmd+K`)
- **Cross-Module Query**: Searches across BrainVault, SpendWise transactions, people, tasks, study notes, goals, wishlist items, and calendar events with filter chips.

### 9. ⚙️ Settings, Themes & Data Ownership
- **Themes**: Genuine Light mode, Dark mode, and System preference.
- **Data Export**: Export individual modules (Transactions, Accounts, Loans, Tasks, Goals) to CSV and full structured backups to JSON.
- **Offline / Local Demo Engine**: Seamlessly runs with browser IndexedDB (Dexie.js) when Supabase is not configured, with one-click demo data reset.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Vite 8, React Router DOM 7
- **Styling & UI**: Tailwind CSS 3.4, Lucide React icons, Inter font
- **Charts**: Recharts (Responsive bar, pie/donut, and smooth line charts)
- **Database & Sync**:
  - Cloud: Supabase (PostgreSQL, Row Level Security, RPC Functions)
  - Local/Offline: Dexie.js (IndexedDB) with synchronization queue
- **State & Query**: TanStack React Query v5, React Context (Auth, Theme, Sync)
- **Utilities**: date-fns, clsx, tailwind-merge
- **Testing**: Vitest, React Testing Library, fake-indexeddb

---

## 📂 Project Architecture

```
Personal Hub v2/
├── index.html                 # App shell & PWA manifest links
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── vite.config.ts             # Vite & Vitest configuration
├── tailwind.config.js         # Unified visual palette & module colors
├── postcss.config.js
├── public/
│   └── manifest.json          # PWA configuration
├── supabase/
│   ├── migrations/
│   │   ├── 001_initial_schema.sql             # Full tables, constraints, RLS policies
│   │   └── 002_financial_ledger_functions.sql # Atomic ledger transaction RPC
│   └── seed.sql                               # Realistic sample Indian demo data
├── src/
│   ├── types/                 # Strict TypeScript domain interfaces
│   ├── utils/                 # INR formatter, date-fns helpers, paise math, CSV/JSON exporters
│   ├── lib/
│   │   ├── db.ts              # Dexie IndexedDB client & demo data seeder
│   │   └── supabase.ts        # Supabase client connector
│   ├── services/
│   │   ├── financialLedgerService.ts  # Double-entry transaction engine
│   │   ├── brainVaultService.ts       # Knowledge base & duplicate detection
│   │   ├── taskService.ts             # Task CRUD & categorization
│   │   ├── studyService.ts            # Subjects & topics progress tracker
│   │   ├── goalWishlistService.ts     # Goals & wishlist service
│   │   ├── calendarService.ts         # Calendar events & schedule
│   │   ├── searchService.ts           # Cross-module universal search
│   │   ├── syncService.ts             # Offline queue processor
│   │   └── exportService.ts           # CSV and JSON backup exports
│   ├── context/
│   │   ├── AuthContext.tsx    # Supabase session / Offline Demo handler
│   │   ├── ThemeContext.tsx   # Light, Dark, System theme manager
│   │   └── SyncContext.tsx    # Online/offline detector and queue trigger
│   ├── components/
│   │   ├── ui/                # Button, Input, Select, Modal, Badge, Card, EmptyState
│   │   ├── layout/            # AppLayout, DesktopSidebar, MobileBottomNav, TopNavbar, QuickActionModal
│   │   └── charts/            # IncomeExpenseChart, CategoryDonutChart, SpendingTrendChart
│   ├── features/
│   │   ├── dashboard/         # HomeDashboard
│   │   ├── spendwise/         # SpendWisePage (Transactions, Accounts, Loans, Analytics)
│   │   ├── brainvault/        # BrainVaultPage (Items, Folders, Tags, Duplicate Warnings)
│   │   ├── tasks/             # TasksPage (Today, Upcoming, Overdue, Priority filtering)
│   │   ├── studyspace/        # StudySpacePage (Subjects, Topics, Progress, Notes)
│   │   ├── goals/             # GoalsWishlistPage (Goals & Wishlist tabs)
│   │   ├── calendar/          # CalendarPage (Monthly grid, agenda, task overlay)
│   │   ├── search/            # UniversalSearchModal
│   │   ├── settings/          # SettingsPage (Profile, theme, exports, Supabase setup)
│   │   └── auth/              # LoginPage
│   ├── App.tsx                # Route tree
│   ├── main.tsx
│   └── index.css              # Tailwind base, dark mode, typography & scrollbars
└── tests/
    └── unit/
        ├── financialLedger.test.ts  # 18 financial ledger unit tests
        ├── productivity.test.ts     # BrainVault, Tasks, Study, Goals, Search tests
        └── ui.test.tsx              # Component rendering & currency format tests
```

---

## 🚀 How to Run Locally

### Prerequisites
- Node.js (v18+ or v24 recommended)
- npm

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser. The application will immediately launch in **Local Demo Mode** with persistent IndexedDB storage pre-seeded with realistic sample records (HDFC Bank, SBI UPI, Cash in Hand, BrainVault links, Tasks, StudySpace topics, Goals, and Calendar items).

### 3. Run Automated Tests
```bash
npm test
```
Executes all 26 unit and domain tests using Vitest:
- **18 / 18** Financial Ledger acceptance criteria
- **5 / 5** Productivity & Knowledge domain tests
- **3 / 3** UI formatting & layout tests

### 4. Build for Production
```bash
npm run build
```

---

## 🗄️ Supabase Cloud Configuration (Optional)

To connect PersonalHub to your own hosted Supabase PostgreSQL project:

1. Create a project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in the Supabase Dashboard.
3. Run `supabase/migrations/001_initial_schema.sql` to create all tables and Row Level Security (RLS) policies.
4. Run `supabase/migrations/002_financial_ledger_functions.sql` to deploy the atomic ledger transaction function.
5. In your project root, create a `.env` file from `.env.example`:
   ```env
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   VITE_APP_NAME=PersonalHub
   VITE_DEFAULT_CURRENCY=INR
   VITE_DEFAULT_LOCALE=en-IN
   ```
6. Restart the development server. The application will automatically detect your Supabase credentials and activate remote cloud synchronization.
