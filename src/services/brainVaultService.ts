import { db } from '@/lib/db';
import { generateUUID, suggestCategory } from '@/utils';
import type { Folder, SavedItem, Tag, ContentType } from '@/types';

export class BrainVaultService {
  /**
   * Check if a URL has already been saved by this user
   */
  static async checkDuplicateUrl(userId: string, url: string): Promise<SavedItem | null> {
    if (!url || !url.trim()) return null;
    const normalizedUrl = url.trim().toLowerCase();
    const items = await db.savedItems.where('userId').equals(userId).toArray();
    const match = items.find(i => i.url && i.url.trim().toLowerCase() === normalizedUrl);
    return match || null;
  }

  /**
   * Save a new item to BrainVault
   */
  static async saveItem(params: {
    userId: string;
    title: string;
    contentType: ContentType;
    url?: string;
    description?: string;
    personalNote?: string;
    folderId?: string;
    tags?: string[];
    attachmentUrl?: string;
    fileName?: string;
    fileSize?: number;
    sourceApp?: string;
    isPinned?: boolean;
  }): Promise<SavedItem> {
    const now = new Date().toISOString();
    const id = generateUUID();

    // Auto categorize if folder is not set
    let resolvedFolderId = params.folderId;
    let resolvedTags = params.tags || [];

    if (!resolvedFolderId && params.url) {
      const suggestion = suggestCategory(params.url, params.title);
      const folders = await db.folders.where('userId').equals(params.userId).toArray();
      const matchedFolder = folders.find(f => f.name.toLowerCase() === suggestion.folder.toLowerCase());
      if (matchedFolder) {
        resolvedFolderId = matchedFolder.id;
      }
      if (resolvedTags.length === 0) {
        resolvedTags = suggestion.tags;
      }
    }

    const item: SavedItem = {
      id,
      userId: params.userId,
      folderId: resolvedFolderId,
      title: params.title.trim(),
      contentType: params.contentType,
      url: params.url?.trim(),
      description: params.description?.trim(),
      personalNote: params.personalNote?.trim(),
      attachmentUrl: params.attachmentUrl,
      fileName: params.fileName,
      fileSize: params.fileSize,
      sourceApp: params.sourceApp,
      isPinned: Boolean(params.isPinned),
      isArchived: false,
      tags: resolvedTags,
      createdAt: now,
      updatedAt: now,
    };

    await db.savedItems.put(item);
    return item;
  }

  /**
   * Update an existing saved item
   */
  static async updateItem(id: string, updates: Partial<SavedItem>): Promise<SavedItem> {
    const existing = await db.savedItems.get(id);
    if (!existing) throw new Error('Saved item not found');

    const updated: SavedItem = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await db.savedItems.put(updated);
    return updated;
  }

  /**
   * Delete an item
   */
  static async deleteItem(id: string): Promise<void> {
    await db.savedItems.delete(id);
  }

  /**
   * Fetch all saved items for a user with folder names
   */
  static async getItems(userId: string): Promise<SavedItem[]> {
    const [items, folders] = await Promise.all([
      db.savedItems.where('userId').equals(userId).toArray(),
      db.folders.where('userId').equals(userId).toArray(),
    ]);

    const folderMap = new Map(folders.map(f => [f.id, f.name]));
    return items.map(item => ({
      ...item,
      folderName: item.folderId ? folderMap.get(item.folderId) : 'Uncategorized',
    }));
  }

  /**
   * Folders CRUD
   */
  static async getFolders(userId: string): Promise<Folder[]> {
    const [folders, items] = await Promise.all([
      db.folders.where('userId').equals(userId).toArray(),
      db.savedItems.where('userId').equals(userId).toArray(),
    ]);

    return folders.map(f => ({
      ...f,
      itemCount: items.filter(i => i.folderId === f.id).length,
    }));
  }

  static async createFolder(userId: string, name: string, color = '#7167E8', icon = 'Folder'): Promise<Folder> {
    const now = new Date().toISOString();
    const folder: Folder = {
      id: generateUUID(),
      userId,
      name: name.trim(),
      color,
      icon,
      isDefault: false,
      createdAt: now,
      updatedAt: now,
    };
    await db.folders.put(folder);
    return folder;
  }

  static async deleteFolder(folderId: string): Promise<void> {
    // Unassign folder from items first
    await db.savedItems.where('folderId').equals(folderId).modify({ folderId: undefined });
    await db.folders.delete(folderId);
  }
}
