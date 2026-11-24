import { db } from '@/lib/db';
import { generateUUID } from '@/utils';
import type { Goal, WishlistItem } from '@/types';

export class GoalWishlistService {
  // Goals
  static async getGoals(userId: string): Promise<Goal[]> {
    return await db.goals.where('userId').equals(userId).toArray();
  }

  static async createGoal(params: {
    userId: string;
    title: string;
    description?: string;
    category?: string;
    targetValue: number;
    currentValue?: number;
    unit?: string;
    startDate?: string;
    targetDate?: string;
    isFinancial?: boolean;
    linkedAccountId?: string;
  }): Promise<Goal> {
    const now = new Date().toISOString();
    const goal: Goal = {
      id: generateUUID(),
      userId: params.userId,
      title: params.title.trim(),
      description: params.description?.trim(),
      category: params.category || 'Personal',
      targetValue: params.targetValue,
      currentValue: params.currentValue || 0,
      unit: params.unit || '%',
      startDate: params.startDate || new Date().toISOString().split('T')[0],
      targetDate: params.targetDate,
      status: (params.currentValue || 0) >= params.targetValue ? 'completed' : 'active',
      isFinancial: Boolean(params.isFinancial),
      linkedAccountId: params.linkedAccountId,
      createdAt: now,
      updatedAt: now,
    };
    await db.goals.put(goal);
    return goal;
  }

  static async updateGoalProgress(goalId: string, currentValue: number): Promise<Goal> {
    const goal = await db.goals.get(goalId);
    if (!goal) throw new Error('Goal not found');

    const status = currentValue >= goal.targetValue ? 'completed' : goal.status === 'completed' ? 'active' : goal.status;
    const updated: Goal = {
      ...goal,
      currentValue,
      status,
      updatedAt: new Date().toISOString(),
    };
    await db.goals.put(updated);
    return updated;
  }

  static async deleteGoal(goalId: string): Promise<void> {
    await db.wishlist.where('linkedGoalId').equals(goalId).modify({ linkedGoalId: undefined });
    await db.goals.delete(goalId);
  }

  // Wishlist
  static async getWishlist(userId: string): Promise<WishlistItem[]> {
    return await db.wishlist.where('userId').equals(userId).toArray();
  }

  static async createWishlistItem(params: {
    userId: string;
    title: string;
    description?: string;
    imageUrl?: string;
    productUrl?: string;
    expectedPrice: number;
    priority?: 'low' | 'medium' | 'high';
    category?: string;
    status?: 'want' | 'planning' | 'saving' | 'purchased' | 'cancelled';
    linkedGoalId?: string;
    notes?: string;
  }): Promise<WishlistItem> {
    const now = new Date().toISOString();
    const item: WishlistItem = {
      id: generateUUID(),
      userId: params.userId,
      title: params.title.trim(),
      description: params.description?.trim(),
      imageUrl: params.imageUrl,
      productUrl: params.productUrl,
      expectedPrice: params.expectedPrice || 0,
      priority: params.priority || 'medium',
      category: params.category || 'General',
      status: params.status || 'want',
      linkedGoalId: params.linkedGoalId,
      notes: params.notes,
      createdAt: now,
      updatedAt: now,
    };
    await db.wishlist.put(item);
    return item;
  }

  static async updateWishlistItem(id: string, updates: Partial<WishlistItem>): Promise<WishlistItem> {
    const existing = await db.wishlist.get(id);
    if (!existing) throw new Error('Wishlist item not found');

    const updated: WishlistItem = {
      ...existing,
      ...updates,
      purchasedDate: updates.status === 'purchased' ? new Date().toISOString().split('T')[0] : existing.purchasedDate,
      updatedAt: new Date().toISOString(),
    };
    await db.wishlist.put(updated);
    return updated;
  }

  static async deleteWishlistItem(id: string): Promise<void> {
    await db.wishlist.delete(id);
  }
}
