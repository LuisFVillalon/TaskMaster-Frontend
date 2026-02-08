/*
Purpose: 
Variables Summary:

Functions include:
*/
import { CourseAssignment, CourseModule, CourseQuiz, CourseModuleItem, CourseAssignmentItem, CourseQuizItem } from "../types/canvas";

const API_BASE_URL = process.env.NEXT_PUBLIC_TASKMASTER_DB_URL!;

export async function fetchUserCourses() {
  const res = await fetch(`${API_BASE_URL}/user-courses`);
  if (!res.ok) {
    throw new Error(`Failed to fetch user courses`);
  }

  const data = await res.json();

  if (!Array.isArray(data)) {
    throw new Error('Invalid courses response');
  }
  const actualClasses = data.filter(
    course => !course.name.toLowerCase().includes("homeroom")
  );
  return actualClasses;
}

export async function fetchUserModules(id: number) {
  try {
    const res = await fetch(`${API_BASE_URL}/canvas/courses/${id}/modules`);
    if (!res.ok) {
      throw new Error('Failed to fetch modules');
    }

    const data: CourseModule[] = await res.json();
    return data;
  } catch (err) {
    console.error(err);
    return []; // ✅ ALWAYS return an array
  }  
}

export async function fetchUserAssignments(id: number) {
  try {
    const res = await fetch(`${API_BASE_URL}/canvas/courses/${id}/assignments`);
    if (!res.ok) {
      throw new Error('Failed to fetch assignments');
    }

    const data: CourseAssignment[] = await res.json();
    return data;
  } catch (err) {
    console.error(err);
    return []; // ✅ ALWAYS return an array
  }  
}

export async function fetchUserQuizzes(id: number) {
  try {
    const res = await fetch(`${API_BASE_URL}/canvas/courses/${id}/quizzes`);
    if (!res.ok) {
      throw new Error('Failed to fetch quizzes');
    }

    const data: CourseQuiz[] = await res.json();
    return data;
  } catch (err) {
    console.error(err);
    return []; // ✅ ALWAYS return an array
  }  
}

export async function fetchUserModuleItems(course_id: number, module_id: number) {
  try {
    const res = await fetch(`${API_BASE_URL}/canvas/courses/${course_id}/modules/${module_id}/items`);
    if (!res.ok) {
      throw new Error('Failed to fetch module items');
    }

    const data: CourseModuleItem[] = await res.json();
    return data;
  } catch (err) {
    console.error(err);
    return []; // ✅ ALWAYS return an array
  }  
}

export async function fetchUserAssignmentItems(course_id: number, assignment_id: number) {
  try {
    const res = await fetch(`${API_BASE_URL}/canvas/courses/${course_id}/assignments/${assignment_id}`);
    if (!res.ok) {
      throw new Error('Failed to fetch assignments');
    }

    const data: CourseAssignmentItem[] = await res.json();
    console.log(data);
    return data;
  } catch (err) {
    console.error(err);
    return []; // ✅ ALWAYS return an array
  }  
}

export async function fetchUserQuizItems(course_id: number, quiz_id: number) {
  try {
    const res = await fetch(`${API_BASE_URL}/canvas/courses/${course_id}/quizzes/${quiz_id}`);
    if (!res.ok) {
      throw new Error('Failed to fetch quizzes');
    }

    const data: CourseQuizItem[] = await res.json();
    return data;
  } catch (err) {
    console.error(err);
    return []; // ✅ ALWAYS return an array
  }  
}