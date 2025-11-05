/**
 * Data Models for HR Teams Chat
 * 
 * @typedef {Object} User
 * @property {string} name - User's display name
 * @property {'Employee'|'HR'} role - User's role
 */

/**
 * @typedef {Object} Message
 * @property {string} user - Username
 * @property {'Employee'|'HR'|'system'} role - User role (system for HR-Bot)
 * @property {string} text - Message content
 * @property {Date} createdAt - Message timestamp
 * @property {string} room - Room/channel name
 */

/**
 * @typedef {Object} PollOption
 * @property {string} label - Option text
 * @property {number} votes - Vote count
 * @property {string[]} voters - List of usernames who voted for this option
 */

/**
 * @typedef {Object} Poll
 * @property {string} id - Unique poll ID
 * @property {'general'|'hr-announcements'} room - Room name
 * @property {string} question - Poll question
 * @property {PollOption[]} options - Poll options with vote counts
 * @property {boolean} isClosed - Whether poll is closed
 * @property {Date} createdAt - Poll creation timestamp
 * @property {string} createdBy - Username of creator
 */

/**
 * @typedef {Object} Room
 * @property {string} name - Room name
 * @property {string} displayName - Display name with #
 * @property {boolean} hrOnly - Whether only HR can post
 */

export const ROOMS = {
  GENERAL: {
    name: 'general',
    displayName: '# general',
    hrOnly: false
  },
  HR_ANNOUNCEMENTS: {
    name: 'hr-announcements',
    displayName: '# hr-announcements',
    hrOnly: true
  }
};

/**
 * Socket.IO Event Types
 */
export const SOCKET_EVENTS = {
  // Client -> Server
  JOIN_ROOM: 'joinRoom',
  CHAT_MESSAGE: 'chatMessage',
  POLL_GET: 'poll:get',
  POLL_CREATE: 'poll:create',
  POLL_VOTE: 'poll:vote',
  POLL_CLOSE: 'poll:close',
  
  // Server -> Client
  MESSAGE: 'message',
  POLL_ACTIVE: 'poll:active',
  POLL_UPDATE: 'poll:update',
  ERROR: 'error'
};
