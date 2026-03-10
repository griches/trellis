import { requireProject, loadConfig } from '../../core/project.js';
import { listTickets } from '../../core/ticket.js';
import { listSprints } from '../../core/sprint.js';

export function registerDataCommand(program) {
  program
    .command('data')
    .alias('d')
    .description('Output board data as JSON for external consumers')
    .option('-p, --path <path>', 'Path to a Trellis project (defaults to current directory)')
    .option('--tickets-only', 'Only output tickets')
    .option('--config-only', 'Only output board config')
    .option('-s, --status <status>', 'Filter tickets by status')
    .option('--sprint <sprint>', 'Filter tickets by sprint')
    .option('--compact', 'Minimal output (no sprints)')
    .action((opts) => {
      try {
        const trellisPath = requireProject(opts.path);
        const config = loadConfig(trellisPath);

        if (opts.configOnly) {
          console.log(JSON.stringify(config, null, 2));
          return;
        }

        const filters = {};
        if (opts.status) filters.status = opts.status;
        if (opts.sprint) filters.sprint = opts.sprint;

        const tickets = listTickets(trellisPath, filters);

        if (opts.ticketsOnly) {
          console.log(JSON.stringify(tickets, null, 2));
          return;
        }

        const output = {
          project: config.project,
          board: config.board,
          fields: config.fields,
          tickets,
        };

        if (!opts.compact) {
          output.sprints = listSprints(trellisPath);
        }

        console.log(JSON.stringify(output, null, 2));
      } catch (err) {
        console.error(JSON.stringify({ error: err.message }));
        process.exit(1);
      }
    });
}
