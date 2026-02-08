type HasDueAt = {
  due_at?: string | null;
};

export const sortByUpcomingDueDate = <T extends HasDueAt>(
  items: T[]
): T[] => {
  const now = Date.now();

  return [...items].sort((a, b) => {
    const aTime = a.due_at ? new Date(a.due_at).getTime() : null;
    const bTime = b.due_at ? new Date(b.due_at).getTime() : null;

    // No due date goes to the end
    if (aTime === null) return 1;
    if (bTime === null) return -1;

    const aIsFuture = aTime >= now;
    const bIsFuture = bTime >= now;

    // Future items come first
    if (aIsFuture && !bIsFuture) return -1;
    if (!aIsFuture && bIsFuture) return 1;

    // Both future: soonest first
    if (aIsFuture && bIsFuture) return aTime - bTime;

    // Both past: most recent first
    return bTime - aTime;
  });
};