/*
Purpose: This custom hook manages all the UI state for the task manager application, including filter settings, modal visibility, and form data.

Variables Summary:
- sortOrder: Object mapping filter types to sort directions.
- selectedTags: Array of tags selected for filtering.
- showTagDropdown: Boolean for tag dropdown visibility.
- filter: Current active filter type.
- searchTerm: String for task search.
- showNewTaskModal, showEditTaskModal, showCreateTagModal, showEditTagModal: Booleans or objects for modal states.
- editingTag: Tag object being edited.
- newTag: Form data for new tag creation.
- newTask: Form data for new task creation.

Returns an object with all state values and their setter functions.

These variables maintain the application's UI state across components.
*/

import { useState } from 'react';
import { FilterType, NewTaskForm, NewTagForm, Tag, EditTaskModalState } from '@/app/types/task';

export const useTaskManagerState = () => {
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

  // Modal states
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [showEditTaskModal, setShowEditTaskModal] = useState<EditTaskModalState>({
    status: false,
    task: null,
  });
  const [showCreateTagModal, setShowCreateTagModal] = useState(false);
  const [showEditTagModal, setShowEditTagModal] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);

  // Form states
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

  return {
    // State
    sortOrder,
    setSortOrder,
    selectedTags,
    setSelectedTags,
    showTagDropdown,
    setShowTagDropdown,
    filter,
    setFilter,
    searchTerm,
    setSearchTerm,
    showNewTaskModal,
    setShowNewTaskModal,
    showEditTaskModal,
    setShowEditTaskModal,
    showCreateTagModal,
    setShowCreateTagModal,
    showEditTagModal,
    setShowEditTagModal,
    editingTag,
    setEditingTag,
    newTag,
    setNewTag,
    newTask,
    setNewTask,
  };
};