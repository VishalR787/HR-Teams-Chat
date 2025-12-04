# HR Teams Chat

A full-stack real-time chat application with Microsoft Teams-style UI, built with Node.js, Express, Socket.IO, and vanilla JavaScript.

## Features

### Core Functionality
- **Real-time messaging** with Socket.IO across multiple channels
- **Two channels**: `# general` and `# hr-announcements`
- **Role-based access control**: Employee and HR roles
- **HR Bot** with intelligent slash commands
- **Live polling system** with real-time vote updates
- **Persistent storage**: In-memory by default, MongoDB optional

### Microsoft Teams-Style UI
- Professional 3-pane layout (56px rail, 260px sidebar, main chat area)
- User profile management with role selection
- Channel navigation with active states
- Message rendering with role badges and timestamps
- Command detection with visual chips
- Beautiful poll interface with live vote counts
- Responsive design for all screen sizes

### HR Bot Commands
The HR Bot responds to the following slash commands:

- `/leave balance` - Check your remaining leave balance
- `/payslip <Month> 2025` - Get a link to your payslip (e.g., `/payslip January 2025`)
- `/apply leave <N> days from <YYYY-MM-DD>` - Submit a leave request (e.g., `/apply leave 3 days from 2025-01-15`)

### Polling System
- **HR-only creation**: Only HR users can create and close polls
- **Real-time voting**: Votes update instantly for all participants
- **Vote tracking**: Users can see which option they voted for
- **One active poll per channel**: Prevents poll clutter
- **Live vote counts**: Visual progress bars and percentages

### Role-Based Permissions
- **HR Announcements channel**: Only HR can post messages
- **Poll creation**: Only HR can create and close polls
- **General channel**: All users can participate

## Quick Start on Replit

1. Click the **Run** button
2. The application will start on port 5000
3. Open the webview to access the chat interface
4. Enter your name and select your role (Employee or HR)
5. Click "Set" to join the chat
6. Start messaging and exploring features!

### Optional: MongoDB Persistence

By default, the app uses in-memory storage. To enable MongoDB persistence:

1. Go to Replit Secrets
2. Add a secret named `MONGO_URI`
3. Set the value to your MongoDB connection string (e.g., MongoDB Atlas)
4. Restart the application

## Docker Usage

### Running with Docker Compose

The application includes full Docker support with a backend service and MongoDB:

```bash
# Build and start all services
docker compose up --build

# Run in detached mode
docker compose up -d --build

# View logs
docker compose logs -f

# Stop services
docker compose down

# Stop and remove volumes
docker compose down -v
```

Once running, open http://localhost:5000 in your browser.

### Docker Services

The `docker-compose.yml` includes:

- **backend**: Node.js application (port 5000)
- **mongo**: MongoDB 7 database (port 27017)
- **mongo_data**: Persistent volume for database storage

### Verify Docker Deployment

```bash
# Check running containers
docker ps

# Should show:
# - hr-teams-chat-backend-1
# - hr-teams-chat-mongo-1

# Check logs
docker compose logs backend
docker compose logs mongo
```

## Project Structure

```
hr-teams-chat/
├── src/
│   ├── server.js              # Express server setup
│   ├── socket.js              # Socket.IO event handlers
│   ├── storage.js             # Storage abstraction (in-memory/MongoDB)
│   ├── models.js              # Data models and event types
│   ├── polls.js               # Polling system logic
│   └── services/
│       └── hrBot.service.js   # HR Bot command processor
├── public/
│   ├── index.html             # Frontend HTML structure
│   ├── styles.css             # Microsoft Teams-inspired CSS
│   └── app.js                 # Frontend JavaScript with Socket.IO client
├── Dockerfile                 # Docker container configuration
├── docker-compose.yml         # Docker Compose orchestration
├── package.json               # Node.js dependencies
└── README.md                  # This file
```

## Technology Stack

### Backend
- **Node.js 20+** - JavaScript runtime
- **Express** - Web framework
- **Socket.IO** - Real-time bidirectional communication
- **Mongoose** - MongoDB ODM (optional)
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment variable management

### Frontend
- **Vanilla JavaScript** - No frameworks, pure JS
- **Socket.IO Client** - Real-time connection
- **Modern CSS** - Flexbox, CSS Variables, Animations
- **LocalStorage** - User preference persistence

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **MongoDB 7** - NoSQL database (optional)

## Socket.IO Events

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `joinRoom` | `{ room, user: { name, role } }` | Join a chat room |
| `chatMessage` | `{ room, text, user }` | Send a message |
| `poll:get` | `{ room }` | Get active poll for room |
| `poll:create` | `{ room, question, options[] }` | Create new poll (HR only) |
| `poll:vote` | `{ pollId, room, optionIndex, user }` | Vote on a poll |
| `poll:close` | `{ pollId, room }` | Close a poll (HR only) |

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `message` | `{ user, role, text, createdAt }` | New message received |
| `poll:active` | `{ id, room, question, options[], isClosed }` | Active poll info |
| `poll:update` | `{ id, room, question, options[], isClosed }` | Poll updated (new votes) |
| `error` | `{ message }` | Error notification |

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `5000` | Server port |
| `MONGO_URI` | No | - | MongoDB connection string (enables persistence) |

## Acceptance Testing

After starting the application, verify these features:

### 1. User Setup
- [ ] Enter name and select role (Employee/HR)
- [ ] Click "Set" to save user profile
- [ ] User info persists in localStorage

### 2. Channel Navigation
- [ ] Switch between `# general` and `# hr-announcements`
- [ ] Active channel highlighted in sidebar
- [ ] Previous messages load when switching

### 3. Real-Time Messaging
- [ ] Open app in two browser tabs
- [ ] Send message in one tab
- [ ] Message appears instantly in both tabs
- [ ] Timestamps are accurate

### 4. HR Bot Commands
- [ ] Type `/leave balance` in chat
- [ ] HR-Bot responds with leave information
- [ ] Message shows "Command" chip
- [ ] Try other commands (`/payslip`, `/apply leave`)

### 5. Polling System
- [ ] As HR user, click "+ New Poll (HR)"
- [ ] Create poll with question and 2+ options
- [ ] Poll appears above messages
- [ ] Vote on poll from different tab
- [ ] Vote counts update in real-time
- [ ] HR can close the poll
- [ ] Non-HR users cannot create/close polls

### 6. Role-Based Permissions
- [ ] As Employee, try to post in `# hr-announcements`
- [ ] Composer should be disabled
- [ ] As HR, posting works normally
- [ ] "+ New Poll" button disabled for Employees

### 7. Docker Deployment
- [ ] Run `docker compose up --build`
- [ ] Access http://localhost:5000
- [ ] Verify backend and mongo containers running
- [ ] All features work identically to Replit

## Development

### Running Locally

```bash
# Install dependencies
npm install

# Start development server (with auto-reload)
npm run dev

# Start production server
npm start
```

### Storage Modes

**In-Memory (Default)**
- Data stored in JavaScript objects
- Fast and simple
- Data lost on restart
- Perfect for development and testing

**MongoDB (Optional)**
- Data persisted to database
- Survives restarts
- Enable by setting `MONGO_URI` environment variable
- Supports MongoDB Atlas or self-hosted

## API Health Check

The server exposes a health check endpoint:

```bash
curl http://localhost:5000/health
```

Response:
```json
{
  "status": "ok",
  "storage": "in-memory",
  "timestamp": "2025-01-05T12:00:00.000Z"
}
```

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

MIT

## Screenshots

*Add screenshots of your deployed application here*

### Main Chat Interface
- 3-pane layout with rail, sidebar, and chat area
- Message list with role badges and timestamps
- Live poll with vote counts

### User Profile Setup
- Name input and role selection
- Set button to save preferences
- User info display with avatar

### Poll Creation (HR Only)
- Modal dialog for creating polls
- Question input and multiple options
- Real-time vote tracking

---

### AI Text Enhancer Assistant
Overview

    The AI Text Enhancer is an integrated micro-assistant that rewrites, simplifies, or polishes HR-related messages directly inside the chat interface.
    It acts as a lightweight generative-AI writing helper powered by Ollama, connected through the /api/ai/assist backend endpoint.

✨ Key Features

    Modes: polish, simplify, accept, decline, ask_clarify

    Tone Control: formal, friendly, neutral

    Reply Style: chat (Teams-style short replies) or email (with greeting + sign-off)

    Formatting Options: paragraph or bullets

    Role Direction: Supports both Employee → HR and HR → Employee rewriting flows

💡 Usage Flow

    Open the Text Enhancer panel from the sidebar.

    Type or paste your draft message.

    Choose the desired transformation options (mode, tone, role).

    Click Generate → the AI produces the rewritten version.

    Click Use this (paste to chat) to insert it into the composer instantly.

⚙️ Backend Logic

    Defined in server.js (or routes/assist.js):

    app.post('/api/ai/assist', async (req, res) => {
      const { hrMessage = '', draft = '', mode = 'polish',
              tone = 'neutral', replyStyle = 'chat',
              length = 'short', format = 'paragraph' } = req.body;
      // Builds SYSTEM + USER prompts and calls Ollama
    });


      Model: qwen2.5:3b (configurable via process.env.OLLAMA_MODEL)

      Engine: Local LLM inference using Ollama (http://127.0.0.1:11434)

      Output: Returns only the final rewritten message — no metadata or extra text.

🖥️ Frontend Logic

    Implemented in public/ai.js:

    Handles drawer open/close events.

    Reads selected dropdown values (mode, tone, role).

    Sends a fetch('/api/ai/assist') request with JSON payload.

    Displays AI output in a preview box.

    Enables quick Paste to Chat or Copy actions.

🧩 Example Input / Output
      Input	Output (Polish + Formal + Employee → HR)
      hi sir tomorrow i am leaving to beijing so please let me know if there is anything imp	Dear Sir, I’ll be leaving for Beijing tomorrow to attend the meeting. Please let me know if there’s anything important I should take care of.
🧰 Dependencies

      Ollama – Local LLM runner

      Node Fetch API – Backend communication

      Vanilla JS / Fetch – Frontend integration

**Built with ❤️ for HR Teams**
