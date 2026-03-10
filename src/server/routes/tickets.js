import { createTicket, loadTicket, updateTicket, deleteTicket, listTickets } from '../../core/ticket.js';

export function registerTicketRoutes(app) {
  app.get('/api/tickets', (req, res) => {
    try {
      const filters = {};
      if (req.query.status) filters.status = req.query.status;
      if (req.query.assignee) filters.assignee = req.query.assignee;
      if (req.query.type) filters.type = req.query.type;
      if (req.query.priority) filters.priority = req.query.priority;
      if (req.query.sprint) filters.sprint = req.query.sprint;
      if (req.query.label) filters.label = req.query.label;

      const tickets = listTickets(req.trellisPath, filters);
      res.json(tickets);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/tickets/:key', (req, res) => {
    try {
      const ticket = loadTicket(req.trellisPath, req.params.key.toUpperCase());
      res.json(ticket);
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  });

  app.post('/api/tickets', (req, res) => {
    try {
      const ticket = createTicket(req.trellisPath, req.body);
      res.status(201).json(ticket);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put('/api/tickets/:key', (req, res) => {
    try {
      const ticket = updateTicket(req.trellisPath, req.params.key.toUpperCase(), req.body);
      res.json(ticket);
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  });

  app.delete('/api/tickets/:key', (req, res) => {
    try {
      deleteTicket(req.trellisPath, req.params.key.toUpperCase());
      res.json({ ok: true });
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  });
}
