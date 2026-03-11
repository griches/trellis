import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import { requireProject, loadConfig } from '../../core/project.js';
import { listTickets } from '../../core/ticket.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function registerPublishCommand(program) {
  program
    .command('publish [outDir]')
    .description('Generate a static board for GitHub Pages hosting')
    .option('--no-html', 'Only output data.json, skip the HTML file')
    .action((outDir, opts) => {
      try {
        const trellisPath = requireProject();
        const config = loadConfig(trellisPath);
        const dest = outDir ? path.resolve(outDir) : path.join(process.cwd(), 'docs');

        // Require auth.password
        const password = config.auth?.password;
        if (!password) {
          console.error(chalk.red('No auth.password set in .trellis/config.json'));
          console.error(chalk.dim('Add: { "auth": { "password": "your-password" } }'));
          process.exit(1);
        }

        const passwordHash = crypto.createHash('sha256').update(password).digest('hex');

        // Load all tickets with defaults
        const tickets = listTickets(trellisPath, {});

        // Sort by priority then key
        const priorityWeight = { Critical: 0, High: 1, Medium: 2, Low: 3 };
        tickets.sort((a, b) => {
          const pa = priorityWeight[a.priority] ?? 99;
          const pb = priorityWeight[b.priority] ?? 99;
          if (pa !== pb) return pa - pb;
          return a.key.localeCompare(b.key);
        });

        // Build data — exclude auth and server sections
        const data = {
          project: config.project,
          board: config.board,
          fields: config.fields,
          tickets,
          passwordHash
        };

        fs.mkdirSync(dest, { recursive: true });

        // Write data.json
        const dataPath = path.join(dest, 'data.json');
        fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
        console.log(chalk.green(`✓ ${chalk.bold('data.json')} → ${dataPath}`));

        // Copy static board HTML
        if (opts.html !== false) {
          const boardHtml = path.join(__dirname, '..', '..', 'static', 'board.html');
          const htmlDest = path.join(dest, 'index.html');
          fs.copyFileSync(boardHtml, htmlDest);
          console.log(chalk.green(`✓ ${chalk.bold('index.html')} → ${htmlDest}`));
        }

        console.log();
        console.log(chalk.dim('To preview locally:'));
        console.log(chalk.dim(`  cd ${dest} && python3 -m http.server 4000`));
        console.log();
        console.log(chalk.dim('To deploy to GitHub Pages:'));
        console.log(chalk.dim('  git add docs/ && git commit -m "Update board" && git push'));
      } catch (err) {
        console.error(chalk.red(err.message));
        process.exit(1);
      }
    });
}
