import { db } from '@/lib/db';
import { generateUUID } from '@/utils';
import type { Subject, StudyTopic, StudyNote } from '@/types';

export class StudyService {
  static async getSubjects(userId: string): Promise<Subject[]> {
    const [subjects, topics] = await Promise.all([
      db.subjects.where('userId').equals(userId).toArray(),
      db.topics.where('userId').equals(userId).toArray(),
    ]);

    return subjects.map(sub => {
      const subTopics = topics.filter(t => t.subjectId === sub.id);
      const avgProgress = subTopics.length > 0
        ? Math.round(subTopics.reduce((acc, t) => acc + t.progressPercentage, 0) / subTopics.length)
        : 0;

      return {
        ...sub,
        topicCount: subTopics.length,
        averageProgress: avgProgress,
      };
    });
  }

  static async createSubject(userId: string, name: string, description?: string, accentColor = '#5599E8', icon = 'BookOpen'): Promise<Subject> {
    const now = new Date().toISOString();
    const subject: Subject = {
      id: generateUUID(),
      userId,
      name: name.trim(),
      description: description?.trim(),
      accentColor,
      icon,
      createdAt: now,
      updatedAt: now,
    };
    await db.subjects.put(subject);
    return subject;
  }

  static async deleteSubject(subjectId: string): Promise<void> {
    await db.topics.where('subjectId').equals(subjectId).delete();
    await db.studyNotes.where('subjectId').equals(subjectId).delete();
    await db.subjects.delete(subjectId);
  }

  static async getTopics(subjectId: string): Promise<StudyTopic[]> {
    return await db.topics.where('subjectId').equals(subjectId).sortBy('sortOrder');
  }

  static async createTopic(params: {
    userId: string;
    subjectId: string;
    name: string;
    description?: string;
  }): Promise<StudyTopic> {
    const now = new Date().toISOString();
    const count = await db.topics.where('subjectId').equals(params.subjectId).count();
    const topic: StudyTopic = {
      id: generateUUID(),
      userId: params.userId,
      subjectId: params.subjectId,
      name: params.name.trim(),
      description: params.description?.trim(),
      status: 'not_started',
      progressPercentage: 0,
      sortOrder: count + 1,
      createdAt: now,
      updatedAt: now,
    };
    await db.topics.put(topic);
    return topic;
  }

  static async updateTopicProgress(topicId: string, progress: number): Promise<void> {
    const status = progress >= 100 ? 'completed' : progress > 0 ? 'in_progress' : 'not_started';
    await db.topics.update(topicId, {
      progressPercentage: Math.min(100, Math.max(0, progress)),
      status,
      updatedAt: new Date().toISOString(),
    });
  }

  static async deleteTopic(topicId: string): Promise<void> {
    await db.studyNotes.where('topicId').equals(topicId).modify({ topicId: undefined });
    await db.topics.delete(topicId);
  }

  static async getNotes(subjectId: string): Promise<StudyNote[]> {
    return await db.studyNotes.where('subjectId').equals(subjectId).toArray();
  }

  static async createNote(params: {
    userId: string;
    subjectId: string;
    topicId?: string;
    title: string;
    content: string;
    linkedSavedItemIds?: string[];
  }): Promise<StudyNote> {
    const now = new Date().toISOString();
    const note: StudyNote = {
      id: generateUUID(),
      userId: params.userId,
      subjectId: params.subjectId,
      topicId: params.topicId,
      title: params.title.trim(),
      content: params.content,
      linkedSavedItemIds: params.linkedSavedItemIds || [],
      createdAt: now,
      updatedAt: now,
    };
    await db.studyNotes.put(note);
    return note;
  }

  static async updateNote(noteId: string, updates: Partial<StudyNote>): Promise<void> {
    await db.studyNotes.update(noteId, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  }

  static async deleteNote(noteId: string): Promise<void> {
    await db.studyNotes.delete(noteId);
  }
}
