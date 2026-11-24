import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/lib/db';
import { BrainVaultService } from '@/services/brainVaultService';
import { TaskService } from '@/services/taskService';
import { StudyService } from '@/services/studyService';
import { GoalWishlistService } from '@/services/goalWishlistService';
import { SearchService } from '@/services/searchService';
import { suggestCategory } from '@/utils';

describe('Productivity & Knowledge Modules Unit Tests', () => {
  const testUserId = 'test-user-prod-1';

  beforeEach(async () => {
    await db.savedItems.clear();
    await db.folders.clear();
    await db.tasks.clear();
    await db.subjects.clear();
    await db.topics.clear();
    await db.studyNotes.clear();
    await db.goals.clear();
    await db.wishlist.clear();
    await db.events.clear();
  });

  // BrainVault tests
  it('BrainVault: saves item, suggests category, and detects duplicate URLs', async () => {
    const item = await BrainVaultService.saveItem({
      userId: testUserId,
      title: 'Python Asyncio Documentation',
      contentType: 'url',
      url: 'https://docs.python.org/3/library/asyncio.html',
    });

    expect(item.id).toBeDefined();
    expect(item.title).toBe('Python Asyncio Documentation');

    // Duplicate check
    const duplicate = await BrainVaultService.checkDuplicateUrl(
      testUserId,
      'https://docs.python.org/3/library/asyncio.html'
    );
    expect(duplicate).not.toBeNull();
    expect(duplicate?.id).toBe(item.id);

    // Rule-based suggestion
    const suggestion = suggestCategory('https://github.com/facebook/react');
    expect(suggestion.folder).toBe('Technology');
  });

  // Task tests
  it('Task Manager: creates task, marks complete, and categorizes into lists', async () => {
    const todayStr = new Date().toISOString().split('T')[0];

    const task = await TaskService.createTask({
      userId: testUserId,
      title: 'Review Quarterly Taxes',
      dueDate: todayStr,
      priority: 'high',
    });

    expect(task.status).toBe('todo');

    const updated = await TaskService.updateTask(task.id, { status: 'completed' });
    expect(updated.status).toBe('completed');
    expect(updated.completedAt).toBeDefined();

    const tasks = await TaskService.getTasks(testUserId);
    const categorized = TaskService.categorizeTasks(tasks);
    expect(categorized.completedTasks.length).toBe(1);
  });

  // StudySpace tests
  it('StudySpace: creates subject, topic, and updates topic progress', async () => {
    const subject = await StudyService.createSubject(testUserId, 'Computer Systems', 'Hardware and OS');
    expect(subject.id).toBeDefined();

    const topic = await StudyService.createTopic({
      userId: testUserId,
      subjectId: subject.id,
      name: 'Virtual Memory & Page Tables',
    });
    expect(topic.progressPercentage).toBe(0);

    await StudyService.updateTopicProgress(topic.id, 75);
    const topics = await StudyService.getTopics(subject.id);
    expect(topics[0].progressPercentage).toBe(75);
    expect(topics[0].status).toBe('in_progress');
  });

  // Goals & Wishlist tests
  it('Goals & Wishlist: creates goal, updates progress, and links wishlist items', async () => {
    const goal = await GoalWishlistService.createGoal({
      userId: testUserId,
      title: 'Save for Development Laptop',
      targetValue: 100000,
      currentValue: 25000,
      isFinancial: true,
    });
    expect(goal.status).toBe('active');

    const updatedGoal = await GoalWishlistService.updateGoalProgress(goal.id, 100000);
    expect(updatedGoal.status).toBe('completed');

    const wish = await GoalWishlistService.createWishlistItem({
      userId: testUserId,
      title: '4K Monitor',
      expectedPrice: 32000,
      linkedGoalId: goal.id,
    });
    expect(wish.status).toBe('want');
  });

  // Universal search test
  it('Universal Search: finds matching items grouped by module', async () => {
    await BrainVaultService.saveItem({
      userId: testUserId,
      title: 'Python High-Performance Handbook',
      contentType: 'note',
      personalNote: 'Important python memory optimization guidelines',
    });

    await TaskService.createTask({
      userId: testUserId,
      title: 'Python Async Exercise',
    });

    const searchResults = await SearchService.searchAll(testUserId, 'python');
    expect(searchResults.brainvault.length).toBeGreaterThanOrEqual(1);
    expect(searchResults.tasks.length).toBeGreaterThanOrEqual(1);
  });
});
