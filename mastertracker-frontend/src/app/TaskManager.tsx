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

import React, { useState } from 'react';
import { useTasks, useTags } from '@/app/hooks/useTasksAndTags';
import { useCanvasData } from './hooks/useCanvasData';
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
import { Filter, ChevronDown, ChevronUp } from 'lucide-react';
import Image from 'next/image';
import CanvasWrapper from '@/app/components/canvas/CanvasWrapper';
import SDSUAcademicCalendar from '@/app/components/SDSUAcademicCalendar';

const TaskManager: React.FC<{ isDemo: boolean }> = ({ isDemo }) => {
  const { tasks, isLoading, toggleComplete, addTask, deleteTask, updateTask, setTasks } = useTasks(isDemo);
  const { 
    currentCourseId,
    canvasCourses,
    canvasModules,
    canvasAssignments,
    canvasQuizzes,
    canvasIsLoading,
    setCurrentCourseId,
    setCanvasCourses,
    setCanvasModules,
    setCanvasAssignments,
    setCanvasQuizzes,
    getCourseModules,
    getCourseAssignments,
    getCourseQuizzes,
    getCourseModuleItems,
    getCourseAssignmentItems,
    getCourseQuizItems
  } = useCanvasData();
  const { tags, tagsLoading, addTag, delTag, updateTag } = useTags(isDemo);

  // Mobile-specific state
  const [showStats, setShowStats] = useState(false);
  const [showCal, setShowCal] = useState(false);
  const [showCanvas, setShowCanvas] = useState(true);

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
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-10">
          {/* Header - Mobile Optimized */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
            <div className="flex items-center gap-2 sm:gap-3">
<div className="flex items-center">
  <div className="relative w-14 h-14 sm:w-16 sm:h-16 lg:w-32 lg:h-32 xl:w-40 xl:h-40">
    <Image
      src="/icon.svg"
      alt="Favicon"
      fill
      className="object-contain"
      priority
    />
  </div>
</div>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-5xl font-bold text-gray-900">Task Master</h1>
                <p className="text-xs sm:text-sm lg:text-base text-gray-600">Manage your work, stay productive</p>
              </div>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem('taskmaster_authenticated');
                window.location.reload();
              }}
              className="px-3 py-2 sm:px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs sm:text-sm font-medium w-full sm:w-auto"
            >
              Logout
            </button>
          </div>

          {/* Academic Calendar & Stats Cards - Mobile Responsive */}
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6'>
            {/* Academic Calendar - Hidden on mobile, shown on larger screens */}
            <button 
                onClick={() => setShowCal(!showCal)}
                className="text-black lg:hidden w-full flex items-center justify-between p-3 bg-white rounded-lg shadow-sm mb-2"
              >
                <span className="font-semibold text-gray-900">Academic Calendar</span>
                {showCal ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            <div className={`${!showCal ? 'hidden lg:grid' : ''}`}>
              <SDSUAcademicCalendar/>
            </div>
            
            {/* Stats Cards - Collapsible on mobile */}
            <div className="w-full lg:w-auto">
              <button 
                onClick={() => setShowStats(!showStats)}
                className="text-black lg:hidden w-full flex items-center justify-between p-3 bg-white rounded-lg shadow-sm mb-2"
              >
                <span className="font-semibold text-gray-900">Statistics</span>
                {showStats ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
              
              <div className={`grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-1 gap-2 sm:gap-3 lg:gap-4 ${!showStats ? 'hidden lg:grid' : ''}`}>
                <StatsCard title="Total" stats={stats.total} />
                <StatsCard title="Active" stats={stats.active} color="#3B82F6" />
                <StatsCard title="Done" stats={stats.completed} color="#85BB65" />
                <StatsCard title="Urgent" stats={stats.urgent} color="#FF0000" />
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
            />
          </div>

          {/* Task List and Canvas Container - Mobile Responsive */}
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4'>
            
            {/* Task List - Mobile Optimized with Fixed Height */}
            <div className="space-y-2 sm:space-y-3 order-1 lg:order-1">
              <div className='font-bold text-xl sm:text-2xl text-black px-2'>To Do:</div>
              {filteredTasks.length === 0 ? (
                <div className="bg-white rounded-lg sm:rounded-xl lg:rounded-2xl p-6 sm:p-8 lg:p-12 text-center shadow-sm border border-gray-100 mt-4">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <Filter className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-gray-400" />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">No tasks found</h3>
                  <p className="text-sm sm:text-base text-gray-600">Try adjusting your filters or search term</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2 overflow-y-auto h-[50vh] sm:h-[60vh] lg:h-[600px] pl-2 pr-1 scrollbar-custom">
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
              )}
            </div>
            {/* Canvas Wrapper - Collapsible on mobile */}
            <div className="order-2 lg:order-2">
              <button 
                onClick={() => setShowCanvas(!showCanvas)}
                className="text-black lg:hidden w-full flex items-center justify-between p-3 bg-white rounded-lg shadow-sm mb-2"
              >
                <span className="font-semibold text-gray-900">Canvas Integration</span>
                {showCanvas ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
              
              <div className={`${!showCanvas ? 'hidden lg:block' : 'block'}`}>
                <CanvasWrapper
                  currentCourseId={currentCourseId}
                  canvasCourses={canvasCourses}
                  canvasModules={canvasModules}
                  canvasAssignments={canvasAssignments}
                  canvasQuizzes={canvasQuizzes}
                  canvasIsLoading={canvasIsLoading}
                  setCurrentCourseId={setCurrentCourseId}
                  setCanvasCourses={setCanvasCourses}
                  setCanvasModules={setCanvasModules}
                  setCanvasAssignments={setCanvasAssignments}
                  setCanvasQuizzes={setCanvasQuizzes}              
                  getCourseModules={getCourseModules}
                  getCourseAssignments={getCourseAssignments}
                  getCourseQuizzes={getCourseQuizzes}
                  getCourseModuleItems={getCourseModuleItems}
                  getCourseAssignmentItems={getCourseAssignmentItems}
                  getCourseQuizItems={getCourseQuizItems}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
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

        /* Custom scrollbar for better mobile experience */
        .scrollbar-custom {
          direction: rtl;
          scrollbar-width: thin;
          scrollbar-color: rgba(148, 163, 184, 0.4) transparent;
        }

        .scrollbar-custom > :global(*) {
          direction: ltr;
        }

        .scrollbar-custom::-webkit-scrollbar {
          width: 4px;
        }

        @media (min-width: 640px) {
          .scrollbar-custom::-webkit-scrollbar {
            width: 6px;
          }
        }

        .scrollbar-custom::-webkit-scrollbar-track {
          background: transparent;
        }

        .scrollbar-custom::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.4);
          border-radius: 10px;
          transition: background 0.2s ease;
        }

        .scrollbar-custom::-webkit-scrollbar-thumb:hover {
          background: rgba(100, 116, 139, 0.6);
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        /* Touch-friendly tap targets */
        @media (max-width: 640px) {
          button {
            min-height: 44px;
          }
        }
      `}</style>
    </>
  );
};

export default TaskManager;