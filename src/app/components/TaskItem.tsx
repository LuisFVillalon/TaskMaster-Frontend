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

import React from 'react';
import { Check, Clock, AlertCircle, Trash2, Pencil, BarChart3, Calendar  } from 'lucide-react';
import { Task } from '@/app/types/task';
// import { formatDueDate, formatDueTime, getDueDateColor } from '@/app/utils/taskUtils';
import { getDueColor, getDurationColor, getComplexityColor, formatTime12Hour, formatDueDate } from '@/app/utils/taskUtils';

interface TaskItemProps {
  task: Task;
  index: number;
  onToggleComplete?: (id: number) => void;
  tags: Array<{ id: number; name: string; color: string }>;
  onDeleteTask?: (task: Task) => void;
  onEditTaskClick?: (params: { status: boolean; task: Task }) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, index, onToggleComplete, tags, onDeleteTask, onEditTaskClick }) => {
    const handleDeleteTask = async (taskToDelete: Task) => {
        onDeleteTask?.(taskToDelete);
    };
    const handleEditTask = async (  { status, taskToEdit }: { status: boolean; taskToEdit: Task }
    ) => {
        onEditTaskClick?.({
            status,
            task: taskToEdit,
        });
    };    
    const normalizedDueDate: string | null =
      task.due_date instanceof Date
        ? task.due_date.toISOString()
        : task.due_date ?? null;
    const normalizedDueTime: string | null =
      task.due_time instanceof Date
        ? task.due_time.toISOString()
        : task.due_time ?? null;        
  return (
      <div
        className={`
          ${task.completed ? "bg-green-300 border-green-200" : "bg-white border-gray-100"}
          rounded-xl sm:rounded-2xl 
          p-4 sm:p-6 
          shadow-sm hover:shadow-md 
          transition-all active:scale-[0.99]
        `}
        style={{
          animation: `fadeIn 0.3s ease-out ${index * 0.05}s both`
        }}
      >
      <div className="flex items-start gap-3 sm:gap-4">
        <button
          onClick={() => onToggleComplete?.(task.id)}
          className={`mt-0.5 sm:mt-1 flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center transition-all active:scale-90 ${
            task.completed
              ? 'bg-green-500 border-green-500'
              : 'border-gray-300 hover:border-blue-500'
          }`}
        >
          {task.completed && <Check className="w-3 h-3 sm:w-4 sm:h-4 text-white" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 sm:gap-4 mb-1.5 sm:mb-2">
            <h3
                className={`text-base sm:text-lg font-semibold leading-snug ${
                task.completed ? 'text-gray-400 line-through' : 'text-gray-900'
                }`}
            >
                {task.title}
            </h3>
            {task.category && (
              <span className="mt-1 inline-block px-2 py-0.5 bg-blue-100 text-blue-800 font-bold text-xs rounded-full">
                {task.category.toUpperCase()}
              </span>
            )}

            <div className="flex items-center gap-1.5">
                <span className="flex-shrink-0 px-2 sm:px-3 py-0.5 sm:py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    <span className="hidden sm:inline">URGENT</span>
                </span>
                {/* Edit button */}
                <button
                    onClick={() =>
                    handleEditTask({
                        status: true,
                        taskToEdit: task,
                    })
                    }
                className="cursor-pointer p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition"
                title="Edit task"
                >
                <Pencil className="w-4 h-4" />
                </button>

                {/* Delete button */}
                <button
                onClick={() => handleDeleteTask(task)}
                className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition cursor-pointer"
                title="Delete task"
                >
                <Trash2 className="w-4 h-4" />
                </button>
            </div>
          </div>
          <p className={`text-xs sm:text-sm mb-3 leading-relaxed px-3 py-2 rounded-lg ${
            task.completed 
              ? 'line-through text-gray-300 bg-gray-50' 
              : 'text-gray-500 bg-slate-50'
          }`}>
            {task.description}
          </p>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              {task.tags && task.tags.map((tagName, i) => {
                const tagData = tags.find(t => t.name === tagName.name);
                return (
                  <span
                    key={i}
                    style={{
                      backgroundColor: tagData?.color || '#3B82F6',
                      color: 'white'
                    }}
                    className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg text-xs font-medium"
                  >
                    {tagName.name}
                  </span>
                );
              })}
            </div>
          </div>
          {/* Task Details Section */}
          <div className="mt-4 pt-3 border-t border-gray-100">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs sm:text-sm">

              {/* Due */}
              <div>
                <p className="text-gray-400 font-semibold uppercase tracking-wide text-[10px] mb-1">
                  Due
                </p>
                <div className={`flex flex-col gap-1 px-3 py-2 rounded-lg ${getDueColor(task.due_date)}`}>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {formatDueDate(normalizedDueDate, normalizedDueTime)}
                  </span>
                </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>
                      {formatTime12Hour(
                        typeof task.due_time === "string" ? task.due_time : null
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Created */}
              <div>
                <p className="text-gray-400 font-semibold uppercase tracking-wide text-[10px] mb-1">
                  Created
                </p>
                <div className="flex flex-col gap-1 px-3 py-2 rounded-lg bg-gray-50 text-gray-700">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(task.created_date).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {new Date(task.created_date).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>

              {/* Estimated Duration */}
              <div>
                <p className="text-gray-400 font-semibold uppercase tracking-wide text-[10px] mb-1">
                  Est. Duration
                </p>
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${getDurationColor(Number(task.estimated_time))}`}>
                  <Clock className="w-4 h-4" />
                  <span>
                    {task.estimated_time != null ? `${task.estimated_time} hrs` : "--"}
                  </span>
                </div>
              </div>

              {/* Complexity */}
              <div>
                <p className="text-gray-400 font-semibold uppercase tracking-wide text-[10px] mb-1">
                  Complexity
                </p>
                <div className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg ${getComplexityColor(task.complexity)}`}>
                  <div className="flex items-center gap-1">
                    <BarChart3 className="w-4 h-4" />
                    <span>Level {task.complexity ?? "--"}</span>
                  </div>
                </div>
              </div>

            </div>
          </div> 
        </div>
      </div>
    </div>
  );
};

export default TaskItem;