/*
Purpose: This custom hook filters and sorts tasks based on status, search term, and selected tags,
and computes statistics for different task categories.
*/

import { useMemo } from 'react';
import { FilterType, StatsData, Tag, Task } from '@/app/types/task';
import { countTasksByTag, getTaskDateTime } from '@/app/utils/taskUtils';

export const useTaskFiltering = (
  tasks: Task[],
  filter: FilterType,
  sortOrder: Record<FilterType, 'asc' | 'desc'>,
  searchTerm: string,
  selectedTags: Tag[]
) => {
  const { filteredTasks, stats } = useMemo(() => {
    // Ensure tasks is always an array
    const safeTasks = Array.isArray(tasks) ? tasks : [];

    const normalizedSearch = (searchTerm ?? '').toLowerCase();

    const filtered = safeTasks
      .filter(task => {
        // Ensure safe defaults
        const title = (task.title ?? '').toLowerCase();
        const description = (task.description ?? '').toLowerCase();
        const taskTags = task.tags ?? [];

        // Status filtering
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

        // Search filtering
        const matchesSearch =
          title.includes(normalizedSearch) ||
          description.includes(normalizedSearch);

        // Tag filtering
        const matchesTags =
          selectedTags.length === 0 ||
          taskTags.some(taskTag =>
            selectedTags.some(selected => selected.id === taskTag.id)
          );

        return matchesStatus && matchesSearch && matchesTags;
      })
      .sort((a, b) => {
        const diff = getTaskDateTime(a) - getTaskDateTime(b);
        return sortOrder[filter] === 'asc' ? diff : -diff;
      });

    const stats: StatsData = {
      total: {
        tasks: safeTasks,
        tags: countTasksByTag(safeTasks)
      },
      active: {
        tasks: safeTasks.filter(t => !t.completed),
        tags: countTasksByTag(safeTasks.filter(t => !t.completed))
      },
      completed: {
        tasks: safeTasks.filter(t => t.completed),
        tags: countTasksByTag(safeTasks.filter(t => t.completed))
      },
      urgent: {
        tasks: safeTasks.filter(t => t.urgent && !t.completed),
        tags: countTasksByTag(safeTasks.filter(t => t.urgent && !t.completed))
      }
    };

    return { filteredTasks: filtered, stats };
  }, [tasks, filter, sortOrder, searchTerm, selectedTags]);

  return { filteredTasks, stats };
};