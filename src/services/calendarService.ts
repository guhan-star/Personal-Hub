import { db } from '@/lib/db';
import { generateUUID } from '@/utils';
import type { CalendarEvent } from '@/types';

export class CalendarService {
  static async getEvents(userId: string): Promise<CalendarEvent[]> {
    return await db.calendarEvents.where('userId').equals(userId).toArray();
  }

  static async createEvent(params: {
    userId: string;
    title: string;
    description?: string;
    eventDate: string;
    startTime?: string;
    endTime?: string;
    location?: string;
    category?: 'personal' | 'work' | 'study' | 'finance' | 'task' | 'other';
    reminderMinutes?: number;
    linkedTaskId?: string;
  }): Promise<CalendarEvent> {
    const now = new Date().toISOString();
    const event: CalendarEvent = {
      id: generateUUID(),
      userId: params.userId,
      title: params.title.trim(),
      description: params.description?.trim(),
      eventDate: params.eventDate,
      startTime: params.startTime || '09:00',
      endTime: params.endTime || '10:00',
      location: params.location?.trim(),
      category: params.category || 'personal',
      reminderMinutes: params.reminderMinutes ?? 15,
      linkedTaskId: params.linkedTaskId,
      createdAt: now,
      updatedAt: now,
    };
    await db.calendarEvents.put(event);
    return event;
  }

  static async updateEvent(id: string, updates: Partial<CalendarEvent>): Promise<CalendarEvent> {
    const existing = await db.calendarEvents.get(id);
    if (!existing) throw new Error('Calendar event not found');

    const updated: CalendarEvent = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    await db.calendarEvents.put(updated);
    return updated;
  }

  static async deleteEvent(id: string): Promise<void> {
    await db.calendarEvents.delete(id);
  }
}
