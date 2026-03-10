import path from 'path';
import chalk from 'chalk';
import open from 'open';
import { requireProject, loadConfig } from '../../core/project.js';
import { startServer } from '../../server/index.js';
import { startMultiServer } from '../../server/multi.js';

export function registerBoardCommand(program) {
  program
    .command('board [paths...]')
    .alias('b')
    .description('Start the web board (current project, or multiple paths)')
    .option('-p, --port <port>', 'Port number')
    .option('--no-open', 'Do not open browser')
    .action(async (paths, opts) => {
      try {
        if (paths && paths.length > 1) {
          // Multi-project mode
          const port = parseInt(opts.port) || 4000;
          const server = startMultiServer(paths, port);

          server.on('listening', () => {
            const url = `http://localhost:${port}`;
            console.log(chalk.green(`✓ Trellis serving ${chalk.bold(paths.length)} project(s) at ${chalk.bold(url)}`));
            for (const p of paths) {
              console.log(chalk.dim(`  → ${p}`));
            }
            console.log(chalk.dim('  Press Ctrl+C to stop'));

            if (opts.open !== false) {
              open(url);
            }
          });
        } else {
          // Single-project mode (current dir or single path)
          const trellisPath = paths && paths.length === 1
            ? path.join(paths[0], '.trellis')
            : requireProject();
          const config = loadConfig(trellisPath);
          const port = parseInt(opts.port) || config.server?.port || 4000;

          const server = startServer(trellisPath, port);

          server.on('listening', () => {
            const url = `http://localhost:${port}`;
            console.log(chalk.green(`✓ Trellis board running at ${chalk.bold(url)}`));
            console.log(chalk.dim('  Press Ctrl+C to stop'));

            if (opts.open !== false) {
              open(url);
            }
          });
        }
      } catch (err) {
        console.error(chalk.red(err.message));
        process.exit(1);
      }
    });
}
