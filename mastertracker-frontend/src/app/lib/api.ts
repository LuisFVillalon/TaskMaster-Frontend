const API_BASE_URL = process.env.NEXT_PUBLIC_TASKMASTER_DB_URL!;

export async function fetchTasks() {
  const url = `${API_BASE_URL}/get-tasks`;

  const res = await fetch(url);
  return res.json();
}

export async function fetchTags() {
  const url = `${API_BASE_URL}/get-tags`;

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
  const res = await fetch(`${API_BASE_URL}/create-task`, {
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
  const res = await fetch(`${API_BASE_URL}/create-tags`, {
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

export async function onDelete(id: number) {
  const url = `${API_BASE_URL}/del-task/${id}`
  fetch(url, {method: "DELETE"})
  .then(res => res.json())
  .then(data => console.log(data));
}

export async function updateCompleteTask(id: number) {
  const url = `${API_BASE_URL}/update-task-status/${id}`
  fetch(url, {method: "PATCH"})
  .then(res => res.json())
  .then(data => console.log(data));
}

export async function updateWholeTask(id: number, task: {
  title: string;
  description?: string;
  completed?: boolean;
  urgent?: boolean;
  due_date?: string;
  due_time?: string;
  tags: { name: string; color?: string }[];
}) {
  const res = await fetch(`${API_BASE_URL}/update-task/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(task),
  });

  if (!res.ok) {
    throw new Error("Failed to update task");
  }

  return res.json();
}

export async function updateTag(id: number, tag: {
  name: string;
  color: string;
}) {
  const res = await fetch(`${API_BASE_URL}/update-tag/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(tag),
  });

  if (!res.ok) {
    throw new Error("Failed to update tag");
  }

  return res.json();
}

export async function onDeleteTag(id: number) {
  const url = `${API_BASE_URL}/del-tag/${id}`
  fetch(url, {method: "DELETE"})
  .then(res => res.json())
  .then(data => console.log(data));
}

export async function onUpdateTag(id: number, tag: {
  name: string;
  color?: string;
}) {
  const res = await fetch(`${API_BASE_URL}/update-tag/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(tag),
  });

  if (!res.ok) {
    throw new Error("Failed to update task");
  }

  return res.json();
}