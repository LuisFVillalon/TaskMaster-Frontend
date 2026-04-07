/*
Purpose: This file contains custom hooks for managing tasks and tags data, including fetching from 
API, and performing CRUD operations.

Variables Summary:
- useTasks: Manages task data with tasks array, isLoading boolean, and functions like toggleComplete, addTask, deleteTask, updateTask.
- useTags: Manages tag data with tags array, tagsLoading boolean, and functions like addTag, delTag, updateTag.

These hooks handle all data operations and state management for tasks and tags, interfacing with the backend API.
*/

import { useState, useEffect } from 'react';
import { fetchTasks, 
    fetchTags, 
    createTask, 
    createTag, 
    onDelete, 
    onDeleteTag,
    updateTag as updateTagApi,
    saveTasksToDBAPI, 
    updateWholeTask
} from "@/app/lib/backend-api";
import { 
    sendNewTaskToAIAPI
} from "@/app/lib/ai-api";
import { Task, Tag, BaseTaskForm, EditTaskForm, NewTag } from '@/app/types/task';
import { toLocalISOString } from '@/app/utils/dateUtils';

/**
 * Manages task state and CRUD operations.
 */
export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTasks = async () => {
      try {
        setIsLoading(true);
        const data = await fetchTasks();
        setTasks(data);
      } catch (error) {
        console.error('Failed to fetch tasks:', error);
        setTasks([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadTasks();
  }, []);

  const toggleComplete = async (id: number): Promise<void> => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    const newCompleted = !task.completed;
    const newCompletedDate = newCompleted ? toLocalISOString(new Date()) : null;

    setTasks(prev =>
      prev.map(t =>
        t.id === id
          ? {
              ...t,
              completed: newCompleted,
              completed_date: newCompletedDate
            }
          : t
      )
    );

    try {
      await updateWholeTask(id, {
        title: task.title,
        description: task.description,
        completed: newCompleted,
        urgent: task.urgent,
        due_date: task.due_date ? (task.due_date instanceof Date ? task.due_date.toISOString().slice(0, 10) : task.due_date) : '',
        due_time: task.due_time ? (task.due_time instanceof Date ? task.due_time.toISOString().slice(11, 16) : task.due_time) : '',
        tags: task.tags.map(tag => ({ id: tag.id, name: tag.name, color: tag.color })),
        category: task.category ?? null,
        created_date: task.created_date instanceof Date ? toLocalISOString(task.created_date) : (typeof task.created_date === 'string' ? task.created_date : null),
        completed_date: newCompletedDate
      });
    } catch (err) {
      console.error('Toggle complete failed:', err);
      alert("Failed to update task completion");
      // Revert local state
      setTasks(tasks.map(t =>
        t.id === id ? { ...t, completed: task.completed, completed_date: task.completed_date } : t
      ));
    }
  };

  const addTask = async (newTask: BaseTaskForm) => {
    try {
        const taskWithDates = {
          ...newTask,
          due_date: newTask.due_date instanceof Date
            ? newTask.due_date.toISOString().slice(0, 10)
            : (newTask.due_date ?? undefined),
          due_time: newTask.due_time instanceof Date
            ? newTask.due_time.toISOString().slice(11, 16)
            : (newTask.due_time ?? undefined),
          created_date: toLocalISOString(new Date()),
          completed_date: null,
          completed: false
        };
        const createdTask = await createTask(taskWithDates);
        setTasks([createdTask, ...tasks]);

        return true;
    } catch (err) {
        console.error(err);
        alert("Failed to create task");
        return false;
    }
  }; 

  const addTasks = async (newTasks: Task[]) => {

    try {

        await saveTasksToDBAPI(newTasks);
        return true;
    } catch (err) {
        console.error(err);
        alert("Failed to create tasks");
        return false;
    }
  };  

  const sendTaskToAI = async (newAITask: BaseTaskForm) => {
    try {
const normalizedTask = {
  ...newAITask,
  user_id: null,
  completed: false,
  due_date: newAITask.due_date instanceof Date
    ? newAITask.due_date.toISOString().slice(0, 10)
    : (newAITask.due_date ?? ''),
  due_time: newAITask.due_time instanceof Date
    ? newAITask.due_time.toISOString().slice(11, 16)
    : (newAITask.due_time ?? ''),
  category: newAITask.category ?? undefined,
  created_date: newAITask.created_date instanceof Date
    ? toLocalISOString(newAITask.created_date)
    : (newAITask.created_date ?? ''),
  completed_date: null,
  estimated_time: newAITask.estimated_time ?? 0,
  complexity:
  newAITask.complexity === 0
    ? null
    : newAITask.complexity ?? null,
};
        const aiTasks = await sendNewTaskToAIAPI(normalizedTask);
        return aiTasks;
    } catch (err) {
        console.error(err);
        alert("Failed to send task to AI app");
        return null;
    }
  };   

  const deleteTask = async (delTask: Task) => {
    // Optimistic update: remove immediately so the UI responds instantly.
    setTasks(prev => prev.filter(task => task.id !== delTask.id));

    try {
      await onDelete(delTask.id);
      return true;
    } catch (err) {
      // Rollback: restore the task at its original position.
      console.error('Delete failed:', err);
      setTasks(prev => {
        // Re-insert in sorted order by id to preserve list order.
        const next = [...prev, delTask];
        next.sort((a, b) => b.id - a.id);
        return next;
      });
      alert("Couldn't delete the task — it has been restored.");
      return false;
    }
  };

  const updateTask = async (id: number, updatedTask: EditTaskForm) => {
    try {
        const taskToUpdate = {
          ...updatedTask,
          due_date: updatedTask.due_date instanceof Date
            ? updatedTask.due_date.toISOString().slice(0, 10)
            : updatedTask.due_date ?? null,

          due_time: updatedTask.due_time instanceof Date
            ? updatedTask.due_time.toISOString().slice(11, 19) // HH:MM:SS
            : updatedTask.due_time ?? null,

          created_date: updatedTask.created_date instanceof Date
            ? updatedTask.created_date.toISOString()
            : updatedTask.created_date ?? null,

          completed_date: updatedTask.completed_date instanceof Date
            ? updatedTask.completed_date.toISOString()
            : updatedTask.completed_date ?? null,
          
          tags: updatedTask.tags.map(tag => ({ id: tag.id, name: tag.name, color: tag.color })),

          category: updatedTask.category ?? null
        };
        const updated = await updateWholeTask(id, taskToUpdate) as Task;
        setTasks(prev => prev.map(task => task.id === id ? updated : task));
        return true;
    } catch (err) {
        console.error(err);
        alert("Failed to update task");
        return false;
    }
  };

  return {
    tasks,
    isLoading,
    toggleComplete,
    addTask,
    setTasks,
    deleteTask,
    updateTask,
    sendTaskToAI,
    addTasks
  };
};

/**
 * Manages tag state and CRUD operations.
 */
export const useTags = () => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [tagsLoading, setTagsLoading] = useState(true);

  useEffect(() => {
    const loadTags = async () => {
      try {
        setTagsLoading(true);
        const data = await fetchTags();
        setTags(data);
      } catch (error) {
        console.error('Failed to fetch tags:', error);
        setTags([]);
      } finally {
        setTagsLoading(false);
      }
    };

    loadTags();
  }, []);

  const addTag = async (newTag: NewTag) => {
    if (!newTag.name.trim()) return false;

    try {
      await createTag(newTag);
      const tag: Tag = {
        id: Math.max(0, ...tags.map(t => t.id)) + 1,
        name: newTag.name,
        color: newTag.color
      };

      setTags(prev => [...prev, tag]);
      return tag;
    } catch (err) {
      console.error(err);
      alert("Failed to create tag");
      return false;
    }
  };

  const delTag = async (delTag: Tag) => {
    try {
        await onDeleteTag(delTag.id);
        setTags(prev =>
            prev.filter(task => task.id !== delTag.id)
        );
        return delTag.id;
    } catch (err) {
        console.error('Delete failed:', err);
        alert("Failed to delete tag");
        return null;
    }
  };

  const updateTag = async (tagToUpdate: Tag) => {
    try {
        await updateTagApi(tagToUpdate.id, { name: tagToUpdate.name, color: tagToUpdate.color });
        setTags(prev =>
            prev.map(tag => tag.id === tagToUpdate.id ? tagToUpdate : tag)
        );
        return tagToUpdate.id;
    } catch (err) {
        console.error('Update failed:', err);
        alert("Failed to update tag");
        return null;
    }
  };
  return {
    tags,
    tagsLoading,
    addTag,
    delTag,
    updateTag,
    setTags
  };
};