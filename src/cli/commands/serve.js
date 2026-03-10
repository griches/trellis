import chalk from 'chalk';
import open from 'open';
import { startMultiServer } from '../../server/multi.js';

export function registerServeCommand(program) {
  program
    .command('serve')
    .description('Serve multiple Trellis projects as a single web UI')
    .argument('<paths...>', 'Paths to Trellis project directories')
    .option('-p, --port <port>', 'Port number', '4000')
    .option('--no-open', 'Do not open browser')
    .action(async (paths, opts) => {
      try {
        const port = parseInt(opts.port);
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
      } catch (err) {
        console.error(chalk.red(err.message));
        process.exit(1);
      }
    });
}
