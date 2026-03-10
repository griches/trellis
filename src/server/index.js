import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { registerTicketRoutes } from './routes/tickets.js';
import { registerBoardRoutes } from './routes/board.js';
import { registerCommentRoutes } from './routes/comments.js';
import { registerSprintRoutes } from './routes/sprints.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function startServer(trellisPath, port = 4000) {
  const app = express();

  app.use(express.json());

  // Serve static web files
  app.use(express.static(path.join(__dirname, '..', 'web')));

  // Inject trellisPath into all requests
  app.use((req, res, next) => {
    req.trellisPath = trellisPath;
    next();
  });

  // API routes
  registerBoardRoutes(app);
  registerTicketRoutes(app);
  registerCommentRoutes(app);
  registerSprintRoutes(app);

  const server = app.listen(port);
  return server;
}
