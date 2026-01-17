/*
Purpose: This custom hook filters and sorts tasks based on status, search term, and selected tags, and computes statistics for different task categories.

Variables Summary:
- tasks: Array of all task objects to be filtered and analyzed.
- filter: Current filter type (all, active, completed, urgent).
- sortOrder: Object mapping each filter type to its sort direction (asc/desc).
- searchTerm: String used to filter tasks by title or description.
- selectedTags: Array of tags that tasks must match (if any are selected).

Returns an object with filteredTasks (sorted and filtered array) and stats (statistics for total, active, completed, urgent tasks).

These variables are used to dynamically filter and sort the task list and generate stats for the UI.
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
    const filtered = Array.isArray(tasks)
      ? tasks
          .filter(task => {
            const matchesStatus =
              filter === 'all'
                ? true
                : filter === 'active'
                ? !Boolean(task.completed)
                : filter === 'completed'
                ? Boolean(task.completed)
                : filter === 'urgent'
                ? Boolean(task.urgent) && !Boolean(task.completed)
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

    return { filteredTasks: filtered, stats };
  }, [tasks, filter, sortOrder, searchTerm, selectedTags]);

  return { filteredTasks, stats };
};