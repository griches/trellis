import fs from 'fs';
import path from 'path';
import { loadConfig, nextTicketNumber } from './project.js';

const TICKET_DEFAULTS = {
  key: '',
  summary: '',
  description: '',
  type: 'Task',
  status: 'backlog',
  priority: 'Medium',
  assignee: '',
  reporter: '',
  points: null,
  tshirtSize: null,
  acceptanceCriteria: '',
  labels: [],
  sprint: null,
  comments: [],
  created: '',
  updated: ''
};

function ticketsDir(trellisPath) {
  return path.join(trellisPath, 'tickets');
}

function ticketPath(trellisPath, key) {
  return path.join(ticketsDir(trellisPath), `${key}.json`);
}

/**
 * Load a single ticket, merging with defaults for forward compatibility.
 */
export function loadTicket(trellisPath, key) {
  const fp = ticketPath(trellisPath, key);
  if (!fs.existsSync(fp)) {
    throw new Error(`Ticket ${key} not found`);
  }
  const raw = JSON.parse(fs.readFileSync(fp, 'utf8'));
  return { ...TICKET_DEFAULTS, ...raw };
}

/**
 * Save a ticket to disk.
 */
export function saveTicket(trellisPath, ticket) {
  ticket.updated = new Date().toISOString();
  const fp = ticketPath(trellisPath, ticket.key);
  fs.writeFileSync(fp, JSON.stringify(ticket, null, 2));
  return ticket;
}

/**
 * Create a new ticket.
 */
export function createTicket(trellisPath, fields) {
  const config = loadConfig(trellisPath);
  const num = nextTicketNumber(trellisPath);
  const key = `${config.project.key}-${num}`;
  const now = new Date().toISOString();

  const ticket = {
    ...TICKET_DEFAULTS,
    ...fields,
    key,
    created: now,
    updated: now
  };

  // Default status to first non-backlog column if not specified
  if (!fields.status) {
    ticket.status = 'backlog';
  }

  saveTicket(trellisPath, ticket);
  return ticket;
}

/**
 * Update a ticket with partial fields.
 */
export function updateTicket(trellisPath, key, fields) {
  const ticket = loadTicket(trellisPath, key);
  Object.assign(ticket, fields);
  return saveTicket(trellisPath, ticket);
}

/**
 * Delete a ticket.
 */
export function deleteTicket(trellisPath, key) {
  const fp = ticketPath(trellisPath, key);
  if (!fs.existsSync(fp)) {
    throw new Error(`Ticket ${key} not found`);
  }
  fs.unlinkSync(fp);
}

/**
 * List all tickets, optionally filtered.
 */
export function listTickets(trellisPath, filters = {}) {
  const dir = ticketsDir(trellisPath);
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

  let tickets = files.map(f => {
    const raw = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    return { ...TICKET_DEFAULTS, ...raw };
  });

  if (filters.status) {
    tickets = tickets.filter(t => t.status === filters.status);
  }
  if (filters.assignee) {
    tickets = tickets.filter(t => t.assignee === filters.assignee);
  }
  if (filters.type) {
    tickets = tickets.filter(t => t.type === filters.type);
  }
  if (filters.priority) {
    tickets = tickets.filter(t => t.priority === filters.priority);
  }
  if (filters.sprint) {
    tickets = tickets.filter(t => t.sprint === filters.sprint);
  }
  if (filters.label) {
    tickets = tickets.filter(t => t.labels && t.labels.includes(filters.label));
  }

  // Sort by priority weight then key
  const priorityWeight = { Critical: 0, High: 1, Medium: 2, Low: 3 };
  tickets.sort((a, b) => {
    const pa = priorityWeight[a.priority] ?? 99;
    const pb = priorityWeight[b.priority] ?? 99;
    if (pa !== pb) return pa - pb;
    return a.key.localeCompare(b.key);
  });

  return tickets;
}
