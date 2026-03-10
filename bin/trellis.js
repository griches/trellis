#!/usr/bin/env node

import { program } from 'commander';
import { registerInitCommand } from '../src/cli/commands/init.js';
import { registerTicketCommand } from '../src/cli/commands/ticket.js';
import { registerCommentCommand } from '../src/cli/commands/comment.js';
import { registerBoardCommand } from '../src/cli/commands/board.js';
import { registerSprintCommand } from '../src/cli/commands/sprint.js';
import { registerConfigCommand } from '../src/cli/commands/config.js';
import { registerDataCommand } from '../src/cli/commands/data.js';

program
  .name('trellis')
  .description('Local-first project boards backed by flat files')
  .version('0.1.0');

registerInitCommand(program);
registerTicketCommand(program);
registerCommentCommand(program);
registerBoardCommand(program);
registerSprintCommand(program);
registerConfigCommand(program);
registerDataCommand(program);

program.parse();
