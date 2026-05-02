# WorkFlow Pro

WorkFlow Pro is a unified enterprise management system built for Small and Medium-sized Enterprises (SMEs). It combines task management, employee lifecycle management, financial tracking, and AI-powered communication into a single frontend application.

## Key Features

- Centralized management for tasks, attendance, HR, finance, and reports
- Role-based access controls for `ADMIN`, `HR_MANAGER`, and `EMPLOYEE`
- Bilingual support: Arabic and English
- Light and dark theme modes
- AI-powered internal chat assistant using Google Gemini API (`@google/genai`)
- Recycle Bin for safe recovery of deleted items
- Firebase hosting support

## Tech Stack

- React 19.2.1
- TypeScript 5.8.2
- Vite
- Firebase
- Google Gemini API (`@google/genai`)
- React Router DOM
- Recharts
- Context API for state and theme management

## Prerequisites

- Node.js 18 or later
- npm 10 or later

## Install the Project

1. Open a terminal in the project folder:

```bash
cd /home/mohammed/Development/graduate-project/workflow-pro-frontend
```

2. Install dependencies:

```bash
npm install
```

## Run the Project

Start the development server:

```bash
npm run dev
```

Open the local URL provided by Vite in your browser, typically `http://localhost:5173`.

## Build for Production

```bash
npm run build
```

## Preview the Production Build

```bash
npm run preview
```

## Notes

- If you use Firebase or Supabase, make sure your environment files are configured correctly.
- Adjust the base URL and service configuration as needed for deployment.
