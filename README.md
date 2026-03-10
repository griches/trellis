# Trellis

Local-first project boards backed by flat files.

Trellis is a lightweight, self-hosted alternative to Jira that runs entirely on your machine. It stores everything as JSON files in a `.trellis/` directory alongside your project — no database, no cloud, no account required.

Manage tickets from the CLI or through a web-based Kanban board.

## Quick Start

```bash
# Install globally
npm install -g trellis-pm

# Initialize a project
cd your-project
trellis init MYAPP --name "My Application"

# Create some tickets
trellis ticket create -s "Fix login redirect loop" -t Bug -p High -a gary
trellis ticket create -s "Add dark mode toggle" -t Story --points 5 --size M

# Open the board
trellis board
```

## CLI Reference

### Project

```bash
trellis init <KEY> [--name "Project Name"]
```

Initializes a `.trellis/` directory in the current folder with default board configuration.

### Tickets

```bash
# Create
trellis ticket create -s "Summary" [options]
  -t, --type <type>         Bug, Task, Story, Epic, Spike
  -p, --priority <priority> Critical, High, Medium, Low
  -a, --assignee <name>     Assignee
  -r, --reporter <name>     Reporter
  --status <status>         Initial status (matches board column IDs)
  --points <n>              Story points
  --size <size>             T-shirt size (XS, S, M, L, XL)
  --ac <criteria>           Acceptance criteria
  --description <desc>      Description
  --labels <a,b,c>          Comma-separated labels
  --sprint <id>             Sprint ID

# List & filter
trellis ticket list [--status todo] [--assignee gary] [--type Bug] [--priority High]

# Show detail
trellis ticket show <KEY>

# Update any field
trellis ticket update <KEY> --priority Critical --points 8

# Move to a status
trellis ticket move <KEY> in-progress

# Archive a completed ticket
trellis ticket archive <KEY>

# Delete
trellis ticket delete <KEY> [-f]
```

All commands support `--json` for machine-readable output.

### Comments

```bash
trellis comment add <KEY> -b "Comment text" [-a author]
trellis comment list <KEY>
```

### Sprints

```bash
trellis sprint create --name "Sprint 1" [--start 2025-01-01] [--end 2025-01-14]
trellis sprint list
trellis sprint add <sprint-id> <TICKET-KEY>
trellis sprint remove <sprint-id> <TICKET-KEY>
```

### Board

```bash
trellis board [--port 4000] [--no-open]
```

Starts a local web server and opens the Kanban board in your browser.

### Data Export

```bash
# Full board data (config + tickets + sprints) as JSON
trellis data

# Point at a remote project directory
trellis data --path /path/to/other/project

# Just tickets or just config
trellis data --tickets-only
trellis data --config-only

# Filter
trellis data --status in-progress
trellis data --sprint sprint-1

# Compact (no sprints)
trellis data --compact
```

Outputs everything needed to render a board as JSON. Use this to feed data into other services, aggregate multiple projects into a single dashboard, or build custom integrations.

Pass multiple paths to get an array of boards:

```bash
trellis data --path ./project-a ./project-b
```

### Multi-Project Server

```bash
trellis serve ./project-a ./project-b [--port 4000] [--no-open]
```

Serves multiple Trellis projects as a single web UI with a project switcher in the header. Each project keeps its own config, columns, and tickets — click between them to switch boards.

### Configuration

```bash
trellis config get                    # Show full config
trellis config get board.columns      # Dot notation
trellis config set server.port 3000   # Set a value
```

## Web UI

The board has three views:

- **Board** — Kanban columns with drag-and-drop. Columns are driven by your project config, not hardcoded.
- **Backlog** — Table view of tickets in columns marked `isBacklog: true`. Only tickets explicitly in a backlog status appear here — board tickets stay on the board.
- **Archive** — Table view of completed tickets moved to columns marked `isArchive: true`. Use this to keep finished work out of the board without deleting it.

Click any ticket to edit all fields inline — summary, status, priority, type, assignee, points, size, description, acceptance criteria, and labels. Hit Save to persist changes. Add and delete comments from the same view. Create new tickets from the header.

## Data Storage

Everything lives in `.trellis/` inside your project directory:

```
.trellis/
  config.json          # Board columns, field options, server settings
  counter.json         # Auto-incrementing ticket number
  tickets/
    MYAPP-1.json       # One file per ticket
    MYAPP-2.json
  sprints/
    sprint-1.json
```

Each ticket is a standalone JSON file. This means:

- **No migrations** — adding new fields to Trellis automatically gives old tickets sensible defaults
- **Git-friendly** — track your tickets alongside your code, or `.gitignore` them
- **No conflicts** — one file per ticket means clean merges

## Board Configuration

Columns are fully configurable per project. Edit `.trellis/config.json` or use the CLI:

```bash
trellis config set board.columns '[
  {"id":"backlog","name":"Backlog","isBacklog":true},
  {"id":"todo","name":"To Do"},
  {"id":"in-progress","name":"In Progress"},
  {"id":"review","name":"Code Review"},
  {"id":"qa","name":"QA"},
  {"id":"done","name":"Done","isDone":true},
  {"id":"archived","name":"Archived","isArchive":true}
]'
```

The `isBacklog` flag puts a column in the Backlog tab instead of the Board. The `isDone` flag marks completion columns. The `isArchive` flag creates an Archive tab for finished tickets.

## Aliases

The CLI is available as both `trellis` and `trl`. Subcommands have short aliases too:

| Command | Alias |
|---------|-------|
| `trellis ticket` | `trl t` |
| `trellis ticket create` | `trl t c` |
| `trellis ticket list` | `trl t ls` |
| `trellis ticket move` | `trl t mv` |
| `trellis ticket delete` | `trl t rm` |
| `trellis comment` | `trl c` |
| `trellis sprint` | `trl s` |
| `trellis board` | `trl b` |
| `trellis data` | `trl d` |
| `trellis serve` | – |

## License

MIT
