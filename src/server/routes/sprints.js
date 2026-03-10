import { listSprints, loadSprint, createSprint, addTicketToSprint, removeTicketFromSprint } from '../../core/sprint.js';
import { listTickets } from '../../core/ticket.js';

export function registerSprintRoutes(app) {
  app.get('/api/sprints', (req, res) => {
    try {
      const sprints = listSprints(req.trellisPath);
      res.json(sprints);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/sprints/:id', (req, res) => {
    try {
      const sprint = loadSprint(req.trellisPath, req.params.id);
      // Resolve ticket details
      const allTickets = listTickets(req.trellisPath);
      const tickets = sprint.ticketKeys
        .map(key => allTickets.find(t => t.key === key))
        .filter(Boolean);
      res.json({ ...sprint, tickets });
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  });

  app.post('/api/sprints', (req, res) => {
    try {
      const sprint = createSprint(req.trellisPath, req.body);
      res.status(201).json(sprint);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });
}
