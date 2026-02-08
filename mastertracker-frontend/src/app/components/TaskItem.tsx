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
import { Check, Clock, AlertCircle, Trash2, Pencil } from 'lucide-react';
import { Task } from '@/app/types/task';
import { formatDueDate, formatDueTime, getDueDateColor } from '@/app/utils/taskUtils';

interface TaskItemProps {
  task: Task;
  index: number;
  onToggleComplete: (id: number) => void;
  tags: Array<{ id: number; name: string; color: string }>;
  onDeleteTask: (task: Task) => void;
  onEditTaskClick: (params: { status: boolean; task: Task }) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, index, onToggleComplete, tags, onDeleteTask, onEditTaskClick }) => {
    const handleDeleteTask = async (taskToDelete: Task) => {
        onDeleteTask(taskToDelete);
    };
    const handleEditTask = async (  { status, taskToEdit }: { status: boolean; taskToEdit: Task }
    ) => {
        onEditTaskClick({
            status,
            task: taskToEdit,
        });
    };    
  return (
    <div
      className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all active:scale-[0.99]"
      style={{
        animation: `fadeIn 0.3s ease-out ${index * 0.05}s both`
      }}
    >
      <div className="flex items-start gap-3 sm:gap-4">
        <button
          onClick={() => onToggleComplete(task.id)}
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

            <div className="flex items-center gap-1.5">
                {task.urgent && !task.completed && (
                <span className="flex-shrink-0 px-2 sm:px-3 py-0.5 sm:py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    <span className="hidden sm:inline">Urgent</span>
                </span>
                )}

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
          <p className={`break-words text-xs sm:text-sm mb-3 leading-relaxed ${
            task.completed ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {task.description}
          </p>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <div className={`flex items-center gap-1.5 text-xs sm:text-sm ${getDueDateColor(task.due_date, task.completed)}`}>
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {formatDueDate(task.due_date)}
            </div>
            {task.due_time ? (
              <div className={`flex items-center gap-1.5 text-xs sm:text-sm ${task.completed ? 'text-gray-400' : 'text-gray-500'}`}>
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                {formatDueTime(task.due_time)}
              </div> ) : (
              <div className={`flex items-center gap-1.5 text-xs sm:text-sm ${task.completed ? 'text-gray-400' : 'text-gray-500'}`}>
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <p>--:--</p>
              </div>
            )}

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
        </div>
      </div>
    </div>
  );
};

export default TaskItem;