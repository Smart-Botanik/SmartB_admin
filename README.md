# Growing App Admin Frontend

Admin panel for Growing App built with React, TypeScript, Ant Design, and Refine.

## Tech Stack

- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite
- **UI Library**: Ant Design
- **Admin Framework**: Refine
- **Routing**: React Router v6
- **HTTP Client**: Axios (via Refine)
- **State Management**: Refine's built-in state management

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Backend API running on http://localhost:3001

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Development

The development server will start on http://localhost:5174

API requests are proxied to http://localhost:3001/api

## Project Structure

```
src/
├── components/
│   └── Layout/
│       └── index.tsx
├── pages/
│   ├── Dashboard/
│   │   └── index.tsx
│   └── Login/
│       └── index.tsx
├── main.tsx
└── vite-env.d.ts
```

## Features

- **Authentication**: Login/logout functionality
- **Dashboard**: Overview with statistics and recent activities
- **Responsive Design**: Works on desktop and mobile
- **Modern UI**: Clean Ant Design interface
- **Type Safety**: Full TypeScript support

## API Integration

The admin panel connects to the NestJS backend API:

- Base URL: http://localhost:3001/api
- Authentication: JWT tokens
- Resources: users, plants, diaries, brands, products, media

## Development Notes

- Uses Vite for fast development and optimized builds
- Refine provides admin-specific components and data management
- Ant Design components are customized for consistent theming
- TypeScript strict mode enabled for better type safety

## Next Steps

1. Implement authentication with JWT tokens
2. Add CRUD pages for all resources
3. Implement advanced filtering and search
4. Add file upload functionality for media
5. Create detailed analytics dashboard
