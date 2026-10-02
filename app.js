const views = document.querySelectorAll('.page-view');
document.querySelector('#enter-platform')?.addEventListener('click', () => {
  document.querySelector('#landing-page')?.classList.add('is-hidden');
  document.querySelector('#platform-shell')?.classList.add('is-open');
});
document.querySelector('#brand-home')?.addEventListener('click', event => {
  event.preventDefault();
  document.querySelector('#landing-page')?.classList.remove('is-hidden');
  document.querySelector('#platform-shell')?.classList.remove('is-open');
  window.scrollTo({ top: 0, behavior: 'smooth' });
});
document.querySelectorAll('[data-ministry-councils]').forEach(button => button.addEventListener('click', () => {
  const councilsToOpen = button.dataset.ministryCouncils.split(',').filter(Boolean);
  document.querySelector('#landing-page')?.classList.add('is-hidden');
  document.querySelector('#platform-shell')?.classList.add('is-open');
  if (councilsToOpen.length) {
    activeAgenda = councilsToOpen[0];
    showView('agenda');
    renderAgenda();
    document.querySelector('#agenda-view')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else {
    showView('overview');
  }
}));
const pageLabel = document.querySelector('#page-label');
const labels = { overview: 'Обзор', councils: 'Информация о Советах', decisions: 'Проект решений', tasks: 'Поручения', agenda: 'Повестка', protocols: 'Сводные протоколы', media: 'Медиа-мастерская', analytics: 'Аналитика' };
const councils = { ntr: 'Совет по НТР', ssp: 'Совет по ССП', dnc: 'Совет по ДНЦ' };
const councilDescriptions = {
  ntr: 'Вопросы научно-технологического развития, инноваций и внедрения решений.',
  ssp: 'Межведомственные вопросы и инициативы, рассматриваемые в контуре ССП.',
  dnc: 'Вопросы и поручения Совета ДНЦ: от рассмотрения решений до контроля исполнения.'
};
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
let activeDecisionCouncil = 'ntr';
const projectDecisionsKey = 'ritm-project-decisions-v1';
const projectDecisions = Object.fromEntries(Object.keys(councils).map(council => [council, { responsible: '', deadlines: '', assignments: '', ...(load(projectDecisionsKey, {})[council] || {}) }]));
function saveProjectDecisions() {
  try { localStorage.setItem(projectDecisionsKey, JSON.stringify(projectDecisions)); return true; } catch { return false; }
}
function renderProjectDecisions() {
  const tabs = document.getElementById('decision-tabs');
  if (!tabs) return;
  tabs.replaceChildren();
  Object.keys(councils).forEach(council => {
    const tab = document.createElement('button');
    tab.type = 'button'; tab.className = `council-info-tab ${council === activeDecisionCouncil ? 'active' : ''}`; tab.textContent = councils[council]; tab.setAttribute('aria-selected', String(council === activeDecisionCouncil));
    tab.addEventListener('click', () => { activeDecisionCouncil = council; renderProjectDecisions(); });
    tabs.append(tab);
  });
  const decision = projectDecisions[activeDecisionCouncil];
  document.getElementById('decision-eyebrow').textContent = `СОВЕТ ${activeDecisionCouncil.toUpperCase()}`;
  document.getElementById('decision-title').textContent = councils[activeDecisionCouncil];
  document.getElementById('decision-responsible').value = decision.responsible;
  document.getElementById('decision-deadlines').value = decision.deadlines;
  document.getElementById('decision-assignments').value = decision.assignments;
}
function renderProtocolProjectDecision() {
  const section = document.getElementById('protocol-project-decisions');
  const content = document.getElementById('protocol-project-decision-content');
  if (!section || !content) return;
  const decision = projectDecisions[activeProtocol];
  content.replaceChildren();
  const fields = [['Ответственный', decision.responsible], ['Сроки', decision.deadlines], ['Поручения', decision.assignments]];
  const hasContent = fields.some(([, value]) => value.trim());
  section.hidden = !hasContent;
  if (!hasContent) return;
  fields.forEach(([label, value]) => { if (!value.trim()) return; const block = document.createElement('div'); block.className = 'project-decision-field'; const heading = document.createElement('strong'); heading.textContent = label; const text = document.createElement('p'); text.textContent = value; block.append(heading, text); content.append(block); });
}
document.getElementById('decision-form')?.addEventListener('submit', event => {
  event.preventDefault();
  Object.assign(projectDecisions[activeDecisionCouncil], { responsible: document.getElementById('decision-responsible').value.trim(), deadlines: document.getElementById('decision-deadlines').value.trim(), assignments: document.getElementById('decision-assignments').value.trim() });
  const message = document.getElementById('decision-message');
  if (saveProjectDecisions()) { renderProjectDecisions(); renderProtocolProjectDecision(); message.textContent = 'Проект решения сохранён и добавлен в сводный протокол.'; } else message.textContent = 'Не удалось сохранить проект решения в этом браузере.';
});
document.getElementById('decision-reset')?.addEventListener('click', () => { projectDecisions[activeDecisionCouncil] = { responsible: '', deadlines: '', assignments: '' }; saveProjectDecisions(); renderProjectDecisions(); renderProtocolProjectDecision(); document.getElementById('decision-message').textContent = 'Поля проекта решения очищены.'; });
renderProjectDecisions();

function showView(view) {
  if (!labels[view]) return;
  views.forEach(item => item.classList.toggle('active', item.id === `${view}-view`));
  document.querySelectorAll('.main-nav .nav-item').forEach(item => item.classList.toggle('active', item.dataset.view === view));
  pageLabel.textContent = labels[view];
  if (view === 'analytics') renderAnalytics();
  if (view === 'protocols' || view === 'media') updateNotifications(view, true);
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
const defaultCouncilInfo = {
  ntr: {
    name: 'Совет по научно-технологическому развитию Луганской Народной Республики (Совет НТР)',
    chair: 'Глава ЛНР (общее руководство, созыв заседаний, утверждение повестки, подписание протоколов)',
    secretary: 'Представитель Министерства образования и науки ЛНР',
    schedule: 'Совет и Коллегия ректоров собираются не реже двух раз в год',
    description: 'Цель — формирование единого научно-технологического пространства в ЛНР, решение региональных задач, привлечение инвестиций в научно-технологическую сферу.\n\nОсновные задачи Совета:\n• Выработка рекомендаций по формированию и реализации направлений научно-технологического развития ЛНР, развития интеллектуальной собственности.\n• Определение приоритетных направлений научной и научно-технологической деятельности, приоритетных отраслевых задач для научно-образовательного комплекса.\n• Разработка предложений по проектам законов и нормативных актов в научно-технологической сфере.\n\nФункции Совета:\n• Формирование предложений по государственной программе научно-технологического развития ЛНР и плану её мероприятий.\n• Подготовка предложений по концепции научно-технологического развития и стратегически значимых решений.\n• Рассмотрение научных программ и проектов на соответствие приоритетным направлениям.\n• Рассмотрение планов и результатов работы ответственных исполнителей.\n• Подготовка предложений по совершенствованию правовых и экономических механизмов, стимулированию коммерциализации научной продукции, развитию наукоёмких предприятий и привлечению инвестиций.',
    notes: 'Полномочия Совета:\n• Принимает решения и направляет предложения органам государственной власти ЛНР.\n• Запрашивает информацию у территориальных органов федеральных органов власти, исполнительных органов ЛНР, вузов.\n• Приглашает на заседания руководителей организаций реального сектора экономики, финансово-кредитных организаций, научных и образовательных учреждений.\n• Привлекает экспертов на безвозмездной основе, создаёт рабочие группы.\n\nСостав и организация работы:\n• Заместитель председателя — заместитель Председателя Правительства ЛНР, ответственный за научно-технологическое развитие.\n• Ответственный секретарь — представитель Министерства образования и науки ЛНР: подготовка материалов, ведение протоколов, оповещение членов.\n• В состав Совета могут входить представители органов власти, ректоры вузов, научные деятели, руководители предприятий, финансово-кредитных организаций и общественных объединений.\n• Персональный состав утверждается распоряжением Главы ЛНР. Члены Совета работают на безвозмездной основе.\n\nПрезидиум Совета создаётся для координации и решения оперативных вопросов. Он включает председателя, заместителя председателя, ответственного секретаря и иных членов, может созывать заседания без участия всех членов Совета. Решения президиума направляются остальным членам Совета в течение 5 рабочих дней.\n\nКоллегия ректоров формируется из числа членов Совета — ректоров вузов ЛНР. Направления её деятельности: рекомендации по политике в высшем образовании, развитие науки и материально-технической базы вузов, координация комплексных научных программ, организация конференций и семинаров, интеграция вузов с научными, производственными и финансовыми организациями, экспертиза нормативных актов и научно-технологических программ.\n\nПорядок проведения заседаний: заседание правомочно при участии не менее 50% членов; заседания проводятся очно, при решении председательствующего допускается дистанционный формат; решения принимаются открытым голосованием; при равенстве голосов решающим является голос председательствующего. Протокол подписывается председательствующим и ответственным секретарём. Члены Совета, не согласные с решением, вправе выразить особое мнение в письменной форме. Для решения задач Совета могут формироваться рабочие группы с указанием руководителя.'
  },
  ssp: {
    name: 'Совет при Правительстве Луганской Народной Республики по социальному партнёрству в сфере занятости молодёжи (Совет ССП)',
    chair: 'Председатель Правительства ЛНР',
    secretary: 'Представитель Министерства образования и науки ЛНР',
    schedule: 'Не реже двух раз в год, в очной форме (допускается дистанционный формат)',
    goal: 'Цель — создание эффективной системы социального партнёрства между органами власти, работодателями, профсоюзами, образовательными организациями для скоординированных мер по содействию занятости молодёжи и устойчивому социально-экономическому развитию ЛНР.',
    tasks: '• Создание единой системы профориентации.\n• Предложения работодателям по достойным условиям труда для молодёжи.\n• Содействие трудоустройству, развитию молодёжного предпринимательства и самозанятости.\n• Совершенствование мотивации работодателей.\n• Организация информирования выпускников и родителей о потребностях рынка труда.\n• Сотрудничество в вопросах производственной практики, целевого обучения, трудоустройства.\n• Привлечение студенческих и трудовых отрядов подростков к занятости в каникулярный период.\n• Популяризация востребованных профессий и системы непрерывного образования.',
    functions: '• Анализ запросов рынка труда ЛНР.\n• Разработка инновационных рекомендаций по взаимодействию системы СПО, ВО и рынка труда.\n• Подготовка предложений по актуализации образовательных программ с учётом потребностей рынка труда.\n• Подготовка предложений по организации производственных практик и стажировок.\n• Планирование профильной ориентации среднего общего образования.\n• Содействие выпускникам в получении первого места работы.\n• Создание условий для временного трудоустройства обучающихся в составе студенческих и трудовых отрядов.',
    powers: '• Разработка и представление предложений по совершенствованию государственной политики в сфере труда.\n• Запрос и получение материалов от федеральных органов, исполнительных органов ЛНР, органов местного самоуправления, образовательных организаций, профсоюзов и объединений работодателей.\n• Приглашение на заседания должностных лиц и представителей организаций.\n• Привлечение на безвозмездной основе научных, образовательных организаций и экспертов.\n• Использование банков данных органов государственной власти ЛНР.\n• Образование экспертных, консультативных и рабочих групп.',
    organization: '• Председатель — Председатель Правительства ЛНР: определяет план работы и повестку, руководит Советом, созывает заседания, координирует реализацию решений.\n• Заместитель председателя — заместитель Председателя Правительства ЛНР, координирующий вопросы культуры, молодёжной политики, спорта, образования и науки.\n• Ответственный секретарь — представитель Министерства образования и науки ЛНР: готовит материалы, оповещает участников, ведёт протоколы и рассылает решения.\n• Члены Совета работают на безвозмездной основе.\n• Состав Совета и комиссий формируется Минобрнауки ЛНР и утверждается распоряжением Правительства ЛНР.\n• План работы принимается на календарный год и утверждается протоколом заседания.\n• Кворум — не менее 50% членов; решения принимаются открытым голосованием не менее половины голосов присутствующих. При равенстве голос председательствующего является решающим.\n• Члены Совета, не согласные с решением, вправе подать особое мнение в письменной форме.',
    commissions: 'Комиссии Совета работают по четырём направлениям и обеспечивают подготовку предложений в сфере занятости молодёжи.',
    commission1: '1. Комиссия по вопросам СПО, прогнозирования и координации подготовки квалифицированных рабочих и специалистов среднего звена:\n• рассмотрение контрольных цифр приёма на обучение по программам СПО (сентябрь–октябрь предшествующего года);\n• координация действий образовательных организаций, работодателей, службы занятости;\n• разработка предложений по изменению квалификационной структуры трудовых ресурсов;\n• привлечение дополнительного финансирования для материально-технической базы СПО;\n• разработка региональной стратегии кадрового обеспечения;\n• организация чемпионатных движений и трудоустройства победителей;\n• координация кластеров федерального проекта «Профессионалитет» — мониторинг, согласование программ, подготовка рекомендаций Минпросвещения РФ;\n• развитие системы профориентации и маршрутизации молодёжи к работодателям.',
    commission2: '2. Комиссия по вопросам трудоустройства молодёжи и взаимодействия с образовательными организациями:\n• рекомендации по профориентационной работе с молодёжью;\n• рекомендации по организации целевого обучения;\n• рекомендации по развитию практико-ориентированного обучения, практик и стажировок;\n• маршрутизация выпускников на предприятия;\n• предложения работодателям по сопровождению молодых специалистов;\n• методологическое сопровождение системы наставничества;\n• консультативная помощь выпускникам при проблемах с трудоустройством.',
    commission3: '3. Комиссия по развитию движения студенческих отрядов (СО) и трудовых отрядов подростков (ТОП):\n• предложения по созданию СО и ТОП в образовательных организациях;\n• определение видов и объёмов работ для СО и ТОП;\n• обучение командных составов и участников;\n• содействие участию в межрегиональных и всероссийских трудовых проектах;\n• поддержка в проведении республиканских и участии во всероссийских акциях.',
    commission4: '4. Комиссия по вопросам профессионального обучения учащихся 10–11-х классов:\n• формирование перечня программ профессиональной подготовки для учащихся 10–11-х классов;\n• организация обучения по программам профподготовки с учётом потребностей рынка труда;\n• координация летней практики на предприятиях;\n• выработка единой модели итоговой аттестации в форме квалификационного экзамена;\n• рекомендации работодателям по трудоустройству учащихся после получения среднего общего образования.',
    composition: 'В комиссии Совета входят представители:\n• Минобразования и науки ЛНР, Минздрава ЛНР, Минимущества ЛНР, Мининфраструктуры и транспорта ЛНР, МВД по ЛНР и других министерств;\n• образовательных организаций высшего и среднего профессионального образования;\n• организаций различных организационно-правовых форм (работодатели);\n• Луганского регионального объединения «Союз машиностроителей России»;\n• АНО «Россия — страна возможностей»;\n• Республиканского центра занятости населения;\n• Дома молодёжи;\n• регионального штаба «Российские студенческие отряды»;\n• Федерации профессиональных союзов ЛНР;\n• руководителей общеобразовательных и профессиональных образовательных организаций;\n• администраций городских округов (по молодёжной политике).',
    support: 'Организационно-техническое сопровождение Совета осуществляет Министерство образования и науки ЛНР.',
    sourceVersion: 2,
    description: councilDescriptions.ssp,
    notes: ''
  },
  dnc: {
    name: 'Совет по защите традиционных российских духовно-нравственных ценностей, культуры и исторической памяти при Главе Луганской Народной Республики (Совет ДНЦ)',
    chair: 'Глава ЛНР',
    secretary: 'Ответственный секретарь Совета',
    schedule: 'Не реже одного раза в квартал; допускаются заочный формат и видеоконференцсвязь',
    goal: '• Укрепление традиционных российских духовно-нравственных ценностей, сохранение культуры и исторической памяти.\n• Координация взаимодействия госорганов, местного самоуправления, НКО, научного и экспертного сообщества.\n• Разработка инициатив и механизмов решения проблем в сфере государственной политики по сохранению традиционных ценностей.\n• Продвижение достижений российской культуры.\n• Противодействие фальсификации исторических событий и фактов.',
    tasks: '• Подготовка предложений по реализации госорганами и органами местного самоуправления функций в сфере сохранения традиционных ценностей.\n• Популяризация традиционных ценностей в массовом сознании и СМИ.\n• Содействие в разработке ведомственных планов мероприятий.\n• Участие в программах популяризации российской культуры и исторического наследия.\n• Привлечение научных и исследовательских организаций.',
    functions: '• Разработка методических рекомендаций по реализации политики сохранения традиционных ценностей на территории ЛНР.\n• Рассмотрение предложений госорганов, НКО, экспертного сообщества.\n• Вынесение предложений по разработке нормативных актов и документов стратегического планирования.\n• Анализ эффективности реализации государственной политики в данной сфере.',
    organization: '• Председатель — Глава ЛНР.\n• Два заместителя председателя.\n• Ответственный секретарь обеспечивает подготовку и проведение заседаний, решает текущие вопросы.\n• Члены Совета участвуют на общественных началах.\n• В состав могут входить представители госорганов, местного самоуправления, НКО, религиозных организаций, научного и экспертного сообществ.\n• Состав утверждается распоряжением Главы ЛНР.\n• Кворум — более половины членов; решения принимаются простым большинством голосов, при равенстве голос решающий у председательствующего.',
    commissions: 'Постоянно действующие комиссии:\n• по патриотическому воспитанию, вовлечению в спорт и подготовке к военной службе;\n• по выявлению и поддержке талантливых и одарённых детей и молодёжи;\n• по формированию и укреплению семейных ценностей;\n• по развитию добровольчества, волонтёрства и взаимодействию с социально ориентированными НКО;\n• по научно-методическому обеспечению государственной политики по сохранению традиционных ценностей;\n• по формированию и продвижению ценностно-ориентированного медиаконтента;\n• по духовно-нравственному воспитанию.',
    commissionRules: 'Комиссии могут быть постоянными и временными; создаются решением Совета при исполнительном органе ЛНР.\n\nСостав — от 10 до 30 человек; утверждается правовым актом соответствующего исполнительного органа.\n\nПредседатель, заместитель и секретарь избираются открытым голосованием на первом заседании. Заседания проводятся не реже одного раза в квартал, очно или дистанционно; кворум — не менее половины членов.\n\nРешения принимаются простым большинством голосов и оформляются протоколами за подписью председателя и секретаря. Члены комиссии работают на добровольных началах без права делегирования полномочий. К заседаниям могут привлекаться лица, не входящие в состав комиссии. Протоколы и материалы комиссий могут обнародоваться только по решению Совета.',
    support: 'Обеспечение деятельности Совета возлагается на Министерство культуры ЛНР.',
    description: councilDescriptions.dnc,
    notes: ''
  }
};
function councilSection(text, start, end = '') {
  const from = text.indexOf(start);
  if (from < 0) return '';
  const content = text.slice(from + start.length);
  const to = end ? content.indexOf(end) : -1;
  return (to < 0 ? content : content.slice(0, to)).trim();
}
const ntrDefault = defaultCouncilInfo.ntr;
ntrDefault.goal = ntrDefault.description.split('\n\nОсновные задачи Совета:')[0].trim();
ntrDefault.tasks = councilSection(ntrDefault.description, 'Основные задачи Совета:', 'Функции Совета:');
ntrDefault.functions = councilSection(ntrDefault.description, 'Функции Совета:');
ntrDefault.powers = councilSection(ntrDefault.notes, 'Полномочия Совета:', 'Состав и организация работы:');
ntrDefault.organization = councilSection(ntrDefault.notes, 'Состав и организация работы:', 'Президиум Совета');
ntrDefault.notes = councilSection(ntrDefault.notes, 'Президиум Совета');
ntrDefault.support = 'Организационно-техническое сопровождение Совета осуществляет Министерство образования и науки ЛНР.';
Object.keys(defaultCouncilInfo).forEach(key => { const info = defaultCouncilInfo[key]; info.goal ||= info.description || ''; info.tasks ||= ''; info.functions ||= ''; info.powers ||= ''; info.organization ||= ''; info.commissions ||= ''; info.commissionRules ||= ''; info.commission1 ||= ''; info.commission2 ||= ''; info.commission3 ||= ''; info.commission4 ||= ''; info.composition ||= ''; info.support ||= ''; });
const storedCouncilInfo = load('ritm-council-info-v1', {});
const councilInfo = Object.fromEntries(Object.keys(defaultCouncilInfo).map(key => [key, { ...defaultCouncilInfo[key], ...(storedCouncilInfo[key] || {}) }]));
let activeCouncilInfo = 'ntr';
function saveCouncilInfo() { try { localStorage.setItem('ritm-council-info-v1', JSON.stringify(councilInfo)); return true; } catch { return false; } }
if (!storedCouncilInfo.ssp?.sourceVersion || storedCouncilInfo.ssp.sourceVersion < 2) { councilInfo.ssp = { ...defaultCouncilInfo.ssp, sourceVersion: 2 }; saveCouncilInfo(); }
function renderCouncilInfo() {
  const tabs = document.getElementById('council-info-tabs');
  if (!tabs) return;
  tabs.replaceChildren();
  const shortNames = { ntr: 'Совет НТР', ssp: 'Совет ССП', dnc: 'Совет ДНЦ' };
  Object.keys(councils).forEach(key => { const tab = document.createElement('button'); tab.type = 'button'; tab.className = `council-info-tab ${key === activeCouncilInfo ? 'active' : ''}`; tab.textContent = shortNames[key]; tab.setAttribute('aria-selected', String(key === activeCouncilInfo)); tab.addEventListener('click', () => { activeCouncilInfo = key; renderCouncilInfo(); }); tabs.append(tab); });
  const info = councilInfo[activeCouncilInfo];
  document.getElementById('council-info-powers-field').hidden = activeCouncilInfo === 'dnc';
  document.getElementById('council-info-commission-rules-field').hidden = activeCouncilInfo === 'ssp';
  const councilShortNames = { ntr: 'НТР', ssp: 'ССП', dnc: 'ДНЦ' };
  document.getElementById('council-info-eyebrow').textContent = `СОВЕТ ${councilShortNames[activeCouncilInfo]}`;
  document.getElementById('council-info-title').textContent = info.name || councils[activeCouncilInfo];
  document.getElementById('council-info-name').value = info.name || '';
  document.getElementById('council-info-chair').value = info.chair || '';
  document.getElementById('council-info-secretary').value = info.secretary || '';
  document.getElementById('council-info-schedule').value = info.schedule || '';
  document.getElementById('council-info-goal').value = info.goal || info.description || '';
  document.getElementById('council-info-tasks').value = info.tasks || '';
  document.getElementById('council-info-functions').value = info.functions || '';
  document.getElementById('council-info-powers').value = info.powers || '';
  document.getElementById('council-info-organization').value = info.organization || '';
  document.getElementById('council-info-commissions').value = info.commissions || '';
  document.getElementById('council-info-commission-rules').value = info.commissionRules || '';
  document.getElementById('council-info-commission-1').value = info.commission1 || '';
  document.getElementById('council-info-commission-2').value = info.commission2 || '';
  document.getElementById('council-info-commission-3').value = info.commission3 || '';
  document.getElementById('council-info-commission-4').value = info.commission4 || '';
  document.getElementById('council-info-composition').value = info.composition || '';
  document.getElementById('council-info-support').value = info.support || '';
  document.getElementById('council-info-notes').value = info.notes || '';
  ['name', 'chair', 'secretary', 'schedule', 'goal', 'tasks', 'functions', 'powers', 'organization', 'commissions', 'commission-rules', 'commission-1', 'commission-2', 'commission-3', 'commission-4', 'composition', 'support', 'notes'].forEach(id => {
    const field = document.getElementById(`council-info-${id}`);
    const wrapper = field?.closest('label');
    if (wrapper) wrapper.hidden = !field.value.trim();
  });
  document.getElementById('council-info-powers-field').hidden = activeCouncilInfo === 'dnc' || !info.powers?.trim();
  document.getElementById('council-info-commission-rules-field').hidden = activeCouncilInfo === 'ssp' || !info.commissionRules?.trim();
}
document.getElementById('council-info-form')?.addEventListener('submit', event => { event.preventDefault(); const info = councilInfo[activeCouncilInfo]; Object.assign(info, { name: document.getElementById('council-info-name').value.trim(), chair: document.getElementById('council-info-chair').value.trim(), secretary: document.getElementById('council-info-secretary').value.trim(), schedule: document.getElementById('council-info-schedule').value.trim(), goal: document.getElementById('council-info-goal').value.trim(), tasks: document.getElementById('council-info-tasks').value.trim(), functions: document.getElementById('council-info-functions').value.trim(), powers: document.getElementById('council-info-powers').value.trim(), organization: document.getElementById('council-info-organization').value.trim(), commissions: document.getElementById('council-info-commissions').value.trim(), commissionRules: document.getElementById('council-info-commission-rules').value.trim(), commission1: document.getElementById('council-info-commission-1').value.trim(), commission2: document.getElementById('council-info-commission-2').value.trim(), commission3: document.getElementById('council-info-commission-3').value.trim(), commission4: document.getElementById('council-info-commission-4').value.trim(), composition: document.getElementById('council-info-composition').value.trim(), support: document.getElementById('council-info-support').value.trim(), notes: document.getElementById('council-info-notes').value.trim() }); if (saveCouncilInfo()) { renderCouncilInfo(); document.getElementById('council-info-message').textContent = 'Информация сохранена.'; } else document.getElementById('council-info-message').textContent = 'Не удалось сохранить информацию в этом браузере.'; });
document.getElementById('council-info-reset')?.addEventListener('click', () => { councilInfo[activeCouncilInfo] = { ...defaultCouncilInfo[activeCouncilInfo] }; saveCouncilInfo(); renderCouncilInfo(); document.getElementById('council-info-message').textContent = 'Исходные данные восстановлены.'; });
renderCouncilInfo();
const notificationKey = 'ritm-notifications-v1';
function updateNotifications(section, clear = false) {
  const stored = load(notificationKey, {});
  const counts = {};
  for (const key of ['protocols', 'media']) {
    counts[key] = Number.isSafeInteger(stored?.[key]) && stored[key] > 0 ? stored[key] : 0;
  }
  if (section) {
    const visible = document.getElementById('platform-shell').classList.contains('is-open') && document.getElementById(`${section}-view`).classList.contains('active');
    counts[section] = clear || visible ? 0 : counts[section] + 1;
    try { localStorage.setItem(notificationKey, JSON.stringify(counts)); } catch { /* Counters remain available for this update. */ }
  }
  document.getElementById('protocol-notifications').textContent = counts.protocols;
  document.getElementById('media-notifications').textContent = counts.media;
}
updateNotifications();
window.addEventListener('storage', event => {
  if (event.key === notificationKey || event.key === null) updateNotifications();
});
const storedProposals = load('kontur-proposals-v1', []);
const proposals = Array.isArray(storedProposals) ? storedProposals : [];
const storedMeetings = load('kontur-meetings-v1', {});
const meetings = storedMeetings && typeof storedMeetings === 'object' && !Array.isArray(storedMeetings) ? storedMeetings : {};
const storedTasks = load('kontur-tasks-v1', []);
const tasks = Array.isArray(storedTasks) ? storedTasks : [];
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
function saveTasks() {
  try {
    localStorage.setItem('kontur-tasks-v1', JSON.stringify(tasks));
    renderAnalytics();
    renderTaskCalendar();
    refreshCalendarSelection();
    return true;
  } catch {
    alert('Не удалось сохранить поручения в этом браузере.');
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
  document.getElementById('agenda-subtitle').textContent = councilDescriptions[activeAgenda];
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
  updateNotifications('protocols');
  activeAgenda = item.council;
  form.reset();
  renderAgenda();
  renderProtocol();
});

function meetingFor(council) {
  if (!meetings[council] || typeof meetings[council] !== 'object') meetings[council] = {};
  return meetings[council];
}
let calendarMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
const calendarCouncilClasses = { dnc: 'dnc', ntr: 'ntr', ssp: 'ssp' };
const calendarStorageKey = 'ritm-calendar-meetings-v1';
let calendarMeetings = load(calendarStorageKey, []);
if (!Array.isArray(calendarMeetings)) calendarMeetings = [];
let selectedCalendarDate = '';
function openCalendarFiles() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ritm-calendar-files', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('documents');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
async function storeCalendarFiles(files) {
  if (!files.length) return [];
  const db = await openCalendarFiles();
  try {
    return await Promise.all(files.map(file => new Promise((resolve, reject) => {
      const id = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
      const transaction = db.transaction('documents', 'readwrite');
      transaction.objectStore('documents').put(file, id);
      transaction.oncomplete = () => resolve({ id, name: file.name });
      transaction.onerror = () => reject(transaction.error);
    })));
  } finally { db.close(); }
}
async function downloadCalendarFile(documentId, filename) {
  try {
    const db = await openCalendarFiles();
    const file = await new Promise((resolve, reject) => {
      const transaction = db.transaction('documents', 'readonly');
      const request = transaction.objectStore('documents').get(documentId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    db.close();
    if (!file) throw new Error('Файл не найден');
    const url = URL.createObjectURL(file);
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch { document.getElementById('calendar-form-message').textContent = 'Не удалось открыть прикреплённый файл в этом браузере.'; }
}
function localDateKey(value) {
  if (!value) return '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return '';
  const date = new Date(`${value}T00:00:00`);
  return !Number.isNaN(date.getTime()) && date.getFullYear() === Number(value.slice(0, 4)) && date.getMonth() + 1 === Number(value.slice(5, 7)) && date.getDate() === Number(value.slice(8, 10)) ? value : '';
}
function calendarEntries() {
  const entries = calendarMeetings.filter(item => councils[item.council] && !item.deleted).map(item => {
    if (item.id !== `protocol-${item.council}`) return item;
    const protocol = meetingFor(item.council);
    // Старые сохранённые правки не имели отдельного поля overrides.
    const overrides = item.overrides || { date: item.date, time: item.time, place: item.place, comment: item.comment };
    return { ...item, date: overrides.date ?? protocol.date ?? item.date, time: overrides.time ?? protocol.time ?? '', place: overrides.place ?? protocol.place ?? '', comment: overrides.comment ?? protocol.notes ?? '' };
  }).filter(item => localDateKey(item.date));
  Object.keys(councils).forEach(council => {
    const legacy = meetingFor(council);
    if (localDateKey(legacy.date) && !calendarMeetings.some(item => item.id === `protocol-${council}`) && !entries.some(item => item.council === council && item.date === legacy.date)) {
      entries.push({ id: `protocol-${council}`, council, date: legacy.date, time: legacy.time || '', place: legacy.place || '', comment: legacy.notes || '', documents: [] });
    }
  });
  return entries;
}
function tasksOnDate(dateKey) {
  return tasks.filter(task => localDateKey(task.deadlineISO) === dateKey);
}
function taskCalendarStatus(task) {
  if (task.status === 'done') return { className: 'task-done', label: 'Исполнено' };
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return task.status === 'risk' || localDateKey(task.deadlineISO) && task.deadlineISO < today
    ? { className: 'task-overdue', label: 'Просрочено' }
    : { className: 'task-open', label: 'Не исполнено' };
}
function refreshCalendarSelection() {
  renderMeetingsCalendar();
  if (selectedCalendarDate) renderMeetingDetails(selectedCalendarDate);
}
function renderMeetingsCalendar() {
  const calendar = document.getElementById('meetings-calendar');
  const monthLabel = document.getElementById('calendar-month');
  if (!calendar || !monthLabel) return;
  const year = calendarMonth.getFullYear();
  const month = calendarMonth.getMonth();
  monthLabel.textContent = calendarMonth.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
  calendar.replaceChildren();
  ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].forEach(day => { const label = document.createElement('span'); label.className = 'calendar-weekday'; label.textContent = day; calendar.append(label); });
  const firstDay = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let i = 0; i < firstDay; i++) calendar.append(document.createElement('span'));
  for (let day = 1; day <= daysInMonth; day++) {
    const key = localDateKey(`${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
    const cell = document.createElement('button');
    cell.type = 'button'; cell.className = 'calendar-day'; cell.dataset.date = key;
    const now = new Date();
    if (key === localDateKey(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`)) cell.classList.add('today');
    if (key === selectedCalendarDate) cell.classList.add('selected');
    const number = document.createElement('strong'); number.textContent = day; cell.append(number);
    Object.entries(councils).forEach(([council, name]) => {
      if (!calendarEntries().some(meeting => meeting.council === council && meeting.date === key)) return;
      cell.classList.add('has-meeting');
      const marker = document.createElement('i'); marker.className = `calendar-marker ${calendarCouncilClasses[council]}`; marker.title = name; cell.append(marker);
    });
    cell.addEventListener('click', () => { selectedCalendarDate = key; document.getElementById('calendar-date').value = key; refreshCalendarSelection(); });
    calendar.append(cell);
  }
}
function renderMeetingDetails(dateKey) {
  const details = document.getElementById('meeting-details');
  details.replaceChildren();
  const date = new Date(`${dateKey}T00:00:00`);
  const heading = document.createElement('h3'); heading.textContent = date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }); details.append(heading);
  const meetingsForDate = calendarEntries().filter(item => item.date === dateKey);
  if (!meetingsForDate.length) { const empty = document.createElement('p'); empty.className = 'empty-state'; empty.textContent = 'На эту дату заседания не запланированы. Можно добавить заседание ниже.'; details.append(empty); return; }
  meetingsForDate.forEach(meeting => {
    const { council } = meeting;
    const name = councils[council];
    const proposalsForCouncil = proposals.filter(item => item.council === council && item.included);
    const card = document.createElement('article'); card.className = `meeting-detail-card ${calendarCouncilClasses[council]}`;
    const title = document.createElement('h4'); title.textContent = name;
    const meta = document.createElement('p'); meta.textContent = `${meeting.time || 'Время не указано'} · ${meeting.place || 'Место не указано'}`;
    const summary = document.createElement('p'); summary.textContent = `Повестка Совета: ${proposalsForCouncil.length}`;
    const comment = document.createElement('p'); comment.textContent = meeting.comment || '';
    const actions = document.createElement('div'); actions.className = 'meeting-detail-actions';
    [['agenda', 'Открыть повестку'], ['protocols', 'Открыть протокол'], ['tasks', 'Открыть поручения']].forEach(([view, label]) => { const button = document.createElement('button'); button.type = 'button'; button.className = 'outline-button'; button.textContent = label; button.addEventListener('click', () => { if (view === 'agenda') { activeAgenda = council; renderAgenda(); } if (view === 'protocols') { activeProtocol = council; renderProtocol(); } if (view === 'tasks') { document.getElementById('task-filter-council').value = council; activeTaskTab = 'all'; document.querySelectorAll('[data-task-tab]').forEach(tab => tab.classList.toggle('active', tab.dataset.taskTab === 'all')); applyTaskFilters(); } showView(view); }); actions.append(button); });
    const fileList = document.createElement('div'); fileList.className = 'calendar-documents';
    (meeting.documents || []).forEach(file => { const button = document.createElement('button'); button.type = 'button'; button.className = 'text-button'; button.textContent = `📎 ${file.name}`; button.addEventListener('click', () => downloadCalendarFile(file.id, file.name)); fileList.append(button); });
    const edit = document.createElement('button'); edit.type = 'button'; edit.className = 'outline-button'; edit.textContent = 'Изменить'; edit.addEventListener('click', () => { document.getElementById('calendar-meeting-id').value = meeting.id; document.getElementById('calendar-council').value = council; document.getElementById('calendar-council').disabled = meeting.id === `protocol-${council}`; document.getElementById('calendar-date').value = meeting.date; document.getElementById('calendar-time').value = meeting.time || ''; document.getElementById('calendar-place').value = meeting.place || ''; document.getElementById('calendar-comment').value = meeting.comment || ''; document.getElementById('calendar-meeting-delete').hidden = false; document.getElementById('calendar-form-title').textContent = 'Изменить заседание'; document.getElementById('calendar-meeting-form').scrollIntoView({ behavior: 'smooth' }); }); actions.append(edit);
    card.append(title, meta, summary, comment, fileList, actions); details.append(card);
  });
}
document.getElementById('calendar-prev')?.addEventListener('click', () => { calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1); renderMeetingsCalendar(); });
document.getElementById('calendar-next')?.addEventListener('click', () => { calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1); renderMeetingsCalendar(); });
document.getElementById('calendar-form-reset').addEventListener('click', () => { document.getElementById('calendar-meeting-form').reset(); document.getElementById('calendar-meeting-id').value = ''; document.getElementById('calendar-council').disabled = false; document.getElementById('calendar-meeting-delete').hidden = true; document.getElementById('calendar-form-title').textContent = 'Добавить заседание'; document.getElementById('calendar-form-message').textContent = ''; });
document.getElementById('calendar-meeting-delete').addEventListener('click', () => { const id = document.getElementById('calendar-meeting-id').value; if (!id || !confirm('Удалить это заседание из календаря?')) return; calendarMeetings = calendarMeetings.map(item => item.id === id ? { ...item, deleted: true } : item); localStorage.setItem(calendarStorageKey, JSON.stringify(calendarMeetings)); document.getElementById('calendar-form-reset').click(); refreshCalendarSelection(); });
document.getElementById('calendar-meeting-form').addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const message = document.getElementById('calendar-form-message');
  const date = localDateKey(document.getElementById('calendar-date').value);
  if (!date) { message.textContent = 'Укажите корректную дату.'; return; }
  const id = document.getElementById('calendar-meeting-id').value;
  const previous = calendarMeetings.find(item => item.id === id);
  const protocolEdit = Object.keys(councils).some(council => id === `protocol-${council}`);
  const entry = { id: protocolEdit ? id : previous?.id || (globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`), council: document.getElementById('calendar-council').value, date, time: document.getElementById('calendar-time').value, place: document.getElementById('calendar-place').value.trim(), comment: document.getElementById('calendar-comment').value.trim(), documents: previous?.documents || [] };
  if (protocolEdit) {
    const protocol = meetingFor(entry.council);
    entry.overrides = {};
    for (const [field, source] of Object.entries({ date: 'date', time: 'time', place: 'place', comment: 'notes' })) {
      if (entry[field] !== (protocol[source] || '')) entry.overrides[field] = entry[field];
    }
  }
  const button = form.querySelector('[type="submit"]'); button.disabled = true; message.textContent = 'Сохранение…';
  try {
    const files = Array.from(document.getElementById('calendar-documents').files);
    entry.documents = [...entry.documents, ...await storeCalendarFiles(files)];
    const updated = previous ? calendarMeetings.map(item => item.id === id ? entry : item) : [...calendarMeetings, entry];
    localStorage.setItem(calendarStorageKey, JSON.stringify(updated));
    calendarMeetings = updated;
    calendarMonth = new Date(Number(date.slice(0, 4)), Number(date.slice(5, 7)) - 1, 1);
    selectedCalendarDate = date;
    form.reset(); document.getElementById('calendar-meeting-id').value = ''; document.getElementById('calendar-council').disabled = false; document.getElementById('calendar-meeting-delete').hidden = true; document.getElementById('calendar-form-title').textContent = 'Добавить заседание';
    refreshCalendarSelection(); message.textContent = 'Заседание сохранено.';
  } catch { message.textContent = 'Не удалось сохранить заседание или документы. Проверьте доступность хранилища браузера.'; }
  finally { button.disabled = false; }
});
window.addEventListener('storage', event => { if (event.key === calendarStorageKey) { const incoming = load(calendarStorageKey, []); calendarMeetings = Array.isArray(incoming) ? incoming : []; refreshCalendarSelection(); } });
renderMeetingsCalendar();
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
  document.getElementById('protocol-audio-name').textContent = meeting.audioName || 'Файл не прикреплён';
  document.getElementById('protocol-transcript').value = meeting.audioDraft || '';
  document.getElementById('transcription-status').textContent = meeting.audioName ? 'Аудиозапись прикреплена к выбранному Совету.' : 'Аудиозапись будет сохранена вместе с выбранным Советом.';
  const items = includedProposals(activeProtocol);
  document.getElementById('protocol-count').textContent = itemCountLabel(items.length);
  const container = document.getElementById('protocol-items');
  container.replaceChildren();
  renderProtocolProjectDecision();
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
    if (['date', 'time', 'place', 'notes'].includes(field)) refreshCalendarSelection();
  });
});
document.getElementById('print-protocol').addEventListener('click', () => window.print());
document.getElementById('protocol-audio').addEventListener('change', event => {
  const file = event.target.files?.[0];
  if (!file) return;
  const meeting = meetingFor(activeProtocol);
  meeting.audioName = file.name;
  meeting.audioType = file.type;
  meeting.audioSize = file.size;
  document.getElementById('protocol-audio-name').textContent = `${file.name} · ${(file.size / 1024 / 1024).toFixed(2)} МБ`;
  document.getElementById('transcription-status').textContent = 'Файл прикреплён. Нажмите «Подготовить черновик протокола».';
  save();
});
document.getElementById('protocol-transcript').addEventListener('input', event => {
  meetingFor(activeProtocol).audioDraft = event.target.value;
  save();
});
document.getElementById('transcribe-protocol').addEventListener('click', () => {
  const meeting = meetingFor(activeProtocol);
  if (!meeting.audioName) {
    document.getElementById('protocol-audio').click();
    return;
  }
  const items = includedProposals(activeProtocol);
  const lines = [
    `ЧЕРНОВОЙ ПРОТОКОЛ — ${councils[activeProtocol]}`,
    `Источник: ${meeting.audioName}`,
    '',
    `Дата заседания: ${meeting.date || 'уточнить'}`,
    `Председательствующий: ${meeting.chair || councilOfficers[activeProtocol].chair}`,
    `Секретарь: ${meeting.secretary || councilOfficers[activeProtocol].secretary}`,
    '',
    'ВОПРОСЫ И РЕШЕНИЯ:'
  ];
  if (items.length) {
    items.forEach((item, index) => {
      const decision = typeof meeting.decisions?.[item.id] === 'string' ? meeting.decisions[item.id] : item.decision;
      lines.push(`${index + 1}. ${item.title}`);
      lines.push(`Докладчик: ${item.presenter || item.author}`);
      lines.push(`Проект решения: ${decision || 'уточнить по аудиозаписи'}`);
      lines.push(`Срок: ${item.deadline || 'уточнить'}`);
      lines.push('');
    });
  } else {
    lines.push('Вопросы повестки: необходимо извлечь из аудиозаписи и проверить секретарю.');
  }
  lines.push('ДОПОЛНИТЕЛЬНЫЕ ЗАМЕЧАНИЯ:', meeting.notes || 'уточнить по аудиозаписи');
  lines.push('', 'Пометка: черновик требует проверки расшифровки и утверждения секретарём.');
  meeting.audioDraft = lines.join('\n');
  save();
  document.getElementById('protocol-transcript').value = meeting.audioDraft;
  document.getElementById('transcription-status').textContent = 'Черновик подготовлен на основе аудиофайла и данных Совета. Проверьте текст перед утверждением.';
});
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
  return `<p style="text-align:center">${escapeDocumentText('Наименование органа государственной власти субъекта Российской Федерации')}<br>${escapeDocumentText(councils[council])}</p><hr><h1>Повестка дня заседания</h1><table class="meta"><tr><td>Дата:</td><td>${escapeDocumentText(formatDocumentDate(meeting.date))}</td></tr><tr><td>Место:</td><td>${escapeDocumentText(meeting.place || '________________')}</td></tr><tr><td>Время:</td><td>${escapeDocumentText(meeting.time || '________________')}</td></tr><tr><td>Формат:</td><td>очно / видео-конференция / смешанный</td></tr></table><p><b>Основание проведения:</b> ________________________________________________</p><p><b>Председательствующий:</b> ${escapeDocumentText(meeting.chair || '________________')}</p><p><b>Секретарь:</b> ${escapeDocumentText(meeting.secretary || '________________')}</p><p><b>Приглашённые:</b> _________________________________________________________</p><table class="document-table"><thead><tr><th>№ п/п</th><th>Вопрос повестки</th><th>Докладчик</th><th>Время</th></tr></thead><tbody>${rows || '<tr><td colspan="4">Предложения не поступили</td></tr>'}</tbody></table><h2>Примечания</h2><p>________________________________________________________________________</p>`;
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
  const project = projectDecisions[council];
  const projectHtml = [
    ['Ответственный', project.responsible],
    ['Сроки', project.deadlines],
    ['Поручения', project.assignments]
  ].filter(([, value]) => value.trim()).map(([label, value]) => `<p><b>${label}:</b><br>${escapeDocumentText(value)}</p>`).join('');
  return `<p style="text-align:center">${escapeDocumentText('Наименование органа государственной власти субъекта Российской Федерации')}<br>${escapeDocumentText(councils[council])}</p><h1>Протокол заседания<br>${escapeDocumentText(councils[council])}</h1><table class="meta"><tr><td>Дата: ${escapeDocumentText(formatDocumentDate(meeting.date))}</td><td>№ ${escapeDocumentText(meeting.number || '___')}</td></tr><tr><td>Место: ${escapeDocumentText(meeting.place || '________________')}</td><td>Время: ${escapeDocumentText(meeting.time || '________________')}</td></tr></table><p><b>Основание проведения:</b> ________________________________________________</p><p><b>Председательствующий:</b> ${escapeDocumentText(meeting.chair || councilOfficers[council].chair)}</p><p><b>Секретарь:</b> ${escapeDocumentText(meeting.secretary || councilOfficers[council].secretary)}</p><p><b>Присутствовали:</b> ______________________________________________________</p><p><b>Приглашённые:</b> _________________________________________________________</p><h2>Повестка дня</h2>${agenda || '<p>Предложения не поступили.</p>'}<h2>Проект решений</h2>${projectHtml || '<p>Проект решения не заполнен.</p>'}<h2>Рассмотрение вопросов и решения</h2>${resolutions || '<p>Проекты решений не поступили.</p>'}${meeting.notes ? `<h2>Дополнительные замечания</h2><p>${escapeDocumentText(meeting.notes)}</p>` : ''}<table class="meta" style="margin-top:36pt"><tr><td>Председательствующий<br><br>________________ / __________________</td><td>Секретарь<br><br>________________ / __________________</td></tr></table>`;
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
    renderAnalytics();
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
  renderOverviewMedia();
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
    renderOverviewMedia();
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
  if (Array.isArray(incoming)) { mediaDrafts = incoming; renderMediaDrafts(); updateNotifications('media'); }
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
  const comment = document.getElementById('publication-comment').value.trim();
  const title = `Поручение исполнено: ${task.charAt(0).toUpperCase()}${task.slice(1)}`;
  const paragraphs = [
    `${ministry} сообщает о результатах исполнения поручения, сформированного по итогам работы ${council}.`,
    `Поручение: ${task}.`,
    `Результат: ${result}.`,
    proof ? `Подтверждение: ${proof}.` : '',
    comment ? `Комментарий: ${comment}` : '',
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
  updateNotifications('media');
});

const newsSources = [
  { id: 'culture', label: 'Культура', ministry: 'Министерство культуры ЛНР' },
  { id: 'sport', label: 'Спорт', ministry: 'Министерство спорта ЛНР' },
  { id: 'education', label: 'Образование и наука', ministry: 'Министерство образования и науки ЛНР' },
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
let taskCalendarMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
let selectedTaskCalendarDate = '';
const taskDetailModal = document.getElementById('task-detail-modal');
const councilNames = { ntr: 'Совет по НТР', ssp: 'Совет по ССП', dnc: 'Совет по ДНЦ' };
const ministryCodes = {
  'Министерство культуры ЛНР': 'culture',
  'Министерство спорта ЛНР': 'sport',
  'Министерство молодежной политики ЛНР': 'youth',
  'Министерство образования и науки ЛНР': 'education'
};
const taskStatusView = {
  work: { label: 'В работе', pill: 'blue', priority: 'medium', symbol: '•' },
  risk: { label: 'Высокий риск', pill: 'red', priority: 'high', symbol: '!' },
  done: { label: 'Исполнено', pill: 'green', priority: 'low', symbol: '✓' }
};
function renderTaskCalendar() {
  const calendar = document.getElementById('task-calendar');
  const monthLabel = document.getElementById('task-calendar-month');
  if (!calendar || !monthLabel) return;
  const year = taskCalendarMonth.getFullYear();
  const month = taskCalendarMonth.getMonth();
  monthLabel.textContent = taskCalendarMonth.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
  calendar.replaceChildren();
  ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].forEach(day => { const label = document.createElement('span'); label.className = 'calendar-weekday'; label.textContent = day; calendar.append(label); });
  const firstDay = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let i = 0; i < firstDay; i++) calendar.append(document.createElement('span'));
  for (let day = 1; day <= daysInMonth; day++) {
    const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const cell = document.createElement('button'); cell.type = 'button'; cell.className = 'calendar-day'; cell.dataset.date = key;
    if (key === selectedTaskCalendarDate) cell.classList.add('selected');
    const number = document.createElement('strong'); number.textContent = day; cell.append(number);
    const dayTasks = tasksOnDate(key);
    for (const status of ['task-open', 'task-overdue', 'task-done']) {
      if (!dayTasks.some(task => taskCalendarStatus(task).className === status)) continue;
      const marker = document.createElement('i'); marker.className = `calendar-marker ${status}`; marker.title = taskCalendarStatus(dayTasks.find(task => taskCalendarStatus(task).className === status)).label; cell.append(marker);
    }
    cell.addEventListener('click', () => { selectedTaskCalendarDate = key; renderTaskCalendar(); renderTaskCalendarDetails(key); });
    calendar.append(cell);
  }
}
function renderTaskCalendarDetails(dateKey) {
  const details = document.getElementById('task-calendar-details');
  if (!details) return;
  details.replaceChildren();
  const dayTasks = tasksOnDate(dateKey);
  if (!dayTasks.length) { const empty = document.createElement('p'); empty.className = 'empty-state'; empty.textContent = 'На эту дату поручения не запланированы.'; details.append(empty); return; }
  const title = document.createElement('h3'); title.textContent = new Date(`${dateKey}T00:00:00`).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }); details.append(title);
  dayTasks.forEach(task => { const row = document.createElement('div'); row.className = `task-calendar-row ${taskCalendarStatus(task).className}`; const text = document.createElement('span'); text.textContent = `${task.title} · ${councilNames[task.council] || 'Совет не указан'} · ${taskCalendarStatus(task).label}${task.comment ? ` · ${task.comment}` : ''}`; const edit = document.createElement('button'); edit.type = 'button'; edit.className = 'outline-button'; edit.textContent = 'Изменить'; edit.addEventListener('click', () => { document.getElementById('task-calendar-edit-id').value = task.id; document.getElementById('task-calendar-edit-date').value = task.deadlineISO || dateKey; document.getElementById('task-calendar-edit-status').value = task.status === 'done' ? 'done' : task.status === 'risk' ? 'risk' : 'work'; document.getElementById('task-calendar-edit-comment').value = task.comment || ''; document.getElementById('task-calendar-edit-delete').hidden = false; document.getElementById('task-calendar-edit').hidden = false; }); row.append(text, edit); details.append(row); });
}
document.getElementById('task-calendar-prev')?.addEventListener('click', () => { taskCalendarMonth = new Date(taskCalendarMonth.getFullYear(), taskCalendarMonth.getMonth() - 1, 1); renderTaskCalendar(); });
document.getElementById('task-calendar-next')?.addEventListener('click', () => { taskCalendarMonth = new Date(taskCalendarMonth.getFullYear(), taskCalendarMonth.getMonth() + 1, 1); renderTaskCalendar(); });
document.getElementById('task-calendar-edit-cancel')?.addEventListener('click', () => { document.getElementById('task-calendar-edit').hidden = true; });
document.getElementById('task-calendar-edit-delete')?.addEventListener('click', () => { const id = document.getElementById('task-calendar-edit-id').value; if (!id || !confirm('Удалить это поручение?')) return; const index = tasks.findIndex(item => item.id === id); if (index < 0) return; tasks.splice(index, 1); if (!saveTasks()) return; document.getElementById('task-calendar-edit').hidden = true; renderTaskCalendar(); renderTaskCalendarDetails(selectedTaskCalendarDate); renderTaskRows(); refreshOverview(); updateTaskCounters(); applyTaskFilters(); });
document.getElementById('task-calendar-edit')?.addEventListener('submit', event => { event.preventDefault(); const task = tasks.find(item => item.id === document.getElementById('task-calendar-edit-id').value); const date = localDateKey(document.getElementById('task-calendar-edit-date').value); if (!task || !date) return; task.deadlineISO = date; task.deadline = new Date(`${date}T00:00:00`).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' }); task.status = document.getElementById('task-calendar-edit-status').value; task.comment = document.getElementById('task-calendar-edit-comment').value.trim(); if (!saveTasks()) return; document.getElementById('task-calendar-edit').hidden = true; document.getElementById('task-calendar-edit-delete').hidden = true; taskCalendarMonth = new Date(Number(date.slice(0, 4)), Number(date.slice(5, 7)) - 1, 1); selectedTaskCalendarDate = date; renderTaskCalendar(); renderTaskCalendarDetails(date); renderTaskRows(); refreshOverview(); updateTaskCounters(); applyTaskFilters(); });
function taskRows() {
  return [...document.querySelectorAll('#full-task-list .task-record')];
}
function renderTaskRows() {
  const list = document.getElementById('full-task-list');
  taskRows().forEach(row => row.remove());
  const empty = document.getElementById('task-empty');
  tasks.forEach(task => {
    const record = document.createElement('button');
    record.type = 'button';
    record.className = 'full-row task-record';
    record.dataset.taskStatus = task.status || 'work';
    record.dataset.taskMinistry = task.ministryCode || 'general';
    record.dataset.taskCouncil = task.council;
    record.dataset.taskId = task.id;
    record.dataset.taskComment = task.comment || '';
    const view = taskStatusView[record.dataset.taskStatus] || taskStatusView.work;
    const main = document.createElement('div');
    const priority = document.createElement('span');
    priority.className = `priority ${view.priority}`;
    priority.textContent = view.symbol;
    const title = document.createElement('strong');
    title.textContent = task.title;
    const source = document.createElement('small');
    source.textContent = `${councilNames[task.council]} · №${task.id}`;
    main.append(priority, title, source);
    const owner = document.createElement('span');
    owner.textContent = task.owner || 'Не назначен';
    const date = document.createElement('span');
    date.textContent = task.deadline || 'Срок не задан';
    const status = document.createElement('span');
    status.className = `status-pill ${view.pill}`;
    status.textContent = view.label;
    record.append(main, owner, date, status);
    list.insertBefore(record, empty);
  });
}
function refreshOverview() {
  const total = tasks.length;
  const risk = tasks.filter(task => task.status === 'risk').length;
  const done = tasks.filter(task => task.status === 'done').length;
  const work = tasks.filter(task => task.status !== 'done').length;
  document.getElementById('overview-count').textContent = total;
  document.getElementById('tasks-count').textContent = total;
  document.getElementById('overview-in-work').textContent = work;
  document.getElementById('overview-risk').textContent = risk;
  document.getElementById('overview-total').textContent = total;
  document.getElementById('overview-done').innerHTML = `${total ? Math.round(done / total * 100) : 0}<span class="unit">%</span>`;
  const overviewList = document.getElementById('task-list');
  overviewList.replaceChildren();
  const urgent = tasks.filter(task => task.status === 'risk');
  if (!urgent.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = total ? 'Нет поручений, требующих внимания.' : 'Поручения появятся после загрузки или создания конкретных записей.';
    overviewList.append(empty);
  } else {
    urgent.forEach(task => {
      const row = document.createElement('article');
      row.className = 'task-row risk';
      row.innerHTML = `<div class="priority high">!</div><div class="task-main"><div class="task-meta"><span>${councilNames[task.council]}</span><time>${task.deadline || 'срок не задан'}</time></div><h3></h3><p>Требует внимания ответственного.</p></div><span class="status-pill red">Высокий риск</span>`;
      row.querySelector('h3').textContent = task.title;
      overviewList.append(row);
    });
  }
}
function updateTaskCounters() {
  const rows = taskRows();
  const counts = {
    all: rows.length,
    dnc: rows.filter(row => row.dataset.taskCouncil === 'dnc').length,
    ssp: rows.filter(row => row.dataset.taskCouncil === 'ssp').length,
    ntr: rows.filter(row => row.dataset.taskCouncil === 'ntr').length,
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
      || ['dnc', 'ssp', 'ntr'].includes(activeTaskTab) && row.dataset.taskCouncil === activeTaskTab
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
  document.getElementById('task-detail-comment').value = row.dataset.taskComment || '';
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
  const task = tasks.find(item => item.id === openedTaskRow.dataset.taskId);
  if (task) {
    task.status = status;
    task.comment = document.getElementById('task-detail-comment').value.trim();
    saveTasks();
  }
  renderTaskRows();
  refreshOverview();
  updateTaskCounters();
  applyTaskFilters();
}));
document.getElementById('task-detail-comment').addEventListener('input', event => {
  if (!openedTaskRow) return;
  openedTaskRow.dataset.taskComment = event.target.value;
  const task = tasks.find(item => item.id === openedTaskRow.dataset.taskId);
  if (task) { task.comment = event.target.value; saveTasks(); }
});
renderTaskRows();
renderTaskCalendar();
updateTaskCounters();
applyTaskFilters();
refreshOverview();

const modal = document.querySelector('#modal');
function openModal() { modal.classList.add('show'); setTimeout(() => document.querySelector('#task-title').focus(), 100); }
document.querySelectorAll('#new-task,#new-task-2').forEach(button => button.addEventListener('click', openModal));
document.querySelector('#modal-close').addEventListener('click', () => modal.classList.remove('show'));
modal.addEventListener('click', event => { if (event.target === modal) modal.classList.remove('show'); });
document.querySelector('#create-task').addEventListener('click', () => {
  const title = document.querySelector('#task-title').value.trim();
  if (!title) { document.querySelector('#task-title').focus(); return; }
  const createdFromTasks = document.getElementById('tasks-view').classList.contains('active');
  const ministryName = document.querySelector('#task-ministry').value;
  const council = document.getElementById('task-council-create').value;
  const ownerValue = document.getElementById('task-owner').value;
  const deadlineValue = document.getElementById('task-deadline').value;
  const task = {
    id: `П-${String(Date.now()).slice(-3)}`,
    title,
    ministryCode: ministryCodes[ministryName] || 'general',
    council,
    owner: ownerValue === 'Выберите исполнителя' ? 'Не назначен' : ownerValue,
    deadline: deadlineValue ? new Date(`${deadlineValue}T00:00:00`).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' }) : 'Срок не задан',
    deadlineISO: deadlineValue || '',
    status: 'work',
    comment: ''
  };
  tasks.push(task);
  if (!saveTasks()) { tasks.pop(); return; }
  modal.classList.remove('show');
  renderTaskRows();
  refreshOverview();
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

function renderOverviewMedia() {
  document.getElementById('overview-media-count').textContent = mediaDrafts.length;
  const container = document.getElementById('overview-media-items');
  container.replaceChildren();
  if (!mediaDrafts.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = 'Материалов пока нет. Передайте текст на редактирование в медиа-мастерской.';
    container.append(empty);
    return;
  }
  const latest = mediaDrafts.slice().sort((a, b) => (Date.parse(b.updated) || 0) - (Date.parse(a.updated) || 0));
  latest.slice(0, 3).forEach(draft => {
    const row = document.createElement('div');
    row.className = 'media-next';
    const body = document.createElement('div');
    const meta = document.createElement('small');
    meta.textContent = `${draft.ministry || 'Министерство не указано'} · ${draft.status || 'Черновик'}`;
    const title = document.createElement('strong');
    title.textContent = draft.title || 'Без заголовка';
    body.append(meta, title);
    row.append(body);
    container.append(row);
  });
}
function analyticsData() {
  const savedTasks = load('kontur-tasks-v1', []);
  const savedDrafts = load('kontur-media-drafts-v1', []);
  const actualTasks = Array.isArray(savedTasks) ? savedTasks.filter(item => item && typeof item === 'object') : [];
  const actualDrafts = Array.isArray(savedDrafts) ? savedDrafts.filter(item => item && typeof item === 'object') : [];
  const done = actualTasks.filter(task => task.status === 'done').length;
  return { tasks: actualTasks, total: actualTasks.length, done, percent: actualTasks.length ? Math.round(done / actualTasks.length * 100) : 0, media: actualDrafts.length };
}
function renderAnalytics() {
  const data = analyticsData();
  document.getElementById('analytics-tasks').textContent = data.total;
  document.getElementById('analytics-done').textContent = data.percent;
  document.getElementById('analytics-done-detail').textContent = `Исполнено ${data.done} из ${data.total}`;
  document.getElementById('analytics-media').textContent = data.media;
  const container = document.getElementById('analytics-recommendations');
  container.replaceChildren();
  const signals = [];
  for (const task of data.tasks) {
    if (task.status === 'done') continue;
    if (!task.owner || task.owner === 'Не назначен' || task.owner === 'Выберите исполнителя') {
      signals.push({ title: `Назначить ответственного: ${task.title || 'Поручение'}`, text: 'У этого поручения не назначен исполнитель.' });
    }
    if (task.status === 'risk') {
      signals.push({ title: `Проверить исполнение: ${task.title || 'Поручение'}`, text: 'Поручение отмечено статусом риска. Уточните срок и ход исполнения.' });
    }
  }
  if (!signals.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = data.total || data.media ? 'По текущим поручениям нет сигналов риска или отсутствия ответственного.' : 'Данных пока нет. Показатели появятся по мере работы платформы.';
    container.append(empty);
  }
  signals.forEach((signal, index) => {
    const row = document.createElement('div');
    row.className = 'recommendation';
    const number = document.createElement('span');
    number.className = 'rec-number';
    number.textContent = String(index + 1).padStart(2, '0');
    const body = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = signal.title;
    const text = document.createElement('p');
    text.textContent = signal.text;
    body.append(title, text);
    const button = document.createElement('button');
    button.className = 'text-button';
    button.textContent = 'К поручениям →';
    button.addEventListener('click', () => showView('tasks'));
    row.append(number, body, button);
    container.append(row);
  });
}
window.addEventListener('storage', event => {
  if (event.key === null || ['kontur-tasks-v1', 'kontur-media-drafts-v1'].includes(event.key)) renderAnalytics();
});
document.getElementById('download-analytics').addEventListener('click', () => {
  const data = analyticsData();
  const report = `Отчет РИТМ — ${new Date().toLocaleString('ru-RU')}\n\nВсего поручений: ${data.total}\nИсполнено: ${data.done}\nДоля исполненных: ${data.percent}%\nМедиаматериалы: ${data.media}\n`;
  const url = URL.createObjectURL(new Blob([report], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'Аналитика РИТМ.txt';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
renderAnalytics();
const requestedView = window.location.hash.slice(1);
if (labels[requestedView]) showView(requestedView);
