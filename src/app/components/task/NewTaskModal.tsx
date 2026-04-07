import React, { Dispatch, SetStateAction, useState } from 'react';
import { X, Calendar, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { BaseTaskForm, Tag, TaskCategory, Task } from '@/app/types/task';

interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  newTask: BaseTaskForm;
  onTaskChange: (task: BaseTaskForm) => void;
  tags: Tag[];
  onToggleTag: (tag: Tag) => void;
  onSubmit: (e: React.FormEvent) => void;
  handleNewAITask: (task: BaseTaskForm) => Promise<void>;
  newAITask: Task | undefined;
  setNewAITask: Dispatch<SetStateAction<Task | undefined>>;
}

const NewTaskModal: React.FC<NewTaskModalProps> = ({
  isOpen,
  onClose,
  newTask,
  onTaskChange,
  tags,
  onToggleTag,
  onSubmit,
  handleNewAITask,
  newAITask,
  setNewAITask
}) => {
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;
  const isAIMode = !!newTask.category;

  const handleTaskChange = (updatedTask: BaseTaskForm) => {
    onTaskChange(updatedTask);
    setNewAITask((prev) => ({
      ...prev,
      title: updatedTask.title,
      description: updatedTask.description,
      urgent: updatedTask.urgent,
      category: updatedTask.category,
      estimated_time: updatedTask.estimated_time,
      complexity: updatedTask.complexity,
      due_date: updatedTask.due_date,
      due_time: updatedTask.due_time,
      tags: updatedTask.tags,
    } as Task));
  };

  const handleToggleTag = (tag: Tag) => {
    onToggleTag(tag);
    setNewAITask((prev) => {
      if (!prev) return prev;
      const alreadySelected = prev.tags?.some((t) => t.id === tag.id);
      const updatedTags = alreadySelected
        ? (prev.tags ?? []).filter((t) => t.id !== tag.id)
        : [...(prev.tags ?? []), tag];
      return { ...prev, tags: updatedTags };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    setIsLoading(true);
    await onSubmit(e);
    setIsLoading(false);
  };

  const handleAISubmit = async () => {
    setIsLoading(true);
    await handleNewAITask(newAITask!);
    setIsLoading(false);
  };

  return (
    <div className="modal-overlay fixed inset-0 flex items-center justify-center p-4 z-50">
      <div className="modal-panel max-w-lg w-full max-h-[90vh] overflow-y-auto scrollbar-custom">
        {/* Header */}
        <div
          className="sticky top-0 px-6 py-4 flex items-center justify-between rounded-t-[1.25rem] border-b border-border-subtle"
          style={{ backgroundColor: 'var(--tm-surface)' }}
        >
          <h2 className="text-xl font-bold text-text-primary">Create New Task</h2>
          <button onClick={onClose} className="btn btn-ghost" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          {/* Urgent Checkbox */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              id="urgent"
              checked={newTask.urgent}
              onChange={(e) => handleTaskChange({ ...newTask, urgent: e.target.checked })}
              className="w-5 h-5 rounded accent-accent border-border"
            />
            <span className="text-sm font-medium text-text-secondary flex items-center gap-2">
              <AlertCircle className="w-4 h-4" style={{ color: 'var(--tm-warning)' }} />
              Mark as urgent
            </span>
          </label>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Title <span style={{ color: 'var(--tm-danger)' }}>*</span>
            </label>
            <input
              type="text"
              required
              value={newTask.title}
              onChange={(e) => handleTaskChange({ ...newTask, title: e.target.value })}
              placeholder="Enter task title"
              className="input-field"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Description</label>
            <textarea
              value={newTask.description}
              onChange={(e) => handleTaskChange({ ...newTask, description: e.target.value })}
              placeholder="Add task details…"
              rows={3}
              className="input-field resize-none"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-text-secondary">
              Select a category to enable{' '}
              <span style={{ color: 'var(--tm-accent)' }} className="font-semibold">AI Plan Mode</span>
            </label>
            <p className="text-xs text-text-muted mb-1">(requires estimated hours, complexity, and due date).</p>
            {newTask.category && (
              <p className="text-xs mb-1" style={{ color: 'var(--tm-warning)' }}>
                The task&apos;s category cannot be changed once the AI smart plan is created.
              </p>
            )}
            <select
              value={newTask.category || ''}
              onChange={(e) => {
                const value = e.target.value;
                handleTaskChange({ ...newTask, category: value === '' ? null : value as TaskCategory });
              }}
              className="input-field"
            >
              <option value="">(none)</option>
              <option value="homework">Homework Assignment</option>
              <option value="test">Test</option>
              <option value="project">Project</option>
              <option value="interview">Interview</option>
              <option value="skill">Skill</option>
            </select>
          </div>

          {/* Estimated Hours & Complexity */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Estimated Hours{isAIMode && <span style={{ color: 'var(--tm-danger)' }}>*</span>}
              </label>
              <input
                type="number"
                required={isAIMode}
                min={0}
                step={0.5}
                value={newTask.estimated_time ?? 0}
                onChange={(e) => handleTaskChange({ ...newTask, estimated_time: Number(e.target.value) || 0 })}
                placeholder="e.g. 2.5"
                className="input-field"
              />
              <p className="text-xs text-text-muted mt-1">Increments of 0.5 hours</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-3">
                Complexity{isAIMode && <span style={{ color: 'var(--tm-danger)' }}>*</span>}
              </label>
              <div className="relative">
                <div className="h-2 rounded-full" style={{ backgroundColor: 'var(--tm-border)' }} />
                <div
                  className="absolute top-0 left-0 h-2 rounded-full transition-all"
                  style={{
                    width: `${(((newTask.complexity ?? 1) - 1) / 4) * 100}%`,
                    backgroundColor: 'var(--tm-accent)',
                  }}
                />
                <input
                  type="range"
                  min={1}
                  max={5}
                  step={1}
                  required={isAIMode}
                  value={newTask.complexity ?? 1}
                  onChange={(e) => handleTaskChange({ ...newTask, complexity: parseInt(e.target.value) })}
                  className="absolute top-0 left-0 w-full h-2 appearance-none bg-transparent cursor-pointer"
                  style={{ accentColor: 'var(--tm-accent)' }}
                />
              </div>
              <div className="flex justify-between text-xs text-text-muted mt-2">
                <span>Very Easy</span>
                <span>Very Hard</span>
              </div>
              <div className="mt-3 flex justify-center">
                <span
                  className="chip font-semibold text-sm px-3 py-1"
                  style={{ backgroundColor: 'var(--tm-accent-subtle)', color: 'var(--tm-accent)' }}
                >
                  Level {newTask.complexity}
                </span>
              </div>
            </div>
          </div>

          {/* Due Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Due Date{isAIMode && <span style={{ color: 'var(--tm-danger)' }}>*</span>}
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted pointer-events-none" />
                <input
                  type="date"
                  required={isAIMode}
                  value={newTask.due_date ? String(newTask.due_date) : ''}
                  onChange={(e) => handleTaskChange({ ...newTask, due_date: e.target.value })}
                  className="input-field pl-10"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Due Time{isAIMode && <span style={{ color: 'var(--tm-danger)' }}>*</span>}
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted pointer-events-none" />
                <input
                  type="time"
                  required={isAIMode}
                  value={
                    newTask?.due_time instanceof Date
                      ? newTask.due_time.toISOString().slice(11, 16)
                      : (newTask?.due_time ?? '')
                  }
                  onChange={(e) => handleTaskChange({ ...newTask, due_time: e.target.value })}
                  className="input-field pl-10"
                />
              </div>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Tags</label>
            <div
              className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-4 rounded-xl border border-border max-h-48 overflow-y-auto scrollbar-custom"
              style={{ backgroundColor: 'var(--tm-surface-raised)' }}
            >
              {tags.map((tag) => {
                const selected = newTask.tags.some(t => t.id === tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => handleToggleTag(tag)}
                    style={{
                      backgroundColor: selected ? tag.color : 'var(--tm-surface)',
                      color: selected ? '#ffffff' : 'var(--tm-text-primary)',
                      border: `1px solid ${selected ? tag.color : 'var(--tm-border)'}`,
                      transform: selected ? 'scale(1)' : 'scale(0.97)',
                    }}
                    className="px-3 py-2 rounded-lg text-sm font-medium transition-all hover:scale-100 active:scale-95"
                  >
                    {tag.name}
                  </button>
                );
              })}
            </div>
            {newTask.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2 items-center">
                <span className="text-xs text-text-muted">Selected:</span>
                {newTask.tags.map((tag) => {
                  const tagData = tags.find(t => t.name === tag.name);
                  return (
                    <span
                      key={tag.id}
                      className="chip px-2 rounded"
                      style={{ backgroundColor: tagData?.color ?? 'var(--tm-accent)', color: 'white' }}
                    >
                      {tag.name}
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="btn btn-secondary flex-1 py-2.5"
            >
              Cancel
            </button>
            {isAIMode ? (
              <button
                type="button"
                onClick={handleAISubmit}
                disabled={isLoading}
                className="btn btn-primary flex-1 py-2.5"
              >
                {isLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</>
                ) : (
                  'Create AI Task Plan'
                )}
              </button>
            ) : (
              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary flex-1 py-2.5"
              >
                {isLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</>
                ) : (
                  'Create Task'
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewTaskModal;
