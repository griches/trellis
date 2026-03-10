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
 * List comments for a ticket.
 */
export function listComments(trellisPath, key) {
  const ticket = loadTicket(trellisPath, key);
  return ticket.comments || [];
}
