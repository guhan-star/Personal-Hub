import { db } from '@/lib/db';
import { formatINR, formatDate } from '@/utils';
import type { UniversalSearchResult } from '@/types';

export class SearchService {
  static async searchAll(userId: string, query: string): Promise<Record<string, UniversalSearchResult[]>> {
    const q = query.trim().toLowerCase();
    if (!q) return {};

    const [items, events, tasks, notes, goals, wishlist, calendarEvents] = await Promise.all([
      db.savedItems.where('userId').equals(userId).toArray(),
      db.events.where('userId').equals(userId).toArray(),
      db.tasks.where('userId').equals(userId).toArray(),
      db.studyNotes.where('userId').equals(userId).toArray(),
      db.goals.where('userId').equals(userId).toArray(),
      db.wishlist.where('userId').equals(userId).toArray(),
      db.calendarEvents.where('userId').equals(userId).toArray(),
    ]);

    const results: Record<string, UniversalSearchResult[]> = {
      brainvault: [],
      spendwise: [],
      tasks: [],
      studyspace: [],
      goals: [],
      wishlist: [],
      calendar: [],
    };

    // 1. BrainVault
    for (const item of items) {
      const match =
        item.title.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        (item.url && item.url.toLowerCase().includes(q)) ||
        (item.personalNote && item.personalNote.toLowerCase().includes(q)) ||
        item.tags.some(t => t.toLowerCase().includes(q));

      if (match) {
        results.brainvault.push({
          id: item.id,
          module: 'brainvault',
          title: item.title,
          subtitle: item.url || item.contentType.toUpperCase(),
          description: item.description || item.personalNote,
          date: formatDate(item.createdAt),
          badge: item.contentType,
          badgeColor: '#8E83F5',
          url: item.url,
          rawItem: item,
        });
      }
    }

    // 2. SpendWise
    for (const evt of events) {
      const match =
        evt.description.toLowerCase().includes(q) ||
        (evt.notes && evt.notes.toLowerCase().includes(q)) ||
        evt.eventType.toLowerCase().includes(q) ||
        evt.paymentMethod.toLowerCase().includes(q);

      if (match) {
        results.spendwise.push({
          id: evt.id,
          module: 'spendwise',
          title: evt.description,
          subtitle: `${evt.eventType.toUpperCase()} • ${formatINR(evt.amount)}`,
          description: evt.notes,
          date: formatDate(evt.eventDate),
          badge: evt.eventType,
          badgeColor: evt.eventType === 'income' ? '#22A879' : '#E56B73',
          rawItem: evt,
        });
      }
    }

    // 3. Tasks
    for (const task of tasks) {
      const match =
        task.title.toLowerCase().includes(q) ||
        (task.description && task.description.toLowerCase().includes(q)) ||
        task.category.toLowerCase().includes(q);

      if (match) {
        results.tasks.push({
          id: task.id,
          module: 'tasks',
          title: task.title,
          subtitle: `${task.status} • Priority: ${task.priority}`,
          description: task.description,
          date: task.dueDate ? formatDate(task.dueDate) : undefined,
          badge: task.status,
          badgeColor: task.status === 'completed' ? '#22A879' : '#0D9488',
          rawItem: task,
        });
      }
    }

    // 4. StudySpace
    for (const note of notes) {
      const match =
        note.title.toLowerCase().includes(q) ||
        note.content.toLowerCase().includes(q);

      if (match) {
        results.studyspace.push({
          id: note.id,
          module: 'studyspace',
          title: note.title,
          subtitle: 'Study Note',
          description: note.content.slice(0, 150) + '...',
          date: formatDate(note.updatedAt),
          badge: 'Note',
          badgeColor: '#3B82F6',
          rawItem: note,
        });
      }
    }

    // 5. Goals
    for (const goal of goals) {
      const match =
        goal.title.toLowerCase().includes(q) ||
        (goal.description && goal.description.toLowerCase().includes(q)) ||
        goal.category.toLowerCase().includes(q);

      if (match) {
        results.goals.push({
          id: goal.id,
          module: 'goals',
          title: goal.title,
          subtitle: `${goal.category} • Progress: ${goal.currentValue}/${goal.targetValue} ${goal.unit}`,
          description: goal.description,
          date: goal.targetDate ? formatDate(goal.targetDate) : undefined,
          badge: goal.status,
          badgeColor: '#22A879',
          rawItem: goal,
        });
      }
    }

    // 6. Wishlist
    for (const wish of wishlist) {
      const match =
        wish.title.toLowerCase().includes(q) ||
        (wish.description && wish.description.toLowerCase().includes(q)) ||
        wish.category.toLowerCase().includes(q);

      if (match) {
        results.wishlist.push({
          id: wish.id,
          module: 'wishlist',
          title: wish.title,
          subtitle: `${wish.category} • ${formatINR(wish.expectedPrice)}`,
          description: wish.description,
          badge: wish.status,
          badgeColor: '#EC4899',
          url: wish.productUrl,
          rawItem: wish,
        });
      }
    }

    // 7. Calendar
    for (const cal of calendarEvents) {
      const match =
        cal.title.toLowerCase().includes(q) ||
        (cal.description && cal.description.toLowerCase().includes(q)) ||
        (cal.location && cal.location.toLowerCase().includes(q));

      if (match) {
        results.calendar.push({
          id: cal.id,
          module: 'calendar',
          title: cal.title,
          subtitle: `${cal.eventDate} ${cal.startTime} - ${cal.endTime}`,
          description: cal.description || cal.location,
          date: formatDate(cal.eventDate),
          badge: cal.category,
          badgeColor: '#F97316',
          rawItem: cal,
        });
      }
    }

    return results;
  }
}
