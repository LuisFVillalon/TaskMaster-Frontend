/*
Purpose: 

Variables Summary:

*/

import { useState, useEffect } from 'react';
import { fetchUserCourses, 
    fetchUserModules, 
    fetchUserAssignments,
    fetchUserQuizzes,
    fetchUserModuleItems,
    fetchUserAssignmentItems,
    fetchUserQuizItems,
} from "@/app/lib/canvas_api";
import { UserCourse, CourseModule, CourseAssignment, CourseQuiz, CourseModuleItem, CourseAssignmentItem, CourseQuizItem } from '@/app/types/canvas';
import { sortByUpcomingDueDate } from '../utils/canvasUtils';

export const useCanvasData = () => {
  const [currentCourseId, setCurrentCourseId] = useState(0);
  const [canvasCourses, setCanvasCourses] = useState<UserCourse[]>([]);
  const [canvasModules, setCanvasModules] = useState<CourseModule[]>([]);
  const [canvasAssignments, setCanvasAssignments] = useState<CourseAssignment[]>([]);  
  const [canvasQuizzes, setCanvasQuizzes] = useState<CourseQuiz[]>([]);  
  const [canvasIsLoading, setCanvasIsLoading] = useState(true);

  useEffect(() => {
    const loadCanvasData = async () => {
      try {
        setCanvasIsLoading(true);
        const data = await fetchUserCourses();
        setCanvasCourses(data);
      } catch (error) {
        console.error('Failed to fetch tasks:', error);
        setCanvasCourses([]);
      } finally {
        setCanvasIsLoading(false);
      }
    };

    loadCanvasData();
  }, []);

  const getCourseModules = async (id: number): Promise<CourseModule[]> => {
    try {
        const data = await fetchUserModules(id);
        return data;
    } catch (err) {
        console.error('Failed to get course modules:', err);
        alert("Failed to get course modules");
        return [];
    }
  };

  const getCourseAssignments = async (id: number) => {
    try {
        const data = await fetchUserAssignments(id);
        return sortByUpcomingDueDate(data);
    } catch (err) {
        console.error('Failed to get course Assignments:', err);
        alert("Failed to get course Assignments");
        return [];
    }
  };

  const getCourseQuizzes = async (id: number) => {
    try {
        const data = await fetchUserQuizzes(id);
        return sortByUpcomingDueDate(data);
    } catch (err) {
        console.error('Failed to get course Quizzes:', err);
        alert("Failed to get course Quizzes");
        return []
    }
  };

  const getCourseModuleItems = async (course_id: number, module_id: number): Promise<CourseModuleItem[]> => {
    try {
        const data = await fetchUserModuleItems(course_id, module_id);
        return data;
    } catch (err) {
        console.error('Failed to get course module item:', err);
        alert("Failed to get course module item");
        return [];
    }
  };  

  const getCourseAssignmentItems = async (course_id: number, assignment_id: number): Promise<CourseAssignmentItem[]> => {
    try {
        const data = await fetchUserAssignmentItems(course_id, assignment_id);
        return data;
    } catch (err) {
        console.error('Failed to get course module item:', err);
        alert("Failed to get course module item");
        return [];
    }
  };    

  const getCourseQuizItems = async (course_id: number, quiz_id: number): Promise<CourseQuizItem[]> => {
    try {
        const data = await fetchUserQuizItems(course_id, quiz_id);
        return data;
    } catch (err) {
        console.error('Failed to get course module item:', err);
        alert("Failed to get course module item");
        return [];
    }
  };   

  return {
    currentCourseId,
    canvasCourses,
    canvasModules,
    canvasAssignments,
    canvasQuizzes,
    canvasIsLoading,
    setCurrentCourseId,
    setCanvasCourses,
    setCanvasModules,
    setCanvasAssignments,
    setCanvasQuizzes,    
    getCourseModules,
    getCourseAssignments,
    getCourseQuizzes,
    getCourseModuleItems,
    getCourseAssignmentItems,
    getCourseQuizItems
  };
};

