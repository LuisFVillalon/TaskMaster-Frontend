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
import { FilterType, EditTaskForm, Tag, EditTaskModalState, Task, NewTag, BaseTaskForm } from '@/app/types/task';

interface UseTaskHandlersProps {
  // State setters
  setShowNewTaskModal: (show: boolean) => void;
  setNewTask: React.Dispatch<React.SetStateAction<BaseTaskForm>>;
  setNewAITask: React.Dispatch<React.SetStateAction<Task>>;
  setShowEditTaskModal: React.Dispatch<React.SetStateAction<EditTaskModalState>>;
  setShowCreateTagModal: (show: boolean) => void;
  setNewTag: React.Dispatch<React.SetStateAction<NewTag>>;
  setEditingTag: (tag: Tag | null) => void;
  setShowEditTagModal: (show: boolean) => void;
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  setSortOrder: React.Dispatch<React.SetStateAction<Record<FilterType, 'asc' | 'desc'>>>;
  setSelectedTags: React.Dispatch<React.SetStateAction<Tag[]>>;
  setFilter: React.Dispatch<React.SetStateAction<FilterType>>;
  setAiPlan: React.Dispatch<React.SetStateAction<Task[]>>;
  setDisplayAISubTasks: React.Dispatch<React.SetStateAction<boolean>>;

  // Current state values
  newTask: BaseTaskForm;
  newAITask: Task;
  showEditTaskModal: EditTaskModalState;
  newTag: {name: string; color: string };
  filter: FilterType;
  sortOrder: Record<FilterType, 'asc' | 'desc'>;
  selectedTags: Tag[];

  // API functions
  addTask: (task: BaseTaskForm) => Promise<boolean>;
  updateTask: (id: number, task: EditTaskForm) => Promise<boolean>;
  addTag: (tag: {name: string; color: string }) => Promise<Tag | false>;
  updateTag: (tag: Tag) => Promise<number | null>;
  delTag: (tag: Tag) => Promise<number | null>;
  sendTaskToAI: (task: BaseTaskForm) => Promise<{
    new_task: Task;
    subtasks: Task[];
  }>;
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
  addTask,
  updateTask,
  addTag,
  updateTag,
  delTag,
  sendTaskToAI,
  setAiPlan,
  setDisplayAISubTasks
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
    // ✅ Always require title
    if (!newTask.title.trim()) {
      alert("Title is required.");
      return;
    }
    // 🚀 Now safe to create
    const success = await addTask(newTask);
    if (success) {
        setShowNewTaskModal(false);

        setNewTask({
          id: 0,
          title: '',
          description: '',
          urgent: false,
          due_date: '',
          due_time: '',
          tags: [],
          category: null,
          estimated_time: null,
          complexity: null,
          created_date: '',
        });
      
    }
  };

  const handleNewAITask = async (aiTask: BaseTaskForm) => {
    if (!aiTask.title.trim()) {
      alert("Title is required.");
      return;
    }

    const isAIMode = !!aiTask.category;

    if (isAIMode) {
      if (!aiTask.estimated_time || aiTask.estimated_time < 0.5) {
        alert("Estimated hours (minimum 0.5) are required for AI plan.");
        return;
      }

      if (!aiTask.complexity || aiTask.complexity < 1) {
        alert("Complexity level is required for AI plan.");
        return;
      }

      if (!aiTask.due_date || !aiTask.due_time) {
        alert("Due date and time are required for AI plan.");
        return;
      }

      const success_task_send_to_ai = await sendTaskToAI(aiTask);
      console.log(success_task_send_to_ai)
      const now = new Date().toISOString();

      // ✅ Flatten into proper Task[]
      const all_ai_tasks: Task[] = [
        success_task_send_to_ai.new_task,
        ...success_task_send_to_ai.subtasks.map(task => ({
          ...task,
          created_date: now,
        })),
      ];
      const sortedTasks = [...all_ai_tasks].sort((a, b) => {
        // If one task has no due_date, push it to the bottom
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;

        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      });
      console.log(sortedTasks)
      setAiPlan(sortedTasks);
      setDisplayAISubTasks(true);

      console.log("success sending task to ai");

      setShowNewTaskModal(false);

      setNewTask({
        id: 0,
        title: '',
        description: '',
        urgent: false,
        due_date: '',
        due_time: '',
        tags: [],
        category: null,
        estimated_time: null,
        complexity: null,
        created_date: '',
      });
    }
  };

  const handleEditTask = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!showEditTaskModal.task) return;
    const taskData: EditTaskForm = {
      id: showEditTaskModal.task.user_id | 0,
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
      tags: showEditTaskModal.task.tags.map(tag => ({ id: tag.id, name: tag.name, color: tag.color })),
      category: showEditTaskModal.task.category ?? null,
      completed_date: showEditTaskModal.task.completed_date,
      complexity: showEditTaskModal.task.complexity ?? 0,
      estimated_time: showEditTaskModal.task.estimated_time ?? null,
      created_date: showEditTaskModal.task.created_date
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
      setNewTask((prev: BaseTaskForm) => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));

      setNewTag({name: '', color: '#3B82F6' });
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
    setNewTask((prev: BaseTaskForm) => {
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
    handleNewAITask,

  };
};