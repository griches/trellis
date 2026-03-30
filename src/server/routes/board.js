import { loadConfig, saveConfig, detectProjectVersion } from '../../core/project.js';

export function registerBoardRoutes(app) {
  app.get('/api/config', (req, res) => {
    try {
      const config = loadConfig(req.trellisPath);
      res.json(config);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/project-version', (req, res) => {
    try {
      const version = detectProjectVersion(req.trellisPath);
      res.json({ version });
    } catch (err) {
      res.json({ version: null });
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
