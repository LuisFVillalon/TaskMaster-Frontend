'use client';

import React, { useState } from 'react';
import { UserCourse, CourseAssignment, CourseQuiz, CourseModule} from '@/app/types/canvas'; 

interface CourseSelectionProps {
    canvasCourses: UserCourse[];
    setActiveView: React.Dispatch<React.SetStateAction<'modules' | 'assignments' | 'quizzes' | ''>>;
    setCanvasModules:React.Dispatch<React.SetStateAction<CourseModule[]>>;
    setCanvasAssignments:React.Dispatch<React.SetStateAction<CourseAssignment[]>>;
    setCanvasQuizzes:React.Dispatch<React.SetStateAction<CourseQuiz[]>>;
    setCurrentCourseDisplay: React.Dispatch<React.SetStateAction<CourseQuiz[] | CourseModule[] | CourseAssignment[]>>;
    getCourseModules: (id: number) => Promise<CourseModule[]>;
    getCourseAssignments: (id: number) =>Promise<CourseAssignment[]>;
    getCourseQuizzes: (id: number) => Promise<CourseQuiz[]>;
    setCurrentCourseId: React.Dispatch<React.SetStateAction<number>>;    
    setItemsIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
}


const CourseSelection: React.FC<CourseSelectionProps>  = ({
    canvasCourses,
    setActiveView,
    setCanvasModules,
    setCanvasAssignments,
    setCanvasQuizzes,
    // setCurrentCourseDisplay,
    getCourseModules,  
    getCourseAssignments,
    getCourseQuizzes,
    setCurrentCourseId,
    setItemsIsLoading

}) => {
    const [activeCourseId, setActiveCourseId] = useState<number | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [direction, setDirection] = useState<'left' | 'right'>('right');
    const itemsPerPage = 3;
    const totalPages = Math.ceil(canvasCourses.length / itemsPerPage);
    
    const currentCourses = canvasCourses.slice(
        currentIndex * itemsPerPage,
        (currentIndex + 1) * itemsPerPage
    );

    const goToNext = () => {
        setDirection('right');
        setCurrentIndex((prev) => (prev + 1) % totalPages);
    };

    const goToPrev = () => {
        setDirection('left');
        setCurrentIndex((prev) => (prev - 1 + totalPages) % totalPages);
    };

    const updateCurrentCourse = async (course: UserCourse) => {
        setActiveCourseId(course.id);

        const courseId = course.id;

        setCurrentCourseId(courseId);
        setActiveView('');
        setItemsIsLoading(true);

        const currCourseModules = await getCourseModules(courseId); 
        const currCourseAssignments = await getCourseAssignments(courseId);
        const currCourseQuizzes = await getCourseQuizzes(courseId);

        setCanvasModules(currCourseModules);
        setCanvasAssignments(currCourseAssignments);
        setCanvasQuizzes(currCourseQuizzes);      
        setItemsIsLoading(false); 
    };

    return (

        <div className='space-y-3 text-black'>
            <div className='font-bold text-2xl text-black'>Canvas:</div>
            {canvasCourses.length > 0 && (
                <div className="space-y-4">
                    {/* Carousel Container */}
                    <div className="flex items-center gap-4">
                        {/* Previous Arrow */}
                        {totalPages > 1 && (
                            <button
                                onClick={goToPrev}
                                className="flex-shrink-0 p-2 rounded-full bg-white border border-gray-300 hover:bg-gray-50 shadow-md transition-all hover:scale-110"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                        )}

                        {/* Courses Grid with Animation */}
                        <div className="flex-1 overflow-hidden">
                            <div 
                                key={currentIndex}
                                className={`grid grid-cols-1 md:grid-cols-3 gap-2 animate-in fade-in ${
                                    direction === 'right' ? 'slide-in-from-right-10' : 'slide-in-from-left-10'
                                } duration-300`}
                            >
                                {currentCourses.map(course => (
                                    <button
                                        key={course.id}
                                        onClick={() => updateCurrentCourse(course)}
                                        className={`cursor-pointer w-full px-4 py-3 text-left rounded-lg
                                            transition-all duration-200 shadow-sm hover:shadow-md
                                            ${
                                                activeCourseId === course.id
                                                    ? "bg-white border-4 border-blue-500"
                                                    : "bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                                            }
                                        `}
                                    >
                                        <span className="break-words font-bold text-gray-900">{course.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Next Arrow */}
                        {totalPages > 1 && (
                            <button
                                onClick={goToNext}
                                className="flex-shrink-0 p-2 rounded-full bg-white border border-gray-300 hover:bg-gray-50 shadow-md transition-all hover:scale-110"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        )}
                    </div>

                    {/* Dots Indicator */}
                    {totalPages > 1 && (
                        <div className="flex justify-center gap-2">
                            {Array.from({ length: totalPages }).map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => {
                                        setDirection(index > currentIndex ? 'right' : 'left');
                                        setCurrentIndex(index);
                                    }}
                                    className={`h-2 rounded-full transition-all duration-300 ${
                                        index === currentIndex 
                                            ? 'w-8 bg-blue-600' 
                                            : 'w-2 bg-gray-300 hover:bg-gray-400'
                                    }`}
                                    aria-label={`Go to page ${index + 1}`}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CourseSelection;