const views = document.querySelectorAll('.page-view');
const pageLabel = document.querySelector('#page-label');
const labels = { overview: 'Обзор', tasks: 'Поручения', agenda: 'Повестка', protocols: 'Сводные протоколы', media: 'Медиа-мастерская', analytics: 'Аналитика' };
const councils = { ntr: 'Совет по НТР', ssp: 'Совет по ССП', dnc: 'Совет по ДНЦ' };
const councilAgendaDocuments = {
  ntr: { shortName: 'НТР', source: 'Исходный файл НТР.docx' },
  ssp: { shortName: 'ССП', source: 'Исходная форма ССП.docx' },
  dnc: { shortName: 'ДНЦ', source: 'Исходный файл ДНЦ.docx' }
};
const councilOfficers = {
  dnc: { chair: 'Глава ЛНР', secretary: 'Министр культуры ЛНР' },
  ntr: { chair: 'Глава ЛНР', secretary: 'Заместитель министра образования и науки ЛНР' },
  ssp: { chair: 'Председатель Правительства ЛНР', secretary: 'Представитель министерства образования и науки ЛНР' }
};
document.querySelector('.activity-panel .panel-head h2').textContent = 'Лента решений';
let activeAgenda = 'ntr';
let activeProtocol = 'ntr';

function showView(view) {
  if (!labels[view]) return;
  views.forEach(item => item.classList.toggle('active', item.id === `${view}-view`));
  document.querySelectorAll('.main-nav .nav-item').forEach(item => item.classList.toggle('active', item.dataset.view === view));
  pageLabel.textContent = labels[view];
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
document.querySelectorAll('[data-view]').forEach(item => item.addEventListener('click', () => showView(item.dataset.view)));

function load(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? fallback;
  } catch {
    return fallback;
  }
}
const storedProposals = load('kontur-proposals-v1', []);
const proposals = Array.isArray(storedProposals) ? storedProposals : [];
const storedMeetings = load('kontur-meetings-v1', {});
const meetings = storedMeetings && typeof storedMeetings === 'object' && !Array.isArray(storedMeetings) ? storedMeetings : {};
function save() {
  try {
    localStorage.setItem('kontur-proposals-v1', JSON.stringify(proposals));
    localStorage.setItem('kontur-meetings-v1', JSON.stringify(meetings));
    return true;
  } catch {
    alert('Не удалось сохранить данные в этом браузере. Проверьте настройки локального хранилища.');
    return false;
  }
}

function renderTabs(containerId, selected, onSelect) {
  const container = document.getElementById(containerId);
  container.replaceChildren();
  Object.entries(councils).forEach(([key, name]) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `council-tab${selected === key ? ' active' : ''}`;
    button.textContent = name;
    button.setAttribute('aria-pressed', String(selected === key));
    button.addEventListener('click', () => onSelect(key));
    container.append(button);
  });
}

function renderAgenda() {
  renderTabs('agenda-tabs', activeAgenda, council => {
    activeAgenda = council;
    renderAgenda();
  });
  document.getElementById('proposal-council').value = activeAgenda;
  document.getElementById('agenda-title').textContent = `Предложения: ${councils[activeAgenda]}`;
  const agendaDocument = councilAgendaDocuments[activeAgenda];
  const sourceAgenda = document.getElementById('source-agenda');
  sourceAgenda.href = agendaDocument.source;
  sourceAgenda.download = agendaDocument.source;
  sourceAgenda.textContent = `Исходная форма ${agendaDocument.shortName} DOCX`;
  document.getElementById('download-agenda').textContent = `Скачать повестку ${agendaDocument.shortName}`;
  document.getElementById('agenda-count').textContent = proposals.length;
  renderAgendaDocument();
  const list = document.getElementById('proposals-list');
  list.replaceChildren();
  const items = proposals.filter(item => item.council === activeAgenda).slice().reverse();
  if (!items.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = 'Пока нет предложений. Заполните форму, чтобы предложить первый вопрос для этого Совета.';
    list.append(empty);
    return;
  }
  items.forEach(item => {
    const card = document.createElement('article');
    card.className = 'proposal-card';
    const meta = document.createElement('div');
    meta.className = 'proposal-meta';
    meta.textContent = `${item.ministry} · ${item.author} · ${new Date(item.created).toLocaleDateString('ru-RU')}`;
    const title = document.createElement('h3');
    title.textContent = item.title;
    const reason = document.createElement('p');
    reason.textContent = item.reason;
    const presenter = document.createElement('p');
    presenter.textContent = `Докладчик: ${item.presenter || item.author} · ${item.reportTime || 'время уточняется'}`;
    const decision = document.createElement('p');
    decision.className = 'proposal-decision';
    decision.textContent = `В проект резолюции: ${item.decision}`;
    const implementation = document.createElement('p');
    implementation.className = 'proposal-implementation';
    implementation.textContent = `Срок: ${item.deadline || 'не указан'} · Ответственные: ${item.responsible || 'не указаны'}`;
    const status = document.createElement('span');
    status.className = `status-pill ${item.included ? 'green' : 'amber'}`;
    status.textContent = item.included ? 'В повестке' : 'На рассмотрении';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'outline-button';
    button.textContent = item.included ? 'Исключить из документов' : 'Вернуть в документы';
    button.addEventListener('click', () => {
      item.included = !item.included;
      if (save()) { renderAgenda(); renderProtocol(); }
      else item.included = !item.included;
    });
    const actions = document.createElement('div');
    actions.className = 'proposal-actions';
    actions.append(status, button);
    card.append(meta, title, presenter, reason, decision, implementation, actions);
    list.append(card);
  });
}

document.getElementById('proposal-council').addEventListener('change', event => {
  activeAgenda = event.target.value;
  renderAgenda();
});
document.getElementById('proposal-form').addEventListener('submit', event => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const values = Object.fromEntries(new FormData(form));
  const fields = ['ministry', 'author', 'title', 'presenter', 'reportTime', 'reason', 'decision', 'deadline', 'responsible'];
  if (!councils[values.council] || fields.some(field => !values[field]?.trim())) return;
  const item = {
    id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    council: values.council,
    ministry: values.ministry.trim(),
    author: values.author.trim(),
    title: values.title.trim(),
    presenter: values.presenter.trim(),
    reportTime: values.reportTime.trim(),
    reason: values.reason.trim(),
    decision: values.decision.trim(),
    deadline: values.deadline.trim(),
    responsible: values.responsible.trim(),
    created: new Date().toISOString(),
    included: true
  };
  proposals.push(item);
  if (!save()) { proposals.pop(); return; }
  activeAgenda = item.council;
  form.reset();
  renderAgenda();
  renderProtocol();
});

function meetingFor(council) {
  if (!meetings[council] || typeof meetings[council] !== 'object') meetings[council] = {};
  return meetings[council];
}
function includedProposals(council) {
  return proposals.filter(item => item.council === council && item.included);
}
function itemCountLabel(count) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  const word = mod10 === 1 && mod100 !== 11 ? 'пункт' : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14) ? 'пункта' : 'пунктов';
  return `${count} ${word}`;
}
function renderAgendaDocument() {
  const items = includedProposals(activeAgenda);
  document.getElementById('agenda-document-title').textContent = councils[activeAgenda];
  document.getElementById('agenda-document-count').textContent = itemCountLabel(items.length);
  const container = document.getElementById('agenda-document-items');
  container.replaceChildren();
  const header = document.createElement('div');
  header.className = 'agenda-table-row agenda-table-head';
  ['№', 'Тема доклада', 'Докладчик', 'Время'].forEach(text => {
    const cell = document.createElement('span');
    cell.textContent = text;
    header.append(cell);
  });
  container.append(header);
  if (!items.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = 'Пункты появятся здесь автоматически после поступления предложений.';
    container.append(empty);
    return;
  }
  items.forEach((item, index) => {
    const row = document.createElement('div');
    row.className = 'agenda-table-row';
    [String(index + 1), item.title, item.presenter || item.author, item.reportTime || 'Уточняется'].forEach(text => {
      const cell = document.createElement('span');
      cell.textContent = text;
      row.append(cell);
    });
    container.append(row);
  });
}
function renderProtocol() {
  renderTabs('protocol-tabs', activeProtocol, council => {
    activeProtocol = council;
    renderProtocol();
  });
  document.getElementById('protocol-title').textContent = councils[activeProtocol];
  const meeting = meetingFor(activeProtocol);
  document.getElementById('meeting-date').value = meeting.date || '';
  document.getElementById('meeting-number').value = meeting.number || '';
  document.getElementById('meeting-place').value = meeting.place || '';
  document.getElementById('meeting-time').value = meeting.time || '';
  document.getElementById('meeting-chair').value = meeting.chair?.trim() ? meeting.chair : councilOfficers[activeProtocol].chair;
  document.getElementById('meeting-secretary').value = meeting.secretary?.trim() ? meeting.secretary : councilOfficers[activeProtocol].secretary;
  document.getElementById('meeting-notes').value = meeting.notes || '';
  const items = includedProposals(activeProtocol);
  document.getElementById('protocol-count').textContent = itemCountLabel(items.length);
  const container = document.getElementById('protocol-items');
  container.replaceChildren();
  if (!items.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = 'В повестку этого Совета пока не включены вопросы. Добавьте предложение во вкладке «Повестка» и включите его в повестку.';
    container.append(empty);
    return;
  }
  items.forEach((item, index) => {
    const section = document.createElement('section');
    section.className = 'protocol-item';
    const heading = document.createElement('h4');
    heading.textContent = `${index + 1}. ${item.title}`;
    const source = document.createElement('p');
    source.textContent = `${item.ministry} · Инициатор: ${item.author}`;
    const reason = document.createElement('p');
    reason.textContent = `Основание: ${item.reason}`;
    const presenter = document.createElement('p');
    presenter.textContent = `Докладчик: ${item.presenter || item.author}`;
    const label = document.createElement('label');
    label.textContent = 'Предложение в резолюцию / редакция секретаря';
    const textarea = document.createElement('textarea');
    textarea.rows = 4;
    textarea.maxLength = 4000;
    textarea.value = typeof meeting.decisions?.[item.id] === 'string' ? meeting.decisions[item.id] : item.decision;
    textarea.addEventListener('input', () => {
      meeting.decisions ||= {};
      meeting.decisions[item.id] = textarea.value;
      save();
    });
    const deadlineLabel = document.createElement('label');
    deadlineLabel.textContent = 'Срок реализации';
    const deadline = document.createElement('input');
    deadline.maxLength = 160;
    deadline.value = typeof meeting.deadlines?.[item.id] === 'string' ? meeting.deadlines[item.id] : (item.deadline || '');
    deadline.placeholder = 'Срок реализации решения';
    deadline.addEventListener('input', () => {
      meeting.deadlines ||= {};
      meeting.deadlines[item.id] = deadline.value;
      save();
    });
    deadlineLabel.append(deadline);
    const responsibleLabel = document.createElement('label');
    responsibleLabel.textContent = 'Ответственные за реализацию';
    const responsible = document.createElement('textarea');
    responsible.rows = 3;
    responsible.maxLength = 1000;
    responsible.value = typeof meeting.responsibles?.[item.id] === 'string' ? meeting.responsibles[item.id] : (item.responsible || '');
    responsible.placeholder = 'Ответственные органы, подразделения или должностные лица';
    responsible.addEventListener('input', () => {
      meeting.responsibles ||= {};
      meeting.responsibles[item.id] = responsible.value;
      save();
    });
    responsibleLabel.append(responsible);
    label.append(textarea);
    section.append(heading, source, presenter, reason, label, deadlineLabel, responsibleLabel);
    container.append(section);
  });
}
[['meeting-date', 'date'], ['meeting-number', 'number'], ['meeting-place', 'place'], ['meeting-time', 'time'], ['meeting-chair', 'chair'], ['meeting-secretary', 'secretary'], ['meeting-notes', 'notes']].forEach(([id, field]) => {
  document.getElementById(id).addEventListener('input', event => {
    meetingFor(activeProtocol)[field] = event.target.value;
    save();
  });
});
document.getElementById('print-protocol').addEventListener('click', () => window.print());
function escapeDocumentText(value = '') {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll('\n', '<br>');
}
function formatDocumentDate(value) {
  if (!value) return '________________';
  return new Date(`${value}T00:00:00`).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}
function downloadWordDocument(filename, title, content) {
  const documentHtml = `<!doctype html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><title>${escapeDocumentText(title)}</title><style>@page{size:A4;margin:2cm}body{font-family:'Times New Roman',serif;font-size:14pt;line-height:1.25;color:#000}h1{font-size:14pt;text-align:center;text-transform:uppercase;margin:0 0 24pt}h2{font-size:14pt;text-align:center;margin:18pt 0}p{margin:0 0 10pt}.meta{margin:18pt 0}.meta td{padding:3pt 12pt 3pt 0}.document-table{width:100%;border-collapse:collapse;margin-top:16pt}.document-table th,.document-table td{border:1px solid #000;padding:7pt;vertical-align:top}.document-table th{text-align:center}.resolution{page-break-inside:avoid;margin:18pt 0}.resolution h3{font-size:14pt;margin:0 0 8pt}.muted{font-size:11pt}</style></head><body>${content}</body></html>`;
  const blob = new Blob(['\ufeff', documentHtml], { type: 'application/msword;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
function agendaDocumentHtml(council) {
  const meeting = meetingFor(council);
  const rows = includedProposals(council).map((item, index) => `<tr><td>${index + 1}</td><td>${escapeDocumentText(item.title)}</td><td>${escapeDocumentText(item.presenter || item.author)}</td><td>${escapeDocumentText(item.reportTime || 'Уточняется')}</td></tr>`).join('');
  return `<p style="text-align:center">${escapeDocumentText(councils[council])}</p><hr><table class="meta"><tr><td>Дата:</td><td>${escapeDocumentText(formatDocumentDate(meeting.date))}</td></tr><tr><td>Место:</td><td>${escapeDocumentText(meeting.place || '________________')}</td></tr><tr><td>Время:</td><td>${escapeDocumentText(meeting.time || '________________')}</td></tr></table><h1>Повестка дня</h1><table class="document-table"><thead><tr><th>№ п/п</th><th>Тема доклада</th><th>Докладчик</th><th>Время доклада</th></tr></thead><tbody>${rows || '<tr><td colspan="4">Предложения не поступили</td></tr>'}</tbody></table>`;
}
function protocolDocumentHtml(council) {
  const meeting = meetingFor(council);
  const items = includedProposals(council);
  const agenda = items.map((item, index) => `<p>${index + 1}. ${escapeDocumentText(item.title)} - ${escapeDocumentText(item.presenter || item.author)}.</p>`).join('');
  const resolutions = items.map((item, index) => {
    const decision = typeof meeting.decisions?.[item.id] === 'string' ? meeting.decisions[item.id] : item.decision;
    const deadline = typeof meeting.deadlines?.[item.id] === 'string' ? meeting.deadlines[item.id] : item.deadline;
    const responsible = typeof meeting.responsibles?.[item.id] === 'string' ? meeting.responsibles[item.id] : item.responsible;
    return `<section class="resolution"><h3>${index + 1}. Вопрос повестки: ${escapeDocumentText(item.title)}</h3><p><b>Докладчик:</b> ${escapeDocumentText(item.presenter || item.author)}</p><p><b>Предложение в резолюцию протокола:</b><br>${escapeDocumentText(decision || 'Не указано')}</p><p><b>Срок реализации:</b> ${escapeDocumentText(deadline || 'Не указан')}</p><p><b>Ответственные за реализацию:</b><br>${escapeDocumentText(responsible || 'Не указаны')}</p><p class="muted">Инициатор: ${escapeDocumentText(item.ministry)}, ${escapeDocumentText(item.author)}</p></section>`;
  }).join('');
  return `<p style="text-align:center">АДМИНИСТРАЦИЯ ГЛАВЫ<br>ЛУГАНСКОЙ НАРОДНОЙ РЕСПУБЛИКИ</p><h1>Протокол заседания<br>${escapeDocumentText(councils[council])}</h1><table class="meta"><tr><td>${escapeDocumentText(formatDocumentDate(meeting.date))}</td><td>№ ${escapeDocumentText(meeting.number || '___')}</td></tr><tr><td>${escapeDocumentText(meeting.place || 'г. Луганск')}</td><td>${escapeDocumentText(meeting.time || '')}</td></tr></table><p><b>Председательствующий:</b> ${escapeDocumentText(meeting.chair || councilOfficers[council].chair)}</p><p><b>Секретарь:</b> ${escapeDocumentText(meeting.secretary || councilOfficers[council].secretary)}</p><h2>Повестка дня</h2>${agenda || '<p>Предложения не поступили.</p>'}<h2>Решения по протоколу</h2>${resolutions || '<p>Проекты решений не поступили.</p>'}${meeting.notes ? `<h2>Дополнительные замечания</h2><p>${escapeDocumentText(meeting.notes)}</p>` : ''}`;
}
document.getElementById('download-agenda').addEventListener('click', () => {
  const agendaDocument = councilAgendaDocuments[activeAgenda];
  downloadWordDocument(`Заполненная повестка ${agendaDocument.shortName}.doc`, `Повестка дня ${councils[activeAgenda]}`, agendaDocumentHtml(activeAgenda));
});
document.getElementById('download-protocol').addEventListener('click', () => downloadWordDocument(`Протокол-${activeProtocol}.doc`, 'Протокол заседания', protocolDocumentHtml(activeProtocol)));
renderAgenda();
renderProtocol();

const mediaPanels = document.querySelectorAll('.media-panel');
document.querySelectorAll('.media-tab').forEach(tab => tab.addEventListener('click', () => {
  const panel = tab.dataset.mediaPanel;
  document.querySelectorAll('.media-tab').forEach(item => item.classList.toggle('active', item === tab));
  mediaPanels.forEach(item => item.classList.toggle('active', item.id === `media-${panel}-panel`));
}));

const storedDrafts = load('kontur-media-drafts-v1', []);
let mediaDrafts = Array.isArray(storedDrafts) ? storedDrafts : [];
let activeDraftId = mediaDrafts[0]?.id || null;
let mediaSaveTimer;
const mediaChannel = 'BroadcastChannel' in globalThis ? new BroadcastChannel('kontur-media-drafts') : null;
function saveMediaDrafts(notify = true) {
  try {
    localStorage.setItem('kontur-media-drafts-v1', JSON.stringify(mediaDrafts));
    if (notify) mediaChannel?.postMessage({ type: 'drafts-updated' });
    return true;
  } catch {
    alert('Не удалось сохранить медиачерновики в этом браузере.');
    return false;
  }
}
function activeDraft() {
  return mediaDrafts.find(item => item.id === activeDraftId);
}
function renderMediaDrafts() {
  document.getElementById('media-draft-count').textContent = mediaDrafts.length;
  const list = document.getElementById('shared-drafts-list');
  list.replaceChildren();
  if (!mediaDrafts.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = 'Черновиков пока нет.';
    list.append(empty);
  } else {
    mediaDrafts.forEach(draft => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `shared-draft-card${draft.id === activeDraftId ? ' active' : ''}`;
      const type = document.createElement('span');
      type.textContent = draft.ministry;
      const title = document.createElement('strong');
      title.textContent = draft.title || 'Без заголовка';
      const status = document.createElement('small');
      status.textContent = `${draft.status || 'Черновик'} · ${new Date(draft.updated).toLocaleString('ru-RU')}`;
      button.append(type, title, status);
      button.addEventListener('click', () => { activeDraftId = draft.id; renderMediaDrafts(); });
      list.append(button);
    });
  }
  const draft = activeDraft();
  document.getElementById('shared-editor-empty').hidden = Boolean(draft);
  document.getElementById('shared-editor-fields').hidden = !draft;
  if (!draft) return;
  document.getElementById('shared-title').value = draft.title || '';
  document.getElementById('shared-text').value = draft.text || '';
  document.getElementById('shared-status').value = draft.status || 'Черновик';
  const comments = document.getElementById('shared-comments');
  comments.replaceChildren();
  (draft.comments || []).forEach(comment => {
    const item = document.createElement('div');
    item.className = 'shared-comment';
    const heading = document.createElement('strong');
    heading.textContent = comment.author;
    const text = document.createElement('p');
    text.textContent = comment.text;
    const time = document.createElement('small');
    time.textContent = new Date(comment.created).toLocaleString('ru-RU');
    item.append(heading, text, time);
    comments.append(item);
  });
}
function updateActiveDraft() {
  const draft = activeDraft();
  if (!draft) return;
  draft.title = document.getElementById('shared-title').value;
  draft.text = document.getElementById('shared-text').value;
  draft.status = document.getElementById('shared-status').value;
  draft.updated = new Date().toISOString();
  const state = document.getElementById('shared-save-state');
  state.textContent = 'Сохранение...';
  clearTimeout(mediaSaveTimer);
  mediaSaveTimer = setTimeout(() => {
    saveMediaDrafts();
    state.textContent = 'Все изменения сохранены';
  }, 350);
}
['shared-title', 'shared-text', 'shared-status'].forEach(id => document.getElementById(id).addEventListener('input', updateActiveDraft));
document.getElementById('add-comment').addEventListener('click', () => {
  const draft = activeDraft();
  const author = document.getElementById('comment-author').value.trim();
  const text = document.getElementById('comment-text').value.trim();
  if (!draft || !author || !text) return;
  draft.comments ||= [];
  draft.comments.push({ author, text, created: new Date().toISOString() });
  draft.updated = new Date().toISOString();
  document.getElementById('comment-text').value = '';
  saveMediaDrafts();
  renderMediaDrafts();
});
mediaChannel?.addEventListener('message', () => {
  const incoming = load('kontur-media-drafts-v1', []);
  if (Array.isArray(incoming)) { mediaDrafts = incoming; renderMediaDrafts(); }
});
window.addEventListener('storage', event => {
  if (event.key !== 'kontur-media-drafts-v1') return;
  const incoming = load('kontur-media-drafts-v1', []);
  if (Array.isArray(incoming)) { mediaDrafts = incoming; renderMediaDrafts(); }
});
renderMediaDrafts();

document.getElementById('media-generator-form').addEventListener('submit', event => {
  event.preventDefault();
  if (!event.currentTarget.reportValidity()) return;
  const ministry = document.getElementById('publication-ministry').value;
  const council = document.getElementById('publication-council').value;
  const task = document.getElementById('publication-task').value.trim();
  const result = document.getElementById('publication-result').value.trim();
  const proof = document.getElementById('publication-proof').value.trim();
  const title = `Поручение исполнено: ${task.charAt(0).toUpperCase()}${task.slice(1)}`;
  const paragraphs = [
    `${ministry} сообщает о результатах исполнения поручения, сформированного по итогам работы ${council}.`,
    `Поручение: ${task}.`,
    `Результат: ${result}.`,
    proof ? `Подтверждение: ${proof}.` : '',
    'Материал подготовлен для последующей проверки и согласования перед публикацией.',
    '#РешенияСоветов #ЛНР'
  ].filter(Boolean);
  document.getElementById('generated-title').value = title;
  document.getElementById('generated-text').value = paragraphs.join('\n\n');
  document.getElementById('generated-meta').textContent = `${ministry} · ${council}`;
});
document.getElementById('copy-publication').addEventListener('click', async event => {
  const content = `${document.getElementById('generated-title').value}\n\n${document.getElementById('generated-text').value}`.trim();
  if (!content) return;
  try {
    await navigator.clipboard.writeText(content);
    event.currentTarget.textContent = 'Скопировано';
    setTimeout(() => { event.currentTarget.textContent = 'Копировать'; }, 1200);
  } catch {
    document.getElementById('generated-text').select();
  }
});
document.getElementById('send-to-editing').addEventListener('click', () => {
  const title = document.getElementById('generated-title').value.trim();
  const text = document.getElementById('generated-text').value.trim();
  if (!title || !text) { document.getElementById('publication-task').focus(); return; }
  const draft = {
    id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    ministry: document.getElementById('publication-ministry').value,
    title,
    text,
    status: 'Черновик',
    comments: [],
    updated: new Date().toISOString()
  };
  mediaDrafts.unshift(draft);
  activeDraftId = draft.id;
  saveMediaDrafts();
  renderMediaDrafts();
  document.querySelector('[data-media-panel="editing"]').click();
});

const newsSources = [
  { id: 'culture', label: 'Культура', ministry: 'Министерство культуры ЛНР' },
  { id: 'sport', label: 'Спорт', ministry: 'Министерство спорта ЛНР' },
  { id: 'education', label: 'Образование', ministry: 'Официальные новости сферы образования ЛНР' },
  { id: 'youth', label: 'Молодежная политика', ministry: 'Министерство молодежной политики ЛНР' }
];
let activeNewsFilter = 'all';
let newsItems = [];
function renderNewsSources() {
  const grid = document.getElementById('news-grid');
  grid.replaceChildren();
  const filteredItems = newsItems.filter(item => activeNewsFilter === 'all' || item.category === activeNewsFilter);
  if (filteredItems.length) {
    filteredItems.forEach(item => {
      const card = document.createElement('article');
      card.className = 'news-source-card news-item-card';
      const tag = document.createElement('span');
      tag.textContent = newsSources.find(source => source.id === item.category)?.label || 'Новости';
      const title = document.createElement('h3');
      title.textContent = item.title;
      const summary = document.createElement('p');
      summary.textContent = item.summary || '';
      const meta = document.createElement('small');
      const published = item.published ? new Date(item.published).toLocaleDateString('ru-RU') : 'Дата не указана';
      meta.textContent = `${item.source} · ${published}`;
      card.append(tag, title, summary, meta);
      if (item.url) {
        try {
          const url = new URL(item.url, location.href);
          if (url.protocol === 'https:' || url.protocol === 'http:') {
            const link = document.createElement('a');
            link.href = url.href;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.textContent = 'Открыть источник →';
            card.append(link);
          }
        } catch {
          // Ignore malformed source URLs supplied by the external feed.
        }
      }
      grid.append(card);
    });
    return;
  }
  newsSources.filter(source => activeNewsFilter === 'all' || source.id === activeNewsFilter).forEach(source => {
    const card = document.createElement('article');
    card.className = 'news-source-card';
    const tag = document.createElement('span');
    tag.textContent = source.label;
    const title = document.createElement('h3');
    title.textContent = source.ministry;
    const state = document.createElement('p');
    state.textContent = 'Официальный RSS/API источник ожидает настройки администратором.';
    const status = document.createElement('small');
    status.textContent = 'Нет подключения';
    card.append(tag, title, state, status);
    grid.append(card);
  });
}
document.querySelectorAll('[data-news-filter]').forEach(button => button.addEventListener('click', () => {
  activeNewsFilter = button.dataset.newsFilter;
  document.querySelectorAll('[data-news-filter]').forEach(item => item.classList.toggle('active', item === button));
  renderNewsSources();
}));
async function refreshNews() {
  const button = document.getElementById('refresh-news');
  const state = document.getElementById('news-updated');
  button.disabled = true;
  state.textContent = 'Проверяем новостную ленту...';
  try {
    const response = await fetch(`news-feed.json?t=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    const allowedCategories = new Set(newsSources.map(source => source.id));
    newsItems = Array.isArray(payload.items) ? payload.items.filter(item => item && allowedCategories.has(item.category) && item.title && item.source) : [];
    renderNewsSources();
    state.textContent = newsItems.length
      ? `Обновлено ${new Date().toLocaleString('ru-RU')} · материалов: ${newsItems.length}`
      : `Проверка выполнена ${new Date().toLocaleString('ru-RU')}. Новых материалов нет; источники ожидают подключения.`;
  } catch {
    state.textContent = location.protocol === 'file:'
      ? 'Автообновление доступно после размещения платформы на веб-сервере и подключения официальных источников.'
      : 'Не удалось получить news-feed.json. Проверьте работу сервера-агрегатора.';
  } finally {
    button.disabled = false;
  }
}
document.getElementById('refresh-news').addEventListener('click', refreshNews);
renderNewsSources();
if (location.protocol !== 'file:') {
  refreshNews();
  setInterval(refreshNews, 5 * 60 * 1000);
}

// The overview uses illustrative cards; keep their labels aligned with the configured directory.
const sampleYouthTask = document.querySelector('#task-list .task-row:nth-child(2)');
if (sampleYouthTask) {
  sampleYouthTask.dataset.search = 'программа молодежных инициатив молодежная политика';
  sampleYouthTask.querySelector('.task-meta span').textContent = 'МОЛОДЕЖНАЯ ПОЛИТИКА';
  sampleYouthTask.querySelector('h3').textContent = 'Согласовать программу молодежных инициатив';
}
const sampleMediaCircle = document.querySelector('.media-circles i:nth-child(3)');
if (sampleMediaCircle) sampleMediaCircle.textContent = 'МП';
const sampleMediaParagraph = document.querySelector('.media-item:nth-child(2) h3');
if (sampleMediaParagraph) sampleMediaParagraph.textContent = 'Что изменилось для системы образования';
const sampleMediaText = document.querySelector('.media-editor > p');
if (sampleMediaText) sampleMediaText.textContent = 'В демонстрационном примере обсуждается доступность спортивной инфраструктуры. График ремонта объектов в районах приведён как пример оформления новости.';

document.querySelector('#filter-risk')?.addEventListener('click', event => {
  const active = event.currentTarget.classList.toggle('active');
  document.querySelectorAll('#task-list .task-row').forEach(row => row.style.display = active && !row.classList.contains('risk') ? 'none' : 'flex');
  event.currentTarget.firstChild.textContent = active ? 'Все задачи ' : 'Только риски ';
});
document.querySelector('#global-search')?.addEventListener('input', event => {
  const query = event.target.value.toLowerCase();
  document.querySelectorAll('[data-search]').forEach(row => row.style.display = !query || row.dataset.search.includes(query) ? 'flex' : 'none');
});

let activeTaskTab = 'all';
let openedTaskRow = null;
const taskDetailModal = document.getElementById('task-detail-modal');
const taskStatusView = {
  work: { label: 'В работе', pill: 'blue', priority: 'medium', symbol: '•' },
  risk: { label: 'Высокий риск', pill: 'red', priority: 'high', symbol: '!' },
  done: { label: 'Исполнено', pill: 'green', priority: 'low', symbol: '✓' }
};
function taskRows() {
  return [...document.querySelectorAll('#full-task-list .task-record')];
}
function updateTaskCounters() {
  const rows = taskRows();
  const counts = {
    all: rows.length,
    mine: rows.filter(row => row.dataset.taskScope === 'mine').length,
    risk: rows.filter(row => row.dataset.taskStatus === 'risk').length,
    done: rows.filter(row => row.dataset.taskStatus === 'done').length
  };
  document.querySelectorAll('[data-task-tab]').forEach(button => {
    const count = button.querySelector('b');
    if (count) count.textContent = counts[button.dataset.taskTab];
  });
}
function applyTaskFilters() {
  const ministry = document.getElementById('task-filter-ministry').value;
  const council = document.getElementById('task-filter-council').value;
  let visible = 0;
  taskRows().forEach(row => {
    const tabMatch = activeTaskTab === 'all'
      || (activeTaskTab === 'mine' && row.dataset.taskScope === 'mine')
      || (activeTaskTab === 'risk' && row.dataset.taskStatus === 'risk')
      || (activeTaskTab === 'done' && row.dataset.taskStatus === 'done');
    const ministryMatch = ministry === 'all' || row.dataset.taskMinistry === ministry;
    const councilMatch = council === 'all' || row.dataset.taskCouncil === council;
    const show = tabMatch && ministryMatch && councilMatch;
    row.hidden = !show;
    if (show) visible += 1;
  });
  document.getElementById('task-empty').hidden = visible !== 0;
  const activeLabel = document.querySelector(`[data-task-tab="${activeTaskTab}"]`)?.childNodes[0]?.textContent.trim().toLowerCase() || 'все';
  document.getElementById('tasks-summary').textContent = visible
    ? `Показано поручений: ${visible} · раздел «${activeLabel}».`
    : 'По выбранным условиям поручений не найдено.';
}
document.querySelectorAll('[data-task-tab]').forEach(button => button.addEventListener('click', () => {
  activeTaskTab = button.dataset.taskTab;
  document.querySelectorAll('[data-task-tab]').forEach(item => {
    const selected = item === button;
    item.classList.toggle('active', selected);
    item.setAttribute('aria-selected', String(selected));
  });
  applyTaskFilters();
}));
document.getElementById('task-filter-toggle').addEventListener('click', event => {
  const panel = document.getElementById('task-filters');
  panel.hidden = !panel.hidden;
  event.currentTarget.setAttribute('aria-expanded', String(!panel.hidden));
  event.currentTarget.querySelector('span').textContent = panel.hidden ? '⌄' : '⌃';
});
['task-filter-ministry', 'task-filter-council'].forEach(id => document.getElementById(id).addEventListener('change', applyTaskFilters));
document.getElementById('task-filter-reset').addEventListener('click', () => {
  document.getElementById('task-filter-ministry').value = 'all';
  document.getElementById('task-filter-council').value = 'all';
  applyTaskFilters();
});
function openTaskDetails(row) {
  openedTaskRow = row;
  document.getElementById('task-detail-id').textContent = `ПОРУЧЕНИЕ №${row.dataset.taskId}`;
  document.getElementById('task-detail-title').textContent = row.querySelector('strong').textContent;
  document.getElementById('task-detail-council').textContent = row.querySelector('small').textContent.split(' · ')[0];
  document.getElementById('task-detail-owner').textContent = row.children[1].textContent;
  document.getElementById('task-detail-date').textContent = row.children[2].textContent;
  document.getElementById('task-detail-status').textContent = taskStatusView[row.dataset.taskStatus].label;
  taskDetailModal.classList.add('show');
}
document.getElementById('full-task-list').addEventListener('click', event => {
  const row = event.target.closest('.task-record');
  if (row) openTaskDetails(row);
});
document.getElementById('task-detail-close').addEventListener('click', () => taskDetailModal.classList.remove('show'));
taskDetailModal.addEventListener('click', event => { if (event.target === taskDetailModal) taskDetailModal.classList.remove('show'); });
document.querySelectorAll('[data-set-task-status]').forEach(button => button.addEventListener('click', () => {
  if (!openedTaskRow) return;
  const status = button.dataset.setTaskStatus;
  const view = taskStatusView[status];
  openedTaskRow.dataset.taskStatus = status;
  const priority = openedTaskRow.querySelector('.priority');
  priority.className = `priority ${view.priority}`;
  priority.textContent = view.symbol;
  const pill = openedTaskRow.querySelector('.status-pill');
  pill.className = `status-pill ${view.pill}`;
  pill.textContent = view.label;
  document.getElementById('task-detail-status').textContent = view.label;
  updateTaskCounters();
  applyTaskFilters();
}));
updateTaskCounters();
applyTaskFilters();

const modal = document.querySelector('#modal');
function openModal() { modal.classList.add('show'); setTimeout(() => document.querySelector('#task-title').focus(), 100); }
document.querySelectorAll('#new-task,#new-task-2').forEach(button => button.addEventListener('click', openModal));
document.querySelector('#modal-close').addEventListener('click', () => modal.classList.remove('show'));
modal.addEventListener('click', event => { if (event.target === modal) modal.classList.remove('show'); });
document.querySelector('#create-task').addEventListener('click', () => {
  const title = document.querySelector('#task-title').value.trim();
  if (!title) { document.querySelector('#task-title').focus(); return; }
  const createdFromTasks = document.getElementById('tasks-view').classList.contains('active');
  modal.classList.remove('show');
  const row = document.createElement('article');
  row.className = 'task-row';
  row.dataset.search = title.toLowerCase();
  const priority = document.createElement('div');
  priority.className = 'priority medium';
  priority.textContent = '•';
  const main = document.createElement('div');
  main.className = 'task-main';
  const meta = document.createElement('div');
  meta.className = 'task-meta';
  meta.textContent = document.querySelector('#task-ministry').value.toUpperCase();
  const heading = document.createElement('h3');
  heading.textContent = title;
  const detail = document.createElement('p');
  detail.textContent = 'Создано только что · ожидает принятия в работу';
  main.append(meta, heading, detail);
  const status = document.createElement('span');
  status.className = 'status-pill blue';
  status.textContent = 'Новое';
  row.append(priority, main, status);
  document.querySelector('#task-list').prepend(row);
  const ministryName = document.querySelector('#task-ministry').value;
  const ministryCodes = {
    'Министерство культуры': 'culture',
    'Министерство спорта': 'sport',
    'Министерство молодежной политики': 'youth',
    'Министерство образования': 'education'
  };
  const council = document.getElementById('task-council-create').value;
  const councilNames = { ntr: 'Совет по НТР', ssp: 'Совет по ССП', dnc: 'Совет по ДНЦ' };
  const owner = document.getElementById('task-owner').value;
  const deadlineValue = document.getElementById('task-deadline').value;
  const deadline = deadlineValue ? new Date(`${deadlineValue}T00:00:00`).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' }) : 'Срок не задан';
  const record = document.createElement('button');
  record.type = 'button';
  record.className = 'full-row task-record';
  record.dataset.taskStatus = 'work';
  record.dataset.taskScope = owner === 'Лариса Яковлевна' ? 'mine' : 'team';
  record.dataset.taskMinistry = ministryCodes[ministryName] || 'general';
  record.dataset.taskCouncil = council;
  record.dataset.taskId = `П-${String(Date.now()).slice(-3)}`;
  const recordMain = document.createElement('div');
  const recordPriority = document.createElement('span');
  recordPriority.className = 'priority medium';
  recordPriority.textContent = '•';
  const recordTitle = document.createElement('strong');
  recordTitle.textContent = title;
  const recordSource = document.createElement('small');
  recordSource.textContent = `${councilNames[council]} · №${record.dataset.taskId}`;
  recordMain.append(recordPriority, recordTitle, recordSource);
  const recordOwner = document.createElement('span');
  recordOwner.textContent = owner === 'Выберите исполнителя' ? 'Не назначен' : owner;
  const recordDate = document.createElement('span');
  recordDate.textContent = deadline;
  const recordStatus = document.createElement('span');
  recordStatus.className = 'status-pill blue';
  recordStatus.textContent = 'В работе';
  record.append(recordMain, recordOwner, recordDate, recordStatus);
  document.getElementById('task-empty').before(record);
  updateTaskCounters();
  applyTaskFilters();
  document.querySelector('#task-title').value = '';
  showView(createdFromTasks ? 'tasks' : 'overview');
});
document.addEventListener('keydown', event => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    document.querySelector('#global-search').focus();
  }
  if (event.key === 'Escape') { modal.classList.remove('show'); taskDetailModal.classList.remove('show'); }
});

const requestedView = window.location.hash.slice(1);
if (labels[requestedView]) showView(requestedView);
