import { CourseAssignmentItem } from "../types/canvas";

export const sortByUpcomingDueDate = (
  items: CourseAssignmentItem[]
): CourseAssignmentItem[] => {
  const now = new Date().getTime();

  return [...items].sort((a, b) => {
    const aTime = a.due_at ? new Date(a.due_at).getTime() : Infinity;
    const bTime = b.due_at ? new Date(b.due_at).getTime() : Infinity;

    // Compare how far each date is from "now"
    return (aTime - now) - (bTime - now);
  });
};