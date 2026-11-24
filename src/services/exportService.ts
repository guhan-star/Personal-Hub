import { db } from '@/lib/db';
import { exportToCSV, exportToJSON } from '@/utils';

export class ExportService {
  /**
   * Export individual module data to CSV
   */
  static async exportModuleToCSV(moduleName: 'transactions' | 'accounts' | 'loans' | 'tasks' | 'goals', userId: string) {
    const timestamp = new Date().toISOString().split('T')[0];

    switch (moduleName) {
      case 'transactions': {
        const events = await db.events.where('userId').equals(userId).toArray();
        exportToCSV(`personalhub_transactions_${timestamp}`, events);
        break;
      }
      case 'accounts': {
        const accounts = await db.accounts.where('userId').equals(userId).toArray();
        exportToCSV(`personalhub_accounts_${timestamp}`, accounts);
        break;
      }
      case 'loans': {
        const loans = await db.loans.where('userId').equals(userId).toArray();
        exportToCSV(`personalhub_loans_${timestamp}`, loans);
        break;
      }
      case 'tasks': {
        const tasks = await db.tasks.where('userId').equals(userId).toArray();
        exportToCSV(`personalhub_tasks_${timestamp}`, tasks);
        break;
      }
      case 'goals': {
        const goals = await db.goals.where('userId').equals(userId).toArray();
        exportToCSV(`personalhub_goals_${timestamp}`, goals);
        break;
      }
    }
  }

  /**
   * Complete structured backup export in JSON format
   */
  static async exportCompleteBackup(userId: string) {
    const timestamp = new Date().toISOString();
    const [
      profile,
      settings,
      accounts,
      categories,
      people,
      loans,
      events,
      entries,
      folders,
      tags,
      savedItems,
      tasks,
      subjects,
      topics,
      studyNotes,
      goals,
      wishlist,
      calendarEvents,
    ] = await Promise.all([
      db.profiles.get(userId),
      db.userSettings.get(userId),
      db.accounts.where('userId').equals(userId).toArray(),
      db.categories.where('userId').equals(userId).toArray(),
      db.people.where('userId').equals(userId).toArray(),
      db.loans.where('userId').equals(userId).toArray(),
      db.events.where('userId').equals(userId).toArray(),
      db.entries.where('userId').equals(userId).toArray(),
      db.folders.where('userId').equals(userId).toArray(),
      db.tags.where('userId').equals(userId).toArray(),
      db.savedItems.where('userId').equals(userId).toArray(),
      db.tasks.where('userId').equals(userId).toArray(),
      db.subjects.where('userId').equals(userId).toArray(),
      db.topics.where('userId').equals(userId).toArray(),
      db.studyNotes.where('userId').equals(userId).toArray(),
      db.goals.where('userId').equals(userId).toArray(),
      db.wishlist.where('userId').equals(userId).toArray(),
      db.calendarEvents.where('userId').equals(userId).toArray(),
    ]);

    const backupData = {
      version: '1.0.0',
      exportedAt: timestamp,
      application: 'PersonalHub',
      metadata: {
        totalAccounts: accounts.length,
        totalTransactions: events.length,
        totalSavedItems: savedItems.length,
        totalTasks: tasks.length,
      },
      data: {
        profile,
        settings,
        accounts,
        categories,
        people,
        loans,
        events,
        entries,
        folders,
        tags,
        savedItems,
        tasks,
        subjects,
        topics,
        studyNotes,
        goals,
        wishlist,
        calendarEvents,
      },
    };

    exportToJSON(`personalhub_full_backup_${timestamp.split('T')[0]}`, backupData);
  }
}
