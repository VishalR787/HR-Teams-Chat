import { Server } from 'socket.io';
import { SOCKET_EVENTS, ROOMS } from './models.js';
import { storage } from './storage.js';
import { hrBotService } from './services/hrBot.service.js';
import { pollsManager } from './polls.js';

/**
 * Initialize Socket.IO server and event handlers
 */
export function initializeSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    let currentRoom = null;
    let currentUser = null;

    /**
     * Join a room
     */
    socket.on(SOCKET_EVENTS.JOIN_ROOM, async ({ room, user }) => {
      try {
        // Validate room
        const validRooms = Object.values(ROOMS).map(r => r.name);
        if (!validRooms.includes(room)) {
          socket.emit(SOCKET_EVENTS.ERROR, { message: 'Invalid room' });
          return;
        }

        // Leave current room if any
        if (currentRoom) {
          socket.leave(currentRoom);
        }

        // Join new room
        socket.join(room);
        currentRoom = room;
        currentUser = user;

        console.log(`${user.name} (${user.role}) joined ${room}`);

        // Send recent messages
        const messages = await storage.getMessages(room);
        messages.forEach(msg => {
          socket.emit(SOCKET_EVENTS.MESSAGE, msg);
        });

        // Send active poll if any
        const activePoll = await pollsManager.getActivePoll(room);
        if (activePoll) {
          socket.emit(SOCKET_EVENTS.POLL_ACTIVE, activePoll);
        }

        // Broadcast join message
        const joinMessage = {
          user: 'System',
          role: 'system',
          text: `${user.name} joined the channel`,
          createdAt: new Date(),
          room
        };
        io.to(room).emit(SOCKET_EVENTS.MESSAGE, joinMessage);

      } catch (error) {
        console.error('Join room error:', error);
        socket.emit(SOCKET_EVENTS.ERROR, { message: error.message });
      }
    });

    /**
     * Handle chat messages
     */
    socket.on(SOCKET_EVENTS.CHAT_MESSAGE, async ({ room, text, user }) => {
      try {
        if (!currentRoom || currentRoom !== room) {
          socket.emit(SOCKET_EVENTS.ERROR, { message: 'Not in this room' });
          return;
        }

        // Check HR-only room permissions
        if (room === 'hr-announcements' && user.role !== 'HR') {
          socket.emit(SOCKET_EVENTS.ERROR, { 
            message: 'Only HR can post in announcements channel' 
          });
          return;
        }

        // Check if it's a command
        const botResponse = hrBotService.processCommand(text, user);
        
        if (botResponse) {
          // It's a command - send user's command and bot's response
          const userMessage = {
            user: user.name,
            role: user.role,
            text,
            createdAt: new Date(),
            room
          };

          await storage.saveMessage(userMessage);
          io.to(room).emit(SOCKET_EVENTS.MESSAGE, userMessage);

          // Send bot response
          const botMessage = { ...botResponse, room };
          await storage.saveMessage(botMessage);
          io.to(room).emit(SOCKET_EVENTS.MESSAGE, botMessage);
        } else {
          // Regular message
          const message = {
            user: user.name,
            role: user.role,
            text,
            createdAt: new Date(),
            room
          };

          await storage.saveMessage(message);
          io.to(room).emit(SOCKET_EVENTS.MESSAGE, message);
        }

      } catch (error) {
        console.error('Chat message error:', error);
        socket.emit(SOCKET_EVENTS.ERROR, { message: error.message });
      }
    });

    /**
     * Get active poll
     */
    socket.on(SOCKET_EVENTS.POLL_GET, async ({ room }) => {
      try {
        const activePoll = await pollsManager.getActivePoll(room);
        if (activePoll) {
          socket.emit(SOCKET_EVENTS.POLL_ACTIVE, activePoll);
        }
      } catch (error) {
        console.error('Poll get error:', error);
        socket.emit(SOCKET_EVENTS.ERROR, { message: error.message });
      }
    });

    /**
     * Create a poll (HR only) - SERVER-SIDE AUTHORIZATION
     */
    socket.on(SOCKET_EVENTS.POLL_CREATE, async ({ room, question, options, user }) => {
      try {
        // SERVER-SIDE role check - don't trust client
        if (!user || user.role !== 'HR') {
          socket.emit(SOCKET_EVENTS.ERROR, { 
            message: 'Only HR can create polls' 
          });
          return;
        }
        
        if (!currentUser || currentUser.role !== 'HR') {
          socket.emit(SOCKET_EVENTS.ERROR, { 
            message: 'Only HR can create polls' 
          });
          return;
        }

        if (!question || !options || options.length < 2) {
          socket.emit(SOCKET_EVENTS.ERROR, { 
            message: 'Poll must have a question and at least 2 options' 
          });
          return;
        }

        const poll = await pollsManager.createPoll(
          room,
          question,
          options,
          currentUser.name
        );

        // Broadcast new poll to all users in the room
        io.to(room).emit(SOCKET_EVENTS.POLL_ACTIVE, poll);

        // Send confirmation message
        const message = {
          user: 'System',
          role: 'system',
          text: `${currentUser.name} created a new poll: "${question}"`,
          createdAt: new Date(),
          room
        };
        await storage.saveMessage(message);
        io.to(room).emit(SOCKET_EVENTS.MESSAGE, message);

      } catch (error) {
        console.error('Poll create error:', error);
        socket.emit(SOCKET_EVENTS.ERROR, { message: error.message });
      }
    });

    /**
     * Vote on a poll
     */
    socket.on(SOCKET_EVENTS.POLL_VOTE, async ({ pollId, room, optionIndex, user }) => {
      try {
        const poll = await pollsManager.vote(pollId, room, optionIndex, user);

        // Broadcast updated poll to all users in the room
        io.to(room).emit(SOCKET_EVENTS.POLL_UPDATE, poll);

      } catch (error) {
        console.error('Poll vote error:', error);
        socket.emit(SOCKET_EVENTS.ERROR, { message: error.message });
      }
    });

    /**
     * Close a poll (HR only) - SERVER-SIDE AUTHORIZATION
     */
    socket.on(SOCKET_EVENTS.POLL_CLOSE, async ({ pollId, room, user }) => {
      try {
        // SERVER-SIDE role check - don't trust client
        if (!user || user.role !== 'HR') {
          socket.emit(SOCKET_EVENTS.ERROR, { 
            message: 'Only HR can close polls' 
          });
          return;
        }
        
        if (!currentUser || currentUser.role !== 'HR') {
          socket.emit(SOCKET_EVENTS.ERROR, { 
            message: 'Only HR can close polls' 
          });
          return;
        }

        const poll = await pollsManager.closePoll(pollId, room);

        // Broadcast closed poll
        io.to(room).emit(SOCKET_EVENTS.POLL_UPDATE, poll);

        // Send confirmation message
        const message = {
          user: 'System',
          role: 'system',
          text: `Poll "${poll.question}" has been closed by ${currentUser.name}`,
          createdAt: new Date(),
          room
        };
        await storage.saveMessage(message);
        io.to(room).emit(SOCKET_EVENTS.MESSAGE, message);

      } catch (error) {
        console.error('Poll close error:', error);
        socket.emit(SOCKET_EVENTS.ERROR, { message: error.message });
      }
    });

    /**
     * Handle disconnection
     */
    socket.on('disconnect', () => {
      if (currentUser && currentRoom) {
        console.log(`${currentUser.name} disconnected from ${currentRoom}`);
        
        const message = {
          user: 'System',
          role: 'system',
          text: `${currentUser.name} left the channel`,
          createdAt: new Date(),
          room: currentRoom
        };
        io.to(currentRoom).emit(SOCKET_EVENTS.MESSAGE, message);
      }
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
}
