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
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div
        className="border-blue-600 border-4 bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        style={{ animation: 'slideUp 0.3s ease-out' }}
      >
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-2xl font-bold text-gray-900">Create New Task</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* Urgent Checkbox */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="urgent"
              checked={newTask.urgent}
              onChange={(e) => handleTaskChange({ ...newTask, urgent: e.target.checked })}
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
            <label htmlFor="urgent" className="text-sm font-medium text-gray-700 flex items-center gap-2">
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
              value={newTask.title}
              onChange={(e) => handleTaskChange({ ...newTask, title: e.target.value })}
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
              value={newTask.description}
              onChange={(e) => handleTaskChange({ ...newTask, description: e.target.value })}
              placeholder="Add task details..."
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none text-black"
            />
          </div>

          {/* Category (optional) */}
          <div>            
            <label className="block text-sm font-medium text-gray-700">
              Select a category to enable <span className="text-blue-600 font-medium">AI Plan Mode</span> 
            </label>
            <p className="text-xs text-gray-500 mb-1">
              (requires estimated hours, complexity, and due date).
            </p>
            {newTask.category && (
              <p className="text-xs text-orange-600 mb-1">
                The task&apos;s category cannot be changed once the AI smart plan is created.
              </p>
            )}            
            <select
              value={newTask.category || ''}
              onChange={(e) => {
                const value = e.target.value;
                handleTaskChange({
                  ...newTask,
                  category: value === '' ? null : value as TaskCategory
                });
              }}
              className="text-black w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estimated Hours{isAIMode && <span className="text-red-500">*</span>}
              </label>
              <input
                type="number"
                required={isAIMode}
                min={0}
                step={0.5}
                value={newTask.estimated_time ?? 0}
                onChange={(e) =>
                  handleTaskChange({
                    ...newTask,
                    estimated_time: Number(e.target.value) || 0,
                  })
                }
                placeholder="e.g. 2.5"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-black"
              />
              <p className="text-xs text-gray-500 mt-1">Increments of 0.5 hours</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Complexity{isAIMode && <span className="text-red-500">*</span>}
              </label>
              <div className="relative">
                <div className="h-2 bg-gray-200 rounded-full" />
                <div
                  className="absolute top-0 left-0 h-2 bg-blue-600 rounded-full transition-all"
                  style={{ width: `${(((newTask.complexity ?? 1) - 1) / 4) * 100}%` }}
                />
                <input
                  type="range"
                  min={1}
                  max={5}
                  step={1}
                  required={isAIMode}
                  value={newTask.complexity ?? 0}
                  onChange={(e) =>
                    handleTaskChange({
                      ...newTask,
                      complexity: parseInt(e.target.value),
                    })
                  }
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
                  input[type='range']::-webkit-slider-thumb:hover {
                    transform: scale(1.1);
                  }
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
                  Level {newTask.complexity}
                </span>
              </div>
            </div>
          </div>          
       
          {/* Due Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Due Date{isAIMode && <span className="text-red-500">*</span>}
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="date"
                  required={isAIMode}
                  value={newTask.due_date ? String(newTask.due_date) : ''}
                  onChange={(e) => handleTaskChange({ ...newTask, due_date: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-black"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Due Time{isAIMode && <span className="text-red-500">*</span>}
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="time"
                  required={isAIMode}                  
                  value={
                    newTask?.due_time instanceof Date
                      ? newTask.due_time.toISOString().slice(11, 16) // HH:mm
                      : (newTask?.due_time ?? '')
                  }
                  onChange={(e) => handleTaskChange({ ...newTask, due_time: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-black"
                />
              </div>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-4 border border-gray-300 rounded-lg bg-gray-50 max-h-48 overflow-y-auto">
              {tags.map((tag) => {
                const selected = newTask.tags.some(t => t.id === tag.id);
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
            {newTask.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="text-xs text-gray-600">Selected:</span>
                {newTask.tags.map((tag) => {
                  const tagData = tags.find(t => t.name === tag.name);
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
          
          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            {isAIMode ? (
              <button
                type="button"
                onClick={handleAISubmit}
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-sm disabled:opacity-75 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="font-bold">Creating...</span>
                  </>
                ) : (
                  <span className="font-bold">Create AI Task Plan</span>
                )}
              </button>
            ) : (
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-sm disabled:opacity-75 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="font-bold">Creating...</span>
                  </>
                ) : (
                  <span className="font-bold">Create Task</span>
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