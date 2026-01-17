/*
Purpose: This file defines TypeScript interfaces and types for the task management application, 
ensuring type safety across components and API interactions.

Variables Summary:
- EditTaskModalState: Interface for edit modal state with status and task.
- Tag: Interface for tag objects with id, name, color.
- Task: Interface for task objects with all properties.
- FilterType: Union type for filter options.
- NewTaskForm, EditTaskForm: Interfaces for task creation and editing forms.
- NewTagForm: Interface for tag creation form.
- TaskStats: Interface for task statistics with tasks and tags arrays.
- StatsData: Interface for overall statistics data.

These types define the structure of all data used in the application.
*/

// Types matching the Python Task model
export interface EditTaskModalState {
  status: boolean;
  task: Task | null;
};

export interface Tag {
  id: number;
  name: string;
  color: string;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  urgent: boolean;
  due_date: string | Date | null;
  due_time: string | Date | null;
  tags: Tag[];
}

export type FilterType = 'all' | 'active' | 'completed' | 'urgent';

export interface NewTaskForm {
  title: string;
  description: string;
  urgent: boolean;
  due_date: string;
  due_time: string;
  tags: Tag[];
}

export interface EditTaskForm {
  title: string;
  description: string;
  urgent: boolean;
  due_date: string;
  due_time: string;
  completed: boolean;
  tags: Tag[];
}

export interface NewTagForm {
  name: string;
  color: string;
}

export interface TaskStats {
  tasks: Task[];
  tags: Array<{
    name: string;
    color: string;
    count: number;
  }>;
}

export interface StatsData {
  total: TaskStats;
  active: TaskStats;
  completed: TaskStats;
  urgent: TaskStats;
}