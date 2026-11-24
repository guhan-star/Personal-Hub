import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  Plus,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Trash2,
  CheckCircle,
} from 'lucide-react';
import {
  format,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
} from 'date-fns';
import { CalendarService } from '@/services/calendarService';
import { TaskService } from '@/services/taskService';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import type { CalendarEvent, Task } from '@/types';

export const CalendarPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:00');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState<any>('personal');

  const loadData = async () => {
    if (!user) return;
    const [allEvents, allTasks] = await Promise.all([
      CalendarService.getEvents(user.id),
      TaskService.getTasks(user.id),
    ]);
    setEvents(allEvents);
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

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim() || !user) return;

    await CalendarService.createEvent({
      userId: user.id,
      title: eventTitle.trim(),
      description: eventDesc.trim() || undefined,
      eventDate,
      startTime,
      endTime,
      location: location.trim() || undefined,
      category,
    });

    setIsModalOpen(false);
    setEventTitle('');
    setEventDesc('');
    setLocation('');
    await loadData();
  };

  const handleDeleteEvent = async (id: string) => {
    if (window.confirm('Delete this calendar event?')) {
      await CalendarService.deleteEvent(id);
      await loadData();
    }
  };

  // Calendar month days grid calculation
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const selectedDayEvents = events.filter(e => e.eventDate === format(selectedDay, 'yyyy-MM-dd'));
  const selectedDayTasks = tasks.filter(t => t.dueDate === format(selectedDay, 'yyyy-MM-dd'));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-hub-text dark:text-hub-text-dark flex items-center gap-2.5">
            <CalendarIcon className="w-6 h-6 text-module-calendar" />
            <span>Calendar & Schedule</span>
          </h2>
          <p className="text-xs sm:text-sm text-hub-muted dark:text-hub-muted-dark">
            Consolidated calendar view with meeting schedules and integrated task deadlines
          </p>
        </div>

        <Button onClick={() => setIsModalOpen(true)} size="sm">
          <Plus className="w-4 h-4" />
          <span>New Event</span>
        </Button>
      </div>

      {/* Main Grid: Calendar Month View + Day Details Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Month View (2 cols) */}
        <Card className="lg:col-span-2 p-4 sm:p-6">
          {/* Month Controls */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg font-bold text-hub-text dark:text-hub-text-dark">
              {format(currentDate, 'MMMM yyyy')}
            </h3>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-2.5 py-1 text-xs font-semibold rounded-hub-sm bg-gray-100 dark:bg-hub-card-subtle-dark hover:bg-gray-200 transition-colors"
              >
                Today
              </button>
              <button
                onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                className="p-1.5 rounded-hub-sm hover:bg-gray-100 dark:hover:bg-hub-card-subtle-dark text-hub-muted hover:text-hub-text"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                className="p-1.5 rounded-hub-sm hover:bg-gray-100 dark:hover:bg-hub-card-subtle-dark text-hub-muted hover:text-hub-text"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold uppercase tracking-wider text-hub-muted py-2 border-b border-hub-border dark:border-hub-border-dark">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>

          {/* Calendar Cells */}
          <div className="grid grid-cols-7 gap-1 pt-2">
            {calendarDays.map((day) => {
              const dayStr = format(day, 'yyyy-MM-dd');
              const dayEvents = events.filter(e => e.eventDate === dayStr);
              const dayTasks = tasks.filter(t => t.dueDate === dayStr);
              const isSelected = isSameDay(day, selectedDay);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isTodayDate = isToday(day);

              return (
                <div
                  key={day.toISOString()}
                  onClick={() => setSelectedDay(day)}
                  className={`min-h-[75px] sm:min-h-[85px] p-1.5 rounded-hub-sm border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-hub-primary bg-hub-primary/5 dark:bg-hub-primary/10 shadow-xs'
                      : 'border-hub-border/50 dark:border-hub-border-dark/50 hover:border-hub-primary/30'
                  } ${!isCurrentMonth ? 'opacity-30' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center ${
                        isTodayDate ? 'bg-hub-primary text-white font-bold' : 'text-hub-text dark:text-hub-text-dark'
                      }`}
                    >
                      {format(day, 'd')}
                    </span>
                  </div>

                  <div className="space-y-0.5 overflow-hidden">
                    {dayEvents.slice(0, 2).map(e => (
                      <div
                        key={e.id}
                        className="text-[9px] sm:text-[10px] font-medium truncate px-1 rounded bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-200"
                      >
                        {e.startTime} {e.title}
                      </div>
                    ))}
                    {dayTasks.slice(0, 1).map(t => (
                      <div
                        key={t.id}
                        className="text-[9px] sm:text-[10px] font-medium truncate px-1 rounded bg-teal-100 text-teal-800 dark:bg-teal-950/40 dark:text-teal-200"
                      >
                        Task: {t.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Selected Day Agenda (1 col) */}
        <Card className="p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="pb-3 mb-3 border-b border-hub-border dark:border-hub-border-dark flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-hub-text dark:text-hub-text-dark">
                  Agenda for {format(selectedDay, 'dd MMMM yyyy')}
                </h4>
                <p className="text-xs text-hub-muted">{isToday(selectedDay) ? 'Today' : format(selectedDay, 'EEEE')}</p>
              </div>

              <button
                onClick={() => {
                  setEventDate(format(selectedDay, 'yyyy-MM-dd'));
                  setIsModalOpen(true);
                }}
                className="text-xs font-semibold text-hub-primary hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>

            <div className="space-y-3">
              {/* Events list */}
              {selectedDayEvents.length === 0 && selectedDayTasks.length === 0 ? (
                <p className="text-xs text-hub-muted py-8 text-center">
                  No events or due tasks scheduled for this day.
                </p>
              ) : (
                <>
                  {selectedDayEvents.map((ev) => (
                    <div
                      key={ev.id}
                      className="p-3 rounded-hub-sm bg-hub-bg/60 dark:bg-hub-card-subtle-dark/60 border border-hub-border dark:border-hub-border-dark space-y-1.5"
                    >
                      <div className="flex items-start justify-between">
                        <h5 className="text-xs sm:text-sm font-bold text-hub-text dark:text-hub-text-dark">
                          {ev.title}
                        </h5>
                        <button
                          onClick={() => handleDeleteEvent(ev.id)}
                          className="p-1 text-hub-muted hover:text-red-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-hub-muted">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-orange-500" />
                          <span>{ev.startTime} - {ev.endTime}</span>
                        </span>
                        {ev.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span>{ev.location}</span>
                          </span>
                        )}
                      </div>

                      {ev.description && (
                        <p className="text-xs text-hub-muted">{ev.description}</p>
                      )}
                    </div>
                  ))}

                  {/* Tasks on this day */}
                  {selectedDayTasks.map((t) => (
                    <div
                      key={t.id}
                      className="p-3 rounded-hub-sm bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200/50 dark:border-teal-900/40"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-3.5 h-3.5 text-module-tasks" />
                        <span className="text-xs font-semibold text-hub-text dark:text-hub-text-dark">
                          Task Due: {t.title}
                        </span>
                      </div>
                      <p className="text-[11px] text-hub-muted mt-1">{t.category} • Priority: {t.priority}</p>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* CREATE EVENT MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Schedule Calendar Event"
      >
        <form onSubmit={handleCreateEvent} className="space-y-4">
          <Input
            label="Event Title"
            required
            value={eventTitle}
            onChange={(e) => setEventTitle(e.target.value)}
            placeholder="e.g. Quarterly Tax Filing, Study Session"
          />

          <div className="grid grid-cols-3 gap-2">
            <Input
              label="Date"
              type="date"
              required
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
            />
            <Input
              label="Start"
              type="time"
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
            <Input
              label="End"
              type="time"
              required
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Location / Link"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Google Meet, Home"
            />

            <div>
              <label className="block text-xs font-semibold text-hub-muted uppercase mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 rounded-hub-sm bg-hub-bg dark:bg-hub-card-subtle-dark border border-hub-border dark:border-hub-border-dark text-xs"
              >
                <option value="personal">Personal</option>
                <option value="finance">Finance</option>
                <option value="study">Study</option>
                <option value="work">Work</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-hub-muted uppercase mb-1.5">
              Description / Agenda
            </label>
            <textarea
              rows={2}
              value={eventDesc}
              onChange={(e) => setEventDesc(e.target.value)}
              placeholder="Event details..."
              className="w-full px-3 py-2 rounded-hub-sm bg-hub-bg dark:bg-hub-card-subtle-dark border border-hub-border dark:border-hub-border-dark text-xs"
            />
          </div>

          <div className="pt-3 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Event</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
