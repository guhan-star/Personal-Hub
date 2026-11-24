import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  BrainCircuit,
  Plus,
  Folder as FolderIcon,
  Tag as TagIcon,
  Search,
  ExternalLink,
  Trash2,
  Edit2,
  Pin,
  FileText,
  Video,
  Camera,
  MessageSquare,
  Globe,
  AlertTriangle,
  FolderPlus,
} from 'lucide-react';
import { BrainVaultService } from '@/services/brainVaultService';
import { useAuth } from '@/context/AuthContext';
import { formatDate, suggestCategory } from '@/utils';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import type { Folder, SavedItem, ContentType } from '@/types';

export const BrainVaultPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const [items, setItems] = useState<SavedItem[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');

  // Modals
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [duplicateItem, setDuplicateItem] = useState<SavedItem | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [contentType, setContentType] = useState<ContentType>('url');
  const [description, setDescription] = useState('');
  const [personalNote, setPersonalNote] = useState('');
  const [folderId, setFolderId] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [isPinned, setIsPinned] = useState(false);

  // New folder form
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('#7167E8');

  const loadData = async () => {
    if (!user) return;
    const [fetchedItems, fetchedFolders] = await Promise.all([
      BrainVaultService.getItems(user.id),
      BrainVaultService.getFolders(user.id),
    ]);
    setItems(fetchedItems);
    setFolders(fetchedFolders);
  };

  useEffect(() => {
    loadData();
  }, [user]);

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setIsItemModalOpen(true);
    }
  }, [searchParams]);

  // URL blur handler for auto-categorization and duplicate check
  const handleUrlBlur = async () => {
    if (!url.trim() || !user) return;

    // Check duplicate
    const existing = await BrainVaultService.checkDuplicateUrl(user.id, url);
    if (existing) {
      setDuplicateItem(existing);
      return;
    }

    // Auto-detect type
    const lower = url.toLowerCase();
    if (lower.includes('youtube.com') || lower.includes('youtu.be')) {
      setContentType('youtube');
    } else if (lower.includes('instagram.com')) {
      setContentType('instagram');
    } else {
      setContentType('url');
    }

    // Auto suggestion
    const suggestion = suggestCategory(url, title);
    if (!folderId) {
      const match = folders.find(f => f.name.toLowerCase() === suggestion.folder.toLowerCase());
      if (match) setFolderId(match.id);
    }
    if (!tagsInput && suggestion.tags.length > 0) {
      setTagsInput(suggestion.tags.join(', '));
    }
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !user) return;

    const tagsArray = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    await BrainVaultService.saveItem({
      userId: user.id,
      title: title.trim(),
      contentType,
      url: url.trim() || undefined,
      description: description.trim() || undefined,
      personalNote: personalNote.trim() || undefined,
      folderId: folderId || undefined,
      tags: tagsArray,
      isPinned,
    });

    setIsItemModalOpen(false);
    resetForm();
    await loadData();
  };

  const resetForm = () => {
    setTitle('');
    setUrl('');
    setContentType('url');
    setDescription('');
    setPersonalNote('');
    setFolderId('');
    setTagsInput('');
    setIsPinned(false);
    setDuplicateItem(null);
  };

  const handleDeleteItem = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this saved item?')) {
      await BrainVaultService.deleteItem(id);
      await loadData();
    }
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim() || !user) return;
    await BrainVaultService.createFolder(user.id, newFolderName.trim(), newFolderColor);
    setIsFolderModalOpen(false);
    setNewFolderName('');
    await loadData();
  };

  // Filtered items
  const filteredItems = items.filter((item) => {
    const matchesFolder = selectedFolderId === 'all' || item.folderId === selectedFolderId;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.personalNote && item.personalNote.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.url && item.url.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesTag = selectedTag === 'all' || item.tags.includes(selectedTag);

    return matchesFolder && matchesSearch && matchesTag;
  });

  const allTags = Array.from(new Set(items.flatMap(i => i.tags)));

  const getItemIcon = (type: ContentType) => {
    switch (type) {
      case 'youtube': return <Video className="w-4 h-4 text-red-500" />;
      case 'instagram': return <Camera className="w-4 h-4 text-pink-500" />;
      case 'whatsapp': return <MessageSquare className="w-4 h-4 text-green-500" />;
      case 'note': return <FileText className="w-4 h-4 text-blue-500" />;
      default: return <Globe className="w-4 h-4 text-hub-primary" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-hub-text dark:text-hub-text-dark flex items-center gap-2.5">
            <BrainCircuit className="w-6 h-6 text-module-brainvault" />
            <span>BrainVault</span>
          </h2>
          <p className="text-xs sm:text-sm text-hub-muted dark:text-hub-muted-dark">
            Centralized knowledge headquarters: save links, research notes, documents and ideas
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={() => setIsItemModalOpen(true)} size="sm">
            <Plus className="w-4 h-4" />
            <span>Save Content</span>
          </Button>
          <Button onClick={() => setIsFolderModalOpen(true)} variant="outline" size="sm">
            <FolderPlus className="w-4 h-4" />
            <span>New Folder</span>
          </Button>
        </div>
      </div>

      {/* Search & Tag Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="w-full sm:flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-hub-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search saved items, URLs, tags, notes..."
            className="w-full pl-9 pr-4 py-2 rounded-hub-sm bg-white dark:bg-hub-card-dark border border-hub-border dark:border-hub-border-dark text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-hub-primary/30"
          />
        </div>

        {allTags.length > 0 && (
          <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto text-xs">
            <button
              onClick={() => setSelectedTag('all')}
              className={`px-2.5 py-1.5 rounded-full shrink-0 border transition-all ${
                selectedTag === 'all'
                  ? 'bg-hub-primary text-white border-hub-primary'
                  : 'bg-white dark:bg-hub-card-dark text-hub-muted border-hub-border dark:border-hub-border-dark'
              }`}
            >
              All Tags
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-2.5 py-1.5 rounded-full shrink-0 border transition-all ${
                  selectedTag === tag
                    ? 'bg-hub-primary text-white border-hub-primary'
                    : 'bg-white dark:bg-hub-card-dark text-hub-muted border-hub-border dark:border-hub-border-dark'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Folders Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedFolderId('all')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-hub-sm text-xs font-semibold shrink-0 transition-all ${
            selectedFolderId === 'all'
              ? 'bg-module-brainvault text-white shadow-xs'
              : 'bg-white dark:bg-hub-card-dark text-hub-muted hover:text-hub-text border border-hub-border dark:border-hub-border-dark'
          }`}
        >
          <FolderIcon className="w-3.5 h-3.5" />
          <span>All Items ({items.length})</span>
        </button>

        {folders.map((f) => (
          <button
            key={f.id}
            onClick={() => setSelectedFolderId(f.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-hub-sm text-xs font-semibold shrink-0 transition-all ${
              selectedFolderId === f.id
                ? 'bg-module-brainvault text-white shadow-xs'
                : 'bg-white dark:bg-hub-card-dark text-hub-muted hover:text-hub-text border border-hub-border dark:border-hub-border-dark'
            }`}
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: f.color }} />
            <span>{f.name}</span>
            <span className="opacity-70 text-[10px]">({f.itemCount || 0})</span>
          </button>
        ))}
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.length === 0 ? (
          <div className="col-span-full py-16 text-center text-sm text-hub-muted">
            No items in this folder yet. Click "Save Content" to add URLs, notes or resources.
          </div>
        ) : (
          filteredItems.map((item) => (
            <Card key={item.id} hoverable className="flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    {getItemIcon(item.contentType)}
                    <span className="text-[10px] font-bold uppercase tracking-wider text-hub-muted">
                      {item.contentType}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {item.isPinned && (
                      <Pin className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    )}
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-1 text-hub-muted hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h4 className="text-sm font-bold text-hub-text dark:text-hub-text-dark line-clamp-2">
                  {item.title}
                </h4>

                {item.description && (
                  <p className="text-xs text-hub-muted dark:text-hub-muted-dark line-clamp-2 mt-1.5">
                    {item.description}
                  </p>
                )}

                {item.personalNote && (
                  <div className="mt-2.5 p-2 rounded-md bg-purple-50/70 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30 text-[11px] text-purple-900 dark:text-purple-300">
                    <span className="font-semibold block mb-0.5">Note:</span>
                    {item.personalNote}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-hub-border dark:border-hub-border-dark mt-3">
                <div className="flex flex-wrap gap-1 mb-2">
                  {item.tags.map((t) => (
                    <span
                      key={t}
                      className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-hub-muted"
                    >
                      #{t}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between text-[11px] text-hub-muted">
                  <span>{item.folderName || 'Uncategorized'}</span>
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-hub-primary hover:underline flex items-center gap-1 font-medium"
                    >
                      <span>Open Link</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* SAVE CONTENT MODAL */}
      <Modal
        isOpen={isItemModalOpen}
        onClose={() => {
          setIsItemModalOpen(false);
          resetForm();
        }}
        title="Save Content to BrainVault"
        subtitle="Automatic duplicate detection and rule-based categorization"
      >
        <form onSubmit={handleSaveItem} className="space-y-4">
          {/* Duplicate URL alert banner */}
          {duplicateItem && (
            <div className="p-3 rounded-hub-sm bg-amber-50 dark:bg-amber-950/40 border border-amber-200 text-xs text-amber-800 dark:text-amber-200 space-y-2">
              <div className="flex items-center gap-2 font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>Duplicate URL Detected!</span>
              </div>
              <p>
                This URL is already saved as: <strong>"{duplicateItem.title}"</strong>.
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setDuplicateItem(null)}
                  className="px-2.5 py-1 rounded bg-amber-200 dark:bg-amber-800 font-semibold text-[11px]"
                >
                  Save Another Copy Anyway
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsItemModalOpen(false);
                    resetForm();
                  }}
                  className="px-2.5 py-1 rounded border border-amber-300 font-semibold text-[11px]"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <Input
            label="URL (Optional)"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onBlur={handleUrlBlur}
            placeholder="https://..."
          />

          <Input
            label="Title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Distributed Consensus Systems"
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-hub-muted uppercase mb-1.5">
                Content Type
              </label>
              <select
                value={contentType}
                onChange={(e) => setContentType(e.target.value as any)}
                className="w-full px-3 py-2 rounded-hub-sm bg-hub-bg dark:bg-hub-card-subtle-dark border border-hub-border dark:border-hub-border-dark text-xs"
              >
                <option value="url">Website URL</option>
                <option value="youtube">YouTube Video</option>
                <option value="instagram">Instagram Post</option>
                <option value="whatsapp">WhatsApp Note</option>
                <option value="note">Personal Note</option>
                <option value="document">Document</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-hub-muted uppercase mb-1.5">
                Folder
              </label>
              <select
                value={folderId}
                onChange={(e) => setFolderId(e.target.value)}
                className="w-full px-3 py-2 rounded-hub-sm bg-hub-bg dark:bg-hub-card-subtle-dark border border-hub-border dark:border-hub-border-dark text-xs"
              >
                <option value="">Select Folder</option>
                {folders.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-hub-muted uppercase mb-1.5">
              Description / Summary
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of the article or clip..."
              className="w-full px-3 py-2 rounded-hub-sm bg-hub-bg dark:bg-hub-card-subtle-dark border border-hub-border dark:border-hub-border-dark text-xs focus:outline-none focus:ring-2 focus:ring-hub-primary/30"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-hub-muted uppercase mb-1.5">
              Personal Reflection / Note
            </label>
            <textarea
              rows={2}
              value={personalNote}
              onChange={(e) => setPersonalNote(e.target.value)}
              placeholder="Why is this important to you? Key takeaways..."
              className="w-full px-3 py-2 rounded-hub-sm bg-hub-bg dark:bg-hub-card-subtle-dark border border-hub-border dark:border-hub-border-dark text-xs focus:outline-none focus:ring-2 focus:ring-hub-primary/30"
            />
          </div>

          <Input
            label="Tags (Comma-separated)"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="e.g. React, Architecture, Performance"
          />

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPinned"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              className="rounded text-hub-primary focus:ring-hub-primary"
            />
            <label htmlFor="isPinned" className="text-xs font-medium text-hub-text dark:text-hub-text-dark">
              Pin to top of BrainVault
            </label>
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-hub-border dark:border-hub-border-dark">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsItemModalOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit">Save to Vault</Button>
          </div>
        </form>
      </Modal>

      {/* CREATE FOLDER MODAL */}
      <Modal
        isOpen={isFolderModalOpen}
        onClose={() => setIsFolderModalOpen(false)}
        title="Create BrainVault Folder"
      >
        <form onSubmit={handleCreateFolder} className="space-y-4">
          <Input
            label="Folder Name"
            required
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="e.g. Machine Learning, Travel Ideas"
          />

          <div>
            <label className="block text-xs font-semibold text-hub-muted uppercase mb-1.5">
              Color Accent
            </label>
            <div className="flex gap-2">
              {['#7167E8', '#22A879', '#5599E8', '#E56B73', '#EC4899', '#F59E0B'].map(color => (
                <button
                  type="button"
                  key={color}
                  onClick={() => setNewFolderColor(color)}
                  className={`w-7 h-7 rounded-full border-2 transition-transform ${
                    newFolderColor === color ? 'scale-110 border-hub-text dark:border-white' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsFolderModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Folder</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
