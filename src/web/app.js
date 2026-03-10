let config = null;
let tickets = [];

// ── API ──

async function api(path, opts = {}) {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
    body: opts.body ? JSON.stringify(opts.body) : undefined
  });
  if (!res.ok) throw new Error((await res.json()).error || res.statusText);
  return res.json();
}

async function loadData() {
  [config, tickets] = await Promise.all([
    api('/config'),
    api('/tickets')
  ]);
}

// ── Tabs ──

document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(`${tab.dataset.tab}-view`).classList.add('active');
  });
});

// ── Board ──

function renderBoard() {
  const boardEl = document.getElementById('board');
  boardEl.innerHTML = '';

  // Filter out backlog columns for the board view
  const boardColumns = config.board.columns.filter(c => !c.isBacklog);

  for (const col of boardColumns) {
    const colTickets = tickets.filter(t => t.status === col.id);

    const colEl = document.createElement('div');
    colEl.className = 'column';
    colEl.innerHTML = `
      <div class="column-header">
        <h3>${col.name}</h3>
        <span class="column-count">${colTickets.length}</span>
      </div>
    `;

    const body = document.createElement('div');
    body.className = 'column-body';
    body.dataset.status = col.id;

    // Drop zone events
    body.addEventListener('dragover', e => {
      e.preventDefault();
      body.classList.add('drag-over');
    });
    body.addEventListener('dragleave', () => {
      body.classList.remove('drag-over');
    });
    body.addEventListener('drop', async e => {
      e.preventDefault();
      body.classList.remove('drag-over');
      const key = e.dataTransfer.getData('text/plain');
      if (key) {
        await api(`/tickets/${key}`, { method: 'PUT', body: { status: col.id } });
        await refresh();
      }
    });

    for (const t of colTickets) {
      body.appendChild(createCard(t));
    }

    colEl.appendChild(body);

    // Add button
    const addBtn = document.createElement('button');
    addBtn.className = 'column-add';
    addBtn.textContent = '+ Add ticket';
    addBtn.addEventListener('click', () => openCreateModal(col.id));
    colEl.appendChild(addBtn);

    boardEl.appendChild(colEl);
  }
}

function createCard(ticket) {
  const card = document.createElement('div');
  card.className = 'card';
  card.draggable = true;
  card.dataset.key = ticket.key;

  card.addEventListener('dragstart', e => {
    e.dataTransfer.setData('text/plain', ticket.key);
    card.classList.add('dragging');
  });
  card.addEventListener('dragend', () => {
    card.classList.remove('dragging');
  });
  card.addEventListener('click', () => openTicketModal(ticket.key));

  let metaRight = '';
  if (ticket.points != null) {
    metaRight += `<span class="card-points">${ticket.points}pt</span>`;
  }
  if (ticket.assignee) {
    metaRight += `<span class="card-assignee">${ticket.assignee}</span>`;
  }

  let labelsHtml = '';
  if (ticket.labels && ticket.labels.length) {
    labelsHtml = `<div class="card-labels">${ticket.labels.map(l => `<span class="card-label">${l}</span>`).join('')}</div>`;
  }

  card.innerHTML = `
    <div class="card-header">
      <span class="card-key">${ticket.key}</span>
      <span class="card-priority priority-${ticket.priority}">${ticket.priority}</span>
    </div>
    <div class="card-summary">${escapeHtml(ticket.summary)}</div>
    <div class="card-meta">
      <span class="card-type">${ticket.type}</span>
      <div style="display:flex;gap:4px;align-items:center">${metaRight}</div>
    </div>
    ${labelsHtml}
  `;

  return card;
}

// ── Backlog ──

function renderBacklog() {
  const backlogEl = document.getElementById('backlog');

  const backlogColIds = config.board.columns.filter(c => c.isBacklog).map(c => c.id);
  const backlogTickets = tickets.filter(t => backlogColIds.includes(t.status) || !t.sprint);
  const sprintTickets = tickets.filter(t => !backlogColIds.includes(t.status) && t.sprint);

  backlogEl.innerHTML = `
    <div class="backlog-header">
      <h2>Backlog <span style="color:var(--text-muted);font-weight:400">(${backlogTickets.length})</span></h2>
      <button class="btn-create" id="backlogCreateBtn">+ Create Ticket</button>
    </div>
    ${renderTicketTable(backlogTickets)}
    ${sprintTickets.length ? `
      <div class="backlog-header" style="margin-top:32px">
        <h2>Sprint Tickets <span style="color:var(--text-muted);font-weight:400">(${sprintTickets.length})</span></h2>
      </div>
      ${renderTicketTable(sprintTickets)}
    ` : ''}
  `;

  document.getElementById('backlogCreateBtn')?.addEventListener('click', () => openCreateModal('backlog'));
}

function renderTicketTable(ticketList) {
  if (ticketList.length === 0) {
    return `<p style="color:var(--text-muted);padding:20px 0;text-align:center">No tickets</p>`;
  }

  const colMap = Object.fromEntries(config.board.columns.map(c => [c.id, c.name]));

  return `
    <table class="backlog-table">
      <thead>
        <tr>
          <th>Key</th>
          <th>Type</th>
          <th>Priority</th>
          <th>Summary</th>
          <th>Status</th>
          <th>Assignee</th>
          <th>Pts</th>
        </tr>
      </thead>
      <tbody>
        ${ticketList.map(t => `
          <tr data-key="${t.key}">
            <td class="key-cell">${t.key}</td>
            <td>${t.type}</td>
            <td><span class="card-priority priority-${t.priority}">${t.priority}</span></td>
            <td class="summary-cell">${escapeHtml(t.summary)}</td>
            <td class="status-cell"><span class="status-badge">${colMap[t.status] || t.status}</span></td>
            <td>${t.assignee || '<span style="color:var(--text-muted)">–</span>'}</td>
            <td>${t.points != null ? t.points : '<span style="color:var(--text-muted)">–</span>'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

// ── Ticket Detail Modal ──

async function openTicketModal(key) {
  const ticket = await api(`/tickets/${key}`);
  const overlay = document.getElementById('modalOverlay');
  const colMap = Object.fromEntries(config.board.columns.map(c => [c.id, c.name]));

  document.getElementById('modalKey').textContent = ticket.key;
  document.getElementById('modalType').textContent = ticket.type;
  const priorityEl = document.getElementById('modalPriority');
  priorityEl.textContent = ticket.priority;
  priorityEl.className = `modal-priority priority-${ticket.priority}`;

  const body = document.getElementById('modalBody');
  body.innerHTML = `
    <h3>${escapeHtml(ticket.summary)}</h3>

    <div class="detail-grid">
      <div class="detail-item">
        <span class="detail-label">Status</span>
        <select class="detail-value" id="detailStatus">
          ${config.board.columns.map(c => `<option value="${c.id}" ${c.id === ticket.status ? 'selected' : ''}>${c.name}</option>`).join('')}
        </select>
      </div>
      <div class="detail-item">
        <span class="detail-label">Assignee</span>
        <span class="detail-value ${ticket.assignee ? '' : 'empty'}">${ticket.assignee || 'Unassigned'}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Reporter</span>
        <span class="detail-value ${ticket.reporter ? '' : 'empty'}">${ticket.reporter || 'None'}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Priority</span>
        <span class="detail-value">${ticket.priority}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Story Points</span>
        <span class="detail-value ${ticket.points != null ? '' : 'empty'}">${ticket.points != null ? ticket.points : 'None'}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">T-Shirt Size</span>
        <span class="detail-value ${ticket.tshirtSize ? '' : 'empty'}">${ticket.tshirtSize || 'None'}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Sprint</span>
        <span class="detail-value ${ticket.sprint ? '' : 'empty'}">${ticket.sprint || 'None'}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Labels</span>
        <span class="detail-value ${ticket.labels?.length ? '' : 'empty'}">${ticket.labels?.length ? ticket.labels.join(', ') : 'None'}</span>
      </div>
    </div>

    ${ticket.description ? `
      <div class="detail-section">
        <h4>Description</h4>
        <p>${escapeHtml(ticket.description)}</p>
      </div>
    ` : ''}

    ${ticket.acceptanceCriteria ? `
      <div class="detail-section">
        <h4>Acceptance Criteria</h4>
        <pre>${escapeHtml(ticket.acceptanceCriteria)}</pre>
      </div>
    ` : ''}

    <div class="detail-section">
      <h4>Comments (${ticket.comments?.length || 0})</h4>
      <div class="comments-list">
        ${(ticket.comments || []).map(c => `
          <div class="comment-item">
            <div class="comment-meta">${escapeHtml(c.author)} &middot; ${new Date(c.created).toLocaleString()}</div>
            <div class="comment-body">${escapeHtml(c.body)}</div>
          </div>
        `).join('')}
      </div>
      <div class="comment-form">
        <input type="text" id="commentInput" placeholder="Add a comment...">
        <button id="commentSubmit">Comment</button>
      </div>
    </div>

    <div style="margin-top:16px;padding-top:12px;border-top:1px solid var(--border);font-size:11px;color:var(--text-muted)">
      Created: ${new Date(ticket.created).toLocaleString()} &middot; Updated: ${new Date(ticket.updated).toLocaleString()}
    </div>
  `;

  // Status change handler
  document.getElementById('detailStatus').addEventListener('change', async (e) => {
    await api(`/tickets/${ticket.key}`, { method: 'PUT', body: { status: e.target.value } });
    await refresh();
  });

  // Comment handler
  document.getElementById('commentSubmit').addEventListener('click', async () => {
    const input = document.getElementById('commentInput');
    const body = input.value.trim();
    if (!body) return;
    await api(`/tickets/${ticket.key}/comments`, { method: 'POST', body: { body, author: 'me' } });
    input.value = '';
    openTicketModal(ticket.key); // re-render
  });

  document.getElementById('commentInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('commentSubmit').click();
  });

  overlay.classList.add('open');
}

// Close modal
document.getElementById('modalClose').addEventListener('click', () => {
  document.getElementById('modalOverlay').classList.remove('open');
});
document.getElementById('modalOverlay').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) e.currentTarget.classList.remove('open');
});

// ── Create Modal ──

function openCreateModal(defaultStatus = 'backlog') {
  const overlay = document.getElementById('createOverlay');

  // Populate selects
  const typeSelect = document.getElementById('createType');
  typeSelect.innerHTML = config.fields.types.map(t => `<option>${t}</option>`).join('');

  const prioritySelect = document.getElementById('createPriority');
  prioritySelect.innerHTML = config.fields.priorities.map(p => `<option>${p}</option>`).join('');
  prioritySelect.value = 'Medium';

  const statusSelect = document.getElementById('createStatus');
  statusSelect.innerHTML = config.board.columns.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  statusSelect.value = defaultStatus;

  const pointsSelect = document.getElementById('createPoints');
  pointsSelect.innerHTML = '<option value="">–</option>' +
    (config.fields.pointScale || []).map(p => `<option value="${p}">${p}</option>`).join('');

  const sizeSelect = document.getElementById('createSize');
  sizeSelect.innerHTML = '<option value="">–</option>' +
    (config.fields.tshirtSizes || []).map(s => `<option value="${s}">${s}</option>`).join('');

  // Reset form
  document.getElementById('createForm').reset();
  statusSelect.value = defaultStatus;
  prioritySelect.value = 'Medium';

  overlay.classList.add('open');
}

document.getElementById('createForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const data = {
    summary: form.summary.value,
    type: form.type.value,
    priority: form.priority.value,
    status: form.status.value,
    assignee: form.assignee.value || '',
    description: form.description.value || '',
    acceptanceCriteria: form.acceptanceCriteria.value || '',
  };

  if (form.points.value) data.points = parseInt(form.points.value);
  if (form.tshirtSize.value) data.tshirtSize = form.tshirtSize.value;
  if (form.labels.value) data.labels = form.labels.value.split(',').map(l => l.trim()).filter(Boolean);

  await api('/tickets', { method: 'POST', body: data });
  document.getElementById('createOverlay').classList.remove('open');
  await refresh();
});

document.getElementById('createClose').addEventListener('click', () => {
  document.getElementById('createOverlay').classList.remove('open');
});
document.getElementById('createCancel').addEventListener('click', () => {
  document.getElementById('createOverlay').classList.remove('open');
});
document.getElementById('createOverlay').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) e.currentTarget.classList.remove('open');
});

// ── Backlog row click ──

document.addEventListener('click', (e) => {
  const row = e.target.closest('.backlog-table tbody tr');
  if (row) openTicketModal(row.dataset.key);
});

// ── Helpers ──

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── Init ──

async function refresh() {
  await loadData();
  document.getElementById('projectName').textContent = config.project.name;
  document.title = `${config.project.name} – Trellis`;
  renderBoard();
  renderBacklog();
}

refresh();
