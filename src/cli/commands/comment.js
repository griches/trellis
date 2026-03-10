import chalk from 'chalk';
import { requireProject } from '../../core/project.js';
import { addComment, listComments } from '../../core/comment.js';

export function registerCommentCommand(program) {
  const comment = program
    .command('comment')
    .alias('c')
    .description('Manage ticket comments');

  comment
    .command('add <key>')
    .description('Add a comment to a ticket')
    .requiredOption('-b, --body <body>', 'Comment body')
    .option('-a, --author <author>', 'Author name')
    .action((key, opts) => {
      try {
        const trellisPath = requireProject();
        const c = addComment(trellisPath, key.toUpperCase(), {
          author: opts.author,
          body: opts.body
        });
        console.log(chalk.green(`✓ Comment added to ${chalk.bold(key.toUpperCase())}`));
        console.log(chalk.dim(`  ${c.author} · ${c.created}`));
      } catch (err) {
        console.error(chalk.red(err.message));
        process.exit(1);
      }
    });

  comment
    .command('list <key>')
    .alias('ls')
    .description('List comments for a ticket')
    .action((key) => {
      try {
        const trellisPath = requireProject();
        const comments = listComments(trellisPath, key.toUpperCase());

        if (comments.length === 0) {
          console.log(chalk.dim('No comments.'));
          return;
        }

        for (const c of comments) {
          console.log(chalk.dim(`── ${c.author} · ${c.created}`));
          console.log(`   ${c.body}`);
          console.log();
        }
      } catch (err) {
        console.error(chalk.red(err.message));
        process.exit(1);
      }
    });
}
