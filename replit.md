# HR Teams Chat Application

## Overview

HR Teams Chat is a real-time workplace communication platform inspired by Microsoft Teams. It provides role-based chat functionality with dedicated channels for general communication and HR announcements. The application features an intelligent HR Bot that responds to employee slash commands, and a real-time polling system for team engagement.

The system is built as a full-stack JavaScript application with a vanilla JavaScript frontend and Node.js/Express/Socket.IO backend. It supports both in-memory storage (for quick deployment) and optional MongoDB persistence.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack**: Vanilla JavaScript with modern ES6+ features, no framework dependencies for the main chat interface.

**UI Design Pattern**: Microsoft Teams-inspired three-pane layout
- **Left Rail** (56px fixed width): Application navigation with app logo
- **Sidebar** (260px fixed width): User profile management, channel list, and action controls
- **Main Content Area** (flexible width): Chat messages, active polls, and message composer

**State Management**: Client-side state managed through plain JavaScript objects
- User session persisted to localStorage (username and role)
- Real-time state synchronized via Socket.IO events
- Active poll state maintained in memory and updated via socket events

**Component Structure**: 
- Modular DOM manipulation with dedicated element references
- Event-driven architecture for user interactions
- Real-time updates handled through socket event listeners

**Design System**: Custom CSS with CSS variables for theming, following Microsoft Teams visual language with professional workplace aesthetics.

### Backend Architecture

**Runtime**: Node.js 20+ with ES modules

**Core Framework**: Express.js for HTTP server and static file serving

**Real-Time Communication**: Socket.IO for bidirectional event-based communication
- Rooms-based architecture for channel separation
- Event-driven message broadcasting
- Connection state management per socket

**Architecture Pattern**: Service-oriented with separated concerns
- `server.js`: Express server setup and initialization
- `socket.js`: Socket.IO event handlers and room management
- `polls.js`: Poll lifecycle management (creation, voting, closing)
- `hrBot.service.js`: Command parsing and automated response generation
- `storage.js`: Data persistence abstraction layer

**Role-Based Access Control**: 
- User roles: Employee, HR, System (for HR Bot)
- Channel-level permissions enforced server-side
- Poll creation and closure restricted to HR role
- Message posting in hr-announcements restricted to HR role

**Command System**: Slash command parser with pattern matching
- `/leave balance`: Return leave entitlement information
- `/payslip <Month> <Year>`: Generate payslip link
- `/apply leave <N> days from <Date>`: Submit leave request
- Commands processed synchronously and respond as system messages

### Data Storage Solutions

**Dual-Storage Strategy**: The application implements a flexible storage abstraction that supports both in-memory and database-backed persistence.

**In-Memory Storage** (Default):
- JavaScript Maps and Arrays for data structures
- Instant startup, no external dependencies
- Suitable for development and demo environments
- Data cleared on server restart

**MongoDB Storage** (Optional):
- Activated when `MONGO_URI` environment variable is provided
- Mongoose ODM for schema definition and validation
- Collections: Messages, Polls
- Supports MongoDB Atlas (cloud) or self-hosted instances
- Persistent storage across server restarts

**Storage Interface**: Unified API regardless of storage backend
- `getMessages(room)`: Retrieve channel message history
- `saveMessage(message)`: Persist new message
- `getActivePoll(room)`: Fetch current active poll for channel
- `savePoll(poll)`: Create new poll
- `getPoll(pollId)`: Retrieve specific poll
- `updatePoll(poll)`: Update poll state (votes, closure)

The storage layer automatically selects the appropriate implementation at runtime based on environment configuration.

### External Dependencies

**Real-Time Communication**:
- Socket.IO: WebSocket-based bidirectional communication between clients and server
- Handles automatic reconnection, event multiplexing, and room-based broadcasting

**Database** (Optional):
- MongoDB: NoSQL document database for message and poll persistence
- Mongoose: ODM library providing schema validation and query building
- MongoDB Atlas or self-hosted deployment supported via `MONGO_URI` connection string

**React Stack** (Client-side components):
- React 18+: Component-based UI library (used alongside vanilla JS)
- Vite: Build tool and development server
- Radix UI: Accessible component primitives
- Tailwind CSS: Utility-first CSS framework
- TanStack Query: Server state management for React components

**Backend Dependencies**:
- Express: Web application framework
- CORS: Cross-origin resource sharing middleware
- dotenv: Environment variable management

**Development Tools**:
- TypeScript: Type checking (configured but not strictly required)
- Drizzle ORM: Database toolkit (configured for PostgreSQL support)
- ESBuild: JavaScript bundler for production builds

**Note on Drizzle Configuration**: The repository includes Drizzle ORM configuration pointing to PostgreSQL. This represents planned database migration work but is not currently used by the application. The active storage implementation uses Mongoose with MongoDB.