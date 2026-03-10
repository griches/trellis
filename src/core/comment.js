import { nanoid } from 'nanoid';
import { loadTicket, saveTicket } from './ticket.js';

/**
 * Add a comment to a ticket.
 */
export function addComment(trellisPath, key, { author, body }) {
  const ticket = loadTicket(trellisPath, key);

  const comment = {
    id: nanoid(8),
    author: author || 'anonymous',
    body,
    created: new Date().toISOString()
  };

  if (!ticket.comments) ticket.comments = [];
  ticket.comments.push(comment);
  saveTicket(trellisPath, ticket);
  return comment;
}

/**
 * Delete a comment from a ticket by comment ID.
 */
export function deleteComment(trellisPath, key, commentId) {
  const ticket = loadTicket(trellisPath, key);
  const before = (ticket.comments || []).length;
  ticket.comments = (ticket.comments || []).filter(c => c.id !== commentId);
  if (ticket.comments.length === before) {
    throw new Error(`Comment ${commentId} not found on ${key}`);
  }
  saveTicket(trellisPath, ticket);
}

/**
 * List comments for a ticket.
 */
export function listComments(trellisPath, key) {
  const ticket = loadTicket(trellisPath, key);
  return ticket.comments || [];
}
