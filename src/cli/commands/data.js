import { requireProject, loadConfig } from '../../core/project.js';
import { listTickets } from '../../core/ticket.js';
import { listSprints } from '../../core/sprint.js';

function buildBoardData(trellisPath, opts) {
  const config = loadConfig(trellisPath);

  if (opts.configOnly) return config;

  const filters = {};
  if (opts.status) filters.status = opts.status;
  if (opts.sprint) filters.sprint = opts.sprint;

  const tickets = listTickets(trellisPath, filters);

  if (opts.ticketsOnly) return tickets;

  const output = {
    project: config.project,
    board: config.board,
    fields: config.fields,
    tickets,
  };

  if (!opts.compact) {
    output.sprints = listSprints(trellisPath);
  }

  return output;
}

export function registerDataCommand(program) {
  program
    .command('data')
    .alias('d')
    .description('Output board data as JSON for external consumers')
    .option('-p, --path <paths...>', 'Path(s) to Trellis project(s) (defaults to current directory)')
    .option('--tickets-only', 'Only output tickets')
    .option('--config-only', 'Only output board config')
    .option('-s, --status <status>', 'Filter tickets by status')
    .option('--sprint <sprint>', 'Filter tickets by sprint')
    .option('--compact', 'Minimal output (no sprints)')
    .action((opts) => {
      try {
        const paths = opts.path || [undefined];

        if (paths.length === 1) {
          const trellisPath = requireProject(paths[0]);
          console.log(JSON.stringify(buildBoardData(trellisPath, opts), null, 2));
        } else {
          const boards = paths.map(p => {
            const trellisPath = requireProject(p);
            return buildBoardData(trellisPath, opts);
          });
          console.log(JSON.stringify(boards, null, 2));
        }
      } catch (err) {
        console.error(JSON.stringify({ error: err.message }));
        process.exit(1);
      }
    });
}
