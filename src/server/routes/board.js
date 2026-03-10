import { loadConfig, saveConfig } from '../../core/project.js';

export function registerBoardRoutes(app) {
  app.get('/api/config', (req, res) => {
    try {
      const config = loadConfig(req.trellisPath);
      res.json(config);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/config', (req, res) => {
    try {
      const config = loadConfig(req.trellisPath);
      Object.assign(config, req.body);
      saveConfig(req.trellisPath, config);
      res.json(config);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
}
