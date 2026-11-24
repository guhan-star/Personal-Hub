import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CheckSquare,
  Plus,
  Circle,
  CheckCircle2,
  Calendar as CalendarIcon,
  Clock,
  Trash2,
  Edit2,
  Filter,
  AlertCircle,
} from 'lucide-react';
import { TaskService } from '@/services/taskService';
import { useAuth } from '@/context/AuthContext';
import { formatDate, formatRelativeDate } from '@/utils';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import type { Task, TaskPriority, TaskStatus } from '@/types';

export const TasksPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeFilter, setActiveFilter] = useState<'today' | 'upcoming' | 'overdue' | 'completed' | 'all'>('today');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueTime, setDueTime] = useState('');
  const [category, setCategory] = useState('General');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [isCalendarSynced, setIsCalendarSynced] = useState(true);

  const loadData = async () => {
    if (!user) return;
    const allTasks = await TaskService.getTasks(user.id);
    setTasks(allTasks);
  };

  useEffect(() => {
    loadData();
  }, [user]);

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setIsModalOpen(true);
    }
  }, [searchParams]);

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !user) return;

    if (editingTask) {
      await TaskService.updateTask(editingTask.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        dueDate: dueDate || undefined,
        dueTime: dueTime || undefined,
        category: category.trim() || 'General',
        priority,
      });
    } else {
      await TaskService.createTask({
        userId: user.id,
        title: title.trim(),
        description: description.trim() || undefined,
        dueDate: dueDate || undefined,
        dueTime: dueTime || undefined,
        category: category.trim() || 'General',
        priority,
        isCalendarSynced,
      });
    }

    setIsModalOpen(false);
    resetForm();
    await loadData();
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDueDate(new Date().toISOString().split('T')[0]);
    setDueTime('');
    setCategory('General');
    setPriority('medium');
    setEditingTask(null);
  };

  const handleToggleStatus = async (task: Task) => {
    const nextStatus: TaskStatus = task.status === 'completed' ? 'todo' : 'completed';
    await TaskService.updateTask(task.id, { status: nextStatus });
    await loadData();
  };

  const handleDeleteTask = async (id: string) => {
    if (window.confirm('Delete this task?')) {
      await TaskService.deleteTask(id);
      await loadData();
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description || '');
    setDueDate(task.dueDate || '');
    setDueTime(task.dueTime || '');
    setCategory(task.category);
    setPriority(task.priority);
    setIsModalOpen(true);
  };

  const { todayTasks, upcomingTasks, overdueTasks, completedTasks, allTasks } = TaskService.categorizeTasks(tasks);

  const getFilteredTasks = () => {
    let list: Task[] = [];
    switch (activeFilter) {
      case 'today': list = todayTasks; break;
      case 'upcoming': list = upcomingTasks; break;
      case 'overdue': list = overdueTasks; break;
      case 'completed': list = completedTasks; break;
      case 'all': list = allTasks; break;
    }

    if (selectedCategory !== 'all') {
      list = list.filter(t => t.category.toLowerCase() === selectedCategory.toLowerCase());
    }
    return list;
  };

  const categories = Array.from(new Set(tasks.map(t => t.category)));

  const getPriorityBadge = (p: TaskPriority) => {
    switch (p) {
      case 'urgent': return <Badge variant="negative">Urgent</Badge>;
      case 'high': return <Badge variant="warning">High</Badge>;
      case 'medium': return <Badge variant="info">Medium</Badge>;
      case 'low': return <Badge variant="neutral">Low</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-hub-text dark:text-hub-text-dark flex items-center gap-2.5">
            <CheckSquare className="w-6 h-6 text-module-tasks" />
            <span>Task Manager</span>
          </h2>
          <p className="text-xs sm:text-sm text-hub-muted dark:text-hub-muted-dark">
            Organize personal to-dos, priorities, deadlines and calendar synchronization
          </p>
        </div>

        <Button onClick={() => setIsModalOpen(true)} size="sm">
          <Plus className="w-4 h-4" />
          <span>New Task</span>
        </Button>
      </div>

      {/* Tabs Filter Bar */}
      <div className="flex items-center gap-2 border-b border-hub-border dark:border-hub-border-dark pb-2 overflow-x-auto text-xs sm:text-sm">
        {[
          { id: 'today', label: "Today's Tasks", count: todayTasks.length },
          { id: 'upcoming', label: 'Upcoming', count: upcomingTasks.length },
          { id: 'overdue', label: 'Overdue', count: overdueTasks.length },
          { id: 'completed', label: 'Completed', count: completedTasks.length },
          { id: 'all', label: 'All Tasks', count: allTasks.length },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id as any)}
            className={`px-3 py-1.5 rounded-hub-sm font-semibold shrink-0 transition-all ${
              activeFilter === tab.id
                ? 'bg-module-tasks text-white shadow-xs'
                : 'text-hub-muted hover:text-hub-text dark:hover:text-hub-text-dark'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Category filter pills */}
      {categories.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-2.5 py-1 rounded-full border transition-all ${
              selectedCategory === 'all'
                ? 'bg-hub-primary text-white border-hub-primary'
                : 'bg-white dark:bg-hub-card-dark text-hub-muted border-hub-border dark:border-hub-border-dark'
            }`}
          >
            All Categories
          </button>
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setSelectedCategory(c)}
              className={`px-2.5 py-1 rounded-full border transition-all ${
                selectedCategory === c
                  ? 'bg-hub-primary text-white border-hub-primary'
                  : 'bg-white dark:bg-hub-card-dark text-hub-muted border-hub-border dark:border-hub-border-dark'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {/* Task List */}
      <Card className="p-0 overflow-hidden">
        <div className="divide-y divide-hub-border dark:divide-hub-border-dark">
          {getFilteredTasks().length === 0 ? (
            <div className="p-12 text-center text-sm text-hub-muted">
              No tasks found in this view.
            </div>
          ) : (
            getFilteredTasks().map((task) => (
              <div
                key={task.id}
                className="p-4 flex items-center justify-between hover:bg-gray-50/70 dark:hover:bg-hub-card-subtle-dark/40 transition-colors group"
              >
                <div className="flex items-start gap-3 overflow-hidden">
                  <button
                    onClick={() => handleToggleStatus(task)}
                    className="mt-0.5 text-hub-muted hover:text-hub-primary transition-colors"
                  >
                    {task.status === 'completed' ? (
                      <CheckCircle2 className="w-5 h-5 text-hub-positive" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </button>

                  <div className="overflow-hidden">
                    <h4
                      className={`text-sm font-semibold truncate ${
                        task.status === 'completed'
                          ? 'line-through text-hub-muted'
                          : 'text-hub-text dark:text-hub-text-dark'
                      }`}
                    >
                      {task.title}
                    </h4>

                    {task.description && (
                      <p className="text-xs text-hub-muted dark:text-hub-muted-dark line-clamp-1 mt-0.5">
                        {task.description}
                      </p>
                    )}

                    <div className="flex items-center gap-3 text-[11px] text-hub-muted mt-1.5">
                      {task.dueDate && (
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="w-3 h-3 text-module-calendar" />
                          <span>{formatRelativeDate(task.dueDate)}</span>
                          {task.dueTime && <span>at {task.dueTime}</span>}
                        </span>
                      )}
                      <span className="font-medium text-hub-primary bg-hub-primary/10 px-1.5 py-0.2 rounded">
                        {task.category}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {getPriorityBadge(task.priority)}

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEditTask(task)}
                      className="p-1.5 text-hub-muted hover:text-hub-text"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-1.5 text-hub-muted hover:text-red-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* CREATE / EDIT TASK MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={editingTask ? 'Edit Task' : 'Create New Task'}
      >
        <form onSubmit={handleSaveTask} className="space-y-4">
          <Input
            label="Task Title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. File 80C Tax Receipts"
          />

          <div>
            <label className="block text-xs font-semibold text-hub-muted uppercase mb-1.5">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Context or checklist details..."
              className="w-full px-3 py-2 rounded-hub-sm bg-hub-bg dark:bg-hub-card-subtle-dark border border-hub-border dark:border-hub-border-dark text-xs focus:outline-none focus:ring-2 focus:ring-hub-primary/30"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Due Date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
            <Input
              label="Due Time (Optional)"
              type="time"
              value={dueTime}
              onChange={(e) => setDueTime(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Work, Finance, Study"
            />

            <div>
              <label className="block text-xs font-semibold text-hub-muted uppercase mb-1.5">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-3 py-2 rounded-hub-sm bg-hub-bg dark:bg-hub-card-subtle-dark border border-hub-border dark:border-hub-border-dark text-xs"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isCalendarSynced"
              checked={isCalendarSynced}
              onChange={(e) => setIsCalendarSynced(e.target.checked)}
              className="rounded text-hub-primary"
            />
            <label htmlFor="isCalendarSynced" className="text-xs font-medium text-hub-text dark:text-hub-text-dark">
              Show this task on internal Calendar
            </label>
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-hub-border dark:border-hub-border-dark">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit">{editingTask ? 'Save Changes' : 'Create Task'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
