/*
Purpose: This custom hook provides event handlers for managing tasks and tags, including creation, 
editing, deletion, and UI state changes.

Variables Summary:
- setShowNewTaskModal, setNewTask, etc.: State setter functions for UI modals and forms.
- newTask, showEditTaskModal, newTag, filter, sortOrder, selectedTags: Current state values.
- addTask, updateTask, addTag, updateTag, delTag: API functions for CRUD operations.

Returns an object with handler functions like handleCreateTask, handleEditTask, toggleSelectedTag, etc.

These variables and handlers manage all user interactions related to task and tag management.
*/

import React from 'react';
import { FilterType, NewTaskForm, EditTaskForm, Tag, EditTaskModalState, Task } from '@/app/types/task';

interface UseTaskHandlersProps {
  // State setters
  setShowNewTaskModal: (show: boolean) => void;
  setNewTask: React.Dispatch<React.SetStateAction<NewTaskForm>>;
  setShowEditTaskModal: React.Dispatch<React.SetStateAction<EditTaskModalState>>;
  setShowCreateTagModal: (show: boolean) => void;
  setNewTag: React.Dispatch<React.SetStateAction<{ name: string; color: string }>>;
  setEditingTag: (tag: Tag | null) => void;
  setShowEditTagModal: (show: boolean) => void;
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  setSortOrder: React.Dispatch<React.SetStateAction<Record<FilterType, 'asc' | 'desc'>>>;
  setSelectedTags: React.Dispatch<React.SetStateAction<Tag[]>>;
  setFilter: React.Dispatch<React.SetStateAction<FilterType>>;

  // Current state values
  newTask: NewTaskForm;
  showEditTaskModal: EditTaskModalState;
  newTag: { name: string; color: string };
  filter: FilterType;
  sortOrder: Record<FilterType, 'asc' | 'desc'>;
  selectedTags: Tag[];

  // API functions
  addTask: (task: NewTaskForm) => Promise<boolean>;
  updateTask: (id: number, task: EditTaskForm) => Promise<boolean>;
  addTag: (tag: { name: string; color: string }) => Promise<Tag | false>;
  updateTag: (tag: Tag) => Promise<number | null>;
  delTag: (tag: Tag) => Promise<number | null>;
}

export const useTaskHandlers = ({
  setShowNewTaskModal,
  setNewTask,
  setShowEditTaskModal,
  setShowCreateTagModal,
  setNewTag,
  setEditingTag,
  setShowEditTagModal,
  setTasks,
  setSortOrder,
  setSelectedTags,
  setFilter,
  newTask,
  showEditTaskModal,
  newTag,
  filter,
//   sortOrder,
//   selectedTags,
  addTask,
  updateTask,
  addTag,
  updateTag,
  delTag,
}: UseTaskHandlersProps) => {

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
    }
  };

  const handleEditTask = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!showEditTaskModal.task) return;
    const taskData: EditTaskForm = {
      title: showEditTaskModal.task.title,
      description: showEditTaskModal.task.description,
      urgent: showEditTaskModal.task.urgent,
      completed: showEditTaskModal.task.completed,
      due_date: showEditTaskModal.task.due_date
        ? (showEditTaskModal.task.due_date instanceof Date
          ? showEditTaskModal.task.due_date.toISOString().slice(0, 10)
          : showEditTaskModal.task.due_date)
        : '',
      due_time: showEditTaskModal.task.due_time
        ? (showEditTaskModal.task.due_time instanceof Date
          ? showEditTaskModal.task.due_time.toISOString().slice(11, 16)
          : showEditTaskModal.task.due_time)
        : '',
      tags: showEditTaskModal.task.tags.map(tag => ({ id: tag.id, name: tag.name, color: tag.color }))
    };

    const success = await updateTask(showEditTaskModal.task.id, taskData);
    if (success) {
      setShowEditTaskModal({status: false, task: null});
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

  const handleEditTag = async (tagToEdit: Tag) => {
    const updatedTagId = await updateTag(tagToEdit);
    if (updatedTagId !== null) {
      // Update the tag in all tasks that have it
      setTasks(prevTasks =>
        prevTasks.map(task => ({
          ...task,
          tags: task.tags.map(tag => tag.id === updatedTagId ? tagToEdit : tag)
        }))
      );
    }
  };

  const handleDeleteTag = async (tagToDelete: Tag) => {
    const deletedTagId = await delTag(tagToDelete);
    if (deletedTagId !== null) {
      // Remove the tag from all tasks that have it
      setTasks(prevTasks =>
        prevTasks.map(task => ({
          ...task,
          tags: task.tags.filter(tag => tag.id !== deletedTagId)
        }))
      );
    }
  };

  const openEditTagModal = (tag: Tag) => {
    setEditingTag(tag);
    setShowEditTagModal(true);
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

  const toggleEditTag = (tag: Tag) => {
    setShowEditTaskModal(prev => {
      if (!prev.task) return prev;
      const exists = prev.task.tags.some(t => t.id === tag.id);
      return {
        ...prev,
        task: {
          ...prev.task,
          tags: exists
            ? prev.task.tags.filter(t => t.id !== tag.id)
            : [...prev.task.tags, tag]
        }
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
        setFilter(newFilter)
    }
  };

  return {
    toggleSelectedTag,
    handleCreateTask,
    handleEditTask,
    handleCreateTag,
    handleEditTag,
    handleDeleteTag,
    openEditTagModal,
    toggleTag,
    toggleEditTag,
    handleFilterChange,
  };
};