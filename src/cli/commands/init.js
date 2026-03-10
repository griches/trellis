import chalk from 'chalk';
import { initProject } from '../../core/project.js';

export function registerInitCommand(program) {
  program
    .command('init <key>')
    .description('Initialize a new Trellis project in the current directory')
    .option('-n, --name <name>', 'Project display name')
    .action((key, opts) => {
      try {
        const trellisPath = initProject(process.cwd(), key, opts.name);
        console.log(chalk.green(`✓ Trellis project "${key.toUpperCase()}" initialized`));
        console.log(chalk.dim(`  Data stored in ${trellisPath}`));
      } catch (err) {
        console.error(chalk.red(err.message));
        process.exit(1);
      }
    });
}
