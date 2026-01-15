const API_BASE_URL = process.env.NEXT_PUBLIC_TASKMASTER_DB_URL!;

export async function fetchTasks() {
  const url = `${API_BASE_URL}/tasks`;

  const res = await fetch(url);
  return res.json();
}

export async function fetchTags() {
  const url = `${API_BASE_URL}/tags`;

  const res = await fetch(url);
  return res.json();
}

export async function createTask(task: {
  title: string;
  description?: string;
  completed?: boolean;
  urgent?: boolean;
  due_date?: string;
  due_time?: string;
  tags: { name: string; color?: string }[];
}) {
  const res = await fetch(`${API_BASE_URL}/tasks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(task),
  });

  if (!res.ok) {
    throw new Error("Failed to create task");
  }

  return res.json();
}

export async function createTag(task: {
  name: string;
  color?: string;
}) {
  const res = await fetch(`${API_BASE_URL}/tags`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(task),
  });

  if (!res.ok) {
    throw new Error("Failed to create tag");
  }

  return res.json();
}

