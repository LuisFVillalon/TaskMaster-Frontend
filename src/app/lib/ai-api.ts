import { Task } from "../types/task";
const API_AI_URL = process.env.NEXT_PUBLIC_TASKMASTER_AI_URL!;

export async function sendNewTaskToAIAPI(task: Task) {
  const res = await fetch(`${API_AI_URL}/plan-tasks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(task),
  });

  if (!res.ok) {
    throw new Error("Failed to send new task to AI");
  }

  return res.json();
}


