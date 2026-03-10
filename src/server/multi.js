import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { requireProject, loadConfig } from '../core/project.js';
import { createTicket, loadTicket, updateTicket, deleteTicket, listTickets } from '../core/ticket.js';
import { addComment, deleteComment, listComments } from '../core/comment.js';
import { listSprints, loadSprint, createSprint } from '../core/sprint.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function startMultiServer(projectPaths, port = 4000) {
  const app = express();
  app.use(express.json());

  // Resolve all trellis paths upfront
  const projects = projectPaths.map(p => {
    const trellisPath = requireProject(p);
    const config = loadConfig(trellisPath);
    return { path: trellisPath, key: config.project.key, name: config.project.name };
  });

  // Serve multi-project web UI
  app.use(express.static(path.join(__dirname, '..', 'web-multi')));

  // List all projects
  app.get('/api/projects', (req, res) => {
    const list = projects.map(p => {
      const config = loadConfig(p.path);
      return { key: p.key, name: config.project.name, path: p.path };
    });
    res.json(list);
  });

  // Resolve project middleware
  function resolveProject(req, res, next) {
    const projectKey = req.params.projectKey?.toUpperCase();
    const project = projects.find(p => p.key === projectKey);
    if (!project) {
      return res.status(404).json({ error: `Project ${projectKey} not found` });
    }
    req.trellisPath = project.path;
    next();
  }

  // Config
  app.get('/api/projects/:projectKey/config', resolveProject, (req, res) => {
    try {
      res.json(loadConfig(req.trellisPath));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Tickets
  app.get('/api/projects/:projectKey/tickets', resolveProject, (req, res) => {
    try {
      const filters = {};
      for (const key of ['status', 'assignee', 'type', 'priority', 'sprint', 'label']) {
        if (req.query[key]) filters[key] = req.query[key];
      }
      res.json(listTickets(req.trellisPath, filters));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/projects/:projectKey/tickets/:key', resolveProject, (req, res) => {
    try {
      res.json(loadTicket(req.trellisPath, req.params.key.toUpperCase()));
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  });

  app.post('/api/projects/:projectKey/tickets', resolveProject, (req, res) => {
    try {
      res.status(201).json(createTicket(req.trellisPath, req.body));
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put('/api/projects/:projectKey/tickets/:key', resolveProject, (req, res) => {
    try {
      res.json(updateTicket(req.trellisPath, req.params.key.toUpperCase(), req.body));
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  });

  app.delete('/api/projects/:projectKey/tickets/:key', resolveProject, (req, res) => {
    try {
      deleteTicket(req.trellisPath, req.params.key.toUpperCase());
      res.json({ ok: true });
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  });

  // Comments
  app.get('/api/projects/:projectKey/tickets/:key/comments', resolveProject, (req, res) => {
    try {
      res.json(listComments(req.trellisPath, req.params.key.toUpperCase()));
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  });

  app.post('/api/projects/:projectKey/tickets/:key/comments', resolveProject, (req, res) => {
    try {
      res.status(201).json(addComment(req.trellisPath, req.params.key.toUpperCase(), req.body));
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/projects/:projectKey/tickets/:key/comments/:commentId', resolveProject, (req, res) => {
    try {
      deleteComment(req.trellisPath, req.params.key.toUpperCase(), req.params.commentId);
      res.json({ ok: true });
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  });

  // Sprints
  app.get('/api/projects/:projectKey/sprints', resolveProject, (req, res) => {
    try {
      res.json(listSprints(req.trellisPath));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  const server = app.listen(port);
  return server;
}
