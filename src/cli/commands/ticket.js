import chalk from 'chalk';
import Table from 'cli-table3';
import { requireProject, loadConfig, getStatuses } from '../../core/project.js';
import { createTicket, loadTicket, updateTicket, deleteTicket, listTickets } from '../../core/ticket.js';

const PRIORITY_COLORS = {
  Critical: 'red',
  High: 'yellow',
  Medium: 'cyan',
  Low: 'dim'
};

function colorPriority(p) {
  const color = PRIORITY_COLORS[p] || 'white';
  return chalk[color](p);
}

export function registerTicketCommand(program) {
  const ticket = program
    .command('ticket')
    .alias('t')
    .description('Manage tickets');

  // CREATE
  ticket
    .command('create')
    .alias('c')
    .description('Create a new ticket')
    .requiredOption('-s, --summary <summary>', 'Ticket summary')
    .option('-t, --type <type>', 'Ticket type', 'Task')
    .option('-p, --priority <priority>', 'Priority', 'Medium')
    .option('-a, --assignee <assignee>', 'Assignee')
    .option('-r, --reporter <reporter>', 'Reporter')
    .option('--status <status>', 'Initial status')
    .option('--points <points>', 'Story points', parseInt)
    .option('--size <size>', 'T-shirt size (XS, S, M, L, XL)')
    .option('--ac <criteria>', 'Acceptance criteria')
    .option('--description <desc>', 'Description')
    .option('--labels <labels>', 'Comma-separated labels')
    .option('--sprint <sprint>', 'Sprint ID')
    .option('--json', 'Output as JSON')
    .action((opts) => {
      try {
        const trellisPath = requireProject();
        const fields = { summary: opts.summary };

        if (opts.type) fields.type = opts.type;
        if (opts.priority) fields.priority = opts.priority;
        if (opts.assignee) fields.assignee = opts.assignee;
        if (opts.reporter) fields.reporter = opts.reporter;
        if (opts.status) fields.status = opts.status;
        if (opts.points != null) fields.points = opts.points;
        if (opts.size) fields.tshirtSize = opts.size;
        if (opts.ac) fields.acceptanceCriteria = opts.ac;
        if (opts.description) fields.description = opts.description;
        if (opts.labels) fields.labels = opts.labels.split(',').map(l => l.trim());
        if (opts.sprint) fields.sprint = opts.sprint;

        const ticket = createTicket(trellisPath, fields);

        if (opts.json) {
          console.log(JSON.stringify(ticket, null, 2));
        } else {
          console.log(chalk.green(`✓ Created ${chalk.bold(ticket.key)}`));
          console.log(`  ${ticket.summary}`);
          console.log(chalk.dim(`  ${ticket.type} | ${ticket.priority} | ${ticket.status}`));
        }
      } catch (err) {
        console.error(chalk.red(err.message));
        process.exit(1);
      }
    });

  // LIST
  ticket
    .command('list')
    .alias('ls')
    .description('List tickets')
    .option('-s, --status <status>', 'Filter by status')
    .option('-a, --assignee <assignee>', 'Filter by assignee')
    .option('-t, --type <type>', 'Filter by type')
    .option('-p, --priority <priority>', 'Filter by priority')
    .option('--sprint <sprint>', 'Filter by sprint')
    .option('--label <label>', 'Filter by label')
    .option('--json', 'Output as JSON')
    .action((opts) => {
      try {
        const trellisPath = requireProject();
        const tickets = listTickets(trellisPath, opts);

        if (opts.json) {
          console.log(JSON.stringify(tickets, null, 2));
          return;
        }

        if (tickets.length === 0) {
          console.log(chalk.dim('No tickets found.'));
          return;
        }

        const table = new Table({
          head: ['Key', 'Type', 'Priority', 'Status', 'Assignee', 'Summary'],
          style: { head: ['cyan'] },
          colWidths: [14, 10, 10, 16, 16, 40]
        });

        for (const t of tickets) {
          table.push([
            chalk.bold(t.key),
            t.type,
            colorPriority(t.priority),
            t.status,
            t.assignee || chalk.dim('unassigned'),
            t.summary.length > 38 ? t.summary.slice(0, 35) + '...' : t.summary
          ]);
        }

        console.log(table.toString());
        console.log(chalk.dim(`  ${tickets.length} ticket(s)`));
      } catch (err) {
        console.error(chalk.red(err.message));
        process.exit(1);
      }
    });

  // SHOW
  ticket
    .command('show <key>')
    .description('Show ticket details')
    .option('--json', 'Output as JSON')
    .action((key, opts) => {
      try {
        const trellisPath = requireProject();
        const t = loadTicket(trellisPath, key.toUpperCase());

        if (opts.json) {
          console.log(JSON.stringify(t, null, 2));
          return;
        }

        console.log();
        console.log(chalk.bold.cyan(t.key) + '  ' + colorPriority(t.priority));
        console.log(chalk.bold(t.summary));
        console.log();
        console.log(`  Type:       ${t.type}`);
        console.log(`  Status:     ${t.status}`);
        console.log(`  Assignee:   ${t.assignee || chalk.dim('unassigned')}`);
        console.log(`  Reporter:   ${t.reporter || chalk.dim('none')}`);
        if (t.points != null) console.log(`  Points:     ${t.points}`);
        if (t.tshirtSize) console.log(`  Size:       ${t.tshirtSize}`);
        if (t.sprint) console.log(`  Sprint:     ${t.sprint}`);
        if (t.labels && t.labels.length) console.log(`  Labels:     ${t.labels.join(', ')}`);
        console.log(`  Created:    ${t.created}`);
        console.log(`  Updated:    ${t.updated}`);

        if (t.description) {
          console.log();
          console.log(chalk.bold('  Description:'));
          console.log(`  ${t.description}`);
        }

        if (t.acceptanceCriteria) {
          console.log();
          console.log(chalk.bold('  Acceptance Criteria:'));
          console.log(`  ${t.acceptanceCriteria}`);
        }

        if (t.comments && t.comments.length) {
          console.log();
          console.log(chalk.bold(`  Comments (${t.comments.length}):`));
          for (const c of t.comments) {
            console.log(chalk.dim(`  ─── ${c.author} · ${c.created}`));
            console.log(`  ${c.body}`);
          }
        }
        console.log();
      } catch (err) {
        console.error(chalk.red(err.message));
        process.exit(1);
      }
    });

  // UPDATE
  ticket
    .command('update <key>')
    .alias('u')
    .description('Update a ticket')
    .option('-s, --summary <summary>', 'Summary')
    .option('-t, --type <type>', 'Type')
    .option('-p, --priority <priority>', 'Priority')
    .option('-a, --assignee <assignee>', 'Assignee')
    .option('-r, --reporter <reporter>', 'Reporter')
    .option('--status <status>', 'Status')
    .option('--points <points>', 'Story points', parseInt)
    .option('--size <size>', 'T-shirt size')
    .option('--ac <criteria>', 'Acceptance criteria')
    .option('--description <desc>', 'Description')
    .option('--labels <labels>', 'Comma-separated labels')
    .option('--sprint <sprint>', 'Sprint ID')
    .option('--json', 'Output as JSON')
    .allowUnknownOption(true)
    .action((key, opts) => {
      try {
        const trellisPath = requireProject();
        const fields = {};

        if (opts.summary) fields.summary = opts.summary;
        if (opts.type) fields.type = opts.type;
        if (opts.priority) fields.priority = opts.priority;
        if (opts.assignee) fields.assignee = opts.assignee;
        if (opts.reporter) fields.reporter = opts.reporter;
        if (opts.status) fields.status = opts.status;
        if (opts.points != null) fields.points = opts.points;
        if (opts.size) fields.tshirtSize = opts.size;
        if (opts.ac) fields.acceptanceCriteria = opts.ac;
        if (opts.description) fields.description = opts.description;
        if (opts.labels) fields.labels = opts.labels.split(',').map(l => l.trim());
        if (opts.sprint) fields.sprint = opts.sprint;

        const ticket = updateTicket(trellisPath, key.toUpperCase(), fields);

        if (opts.json) {
          console.log(JSON.stringify(ticket, null, 2));
        } else {
          console.log(chalk.green(`✓ Updated ${chalk.bold(ticket.key)}`));
        }
      } catch (err) {
        console.error(chalk.red(err.message));
        process.exit(1);
      }
    });

  // MOVE (shorthand for status update)
  ticket
    .command('move <key> <status>')
    .alias('mv')
    .description('Move a ticket to a new status')
    .action((key, status, opts) => {
      try {
        const trellisPath = requireProject();
        const config = loadConfig(trellisPath);
        const validStatuses = getStatuses(config);

        if (!validStatuses.includes(status)) {
          console.error(chalk.red(`Invalid status "${status}". Valid: ${validStatuses.join(', ')}`));
          process.exit(1);
        }

        const ticket = updateTicket(trellisPath, key.toUpperCase(), { status });
        const col = config.board.columns.find(c => c.id === status);
        console.log(chalk.green(`✓ ${chalk.bold(ticket.key)} → ${col?.name || status}`));
      } catch (err) {
        console.error(chalk.red(err.message));
        process.exit(1);
      }
    });

  // DELETE
  ticket
    .command('delete <key>')
    .alias('rm')
    .description('Delete a ticket')
    .option('-f, --force', 'Skip confirmation')
    .action(async (key, opts) => {
      try {
        const trellisPath = requireProject();
        const upperKey = key.toUpperCase();

        if (!opts.force) {
          const readline = await import('readline');
          const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
          const answer = await new Promise(resolve => {
            rl.question(chalk.yellow(`Delete ${upperKey}? (y/N) `), resolve);
          });
          rl.close();
          if (answer.toLowerCase() !== 'y') {
            console.log(chalk.dim('Cancelled.'));
            return;
          }
        }

        deleteTicket(trellisPath, upperKey);
        console.log(chalk.green(`✓ Deleted ${chalk.bold(upperKey)}`));
      } catch (err) {
        console.error(chalk.red(err.message));
        process.exit(1);
      }
    });
}
