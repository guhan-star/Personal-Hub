import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Plus,
  BookOpen,
  Code,
  CheckCircle,
  Clock,
  Trash2,
  Edit2,
  FileText,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { StudyService } from '@/services/studyService';
import { BrainVaultService } from '@/services/brainVaultService';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import type { Subject, StudyTopic, StudyNote, SavedItem } from '@/types';

export const StudySpacePage: React.FC = () => {
  const { user } = useAuth();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [topics, setTopics] = useState<StudyTopic[]>([]);
  const [notes, setNotes] = useState<StudyNote[]>([]);
  const [vaultItems, setVaultItems] = useState<SavedItem[]>([]);

  // Modals
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);

  // Forms
  const [subName, setSubName] = useState('');
  const [subDesc, setSubDesc] = useState('');
  const [subColor, setSubColor] = useState('#5599E8');

  const [topicName, setTopicName] = useState('');
  const [topicDesc, setTopicDesc] = useState('');

  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteTopicId, setNoteTopicId] = useState('');

  const loadData = async () => {
    if (!user) return;
    const [allSubs, allItems] = await Promise.all([
      StudyService.getSubjects(user.id),
      BrainVaultService.getItems(user.id),
    ]);
    setSubjects(allSubs);
    setVaultItems(allItems);

    if (allSubs.length > 0) {
      const active = selectedSubject
        ? allSubs.find(s => s.id === selectedSubject.id) || allSubs[0]
        : allSubs[0];
      setSelectedSubject(active);
      await loadSubjectDetails(active.id);
    }
  };

  const loadSubjectDetails = async (subId: string) => {
    const [subTopics, subNotes] = await Promise.all([
      StudyService.getTopics(subId),
      StudyService.getNotes(subId),
    ]);
    setTopics(subTopics);
    setNotes(subNotes);
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleSelectSubject = async (sub: Subject) => {
    setSelectedSubject(sub);
    await loadSubjectDetails(sub.id);
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subName.trim() || !user) return;
    const newSub = await StudyService.createSubject(user.id, subName.trim(), subDesc.trim(), subColor);
    setIsSubjectModalOpen(false);
    setSubName('');
    setSubDesc('');
    await loadData();
    handleSelectSubject(newSub);
  };

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicName.trim() || !selectedSubject || !user) return;
    await StudyService.createTopic({
      userId: user.id,
      subjectId: selectedSubject.id,
      name: topicName.trim(),
      description: topicDesc.trim() || undefined,
    });
    setIsTopicModalOpen(false);
    setTopicName('');
    setTopicDesc('');
    await loadSubjectDetails(selectedSubject.id);
    await loadData();
  };

  const handleProgressChange = async (topicId: string, delta: number) => {
    const topic = topics.find(t => t.id === topicId);
    if (!topic) return;
    const nextVal = Math.min(100, Math.max(0, topic.progressPercentage + delta));
    await StudyService.updateTopicProgress(topicId, nextVal);
    if (selectedSubject) {
      await loadSubjectDetails(selectedSubject.id);
      await loadData();
    }
  };

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() || !selectedSubject || !user) return;
    await StudyService.createNote({
      userId: user.id,
      subjectId: selectedSubject.id,
      topicId: noteTopicId || undefined,
      title: noteTitle.trim(),
      content: noteContent,
    });
    setIsNoteModalOpen(false);
    setNoteTitle('');
    setNoteContent('');
    setNoteTopicId('');
    await loadSubjectDetails(selectedSubject.id);
  };

  const handleDeleteSubject = async (subId: string) => {
    if (window.confirm('Delete this subject and all associated topics and notes?')) {
      await StudyService.deleteSubject(subId);
      setSelectedSubject(null);
      await loadData();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-hub-text dark:text-hub-text-dark flex items-center gap-2.5">
            <GraduationCap className="w-6 h-6 text-module-study" />
            <span>StudySpace</span>
          </h2>
          <p className="text-xs sm:text-sm text-hub-muted dark:text-hub-muted-dark">
            Organize study curriculum, learning modules, deep notes and syllabus progress
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={() => setIsSubjectModalOpen(true)} size="sm">
            <Plus className="w-4 h-4" />
            <span>New Subject</span>
          </Button>
          {selectedSubject && (
            <Button onClick={() => setIsTopicModalOpen(true)} variant="outline" size="sm">
              <Plus className="w-4 h-4" />
              <span>Add Topic</span>
            </Button>
          )}
        </div>
      </div>

      {/* Main Layout: Subjects Bar + Topic Progress & Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: Subjects Navigation List */}
        <div className="space-y-2 lg:col-span-1">
          <span className="text-xs font-bold uppercase tracking-wider text-hub-muted">
            Your Subjects ({subjects.length})
          </span>

          <div className="space-y-1.5 mt-2">
            {subjects.map((sub) => (
              <button
                key={sub.id}
                onClick={() => handleSelectSubject(sub)}
                className={`w-full flex items-center justify-between p-3 rounded-hub-sm border transition-all text-left ${
                  selectedSubject?.id === sub.id
                    ? 'bg-hub-primary text-white border-hub-primary shadow-xs'
                    : 'bg-white dark:bg-hub-card-dark border-hub-border dark:border-hub-border-dark text-hub-text dark:text-hub-text-dark hover:border-hub-primary/30'
                }`}
              >
                <div className="overflow-hidden pr-2">
                  <h4 className="text-sm font-semibold truncate">{sub.name}</h4>
                  <div className="flex items-center gap-2 text-xs opacity-80 mt-1">
                    <span>{sub.topicCount || 0} topics</span>
                    <span>•</span>
                    <span>{sub.averageProgress || 0}% done</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 shrink-0 opacity-70" />
              </button>
            ))}
          </div>
        </div>

        {/* Right: Selected Subject View */}
        <div className="lg:col-span-3 space-y-6">
          {selectedSubject ? (
            <>
              {/* Subject Banner */}
              <Card className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: selectedSubject.accentColor }}
                    />
                    <h3 className="text-lg font-bold text-hub-text dark:text-hub-text-dark">
                      {selectedSubject.name}
                    </h3>
                  </div>
                  {selectedSubject.description && (
                    <p className="text-xs text-hub-muted mt-1">{selectedSubject.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-xs text-hub-muted">Overall Completion</span>
                    <p className="text-lg font-extrabold text-hub-primary">
                      {selectedSubject.averageProgress || 0}%
                    </p>
                  </div>
                  <Button
                    onClick={() => handleDeleteSubject(selectedSubject.id)}
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>

              {/* Topics & Progress Section */}
              <Card>
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-hub-border dark:border-hub-border-dark">
                  <h4 className="font-semibold text-sm text-hub-text dark:text-hub-text-dark">
                    Curriculum Topics ({topics.length})
                  </h4>
                  <Button onClick={() => setIsTopicModalOpen(true)} size="sm" variant="outline">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Topic</span>
                  </Button>
                </div>

                <div className="space-y-3">
                  {topics.length === 0 ? (
                    <p className="text-xs text-hub-muted py-6 text-center">
                      No topics added yet. Add a topic like "AsyncIO Event Loops" or "Data Structures".
                    </p>
                  ) : (
                    topics.map((t) => (
                      <div
                        key={t.id}
                        className="p-3 rounded-hub-sm border border-hub-border dark:border-hub-border-dark bg-hub-bg/50 dark:bg-hub-card-subtle-dark/50"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h5 className="text-sm font-semibold text-hub-text dark:text-hub-text-dark">
                              {t.name}
                            </h5>
                            {t.description && (
                              <p className="text-xs text-hub-muted mt-0.5">{t.description}</p>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleProgressChange(t.id, -25)}
                              className="w-6 h-6 rounded bg-gray-200 dark:bg-gray-700 text-xs font-bold hover:bg-gray-300"
                            >
                              -
                            </button>
                            <span className="text-xs font-bold text-hub-primary min-w-[36px] text-center">
                              {t.progressPercentage}%
                            </span>
                            <button
                              onClick={() => handleProgressChange(t.id, 25)}
                              className="w-6 h-6 rounded bg-gray-200 dark:bg-gray-700 text-xs font-bold hover:bg-gray-300"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-module-study h-full rounded-full transition-all duration-300"
                            style={{ width: `${t.progressPercentage}%` }}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>

              {/* Study Notes Section */}
              <Card>
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-hub-border dark:border-hub-border-dark">
                  <h4 className="font-semibold text-sm text-hub-text dark:text-hub-text-dark">
                    Study Notes ({notes.length})
                  </h4>
                  <Button onClick={() => setIsNoteModalOpen(true)} size="sm">
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Note</span>
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {notes.length === 0 ? (
                    <div className="col-span-full py-8 text-center text-xs text-hub-muted">
                      No study notes written for this subject yet.
                    </div>
                  ) : (
                    notes.map((note) => (
                      <div
                        key={note.id}
                        className="p-3.5 rounded-hub-sm border border-hub-border dark:border-hub-border-dark bg-white dark:bg-hub-card-dark space-y-2"
                      >
                        <h5 className="text-sm font-bold text-hub-text dark:text-hub-text-dark">
                          {note.title}
                        </h5>
                        <p className="text-xs text-hub-muted dark:text-hub-muted-dark whitespace-pre-line line-clamp-4">
                          {note.content}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </>
          ) : (
            <div className="py-20 text-center text-sm text-hub-muted">
              Create a subject to begin organizing your curriculum.
            </div>
          )}
        </div>
      </div>

      {/* CREATE SUBJECT MODAL */}
      <Modal
        isOpen={isSubjectModalOpen}
        onClose={() => setIsSubjectModalOpen(false)}
        title="Add Study Subject"
      >
        <form onSubmit={handleCreateSubject} className="space-y-4">
          <Input
            label="Subject Name"
            required
            value={subName}
            onChange={(e) => setSubName(e.target.value)}
            placeholder="e.g. Distributed Databases, Linear Algebra"
          />
          <Input
            label="Description / Goals"
            value={subDesc}
            onChange={(e) => setSubDesc(e.target.value)}
            placeholder="Key concepts to master..."
          />
          <div>
            <label className="block text-xs font-semibold text-hub-muted uppercase mb-1.5">
              Accent Color
            </label>
            <div className="flex gap-2">
              {['#5599E8', '#7167E8', '#22A879', '#F59E0B', '#EC4899'].map(c => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setSubColor(c)}
                  className={`w-7 h-7 rounded-full border-2 ${subColor === c ? 'scale-110 border-hub-text' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="pt-3 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsSubjectModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Subject</Button>
          </div>
        </form>
      </Modal>

      {/* CREATE TOPIC MODAL */}
      <Modal
        isOpen={isTopicModalOpen}
        onClose={() => setIsTopicModalOpen(false)}
        title={`Add Topic to ${selectedSubject?.name}`}
      >
        <form onSubmit={handleCreateTopic} className="space-y-4">
          <Input
            label="Topic Name"
            required
            value={topicName}
            onChange={(e) => setTopicName(e.target.value)}
            placeholder="e.g. B-Trees & LSM Storage"
          />
          <Input
            label="Description"
            value={topicDesc}
            onChange={(e) => setTopicDesc(e.target.value)}
            placeholder="Specific topics or exercises..."
          />
          <div className="pt-3 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsTopicModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Topic</Button>
          </div>
        </form>
      </Modal>

      {/* CREATE NOTE MODAL */}
      <Modal
        isOpen={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
        title={`Create Study Note in ${selectedSubject?.name}`}
      >
        <form onSubmit={handleCreateNote} className="space-y-4">
          <Input
            label="Note Title"
            required
            value={noteTitle}
            onChange={(e) => setNoteTitle(e.target.value)}
            placeholder="e.g. Key Invariants of Two-Phase Commit"
          />

          <div>
            <label className="block text-xs font-semibold text-hub-muted uppercase mb-1.5">
              Related Topic
            </label>
            <select
              value={noteTopicId}
              onChange={(e) => setNoteTopicId(e.target.value)}
              className="w-full px-3 py-2 rounded-hub-sm bg-hub-bg dark:bg-hub-card-subtle-dark border border-hub-border dark:border-hub-border-dark text-xs"
            >
              <option value="">General Subject Note</option>
              {topics.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-hub-muted uppercase mb-1.5">
              Note Markdown / Content
            </label>
            <textarea
              rows={5}
              required
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Write your study notes, derivations and code excerpts here..."
              className="w-full px-3 py-2 rounded-hub-sm bg-hub-bg dark:bg-hub-card-subtle-dark border border-hub-border dark:border-hub-border-dark text-xs focus:outline-none focus:ring-2 focus:ring-hub-primary/30"
            />
          </div>

          <div className="pt-3 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsNoteModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Note</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
