/*
Purpose: This file contains the main TaskManager component, which serves as the root component 
for the task management application. It integrates various hooks and components to display tasks, 
handle user interactions, and manage application state.

MOBILE-FRIENDLY UPDATES:
- Responsive grid layouts that stack on mobile
- Touch-friendly button sizes
- Optimized spacing for small screens
- Collapsible sections for mobile
- Better overflow handling
- Improved typography scaling

Variables Summary:
- tasks: Array of task objects fetched from the backend, used to display the task list.
- isLoading: Boolean indicating if tasks are being loaded, used for loading spinner.
- toggleComplete, addTask, deleteTask, updateTask, setTasks: Functions from useTasks hook for CRUD operations on tasks.
- tags: Array of tag objects, used for tagging tasks.
- tagsLoading: Boolean for tag loading state.
- addTag, delTag, updateTag: Functions for tag management CRUD operations on tag.
- state: Object from useTaskManagerState containing UI state variables like modals visibility, form data, filters.
- handlers: Object from useTaskHandlers providing event handlers for user actions.
- filteredTasks: Filtered and sorted array of tasks based on current filters.
- stats: Object with statistics like total, active, completed tasks.

These variables are used to render the UI components and handle user interactions throughout the component.
*/

'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { claimOrphanedData, fetchWorkBlocks, updateWorkBlockStatus } from '@/app/lib/backend-api';
import { requestScheduleSuggestion } from '@/app/lib/ai-api';
import { Task, WorkBlock } from '@/app/types/task';
import { useTasks, useTags } from '@/app/hooks/useTasksAndTags';
import { useTaskManagerState } from '@/app/hooks/useTaskManagerState';
import { useTaskHandlers } from '@/app/hooks/useTaskHandlers';
import { useTaskFiltering } from '@/app/hooks/useTaskFiltering';
import StatsCard from '@/app/components/StatsCard';
import TaskItem from '@/app/components/task/TaskItem';
import AISubTaskItem from './components/task/AISubTasks';
import TaskControls from '@/app/components/TaskControls';
import NewTaskModal from '@/app/components/task/NewTaskModal';
import EditTaskModal from '@/app/components/task/EditTaskModal';
import CreateTagModal from '@/app/components/tag/CreateTagModal';
import EditTagModal from '@/app/components/tag/EditTagListModal';
import { Filter, ChevronDown, ChevronUp, FileText, Settings } from 'lucide-react';
import BigPictureCalendar from '@/app/components/BigPictureCalendar';
import CalendarView from '@/app/components/calendar/CalendarView';
import SettingsModal from '@/app/components/SettingsModal';
import NoteItem from '@/app/components/notes/NoteItem';
import { useNotes } from '@/app/hooks/useNotes';
import BriefingCard from '@/app/components/BriefingCard';
import { useGoogleCalendar } from '@/app/hooks/useGoogleCalendar';
import GoogleEventModal from '@/app/components/calendar/GoogleEventModal';
import { GoogleCalendarEvent } from '@/app/types/calendar';

const TaskManager: React.FC = () => {
  const router = useRouter();
  const { signOut, user } = useAuth();

  // ── One-time orphaned-data claim ────────────────────────────────────────────
  // Runs once per user account (guarded by a localStorage flag).
  // Fixes any account that signed up before claim-data was wired to the login
  // flow — including the current session — without requiring a re-login.
  const claimRan = useRef(false);
  useEffect(() => {
    if (!user || claimRan.current) return;
    const flagKey = `taskmaster_claimed_${user.id}`;
    if (localStorage.getItem(flagKey)) return;  // already ran for this account
    claimRan.current = true;

    claimOrphanedData().then(claimed => {
      if (claimed) {
        // Mark as done so we never call this again for this account.
        localStorage.setItem(flagKey, '1');
        const total = claimed.tasks + claimed.notes + claimed.tags + claimed.calendar_settings;
        if (total > 0) {
          // Data was found and linked — reload so tasks/notes lists refresh.
          console.info(`[claim-data] Linked ${claimed.tasks} tasks, ${claimed.notes} notes to account.`);
          window.location.reload();
        } else {
          // Nothing to claim — still mark as done to skip future attempts.
          localStorage.setItem(flagKey, '1');
        }
      }
    });
  }, [user]);

  const handleLogout = async () => {
    // 1. Destroy the Supabase session (clears the JWT from storage).
    await signOut();
    // 2. Clear any user-specific cached data so the next user starts clean.
    //    Wipe every taskmaster_* key rather than individual keys so nothing
    //    leaks if new cache keys are added later.
    Object.keys(localStorage)
      .filter(k => k.startsWith('taskmaster_'))
      .forEach(k => localStorage.removeItem(k));
    // 3. Navigate to login — this unmounts the entire app, wiping all
    //    in-memory state (BriefingCard, ResourceSidebar, task list, etc.).
    router.replace('/login');
  };
  const { tasks, isLoading, toggleComplete, addTask, deleteTask, updateTask, setTasks, sendTaskToAI, addTasks } = useTasks();

  const { tags, tagsLoading, addTag, delTag, updateTag } = useTags();

  const [showSettings, setShowSettings] = useState(false);
  const [activeGoogleEvent, setActiveGoogleEvent] = useState<GoogleCalendarEvent | null>(null);
  const { gcalStatus, googleEvents, googleSyncing, gcalError, connectGcal, disconnectGcal, syncGcal } = useGoogleCalendar();

  // ── Work Blocks (Smart Scheduling) ──────────────────────────────────────────
  const [workBlocks, setWorkBlocks] = useState<WorkBlock[]>([]);

  useEffect(() => {
    fetchWorkBlocks().then(setWorkBlocks).catch(() => {/* non-critical */});
  }, []);

  const handleScheduleTask = async (task: Task): Promise<WorkBlock> => {
    const block = await requestScheduleSuggestion(task);
    setWorkBlocks(prev => [...prev.filter(b => b.id !== block.id), block]);
    return block;
  };

  const handleWorkBlockAction = async (id: number, status: 'confirmed' | 'dismissed') => {
    try {
      const updated = await updateWorkBlockStatus(id, status);
      setWorkBlocks(prev =>
        status === 'dismissed'
          ? prev.filter(b => b.id !== id)
          : prev.map(b => b.id === id ? updated : b),
      );
    } catch {
      // non-critical — block stays in current state
    }
  };

  // Mobile-specific state
  const [showStats, setShowStats] = useState(false);
  const [showCal, setShowCal] = useState(false);

  // View toggle: 'tasks' shows the task list + calendar; 'notes' shows NotesView
  const [viewMode, setViewMode] = useState<'tasks' | 'notes'>('tasks');

  // State management
  const state = useTaskManagerState();

  // Handlers
  const handlers = useTaskHandlers({
    setShowNewTaskModal: state.setShowNewTaskModal,
    setNewTask: state.setNewTask,
    setShowEditTaskModal: state.setShowEditTaskModal,
    setShowCreateTagModal: state.setShowCreateTagModal,
    setNewTag: state.setNewTag,
    setEditingTag: state.setEditingTag,
    setShowEditTagModal: state.setShowEditTagModal,
    setTasks,
    setSortOrder: state.setSortOrder,
    setSelectedTags: state.setSelectedTags,
    setFilter: state.setFilter,
    newTask: state.newTask,
    showEditTaskModal: state.showEditTaskModal,
    newTag: state.newTag,
    filter: state.filter,
    setAiPlan: state.setAiPlan,
    addTask,
    sendTaskToAI,
    updateTask,
    addTag,
    updateTag,
    delTag,
    setDisplayAISubTasks: state.setDisplayAISubTasks,
  });

  const { handleNewAITask } = handlers;

  const handleCalendarDayClick = (date: Date) => {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    state.setNewTask({ ...state.newTask, due_date: dateStr, due_time: '' });
    state.setShowNewTaskModal(true);
  };

  const handleCalendarSlotClick = (date: Date, time: string) => {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    state.setNewTask({ ...state.newTask, due_date: dateStr, due_time: time });
    state.setShowNewTaskModal(true);
  };

  const handleCalendarTaskClick = (task: Task) => {
    state.setShowEditTaskModal({ status: true, task });
  };

  // Filtering and stats
  const { filteredTasks, stats } = useTaskFiltering(
    tasks,
    state.filter,
    state.sortOrder,
    state.searchTerm,
    state.selectedTags
  );

  // Notes state — use raw notes so TaskManager can filter them with the shared
  // selectedTags / searchTerm state from TaskControls instead of the hook's own.
  const { notes: allNotes, deleteNote } = useNotes();
  const [activeNoteId, setActiveNoteId] = useState<number | null>(null);

  // Per-tag note counts for the Total StatsCard
  const noteTags = useMemo(() => {
    const map: Record<number, { name: string; color: string; count: number }> = {};
    allNotes.forEach(note => {
      note.tags?.forEach(tag => {
        if (!map[tag.id]) map[tag.id] = { name: tag.name, color: tag.color, count: 0 };
        map[tag.id].count += 1;
      });
    });
    return Object.values(map);
  }, [allNotes]);

  const filteredNotes = useMemo(() => {
    let result = allNotes;
    if (state.selectedTags.length > 0) {
      result = result.filter(note =>
        state.selectedTags.some(st => note.tags.some(nt => nt.id === st.id)),
      );
    }
    if (state.searchTerm.trim()) {
      const lower = state.searchTerm.toLowerCase();
      result = result.filter(
        note =>
          note.title.toLowerCase().includes(lower) ||
          note.content.replace(/<[^>]+>/g, '').toLowerCase().includes(lower),
      );
    }
    return result;
  }, [allNotes, state.selectedTags, state.searchTerm]);

  if (isLoading || tagsLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <div
            className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4"
            style={{ borderColor: 'var(--tm-accent)', borderTopColor: 'transparent' }}
          />
          <p className="text-text-secondary">Loading {isLoading ? 'tasks' : 'tags'}…</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-bg">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-10">
          {/* Header - Mobile Optimized */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:mb-4 sm:gap-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-5xl font-bold text-text-primary">Promptly</h1>
                <p className="text-xs sm:text-sm lg:text-base text-text-secondary">Less planning, more doing.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSettings(true)}
                className="btn px-3 py-2 sm:px-4 rounded-lg text-xs sm:text-sm font-medium w-full sm:w-auto flex items-center gap-1.5"
                style={{ backgroundColor: 'var(--tm-surface-raised)', color: 'var(--tm-text-secondary)', border: '1px solid var(--tm-border)' }}
                title="Account Settings"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Settings</span>
              </button>
              <button
                onClick={handleLogout}
                className="btn px-3 py-2 sm:px-4 text-white rounded-lg text-xs sm:text-sm font-medium w-full sm:w-auto"
                style={{ backgroundColor: 'var(--tm-danger)' }}
              >
                Logout
              </button>
            </div>
          </div>

          {/* Daily Briefing */}
          <BriefingCard tasks={tasks} notes={allNotes} />

          {/* Academic Calendar & Stats Cards - Mobile Responsive */}
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6'>
            {/* Academic Calendar - Hidden on mobile, shown on larger screens */}
            <button
                onClick={() => setShowCal(!showCal)}
                className="lg:hidden w-full flex items-center justify-between p-3 card mb-2"
              >
                <span className="font-semibold text-text-primary">Academic Calendar</span>
                {showCal ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            <div className={`${!showCal ? 'hidden lg:grid' : ''}`}>
              <BigPictureCalendar/>
            </div>
            
            {/* Stats Cards - Collapsible on mobile */}
            <div className="w-full lg:w-auto">
              <button
                onClick={() => setShowStats(!showStats)}
                className="lg:hidden w-full flex items-center justify-between p-3 card mb-2"
              >
                <span className="font-semibold text-text-primary">Statistics</span>
                {showStats ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
              
              <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2 sm:gap-3 lg:gap-4 ${!showStats ? 'hidden lg:grid' : ''}`}>
                <StatsCard
                  variant="tasks"
                  total={stats.total.tasks.length}
                  completed={stats.completed.tasks.length}
                  active={stats.active.tasks.length}
                  urgent={stats.urgent.tasks.length}
                  tags={stats.total.tags}
                />
                <StatsCard
                  variant="notes"
                  noteCount={allNotes.length}
                  taggedCount={allNotes.filter(n => n.tags.length > 0).length}
                  noteTags={noteTags}
                />
              </div>
            </div>
          </div>

          {/* Task Controls */}
          <div className="mb-4 sm:mb-6">
            <TaskControls
              searchTerm={state.searchTerm}
              onSearchChange={state.setSearchTerm}
              filter={state.filter}
              sortOrder={state.sortOrder}
              onFilterChange={handlers.handleFilterChange}
              selectedTags={state.selectedTags}
              onTagToggle={handlers.toggleSelectedTag}
              showTagDropdown={state.showTagDropdown}
              onTagDropdownToggle={() => state.setShowTagDropdown(prev => !prev)}
              tags={tags}
              onNewTaskClick={() => state.setShowNewTaskModal(true)}
              onCreateTagClick={() => state.setShowCreateTagModal(true)}
              onEditTagClick={() => {
                if (tags.length > 0) {
                  handlers.openEditTagModal(tags[0]);
                }
              }}
              searchPlaceholder={viewMode === 'notes' ? 'Search notes…' : 'Search tasks…'}
            />
          </div>

          {/* Task List / Note List and Calendar — two-column layout */}
          <div className="flex flex-col lg:flex-row gap-6 w-full">

            {/* LEFT COLUMN: Task List or Note List */}
            <div className="flex-1 space-y-2 sm:space-y-3">

              {/* Header: dynamic title on the left, view toggle on the right */}
              <div className="flex items-center justify-between px-2">
                <div className="font-bold text-xl sm:text-2xl text-text-primary">
                  {viewMode === 'tasks' ? 'To Do:' : 'Notes:'}
                </div>
                <div
                  className="inline-flex items-center gap-1 p-1 rounded-lg"
                  style={{ backgroundColor: 'var(--tm-surface-raised)' }}
                >
                  <button
                    onClick={() => setViewMode('tasks')}
                    className="px-4 py-1 text-sm font-semibold rounded-md transition-all"
                    style={
                      viewMode === 'tasks'
                        ? { backgroundColor: 'var(--tm-accent)', color: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.18)' }
                        : { color: 'var(--tm-text-secondary)', backgroundColor: 'transparent' }
                    }
                  >
                    Tasks
                  </button>
                  <button
                    onClick={() => setViewMode('notes')}
                    className="px-4 py-1 text-sm font-semibold rounded-md transition-all"
                    style={
                      viewMode === 'notes'
                        ? { backgroundColor: 'var(--tm-accent)', color: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.18)' }
                        : { color: 'var(--tm-text-secondary)', backgroundColor: 'transparent' }
                    }
                  >
                    Notes
                  </button>
                </div>
              </div>

              {/* Task list */}
              {viewMode === 'tasks' && (
                filteredTasks.length === 0 ? (
                  <div className="card p-6 sm:p-8 lg:p-12 text-center mt-4">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                      style={{ backgroundColor: 'var(--tm-surface-raised)' }}
                    >
                      <Filter className="w-6 h-6 text-text-muted" />
                    </div>
                    <h3 className="text-base font-semibold text-text-primary mb-2">No tasks found</h3>
                    <p className="text-sm text-text-secondary">Try adjusting your filters</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 overflow-y-auto h-[50vh] lg:h-[600px] pl-2 pr-1 scrollbar-custom">
                    {filteredTasks.map((task, index) => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        index={index}
                        onToggleComplete={toggleComplete}
                        tags={tags}
                        onDeleteTask={deleteTask}
                        onEditTaskClick={() =>
                          state.setShowEditTaskModal({ status: true, task })
                        }
                        onScheduleTask={handleScheduleTask}
                      />
                    ))}
                  </div>
                )
              )}

              {/* Note list */}
              {viewMode === 'notes' && (
                filteredNotes.length === 0 ? (
                  <div className="card p-6 sm:p-8 lg:p-12 text-center mt-4">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                      style={{ backgroundColor: 'var(--tm-surface-raised)' }}
                    >
                      <FileText className="w-6 h-6 text-text-muted" />
                    </div>
                    <h3 className="text-base font-semibold text-text-primary mb-2">No notes yet</h3>
                    <p className="text-sm text-text-secondary">Switch to the Notes view to create one</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 overflow-y-auto h-[50vh] lg:h-[600px] pl-2 pr-1 scrollbar-custom">
                    {filteredNotes.map(note => (
                      <NoteItem
                        key={note.id}
                        note={note}
                        isActive={note.id === activeNoteId}
                        onClick={() => router.push(`/notes?id=${note.id}`)}
                        onDelete={deleteNote}
                      />
                    ))}
                  </div>
                )
              )}
            </div>

            {/* RIGHT COLUMN: Calendar View (always visible) */}
            <div className="flex-1">
              <div className="font-bold text-xl sm:text-2xl text-text-primary px-2 mb-2 sm:mb-3">
                Calendar:
              </div>
              <div className="h-full">
                <CalendarView
                  tasks={tasks}
                  onDayClick={handleCalendarDayClick}
                  onSlotClick={handleCalendarSlotClick}
                  onTaskClick={handleCalendarTaskClick}
                  googleEvents={googleEvents}
                  onGoogleEventClick={setActiveGoogleEvent}
                  googleSyncing={googleSyncing}
                  onSync={gcalStatus === 'connected' ? syncGcal : undefined}
                  workBlocks={workBlocks}
                  onWorkBlockAction={handleWorkBlockAction}
                />
              </div>
            </div>
          </div>
          </div>
        </div>
      
      {/* List of sub tasks generated by the AI service */}
      { state.displayAISubTasks &&       
        <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center">
          <div className="modal-panel w-[95%] max-w-2xl p-6">
            <h2 className="text-center font-bold text-text-primary text-3xl pb-4">Recommended Task Plan:</h2>
            <div className="flex flex-col gap-2 overflow-y-auto h-[50vh] sm:h-[60vh] lg:h-[600px] pl-2 pr-1 scrollbar-custom">
              {state.aiPlan?.map((task, index) => (
                <AISubTaskItem
                  key={index}
                  task={task}
                  index={index}
                  tags={tags}
                  aiTasks={state.aiPlan}
                  setAiTasks={state.setAiPlan}
                  setDisplayAITasks={state.setDisplayAISubTasks}
                  addTasks={addTasks}
                  setTasks={setTasks}
                />
              ))}
            </div>

          </div>
        </div>
      }

      {/* Modals */}
      <NewTaskModal
        isOpen={state.showNewTaskModal}
        onClose={() => state.setShowNewTaskModal(false)}
        newTask={state.newTask}
        onTaskChange={state.setNewTask}
        tags={tags}
        onToggleTag={handlers.toggleTag}
        onSubmit={handlers.handleCreateTask}
        newAITask={state.newAITask}
        setNewAITask={state.setNewAITask}
        handleNewAITask={handleNewAITask}
      />

      <EditTaskModal
        isOpen={state.showEditTaskModal.status}
        onClose={() => state.setShowEditTaskModal({status:false, task: null})}
        onTaskChange={(updatedTask) => state.setShowEditTaskModal(prev => ({...prev, task: updatedTask}))}
        tags={tags}
        onToggleTag={handlers.toggleEditTag}
        onSubmit={handlers.handleEditTask}
        values={state.showEditTaskModal}
      />

      <CreateTagModal
        isOpen={state.showCreateTagModal}
        onClose={() => state.setShowCreateTagModal(false)}
        newTag={state.newTag}
        onTagChange={state.setNewTag}
        onSubmit={handlers.handleCreateTag}
      />

      {state.editingTag && (
        <EditTagModal
          isOpen={state.showEditTagModal}
          onClose={() => {
            state.setShowEditTagModal(false);
            state.setEditingTag(null);
          }}
          allTags={tags}
          onDeleteTag={handlers.handleDeleteTag}
          onEditTag={handlers.handleEditTag}
        />
      )}

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onAccountDeleted={handleLogout}
        gcalStatus={gcalStatus}
        onGcalConnect={connectGcal}
        onGcalDisconnect={disconnectGcal}
        gcalError={gcalError}
      />

      <GoogleEventModal
        event={activeGoogleEvent}
        onClose={() => setActiveGoogleEvent(null)}
      />

    </>
  );
};

export default TaskManager;