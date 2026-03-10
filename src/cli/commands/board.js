import chalk from 'chalk';
import open from 'open';
import { requireProject, loadConfig } from '../../core/project.js';
import { startServer } from '../../server/index.js';

export function registerBoardCommand(program) {
  program
    .command('board')
    .alias('b')
    .description('Start the web server and open the board')
    .option('-p, --port <port>', 'Port number')
    .option('--no-open', 'Do not open browser')
    .action(async (opts) => {
      try {
        const trellisPath = requireProject();
        const config = loadConfig(trellisPath);
        const port = opts.port || config.server?.port || 4000;

        const server = startServer(trellisPath, port);

        server.on('listening', () => {
          const url = `http://localhost:${port}`;
          console.log(chalk.green(`✓ Trellis board running at ${chalk.bold(url)}`));
          console.log(chalk.dim('  Press Ctrl+C to stop'));

          if (opts.open !== false) {
            open(url);
          }
        });
      } catch (err) {
        console.error(chalk.red(err.message));
        process.exit(1);
      }
    });
}
