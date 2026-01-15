import { useState, useEffect } from 'react';
import { fetchTasks, fetchTags, createTask, createTag } from "@/app/lib/api";
import { Task, Tag, NewTaskForm, NewTagForm } from '@/app/types/task';

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

  const toggleComplete = (id: number): void => {
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const addTask = async (newTask: NewTaskForm) => {
    try {
      await createTask(newTask);

      // Optimistically add to UI
      const task: Task = {
        id: Math.max(0, ...tasks.map(t => t.id)) + 1,
        title: newTask.title,
        description: newTask.description,
        completed: false,
        urgent: newTask.urgent,
        due_date: newTask.due_date || null,
        due_time: newTask.due_time || null,
        tags: newTask.tags
      };

      setTasks([task, ...tasks]);
      return true;
    } catch (err) {
      console.error(err);
      alert("Failed to create task");
      return false;
    }
  };

  return {
    tasks,
    isLoading,
    toggleComplete,
    addTask,
    setTasks
  };
};

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

  const addTag = async (newTag: NewTagForm) => {
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

  return {
    tags,
    tagsLoading,
    addTag,
    setTags
  };
};