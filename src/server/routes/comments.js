import { addComment, listComments } from '../../core/comment.js';

export function registerCommentRoutes(app) {
  app.get('/api/tickets/:key/comments', (req, res) => {
    try {
      const comments = listComments(req.trellisPath, req.params.key.toUpperCase());
      res.json(comments);
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  });

  app.post('/api/tickets/:key/comments', (req, res) => {
    try {
      const comment = addComment(req.trellisPath, req.params.key.toUpperCase(), req.body);
      res.status(201).json(comment);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });
}
