import chalk from 'chalk';
import { requireProject, loadConfig, saveConfig } from '../../core/project.js';

function getNestedValue(obj, keyPath) {
  const keys = keyPath.split('.');
  let val = obj;
  for (const k of keys) {
    if (val == null || typeof val !== 'object') return undefined;
    val = val[k];
  }
  return val;
}

function setNestedValue(obj, keyPath, value) {
  const keys = keyPath.split('.');
  let target = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (target[keys[i]] == null || typeof target[keys[i]] !== 'object') {
      target[keys[i]] = {};
    }
    target = target[keys[i]];
  }
  target[keys[keys.length - 1]] = value;
}

export function registerConfigCommand(program) {
  const config = program
    .command('config')
    .description('View or modify project configuration');

  config
    .command('get [key]')
    .description('Get a config value (dot notation, e.g. board.columns)')
    .action((key) => {
      try {
        const trellisPath = requireProject();
        const cfg = loadConfig(trellisPath);

        if (!key) {
          console.log(JSON.stringify(cfg, null, 2));
          return;
        }

        const val = getNestedValue(cfg, key);
        if (val === undefined) {
          console.error(chalk.red(`Key "${key}" not found`));
          process.exit(1);
        }

        if (typeof val === 'object') {
          console.log(JSON.stringify(val, null, 2));
        } else {
          console.log(val);
        }
      } catch (err) {
        console.error(chalk.red(err.message));
        process.exit(1);
      }
    });

  config
    .command('set <key> <value>')
    .description('Set a config value (dot notation). JSON values are parsed automatically.')
    .action((key, value) => {
      try {
        const trellisPath = requireProject();
        const cfg = loadConfig(trellisPath);

        // Try parsing as JSON first (for arrays, objects, numbers, booleans)
        let parsed;
        try {
          parsed = JSON.parse(value);
        } catch {
          parsed = value; // treat as string
        }

        setNestedValue(cfg, key, parsed);
        saveConfig(trellisPath, cfg);
        console.log(chalk.green(`✓ ${key} updated`));
      } catch (err) {
        console.error(chalk.red(err.message));
        process.exit(1);
      }
    });
}
