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