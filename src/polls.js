import { randomUUID } from 'crypto';
import { storage } from './storage.js';

/**
 * Polls Manager - Handles poll creation, voting, and lifecycle
 */
export class PollsManager {
  /**
   * Create a new poll
   */
  async createPoll(room, question, options, createdBy) {
    // Check if there's already an active poll in this room
    const existingPoll = await storage.getActivePoll(room);
    if (existingPoll) {
      throw new Error('There is already an active poll in this channel. Please close it first.');
    }

    const poll = {
      id: randomUUID(),
      room,
      question,
      options: options.map(label => ({
        label,
        votes: 0,
        voters: []
      })),
      isClosed: false,
      createdAt: new Date(),
      createdBy
    };

    await storage.savePoll(poll);
    return poll;
  }

  /**
   * Vote on a poll - Fixed to avoid mutation bugs
   */
  async vote(pollId, room, optionIndex, user) {
    const poll = await storage.getPoll(pollId);

    if (!poll) {
      throw new Error('Poll not found');
    }

    if (poll.room !== room) {
      throw new Error('Poll does not belong to this room');
    }

    if (poll.isClosed) {
      throw new Error('This poll is closed');
    }

    if (optionIndex < 0 || optionIndex >= poll.options.length) {
      throw new Error('Invalid option index');
    }

    // Create a deep copy of options to avoid mutation issues
    const updatedOptions = poll.options.map(opt => ({
      label: opt.label,
      votes: opt.votes,
      voters: [...opt.voters]
    }));

    // Check if user already voted and remove previous vote
    updatedOptions.forEach(opt => {
      const index = opt.voters.indexOf(user.name);
      if (index > -1) {
        opt.voters.splice(index, 1);
        opt.votes--;
      }
    });

    // Add new vote
    updatedOptions[optionIndex].voters.push(user.name);
    updatedOptions[optionIndex].votes++;

    // Update with new options array
    const updatedPoll = await storage.updatePoll(pollId, { options: updatedOptions });
    return updatedPoll || { ...poll, options: updatedOptions };
  }

  /**
   * Close a poll
   */
  async closePoll(pollId, room) {
    const poll = await storage.getPoll(pollId);

    if (!poll) {
      throw new Error('Poll not found');
    }

    if (poll.room !== room) {
      throw new Error('Poll does not belong to this room');
    }

    if (poll.isClosed) {
      throw new Error('Poll is already closed');
    }

    await storage.closePoll(pollId);
    poll.isClosed = true;
    return poll;
  }

  /**
   * Get active poll for a room
   */
  async getActivePoll(room) {
    return await storage.getActivePoll(room);
  }
}

export const pollsManager = new PollsManager();
