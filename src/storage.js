import mongoose from 'mongoose';

/**
 * Message Schema for MongoDB
 */
const messageSchema = new mongoose.Schema({
  user: { type: String, required: true },
  role: { type: String, enum: ['Employee', 'HR', 'system'], required: true },
  text: { type: String, required: true },
  room: { type: String, enum: ['general', 'hr-announcements'], required: true },
  createdAt: { type: Date, default: Date.now }
});

/**
 * Poll Schema for MongoDB
 */
const pollSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  room: { type: String, enum: ['general', 'hr-announcements'], required: true },
  question: { type: String, required: true },
  options: [{
    label: { type: String, required: true },
    votes: { type: Number, default: 0 },
    voters: [{ type: String }]
  }],
  isClosed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: String, required: true }
});

const Message = mongoose.model('Message', messageSchema);
const Poll = mongoose.model('Poll', pollSchema);

/**
 * Storage class that handles both in-memory and MongoDB persistence
 */
export class Storage {
  constructor() {
    this.useDatabase = false;
    this.messages = [];
    this.polls = new Map();
  }

  /**
   * Connect to MongoDB if MONGO_URI is provided
   */
  async connect() {
    const mongoUri = process.env.MONGO_URI;
    
    if (mongoUri) {
      try {
        await mongoose.connect(mongoUri);
        this.useDatabase = true;
        console.log('✓ Connected to MongoDB');
      } catch (error) {
        console.error('✗ MongoDB connection failed, using in-memory storage:', error.message);
        this.useDatabase = false;
      }
    } else {
      console.log('✓ Using in-memory storage (set MONGO_URI for persistence)');
    }
  }

  /**
   * Save a message
   */
  async saveMessage(messageData) {
    if (this.useDatabase) {
      const message = new Message(messageData);
      await message.save();
      return message.toObject();
    } else {
      const message = { ...messageData, createdAt: new Date() };
      this.messages.push(message);
      return message;
    }
  }

  /**
   * Get messages for a room
   */
  async getMessages(room, limit = 50) {
    if (this.useDatabase) {
      const messages = await Message.find({ room })
        .sort({ createdAt: -1 })
        .limit(limit);
      return messages.reverse().map(m => m.toObject());
    } else {
      return this.messages
        .filter(m => m.room === room)
        .slice(-limit);
    }
  }

  /**
   * Save a poll
   */
  async savePoll(pollData) {
    if (this.useDatabase) {
      const poll = new Poll(pollData);
      await poll.save();
      return poll.toObject();
    } else {
      this.polls.set(pollData.id, pollData);
      return pollData;
    }
  }

  /**
   * Get active poll for a room
   */
  async getActivePoll(room) {
    if (this.useDatabase) {
      const poll = await Poll.findOne({ room, isClosed: false });
      return poll ? poll.toObject() : null;
    } else {
      for (const poll of this.polls.values()) {
        if (poll.room === room && !poll.isClosed) {
          return poll;
        }
      }
      return null;
    }
  }

  /**
   * Get poll by ID
   */
  async getPoll(pollId) {
    if (this.useDatabase) {
      const poll = await Poll.findOne({ id: pollId });
      return poll ? poll.toObject() : null;
    } else {
      return this.polls.get(pollId) || null;
    }
  }

  /**
   * Update poll
   */
  async updatePoll(pollId, updates) {
    if (this.useDatabase) {
      const poll = await Poll.findOneAndUpdate(
        { id: pollId },
        updates,
        { new: true }
      );
      return poll ? poll.toObject() : null;
    } else {
      const poll = this.polls.get(pollId);
      if (poll) {
        Object.assign(poll, updates);
        return poll;
      }
      return null;
    }
  }

  /**
   * Close poll
   */
  async closePoll(pollId) {
    return this.updatePoll(pollId, { isClosed: true });
  }
}

export const storage = new Storage();
