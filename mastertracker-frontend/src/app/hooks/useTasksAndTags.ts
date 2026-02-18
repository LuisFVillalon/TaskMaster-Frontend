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
    updateCompleteTask, 
    updateWholeTask 
} from "@/app/lib/api";
import { Task, Tag, NewTaskForm, NewTagForm, EditTaskForm } from '@/app/types/task';

export const useTasks = (demo: boolean = false) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (demo) {
      // Load sample data for demo
      const sampleTasks: Task[] = [
        {
          id: 3,
          title: "Prepare for midterm exam",
          description: "Study algorithms and data structures for the upcoming midterm",
          completed: false,
          urgent: true,
          due_date: "2026-03-01",
          due_time: "10:00",
          tags: [{ id: 2, name: "Study", color: "#10B981" }]
        },
        {
          id: 4,
          title: "Update resume",
          description: "Add recent projects and skills to the resume",
          completed: false,
          urgent: false,
          due_date: null,
          due_time: null,
          tags: [{ id: 1, name: "Work", color: "#3B82F6" }]
        },
        {
          id: 5,
          title: "Chillax",
          description: "Relax for a while, enjoy yourself",
          completed: true,
          urgent: false,
          due_date: "2026-02-14",
          due_time: "11:59 PM",
          tags: [{ id: 3, name: "Personal", color: "#F59E0B"  }]
        },
      ];
      setTasks(sampleTasks);
      setIsLoading(false);
      return;
    }
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
  }, [demo]);

  const toggleComplete = (id: number): void => {
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
    updateCompleteStatus(id)
  };

  const addTask = async (newTask: NewTaskForm) => {
    if (demo) {
      const createdTask: Task = {
        id: Math.max(0, ...tasks.map(t => t.id)) + 1,
        title: newTask.title,
        description: newTask.description,
        completed: false,
        urgent: newTask.urgent,
        due_date: newTask.due_date,
        due_time: newTask.due_time,
        tags: newTask.tags || []
      };
      setTasks([createdTask, ...tasks]);
      return true;
    }
    try {
        const createdTask = await createTask(newTask);
        setTasks([createdTask, ...tasks]);
        return true;
    } catch (err) {
        console.error(err);
        alert("Failed to create task");
        return false;
    }
  };

  const deleteTask = async (delTask: Task) => {
    if (demo) {
      setTasks(prev => prev.filter(task => task.id !== delTask.id));
      return true;
    }
    try {
        await onDelete(delTask.id);
        setTasks(prev =>
            prev.filter(task => task.id !== delTask.id)
        );
        return true;
    } catch (err) {
        console.error('Delete failed:', err);
        alert("Failed to delete task");
        return false;
    }
  };

  const updateCompleteStatus = async (id_task: number) => {
    if (demo) return true;
    try {
        await updateCompleteTask(id_task);
        return true;
    } catch (err) {
        console.error('Delete failed:', err);
        alert("Failed to update complete status on task");
        return false;
    }
  };

  const updateTask = async (id: number, updatedTask: EditTaskForm) => {
    if (demo) {
      setTasks(prev => prev.map(task => task.id === id ? { ...task, ...updatedTask } : task));
      return true;
    }
    try {
        const updated = await updateWholeTask(id, updatedTask) as Task;
        console.log(updatedTask)
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
  };
};

export const useTags = (demo: boolean = false) => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [tagsLoading, setTagsLoading] = useState(true);

  useEffect(() => {
    if (demo) {
      // Load sample tags for demo
      const sampleTags: Tag[] = [
        { id: 1, name: "Work", color: "#3B82F6" },
        { id: 2, name: "Study", color: "#10B981" },
        { id: 3, name: "Personal", color: "#F59E0B" },
      ];
      setTags(sampleTags);
      setTagsLoading(false);
      return;
    }
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
  }, [demo]);

  const addTag = async (newTag: NewTagForm) => {
    if (!newTag.name.trim()) return false;

    if (demo) {
      const tag: Tag = {
        id: Math.max(0, ...tags.map(t => t.id)) + 1,
        name: newTag.name,
        color: newTag.color
      };
      setTags(prev => [...prev, tag]);
      return tag;
    }

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
    if (demo) {
      setTags(prev => prev.filter(tag => tag.id !== delTag.id));
      return delTag.id;
    }
    try {
        console.log(delTag)
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
    if (demo) {
      setTags(prev => prev.map(tag => tag.id === tagToUpdate.id ? tagToUpdate : tag));
      return tagToUpdate.id;
    }
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