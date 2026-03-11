import React, { useState } from 'react';
import {
  Check,
  Clock,
  AlertCircle,
  Trash2,
  Pencil,
  BarChart3,
  Calendar,
  X,
  Loader2
} from 'lucide-react';
import { fetchTasks } from '@/app/lib/backend-api';
import { Task } from '@/app/types/task';
import {
  getDueColor,
  getDurationColor,
  getComplexityColor,
  formatTime12Hour,
  formatDueDate
} from '@/app/utils/taskUtils';

interface AISubTaskItemProps {
  task: Task;
  index: number;
  tags: Array<{ id: number; name: string; color: string }>;
  aiTasks: Task[];
  setAiTasks: (task: Task[]) => void;
  setDisplayAITasks: React.Dispatch<React.SetStateAction<boolean>>;
  addTasks: (task: Task[]) => void;
  setTasks: (task: Task[]) => void;
}

// ─── Inline Edit Modal ────────────────────────────────────────────────────────

interface EditModalProps {
  task: Task;
  tags: Array<{ id: number; name: string; color: string }>;
  onClose: () => void;
  onSave: (updated: Task) => void;
}

const AISubTaskEditModal: React.FC<EditModalProps> = ({ task, tags, onClose, onSave }) => {
  const [draft, setDraft] = useState<Task>({ ...task });
  const [isSaving, setIsSaving] = useState(false);

  const handleToggleTag = (tag: { id: number; name: string; color: string }) => {
    const already = draft.tags?.some(t => t.id === tag.id);
    const updatedTags = already
      ? draft.tags.filter(t => t.id !== tag.id)
      : [...(draft.tags ?? []), tag];
    setDraft(prev => ({ ...prev, tags: updatedTags }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    onSave(draft);
    setIsSaving(false);
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 z-50 "
      style={{ animation: 'fadeIn 0.2s ease-out' }}
    >
      <div
        className="border-blue-600 border-4 bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        style={{ animation: 'slideUp 0.3s ease-out' }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <h2 className="text-2xl font-bold text-gray-900">Edit Sub-Task</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          {/* Urgent */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="ai-urgent"
              checked={!!draft.urgent}
              onChange={e => setDraft(prev => ({ ...prev, urgent: e.target.checked }))}
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
            <label htmlFor="ai-urgent" className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-orange-500" />
              Mark as urgent
            </label>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={draft.title}
              onChange={e => setDraft(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter task title"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-black"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={draft.description ?? ''}
              onChange={e => setDraft(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Add task details..."
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none text-black"
            />
          </div>

          {/* Estimated Hours & Complexity */}
          <div className="grid grid-cols-2 gap-4">

            {/* Estimated Hours */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estimated Hours
              </label>
              <input
                type="number"
                min={0}
                step={0.5}
                value={draft.estimated_time ?? ''}
                onChange={e => setDraft(prev => ({ ...prev, estimated_time: Number(e.target.value) }))}
                placeholder="e.g. 2.5"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-black"
              />
              <p className="text-xs text-gray-500 mt-1">Increments of 0.5 hours</p>
            </div>

            {/* Complexity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Complexity
              </label>
              <div className="relative">
                <div className="h-2 bg-gray-200 rounded-full" />
                <div
                  className="absolute top-0 left-0 h-2 bg-blue-600 rounded-full transition-all"
                  style={{ width: `${(((draft.complexity ?? 1) - 1) / 4) * 100}%` }}
                />
                <input
                  type="range"
                  min={1}
                  max={5}
                  step={1}
                  value={draft.complexity ?? 1}
                  onChange={e => setDraft(prev => ({ ...prev, complexity: parseInt(e.target.value) }))}
                  className="absolute top-0 left-0 w-full h-2 appearance-none bg-transparent cursor-pointer"
                />
                <style jsx>{`
                  input[type='range']::-webkit-slider-thumb {
                    appearance: none;
                    height: 18px;
                    width: 18px;
                    border-radius: 9999px;
                    background: white;
                    border: 3px solid #2563eb;
                    cursor: pointer;
                    transition: 0.2s ease;
                  }
                  input[type='range']::-webkit-slider-thumb:hover { transform: scale(1.1); }
                  input[type='range']::-moz-range-thumb {
                    height: 18px;
                    width: 18px;
                    border-radius: 9999px;
                    background: white;
                    border: 3px solid #2563eb;
                    cursor: pointer;
                  }
                `}</style>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>Very Easy</span>
                <span>Very Hard</span>
              </div>
              <div className="mt-3 flex justify-center">
                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-semibold rounded-full">
                  Level {draft.complexity ?? 1}
                </span>
              </div>
            </div>
          </div>

          {/* Due Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="date"
                  value={draft.due_date ? new Date(draft.due_date).toISOString().slice(0, 10) : ''}
                  onChange={e => setDraft(prev => ({ ...prev, due_date: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-black"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Due Time</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="time"
                  value={
                    draft.due_time instanceof Date
                      ? draft.due_time.toISOString().slice(11, 16)
                      : (draft.due_time ?? '')
                  }
                  onChange={e => setDraft(prev => ({ ...prev, due_time: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-black"
                />
              </div>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-4 border border-gray-300 rounded-lg bg-gray-50 max-h-48 overflow-y-auto">
              {tags.map(tag => {
                const selected = draft.tags?.some(t => t.id === tag.id) ?? false;
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => handleToggleTag(tag)}
                    style={{
                      backgroundColor: selected ? tag.color : '#F5F1EB',
                      color: selected ? '#ffffff' : '#000000',
                      transform: selected ? 'scale(1)' : 'scale(0.95)',
                    }}
                    className="px-3 py-2 rounded-lg text-sm font-medium transition-all hover:scale-100 active:scale-90"
                  >
                    {tag.name}
                  </button>
                );
              })}
            </div>
            {(draft.tags?.length ?? 0) > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="text-xs text-gray-600">Selected:</span>
                {draft.tags.map(tag => {
                  const tagData = tags.find(t => t.id === tag.id);
                  return (
                    <span
                      key={tag.id}
                      style={{ backgroundColor: tagData?.color || '#3B82F6', color: 'white' }}
                      className="px-2 py-1 rounded-md text-xs font-medium"
                    >
                      {tag.name}
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-sm disabled:opacity-75 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="font-bold">Saving...</span>
                </>
              ) : (
                <span className="font-bold">Save Task</span>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const AISubTaskItem: React.FC<AISubTaskItemProps> = ({
  task,
  index,
  tags,
  aiTasks,
  setAiTasks,
  setDisplayAITasks,
  addTasks,
  setTasks
}) => {
  const [isCompleted, setIsCompleted] = useState(task.completed);
  const [isEditing, setIsEditing] = useState(false);

  const handleToggleComplete = () => setIsCompleted(prev => !prev);

  const handleDelete = () => {
    if (index === aiTasks.length - 1) return;
    setAiTasks(aiTasks.filter((_, i) => i !== index));
  };

  // Commit edited draft back into the shared aiTasks array
  const handleSave = (updated: Task) => {
    const updatedTasks = aiTasks.map((t, i) => (i === index ? updated : t));
    setAiTasks(updatedTasks);
    setIsEditing(false);
  };

  const handleSavePlan = async (tasks: Task[]) => {
    addTasks(tasks.slice(0, -1));
    const all_tasks = await fetchTasks();
    setTasks(all_tasks);
    setDisplayAITasks(false);
  };

  const normalizedDueDate: string | null =
    task.due_date instanceof Date ? task.due_date.toISOString() : task.due_date ?? null;

  const normalizedDueTime: string | null =
    task.due_time instanceof Date ? task.due_time.toISOString() : task.due_time ?? null;

  return (
    <>
      {/* Edit Modal */}
      {isEditing && (
        <AISubTaskEditModal
          task={task}
          tags={tags}
          onClose={() => setIsEditing(false)}
          onSave={handleSave}
        />
      )}

      <div
        className={`
          rounded-2xl p-6 shadow-sm transition-all duration-300 ease-in-out hover:shadow-lg
          ${isCompleted ? 'bg-to-green-100' : 'bg-white'}
        `}
        style={{ animation: `fadeIn 0.4s ease-out ${index * 0.05}s both` }}
      >
        <div className="flex items-start gap-4">

          {/* Toggle Button */}
          <button
            onClick={handleToggleComplete}
            className={`
              mt-1 flex-shrink-0 w-6 h-6 rounded-full border-2
              flex items-center justify-center transition-all duration-300 active:scale-90
              ${isCompleted
                ? 'bg-green-500 border-green-500 scale-110 shadow-md'
                : 'border-gray-300 hover:border-blue-500'}
            `}
          >
            {isCompleted && (
              <Check className="w-4 h-4 text-white animate-[pop_0.25s_ease-out]" />
            )}
          </button>

          <div className="flex-1 min-w-0">

            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-2">
              <h3
                className={`
                  text-lg font-semibold leading-snug transition-all duration-300
                  ${isCompleted ? 'text-gray-400 line-through' : 'text-gray-900'}
                `}
              >
                {task.title}
              </h3>

              <div className="flex items-center gap-2">
                {task.urgent && (
                  <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    URGENT
                  </span>
                )}

                {/* Edit button — now opens the modal */}
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition active:scale-90"
                >
                  <Pencil className="w-4 h-4" />
                </button>

                {/* Trash Button (hidden for last element) */}
                {index !== aiTasks.length - 1 && (
                  <button
                    onClick={handleDelete}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition active:scale-90"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Description */}
            <p
              className={`
                text-sm mb-3 leading-relaxed px-3 py-2 rounded-lg transition-all duration-300
                ${isCompleted
                  ? 'line-through text-gray-400 bg-green-50'
                  : 'text-gray-600 bg-slate-50'}
              `}
            >
              {task.description}
            </p>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              {task.tags && task.tags.map((tagName, i) => {
                const tagData = tags.find(t => t.name === tagName.name);
                return (
                  <span
                    key={i}
                    style={{ backgroundColor: tagData?.color || '#3B82F6', color: 'white' }}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium shadow-sm"
                  >
                    {tagName.name}
                  </span>
                );
              })}
            </div>

            {/* Details Section */}
            <div className="pt-4 border-t border-gray-100">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">

                {/* Due */}
                <div>
                  <p className="text-gray-400 font-semibold uppercase text-[10px] mb-1">Due</p>
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
                  <p className="text-gray-400 font-semibold uppercase text-[10px] mb-1">Created</p>
                  <div className="flex flex-col gap-1 px-3 py-2 rounded-lg bg-gray-50 text-gray-700">
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

                {/* Duration */}
                <div>
                  <p className="text-gray-400 font-semibold uppercase text-[10px] mb-1">Est. Duration</p>
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${getDurationColor(Number(task.estimated_time))}`}>
                    <Clock className="w-4 h-4" />
                    <span>{task.estimated_time != null ? `${task.estimated_time} hrs` : '--'}</span>
                  </div>
                </div>

                {/* Complexity */}
                <div>
                  <p className="text-gray-400 font-semibold uppercase text-[10px] mb-1">Complexity</p>
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${getComplexityColor(task.complexity)}`}>
                    <BarChart3 className="w-4 h-4" />
                    <span>Level {task.complexity ?? '--'}</span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>

        <style jsx>{`
          @keyframes pop {
            0%   { transform: scale(0.6); opacity: 0; }
            100% { transform: scale(1);   opacity: 1; }
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(6px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes slideUp {
            from { transform: translateY(20px); opacity: 0; }
            to   { transform: translateY(0);    opacity: 1; }
          }
        `}</style>
      </div>
            {/* Bottom Actions — only render on the last task card */}
      {index === aiTasks.length - 1 && (
        <div className="flex gap-3 mt-4">
          <button
            onClick={() => setDisplayAITasks(false)}
            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => handleSavePlan(aiTasks)}
            className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold transition-colors shadow-sm"
          >
            Save Plan
          </button>
        </div>
      )}
    </>
  );
};

export default AISubTaskItem;