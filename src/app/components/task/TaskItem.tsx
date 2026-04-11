/*
Purpose: This component renders an individual task item in the task list, displaying task details,
tags, due dates, and providing buttons for editing, deleting, and toggling completion.

Variables Summary:
- task: Task object containing title, description, completion status, due date, tags, etc.
- index: Number used for staggered animation delay in the list.
- onToggleComplete: Function to toggle the task's completion status.
- tags: Array of tag objects used to look up colors for displaying task tags.
- onDeleteTask: Function to delete the task.
- onEditTaskClick: Function to open the edit modal with the task data.

These variables are used to display task information and handle user interactions like completion toggle, edit, and delete.
*/

import React, { useState } from 'react';
import { Check, Clock, AlertCircle, Trash2, Pencil, BarChart3, Calendar, CalendarClock, Loader2, CheckCircle2, X, CalendarX2 } from 'lucide-react';
import { Task, WorkBlock } from '@/app/types/task';
import { getDueColor, getDurationColor, getComplexityColor, formatTime12Hour, formatDueDate } from '@/app/utils/taskUtils';

interface TaskItemProps {
  task: Task;
  index: number;
  onToggleComplete?: (id: number) => void;
  tags: Array<{ id: number; name: string; color: string }>;
  onDeleteTask?: (task: Task) => void;
  onEditTaskClick?: (params: { status: boolean; task: Task }) => void;
  /** Called when the user clicks "Find Best Time". Parent manages the returned WorkBlock in state. */
  onScheduleTask?: (task: Task) => Promise<void>;
  /** The active work block for this task, if one exists (from parent state). */
  workBlock?: WorkBlock | null;
  /** Called when the user accepts or dismisses a suggested work block. */
  onWorkBlockAction?: (id: number, status: 'confirmed' | 'dismissed') => void;
  /** Called when the user removes a confirmed work block from the calendar. */
  onDeleteWorkBlock?: (id: number) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({
  task, index, onToggleComplete, tags, onDeleteTask, onEditTaskClick,
  onScheduleTask, workBlock = null, onWorkBlockAction, onDeleteWorkBlock,
}) => {
  const handleDeleteTask = (taskToDelete: Task) => {
    onDeleteTask?.(taskToDelete);
  };
  const handleEditTask = ({ status, taskToEdit }: { status: boolean; taskToEdit: Task }) => {
    onEditTaskClick?.({ status, task: taskToEdit });
  };

  // UI-only state: loading spinner and error message while the schedule request
  // is in-flight.  The actual WorkBlock data lives in the parent's workBlocks
  // state and is passed back down via the workBlock prop.
  const [scheduling, setScheduling] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  const handleScheduleClick = async () => {
    if (!onScheduleTask) return;
    setScheduling(true);
    setScheduleError(null);
    try {
      await onScheduleTask(task);
      // Parent updates workBlocks state → TaskItem re-renders with new workBlock prop.
    } catch (e) {
      setScheduleError(e instanceof Error ? e.message : 'Scheduling failed');
    } finally {
      setScheduling(false);
    }
  };

  const normalizedDueDate: string | null =
    task.due_date instanceof Date ? task.due_date.toISOString() : task.due_date ?? null;
  const normalizedDueTime: string | null =
    task.due_time instanceof Date ? task.due_time.toISOString() : task.due_time ?? null;

  return (
    <div
      className={`card p-4 sm:p-6 animate-fade-in ${task.completed ? 'opacity-75' : ''}`}
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <div className="flex items-start gap-3 sm:gap-4">
        {/* Completion toggle */}
        <button
          onClick={() => onToggleComplete?.(task.id)}
          aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
          className={`mt-0.5 sm:mt-1 flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center transition-all active:scale-90 ${
            task.completed
              ? 'border-[var(--tm-success)] bg-[var(--tm-success)]'
              : 'border-border hover:border-accent'
          }`}
        >
          {task.completed && <Check className="w-3 h-3 sm:w-4 sm:h-4 text-white" />}
        </button>

        <div className="flex-1 min-w-0">
          {/* Title row */}
          <div className="flex items-start justify-between gap-2 sm:gap-4 mb-1.5 sm:mb-2">
            <h3
              className={`text-base sm:text-lg font-semibold leading-snug ${
                task.completed ? 'text-text-muted line-through' : 'text-text-primary'
              }`}
            >
              {task.title}
            </h3>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              {task.category && (
                <span
                  className="chip text-[10px] font-bold uppercase tracking-wide"
                  style={{ backgroundColor: 'var(--tm-accent-subtle)', color: 'var(--tm-accent)' }}
                >
                  {task.category}
                </span>
              )}
              {task.urgent && (
                <span
                  className="chip font-bold flex items-center gap-1"
                  style={{ backgroundColor: 'var(--tm-warning-subtle)', color: 'var(--tm-warning)' }}
                >
                  <AlertCircle className="w-3 h-3" />
                  <span className="hidden sm:inline">URGENT</span>
                </span>
              )}
              <button
                onClick={() => handleEditTask({ status: true, taskToEdit: task })}
                className="btn btn-ghost p-1.5"
                title="Edit task"
                aria-label="Edit task"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDeleteTask(task)}
                className="btn btn-danger-ghost p-1.5"
                title="Delete task"
                aria-label="Delete task"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Description */}
          <p
            className={`text-xs sm:text-sm mb-3 leading-relaxed px-3 py-2 rounded-lg ${
              task.completed ? 'line-through text-text-muted' : 'text-text-secondary'
            }`}
            style={{ backgroundColor: 'var(--tm-surface-raised)' }}
          >
            {task.description}
          </p>

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap mb-3">
              {task.tags.map((tagName, i) => {
                const tagData = tags.find(t => t.name === tagName.name);
                return (
                  <span
                    key={i}
                    className="chip px-2"
                    style={{ backgroundColor: tagData?.color ?? 'var(--tm-accent)', color: 'white', borderRadius: '10px'}}
                  >
                    {tagName.name}
                  </span>
                );
              })}
            </div>
          )}

          {/* Details grid */}
          <div className="pt-3 border-t border-border-subtle">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs sm:text-sm">

              {/* Due */}
              <div>
                <p className="text-text-muted font-semibold uppercase tracking-wide text-[10px] mb-1">Due</p>
                <div className={`flex flex-col gap-1 px-3 py-2 rounded-lg ${getDueColor(task.due_date)}`}>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDueDate(normalizedDueDate, normalizedDueTime)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{formatTime12Hour(typeof task.due_time === 'string' ? task.due_time : null)}</span>
                  </div>
                </div>
              </div>

              {/* Created */}
              <div>
                <p className="text-text-muted font-semibold uppercase tracking-wide text-[10px] mb-1">Created</p>
                <div
                  className="flex flex-col gap-1 px-3 py-2 rounded-lg text-text-secondary"
                  style={{ backgroundColor: 'var(--tm-surface-raised)' }}
                >
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(task.created_date).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {new Date(task.created_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>

              {/* Estimated Duration */}
              <div>
                <p className="text-text-muted font-semibold uppercase tracking-wide text-[10px] mb-1">Est. Duration</p>
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${getDurationColor(Number(task.estimated_time))}`}>
                  <Clock className="w-4 h-4" />
                  <span>{task.estimated_time != null ? `${task.estimated_time} hrs` : '--'}</span>
                </div>
              </div>

              {/* Complexity */}
              <div>
                <p className="text-text-muted font-semibold uppercase tracking-wide text-[10px] mb-1">Complexity</p>
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${getComplexityColor(task.complexity)}`}>
                  <BarChart3 className="w-4 h-4" />
                  <span>Level {task.complexity ?? '--'}</span>
                </div>
              </div>

            </div>

            {/* Smart Scheduling row */}
            {!task.completed && task.due_date && onScheduleTask && (
              <div className="mt-3 pt-3 border-t border-border-subtle">

                {!workBlock ? (
                  /* ── State 1: no block — offer scheduling ──────────────── */
                  <div className="flex items-center flex-wrap gap-2">
                    <button
                      onClick={handleScheduleClick}
                      disabled={scheduling}
                      className="btn btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5 disabled:opacity-60"
                    >
                      {scheduling
                        ? <Loader2 className="w-3 h-3 animate-spin" />
                        : <CalendarClock className="w-3 h-3" />
                      }
                      {scheduling ? 'Finding best time…' : 'Find Best Time'}
                    </button>
                    {scheduleError && (
                      <span className="text-xs" style={{ color: 'var(--tm-danger)' }}>
                        {scheduleError}
                      </span>
                    )}
                  </div>

                ) : workBlock.status === 'suggested' ? (
                  /* ── State 2: suggested — accept or dismiss ────────────── */
                  <div className="flex items-center flex-wrap gap-2">
                    <span
                      className="chip text-[10px] font-bold uppercase tracking-wide"
                      style={{ backgroundColor: 'var(--tm-accent-subtle)', color: 'var(--tm-accent)' }}
                    >
                      Suggested Time
                    </span>
                    <span className="text-xs text-text-secondary">
                      {new Date(workBlock.start_time).toLocaleString([], {
                        weekday: 'short', month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                      {' – '}
                      {new Date(workBlock.end_time).toLocaleTimeString([], {
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                    <button
                      onClick={() => onWorkBlockAction?.(workBlock.id, 'confirmed')}
                      className="btn text-xs px-2.5 py-1 flex items-center gap-1 font-semibold rounded-lg"
                      style={{ backgroundColor: '#059669', color: '#fff' }}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      Accept
                    </button>
                    <button
                      onClick={() => onWorkBlockAction?.(workBlock.id, 'dismissed')}
                      className="btn btn-secondary text-xs px-2.5 py-1 flex items-center gap-1"
                    >
                      <X className="w-3 h-3" />
                      Dismiss
                    </button>
                  </div>

                ) : (
                  /* ── State 3: confirmed — show badge and removal action ── */
                  <div className="flex items-center flex-wrap gap-2">
                    <span
                      className="chip text-[10px] font-bold uppercase tracking-wide flex items-center gap-1"
                      style={{ backgroundColor: '#d1fae5', color: '#059669' }}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      Scheduled
                    </span>
                    <span className="text-xs text-text-secondary">
                      {new Date(workBlock.start_time).toLocaleString([], {
                        weekday: 'short', month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                      {' – '}
                      {new Date(workBlock.end_time).toLocaleTimeString([], {
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                    <button
                      onClick={() => onDeleteWorkBlock?.(workBlock.id)}
                      className="btn btn-danger-ghost text-xs px-2.5 py-1 flex items-center gap-1"
                    >
                      <CalendarX2 className="w-3 h-3" />
                      Remove from Calendar
                    </button>
                  </div>
                )}

              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskItem;
