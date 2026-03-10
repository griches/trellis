import fs from 'fs';
import path from 'path';

const TRELLIS_DIR = '.trellis';
const CONFIG_FILE = 'config.json';
const COUNTER_FILE = 'counter.json';

const DEFAULT_CONFIG = {
  project: {
    key: '',
    name: '',
    created: ''
  },
  board: {
    columns: [
      { id: 'backlog', name: 'Backlog', isBacklog: true },
      { id: 'todo', name: 'To Do' },
      { id: 'in-progress', name: 'In Progress' },
      { id: 'review', name: 'Code Review' },
      { id: 'done', name: 'Done', isDone: true },
      { id: 'archived', name: 'Archived', isArchive: true }
    ]
  },
  fields: {
    types: ['Bug', 'Task', 'Story', 'Epic', 'Spike'],
    priorities: ['Critical', 'High', 'Medium', 'Low'],
    tshirtSizes: ['XS', 'S', 'M', 'L', 'XL'],
    pointScale: [1, 2, 3, 5, 8, 13, 21],
    defaultAssignee: ''
  },
  server: {
    port: 4000
  }
};

/**
 * Walk up from startDir to find a .trellis directory.
 * Returns the path to the .trellis directory, or null if not found.
 */
export function findTrellisRoot(startDir = process.cwd()) {
  let dir = path.resolve(startDir);
  const root = path.parse(dir).root;

  while (dir !== root) {
    const trellisPath = path.join(dir, TRELLIS_DIR);
    if (fs.existsSync(trellisPath) && fs.statSync(trellisPath).isDirectory()) {
      return trellisPath;
    }
    dir = path.dirname(dir);
  }
  return null;
}

/**
 * Require that we're inside a trellis project. Throws if not found.
 */
export function requireProject(startDir) {
  const trellisPath = findTrellisRoot(startDir);
  if (!trellisPath) {
    throw new Error('Not inside a Trellis project. Run "trellis init <KEY>" to create one.');
  }
  return trellisPath;
}

/**
 * Initialize a new trellis project in the given directory.
 */
export function initProject(dir, key, name) {
  const trellisPath = path.join(dir, TRELLIS_DIR);

  if (fs.existsSync(trellisPath)) {
    throw new Error(`Trellis project already exists at ${trellisPath}`);
  }

  fs.mkdirSync(trellisPath, { recursive: true });
  fs.mkdirSync(path.join(trellisPath, 'tickets'));
  fs.mkdirSync(path.join(trellisPath, 'sprints'));

  const config = {
    ...DEFAULT_CONFIG,
    project: {
      key: key.toUpperCase(),
      name: name || key,
      created: new Date().toISOString()
    }
  };

  fs.writeFileSync(
    path.join(trellisPath, CONFIG_FILE),
    JSON.stringify(config, null, 2)
  );

  fs.writeFileSync(
    path.join(trellisPath, COUNTER_FILE),
    JSON.stringify({ next: 1 })
  );

  return trellisPath;
}

/**
 * Load project config.
 */
export function loadConfig(trellisPath) {
  const configPath = path.join(trellisPath, CONFIG_FILE);
  const raw = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  return { ...DEFAULT_CONFIG, ...raw };
}

/**
 * Save project config.
 */
export function saveConfig(trellisPath, config) {
  const configPath = path.join(trellisPath, CONFIG_FILE);
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

/**
 * Get and increment the ticket counter.
 */
export function nextTicketNumber(trellisPath) {
  const counterPath = path.join(trellisPath, COUNTER_FILE);
  const counter = JSON.parse(fs.readFileSync(counterPath, 'utf8'));
  const num = counter.next;
  counter.next = num + 1;
  fs.writeFileSync(counterPath, JSON.stringify(counter));
  return num;
}

/**
 * Get valid statuses from config.
 */
export function getStatuses(config) {
  return config.board.columns.map(c => c.id);
}

/**
 * Get the project directory (parent of .trellis).
 */
export function getProjectDir(trellisPath) {
  return path.dirname(trellisPath);
}
