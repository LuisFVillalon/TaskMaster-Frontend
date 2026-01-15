'use client';

import React, { useState } from 'react';
import { useTasks, useTags } from '@/app/hooks/useTasksAndTags';
import { countTasksByTag, getTaskDateTime } from '@/app/utils/taskUtils';
import { FilterType, StatsData, NewTaskForm, NewTagForm, Tag } from '@/app/types/task';
import StatsCard from '@/app/components/StatsCard';
import TaskItem from '@/app/components/TaskItem';
import TaskControls from '@/app/components/TaskControls';
import NewTaskModal from '@/app/components/NewTaskModal';
import CreateTagModal from '@/app/components/CreateTagModal';
import { Filter } from 'lucide-react';



const TaskManager: React.FC = () => {
  const { tasks, isLoading, toggleComplete, addTask } = useTasks();
  const { tags, tagsLoading, addTag } = useTags();

  const [sortOrder, setSortOrder] = useState<Record<FilterType, 'asc' | 'desc'>>({
    all: 'asc',
    active: 'asc',
    completed: 'asc',
    urgent: 'asc',
  });
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [showCreateTagModal, setShowCreateTagModal] = useState(false);
  const [newTag, setNewTag] = useState<NewTagForm>({
    name: '',
    color: '#3B82F6'
  });
  const [newTask, setNewTask] = useState<NewTaskForm>({
    title: '',
    description: '',
    urgent: false,
    due_date: '',
    due_time: '',
    tags: []
  });

  const toggleSelectedTag = (tag: Tag) => {
    setSelectedTags(prev =>
      prev.some(t => t.id === tag.id)
        ? prev.filter(t => t.id !== tag.id)
        : [...prev, tag]
    );
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();

    const success = await addTask(newTask);
    if (success) {
      setShowNewTaskModal(false);
      setNewTask({
        title: '',
        description: '',
        urgent: false,
        due_date: '',
        due_time: '',
        tags: []
      });
      alert("Task created successfully!");
    }
  };

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();

    const tag = await addTag(newTag);
    if (tag) {
      setNewTask(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));

      setNewTag({ name: '', color: '#3B82F6' });
      setShowCreateTagModal(false);
    }
  };

  const toggleTag = (tag: Tag) => {
    setNewTask(prev => {
      const exists = prev.tags.some(t => t.id === tag.id);

      return {
        ...prev,
        tags: exists
          ? prev.tags.filter(t => t.id !== tag.id)
          : [...prev.tags, tag]
      };
    });
  };

  const handleFilterChange = (newFilter: FilterType) => {
    if (filter === newFilter) {
      // Same filter clicked → toggle sort
      setSortOrder(prev => ({
        ...prev,
        [newFilter]: prev[newFilter] === 'asc' ? 'desc' : 'asc'
      }));
    } else {
      // New filter → set filter
      setFilter(newFilter);
    }
  };

  const filteredTasks = Array.isArray(tasks)
    ? tasks
        .filter(task => {
          const matchesStatus =
            filter === 'all'
              ? true
              : filter === 'active'
              ? !task.completed
              : filter === 'completed'
              ? task.completed
              : filter === 'urgent'
              ? task.urgent && !task.completed
              : true;

          const matchesSearch =
            task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            task.description.toLowerCase().includes(searchTerm.toLowerCase());

          const matchesTags =
            selectedTags.length === 0 ||
            task.tags.some(taskTag =>
              selectedTags.some(selected => selected.id === taskTag.id)
            );


          return matchesStatus && matchesSearch && matchesTags;
        })
        .sort((a, b) => {
          const diff = getTaskDateTime(a) - getTaskDateTime(b);
          return sortOrder[filter] === 'asc' ? diff : -diff;
        })
    : [];
  const stats: StatsData = {
    total: {
      tasks: tasks,
      tags: countTasksByTag(tasks)
    },
    active: {
      tasks: tasks.filter(t => !t.completed),
      tags: countTasksByTag(tasks.filter(t => !t.completed))
    },
    completed: {
      tasks: tasks.filter(t => t.completed),
      tags: countTasksByTag(tasks.filter(t => t.completed))
    },
    urgent: {
      tasks: tasks.filter(t => t.urgent && !t.completed),
      tags: countTasksByTag(tasks.filter(t => t.urgent && !t.completed))
    }
  };
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-2">Tasks</h1>
            <p className="text-sm sm:text-base text-gray-600">Manage your work, stay productive</p>
          </div>

          {/* Stats Cards - Mobile First Grid */}
          <div className="grid grid-cols-2 gap-4 my-4">
            <StatsCard title="Total" stats={stats.total} />
            <StatsCard title="Active" stats={stats.active} color="#3B82F6" />
            <StatsCard title="Done" stats={stats.completed} color="#85BB65" />
            <StatsCard title="Urgent" stats={stats.urgent} color="#FF0000" />
          </div>

          <TaskControls
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            filter={filter}
            sortOrder={sortOrder}
            onFilterChange={handleFilterChange}
            selectedTags={selectedTags}
            onTagToggle={toggleSelectedTag}
            showTagDropdown={showTagDropdown}
            onTagDropdownToggle={() => setShowTagDropdown(prev => !prev)}
            tags={tags}
            onNewTaskClick={() => setShowNewTaskModal(true)}
            onCreateTagClick={() => setShowCreateTagModal(true)}
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
        isOpen={showNewTaskModal}
        onClose={() => setShowNewTaskModal(false)}
        newTask={newTask}
        onTaskChange={setNewTask}
        tags={tags}
        onToggleTag={toggleTag}
        onSubmit={handleCreateTask}
      />

      <CreateTagModal
        isOpen={showCreateTagModal}
        onClose={() => setShowCreateTagModal(false)}
        newTag={newTag}
        onTagChange={setNewTag}
        onSubmit={handleCreateTag}
      />


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