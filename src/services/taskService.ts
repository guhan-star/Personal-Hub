import { db } from '@/lib/db';
import { generateUUID } from '@/utils';
import type { Task, TaskPriority, TaskStatus } from '@/types';

export class TaskService {
  static async createTask(params: {
    userId: string;
    title: string;
    description?: string;
    dueDate?: string;
    dueTime?: string;
    category?: string;
    priority?: TaskPriority;
    isCalendarSynced?: boolean;
  }): Promise<Task> {
    if (!params.title.trim()) throw new Error('Task title cannot be empty');

    const now = new Date().toISOString();
    const task: Task = {
      id: generateUUID(),
      userId: params.userId,
      title: params.title.trim(),
      description: params.description?.trim(),
      dueDate: params.dueDate,
      dueTime: params.dueTime,
      category: params.category || 'General',
      priority: params.priority || 'medium',
      status: 'todo',
      isCalendarSynced: Boolean(params.isCalendarSynced),
      createdAt: now,
      updatedAt: now,
    };

    await db.tasks.put(task);

    // If calendar synced and due date is provided, create calendar event automatically
    if (task.isCalendarSynced && task.dueDate) {
      await db.calendarEvents.put({
        id: generateUUID(),
        userId: params.userId,
        title: `Task: ${task.title}`,
        description: task.description,
        eventDate: task.dueDate,
        startTime: task.dueTime || '09:00',
        endTime: task.dueTime ? `${parseInt(task.dueTime.split(':')[0]) + 1}:00` : '10:00',
        category: 'task',
        reminderMinutes: 15,
        linkedTaskId: task.id,
        createdAt: now,
        updatedAt: now,
      });
    }

    return task;
  }

  static async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    const existing = await db.tasks.get(id);
    if (!existing) throw new Error('Task not found');

    const updated: Task = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    if (updates.status === 'completed' && existing.status !== 'completed') {
      updated.completedAt = new Date().toISOString();
    } else if (updates.status && updates.status !== 'completed') {
      updated.completedAt = undefined;
    }

    await db.tasks.put(updated);
    return updated;
  }

  static async deleteTask(id: string): Promise<void> {
    await db.calendarEvents.where('linkedTaskId').equals(id).delete();
    await db.tasks.delete(id);
  }

  static async getTasks(userId: string): Promise<Task[]> {
    return await db.tasks.where('userId').equals(userId).toArray();
  }

  static categorizeTasks(tasks: Task[]) {
    const today = new Date().toISOString().split('T')[0];

    const todayTasks: Task[] = [];
    const upcomingTasks: Task[] = [];
    const overdueTasks: Task[] = [];
    const completedTasks: Task[] = [];

    for (const t of tasks) {
      if (t.status === 'completed') {
        completedTasks.push(t);
      } else if (!t.dueDate) {
        upcomingTasks.push(t);
      } else if (t.dueDate === today) {
        todayTasks.push(t);
      } else if (t.dueDate < today) {
        overdueTasks.push(t);
      } else {
        upcomingTasks.push(t);
      }
    }

    return { todayTasks, upcomingTasks, overdueTasks, completedTasks, allTasks: tasks };
  }
}
