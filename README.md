# Task Master Frontend
TaskMaster Frontend is a frontend application which connects to a backend
application through API calls to view and interact with tasks and tags in a task management application.

## Overview
This application provides a user-friendly interface for managing tasks and tags. Users can create, edit, delete, and filter tasks, as well as manage tags for better organization. It includes an authentication feature and displays statistics on task completion.

## Features
- **Task Management**: Create, edit, delete, and mark tasks as completed.
- **Tagging System**: Create and manage tags to categorize tasks.
- **Filtering**: Filter tasks by completion status, tags, and search terms.
- **Authentication**: Password-based authentication for secure unique access.
- **Statistics**: View stats on total tasks, completed tasks, and progress.
- **Responsive Design**: Built with Tailwind CSS for a modern, responsive UI.

## Tech Stack
- **Framework**: Next.js 16.1.1
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Linting**: ESLint
- **Build Tool**: Next.js (with npm scripts)

## Project Structure
```
src/
  app/
    components/
      PasswordAuth.tsx
      StatsCard.tsx
      TaskControls.tsx
      TaskItem.tsx
      tag/
        CreateTagModal.tsx
        EditTagListModal.tsx
        EditTagModal.tsx
      task/
        EditTaskModal.tsx
        NewTaskModal.tsx
    hooks/
      useTaskFiltering.ts
      useTaskHandlers.ts
      useTaskManagerState.ts
      useTasksAndTags.ts
    lib/
      api.ts
    types/
      task.ts
    utils/
      taskUtils.ts
    globals.css
    layout.tsx
    page.tsx
    TaskManager.tsx
public/
  (static assets)
```

## Installation & Setup

### Prerequisites
- Node.js (version 18 or higher)
- npm or yarn

### Installation Steps
1. Clone the repository:
   ```
   git clone <repository-url>
   cd mastertracker-frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables (see below).

4. Run the development server:
   ```
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables
Create a `.env.local` file in the root directory and add the following:
```
NEXT_PUBLIC_TASKMASTER_DB_URL=http://your-backend-api-url
NEXT_PUBLIC_APP_PASSWORD=yourpassword
```
Replace `http://your-backend-api-url` with the actual URL of your TaskMaster backend API.
Replace `yourpassword` with the actual password you whihc to use to access the TaskMaster frontend.

## Author
[Luis Fernando Villalon] - Created as a learning project for backend development with FastAPI.
