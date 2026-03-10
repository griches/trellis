import fs from 'fs';
import path from 'path';

function sprintsDir(trellisPath) {
  return path.join(trellisPath, 'sprints');
}

function sprintPath(trellisPath, id) {
  return path.join(sprintsDir(trellisPath), `${id}.json`);
}

/**
 * Create a new sprint.
 */
export function createSprint(trellisPath, { name, goal, startDate, endDate }) {
  const dir = sprintsDir(trellisPath);
  const existing = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
  const num = existing.length + 1;
  const id = `sprint-${num}`;

  const sprint = {
    id,
    name: name || `Sprint ${num}`,
    goal: goal || '',
    startDate: startDate || null,
    endDate: endDate || null,
    ticketKeys: [],
    created: new Date().toISOString()
  };

  fs.writeFileSync(sprintPath(trellisPath, id), JSON.stringify(sprint, null, 2));
  return sprint;
}

/**
 * Load a sprint by ID.
 */
export function loadSprint(trellisPath, id) {
  const fp = sprintPath(trellisPath, id);
  if (!fs.existsSync(fp)) {
    throw new Error(`Sprint ${id} not found`);
  }
  return JSON.parse(fs.readFileSync(fp, 'utf8'));
}

/**
 * List all sprints.
 */
export function listSprints(trellisPath) {
  const dir = sprintsDir(trellisPath);
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
  return files.map(f => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')));
}

/**
 * Add a ticket key to a sprint.
 */
export function addTicketToSprint(trellisPath, sprintId, ticketKey) {
  const sprint = loadSprint(trellisPath, sprintId);
  if (!sprint.ticketKeys.includes(ticketKey)) {
    sprint.ticketKeys.push(ticketKey);
    fs.writeFileSync(sprintPath(trellisPath, sprintId), JSON.stringify(sprint, null, 2));
  }
  return sprint;
}

/**
 * Remove a ticket key from a sprint.
 */
export function removeTicketFromSprint(trellisPath, sprintId, ticketKey) {
  const sprint = loadSprint(trellisPath, sprintId);
  sprint.ticketKeys = sprint.ticketKeys.filter(k => k !== ticketKey);
  fs.writeFileSync(sprintPath(trellisPath, sprintId), JSON.stringify(sprint, null, 2));
  return sprint;
}
