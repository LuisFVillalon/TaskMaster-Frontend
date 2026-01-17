/*
Purpose: This file contains the main TaskManager component, which serves as the root component 
for the task management application. It integrates various hooks and components to display tasks, 
handle user interactions, and manage application state.

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

import React from 'react';
import { useTasks, useTags } from '@/app/hooks/useTasksAndTags';
import { useTaskManagerState } from '@/app/hooks/useTaskManagerState';
import { useTaskHandlers } from '@/app/hooks/useTaskHandlers';
import { useTaskFiltering } from '@/app/hooks/useTaskFiltering';
import StatsCard from '@/app/components/StatsCard';
import TaskItem from '@/app/components/TaskItem';
import TaskControls from '@/app/components/TaskControls';
import NewTaskModal from '@/app/components/task/NewTaskModal';
import EditTaskModal from '@/app/components/task/EditTaskModal';
import CreateTagModal from '@/app/components/tag/CreateTagModal';
import EditTagModal from '@/app/components/tag/EditTagListModal';
import { Filter } from 'lucide-react';

const TaskManager: React.FC = () => {
  const { tasks, isLoading, toggleComplete, addTask, deleteTask, updateTask, setTasks } = useTasks();
  const { tags, tagsLoading, addTag, delTag, updateTag } = useTags();

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
    sortOrder: state.sortOrder,
    selectedTags: state.selectedTags,
    addTask,
    updateTask,
    addTag,
    updateTag,
    delTag,
  });

  // Filtering and stats
  const { filteredTasks, stats } = useTaskFiltering(
    tasks,
    state.filter,
    state.sortOrder,
    state.searchTerm,
    state.selectedTags
  );
  if (isLoading || tagsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading {isLoading ? 'tasks' : 'tags'}...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-[#EFE7DD]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
          {/* Header */}
          <div className="mb-6 sm:mb-8 flex justify-between items-start">
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-2">Tasks</h1>
              <p className="text-sm sm:text-base text-gray-600">Manage your work, stay productive</p>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem('taskmaster_authenticated');
                window.location.reload();
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            >
              Logout
            </button>
          </div>

          {/* Stats Cards - Mobile First Grid */}
          <div className="grid grid-cols-2 gap-4 my-4">
            <StatsCard title="Total" stats={stats.total} />
            <StatsCard title="Active" stats={stats.active} color="#3B82F6" />
            <StatsCard title="Done" stats={stats.completed} color="#85BB65" />
            <StatsCard title="Urgent" stats={stats.urgent} color="#FF0000" />
          </div>

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
                handlers.openEditTagModal(tags[0]); // For now, edit the first tag
              }
            }}
          />

          {/* Task List - Mobile Optimized */}
          <div className="space-y-3">
            {filteredTasks.map((task, index) => (
              <TaskItem
                key={task.id}
                task={task}
                index={index}
                onToggleComplete={toggleComplete}
                tags={tags}
                onDeleteTask={deleteTask}
                onEditTaskClick={() =>
                  state.setShowEditTaskModal({
                    status: true,
                    task,
                  })
                }
              />
            ))}
          </div>

          {/* Empty State */}
          {filteredTasks.length === 0 && (
            <div className="bg-white rounded-xl sm:rounded-2xl p-8 sm:p-12 text-center shadow-sm border border-gray-100">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Filter className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">No tasks found</h3>
              <p className="text-sm sm:text-base text-gray-600">Try adjusting your filters or search term</p>
            </div>
          )}
        </div>
      </div>

      <NewTaskModal
        isOpen={state.showNewTaskModal}
        onClose={() => state.setShowNewTaskModal(false)}
        newTask={state.newTask}
        onTaskChange={state.setNewTask}
        tags={tags}
        onToggleTag={handlers.toggleTag}
        onSubmit={handlers.handleCreateTask}
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
          tag={state.editingTag}
          onTagChange={state.setEditingTag}
          allTags={tags}
          onDeleteTag={handlers.handleDeleteTag}
          onEditTag={handlers.handleEditTag}
        />
      )}


      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </>
  );
};

export default TaskManager;