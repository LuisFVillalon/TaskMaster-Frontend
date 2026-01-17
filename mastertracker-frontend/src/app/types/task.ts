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