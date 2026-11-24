import { db } from '@/lib/db';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { generateUUID } from '@/utils';
import type { SyncQueueItem } from '@/types';

export class SyncService {
  /**
   * Enqueue an operation for background synchronization
   */
  static async enqueue(
    entityType: SyncQueueItem['entityType'],
    action: SyncQueueItem['action'],
    payload: any
  ): Promise<string> {
    const id = generateUUID();
    const now = new Date().toISOString();

    const item: SyncQueueItem = {
      id,
      entityType,
      action,
      payload,
      idempotencyKey: generateUUID(),
      status: 'pending',
      retryCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    await db.syncQueue.put(item);
    return id;
  }

  /**
   * Get count of pending operations
   */
  static async getPendingCount(): Promise<number> {
    return await db.syncQueue.where('status').equals('pending').count();
  }

  /**
   * Process all queued operations
   */
  static async processQueue(): Promise<{ processed: number; failed: number }> {
    if (!navigator.onLine || !isSupabaseConfigured || !supabase) {
      return { processed: 0, failed: 0 };
    }

    const pending = await db.syncQueue.where('status').equals('pending').toArray();
    let processed = 0;
    let failed = 0;

    for (const item of pending) {
      try {
        await db.syncQueue.update(item.id, { status: 'syncing', updatedAt: new Date().toISOString() });

        // Submit to Supabase table
        const tableName = this.mapEntityTypeToTable(item.entityType);
        if (tableName) {
          if (item.action === 'insert') {
            const { error } = await supabase.from(tableName).upsert(item.payload);
            if (error) throw error;
          } else if (item.action === 'update') {
            const { error } = await supabase.from(tableName).update(item.payload).eq('id', item.payload.id);
            if (error) throw error;
          } else if (item.action === 'delete') {
            const { error } = await supabase.from(tableName).delete().eq('id', item.payload.id);
            if (error) throw error;
          }
        }

        await db.syncQueue.update(item.id, {
          status: 'synced',
          updatedAt: new Date().toISOString(),
        });
        processed++;
      } catch (err: any) {
        failed++;
        await db.syncQueue.update(item.id, {
          status: 'failed',
          errorMessage: err?.message || 'Sync error',
          retryCount: item.retryCount + 1,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    return { processed, failed };
  }

  private static mapEntityTypeToTable(type: SyncQueueItem['entityType']): string | null {
    switch (type) {
      case 'financial_event': return 'financial_events';
      case 'task': return 'tasks';
      case 'saved_item': return 'saved_items';
      case 'goal': return 'goals';
      case 'study_note': return 'study_notes';
      case 'calendar_event': return 'calendar_events';
      default: return null;
    }
  }
}
