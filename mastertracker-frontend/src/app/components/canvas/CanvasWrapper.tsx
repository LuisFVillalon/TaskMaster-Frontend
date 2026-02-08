'use client';

import React, { useState } from 'react';
import { UserCourse, CourseModule, CourseAssignment, CourseQuiz, CourseModuleItem, CourseAssignmentItem, CourseQuizItem } from '@/app/types/canvas'; 
import CourseSelection from './CourseSelection';
import Link from 'next/link';

interface CanvasWrapperProps {
    currentCourseId: number;
    canvasCourses: UserCourse[];
    canvasModules: CourseModule[];
    canvasAssignments: CourseAssignment[];
    canvasQuizzes: CourseQuiz[];
    canvasIsLoading: boolean;
    setCurrentCourseId: React.Dispatch<React.SetStateAction<number>>;    
    setCanvasCourses:React.Dispatch<React.SetStateAction<UserCourse[]>>;
    setCanvasModules:React.Dispatch<React.SetStateAction<CourseModule[]>>;
    setCanvasAssignments:React.Dispatch<React.SetStateAction<CourseAssignment[]>>;
    setCanvasQuizzes:React.Dispatch<React.SetStateAction<CourseQuiz[]>>;
    getCourseModules: (id: number) => Promise<CourseModule[]>;
    getCourseAssignments: (id: number) => Promise<CourseAssignment[]>;
    getCourseQuizzes: (id: number) => Promise<CourseQuiz[]>;
    getCourseModuleItems: (course_id: number, module_id: number) => Promise<CourseModuleItem[]>;
    getCourseAssignmentItems: (course_id: number, assignment_id: number) => Promise<CourseAssignmentItem[]>;
    getCourseQuizItems: (course_id: number, assignment_id: number) => Promise<CourseQuizItem[]>;
}


const CanvasWrapper: React.FC<CanvasWrapperProps>  = ({
    currentCourseId,
    canvasCourses,
    canvasModules,
    canvasAssignments,
    canvasQuizzes,
    // canvasIsLoading,
    setCurrentCourseId,
    // setCanvasCourses,
    setCanvasModules,
    setCanvasAssignments,
    setCanvasQuizzes,
    getCourseModules,  
    getCourseAssignments,
    getCourseQuizzes, 
    getCourseModuleItems,
    getCourseAssignmentItems,
    getCourseQuizItems
}) => {
    const [currentCourseDisplay, setCurrentCourseDisplay] = useState<CourseQuiz[] | CourseModule[] | CourseAssignment[]>([]);
    const [activeView, setActiveView] = useState<'modules' | 'assignments' | 'quizzes' | ''>('');
    const [currentCourseItemsDisplay, setCurrentCourseItemsDisplay] = useState<CourseModuleItem[] | CourseAssignmentItem[] | CourseQuizItem[]>([]);
    const [expandedItemId, setExpandedItemId] = useState<number | null>(null);
    const [itemsIsLoading, setItemsIsLoading] = useState(false);
    const [moduleItemsIsLoading, setModuleItemsIsLoading] = useState(false);    

    const handleViewChange = (view: 'modules' | 'assignments' | 'quizzes') => {
        setActiveView(view);
        if (view === 'modules') {
            setCurrentCourseDisplay(canvasModules);
        } else if (view === 'assignments') {
            setCurrentCourseDisplay(canvasAssignments);
        } else if (view === 'quizzes') {
            setCurrentCourseDisplay(canvasQuizzes);
        }
    };
    
    const displayItems = async (obj: CourseModule | CourseAssignment | CourseQuiz) => {
        if (!currentCourseId || !obj.id) return;
        // Toggle: if clicking the same item, close it
        if (expandedItemId === obj.id) {
            setExpandedItemId(null);
            setCurrentCourseItemsDisplay([]);           
            return;
        }
        setExpandedItemId(obj.id);  
        setModuleItemsIsLoading(true);
        try {
            let items: CourseModuleItem[] | CourseAssignmentItem[] | CourseQuizItem[] = [];
            if (activeView === 'modules') {
                    items = await getCourseModuleItems(currentCourseId, obj.id);
            } else if (activeView === 'assignments') {
                    items = await getCourseAssignmentItems(currentCourseId, obj.id);
            } else if (activeView == 'quizzes') {
                    items = await getCourseQuizItems(currentCourseId, obj.id);
            }
            setCurrentCourseItemsDisplay(items);
        } catch (error) {
            console.error('Failed to load items: ', error);
            setCurrentCourseItemsDisplay([]);
        } finally {
            setModuleItemsIsLoading(false);
        }
        
    };


    return (
        <div className='text-black flex flex-col gap-2'>
            <CourseSelection
                canvasCourses={canvasCourses}
                setActiveView={setActiveView}
                setCurrentCourseId={setCurrentCourseId}
                setCurrentCourseDisplay={setCurrentCourseDisplay}
                setCanvasModules={setCanvasModules}
                setCanvasAssignments={setCanvasAssignments}
                setCanvasQuizzes={setCanvasQuizzes}
                getCourseModules={getCourseModules}
                getCourseAssignments={getCourseAssignments}
                getCourseQuizzes={getCourseQuizzes}         
                setItemsIsLoading={setItemsIsLoading}
            />
            <div>
                <div className="grid grid-cols-3 gap-3">
                    <button 
                        onClick={() => handleViewChange('modules')}
                        disabled={itemsIsLoading}
                        className={`flex justify-center items-center gap-1
                            px-6 py-3 border border-gray-200 rounded-lg 
                            transition-all duration-200 shadow-sm 
                            hover:shadow-md font-medium ${
                            activeView === 'modules' 
                                ? 'bg-blue-500 text-white border-blue-500' 
                                : 'bg-white text-gray-900 hover:bg-gray-50 hover:border-gray-300'
                        } ${itemsIsLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <p>Modules</p>
                        {itemsIsLoading ? 
                            <svg
                            className="w-4 h-4 animate-spin text-current"
                            viewBox="0 0 24 24"
                            fill="none"
                            >
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            />
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                            />
                            </svg> :
                            <></>                        
                        }
                    </button>
                    <button 
                        onClick={() => handleViewChange('assignments')}
                        disabled={itemsIsLoading}
                        className={`flex justify-center items-center gap-1
                            px-6 py-3 border border-gray-200 rounded-lg 
                            transition-all duration-200 shadow-sm 
                            hover:shadow-md font-medium ${
                            activeView === 'assignments' 
                                ? 'bg-blue-500 text-white border-blue-500' 
                                : 'bg-white text-gray-900 hover:bg-gray-50 hover:border-gray-300'
                        } ${itemsIsLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <p>Assignments</p>
                        {itemsIsLoading ? 
                            <svg
                            className="w-4 h-4 animate-spin text-current"
                            viewBox="0 0 24 24"
                            fill="none"
                            >
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            />
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                            />
                            </svg> :
                            <></>                        
                        }
                    </button>
                    <button 
                        onClick={() => handleViewChange('quizzes')}
                        disabled={itemsIsLoading}
                        className={`flex justify-center items-center gap-1
                            px-6 py-3 border border-gray-200 rounded-lg 
                            transition-all duration-200 shadow-sm 
                            hover:shadow-md font-medium ${
                            activeView === 'quizzes' 
                                ? 'bg-blue-500 text-white border-blue-500' 
                                : 'bg-white text-gray-900 hover:bg-gray-50 hover:border-gray-300'
                        } ${itemsIsLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <p>Quizzes</p>
                        {itemsIsLoading ? 
                            <svg
                            className="w-4 h-4 animate-spin text-current"
                            viewBox="0 0 24 24"
                            fill="none"
                            >
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            />
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                            />
                            </svg> :
                            <></>                        
                        }
                    </button>
                </div>
                <div className="flex flex-col overflow-y-auto pl-2 scrollbar-left">
                    {
                        currentCourseDisplay.map((obj, index) => (
                            <div 
                                key={index}
                                className='flex flex-col gap-2 p-4 mt-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-200'
                            >
                                {('name' in obj && activeView === 'modules') && (
                                    <>
                                        <span
                                            onClick={() => displayItems(obj)}
                                            className="font-semibold text-gray-900 text-lg cursor-pointer  transition-colors duration-200 inline-flex items-center gap-2 select-none"
                                        >
                                            {obj.name}
                                            <svg
                                                className={`w-4 h-4 transition-transform duration-300 ease-in-out ${
                                                    expandedItemId === obj.id
                                                        ? 'rotate-180'
                                                        : 'rotate-0'
                                                }`}
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </span>
                                        <div
                                            className={`overflow-hidden transition-all duration-300 ease-in-out ${
                                                expandedItemId === obj.id
                                                    ? 'max-h-[1000px] opacity-100 mt-2'
                                                    : 'max-h-0 opacity-0'
                                            }`}
                                        >
                                            <div className="space-y-2 pl-4 border-l-2 border-blue-200">
                                                {moduleItemsIsLoading ? (
                                                    <div className="flex items-center gap-2 text-gray-600">
                                                        <svg
                                                            className="w-4 h-4 animate-spin"
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                        >
                                                            <circle
                                                                className="opacity-25"
                                                                cx="12"
                                                                cy="12"
                                                                r="10"
                                                                stroke="currentColor"
                                                                strokeWidth="4"
                                                            />
                                                            <path
                                                                className="opacity-75"
                                                                fill="currentColor"
                                                                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                                                            />
                                                        </svg>
                                                        <span>Loading...</span>
                                                    </div>
                                                ) : (
                                                    currentCourseItemsDisplay.map((item, itemIndex) => (
                                                        <div
                                                            key={item.id ?? itemIndex}
                                                            className="text-base break-words transform transition-all duration-200 hover:translate-x-1"
                                                            style={{
                                                                animation: expandedItemId === obj.id
                                                                    ? `slideIn 0.3s ease-out ${itemIndex * 0.05}s both`
                                                                    : 'none'
                                                            }}
                                                        >
                                                            {'title' in item && (
                                                                item.html_url ? (
                                                                    <Link
                                                                        href={item.html_url}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="
                                                                            text-gray-700
                                                                            hover:text-blue-600
                                                                            hover:underline
                                                                            cursor-pointer
                                                                            transition-all
                                                                            duration-200
                                                                            inline-block
                                                                        "
                                                                    >
                                                                        {item.title}
                                                                    </Link>
                                                                ) : (
                                                                    <div className="text-gray-700">
                                                                        {item.title}
                                                                    </div>
                                                                )
                                                            )}
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )}
                                {(activeView === 'assignments') && (
                                    <>
                                        {('name' in obj && 'html_url' in obj) && (
                                            <>
                                                <Link
                                                        href={obj.html_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"                                                    
                                                        className="
                                                            text-gray-700
                                                            hover:text-blue-600
                                                            hover:underline
                                                            cursor-pointer
                                                            transition-all
                                                            duration-200
                                                            inline-block
                                                            font-bold
                                                            text-lg
                                                        "
                                                    >
                                                    {obj.name}
                                                </Link>                                        
                                            </>
                                        )}
                                        {('due_at' in obj && obj.due_at) && (
                                            <div className="text-gray-700">
                                                Due: {new Date(obj.due_at).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </div>
                                        )}
                                        <div className='flex gap-2'>
                                            <p>Status: </p>
                                            {('has_submitted_submissions' in obj && obj.has_submitted_submissions) ? 
                                                    <div className="font-semibold text-green-500">Submitted</div> : <div className='font-semibold text-red-500'>Not Submitted</div>
                                            } 
                                        </div>
                                    
                                    </>
                                )}       
                                {(activeView === 'quizzes') && (
                                    <>
                                        {('title' in obj && 'html_url' in obj) && (
                                            <>
                                                <Link
                                                        href={obj.html_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"                                                    
                                                        className="
                                                            text-gray-700
                                                            hover:text-blue-600
                                                            hover:underline
                                                            cursor-pointer
                                                            transition-all
                                                            duration-200
                                                            inline-block
                                                            font-bold
                                                            text-lg
                                                        "
                                                    >
                                                    {obj.title}
                                                </Link>                                        
                                            </>
                                        )}
                                        <div className='flex gap-2'>
                                            <p>Due: </p>
                                            {('due_at' in obj && obj.due_at) && (
                                                <div className="text-gray-700">
                                                    {new Date(obj.due_at).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </div>
                                            )}                                        
                                        </div>
                                    </>
                                )}                                

                            </div>
                        ))
                    }
                </div>
            </div>
            
            <style jsx>{`
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateX(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }

                .scrollbar-left::-webkit-scrollbar-thumb:hover {
                background: rgba(100, 116, 139, 0.6);
                }

                .scrollbar-left {
                scrollbar-width: thin;
                scrollbar-color: rgba(148, 163, 184, 0.4) transparent;
                }

                .animate-fadeIn {
                animation: fadeIn 0.2s ease-out;
                }                    
            `}</style>
        </div>
    );
};

export default CanvasWrapper;