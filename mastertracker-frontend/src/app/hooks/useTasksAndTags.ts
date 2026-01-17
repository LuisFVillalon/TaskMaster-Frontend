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
    updateCompleteStatus(id)
  };

  const addTask = async (newTask: NewTaskForm) => {
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

  const delTag = async (delTag: Tag) => {
    
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