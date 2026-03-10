import chalk from 'chalk';
import Table from 'cli-table3';
import { requireProject } from '../../core/project.js';
import { createSprint, listSprints, addTicketToSprint, removeTicketFromSprint } from '../../core/sprint.js';
import { updateTicket } from '../../core/ticket.js';

export function registerSprintCommand(program) {
  const sprint = program
    .command('sprint')
    .alias('s')
    .description('Manage sprints');

  sprint
    .command('create')
    .description('Create a new sprint')
    .option('-n, --name <name>', 'Sprint name')
    .option('-g, --goal <goal>', 'Sprint goal')
    .option('--start <date>', 'Start date (YYYY-MM-DD)')
    .option('--end <date>', 'End date (YYYY-MM-DD)')
    .action((opts) => {
      try {
        const trellisPath = requireProject();
        const s = createSprint(trellisPath, {
          name: opts.name,
          goal: opts.goal,
          startDate: opts.start,
          endDate: opts.end
        });
        console.log(chalk.green(`✓ Created ${chalk.bold(s.id)}: ${s.name}`));
      } catch (err) {
        console.error(chalk.red(err.message));
        process.exit(1);
      }
    });

  sprint
    .command('list')
    .alias('ls')
    .description('List all sprints')
    .option('--json', 'Output as JSON')
    .action((opts) => {
      try {
        const trellisPath = requireProject();
        const sprints = listSprints(trellisPath);

        if (opts.json) {
          console.log(JSON.stringify(sprints, null, 2));
          return;
        }

        if (sprints.length === 0) {
          console.log(chalk.dim('No sprints.'));
          return;
        }

        const table = new Table({
          head: ['ID', 'Name', 'Start', 'End', 'Tickets'],
          style: { head: ['cyan'] }
        });

        for (const s of sprints) {
          table.push([
            s.id,
            s.name,
            s.startDate || chalk.dim('–'),
            s.endDate || chalk.dim('–'),
            s.ticketKeys.length
          ]);
        }

        console.log(table.toString());
      } catch (err) {
        console.error(chalk.red(err.message));
        process.exit(1);
      }
    });

  sprint
    .command('add <sprintId> <ticketKey>')
    .description('Add a ticket to a sprint')
    .action((sprintId, ticketKey, opts) => {
      try {
        const trellisPath = requireProject();
        const upperKey = ticketKey.toUpperCase();
        addTicketToSprint(trellisPath, sprintId, upperKey);
        updateTicket(trellisPath, upperKey, { sprint: sprintId });
        console.log(chalk.green(`✓ ${chalk.bold(upperKey)} added to ${sprintId}`));
      } catch (err) {
        console.error(chalk.red(err.message));
        process.exit(1);
      }
    });

  sprint
    .command('remove <sprintId> <ticketKey>')
    .description('Remove a ticket from a sprint')
    .action((sprintId, ticketKey, opts) => {
      try {
        const trellisPath = requireProject();
        const upperKey = ticketKey.toUpperCase();
        removeTicketFromSprint(trellisPath, sprintId, upperKey);
        updateTicket(trellisPath, upperKey, { sprint: null });
        console.log(chalk.green(`✓ ${chalk.bold(upperKey)} removed from ${sprintId}`));
      } catch (err) {
        console.error(chalk.red(err.message));
        process.exit(1);
      }
    });
}
