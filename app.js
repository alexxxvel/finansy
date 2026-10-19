/* Учёт финансов: экраны. «Главная», «История», «Цели» (с разделом «Кредиты»), «Аналитика», лист добавления, первый запуск, настройки (свои категории, перенос из заметок, копия данных).
   Движение: лист на пружине (её можно перехватить пальцем), сумма досчитывается, полосы растут; частые действия (клавиши) без анимации.
   Стиль ES5: страница запускается и на старых встроенных браузерах Telegram. */
(function () {
  'use strict';

  var F = window.FIN, S = window.STORE;
  var root = document.getElementById('root');
  var tg = (window.Telegram && window.Telegram.WebApp) || null;
  var inTg = !!(tg && tg.platform && tg.platform !== 'unknown');
  // окно Telegram есть, а его скрипт не загрузился: писать в память браузера нельзя, записи разойдутся с облаком
  var bridgeOnly = !inTg && !!(window.TelegramWebviewProxy && typeof window.TelegramWebviewProxy.postEvent === 'function');
  var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var VERSION = '941010058d'; // при выкладке сюда подставляется версия файлов: по ней видно, не показывает ли Telegram старую страницу

  var ICONS = {
    cart: '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>',
    car: '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>',
    shirt: '<path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/>',
    drop: '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>',
    phone: '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/>',
    repeat: '<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>',
    bag: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
    spark: '<path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/>',
    'case': '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
    laptop: '<path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45L4 16"/>',
    gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"/>',
    dots: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
    wallet: '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
    home: '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    card: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
    heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
    bus: '<path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    paw: '<circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="20" cy="16" r="2"/><path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"/>',
    box: '<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
    cash: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/>',
    star: '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>',
    cup: '<path d="M10 2v2M14 2v2M6 2v2M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1"/>',
    ticket: '<path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/>',
    book: '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"/>',
    file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/>',
    pill: '<path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/>',
    plane: '<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>',
    tool: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
    gear: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
    grip: '<path d="M4 9h16M4 15h16"/>',
    left: '<path d="m15 6-6 6 6 6"/>',
    down: '<path d="m6 9 6 6 6-6"/>',
    right: '<path d="m9 6 6 6-6 6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    close: '<path d="M18 6 6 18M6 6l12 12"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    lock: '<rect x="5" y="11" width="14" height="9.5" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    plane: '<path d="M21 4 3 11l6.5 2.5L18 7l-6.5 7.5V20l3.5-4 4 3z"/>',
    'face-good': '<circle cx="12" cy="12" r="9.25"/><path d="M8.75 9.75v.5M15.25 9.75v.5"/><path d="M8.25 14c.9 1.5 2.2 2.25 3.75 2.25S14.85 15.5 15.75 14"/>',
    'face-meh': '<circle cx="12" cy="12" r="9.25"/><path d="M8.75 9.75v.5M15.25 9.75v.5"/><path d="M8.75 15h6.5"/>',
    'face-bad': '<circle cx="12" cy="12" r="9.25"/><path d="M8.75 9.75v.5M15.25 9.75v.5"/><path d="M8.25 16.25c.9-1.5 2.2-2.25 3.75-2.25s2.85.75 3.75 2.25"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    back: '<path d="M21 5H9l-6 7 6 7h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1ZM17 9l-6 6M11 9l6 6"/>'
  };

  // ---------- мелкие помощники ----------
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) { n.className = cls; }
    if (text !== undefined && text !== null) { n.textContent = text; }
    return n;
  }
  function icon(name, cls) { // значки — только из набора выше (не из данных), поэтому innerHTML безопасен
    var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', '0 0 24 24');
    s.setAttribute('aria-hidden', 'true');
    if (cls) { s.setAttribute('class', cls); }
    s.innerHTML = Object.prototype.hasOwnProperty.call(ICONS, name) ? ICONS[name] : ICONS.dots; // имя из данных («constructor») не достанет ничего, кроме своего набора
    return s;
  }
  function btn(cls, text) { var b = el('button', cls, text); b.type = 'button'; return b; }
  function add(parent) { for (var i = 1; i < arguments.length; i++) { if (arguments[i]) { parent.appendChild(arguments[i]); } } return parent; }
  function clear(n) { while (n.firstChild) { n.removeChild(n.firstChild); } }
  function haptic(kind) {
    try {
      if (!inTg || !tg.HapticFeedback) { return; }
      if (kind === 'ok') { tg.HapticFeedback.notificationOccurred('success'); }
      else if (kind === 'err') { tg.HapticFeedback.notificationOccurred('error'); }
      else { tg.HapticFeedback.selectionChanged(); }
    } catch (e) { /* вибрации нет — работаем без неё */ }
  }
  function tgTry(fn) { try { if (inTg) { fn(); } } catch (e) { /* старый Telegram: метода нет */ } }
  /** короткий предлог не остаётся в конце строки: после него неразрывный пробел */
  function nb(s) { return String(s).replace(/(^|[\s«(])(в|на|за|из|к|с|у|о|и|а|не|по|до|от|под)\s/gi, '$1$2' + F.NB); }

  // ---------- состояние ----------
  var st = {
    month: F.monthOf(F.today()), months: [], ops: [], sum: F.summarize([]),
    carry: 0, partial: false, // остаток на начало месяца: доходы минус траты всех прошлых месяцев
    all: {}, cfg: {}, prev: F.summarize([]), balance: 0, // все записи по месяцам, настройки, сводка прошлого месяца, накоплено за всё время
    budget: { a: 0, off: 0 }, // бюджет на месяц (ключ bud): a — сумма, off — подсказку убрали
    limits: {}, // лимиты на категории (ключ lim): { id: копейки в месяц }
    pays: { list: [], hide: '' }, // платежи месяца (ключ pay)
    home: '', // значок на экране телефона: ответ Telegram (unsupported / unknown / added / missed)
    tab: 'month', sect: 'goals', stats: { kind: 'month', at: '' }, more: false, shown: 0, loaded: false, error: '' // sect: раздел вкладки «Цели» — цели или кредиты
  };
  var store = null;
  var ui = { y: 0, h: 0, raf: 0, open: false, kind: '', back: null }; // back: куда вернёт «Назад», если лист открыт из другого листа
  var entry = null; // состояние листа добавления
  var lastBlur = 0; // когда поле ввода последний раз потеряло фокус

  // ---------- каркас ----------
  var stage = el('div', 'stage');
  var view = el('main', 'view');
  var dock = el('footer', 'dock');
  var scrim = el('div', 'scrim');
  var modal = el('section', 'modal');
  var toastEl = el('div', 'toast');
  modal.setAttribute('aria-hidden', 'true');
  toastEl.setAttribute('role', 'status');

  var sim = null; // только для теста: изображает клавиатуру телефона
  var K = 1; // крупный текст: во сколько раз приложение крупнее экрана; касания и замеры экрана делятся на K (они в пикселях экрана, раскладка — в своих)
  /** Высота окна и клавиатура телефона — одним расчётом. Клавиатура ведёт себя по-разному:
      iPhone в Telegram сообщает приложению уменьшенную высоту окна (страница сама становится ниже), обычный браузер кладёт клавиатуру поверх страницы,
      Android сжимает само окно. Поэтому лист поднимается ровно на ту часть страницы, которая осталась под клавиатурой: нижний край страницы минус нижний край видимой области.
      11.10.2026 обе поправки применялись сразу, и от листа цели на iPhone оставалась полоска. */
  function fit() {
    var inner = window.innerHeight, vv = window.visualViewport;
    var visible = vv ? vv.offsetTop + vv.height : inner;
    var stable = inTg && tg.viewportStableHeight ? tg.viewportStableHeight : inner;
    if (sim) { // режимы: 'overlay' клавиатура поверх страницы, 'tg' Telegram уменьшил высоту окна сам
      visible = inner - sim.px;
      if (sim.mode === 'tg') { stable = inner - sim.px; }
    }
    var h = Math.min(inner, stable);
    document.documentElement.style.setProperty('--vh', h + 'px');
    // большой лист (добавление) держит высоту, которая была до клавиатуры: иначе, пока печатают заметку, страница становится ниже и сумма наезжает на категории
    if (!typing()) { root.style.setProperty('--full', (h / K - 10) + 'px'); }
    var kb = Math.max(0, Math.round((root.getBoundingClientRect().top + h - visible) / K));
    root.style.setProperty('--kb', (kb > 40 ? kb : 0) + 'px');
    if (ui.open) { ui.h = modal.offsetHeight; reveal(visible); }
  }
  /** поле, в которое печатают, должно быть видно над клавиатурой: прокручиваем к нему содержимое листа */
  function reveal(visible) {
    var a = document.activeElement;
    if (!typing() || !a.closest) { return; }
    var pick = a.closest('.pick');
    if (!pick) { return; }
    var pr = pick.getBoundingClientRect(), ar = a.getBoundingClientRect(), bottom = Math.min(pr.bottom, visible);
    if (ar.bottom > bottom - 12 || ar.top < pr.top + 4) { pick.scrollTop += (ar.top - pr.top - Math.max(8, (bottom - pr.top - ar.height) / 3)) / K; }
  }
  function typing() { var a = document.activeElement; return !!a && /^(INPUT|TEXTAREA)$/.test(a.tagName) && a.type !== 'date'; }

  /** сообщение внизу; с кнопкой — это отмена только что сделанного (случайную запись убрать одним касанием) */
  function toast(text, action, fn, ms) {
    clear(toastEl);
    var lines = nb(text).split('\n'), body = el('span', '', lines.length > 1 ? null : lines[0]);
    if (lines.length > 1) { add(body, el('b', '', lines[0]), el('small', '', lines[1])); } // две смысловые строки: что случилось и что с записями
    toastEl.appendChild(body);
    if (action) {
      var b = btn('toast__act', action);
      b.id = 'toastAct';
      b.addEventListener('click', function () { toastEl.className = 'toast'; fn(); });
      toastEl.appendChild(b);
    }
    toastEl.className = 'toast is-on' + (action ? ' toast--act' : '') + (ui.open && ui.kind === 'cats' ? ' toast--dock' : ''); // в листе с нижней кнопкой сообщение стоит над её чертой
    clearTimeout(toast.t);
    toast.t = setTimeout(function () { toastEl.className = 'toast'; }, ms || (action ? 7000 : 3800));
  }
  function explain(err) {
    if (err === 'timeout') { return 'Нет ответа от Telegram. Проверьте связь и повторите.'; }
    if (err === 'corrupt') { return 'Записи этого месяца не читаются. Ничего не изменено.'; }
    if (err === 'invalid') { return 'Запись заполнена не полностью.'; }
    return 'Не сохранилось. Проверьте связь и повторите.';
  }

  // ---------- нижние капсулы ----------
  /** подпись синей кнопки: на вкладке «Цели» она называет своё действие раздела, а не общее «Добавить»
      (замечание разработчика 19.10.2026: рядом с «Новая цель» «Добавить» путала) */
  var addText = null;
  function addLabel() {
    if (st.tab !== 'goals') { return 'Добавить'; }
    if (st.sect === 'credits') { return activeCredits().length ? 'Внести платёж' : 'Новый кредит'; }
    if (st.sect === 'debts') { return 'Записать долг'; }
    return F.GOALS.length ? 'Отложить' : 'Новая цель';
  }
  function syncAdd() { if (addText) { addText.nodeValue = addLabel(); } }
  /** низ (решение разработчика 14.10.2026): широкая синяя «Добавить» с подписью над четырьмя вкладками */
  function paintDock() {
    clear(dock);
    dock.className = 'dock dock--stack';
    var tabs = el('nav', 'tabs tabs--4');
    tabs.setAttribute('aria-label', 'Разделы');
    [['month', 'Главная'], ['history', 'История'], ['goals', 'Цели'], ['stats', 'Аналитика']].forEach(function (t) {
      var b = btn('', t[1]);
      b.setAttribute('data-tab', t[0]);
      if (st.tab === t[0]) { b.setAttribute('aria-current', 'page'); }
      b.addEventListener('click', function () {
        if (st.tab === t[0]) { return; }
        st.tab = t[0];
        find.on = false; // поиск живёт, пока открыта «История»
        find.q = '';
        stage.classList.remove('is-finding');
        haptic();
        paintDock();
        paint(true);
      });
      tabs.appendChild(b);
    });
    var a = btn('btn btn--add');
    a.id = 'addBtn';
    addText = document.createTextNode(addLabel());
    add(a, icon('plus'), addText);
    a.addEventListener('click', function () {
      if (st.tab !== 'goals') { openEntry(null); return; }
      if (st.sect === 'credits') { payOrNew(); return; } // в разделе кредитов плюс вносит платёж; кредитов нет — заводит первый
      if (st.sect === 'debts') { openEntry(null, { kind: 'give', fresh: true }); return; } // в разделе долгов — новая запись долга с выбором человека
      // на вкладке «Цели» плюс сразу откладывает; целей нет — заводит первую
      if (!F.GOALS.length) { openGoalEdit(null, null, null); } else { openEntry(null, { kind: 's', cat: F.GOALS.length === 1 ? 'g_' + F.GOALS[0].id : '' }); }
    });
    add(dock, a, tabs);
  }

  // ---------- главная ----------
  function monthButton() {
    var b = btn('month');
    b.id = 'monthBtn';
    add(b, document.createTextNode(F.monthLabel(st.month)), icon('down'));
    b.addEventListener('click', openMonths);
    return b;
  }
  /** шапка экрана: месяц слева, шестерёнка настроек справа */
  function gearBtn() {
    var gear = btn('gear');
    gear.id = 'gearBtn';
    gear.setAttribute('aria-label', 'Настройки');
    gear.appendChild(icon('gear'));
    gear.addEventListener('click', function () { openSettings(); });
    return gear;
  }
  function monthBar() {
    var head = el('div', 'bar');
    add(head, monthButton(), gearBtn());
    return head;
  }

  /** начальный размер крупной суммы: 68 px до шести цифр, с семи — сразу 44. Дальше решает fitSum по измеренной ширине (14.10.2026: по числу цифр пятизначная сумма была на четверть тише, чем помещалась) */
  function sumClass(minor) {
    var n = String(Math.floor(Math.abs(minor) / 100)).length;
    return 'spent__sum' + (n >= 7 ? ' is-s' : '');
  }
  /** крупная сумма не помещается в ширину (узкий телефон, крупный шрифт системы) — уменьшается ещё на ступень. Мерится готовая строка, а не число цифр */
  function fitSum(p) {
    var steps = ['', ' is-m', ' is-s'], i = p.className.indexOf('is-s') >= 0 ? 2 : p.className.indexOf('is-m') >= 0 ? 1 : 0;
    while (i < 2 && p.scrollWidth > p.clientWidth + 1) { i++; p.className = 'spent__sum' + steps[i]; }
  }
  function setSum(node, minor) {
    var p = F.fmtParts(minor);
    node.whole.textContent = p.sign + p.whole;
    node.frac.textContent = p.frac;
  }
  /** сумма досчитывается от прошлого значения к новому: видно, что изменилось */
  function tweenSum(node, from, to) {
    cancelAnimationFrame(tweenSum.raf);
    if (reduce || from === to) { setSum(node, to); return; }
    var t0 = performance.now(), ms = 380;
    (function step(now) {
      var k = Math.min(1, (now - t0) / ms), e = 1 - Math.pow(1 - k, 4);
      setSum(node, Math.round(from + (to - from) * e));
      if (k < 1) { tweenSum.raf = requestAnimationFrame(step); }
    })(t0);
  }

  function rowNote(parent, text) { if (text) { parent.appendChild(document.createTextNode(' ')); parent.appendChild(el('small', '', text)); } }

  /** строка записи: в «Истории» со значком и названием категории, в листе категории — с датой */
  function opRow(op, bare) {
    var dict = F.dict(op.k, op.c), b = btn('op' + (bare ? ' op--bare' : '')), goal = F.isGoalOp(op), debt = F.isDebtOp(op);
    b.setAttribute('data-id', op.id);
    // запись цели: «Отложено» или «Снято», название цели серым; в «Потрачено» и в доходы она не входит
    var name = el('span', '', bare ? F.dayLabel(op.d) : goal ? (op.k === 'e' ? 'Отложено' : 'Снято') : dict.name);
    rowNote(name, [goal && !bare ? dict.name : '', debt ? (op.k === 'e' ? 'отдано' : 'получено') : '', op.u !== 'BYN' ? F.fmtShort(op.a) + F.NB + op.u : '', op.n || ''].filter(Boolean).join(', ')); // сумма в валюте первой: длинную заметку строка обрежет, а её нет
    add(b, bare ? null : icon(dict.icon), name, el('data', op.k === 'i' ? 'is-plus' : '', (op.k === 'i' ? '+' : '') + F.fmt(F.bynOf(op))), icon('right', 'share__go'));
    b.addEventListener('click', function () { openEntry(op); });
    return b;
  }
  /** строка категории или источника: нажатие открывает её записи */
  function shareRow(kind, c, share, n) {
    var li = el('li'), b = btn('share');
    b.setAttribute('data-cat', c.id);
    var name = el('span', '', c.name), lim = kind === 'e' ? st.limits[c.id] : 0;
    rowNote(name, c.note);
    if (lim) { // лимит (вариант А, решение разработчика 17.10.2026): тихая строка под названием и кольцо; шкала строки остаётся долей трат
      b.className = 'share share--lim' + (c.sum > lim ? ' is-over' : '');
      name.appendChild(limitNote(c.sum, lim));
    }
    add(b, icon(c.icon), name, el('data', '', F.fmt(c.sum)), icon('right', 'share__go'));
    if (share !== null) {
      var track = el('i'), f = el('b');
      f.style.transform = 'scaleX(' + share.toFixed(4) + ')';
      f.style.opacity = String([1, 0.76, 0.56][n] || 0.45);
      track.appendChild(f);
      b.appendChild(track);
    }
    b.addEventListener('click', function () { var k = kind === 'e' ? F.creditOf(c.id) : null; if (k) { openCreditView(k.id, null); } else { openCategory(kind, c.id); } });
    li.appendChild(b);
    return li;
  }
  function paintMonth(animate) {
    var s = st.sum, was = st.shown;
    st.shown = s.spent;

    var spent = el('section', 'spent');
    var sumEl = el('p', 'spent__sum');
    var node = { whole: el('span'), frac: el('i') };
    sumEl.id = 'spentSum';
    sumEl.className = sumClass(s.spent);
    add(sumEl, node.whole, node.frac, el('abbr', '', 'BYN'));
    add(spent, el('p', 'spent__label', 'Потрачено'), sumEl);

    // шкала: дорожка = доход (при перерасходе и без дохода — сами траты); не больше трёх сегментов
    // отложенное на цели потратить нельзя: оно вычитается из доступного; снятое с целей сверх отложенного, наоборот, добавляется
    var back = Math.max(0, s.taken - s.saved), put = Math.max(0, s.saved - s.taken), B = budgetOn() ? st.budget.a : 0;
    var dnet = s.got - s.lent; // долги (решение 19.10.2026): взятое и возвращённое вам добавляется к доступному, отданное вычитается; в «Потрачено» не входит
    var avail = s.income + st.carry + back + Math.max(0, dnet), left = avail - s.spent - put - Math.max(0, -dnet); // доступно в этом месяце: доход, остаток с прошлых и снятое из накоплений
    // бюджет (решение 17.10.2026): если задан, шкала считается от него, даже когда доходы записаны — это сумма, которую человек решил тратить сам
    if (B) { avail = B; left = B - s.spent; }
    var noBase = !B && !s.income && !st.carry && !back && dnet <= 0; // ни дохода, ни бюджета: шкалу не с чем сравнить — её нет (залитая читалась как «всё потрачено»)
    var base = B ? Math.max(B, s.spent, 1) : Math.max(avail, s.spent + put + Math.max(0, -dnet), 1);
    var bar = el('div', 'spent__bar');
    bar.setAttribute('role', 'img');
    bar.setAttribute('aria-label', avail > 0 ? 'Потрачено ' + Math.round(s.spent / avail * 100) + ' процентов доступного' : 'Доход ещё не внесён');
    var segs = [];
    if (s.cats.length <= 3) { segs = s.cats.map(function (c) { return c.sum; }); }
    else { segs = [s.cats[0].sum, s.cats[1].sum, s.spent - s.cats[0].sum - s.cats[1].sum]; }
    var fill = el('div', 'spent__fill');
    segs.forEach(function (v) { var i = el('i'); i.style.width = (v / base * 100).toFixed(2) + '%'; fill.appendChild(i); });
    bar.appendChild(fill);
    if (B && s.spent > B) { // перерасход: за риской конца бюджета — самый тёмный отрезок
      var over = el('i', 'spent__over'), mark = el('b', 'spent__limit');
      over.style.left = (B / base * 100).toFixed(2) + '%';
      over.style.width = ((s.spent - B) / base * 100).toFixed(2) + '%';
      mark.style.left = (B / base * 100).toFixed(2) + '%';
      bar.className = 'spent__bar spent__bar--over'; // риска выходит за шкалу сверху и снизу
      add(bar, over, mark);
    }
    if (put > 0 && !B) { // траты растут слева, отложенное отнимает доступное справа контурным отрезком: «осталось» — промежуток между ними
      var sv = el('i', 'spent__saved');
      sv.style.width = Math.max(3, put / base * 100).toFixed(2) + '%';
      bar.className = 'spent__bar spent__bar--saved';
      bar.appendChild(sv);
    }
    var legend = el('div', 'spent__legend'), tip = noBase && s.spent && !st.budget.off && st.month === F.monthOf(F.today());
    if (B) {
      var baseBtn = btn('spent__base');
      baseBtn.id = 'budgetLine';
      add(baseBtn, document.createTextNode('из бюджета' + F.NB + F.fmt(B)), icon('right'));
      baseBtn.addEventListener('click', function () { openBudget(null); });
      add(legend, baseBtn, left < 0 ? el('span', 'is-over', 'перерасход ' + F.fmt(-left)) : el('span', 'is-left', 'осталось ' + F.fmt(left)));
    } else if (noBase) { if (!tip) { add(legend, el('span', '', s.spent || put ? 'доход ещё не внесён' : 'записей в этом месяце нет')); } }
    else {
      add(legend, el('span', '', avail > 0 ? 'из' + F.NB + F.fmt(avail) : (s.income ? 'из' + F.NB + F.fmt(s.income) : 'доход ещё не внесён')));
      add(legend, left < 0 ? el('span', 'is-over', 'перерасход ' + F.fmt(-left)) : el('span', 'is-left', 'осталось ' + F.fmt(left)));
    }
    add(spent, noBase ? null : bar, tip ? budgetTip() : legend);
    var days = F.daysLeft(st.month), per = F.perDay(left, days);
    // сколько можно тратить в день, чтобы остатка хватило до конца месяца; рядом с «отложено» слово BYN опускается, иначе строка не помещается
    var dayText = !per ? '' : days === 1 ? 'сегодня последний день месяца' : 'по' + F.NB + F.fmtDay(per) + F.NB + (put > 0 ? '' : 'BYN' + F.NB) + 'в' + F.NB + 'день, ещё ' + days + F.NB + F.plural(days, 'день', 'дня', 'дней');
    if (put > 0) {
      var row2 = el('div', 'spent__legend spent__legend--2'), putBtn = btn('spent__mark', 'отложено ' + F.fmt(put));
      putBtn.id = 'putBtn';
      putBtn.addEventListener('click', openGoalsList); // короткий взгляд на цели, не уходя с месяца
      add(row2, putBtn);
      if (dayText) { var d2 = el('span', '', dayText); d2.id = 'perDay'; row2.appendChild(d2); }
      spent.appendChild(row2);
    } else if (dayText) {
      var dayEl = el('p', 'spent__day', dayText);
      dayEl.id = 'perDay';
      spent.appendChild(dayEl);
    }
    if (B && left < 0) { // бюджет кончился: в какой день траты месяца его перешли
      var gone = budgetGone(B), goneEl = el('p', 'spent__day', gone ? nb('бюджет кончился ' + F.dayLabel(gone).toLowerCase()) : '');
      goneEl.id = 'budgetGone';
      if (gone) { spent.appendChild(goneEl); }
    }
    if (st.month === F.monthOf(F.today())) {
      var payNode = payCard();
      if (payNode) { spent.appendChild(payNode); }
      // напоминание о кредите включает сам человек; когда заведены платежи месяца, кредит — в их списке, и отдельной строки нет (о кредите одна строка, не две)
      if (!(st.pays.list || []).length) { F.CREDITS.forEach(function (k) { if (remindDue(k, F.creditState(k, st.all, st.month))) { spent.appendChild(remindRow(k, false)); } }); }
      if (!spent.querySelector('.remind')) { var saveNode = saveCard(); if (saveNode) { spent.appendChild(saveNode); } } // итог прошлого месяца — после платежей и кредитов
      if (!spent.querySelector('.remind')) { var homeNode = homeCard(); if (homeNode) { spent.appendChild(homeNode); } } // больше одной карточки сразу не бывает
      if (!spent.querySelector('.remind')) { var moodNode = moodCard(); if (moodNode) { spent.appendChild(moodNode); } } // вопрос про приложение — последним
    }

    var sheet = el('div', 'sheet');
    var cats = el('section', 'cats');
    var catsHead = el('div', 'cats__head');
    catsHead.appendChild(el('h2', '', 'Куда ушло'));
    if (st.prev.spent) { // для сравнения: сколько ушло за весь прошлый месяц
      var pv = el('span', '', F.inMonth(F.prevMonth(st.month)) + ' ' + F.fmt(st.prev.spent));
      pv.id = 'prevTotal';
      catsHead.appendChild(pv);
    }
    cats.appendChild(catsHead);
    if (!s.cats.length) {
      cats.appendChild(el('p', 'empty', nb('Трат пока нет. Нажмите «Добавить» внизу, чтобы внести первую.')));
      if (!st.months.length) { // записей нет совсем: тому, кто вёл траты в заметках, не нужно начинать с нуля
        var fromNotes = btn('link link--empty', 'Перенести список из заметок');
        fromNotes.id = 'notesLink';
        fromNotes.addEventListener('click', function () { openNotes(null); });
        cats.appendChild(fromNotes);
      }
    } else {
      var all = s.cats.length <= 5 || st.more;
      var list = el('ul', 'shares');
      (all ? s.cats : s.cats.slice(0, 4)).forEach(function (c, n) { list.appendChild(shareRow('e', c, c.sum / s.spent, n)); });
      cats.appendChild(list);
      if (s.cats.length > 5) {
        var rest = s.cats.slice(4), restSum = 0;
        rest.forEach(function (c) { restSum += c.sum; });
        var more = btn('more');
        more.id = 'moreBtn';
        if (st.more) { add(more, el('span', '', 'Свернуть')); }
        else { add(more, el('span', '', 'Ещё ' + rest.length + ' ' + F.plural(rest.length, 'категория', 'категории', 'категорий')), el('data', '', F.fmt(restSum)), icon('right')); }
        more.addEventListener('click', function () { st.more = !st.more; paint(false); });
        cats.appendChild(more);
      }
    }
    var srcs = el('section', 'cats cats--in');
    srcs.appendChild(el('h2', '', 'Откуда пришло'));
    if (!s.srcs.length && !st.carry && !back) {
      srcs.appendChild(el('p', 'empty', 'Доходов в этом месяце ещё нет.'));
    } else {
      var plain = el('ul', 'plain');
      if (st.carry) { // перешло с прошлых месяцев: плюсом остаток, минусом перерасход
        var cr = el('li', 'plain__carry');
        cr.id = 'carryRow';
        add(cr, icon('wallet'), el('span', '', 'Остаток на начало месяца'), el('data', '', F.fmt(st.carry)));
        plain.appendChild(cr);
      }
      if (back) { // с целей снято больше, чем отложено: эти деньги снова можно тратить
        var tk = el('li', 'plain__carry');
        tk.id = 'takenRow';
        add(tk, icon('wallet'), el('span', '', 'Из накоплений'), el('data', '', F.fmt(back)));
        plain.appendChild(tk);
      }
      s.srcs.forEach(function (c) { plain.appendChild(shareRow('i', c, null, 0)); });
      srcs.appendChild(plain);
    }
    add(sheet, cats, srcs);
    if (st.partial) { sheet.appendChild(el('p', 'note', 'Часть записей прошлых месяцев не читается: остаток на начало месяца может быть неточным.')); }
    if (store && store.kind === 'local') { sheet.appendChild(el('p', 'note', 'Пробный режим вне Telegram: записи хранятся только в этом браузере.')); }

    clear(view);
    add(view, monthBar(), spent, sheet);
    setSum(node, s.spent);
    fitSum(sumEl); // размер по готовой сумме: досчёт идёт от меньшего числа

    if (animate && !reduce) {
      tweenSum(node, was, s.spent);
      fill.className = 'spent__fill is-in';
      sheet.className = 'sheet is-in';
    } else { setSum(node, s.spent); }
  }


  // ---------- платежи месяца (вариант В, решение разработчика 17.10.2026) ----------
  /** строки платежей этого месяца: свои платежи и кредиты с платежом в месяц (кредиты — только когда заведён хоть один свой платёж) */
  function payItems() {
    var now = F.monthOf(F.today()), ops = st.all[now] || [], out = [];
    (st.pays.list || []).forEach(function (p) {
      var hit = F.payPaid(p, ops);
      out.push({ id: p[0], name: p[1], a: p[2], cat: p[3], day: p[4], paid: hit ? hit.d : '', raw: p });
    });
    if (out.length) {
      F.CREDITS.forEach(function (k) {
        if ((k.f & F.CLOSED) || !k.p) { return; }
        var s = F.creditState(k, st.all, now);
        if (s.left <= 0) { return; }
        var paidOp = s.ops.filter(function (op) { return F.monthOf(op.d) === now; })[0];
        out.push({ id: 'k_' + k.id, name: k.name, a: F.goalByn(k, k.p), cat: 'k_' + k.id, day: 0, paid: paidOp ? paidOp.d : '', credit: k });
      });
    }
    return out;
  }
  function payDue(it) { return it.day || 99; }
  function payLate(it) { return !it.paid && it.day && it.day < +F.today().slice(8, 10); }
  /** невнесённые: просроченные и ближайшие сверху, без срока — в конце */
  function unpaidPays() { return payItems().filter(function (it) { return !it.paid; }).sort(function (x, y) { return payDue(x) - payDue(y); }); }
  function payWhen(it) { return it.paid ? 'внесено ' + F.dayLabel(it.paid).toLowerCase() : payLate(it) ? 'срок прошёл ' + it.day + '\u2011го' : it.day ? 'до' + F.NB + it.day + '\u2011го' : 'каждый месяц'; }
  /** «Внести» одним касанием: трата на сегодня с суммой, категорией и названием платежа; сообщение с «Отменить» */
  function payNow(it, after) {
    var op = it.credit ? F.makeOp('e', 'k_' + it.credit.id, it.credit.p, F.CURS[it.credit.u], F.today(), null, '') : F.makeOp('e', it.cat, it.a, 'BYN', F.today(), null, it.name);
    store.add(op, function (err) {
      if (err) { haptic('err'); toast(explain(err)); return; }
      haptic('ok');
      reload(false, function () {
        if (after) { after(); }
        toast('Записано: ' + it.name + ' ' + F.fmt(it.a), 'Отменить', function () { store.remove(op.id, F.monthOf(op.d), function (e) { if (!e) { reload(false, function () { if (after) { after(); } }); } }); });
      });
    });
  }
  function savePays(fn, done) {
    store.patchPays(fn, function (err) {
      if (err) { haptic('err'); toast(err === 'too long' ? 'Список платежей не помещается: сократите названия.' : explain(err)); done(false); return; }
      reload(false, function (e) { done(!e); });
    });
  }
  /** карточка на главной: один невнесённый — он сам и «Внести»; несколько — сводка и «Список»; крестик прячет до конца месяца */
  function payCard() {
    var list = unpaidPays(), now = F.monthOf(F.today());
    if (!list.length || st.pays.hide === now) { return null; }
    var row = el('div', 'remind remind--pay'), text = btn('remind__text'), act = btn('capsule remind__pay'), x = btn('remind__x');
    row.id = 'payCard';
    if (list.length === 1) {
      var it = list[0], sm = el('small', payLate(it) ? 'is-late' : '', F.fmt(it.a) + ' · ' + payWhen(it));
      add(text, el('strong', '', it.name), sm);
      act.appendChild(el('span', '', 'Внести'));
      act.addEventListener('click', function () { payNow(it); });
    } else {
      var late = list.filter(payLate).length;
      add(text, el('strong', '', 'Не внесено ' + list.length + F.NB + F.plural(list.length, 'платёж', 'платежа', 'платежей')),
        el('small', late ? 'is-late' : '', late ? 'у' + F.NB + late + ' срок прошёл' : 'ближайший: ' + list[0].name + (list[0].day ? ', до' + F.NB + list[0].day + '\u2011го' : '')));
      act.appendChild(el('span', '', 'Список'));
      act.addEventListener('click', function () { openPays(null); });
    }
    act.id = 'payCardAct';
    text.addEventListener('click', function () { openPays(null); });
    x.id = 'payCardHide';
    x.setAttribute('aria-label', 'Не напоминать в этом месяце');
    x.appendChild(icon('close'));
    x.addEventListener('click', function () {
      savePays(function (o) { o.hide = now; return o; }, function (ok) {
        if (!ok) { return; }
        haptic('ok');
        toast('Напомню в следующем месяце\nСписок платежей — в настройках', 'Вернуть', function () { savePays(function (o) { o.hide = ''; return o; }, function () {}); });
      });
    });
    add(row, text, act, x);
    return row;
  }
  /** лист «Платежи месяца»: сколько осталось внести, шкала по платежам, невнесённые сверху; порядок держится, пока лист открыт */
  function openPays(back, order) {
    var items = payItems();
    if (!order) { order = items.filter(function (it) { return !it.paid; }).sort(function (x, y) { return payDue(x) - payDue(y); }).concat(items.filter(function (it) { return it.paid; })).map(function (it) { return it.id; }); }
    haptic();
    swapModal('list', false, function (m) {
      var box = el('div', 'pick pick--goalview pick--pays');
      box.appendChild(el('h2', 'pick__title', 'Платежи месяца'));
      if (!items.length) {
        box.appendChild(el('p', 'pick__info', nb('Связь, подписки, интернет: заведите их один раз, и каждый месяц будет видно, что уже внесено, а что нет. Внести можно одним касанием.')));
      } else {
        var all = 0, left = 0, paid = 0;
        items.forEach(function (it) { all += it.a; if (it.paid) { paid++; } else { left += it.a; } });
        var sum = el('p', 'goal__sum'), num = el('span', 'goal__num'), parts = F.fmtParts(left), meter = el('div', 'goal__meter goal__meter--seg'), seg = el('span', 'segbar');
        sum.id = 'paysLeft';
        add(num, el('span', '', parts.whole), el('i', '', parts.frac));
        add(sum, num, el('small', '', 'осталось внести из' + F.NB + F.fmt(all)));
        items.forEach(function (it, n) { var c = el('i'), f = el('b'); f.style.width = (n < paid ? 100 : 0) + '%'; c.appendChild(f); seg.appendChild(c); });
        add(meter, seg, el('span', '', 'внесено ' + paid + ' из ' + items.length));
        var ul = el('ul', 'pays-list');
        ul.id = 'paysList';
        order.map(function (id) { return F.find(items, id); }).filter(Boolean).concat(items.filter(function (it) { return order.indexOf(it.id) < 0; })).forEach(function (it) {
          var li = el('li', 'pay' + (it.paid ? ' is-paid' : '') + (payLate(it) ? ' is-late' : '')), name = btn('pay__name');
          li.setAttribute('data-pay', it.id);
          add(name, el('span', '', it.name), el('small', '', payWhen(it))); // название в своём span: у текста прямо в сетке многоточия нет
          name.addEventListener('click', function () { if (it.credit) { openCreditView(it.credit.id, function () { openPays(back, order); }); } else { openPayEdit(it.raw, function () { openPays(back, order); }); } });
          var act;
          if (it.paid) { act = el('span', 'pay__done'); act.setAttribute('aria-label', 'внесено'); act.appendChild(icon('check')); }
          else {
            act = btn('capsule');
            act.appendChild(el('span', '', 'Внести'));
            act.addEventListener('click', function () { payNow(it, function () { openPays(back, order); }); });
          }
          add(li, name, el('data', '', F.fmt(it.a)), act);
          ul.appendChild(li);
        });
        add(box, sum, meter, ul);
      }
      var add1 = btn('btn btn--quiet btn--new');
      add1.id = 'payNew';
      add(add1, icon('plus'), document.createTextNode('Новый платёж'));
      add1.addEventListener('click', function () {
        if ((st.pays.list || []).length >= 20) { haptic('err'); toast('Платежей уже двадцать. Удалите ненужный.'); return; }
        openPayEdit(null, function () { openPays(back); });
      });
      box.appendChild(add1);
      m.appendChild(box);
    }, back || null);
  }
  /** новый платёж или правка: название, сумма в месяц, категория, до какого числа (можно не писать) */
  function openPayEdit(p, back) {
    var busy = false, cat = p ? p[3] : '', nameEl = el('input', 'field');
    haptic();
    swapModal('list', false, function (m) {
      var box = el('div', 'pick pick--cat pick--newgoal'), foot = el('footer', 'modal__dock'), go = btn('btn', 'Сохранить'), info = el('p', 'pick__info'), row = el('div', 'field-row'), cur = el('span', 'cur cur--fixed');
      function field(f, id, value, ph, mode, max) {
        f.id = id; f.type = 'text'; f.maxLength = max; f.placeholder = ph; f.value = value;
        if (mode) { f.setAttribute('inputmode', mode); }
        f.setAttribute('enterkeyhint', 'done');
        f.setAttribute('autocomplete', 'off');
        f.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { f.blur(); } });
        return f;
      }
      function label(text, id) { var l = el('label', 'lbl', text); l.setAttribute('for', id); return l; }
      field(nameEl, 'payName', p ? p[1] : '', 'Например, интернет', '', 24);
      var sum = field(el('input', 'field'), 'paySum', p ? F.fmt(p[2]).replace(/,00$/, '') : '', 'например, 30', 'decimal', 14), day = field(el('input', 'field'), 'payDay', p && p[4] ? String(p[4]) : '', 'например, 20', 'numeric', 2);
      cur.appendChild(el('span', '', 'BYN'));
      add(row, sum, cur);
      var chips = el('ul', 'chips chips--form');
      chips.id = 'payCats';
      function paintCats() {
        clear(chips);
        F.CATS.forEach(function (c) {
          var li = el('li'), b = btn('', c.name);
          b.setAttribute('data-cat', c.id);
          b.setAttribute('aria-pressed', String(cat === c.id));
          b.addEventListener('mousedown', function (ev) { ev.preventDefault(); });
          b.addEventListener('click', function () { cat = c.id; haptic(); paintCats(); });
          li.appendChild(b);
          chips.appendChild(li);
        });
      }
      paintCats();
      info.id = 'payMsg';
      go.id = 'paySave';
      go.addEventListener('mousedown', function (ev) { ev.preventDefault(); });
      go.addEventListener('click', function () {
        if (busy) { return; }
        var name = F.cleanNote(nameEl.value).slice(0, 24).replace(/ $/, ''), a = F.parseAmount(sum.value), d = day.value.replace(/\s/g, '') ? parseInt(day.value, 10) : 0;
        var why = !name ? 'Введите название платежа.' : !a ? 'Введите сумму цифрами, например 30.' : !cat ? 'Выберите категорию.' : (isNaN(d) || d < 0 || d > 31) ? 'Число — от 1 до 31 или пусто.' : '';
        if (why) { info.textContent = why; haptic('err'); return; }
        var id = p ? p[0] : F.catId(idsOf((st.pays.list || []).map(function (x) { return [x[0]]; })));
        busy = true;
        savePays(function (o) {
          if (p) { o.list = o.list.map(function (x) { return x[0] === id ? [id, name, a, cat, d] : x; }); } else { o.list.push([id, name, a, cat, d]); }
          return o;
        }, function (ok) {
          busy = false;
          if (!ok) { return; }
          haptic('ok');
          if (back) { back(); } else { closeModal(0); }
          toast(p ? 'Платёж изменён' : 'Платёж добавлен');
        });
      });
      var del = null;
      if (p) {
        del = btn('link', 'Удалить платёж');
        del.id = 'payDel';
        del.addEventListener('click', function () {
          if (busy) { return; }
          ask('Удалить платёж «' + p[1] + '»? Записанные траты останутся.', function (yes) {
            if (!yes) { return; }
            busy = true;
            savePays(function (o) { o.list = o.list.filter(function (x) { return x[0] !== p[0]; }); return o; }, function (ok) {
              busy = false;
              if (!ok) { return; }
              haptic('ok');
              if (back) { back(); } else { closeModal(0); }
              toast('Платёж удалён');
            });
          });
        });
      }
      add(box, el('h2', 'pick__title', p ? 'Изменить платёж' : 'Новый платёж'), label('Название', 'payName'), nameEl, label('Сумма в месяц', 'paySum'), row,
        el('p', 'lbl', 'Категория'), chips, label('До какого числа, можно не писать', 'payDay'), day, info, del);
      foot.appendChild(go);
      add(m, box, foot);
    }, back);
    if (!p) { nameEl.focus(); }
  }

  // ---------- лимиты на категории ----------
  /** кружок 14 px: сектор показывает, сколько лимита потрачено; превышен — закрашен целиком (замкнутое кольцо читалось как буква «О») */
  function limitRing(part) {
    var s = svgEl('svg', { viewBox: '0 0 16 16', 'class': 'ring', 'aria-hidden': 'true' }), c = 2 * Math.PI * 3.5;
    s.appendChild(svgEl('circle', { cx: 8, cy: 8, r: 7, 'class': 'ring__track' }));
    s.appendChild(svgEl('circle', { cx: 8, cy: 8, r: 3.5, 'class': 'ring__fill', 'stroke-dasharray': (Math.min(1, part) * c).toFixed(2) + ' ' + c.toFixed(2), transform: 'rotate(-90 8 8)' }));
    return s;
  }
  /** «до лимита 187,70» или «больше лимита на 18,40» — одна формула везде */
  function limitText(sum, lim) { return sum > lim ? 'больше лимита на' + F.NB + F.fmt(sum - lim) : 'до лимита ' + F.fmt(lim - sum); }
  function limitNote(sum, lim) {
    var small = el('small', 'lim-note' + (sum > lim ? ' is-over' : ''));
    add(small, limitRing(sum / lim), document.createTextNode(limitText(sum, lim)));
    return small;
  }
  /** лист лимита: одна сумма на каждый месяц; подставить можно траты этой категории за прошлый месяц */
  function openLimit(id, back) {
    var had = st.limits[id] || 0, busy = false, field = el('input', 'field'), dict = F.dict('e', id);
    haptic();
    swapModal('list', false, function (m) {
      var box = el('div', 'pick pick--cat pick--newgoal'), foot = el('footer', 'modal__dock'), go = btn('btn', 'Сохранить'), row = el('div', 'field-row'), cur = el('span', 'cur cur--fixed'), info = el('p', 'pick__info');
      var lbl = el('label', 'lbl', 'Не больше в месяц'), pm = F.prevMonth(F.monthOf(F.today())), prevSum = 0, hint = null;
      (st.all[pm] || []).forEach(function (op) { if (op.k === 'e' && op.c === id) { prevSum += F.bynOf(op); } });
      lbl.setAttribute('for', 'limitSum');
      field.id = 'limitSum';
      field.type = 'text';
      field.maxLength = 14;
      field.placeholder = 'например, 100';
      field.value = had ? F.fmt(had).replace(/,00$/, '') : '';
      field.setAttribute('inputmode', 'decimal');
      field.setAttribute('enterkeyhint', 'done');
      field.setAttribute('autocomplete', 'off');
      field.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { field.blur(); } });
      cur.appendChild(el('span', '', 'BYN'));
      add(row, field, cur);
      if (prevSum > 0) {
        hint = el('div', 'hintrow');
        var fill = btn('capsule');
        fill.id = 'limitFill';
        fill.appendChild(el('span', '', 'Подставить'));
        fill.addEventListener('mousedown', function (ev) { ev.preventDefault(); });
        fill.addEventListener('click', function () { field.value = F.fmt(prevSum).replace(/,00$/, ''); haptic(); });
        add(hint, el('p', '', nb(F.inMonth(pm).replace(/^в\u00a0/, 'В' + F.NB) + ' ушло ' + F.fmt(prevSum))), fill);
      }
      info.id = 'limitMsg';
      function save(minor, after) {
        busy = true;
        store.setLimit(id, minor, function (err) {
          busy = false;
          if (err) { haptic('err'); toast(explain(err)); return; }
          reload(false, function () { haptic('ok'); after(); });
        });
      }
      go.id = 'limitSave';
      go.addEventListener('mousedown', function (ev) { ev.preventDefault(); });
      go.addEventListener('click', function () {
        if (busy) { return; }
        var a = F.parseAmount(field.value);
        if (!a) { info.textContent = 'Введите сумму цифрами, например 100.'; haptic('err'); return; }
        save(a, function () { if (back) { back(); } else { closeModal(0); } toast(had ? 'Лимит изменён' : 'Лимит задан'); });
      });
      var del = null;
      if (had) {
        del = btn('link', 'Убрать лимит');
        del.id = 'limitDel';
        del.addEventListener('click', function () {
          if (busy) { return; }
          save(0, function () { if (back) { back(); } else { closeModal(0); } toast('Лимит убран', 'Вернуть', function () { store.setLimit(id, had, function () { reload(false); }); }); });
        });
      }
      add(box, el('h2', 'pick__title', 'Лимит на «' + dict.name + '»'), el('p', 'pick__info pick__info--lead', nb('Сколько готовы тратить на это в месяц. Если запись выйдет за лимит, приложение') + F.NB + 'предупредит.'), lbl, row, hint, info, del);
      foot.appendChild(go);
      add(m, box, foot);
    }, back);
    if (!had) { field.focus(); }
  }

  // ---------- бюджет на месяц ----------
  function budgetOn() { return !!st.budget && st.budget.a > 0; }
  /** сколько останется на траты в этом месяце: от бюджета, если он задан, иначе от доходов и остатка прошлых месяцев */
  function monthLeft() { return budgetOn() ? st.budget.a - st.sum.spent : st.sum.left + st.carry; }
  /** день, в который траты месяца перешли бюджет */
  function budgetGone(B) {
    var acc = 0, day = '';
    st.ops.filter(function (op) { return op.k === 'e' && !F.isMoveOp(op); }).sort(function (x, y) { return x.d === y.d ? (x.id < y.id ? -1 : 1) : (x.d < y.d ? -1 : 1); })
      .some(function (op) { acc += F.bynOf(op); if (acc > B) { day = op.d; return true; } return false; });
    return day;
  }
  function saveBudget(b, done) {
    store.setBudget(b, function (err) {
      if (err) { haptic('err'); toast(explain(err)); done(false); return; }
      reload(false, function (e) { done(!e); });
    });
  }
  /** подсказка на главной (вариант А, решение разработчика 17.10.2026): траты есть, ни дохода, ни бюджета; крестик убирает её насовсем, бюджет остаётся в настройках */
  function budgetTip() {
    var row = el('div', 'remind remind--tip'), text = el('span'), set = btn('capsule remind__pay'), x = btn('remind__x');
    row.id = 'budgetTip';
    add(text, el('strong', '', 'Доход не записываете?'), el('small', '', nb('Задайте бюджет, и будет видно, сколько') + F.NB + 'осталось'));
    set.id = 'budgetTipSet';
    set.appendChild(el('span', '', 'Задать'));
    set.addEventListener('click', function () { openBudget(null); });
    x.id = 'budgetTipHide';
    x.setAttribute('aria-label', 'Не показывать');
    x.appendChild(icon('close'));
    x.addEventListener('click', function () {
      saveBudget({ a: st.budget.a, off: 1 }, function (ok) {
        if (!ok) { return; }
        haptic('ok');
        toast('Подсказка убрана\nБюджет можно задать в настройках под шестерёнкой');
      });
    });
    add(row, text, set, x);
    return row;
  }
  // ---------- значок на экране телефона (вариант В, решение разработчика 18.10.2026) ----------
  /** картинка значка — кошелёк (выбор разработчика 18.10.2026): тот же рендер, что в BotFather (значки\кошелёк-botfather-512.png), 144 px */
  function appIcon(size) {
    var s = document.createElement('span'), img = document.createElement('img');
    s.className = 'appicon';
    img.src = 'appicon.png';
    img.width = size; img.height = size;
    img.alt = '';
    s.appendChild(img);
    return s;
  }
  /** Telegram отвечает: 'unsupported' (компьютер, старая версия), 'unknown', 'added', 'missed' (значка нет) */
  function homeCan() { return st.home === 'missed' || st.home === 'unknown'; }
  /** карточку убрали крестиком: помнится на этом телефоне (значок тоже ставится на конкретный телефон) */
  function homeOff() { try { return localStorage.getItem('fin_hsoff') === '1'; } catch (e) { return false; } }
  function setHomeOff() { try { localStorage.setItem('fin_hsoff', '1'); } catch (e) { /* без памяти карточка просто покажется ещё раз */ } }
  /** сколько разных дней есть записи: карточка появляется, когда приложением пользуются третий день */
  function usedDays() {
    var seen = {}, n = 0;
    Object.keys(st.all).forEach(function (m) { st.all[m].forEach(function (op) { if (!seen[op.d]) { seen[op.d] = 1; n++; } }); });
    return n;
  }
  function homeAdd() {
    haptic();
    tgTry(function () { tg.addToHomeScreen(); });
  }
  function homeCheck() {
    tgTry(function () {
      if (!(tg.isVersionAtLeast && tg.isVersionAtLeast('8.0') && tg.checkHomeScreenStatus)) { return; }
      tg.onEvent('homeScreenAdded', function () {
        st.home = 'added';
        haptic('ok');
        toast('Значок добавлен на экран телефона');
        if (!ui.open && st.loaded) { paint(false); }
      });
      tg.checkHomeScreenStatus(function (s) {
        st.home = String(s || '');
        if (!ui.open && st.loaded && st.tab === 'month') { paint(false); }
      });
    });
  }
  /** один раз на главной: только когда других карточек нет */
  // ---------- доля сбережений (пункт 16, решение разработчика 19.10.2026: вариант В — блок в «Аналитике» и карточка итога месяца) ----------
  /** тот же день в другом месяце (31-е в коротком месяце — его последний день) */
  function sameDay(month, date) {
    var p = month.split('-'), last = new Date(+p[0], +p[1], 0).getDate();
    return month + '-' + ('0' + Math.min(+date.slice(8, 10), last)).slice(-2);
  }
  /** «−10%» с настоящим минусом */
  function pctText(p) { return (p < 0 ? '−' : '') + Math.abs(p) + '%'; }
  function bigPct(p) {
    var b = el('p', 'save-num');
    b.id = 'saveNum';
    add(b, el('span', '', (p < 0 ? '−' : '') + Math.abs(p)), el('i', '', '%'));
    return b;
  }
  /** блок «Сбережения» в «Аналитике» за месяц: текущий — «пока» и сравнение с тем же днём прошлого, закрытый — окончательно; столбики до шести месяцев */
  function savingsBlock(P, now) {
    var month = F.monthOf(P.from), curMonth = F.monthOf(now), current = month === curMonth, s = F.savingsOf(st.all, month, current ? now : null);
    if (s.pct === null) { return null; } // без дохода доли нет (так живёт мама — только траты)
    var box = el('div', 'save'), top = el('div', 'save-top'), cmp = el('p', 'save-top__cmp');
    cmp.id = 'saveCmp';
    if (s.saved < 0) { // траты больше дохода: не процент, а сколько сверх
      var neg = el('p', 'save-neg', nb('Траты больше дохода на ' + F.fmt(-s.saved)));
      neg.id = 'saveNeg';
      top.appendChild(neg);
    } else { top.appendChild(bigPct(s.pct)); }
    if (current) {
      var pm = F.prevMonth(month), ps = F.savingsOf(st.all, pm, sameDay(pm, now)), when = 'к' + F.NB + rangeText(sameDay(pm, now), sameDay(pm, now));
      if (ps.pct !== null) { var d = s.pct - ps.pct; cmp.textContent = nb(d ? 'на ' + Math.abs(d) + '% ' + (d > 0 ? 'больше' : 'меньше') + ', чем ' + when : 'столько же, сколько ' + when); }
    } else { cmp.textContent = nb(s.saved >= 0 ? 'сберегли ' + F.fmt(s.saved) + ' из ' + F.fmt(s.income) + ' дохода' : 'доход ' + F.fmt(s.income) + ', траты ' + F.fmt(s.spent)); }
    if (cmp.textContent) { top.appendChild(cmp); }
    box.appendChild(top);
    // столбики: до шести месяцев по выбранный, только месяцы с доходом
    var list = [], m = month;
    for (var i = 0; i < 6; i++) { var x = F.savingsOf(st.all, m, m === curMonth ? now : null); if (x.pct !== null) { list.unshift({ m: m, p: x.pct, now: m === curMonth }); } m = F.prevMonth(m); }
    if (list.length >= 2) {
      var mx = 1, neg2 = false, ul = el('ul', 'sbars');
      list.forEach(function (it) { if (it.p > mx) { mx = it.p; } if (it.p < 0) { neg2 = true; } });
      if (neg2) { ul.className = 'sbars sbars--neg'; }
      ul.id = 'saveBars';
      ul.style.gridTemplateColumns = 'repeat(' + list.length + ', minmax(0, 1fr))';
      list.forEach(function (it) {
        var li = el('li'), b = btn('sbar' + (it.now ? ' is-now' : '') + (it.m === month && !it.now ? ' is-sel' : '') + (it.p < 0 ? ' is-neg' : '')), up = el('span', 'sbar__up'), dn = el('span', 'sbar__dn'), bar = el('i'), v = el('span', 'sbar__v', (it.now ? 'пока ' : '') + pctText(it.p));
        bar.style.height = (it.p < 0 ? 18 : Math.max(4, Math.round(it.p / mx * 80))) + 'px';
        if (it.p < 0) { add(dn, bar, v); } else { add(up, v, bar); }
        b.setAttribute('data-month', it.m);
        b.setAttribute('aria-label', F.monthLabel(it.m) + ': ' + pctText(it.p) + (it.now ? ', месяц ещё идёт' : ''));
        add(b, up, dn, el('span', 'sbar__m', F.monthLabel(it.m).slice(0, 3).toLowerCase()));
        b.addEventListener('click', function () { // касание — этот месяц в «Аналитике»
          if (it.m === month) { return; }
          st.stats.kind = 'month';
          st.stats.at = it.now ? now : it.m + '-15';
          haptic();
          paint(true);
        });
        li.appendChild(b);
        ul.appendChild(li);
      });
      box.appendChild(ul);
      var closed = list.filter(function (it) { return !it.now; }), avg = '';
      if (closed.length) {
        var sum = 0;
        closed.forEach(function (it) { sum += it.p; });
        avg = 'В среднем за ' + closed.length + F.NB + F.plural(closed.length, 'месяц', 'месяца', 'месяцев') + ' ' + pctText(Math.round(sum / closed.length)) + '.';
      }
      var tail = current ? ' Месяц ещё идёт: цифра станет окончательной 1' + F.NB + F.MONTHS_GEN[+F.periodShift('month', month + '-01', 1).slice(5, 7) - 1] + '.' : '';
      var note = el('p', 'save-avg', nb((avg + tail).trim()));
      note.id = 'saveAvg';
      if (note.textContent) { box.appendChild(note); }
    }
    return vizBlock('Сбережения', current ? 'к' + F.NB + rangeText(now, now) + ', пока' : 'итог месяца', box, 'vizSave');
  }
  function saveHidden(month) { try { return localStorage.getItem('fin_savehide') === month; } catch (e) { return false; } }
  /** карточка итога прошлого месяца на главной: 1–7 числа, пока не убрали крестиком; касание — этот месяц в «Аналитике» */
  function saveCard() {
    var now = F.today(), pm = F.prevMonth(F.monthOf(now)), s = F.savingsOf(st.all, pm, null);
    if (+now.slice(8, 10) > 7 || s.pct === null || saveHidden(pm)) { return null; }
    var row = el('div', 'remind remind--save'), text = btn('remind__text save-card'), strong = el('strong'), x = btn('remind__x'), ppm = F.prevMonth(pm), ps = F.savingsOf(st.all, ppm, null), name = F.monthLabel(pm);
    row.id = 'saveCard';
    var before = ps.pct === null ? '' : F.inMonth(ppm) + (ps.saved >= 0 ? ' сберегли ' + pctText(ps.pct) : ' траты больше дохода');
    if (s.saved >= 0) {
      var num = el('b', 'save-card__num');
      add(num, document.createTextNode(String(s.pct)), el('i', '', '%'));
      add(strong, document.createTextNode(name + ': сберегли'), num);
      add(text, strong, el('small', '', nb(F.fmt(s.saved) + ' из ' + F.fmt(s.income) + ' дохода' + (before ? ' · ' + before : ''))));
    } else {
      strong.textContent = name + ': траты больше дохода';
      add(text, strong, el('small', '', nb('на ' + F.fmt(-s.saved) + (before ? ' · ' + before : ''))));
    }
    text.addEventListener('click', function () { st.tab = 'stats'; st.stats.kind = 'month'; st.stats.at = pm + '-15'; haptic(); paintDock(); paint(true); });
    x.id = 'saveCardHide';
    x.setAttribute('aria-label', 'Убрать до следующего месяца');
    x.appendChild(icon('close'));
    x.addEventListener('click', function () {
      try { localStorage.setItem('fin_savehide', pm); } catch (e) { /* без памяти карточка вернётся при следующем открытии */ }
      haptic('ok');
      if (row.parentNode) { row.parentNode.removeChild(row); }
    });
    add(row, text, x);
    return row;
  }
  // ---------- обратная связь (пункт 17, решение разработчика 19.10.2026: анонимно через посредника, голос «Хочу», раз в месяц вопрос про приложение, «Написать автору») ----------
  var AUTHOR = 'umna_by';
  /** адрес посредника на хостинге автора (relay/feedback.php, настройка — relay/README.md). Пусто — домена ещё нет:
      лист честно открывает личный чат («автор увидит ваше имя»), голосования и вопроса на главной нет */
  var FEEDBACK_URL = window.__finFeedback || '';
  var IDEAS = [['fam', 'Общий учёт с семьёй', 'двое ведут одни траты'], ['rep', 'Повторяющиеся траты', 'каждый месяц записываются сами'],
    ['eve', 'Напоминание вечером', '«запишите траты за сегодня»'], ['rcpt', 'Фото чека', 'сумма из снимка']]; // тот же список — в relay/feedback.php
  // вопросы раз в месяц по очереди — про приложение, а не про деньги месяца (замечание разработчика 19.10.2026); у каждого свои подписи
  var ASKS = [['Как вам приложение «Финансы»?', ['Хорошо', 'Так себе', 'Плохо']], ['Удобно пользоваться приложением?', ['Удобно', 'Так себе', 'Неудобно']],
    ['Приложение вам помогает?', ['Помогает', 'Немного', 'Нет']]];
  function lsGet(k) { try { return localStorage.getItem(k) || ''; } catch (e) { return ''; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* без памяти — до закрытия */ } }
  /** личный чат с автором; ?text= подставляет текст там, где Telegram это умеет */
  function openAuthor(text) {
    var url = 'https://t.me/' + AUTHOR + (text ? '?text=' + encodeURIComponent(text) : '');
    if (inTg && tg.openTelegramLink) { tgTry(function () { tg.openTelegramLink(url); }); return; }
    window.open(url, '_blank');
  }
  /** запрос к посреднику: done(ошибка, ответ) */
  function relay(body, done) {
    if (!FEEDBACK_URL || !window.fetch) { done('net'); return; }
    fetch(FEEDBACK_URL + (body ? '' : '?counts=1'), body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {})
      .then(function (r) { return r.json().then(function (j) { if (!r.ok || !j || !j.ok) { throw new Error('bad'); } done(null, j); }); })
      .catch(function () { done('net'); });
  }
  function fbVoted() { try { var o = JSON.parse(lsGet('fin_votes') || '{}'); return o && typeof o === 'object' ? o : {}; } catch (e) { return {}; } }
  function authorRow(cls) {
    var b = btn('menu__row menu__row--out ' + (cls || ''));
    b.id = 'authorBtn';
    add(b, el('span', '', 'Написать автору'), el('small', '', '@' + AUTHOR), el('i', 'out', '↗')); // стрелка, а не шеврон: касание уводит из приложения
    b.addEventListener('click', function () { haptic(); openAuthor(''); });
    return b;
  }
  /** лист «Как улучшить приложение»: с посредником — анонимно (голос «Хочу» и своё), без него — честно через личный чат */
  function openFeedback(back) {
    var anon = !!FEEDBACK_URL, voted = fbVoted(), counts = {}, busy = false;
    haptic();
    swapModal('list', anon, function (m) {
      var box = el('div', 'pick pick--cat'), foot = el('footer', 'modal__dock'), area = el('textarea', 'field fb__area'), line = el('p', 'anon' + (anon ? '' : ' anon--open'));
      box.id = 'fbBox';
      area.id = 'fbText';
      area.maxLength = 1000;
      area.rows = 3;
      area.placeholder = 'Пара слов — этого достаточно';
      area.setAttribute('aria-label', 'Ваша идея или что не работает');
      add(line, icon(anon ? 'lock' : 'plane'), el('span', '', nb(anon ? 'Анонимно: автор увидит только текст.' : 'Откроется чат с автором в Telegram — он увидит ваше имя.')));
      line.id = 'fbAnon';
      add(box, el('h2', 'pick__title', 'Как улучшить приложение'), line);
      var list = null;
      function paintVotes() {
        if (!list) { return; }
        clear(list);
        IDEAS.forEach(function (it) {
          var li = el('li', 'vote' + (voted[it[0]] ? ' is-on' : '')), name = el('span', 'vote__name', it[1]);
          li.setAttribute('data-idea', it[0]);
          name.appendChild(el('small', '', nb(it[2])));
          li.appendChild(name);
          if (voted[it[0]]) { // голос засчитан в момент касания: «✓ 17»
            var mine = el('span', 'vote__mine');
            mine.setAttribute('aria-label', 'ваш голос' + (counts[it[0]] ? ', всего ' + counts[it[0]] : ''));
            add(mine, icon('check'), counts[it[0]] ? el('span', '', String(counts[it[0]])) : null);
            li.appendChild(mine);
          } else {
            var b = btn('capsule');
            b.id = 'vote-' + it[0];
            b.appendChild(el('span', '', 'Хочу'));
            b.addEventListener('click', function () {
              voted[it[0]] = 1;
              counts[it[0]] = (counts[it[0]] || 0) + 1;
              lsSet('fin_votes', JSON.stringify(voted));
              haptic('ok');
              paintVotes();
              paintFoot();
              relay({ t: 'vote', id: it[0] }, function (err, j) {
                if (err) { delete voted[it[0]]; counts[it[0]] = Math.max(0, (counts[it[0]] || 1) - 1); lsSet('fin_votes', JSON.stringify(voted)); haptic('err'); toast('Голос не ушёл. Проверьте связь и повторите.'); }
                else if (j.votes) { counts = j.votes; }
                paintVotes();
                paintFoot();
              });
            });
            li.appendChild(b);
          }
          list.appendChild(li);
        });
      }
      if (anon) {
        list = el('ul', 'votes');
        list.id = 'fbVotes';
        add(box, el('p', 'lbl', 'Уже предлагали — нажмите «Хочу»'), list);
        paintVotes();
        relay(null, function (err, j) { if (!err && j.votes) { counts = j.votes; paintVotes(); } }); // счёт голосов; без связи — галочка без числа
      }
      var reply = el('p', 'reply');
      if (anon) {
        var who = btn('reply__link', 'Напишите автору @' + AUTHOR + ' ↗');
        who.id = 'fbAuthor';
        who.addEventListener('click', function () { openAuthor(''); });
        add(reply, document.createTextNode('Нужен ответ? '), who);
      } else { reply.textContent = nb('Текст скопируется: в чате нажмите на поле и подержите → «Вставить».'); }
      add(box, el('p', 'lbl lbl--gap', 'Ваша идея или что не работает'), area, reply);
      // низ: с первой буквы «Отправить идею»; пока пусто — «Голос учтён» после голоса или ничего
      function paintFoot() {
        clear(foot);
        foot.className = 'modal__dock';
        var has = !!area.value.trim();
        if (!anon) {
          var go = btn('btn', 'Открыть чат');
          go.id = 'fbChat';
          go.addEventListener('click', function () {
            var text = area.value.trim();
            if (text) { copyText(area, text); }
            haptic('ok');
            openAuthor(text);
          });
          foot.appendChild(go);
          return;
        }
        if (has) {
          var send = btn('btn' + (busy ? ' btn--off' : ''), busy ? 'Отправляем' : 'Отправить идею');
          send.id = 'fbSend';
          send.addEventListener('click', function () {
            if (busy) { return; }
            busy = true;
            paintFoot();
            relay({ t: 'idea', text: area.value.trim() }, function (err) {
              busy = false;
              if (err) { paintFoot(); haptic('err'); toast('Не отправилось. Проверьте связь и повторите.'); return; }
              haptic('ok');
              fbSent();
            });
          });
          foot.appendChild(send);
        } else if (Object.keys(voted).length) {
          foot.className = 'modal__dock modal__dock--note';
          var note = el('p', 'voted');
          note.id = 'fbVoted';
          add(note, icon('check'), el('span', '', 'Голос учтён'));
          foot.appendChild(note);
        } else { foot.className = 'modal__dock is-empty'; }
      }
      area.addEventListener('input', paintFoot);
      paintFoot();
      add(m, box, foot);
    }, back);
  }
  function fbSent() {
    swapModal('list', false, function (m) {
      var box = el('div', 'pick pick--cat sent'), mark = el('span', 'sent__mark'), foot = el('footer', 'modal__dock'), ok = btn('btn btn--quiet', 'Готово');
      box.id = 'fbSent';
      mark.appendChild(icon('check'));
      ok.addEventListener('click', function () { closeModal(0); });
      add(box, mark, el('h2', 'pick__title', 'Отправлено, спасибо'), el('p', 'pick__info pick__info--big', nb('Автор читает каждое сообщение. Что исправлено и добавлено — в описании обновления.')));
      foot.appendChild(ok);
      add(m, box, foot);
    }, null);
  }
  /** раз в месяц на главной: вопрос про приложение и три лица; только с посредником и когда записи есть в семи разных днях */
  function moodCard() {
    var month = F.monthOf(F.today());
    if (!FEEDBACK_URL || usedDays() < 7 || lsGet('fin_mood') === month) { return null; }
    var qi = (+month.slice(5, 7)) % ASKS.length, a = ASKS[qi], row = el('div', 'remind remind--mood'), q = el('span', 'mood__q'), x = btn('remind__x'), faces = el('span', 'mood');
    row.id = 'moodCard';
    add(q, el('strong', '', a[0]), el('small', '', 'анонимно, одно касание'));
    function hide() { lsSet('fin_mood', month); if (row.parentNode) { row.parentNode.removeChild(row); } }
    x.id = 'moodHide';
    x.setAttribute('aria-label', 'Не спрашивать в этом месяце');
    x.appendChild(icon('close'));
    x.addEventListener('click', function () { haptic(); hide(); });
    ['good', 'meh', 'bad'].forEach(function (k, v) {
      var b = btn('mood__btn');
      b.setAttribute('data-mood', String(v));
      add(b, icon('face-' + k), el('span', '', a[1][v]));
      b.addEventListener('click', function () {
        lsSet('fin_mood', month);
        haptic('ok');
        relay({ t: 'mood', q: qi, v: v }, function () { /* оценка — без повторов: не ушла, так не ушла */ });
        if (v < 2) { hide(); toast('Спасибо!'); return; }
        // «плохо»: одной строкой «Что мешает?» и «Написать» — лист «Как улучшить приложение»
        clear(row);
        row.className = 'remind';
        var t = el('span'), w = btn('capsule remind__pay'), x2 = btn('remind__x');
        add(t, el('strong', '', 'Спасибо. Что мешает?'), el('small', '', 'пара слов, анонимно'));
        w.id = 'moodWrite';
        w.appendChild(el('span', '', 'Написать'));
        w.addEventListener('click', function () { hide(); openFeedback(null); });
        x2.setAttribute('aria-label', 'Закрыть');
        x2.appendChild(icon('close'));
        x2.addEventListener('click', hide);
        add(row, t, w, x2);
      });
      faces.appendChild(b);
    });
    add(row, q, x, faces);
    return row;
  }
  function homeCard() {
    if (!homeCan() || homeOff() || usedDays() < 3) { return null; }
    var row = el('div', 'remind remind--home'), text = el('span'), go = btn('capsule remind__pay'), x = btn('remind__x');
    row.id = 'homeCard';
    text.appendChild(el('strong', '', 'Значок «Финансы»'));
    go.id = 'homeCardGo';
    go.appendChild(el('span', '', 'На экран'));
    go.addEventListener('click', homeAdd);
    x.id = 'homeCardHide';
    x.setAttribute('aria-label', 'Не предлагать');
    x.appendChild(icon('close'));
    x.addEventListener('click', function () {
      setHomeOff();
      haptic('ok');
      if (row.parentNode) { row.parentNode.removeChild(row); }
      toast('Больше не предложу\nЗначок можно добавить в настройках');
    });
    add(row, appIcon(36), text, go, x);
    return row;
  }
  /** лист бюджета: одна сумма на каждый месяц; подставить можно траты прошлого месяца */
  function openBudget(back) {
    var had = st.budget.a || 0, busy = false, field = el('input', 'field');
    haptic();
    swapModal('list', false, function (m) {
      var box = el('div', 'pick pick--cat pick--newgoal'), foot = el('footer', 'modal__dock'), go = btn('btn', 'Сохранить'), row = el('div', 'field-row'), cur = el('span', 'cur cur--fixed'), info = el('p', 'pick__info');
      var lbl = el('label', 'lbl', 'Сумма в месяц'), prevMonth = F.prevMonth(F.monthOf(F.today())), prevSpent = F.summarize(st.all[prevMonth] || []).spent, hint = null;
      lbl.setAttribute('for', 'budgetSum');
      field.id = 'budgetSum';
      field.type = 'text';
      field.maxLength = 14;
      field.placeholder = 'например, 1 500';
      field.value = had ? F.fmt(had).replace(/,00$/, '') : '';
      field.setAttribute('inputmode', 'decimal');
      field.setAttribute('enterkeyhint', 'done');
      field.setAttribute('autocomplete', 'off');
      field.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { field.blur(); } });
      cur.appendChild(el('span', '', 'BYN'));
      add(row, field, cur);
      if (prevSpent > 0) {
        hint = el('div', 'hintrow');
        var fill = btn('capsule');
        fill.id = 'budgetFill';
        fill.appendChild(el('span', '', 'Подставить'));
        fill.addEventListener('mousedown', function (ev) { ev.preventDefault(); });
        fill.addEventListener('click', function () { field.value = F.fmt(prevSpent).replace(/,00$/, ''); haptic(); });
        add(hint, el('p', '', nb(F.inMonth(prevMonth).replace(/^в /, 'В' + F.NB) + ' ушло ' + F.fmt(prevSpent))), fill);
      }
      info.id = 'budgetMsg';
      go.id = 'budgetSave';
      go.addEventListener('mousedown', function (ev) { ev.preventDefault(); });
      go.addEventListener('click', function () {
        if (busy) { return; }
        var a = F.parseAmount(field.value);
        if (!a) { info.textContent = 'Введите сумму цифрами, например 1500.'; haptic('err'); return; }
        busy = true;
        saveBudget({ a: a, off: st.budget.off }, function (ok) {
          busy = false;
          if (!ok) { return; }
          haptic('ok');
          if (back) { back(); } else { closeModal(0); }
          toast(had ? 'Бюджет изменён' : 'Бюджет задан');
        });
      });
      var del = null;
      if (had) {
        del = btn('link', 'Убрать бюджет');
        del.id = 'budgetDel';
        del.addEventListener('click', function () {
          if (busy) { return; }
          busy = true;
          saveBudget({ a: 0, off: st.budget.off }, function (ok) {
            busy = false;
            if (!ok) { return; }
            haptic('ok');
            if (back) { back(); } else { closeModal(0); }
            toast('Бюджет убран', 'Вернуть', function () { saveBudget({ a: had, off: st.budget.off }, function () {}); });
          });
        });
      }
      add(box, el('h2', 'pick__title', 'Бюджет на месяц'), el('p', 'pick__info pick__info--lead', nb('Сколько готовы тратить в месяц. Будет видно, сколько осталось и сколько можно в день.')), lbl, row, hint, info, del);
      foot.appendChild(go);
      add(m, box, foot);
    }, back);
    if (!had) { field.focus(); }
  }

  // ---------- история ----------
  // ---------- «История» и поиск (пункт 15, решение разработчика 19.10.2026: вариант А — поле всегда сверху, поиск за всё время) ----------
  var find = { q: '', on: false, input: null };
  /** для сравнения: строчные и «ё» как «е» — длина строки та же, поэтому место совпадения годится и для выделения */
  function findNorm(s) { return String(s || '').toLowerCase().replace(/ё/g, 'е'); }
  /** где совпало (индекс) или -1; короткий запрос (до трёх букв) — только с начала слова: «ма» найдёт «маме», но не «зарплата» */
  function findAt(text, q) {
    var t = findNorm(text), i = -1;
    if (!q || !t) { return -1; }
    if (q.length >= 3) { return t.indexOf(q); }
    while ((i = t.indexOf(q, i + 1)) >= 0) { if (i === 0 || !/[a-zа-я0-9]/.test(t.charAt(i - 1))) { return i; } }
    return -1;
  }
  /** записи за всё время: по сумме (запрос — число) или по слову в заметке и названии категории; свежие сверху */
  function findOps(q) {
    var amount = /^\d{1,9}([.,]\d{1,2})?$/.test(q) ? F.parseAmount(q) : 0, out = [];
    Object.keys(st.all).forEach(function (m) {
      st.all[m].forEach(function (op) {
        var d = F.dict(op.k, op.c), hit = null, at;
        if (amount) { if (op.a === amount || F.bynOf(op) === amount) { hit = { amount: true }; } }
        else if ((at = findAt(op.n, q)) >= 0) { hit = { note: at }; }
        else if ((at = findAt(d.name, q)) >= 0) { hit = { cat: at }; }
        if (hit) { out.push({ op: op, d: d, hit: hit }); }
      });
    });
    out.sort(function (x, y) { return x.op.d === y.op.d ? (x.op.id < y.op.id ? 1 : -1) : (x.op.d < y.op.d ? 1 : -1); });
    return { list: out, amount: amount };
  }
  /** найденное жирным; совпала вся строка — выделять нечего; совпадение в середине длинной заметки — кусок вокруг него */
  function findMark(text, q, at) {
    var frag = document.createDocumentFragment(), s = String(text);
    if (at < 0 || findNorm(s).trim() === q) { frag.appendChild(document.createTextNode(s)); return frag; }
    var start = 0;
    if (at > 14 && s.length > 26) { var sp = s.lastIndexOf(' ', at - 8); start = sp >= 0 && sp > at - 20 ? sp + 1 : at - 10; } // кусок начинается словом раньше: виден смысл вокруг
    add(frag, document.createTextNode((start ? '…' : '') + s.slice(start, at)), el('b', '', s.slice(at, at + q.length)), document.createTextNode(s.slice(at + q.length)));
    return frag;
  }
  /** строка найденного в две линии: сверху то, что нашлось, снизу серым категория и дата (сокращается категория, дата — никогда) */
  function findRow(r, q) {
    var op = r.op, li = el('li'), b = btn('op op--two'), two = el('div', 'op__two'), top = el('p', 'op__top'), low = el('p', 'op__date'), plus = op.k === 'i' && !F.isMoveOp(op);
    var noteTop = !!op.n && r.hit.cat === undefined;
    b.setAttribute('data-id', op.id);
    top.appendChild(noteTop ? findMark(op.n, q, r.hit.note === undefined ? -1 : r.hit.note) : findMark(r.d.name, q, r.hit.cat === undefined ? -1 : r.hit.cat));
    if (noteTop) { add(low, el('span', 'op__cat', r.d.name), el('span', 'op__when', F.NB + '·' + F.NB + F.dayLabel(op.d))); }
    else { add(low, el('span', 'op__when', F.dayLabel(op.d))); if (op.n) { add(low, el('span', 'op__cat', F.NB + '·' + F.NB + op.n)); } }
    add(two, top, low);
    add(b, icon(r.d.icon), two, el('data', (plus ? 'is-plus' : '') + (r.hit.amount ? ' is-hit' : ''), (plus ? '+' : '') + F.fmt(F.bynOf(op))), icon('right', 'share__go'));
    b.addEventListener('click', function () { openEntry(op); });
    li.appendChild(b);
    return li;
  }
  /** опечатка — самый частый случай: самое похожее слово из заметок и категорий (не дальше одной-двух букв) */
  function findSuggest(q) {
    var seen = {}, best = '', bestD = q.length > 5 ? 3 : 2;
    function lev(a, b) {
      var prev = [], cur, i, j;
      for (j = 0; j <= b.length; j++) { prev[j] = j; }
      for (i = 1; i <= a.length; i++) {
        cur = [i];
        for (j = 1; j <= b.length; j++) { cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1)); }
        prev = cur;
      }
      return prev[b.length];
    }
    Object.keys(st.all).forEach(function (m) {
      st.all[m].forEach(function (op) {
        [op.n, F.dict(op.k, op.c).name].forEach(function (t) {
          findNorm(t).split(/[^a-zа-я0-9]+/).forEach(function (w) {
            if (w.length < 3 || seen[w] || w === q) { return; }
            seen[w] = 1;
            var d = Math.min(lev(q, w), w.length > q.length ? lev(q, w.slice(0, q.length)) : 9);
            if (d < bestD) { bestD = d; best = w; }
          });
        });
      });
    });
    return best;
  }
  function findCount(n, a, b, c) { return n + F.NB + F.plural(n, a, b, c); }
  /** тело «Истории»: записи месяца по дням или, в режиме поиска, ответ и найденное по месяцам */
  function paintFindBody(body) {
    clear(body);
    if (!find.on) {
      var sheet = el('div', 'sheet sheet--full'), days = F.byDays(st.ops);
      if (!days.length) { sheet.appendChild(el('p', 'empty', 'В этом месяце записей нет.')); }
      else { sheet.appendChild(el('p', 'hint', 'Нажмите на запись, чтобы изменить или удалить её.')); }
      days.forEach(function (day) {
        var sec = el('section', 'day'), list = el('ul', 'ops');
        sec.appendChild(el('h2', '', F.dayLabel(day.date)));
        day.ops.forEach(function (op) { var li = el('li'); li.appendChild(opRow(op, false)); list.appendChild(li); });
        sec.appendChild(list);
        sheet.appendChild(sec);
      });
      body.appendChild(sheet);
      return;
    }
    var q = findNorm(find.q).trim(), sheet2 = el('div', 'sheet sheet--full sheet--find');
    if (!q) {
      sheet2.appendChild(el('p', 'hint', nb('Ищем в заметках, названиях категорий и суммах за всё время.')));
      body.appendChild(sheet2);
      return;
    }
    var res = findOps(q), list = res.list;
    if (!list.length) {
      var none = el('div', 'nofind'), tip = findSuggest(q);
      none.id = 'findNone';
      add(none, icon('search'), el('p', 'nofind__title', 'Ничего не нашлось'), el('p', 'nofind__text', nb('Проверьте слово: ищем в заметках, категориях и суммах за всё время.')));
      if (tip) {
        var tryBtn = btn('capsule nofind__try');
        tryBtn.id = 'findTry';
        tryBtn.appendChild(el('span', '', 'Может, «' + tip + '»?'));
        tryBtn.addEventListener('click', function () { find.q = tip; if (find.input) { find.input.value = tip; } haptic(); paintFindBody(body); });
        none.appendChild(tryBtn);
      }
      sheet2.appendChild(none);
      body.appendChild(sheet2);
      return;
    }
    var spent = 0, n = 0, inc = 0, hero = el('section', 'spent spent--find'), label = el('p', 'spent__label'), line = null;
    list.forEach(function (r) { if (F.isMoveOp(r.op)) { return; } if (r.op.k === 'e') { spent += F.bynOf(r.op); n++; } else { inc++; } });
    label.id = 'findLabel';
    if (res.amount || q.length < 3 || !n) { // по сумме и по короткому куску крупной суммы нет: сложенные случайные совпадения ответом не являются
      var big = el('p', 'found__big', res.amount ? findCount(list.length, 'запись', 'записи', 'записей') + ' по' + F.NB + F.fmt(res.amount) : findCount(list.length, 'запись', 'записи', 'записей'));
      big.id = 'findBig';
      label.textContent = res.amount ? 'Поиск по сумме' : 'Найдено по «' + find.q.trim() + '»';
      add(hero, label, big);
      if (!res.amount && n) { line = 'на' + F.NB + F.fmt(spent) + ' · за' + F.NB + 'всё время'; }
    } else {
      var sumEl = el('p', sumClass(spent)), node = { whole: el('span'), frac: el('i') };
      sumEl.id = 'findSum';
      setSum(node, spent);
      add(sumEl, node.whole, node.frac, el('abbr', '', 'BYN'));
      label.textContent = 'Потрачено на «' + find.q.trim() + '»';
      add(hero, label, sumEl);
      line = findCount(n, 'трата', 'траты', 'трат') + ' · за' + F.NB + 'всё время' + (inc ? ', ещё ' + findCount(inc, 'доход', 'дохода', 'доходов') + ' не в сумме' : '');
      setTimeout(function () { if (sumEl.parentNode) { fitSum(sumEl); } }, 0);
    }
    if (line) { var ln = el('p', 'spent__day', line); ln.id = 'findLine'; hero.appendChild(ln); }
    var month = '', ul = null, shown = list.slice(0, 300);
    sheet2.id = 'findList';
    shown.forEach(function (r) {
      var m = F.monthOf(r.op.d);
      if (m !== month) {
        month = m;
        var sec = el('section', 'day day--month');
        ul = el('ul', 'ops');
        add(sec, el('h2', '', F.monthLabel(m)), ul);
        sheet2.appendChild(sec);
      }
      ul.appendChild(findRow(r, q));
    });
    if (list.length > shown.length) { sheet2.appendChild(el('p', 'hint', nb('Показаны первые 300. Уточните слово, чтобы увидеть остальные.'))); }
    add(body, hero, sheet2);
  }
  function findClose() {
    find.on = false;
    find.q = '';
    if (find.input) { find.input.blur(); }
    stage.classList.remove('is-finding');
    paintHistory();
  }
  function paintHistory() {
    clear(view);
    var head = monthBar(), row = el('div', 'findbar'), label = el('label', 'find'), input = el('input', 'find__in'), x = btn('find__x'), cancel = btn('findbar__cancel', 'Отмена'), body = el('div', 'findbody');
    head.classList.add('bar--hist');
    input.id = 'findInput';
    input.type = 'text';
    input.maxLength = 40;
    input.placeholder = 'Заметка, категория или сумма';
    input.value = find.q;
    input.setAttribute('inputmode', 'search');
    input.setAttribute('enterkeyhint', 'search');
    input.setAttribute('autocomplete', 'off');
    input.setAttribute('aria-label', 'Поиск по записям');
    x.id = 'findClear';
    x.setAttribute('aria-label', 'Стереть');
    x.appendChild(icon('close'));
    x.hidden = !find.q;
    cancel.id = 'findCancel';
    add(label, icon('search'), input, x);
    add(row, label, cancel);
    // касание поля — режим поиска: «Октябрь» и шестерёнка уходят, справа «Отмена»; пока открыта клавиатура, вкладки и «Добавить» спрятаны
    input.addEventListener('focus', function () {
      stage.classList.add('is-finding');
      if (!find.on) { find.on = true; view.classList.add('is-find'); paintFindBody(body); }
    });
    input.addEventListener('blur', function () { stage.classList.remove('is-finding'); });
    input.addEventListener('input', function () { find.q = input.value; x.hidden = !input.value; paintFindBody(body); });
    input.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { input.blur(); } });
    x.addEventListener('mousedown', function (ev) { ev.preventDefault(); }); // поле не теряет фокус: клавиатура не закрывается
    x.addEventListener('click', function () { input.value = ''; find.q = ''; x.hidden = true; paintFindBody(body); input.focus(); });
    cancel.addEventListener('click', function () { haptic(); findClose(); });
    find.input = input;
    view.classList.toggle('is-find', find.on);
    add(view, head, row, body);
    paintFindBody(body);
  }

  // ---------- записи одной категории и сравнение с прошлым месяцем ----------
  function openCategory(kind, id) {
    var dict = F.dict(kind, id), prev = F.prevMonth(st.month);
    var ops = st.ops.filter(function (op) { return op.k === kind && op.c === id; }).sort(function (x, y) { return x.d === y.d ? (x.id < y.id ? 1 : -1) : (x.d < y.d ? 1 : -1); });
    var sum = 0, was = 0;
    ops.forEach(function (op) { sum += F.bynOf(op); });
    (kind === 'e' ? st.prev.cats : st.prev.srcs).forEach(function (c) { if (c.id === id) { was = c.sum; } });
    var text = ops.length + ' ' + F.plural(ops.length, 'запись', 'записи', 'записей');
    if (was) { text = F.inMonth(prev) + ' ' + F.fmt(was) + (sum === was ? ', столько же' : ', на' + F.NB + F.fmt(Math.abs(sum - was)) + (sum > was ? ' больше' : ' меньше')); }
    var lim = kind === 'e' && !F.creditOf(id) ? (st.limits[id] || 0) : -1; // -1 — у доходов и кредитов лимита не бывает
    haptic();
    swapModal('list', false, function (m) {
      var box = el('div', 'pick');
      var head = el('div', 'pick__big');
      var total = el('data', '', F.fmt(sum));
      total.id = 'catSum';
      add(head, el('h2', '', dict.name), total);
      var info = el('p', 'pick__info', text);
      info.id = 'catInfo';
      var limRow = null;
      if (lim >= 0) { // лимит этой категории: строка с кольцом и кнопка «Задать лимит» или «Изменить»
        limRow = el('div', 'hintrow hintrow--state hintrow--lim' + (lim && sum > lim ? ' is-over' : ''));
        limRow.id = 'catLimit';
        var p = el('p'), set = btn('capsule');
        set.id = 'catLimitBtn';
        if (lim) { add(p, limitRing(sum / lim), document.createTextNode(nb(limitText(sum, lim) + ' из ' + F.fmt(lim)))); } else { p.textContent = 'Лимита нет'; }
        set.appendChild(el('span', '', lim ? 'Изменить' : 'Задать лимит'));
        set.addEventListener('click', function () { openLimit(id, function () { openCategory(kind, id); }); });
        add(limRow, p, set);
      }
      var ul = el('ul', 'ops');
      ops.forEach(function (op) { var li = el('li'); li.appendChild(opRow(op, true)); ul.appendChild(li); });
      add(box, head, info, limRow, ul);
      m.appendChild(box);
    }, null);
  }

  // ---------- цели: вкладка, лист цели, новая цель, список ----------
  function gcur(g) { return F.CURS[g.u]; }
  /** сумма в валюте цели: у рублей копейки всегда, у валюты — только когда они не нулевые */
  function gm(minor, g) { return g.u === 0 ? F.fmt(minor) : (minor < 0 ? '−' : '') + F.fmtShort(minor); }
  function gmCur(minor, g) { return gm(minor, g) + (g.u === 0 ? '' : F.NB + gcur(g)); }
  function goalRest(g, have, long) {
    if (have >= g.a) { return have > g.a ? 'цель достигнута, сверх неё ' + gmCur(have - g.a, g) : 'цель достигнута'; }
    return 'ещё нужно ' + gmCur(g.a - have, g) + (long && g.u !== 0 ? ', это ' + F.fmt(F.goalByn(g, g.a - have)) + F.NB + 'BYN' : '');
  }
  /** сколько отложено за месяц по всем целям (или по одной), в рублях: снятое вычитается */
  function monthPut(month, g) {
    var sum = 0;
    (st.all[month] || []).forEach(function (op) { if (F.isGoalOp(op) && (!g || op.c === 'g_' + g.id)) { sum += (op.k === 'e' ? 1 : -1) * F.bynOf(op); } });
    return sum;
  }
  function signed(minor) { return (minor < 0 ? '−' : '+') + F.fmt(Math.abs(minor)); }
  function goalCard(g, tap) {
    var s = F.goalState(g, st.all), sec = el('section', 'goal'), b = btn('goal__btn'), head = el('span', 'cats__head'), pc = el('span', 'goal__pct', Math.min(100, Math.floor(s.have / g.a * 100)) + '%');
    b.setAttribute('data-goal', g.id);
    pc.appendChild(icon('right', 'share__go'));
    add(head, el('span', 'goal__title', g.name), pc);
    var line = el('span', 'goal__line'), track = el('i', 'goal__bar'), f = el('b');
    add(line, el('b', '', gm(s.have, g)), document.createTextNode(' из' + F.NB + gmCur(g.a, g)));
    f.style.transform = 'scaleX(' + Math.max(0, Math.min(1, s.have / g.a)).toFixed(4) + ')';
    track.appendChild(f);
    add(b, head, line, track, el('span', 'goal__rest', goalRest(g, s.have, true)));
    b.addEventListener('click', function () { tap(g); });
    sec.appendChild(b);
    return sec;
  }
  function newGoalBtn(back) {
    var b = btn('btn btn--quiet btn--new');
    b.id = 'goalNew';
    add(b, icon('plus'), document.createTextNode('Новая цель'));
    b.addEventListener('click', function () {
      if (F.GOALS.length >= F.GOALS_MAX) { haptic('err'); toast('Целей уже двенадцать. Удалите ту, что закрыта.'); return; }
      openGoalEdit(null, back || null, null);
    });
    return b;
  }
  /** строка записи цели: день, заметка, сколько отложено или снято в валюте цели; нажатие открывает правку */
  function goalRec(op, g) {
    var li = el('li'), b = btn('op op--bare'), name = el('span', '', F.dayLabel(op.d)), d = F.goalAmount(g, op.a, op.u, op.r);
    b.setAttribute('data-id', op.id);
    rowNote(name, [op.u !== gcur(g) ? F.fmtShort(op.a) + F.NB + op.u : '', op.n || ''].filter(Boolean).join(', '));
    add(b, name, el('data', op.k === 'e' ? 'is-plus' : '', (op.k === 'e' ? '+' : '−') + gm(d, g)), icon('right', 'share__go'));
    b.addEventListener('click', function () { openEntry(op); });
    li.appendChild(b);
    return li;
  }
  function goalRecs(g, s, limit) {
    var ul = el('ul', 'rows rows--ops');
    s.ops.slice(0, limit).forEach(function (op) { ul.appendChild(goalRec(op, g)); });
    if (g.s > 0) { // с этой суммы шкала началась: она не запись и не уменьшала остаток ни одного месяца
      var li = el('li'), row = el('div', 'op op--bare is-start');
      add(row, el('span', '', 'Уже было накоплено'), el('data', '', gm(g.s, g)), el('span'));
      li.appendChild(row);
      ul.appendChild(li);
    }
    return ul;
  }
  /** вкладка «Цели». Одна цель — она сама наверху крупно; несколько — общий итог в рублях и карточки */
  /** переключатель «Цели / Кредиты» под заголовком вкладки */
  function sectSeg() {
    var seg = el('div', 'seg tabseg');
    seg.setAttribute('role', 'group');
    seg.setAttribute('aria-label', 'Раздел');
    [['goals', 'Цели'], ['credits', 'Кредиты'], ['debts', 'Долги']].forEach(function (s) {
      var b = btn('', s[1]);
      b.setAttribute('data-sect', s[0]);
      b.setAttribute('aria-pressed', String(st.sect === s[0]));
      b.addEventListener('click', function () {
        if (st.sect === s[0]) { return; }
        st.sect = s[0];
        haptic();
        paint(true);
      });
      seg.appendChild(b);
    });
    return seg;
  }
  function tabHead(text) {
    var head = el('div', 'bar'), title = el('h1', 'month', text);
    title.id = 'goalsTitle';
    add(head, title, gearBtn());
    return head;
  }
  function paintGoals() {
    if (st.sect === 'credits') { paintCredits(); return; }
    if (st.sect === 'debts') { paintDebts(); return; }
    var goals = F.GOALS, now = F.monthOf(F.today()), head = tabHead('Цели');
    clear(view);
    if (!goals.length) {
      var empty = el('div', 'sheet sheet--top');
      add(empty, el('p', 'empty', nb('Целей пока нет. Заведите первую кнопкой «Новая цель» внизу: подушку, отпуск, технику. Приложение покажет, сколько накоплено и сколько ещё нужно.'))); // синяя внизу заводит первую: серая рядом была бы двойником
      add(view, head, sectSeg(), empty);
      return;
    }
    var hero = el('section', 'spent'), sumEl = el('p', 'spent__sum'), node = { whole: el('span'), frac: el('i') }, legend = el('div', 'spent__legend spent__legend--wrap'), sheet = el('div', 'sheet'), put;
    sumEl.id = 'goalsSum';
    if (goals.length === 1) {
      var g = goals[0], s = F.goalState(g, st.all), label = btn('spent__label spent__label--btn'), bar = el('div', 'spent__bar'), fill = el('div', 'spent__fill'), seg = el('i');
      label.id = 'goalHero';
      add(label, document.createTextNode(g.name), icon('right', 'share__go'));
      label.addEventListener('click', function () { openGoalView(g.id, null); });
      var parts = g.u === 0 ? F.fmtParts(s.have) : { sign: s.have < 0 ? '−' : '', whole: F.fmtShort(s.have).split(',')[0], frac: F.fmtShort(s.have).indexOf(',') >= 0 ? ',' + F.fmtShort(s.have).split(',')[1] : '' };
      node.whole.textContent = parts.sign + parts.whole;
      node.frac.textContent = parts.frac;
      sumEl.className = sumClass(s.have);
      add(sumEl, node.whole, node.frac, el('abbr', '', gcur(g)));
      seg.style.width = (Math.max(0, Math.min(1, s.have / g.a)) * 100).toFixed(2) + '%';
      fill.appendChild(seg);
      bar.appendChild(fill);
      bar.setAttribute('role', 'img');
      bar.setAttribute('aria-label', 'Накоплено ' + Math.min(100, Math.floor(s.have / g.a * 100)) + ' процентов цели');
      add(legend, el('span', '', 'из' + F.NB + gmCur(g.a, g)), el('span', '', goalRest(g, s.have, false)));
      add(hero, label, sumEl, bar, legend);
      var sec = el('section', 'cats'), secHead = el('div', 'cats__head');
      put = monthPut(now, g);
      add(secHead, el('h2', '', 'Записи'), put ? el('span', '', F.inMonth(now) + ' ' + signed(put)) : null);
      sec.appendChild(secHead);
      if (s.ops.length || g.s > 0) { var recs1 = goalRecs(g, s, 50); recs1.className = 'rows rows--ops rows--flat'; sec.appendChild(recs1); }
      else { sec.appendChild(el('p', 'empty', nb('Записей пока нет. Нажмите плюс внизу, чтобы отложить на цель.'))); }
      add(sheet, sec, newGoalBtn(null));
    } else {
      var total = 0, foreign = {}, cards = el('div', 'saved__goals');
      goals.forEach(function (x) {
        total += F.goalByn(x, F.goalState(x, st.all).have);
        if (x.u !== 0) { foreign[gcur(x)] = 1; }
        cards.appendChild(goalCard(x, function (it) { openGoalView(it.id, null); }));
      });
      var tp = F.fmtParts(total), codes = Object.keys(foreign);
      node.whole.textContent = tp.sign + tp.whole;
      node.frac.textContent = tp.frac;
      sumEl.className = sumClass(total);
      add(sumEl, node.whole, node.frac, el('abbr', '', 'BYN'));
      put = monthPut(now, null);
      var rate = !codes.length ? '' : codes.length > 1 ? 'валюта по' + F.NB + 'курсу приложения' : (codes[0] === 'USD' ? 'доллары' : 'евро') + ' по' + F.NB + 'курсу ' + F.fmtRate(F.RATES[codes[0]]);
      add(legend, el('span', '', put ? F.inMonth(now) + ' ' + signed(put) : ''), rate ? el('span', '', rate) : null);
      add(hero, el('p', 'spent__label', 'Накоплено'), sumEl, legend);
      add(sheet, cards, newGoalBtn(null));
    }
    add(view, head, sectSeg(), hero, sheet);
    fitSum(sumEl);
  }

  // ---------- кредиты и рассрочки: раздел, лист кредита, новый кредит, платёж ----------
  function activeCredits() { return F.CREDITS.filter(function (k) { return !(k.f & F.CLOSED); }); }
  /** набранная сумма для листа добавления: 1230,50 → «1230,5» */
  function digitsOf(minor) { return F.fmt(minor).replace(/\s/g, '').replace(/,00$/, '').replace(/(,\d)0$/, '$1'); }
  function payPreset(k) { return { kind: 'p', cat: k ? 'k_' + k.id : '', digits: k && k.p ? digitsOf(k.p) : '', cur: k ? F.CURS[k.u] : 'BYN' }; }
  function payOrNew() {
    var act = activeCredits(), now = F.monthOf(F.today()), due = null;
    if (!act.length) { openCreditEdit(null, null, null); return; }
    act.forEach(function (k) { if (!due && F.creditDue(k, F.creditState(k, st.all, now))) { due = k; } });
    openEntry(null, payPreset(due || (act.length === 1 ? act[0] : null))); // первым предлагается кредит, платёж по которому в этом месяце ещё ждёт
  }
  function creditPct(k, s) { return Math.min(100, Math.floor(Math.max(0, k.a - Math.max(0, s.left)) / k.a * 100)); }
  /** шкала кредита: отрезок на каждый платёж, погашенное залито; платёж этого месяца ещё не внесён — его отрезок контурный.
      Платёж не указан или платежей больше 24 — сплошная шкала */
  function segbar(k, s) {
    var done = Math.max(0, Math.min(k.a, k.a - s.left)), n = k.p ? Math.ceil(k.a / k.p) : 0, bar;
    if (!n || n > 24) {
      bar = el('i', 'goal__bar');
      var f = el('b');
      f.style.transform = 'scaleX(' + (done / k.a).toFixed(4) + ')';
      bar.appendChild(f);
    } else {
      var due = F.creditDue(k, s) ? Math.floor(done / k.p) : -1;
      bar = el('span', 'segbar');
      for (var i = 0; i < n; i++) {
        var cell = el('i', i === due ? 'is-due' : ''), fill = el('b');
        fill.style.width = (Math.max(0, Math.min(1, (done - i * k.p) / k.p)) * 100).toFixed(1) + '%';
        cell.appendChild(fill);
        bar.appendChild(cell);
      }
    }
    bar.setAttribute('role', 'img');
    bar.setAttribute('aria-label', 'Погашено ' + creditPct(k, s) + ' процентов');
    return bar;
  }
  /** строка под шкалой: сколько платежей осталось и когда последний */
  function creditRest(k, s, plan) {
    if (s.left < 0) { return 'погашено, переплата ' + gmCur(-s.left, k); }
    if (s.left === 0) { return 'всё погашено'; }
    if (!plan) { return 'погашено ' + creditPct(k, s) + '%, платёж в месяц не указан'; }
    if (plan.total) { return (plan.total - plan.n) + ' из ' + plan.total + ' ' + F.plural(plan.total, 'платежа', 'платежей', 'платежей') + ', последний в ' + plan.when; }
    return plan.n === 1 ? 'остался один платёж, в ' + plan.when : 'ещё ' + plan.n + ' ' + F.plural(plan.n, 'платёж', 'платежа', 'платежей') + ', последний в ' + plan.when;
  }
  function creditCard(k, tap) {
    var now = F.monthOf(F.today()), s = F.creditState(k, st.all, now), sec = el('section', 'goal'), b = btn('goal__btn'), head = el('span', 'cats__head'), pc = el('span', 'goal__pct'), line = el('span', 'goal__line');
    b.setAttribute('data-credit', k.id);
    pc.appendChild(icon('right', 'share__go'));
    add(head, el('span', 'goal__title', k.name), pc);
    if (s.left > 0) { add(line, document.createTextNode('осталось '), el('b', '', gm(s.left, k)), document.createTextNode(' из' + F.NB + gmCur(k.a, k))); }
    else { add(line, el('b', '', 'всё погашено'), document.createTextNode(' ' + gmCur(k.a, k))); }
    add(b, head, line, segbar(k, s), F.creditDue(k, s) ? el('span', 'goal__due', nb(F.inMonth(now) + ' не внесён')) : null, el('span', 'goal__rest', nb(creditRest(k, s, F.creditPlan(k, s)))));
    b.addEventListener('click', function () { tap(k); });
    sec.appendChild(b);
    return sec;
  }
  function newCreditBtn(back) {
    var b = btn('btn btn--quiet btn--new');
    b.id = 'creditNew';
    add(b, icon('plus'), document.createTextNode('Новый кредит'));
    b.addEventListener('click', function () {
      if (F.CREDITS.length >= F.CREDITS_MAX) { haptic('err'); toast('Кредитов уже двенадцать. Удалите погашенный.'); return; }
      openCreditEdit(null, back || null, null);
    });
    return b;
  }
  function closedRow(list, back) {
    var b = btn('more more--copy more--done');
    b.id = 'closedBtn';
    add(b, el('span', '', 'Погашенные'), el('data', '', String(list.length)), icon('right'));
    b.addEventListener('click', function () { openClosed(back); });
    return b;
  }
  /** раздел «Кредиты»: сколько осталось погасить по всем, у каждого кредита шкала по платежам */
  function paintCredits() {
    var now = F.monthOf(F.today()), head = tabHead('Кредиты'), act = activeCredits(), closed = F.CREDITS.filter(function (k) { return k.f & F.CLOSED; });
    clear(view);
    if (!act.length) {
      var empty = el('div', 'sheet sheet--top');
      add(empty, el('p', 'empty', nb(closed.length ? 'Все кредиты погашены. Новый заводится кнопкой «Новый кредит» внизу.' : 'Кредитов и рассрочек пока нет. Заведите их кнопкой «Новый кредит» внизу, и приложение покажет, сколько осталось погасить и когда последний платёж.')),
        closed.length ? closedRow(closed, null) : null);
      add(view, head, sectSeg(), empty);
      return;
    }
    var left = 0, paid = 0, foreign = {}, cards = el('div', 'saved__goals');
    act.forEach(function (k) {
      var s = F.creditState(k, st.all, now);
      left += F.goalByn(k, Math.max(0, s.left));
      paid += s.monthByn;
      if (k.u !== 0) { foreign[F.CURS[k.u]] = 1; }
      cards.appendChild(creditCard(k, function (it) { openCreditView(it.id, null); }));
    });
    var hero = el('section', 'spent'), sumEl = el('p', sumClass(left)), node = { whole: el('span'), frac: el('i') }, legend = el('div', 'spent__legend spent__legend--wrap'), sheet = el('div', 'sheet'), codes = Object.keys(foreign);
    sumEl.id = 'creditsSum';
    setSum(node, left);
    add(sumEl, node.whole, node.frac, el('abbr', '', 'BYN'));
    var rate = !codes.length ? '' : codes.length > 1 ? 'валюта по' + F.NB + 'курсу приложения' : (codes[0] === 'USD' ? 'доллары' : 'евро') + ' по' + F.NB + 'курсу ' + F.fmtRate(F.RATES[codes[0]]);
    var paidEl = el('span', '', nb(paid ? F.inMonth(now) + ' внесено ' + F.fmt(paid) : F.inMonth(now) + ' платежей ещё не было'));
    paidEl.id = 'creditsPaid';
    add(legend, paidEl, rate ? el('span', '', rate) : null);
    if (!rate) { legend.className = 'spent__legend'; } // одна подпись стоит слева, под суммой
    add(hero, el('p', 'spent__label', 'Осталось погасить'), sumEl, legend);
    add(sheet, cards, closed.length ? closedRow(closed, null) : null, newCreditBtn(null));
    add(view, head, sectSeg(), hero, sheet);
    fitSum(sumEl);
  }
  // ---------- долги между людьми (пункт 14, решение разработчика 19.10.2026: вариант А — раздел рядом с кредитами; «Осталось» в обе стороны) ----------
  // Подписи без рода и без склонения имени: пол человека и пользователя приложение не знает, «от Jo» правильно не склонит
  function debtBar(total, back) {
    var bar = el('i', 'goal__bar debt__bar'), f = el('b');
    f.style.transform = 'scaleX(' + Math.min(1, back / total).toFixed(4) + ')';
    bar.appendChild(f);
    bar.setAttribute('role', 'img');
    bar.setAttribute('aria-label', 'Возвращено ' + Math.min(100, Math.floor(back / total * 100)) + ' процентов');
    return bar;
  }
  /** строка под суммой: сколько уже вернули из долга, а без возвратов — сколько отдано или взято */
  function debtRest(s) {
    var total = Math.max(s.gave, s.got), back = Math.min(s.gave, s.got);
    return back > 0 ? 'возвращено ' + F.fmt(back) + ' из' + F.NB + F.fmt(total) : (s.bal > 0 ? 'отдано ' : 'взято ') + F.fmt(total);
  }
  function debtLine(bal) { return bal > 0 ? 'вернёт вам' : bal < 0 ? 'вы вернёте' : 'рассчитались'; }
  function debtCard(p, s) {
    var sec = el('section', 'goal'), b = btn('goal__btn debt'), head = el('span', 'cats__head'), pc = el('span', 'goal__pct'), line = el('span', 'goal__line');
    var total = Math.max(s.gave, s.got), back = Math.min(s.gave, s.got);
    b.setAttribute('data-debt', p.id);
    pc.appendChild(icon('right', 'share__go'));
    add(head, el('span', 'goal__title', p.name), pc);
    add(line, document.createTextNode(debtLine(s.bal) + ' '), el('b', '', F.fmt(Math.abs(s.bal))));
    add(b, head, line, back > 0 ? debtBar(total, back) : null, el('span', 'goal__rest', nb(debtRest(s)))); // пустая дорожка при нуле читалась бы как незагруженная шкала
    b.addEventListener('click', function () { openDebtView(p.id, null); });
    sec.appendChild(b);
    return sec;
  }
  /** «Новый человек» серой кнопкой по центру, как «Новая цель» и «Новый кредит»; деньги вносит синяя «Записать долг» */
  function newPersonBtn() {
    var b = btn('btn btn--quiet btn--new');
    b.id = 'debtPerson';
    add(b, icon('plus'), document.createTextNode('Новый человек'));
    b.addEventListener('click', function () {
      if (F.DEBTS.length >= F.DEBTS_MAX) { haptic('err'); toast('Людей уже сорок. Удалите того, с кем рассчитались.'); return; }
      openDebtEdit(null, null, function (id) { openDebtView(id, null); });
    });
    return b;
  }
  function settledRow(list) {
    var b = btn('more more--copy more--done');
    b.id = 'settledBtn';
    add(b, el('span', '', 'Рассчитались'), el('data', '', String(list.length)), icon('right'));
    b.addEventListener('click', openSettled);
    return b;
  }
  /** раздел «Долги»: крупно большая сторона, у человека имя, одно число и шкала возврата; рассчитавшиеся — одной строкой */
  function paintDebts() {
    var head = tabHead('Долги'), all = F.DEBTS.map(function (p) { return { p: p, s: F.debtState(p, st.all) }; });
    var act = all.filter(function (x) { return x.s.bal !== 0; }).sort(function (x, y) { return Math.abs(y.s.bal) - Math.abs(x.s.bal); }), settled = all.filter(function (x) { return x.s.bal === 0; });
    clear(view);
    if (!act.length) {
      var empty = el('div', 'sheet sheet--top');
      add(empty, el('p', 'empty', nb(settled.length ? 'Со всеми рассчитались. Новый долг — кнопкой «Записать долг» внизу.' : 'Долгов нет. Запишите, кому дали или у кого взяли: кнопка «Записать долг» внизу.')), settled.length ? settledRow(settled) : null);
      add(view, head, sectSeg(), empty);
      return;
    }
    var plus = 0, minus = 0, cards = el('div', 'saved__goals');
    act.forEach(function (x) {
      if (x.s.bal > 0) { plus += x.s.bal; } else { minus -= x.s.bal; }
      cards.appendChild(debtCard(x.p, x.s));
    });
    var mine = minus > plus, big = mine ? minus : plus, other = mine ? plus : minus; // крупно большая сторона: сколько должны вам или сколько должны вы
    var hero = el('section', 'spent'), sumEl = el('p', sumClass(big)), node = { whole: el('span'), frac: el('i') }, sheet = el('div', 'sheet');
    sumEl.id = 'debtsSum';
    setSum(node, big);
    add(sumEl, node.whole, node.frac, el('abbr', '', 'BYN'));
    var legend = null;
    if (other) {
      legend = el('div', 'spent__legend');
      var o = el('span', '', (mine ? 'вам должны ' : 'вы должны ') + F.fmt(other));
      o.id = 'debtsOther';
      legend.appendChild(o);
    }
    var label = el('p', 'spent__label', mine ? 'Вы должны' : 'Вам должны');
    label.id = 'debtsLabel';
    add(hero, label, sumEl, legend);
    add(sheet, cards, settled.length ? settledRow(settled) : null, newPersonBtn());
    add(view, head, sectSeg(), hero, sheet);
    fitSum(sumEl);
  }
  function openSettled() {
    var list = F.DEBTS.filter(function (p) { return F.debtState(p, st.all).bal === 0; });
    haptic();
    swapModal('list', false, function (m) {
      var box = el('div', 'pick'), ul = el('ul', 'rows rows--ops');
      ul.id = 'settledList';
      list.forEach(function (p) {
        var li = el('li'), b = btn('op op--bare'), s = F.debtState(p, st.all), name = el('span', '', p.name);
        b.setAttribute('data-debt', p.id);
        rowNote(name, s.ops.length ? 'с ' + F.dayLabel(s.ops[s.ops.length - 1].d) : '');
        add(b, name, el('data', '', F.fmt(Math.max(s.gave, s.got))), icon('right', 'share__go'));
        b.addEventListener('click', function () { openDebtView(p.id, openSettled); });
        li.appendChild(b);
        ul.appendChild(li);
      });
      add(box, el('h2', 'pick__title', 'Рассчитались'), el('p', 'pick__info', nb('Долгов между вами нет. Записи остаются в «Истории».')), ul);
      m.appendChild(box);
    }, null);
  }
  function debtRec(op) {
    var li = el('li'), b = btn('op op--bare'), name = el('span', '', F.dayLabel(op.d));
    b.setAttribute('data-id', op.id);
    rowNote(name, [op.k === 'e' ? 'отдано' : 'получено', op.u !== 'BYN' ? F.fmtShort(op.a) + F.NB + op.u : '', op.n || ''].filter(Boolean).join(', '));
    add(b, name, el('data', '', F.fmt(F.bynOf(op))), icon('right', 'share__go'));
    b.addEventListener('click', function () { openEntry(op); });
    li.appendChild(b);
    return li;
  }
  /** лист человека: сколько вернут крупно, шкала возврата, записи словами; внизу две кнопки по тому, кто кому должен */
  function openDebtView(id, back) {
    var p = F.find(F.DEBTS, id);
    if (!p) { return; }
    var s = F.debtState(p, st.all), total = Math.max(s.gave, s.got), returned = Math.min(s.gave, s.got);
    haptic();
    swapModal('list', false, function (m) {
      var box = el('div', 'pick pick--goalview'), top = el('div', 'goal__top'), edit = btn('capsule'), sum = el('p', 'goal__sum'), num = el('span', 'goal__num'), parts = F.fmtParts(Math.abs(s.bal));
      box.id = 'debtView';
      edit.id = 'debtEdit';
      edit.appendChild(el('span', '', 'Изменить'));
      edit.addEventListener('click', function () { openDebtEdit(p, function () { openDebtView(id, back); }, function () { openDebtView(id, back); }); });
      add(top, el('h2', 'pick__title', p.name), edit);
      sum.id = 'debtBal';
      add(num, el('span', '', parts.whole), el('i', '', parts.frac));
      add(sum, num, el('small', '', debtLine(s.bal)));
      add(box, top, sum);
      if (returned > 0 && s.bal !== 0) {
        var meter = el('div', 'goal__meter');
        add(meter, debtBar(total, returned), el('span', '', 'возвращено ' + Math.min(100, Math.floor(returned / total * 100)) + '%'));
        box.appendChild(meter);
      }
      var info = el('p', 'pick__info', nb(s.bal > 0 ? 'Это не трата: в «Потрачено» не входит, но пока деньги не вернулись, на руках у вас на ' + F.fmt(s.bal) + ' меньше.'
        : s.bal < 0 ? 'Это не доход: в доходы не входит, но пока вы не вернули, на руках у вас на ' + F.fmt(-s.bal) + ' больше.' : 'Долгов между вами нет. Записи остаются в «Истории».'));
      info.id = 'debtInfo';
      box.appendChild(info);
      box.appendChild(el('p', 'lbl lbl--gap', 'Записи'));
      if (s.ops.length) {
        var ul = el('ul', 'rows rows--ops');
        s.ops.slice(0, 50).forEach(function (op) { ul.appendChild(debtRec(op)); });
        box.appendChild(ul);
      } else { box.appendChild(el('p', 'pick__info', nb('Записей пока нет.'))); }
      // кому должны вы — «Взять ещё» и «Вернуть», кто должен вам — «Дать ещё» и «Получить»
      var foot = el('footer', 'modal__dock modal__dock--duo'), quiet = btn('btn btn--quiet', s.bal < 0 ? 'Взять ещё' : s.bal > 0 ? 'Дать ещё' : 'Дать'), main = btn('btn', s.bal < 0 ? 'Вернуть' : 'Получить');
      quiet.id = 'debtMore';
      main.id = 'debtMain';
      quiet.addEventListener('click', function () { openEntry(null, { kind: s.bal < 0 ? 'get' : 'give', cat: 'd_' + id }); });
      main.addEventListener('click', function () { openEntry(null, { kind: s.bal < 0 ? 'give' : 'get', cat: 'd_' + id }); });
      add(foot, quiet, main);
      add(m, box, foot);
    }, back);
  }
  /** новый человек или переименование; удаление убирает и записи долга */
  function openDebtEdit(p, back, done) {
    var busy = false, nameEl = null;
    haptic();
    swapModal('list', false, function (m) {
      var box = el('div', 'pick pick--cat pick--newgoal'), foot = el('footer', 'modal__dock'), go = btn('btn', p ? 'Сохранить' : 'Добавить'), info = el('p', 'pick__info'), lbl = el('label', 'lbl', 'Имя');
      nameEl = el('input', 'field');
      nameEl.id = 'debtName';
      nameEl.type = 'text';
      nameEl.maxLength = 24;
      nameEl.placeholder = 'Например, Саша';
      nameEl.value = p ? p.name : '';
      nameEl.setAttribute('enterkeyhint', 'done');
      nameEl.setAttribute('autocomplete', 'off');
      nameEl.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { nameEl.blur(); } });
      lbl.setAttribute('for', 'debtName');
      info.id = 'debtMsg';
      info.textContent = nb(p ? 'Имя видно только вам.' : 'Одно имя — один человек: все долги с ним будут в одной строке.');
      go.id = 'debtSave';
      go.addEventListener('mousedown', function (ev) { ev.preventDefault(); });
      go.addEventListener('click', function () {
        if (busy) { return; }
        var name = F.cleanNote(nameEl.value).slice(0, 24).replace(/ $/, ''), key = name.toLowerCase();
        var same = null;
        F.DEBTS.forEach(function (x) { if (!same && x.name.toLowerCase() === key && (!p || x.id !== p.id)) { same = x; } });
        if (!name) { info.textContent = 'Введите имя.'; haptic('err'); return; }
        if (same && p) { info.textContent = nb('Человек с таким именем уже есть.'); haptic('err'); return; }
        if (same) { haptic(); if (done) { done(same.id); } return; } // такое имя уже есть: выбираем его, второй «Саша» не появится
        if (!p && F.DEBTS.length >= F.DEBTS_MAX) { info.textContent = nb('Людей уже сорок. Удалите того, с кем рассчитались.'); haptic('err'); return; }
        var list = F.packDebts(), id = p ? p.id : F.catId(idsOf(list));
        if (p) { list = list.map(function (x) { return x[0] === id ? [id, name] : x; }); } else { list.push([id, name]); }
        busy = true;
        store.patchDebts(function () { return list; }, function (err) {
          if (err) { busy = false; haptic('err'); toast(explain(err)); return; }
          haptic('ok');
          reload(false, function () { if (done) { done(id); } else if (back) { back(); } else { closeModal(0); } });
        });
      });
      var del = null;
      if (p) {
        del = btn('link', 'Удалить человека');
        del.id = 'debtDel';
        del.addEventListener('click', function () {
          if (busy) { return; }
          ask('Удалить «' + p.name + '» и записи долга? «Осталось» пересчитается без них.', function (yes) {
            if (!yes) { return; }
            var list = [], cat = 'd_' + p.id;
            Object.keys(st.all).forEach(function (month) { st.all[month].forEach(function (op) { if (op.c === cat) { list.push({ id: op.id, m: month }); } }); });
            busy = true;
            store.removeOps(list, function (err) {
              if (err) { busy = false; haptic('err'); toast(explain(err)); return; }
              store.patchDebts(function (cur) { return cur.filter(function (x) { return x[0] !== p.id; }); }, function (err2) {
                if (err2) { busy = false; haptic('err'); toast(explain(err2)); return; }
                haptic('ok');
                closeModal(0);
                reload(true, function () { toast('Удалено'); });
              });
            });
          });
        });
      }
      add(box, el('h2', 'pick__title', p ? 'Изменить' : 'Новый человек'), lbl, nameEl, info, del);
      foot.appendChild(go);
      add(m, box, foot);
    }, back);
    if (!p && nameEl) { nameEl.focus(); }
  }
  /** верх листа ввода долга: имя крупно слева (без склонения) и серым — что делаем */
  function debtTop(op) {
    var p = F.debtOf(entry.cat), top = el('div', 'entry__who'), bal = p ? F.debtState(p, st.all, op ? op.id : null).bal : 0;
    var sub = op ? (op.k === 'e' ? 'отдано' : 'получено') : entry.fresh ? '' : entry.kind === 'give' ? (bal < 0 ? 'возврат' : 'дать') : (bal > 0 ? 'возврат' : 'взять');
    top.id = 'entryWho';
    add(top, el('h2', 'pick__title', entry.fresh ? 'Новый долг' : p ? p.name : 'Долг'), sub ? el('span', '', sub) : null);
    return top;
  }
  /** под суммой долга: каким он станет; при возврате — «Вся сумма» одним касанием */
  function debtHints(e, minor, byn) {
    var p = F.debtOf(e.cat);
    if (!p) { e.hint.textContent = nb(e.kind === 'give' ? 'Это не трата: в «Потрачено» не войдёт' : 'Это не доход: в доходы не войдёт'); return; }
    var bal = F.debtState(p, st.all, e.edit ? e.edit.id : null).bal, will = bal + (minor ? (e.kind === 'give' ? byn : -byn) : 0);
    if (will > 0) { add(e.hint, document.createTextNode('Вернёт вам '), el('b', '', F.fmt(will))); }
    else if (will < 0) { add(e.hint, document.createTextNode('Вы вернёте '), el('b', '', F.fmt(-will))); }
    else { e.hint.appendChild(el('b', '', 'Рассчитались')); }
    var giveBack = (e.kind === 'give' && bal < 0) || (e.kind === 'get' && bal > 0);
    if (giveBack && !e.edit) {
      var all = btn('quick__btn');
      all.id = 'debtAll';
      add(all, el('span', '', 'Вся сумма'), el('b', '', F.fmt(Math.abs(bal))));
      all.addEventListener('click', function () {
        if (!entry || entry.busy) { return; }
        entry.digits = digitsOf(Math.abs(bal));
        entry.cur = 'BYN';
        haptic();
        paintEntry();
      });
      e.quick.appendChild(all);
      e.quick.hidden = false;
      e.hint.hidden = false;
    }
  }
  /** строка платежа на листе кредита: день, заметка, сумма в валюте кредита; нажатие открывает правку */
  function creditRec(op, k) {
    var li = el('li'), b = btn('op op--bare'), name = el('span', '', F.dayLabel(op.d));
    b.setAttribute('data-id', op.id);
    rowNote(name, [op.u !== F.CURS[k.u] ? F.fmtShort(op.a) + F.NB + op.u : '', op.n || ''].filter(Boolean).join(', '));
    add(b, name, el('data', '', gm(F.goalAmount(k, op.a, op.u, op.r), k)), icon('right', 'share__go'));
    b.addEventListener('click', function () { openEntry(op); });
    li.appendChild(b);
    return li;
  }
  /** лист кредита: сколько осталось крупно, шкала, срок и последний платёж, платежи; внизу «Внести», пока платёж месяца не внесён */
  function openCreditView(id, back) {
    var k = F.find(F.CREDITS, id);
    if (!k) { return; }
    var now = F.monthOf(F.today()), s = F.creditState(k, st.all, now), plan = F.creditPlan(k, s), closed = !!(k.f & F.CLOSED);
    haptic();
    swapModal('list', false, function (m) {
      var box = el('div', 'pick pick--goalview'), top = el('div', 'goal__top'), edit = btn('capsule'), sum = el('p', 'goal__sum'), meter = el('div', 'goal__meter goal__meter--seg'), foot = null;
      edit.id = 'creditEdit';
      edit.appendChild(el('span', '', 'Изменить'));
      edit.addEventListener('click', function () { openCreditEdit(k, function () { openCreditView(id, back); }, null); });
      add(top, el('h2', 'pick__title', k.name), edit);
      var text = gm(Math.max(0, s.left), k), comma = text.indexOf(','), num = el('span', 'goal__num');
      sum.id = 'creditLeft';
      if (k.u === 0 && comma < 0) { text += ',00'; comma = text.indexOf(','); }
      add(num, el('span', '', comma >= 0 ? text.slice(0, comma) : text), el('i', '', comma >= 0 ? text.slice(comma) : ''));
      add(sum, num, el('small', '', 'осталось из' + F.NB + gmCur(k.a, k)));
      add(meter, segbar(k, s), el('span', '', 'погашено ' + creditPct(k, s) + '%'));
      var line;
      if (s.left <= 0) {
        var count = k.p ? s.ops.length + Math.ceil(k.s / k.p) : 0; // погашенное до учёта — столько платежей, сколько в нём помещается
        line = (count ? 'Всё погашено: ' + gmCur(k.a, k) + ' за ' + count + ' ' + F.plural(count, 'платёж', 'платежа', 'платежей') : 'Погашено полностью: ' + gmCur(k.a, k)) + '.';
        if (s.left < 0) { line += ' Переплата ' + gmCur(-s.left, k) + '.'; }
        line += ' Платежи остаются в «Истории» и в тратах своих месяцев.';
      } else if (plan) {
        line = 'Платёж ' + F.fmtShort(k.p) + (k.u === 0 ? '' : F.NB + F.CURS[k.u]) + ' в' + F.NB + 'месяц: ' + (plan.n === 1 ? 'остался один, в ' + plan.when : 'ещё ' + plan.n + ' ' + F.plural(plan.n, 'платёж', 'платежа', 'платежей') + ', последний в ' + plan.when + (plan.last !== k.p ? ', ' + gm(plan.last, k) : '')) + '.';
      } else {
        line = 'Платёж в месяц не указан: шкала идёт по внесённым платежам. Впишите его в «Изменить», и приложение посчитает, сколько платежей осталось.';
      }
      if (s.left > 0 && k.u !== 0) { line += ' Это ' + F.fmt(F.goalByn(k, s.left)) + F.NB + 'BYN по' + F.NB + 'курсу ' + F.fmtRate(F.RATES[F.CURS[k.u]]) + '.'; }
      var info = el('p', 'pick__info', nb(line));
      info.id = 'creditInfo';
      add(box, top, sum, meter, info);
      if (s.left > 0 && s.month > 0 && !closed) { // платёж месяца внесён: вместо кнопки строка состояния, внести ещё можно серой кнопкой
        var row = el('div', 'hintrow hintrow--state'), more = btn('capsule');
        row.id = 'creditPaid';
        more.id = 'creditMore';
        more.appendChild(el('span', '', 'Внести ещё'));
        more.addEventListener('click', function () { openEntry(null, payPreset(k)); });
        add(row, el('p', '', F.monthLabel(now).split(F.NB)[0] + ' внесён'), more);
        box.appendChild(row);
      }
      box.appendChild(el('p', 'lbl lbl--gap', 'Платежи'));
      if (s.ops.length || k.s > 0) {
        var ul = el('ul', 'rows rows--ops');
        s.ops.slice(0, 40).forEach(function (op) { ul.appendChild(creditRec(op, k)); });
        if (k.s > 0) {
          var li = el('li'), start = el('div', 'op op--bare is-start');
          add(start, el('span', '', 'Уже было погашено'), el('data', '', gm(k.s, k)), el('span'));
          li.appendChild(start);
          ul.appendChild(li);
        }
        box.appendChild(ul);
      } else { box.appendChild(el('p', 'pick__info', nb('Платежей пока нет: нажмите «Внести».'))); }
      if (closed || s.left <= 0) { // погашенный: убрать в «Погашенные» или вернуть оттуда
        foot = el('footer', 'modal__dock');
        var move = btn('btn btn--quiet', closed ? 'Вернуть в кредиты' : 'Убрать в погашенные');
        move.id = 'creditMove';
        move.addEventListener('click', function () {
          saveCredits(function (list) { return list.map(function (x) { return x[0] === id ? [x[0], x[1], x[2], x[3], x[4], x[5], closed ? x[6] & ~F.CLOSED : (x[6] | F.CLOSED) & ~F.REMIND] : x; }); }, function (ok) {
            if (!ok) { return; }
            haptic('ok');
            closeModal(0);
            toast(closed ? 'Кредит снова в списке' : 'Кредит убран в погашенные');
          });
        });
        foot.appendChild(move);
      } else if (s.month <= 0) {
        foot = el('footer', 'modal__dock');
        var pay = btn('btn', k.p ? 'Внести ' + gmCur(k.p, k) : 'Внести платёж');
        pay.id = 'creditPay';
        pay.addEventListener('click', function () { openEntry(null, payPreset(k)); });
        foot.appendChild(pay);
      }
      add(m, box, foot);
    }, back);
  }
  /** список кредитов пишется одной записью; done(true) — сохранено и экран обновлён */
  function saveCredits(fn, done) {
    store.patchCredits(fn, function (err) {
      if (err) { haptic('err'); toast(err === 'too long' ? 'Список кредитов не помещается: сократите названия.' : explain(err)); done(false); return; }
      reload(false, function (e) { done(!e); });
    });
  }
  /** погашенные кредиты листом: нажатие открывает кредит, там его можно вернуть */
  function openClosed(back) {
    var list = F.CREDITS.filter(function (k) { return k.f & F.CLOSED; });
    if (!list.length) { return; }
    haptic();
    swapModal('list', false, function (m) {
      var box = el('div', 'pick');
      add(box, el('h2', 'pick__title', 'Погашенные'), el('p', 'pick__info', nb('Платежи по ним остаются в «Истории» и в тратах своих месяцев.')));
      list.forEach(function (k) { box.appendChild(creditCard(k, function (it) { openCreditView(it.id, function () { openClosed(back); }); })); });
      m.appendChild(box);
    }, back || null);
  }
  /** строка напоминания на главной: «Не внесено: Рассрочка 150,00», кнопка «Внести» и крестик, который убирает напоминание этого кредита */
  function remindRow(k, sample) {
    var row = el('div', 'remind' + (sample ? ' remind--sample' : '')), text = el('span'), sub = el('small');
    row.setAttribute('data-credit', k.id);
    if (k.p) { add(sub, document.createTextNode('не внесено · '), el('b', '', gmCur(k.p, k))); } else { sub.textContent = nb('платёж месяца не внесён'); } // платёж в месяц не указан: напоминание без суммы
    add(text, el('strong', '', k.name), sub);
    row.appendChild(text);
    if (sample) { // образец на листе вопроса: та же строка с кнопками, только не нажимается
      var fake = el('span', 'capsule'), fx = el('span', 'remind__x');
      fake.appendChild(el('span', '', 'Внести'));
      fx.appendChild(icon('close'));
      add(row, fake, fx);
      row.setAttribute('aria-hidden', 'true');
      return row;
    }
    var pay = btn('capsule remind__pay'), x = btn('remind__x');
    pay.appendChild(el('span', '', 'Внести'));
    pay.addEventListener('click', function () { openEntry(null, payPreset(k)); });
    x.setAttribute('aria-label', 'Убрать напоминание');
    x.appendChild(icon('close'));
    x.addEventListener('click', function () {
      setRemind(k.id, false, function (ok) {
        if (!ok) { return; }
        haptic('ok');
        toast('Напоминание убрано\nВключить снова: «Изменить» в листе кредита', 'Вернуть', function () { setRemind(k.id, true, function () {}); });
      });
    });
    add(row, pay, x);
    return row;
  }
  /** строка на главной: напоминание включено, кредит не погашен и не убран, в этом месяце платежей ещё не было. Платёж в месяц не обязателен */
  function remindDue(k, s) { return !!(k.f & F.REMIND) && !(k.f & F.CLOSED) && s.left > 0 && s.month <= 0; }
  function setRemind(id, on, done) {
    saveCredits(function (list) { return list.map(function (x) { return x[0] === id ? [x[0], x[1], x[2], x[3], x[4], x[5], on ? x[6] | F.REMIND : x[6] & ~F.REMIND] : x; }); }, done);
  }
  /** один раз после нового кредита: показывать ли напоминание на главной. Выбор потом меняется в «Изменить» или крестиком на самой строке */
  function askRemind(id, after) {
    var k = F.find(F.CREDITS, id);
    if (!k) { after(); return; }
    swapModal('list', false, function (m) {
      var box = el('div', 'pick pick--cat pick--ask'), foot = el('footer', 'modal__dock modal__dock--duo'), yes = btn('btn', 'Напоминать'), no = btn('btn btn--quiet', 'Не нужно'), busy = false;
      var lead = el('p', 'pick__info pick__info--lead', nb('Пока платёж месяца не внесён, на главной под шкалой будет такая строка. Убрать её можно прямо там, крестиком.'));
      lead.id = 'remindInfo';
      add(box, el('h2', 'pick__title', 'Напоминать на главной?'), lead, remindRow(k, true));
      yes.id = 'remindYes';
      no.id = 'remindNo';
      yes.addEventListener('click', function () {
        if (busy) { return; }
        busy = true;
        setRemind(id, true, function (ok) { busy = false; if (ok) { haptic('ok'); after(); } });
      });
      no.addEventListener('click', function () { if (!busy) { haptic(); after(); } });
      add(foot, yes, no);
      add(m, box, foot);
    }, null);
  }
  /** новый кредит или правка: название, сумма, валюта (у существующего не меняется), сколько было погашено до учёта, платёж в месяц (можно не писать) */
  function openCreditEdit(k, back, done) {
    var u = k ? k.u : 0, busy = false, nameEl = null, remind = k ? !!(k.f & F.REMIND) : false;
    haptic();
    swapModal('list', false, function (m) {
      var box = el('div', 'pick pick--cat pick--newgoal'), foot = el('footer', 'modal__dock' + (k ? ' modal__dock--bar' : '')), go = btn('btn', 'Сохранить'), row = el('div', 'field-row'), cur = btn(k ? 'cur cur--fixed' : 'cur'), curText = el('span');
      function field(id, value, ph, mode, max) {
        var f = el('input', 'field');
        f.id = id;
        f.type = 'text';
        f.maxLength = max;
        f.placeholder = ph;
        f.value = value;
        if (mode) { f.setAttribute('inputmode', mode); }
        f.setAttribute('enterkeyhint', 'done');
        f.setAttribute('autocomplete', 'off');
        f.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { f.blur(); } });
        return f;
      }
      function label(text, id) { var l = el('label', 'lbl', text); l.setAttribute('for', id); return l; }
      function plain(minor) { return minor ? F.fmt(minor).replace(/,00$/, '') : ''; }
      function num(f) { var raw = f.value.replace(/\s/g, ''); return raw ? F.parseAmount(f.value) : 0; }
      function bad(f) { var raw = f.value.replace(/\s/g, ''); return !!raw && !F.parseAmount(f.value) && !/^0+([.,]0+)?$/.test(raw); }
      nameEl = field('creditName', k ? k.name : '', 'Например, рассрочка на телефон', '', 24);
      var sum = field('creditSum', k ? plain(k.a) : '', 'например, 900', 'decimal', 14), start = field('creditStart', k ? plain(k.s) : '', '0', 'decimal', 14), pay = field('creditPayIn', k ? plain(k.p) : '', 'например, 150', 'decimal', 14);
      var startLbl = label('', 'creditStart'), payLbl = label('', 'creditPayIn'), info = el('p', 'pick__info');
      info.id = 'creditMsg';
      // платежи, которые раньше записывали в категорию со значком карты («Кредиты»): их сумму можно вписать в «Уже было погашено» одним касанием
      var old = 0, oldName = '';
      if (!k) {
        F.CATS.concat(F.OFF.e).forEach(function (c) { if (c.icon === 'card' && !oldName) { oldName = c.name; } });
        Object.keys(st.all).forEach(function (month) { st.all[month].forEach(function (op) { var c = op.k === 'e' && !F.isCreditOp(op) ? F.dict('e', op.c) : null; if (c && c.icon === 'card' && c.name === oldName) { old += F.bynOf(op); } }); });
      }
      var hint = null;
      if (old > 0) {
        hint = el('div', 'hintrow');
        var fill = btn('capsule');
        fill.id = 'creditFill';
        fill.appendChild(el('span', '', 'Вписать'));
        fill.addEventListener('mousedown', function (ev) { ev.preventDefault(); });
        fill.addEventListener('click', function () { start.value = plain(old); haptic(); texts(); });
        add(hint, el('p', '', nb('В категории «' + oldName + '» уже записано ' + F.fmt(old))), fill);
      }
      function texts() {
        var code = F.CURS[u], a = F.parseAmount(sum.value), s0 = num(start), p = num(pay), msg = [];
        curText.textContent = code;
        cur.setAttribute('aria-label', 'Валюта кредита: ' + code + (k ? '' : '. Нажмите, чтобы сменить'));
        startLbl.textContent = 'Уже было погашено' + (code === 'BYN' ? '' : ', ' + code);
        payLbl.textContent = 'Платёж в месяц' + (code === 'BYN' ? '' : ', ' + code) + ', можно не писать';
        if (hint) { hint.hidden = code !== 'BYN'; }
        if (a && p && a > s0) { var n = Math.ceil((a - s0) / p); msg.push((s0 ? 'Осталось ' : 'Это ') + n + ' ' + F.plural(n, 'платёж', 'платежа', 'платежей') + '.'); }
        msg.push('Проценты приложение не считает: впишите остаток по выписке банка. Платёж записывается тратой и входит в «Потрачено».');
        info.textContent = nb(msg.join(' '));
      }
      [sum, start, pay].forEach(function (f) { f.addEventListener('input', texts); });
      cur.id = 'creditCur';
      add(cur, curText, k ? null : icon('down'));
      cur.addEventListener('click', function () { // валюта выбирается у нового кредита: у существующего в ней посчитаны платежи
        if (k) { haptic('err'); toast('Валюту кредита сменить нельзя: в ней посчитаны платежи'); return; }
        u = (u + 1) % F.CURS.length;
        haptic();
        texts();
      });
      add(row, sum, cur);
      var sw = null;
      if (k) { // напоминание на главной: включается и выключается здесь
        sw = btn('switch-row');
        sw.id = 'creditRemind';
        sw.setAttribute('role', 'switch');
        var knob = el('i', 'switch');
        add(sw, el('span', '', 'Напоминать на главной'), knob);
        var swInfo = el('p', 'pick__info pick__info--switch'), swBusy = false, kState = F.creditState(k, st.all, F.monthOf(F.today()));
        swInfo.id = 'creditRemindInfo';
        var paint1 = function () {
          sw.setAttribute('aria-checked', String(remind));
          // строка появляется не всегда: объясняем, когда её ждать (14.10.2026 разработчик включил напоминание и не увидел строку)
          swInfo.textContent = nb(!remind ? 'Строки на главной нет.' : kState.left <= 0 ? 'Кредит погашен: строки на главной не будет.'
            : kState.month > 0 ? F.monthLabel(F.monthOf(F.today())).split(F.NB)[0] + ' уже внесён: строка появится на главной в начале следующего месяца.'
            : 'Строка уже на главной: она видна, пока платёж месяца не внесён.');
        };
        sw.addEventListener('mousedown', function (ev) { ev.preventDefault(); });
        sw.addEventListener('click', function () { // срабатывает сразу, как переключатель в iOS: «Сохранить» нажимать не нужно
          if (swBusy) { return; }
          swBusy = true;
          var next = !remind;
          setRemind(k.id, next, function (ok) { swBusy = false; if (ok) { remind = next; haptic('ok'); paint1(); } });
        });
        paint1();
      }
      go.id = 'creditSave';
      go.addEventListener('mousedown', function (ev) { ev.preventDefault(); }); // нажатие не снимает фокус с поля: лист не прыгает под пальцем
      go.addEventListener('click', function () {
        if (busy) { return; }
        var name = F.cleanNote(nameEl.value).slice(0, 24).replace(/ $/, ''), a = F.parseAmount(sum.value), s0 = num(start), p = num(pay);
        var same = F.CREDITS.some(function (x) { return x.name.toLowerCase() === name.toLowerCase() && (!k || x.id !== k.id); });
        var why = !name ? 'Введите название кредита.' : same ? 'Кредит с таким названием уже есть.' : !a ? 'Введите сумму кредита цифрами: например 900.' : bad(start) ? 'Введите, сколько уже погашено, цифрами.' : bad(pay) ? 'Введите платёж в месяц цифрами или оставьте пустым.' : '';
        if (why) { info.textContent = why; haptic('err'); return; }
        var id = k ? k.id : F.catId(idsOf(F.packCredits()));
        busy = true;
        saveCredits(function (list) { // отметки (напоминание, погашенные) берутся из сохранённого списка: переключатель пишет их сам
          if (k) { return list.map(function (x) { return x[0] === id ? [id, name, a, u, s0, p, x[6]] : x; }); }
          return list.concat([[id, name, a, u, s0, p, 0]]);
        }, function (ok) {
          if (!ok) { busy = false; return; }
          haptic('ok');
          var after = function () { if (done) { done(id); } else if (back) { back(); } else { closeModal(0); } };
          if (!k) { askRemind(id, after); } else { after(); } // новый кредит: спросить про напоминание на главной
        });
      });
      var del = null;
      if (k) {
        del = btn('link', 'Удалить кредит');
        del.id = 'creditDel';
        del.addEventListener('click', function () {
          if (busy) { return; }
          ask('Удалить кредит «' + k.name + '»? Его платежи останутся в тратах своих месяцев.', function (yes) {
            if (!yes) { return; }
            busy = true;
            saveCredits(function (list) { return list.filter(function (x) { return x[0] !== k.id; }); }, function (ok) {
              if (!ok) { busy = false; return; }
              haptic('ok');
              closeModal(0);
              toast('Кредит удалён');
            });
          });
        });
      }
      texts();
      add(box, el('h2', 'pick__title', k ? 'Изменить кредит' : 'Новый кредит'), label('Название', 'creditName'), nameEl, label('Сумма кредита', 'creditSum'), row, startLbl, start, hint, payLbl, pay, info, sw, sw ? swInfo : null, del);
      foot.appendChild(go);
      add(m, box, foot);
    }, back);
    if (!k && nameEl) { nameEl.focus(); }
  }
  /** лист цели: сколько накоплено крупно, процент у шкалы, прогноз по среднему темпу, записи; внизу «Отложить» и «Снять» */
  function openGoalView(id, back) {
    var g = F.find(F.GOALS, id);
    if (!g) { return; }
    var s = F.goalState(g, st.all), fc = F.goalForecast(g, s);
    haptic();
    swapModal('list', false, function (m) {
      var box = el('div', 'pick pick--goalview'), top = el('div', 'goal__top'), edit = btn('capsule'), sum = el('p', 'goal__sum'), meter = el('div', 'goal__meter'), track = el('i', 'goal__bar'), f = el('b');
      var foot = el('footer', 'modal__dock modal__dock--duo'), putBtn = btn('btn', 'Отложить'), take = btn('btn btn--quiet', 'Снять');
      edit.id = 'goalEdit';
      edit.appendChild(el('span', '', 'Изменить'));
      edit.addEventListener('click', function () { openGoalEdit(g, function () { openGoalView(id, back); }, null); });
      add(top, el('h2', 'pick__title', g.name), edit);
      var text = gm(s.have, g), comma = text.indexOf(',');
      sum.id = 'goalHave';
      var num = el('span', 'goal__num');
      add(num, el('span', '', comma >= 0 ? text.slice(0, comma) : text), el('i', '', comma >= 0 ? text.slice(comma) : ''));
      add(sum, num, el('small', '', 'из' + F.NB + gmCur(g.a, g) + (g.u === 0 ? F.NB + 'BYN' : '')));
      f.style.transform = 'scaleX(' + Math.max(0, Math.min(1, s.have / g.a)).toFixed(4) + ')';
      track.appendChild(f);
      add(meter, track, el('span', '', Math.min(100, Math.floor(s.have / g.a * 100)) + '%'));
      var line = cap(goalRest(g, s.have, false)) + '.';
      if (s.have < g.a && g.u !== 0) { line += ' Это ' + F.fmt(F.goalByn(g, g.a - s.have)) + F.NB + 'BYN по' + F.NB + 'курсу ' + F.fmtRate(F.RATES[gcur(g)]) + '.'; }
      if (fc) { line += ' В среднем вы откладываете ' + gmCur(Math.round(fc.avg / 100) * 100, g).replace(/,00$/, '') + ' в' + F.NB + 'месяц: в таком темпе накопите к' + F.NB + fc.when + '.'; }
      var info = el('p', 'pick__info', nb(line));
      info.id = 'goalInfo';
      add(box, top, sum, meter, info, el('p', 'lbl lbl--gap', 'Записи'));
      if (s.ops.length || g.s > 0) { box.appendChild(goalRecs(g, s, 30)); }
      else { box.appendChild(el('p', 'pick__info', nb('Записей пока нет: нажмите «Отложить».'))); }
      putBtn.id = 'goalPut';
      take.id = 'goalTake';
      putBtn.addEventListener('click', function () { openEntry(null, { kind: 's', cat: 'g_' + id }); });
      take.setAttribute('aria-disabled', String(s.have <= 0));
      if (s.have <= 0) { take.className = 'btn btn--quiet btn--off'; }
      take.addEventListener('click', function () {
        if (s.have <= 0) { haptic('err'); toast('В цели пока ничего нет'); return; }
        openEntry(null, { kind: 't', cat: 'g_' + id });
      });
      add(foot, putBtn, take);
      add(m, box, foot);
    }, back);
  }
  /** новая цель или правка: название, сумма, валюта (у существующей цели не меняется), сколько уже накоплено */
  function openGoalEdit(g, back, done) {
    var u = g ? g.u : 0, busy = false, nameEl = null;
    haptic();
    swapModal('list', false, function (m) {
      var box = el('div', 'pick pick--cat pick--newgoal'), foot = el('footer', 'modal__dock'), go = btn('btn', 'Сохранить цель'), row = el('div', 'field-row'), cur = btn('cur'), curText = el('span');
      function field(id, value, ph, mode, max) {
        var f = el('input', 'field');
        f.id = id;
        f.type = 'text';
        f.maxLength = max;
        f.placeholder = ph;
        f.value = value;
        if (mode) { f.setAttribute('inputmode', mode); }
        f.setAttribute('enterkeyhint', 'done');
        f.setAttribute('autocomplete', 'off');
        f.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { f.blur(); } });
        return f;
      }
      function label(text, id) { var l = el('label', 'lbl', text); l.setAttribute('for', id); return l; }
      function plain(minor) { return minor ? F.fmt(minor).replace(/,00$/, '') : ''; }
      nameEl = field('goalName', g ? g.name : '', 'Например, отпуск', '', 24);
      var sum = field('goalSum', g ? plain(g.a) : '', 'например, 2000', 'decimal', 14), start = field('goalStart', g ? plain(g.s) : '', '0', 'decimal', 14), startLbl = label('', 'goalStart');
      var info = el('p', 'pick__info');
      info.id = 'goalMsg';
      function texts() {
        var code = F.CURS[u];
        curText.textContent = code;
        cur.setAttribute('aria-label', 'Валюта цели: ' + code + (g ? '' : '. Нажмите, чтобы сменить'));
        startLbl.textContent = 'Уже накоплено, ' + code;
        info.textContent = nb('Эти деньги отложены раньше: остаток месяца они не уменьшат.' + (code === 'BYN' ? '' : ' Откладывать можно и рублями, по курсу ' + F.fmtRate(F.RATES[code]) + '.'));
      }
      cur.id = 'goalCur';
      add(cur, curText, g ? null : icon('down'));
      cur.addEventListener('click', function () { // валюта выбирается у новой цели: у существующей в ней уже посчитаны старт и записи
        if (g) { haptic('err'); toast('Валюту цели сменить нельзя: в ней посчитано накопленное'); return; }
        u = (u + 1) % F.CURS.length;
        haptic();
        texts();
      });
      add(row, sum, cur);
      go.id = 'goalSave';
      go.addEventListener('mousedown', function (ev) { ev.preventDefault(); }); // нажатие не снимает фокус с поля: лист не прыгает под пальцем
      go.addEventListener('click', function () {
        if (busy) { return; }
        var name = F.cleanNote(nameEl.value).slice(0, 24).replace(/ $/, ''), a = F.parseAmount(sum.value), s0 = start.value.replace(/\s/g, '') ? F.parseAmount(start.value) : 0;
        var same = F.GOALS.some(function (x) { return x.name.toLowerCase() === name.toLowerCase() && (!g || x.id !== g.id); });
        var bad = !name ? 'Введите название цели.' : same ? 'Цель с таким названием уже есть.' : !a ? 'Введите, сколько накопить, цифрами: например 2000.' : (start.value.replace(/\s/g, '') && !s0 && !/^0+([.,]0+)?$/.test(start.value.replace(/\s/g, ''))) ? 'Введите, сколько уже накоплено, цифрами.' : '';
        if (bad) { info.textContent = bad; haptic('err'); return; }
        var list = F.packGoals(), id = g ? g.id : F.catId(idsOf(list));
        if (g) { list = list.map(function (x) { return x[0] === id ? [id, name, a, u, s0] : x; }); } else { list.push([id, name, a, u, s0]); }
        busy = true;
        store.patchCfg({ goals: list }, function (err) {
          if (err) { busy = false; haptic('err'); toast(explain(err)); return; }
          haptic('ok');
          reload(true, function () {
            if (done) { done(id); } else if (back) { back(); } else { closeModal(0); }
          });
        });
      });
      var del = null;
      if (g) {
        del = btn('link', 'Удалить цель');
        del.id = 'goalDel';
        del.addEventListener('click', function () {
          if (busy) { return; }
          ask('Удалить цель «' + g.name + '» и её записи? Отложенные по ней деньги вернутся в остаток.', function (yes) {
            if (!yes) { return; }
            var list = [], cat = 'g_' + g.id;
            Object.keys(st.all).forEach(function (month) { st.all[month].forEach(function (op) { if (op.c === cat) { list.push({ id: op.id, m: month }); } }); });
            busy = true;
            store.removeOps(list, function (err) {
              if (err) { busy = false; haptic('err'); toast(explain(err)); return; }
              var rest = F.packGoals().filter(function (x) { return x[0] !== g.id; });
              store.patchCfg({ goals: rest.length ? rest : null, goalAsk: null }, function (err2) {
                if (err2) { busy = false; haptic('err'); toast(explain(err2)); return; }
                haptic('ok');
                closeModal(0);
                reload(true, function () { toast('Цель удалена'); });
              });
            });
          });
        });
      }
      texts();
      add(box, el('h2', 'pick__title', g ? 'Изменить цель' : 'Новая цель'), label('Название', 'goalName'), nameEl, label('Сколько накопить', 'goalSum'), row, startLbl, start, info, del);
      foot.appendChild(go);
      add(m, box, foot);
    }, back);
    if (!g && nameEl) { nameEl.focus(); }
  }
  /** список целей листом: открывается со строки «отложено» на главной, чтобы посмотреть цели, не уходя с месяца */
  function openGoalsList() {
    if (!F.GOALS.length) { return; }
    haptic();
    swapModal('list', false, function (m) {
      var box = el('div', 'pick'), total = 0, sumLine = el('span', 'goal__big');
      F.GOALS.forEach(function (g) { total += F.goalByn(g, F.goalState(g, st.all).have); });
      sumLine.id = 'goalsTotal';
      add(sumLine, document.createTextNode('накоплено '), el('b', '', F.fmt(total) + F.NB + 'BYN'));
      add(box, el('h2', 'pick__title', 'Цели'), sumLine);
      F.GOALS.forEach(function (g) { box.appendChild(goalCard(g, function (it) { openGoalView(it.id, openGoalsList); })); });
      box.appendChild(newGoalBtn(openGoalsList));
      m.appendChild(box);
    }, null);
  }
  /** Прежняя единственная цель (cfg.goal): её «накоплено» считалось из остатка по всем записям, перенести это число нельзя —
      это те же деньги, что «осталось» месяца. Цель переводится в новый вид со стартом ноль, а человека один раз спрашивают, сколько уже отложено */
  var goalMoving = false, goalAsked = false;
  function migrateGoal(done) {
    var old = st.cfg.goal;
    if (!old || st.cfg.goals || goalMoving) { done(false); return; }
    goalMoving = true;
    var id = F.catId({});
    store.patchCfg({ goals: [[id, old.n || 'Цель', old.a, 0, 0]], goal: null, goalAsk: id }, function (err) { goalMoving = false; done(!err); });
  }
  function askGoalStart() {
    var g = st.cfg.goalAsk ? F.find(F.GOALS, st.cfg.goalAsk) : null, field = null;
    if (!g || goalAsked || ui.open || firstRun()) { return; }
    goalAsked = true; // один раз за запуск: если лист закрыли, он появится при следующем открытии приложения
    var was = Math.max(0, F.balance(st.all));
    openModal('list', false, function (m) {
      var box = el('div', 'pick pick--cat pick--newgoal'), foot = el('footer', 'modal__dock'), go = btn('btn', 'Сохранить'), name = el('p', 'goal__name');
      var lead = el('p', 'pick__info pick__info--lead', nb((was ? 'Раньше приложение показывало ' + F.fmt(was) + ': это был остаток по всем записям, а не отложенное. ' : '') + 'Теперь накопления считаются отдельно: впишите, сколько уже отложено, и дальше откладывайте записью «Отложить».'));
      lead.id = 'moveInfo';
      add(name, el('b', '', g.name), document.createTextNode(', цель ' + F.fmt(g.a) + F.NB + 'BYN'));
      field = el('input', 'field');
      field.id = 'moveStart';
      field.type = 'text';
      field.maxLength = 14;
      field.placeholder = '0';
      field.setAttribute('inputmode', 'decimal');
      field.setAttribute('enterkeyhint', 'done');
      field.setAttribute('autocomplete', 'off');
      field.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { field.blur(); } });
      var lbl = el('label', 'lbl', 'Уже накоплено, BYN');
      lbl.setAttribute('for', 'moveStart');
      go.id = 'moveSave';
      go.addEventListener('mousedown', function (ev) { ev.preventDefault(); });
      go.addEventListener('click', function () {
        var raw = field.value.replace(/\s/g, ''), s0 = raw ? F.parseAmount(field.value) : 0;
        if (raw && !s0 && !/^0+([.,]0+)?$/.test(raw)) { lead.textContent = 'Введите сумму цифрами, например 1500.'; haptic('err'); return; }
        var list = F.packGoals().map(function (x) { return x[0] === g.id ? [x[0], x[1], x[2], x[3], s0] : x; });
        store.patchCfg({ goals: list, goalAsk: null }, function (err) {
          if (err) { haptic('err'); toast(explain(err)); return; }
          haptic('ok');
          closeModal(0);
          reload(true);
        });
      });
      add(box, el('h2', 'pick__title', 'Цель считается по-новому'), lead, name, lbl, field);
      foot.appendChild(go);
      add(m, box, foot);
    });
  }

  // ---------- аналитика ----------
  // цвета категорий в кольце (палитра правил по графикам, проверена validate_palette.js; без синего — он у «Добавить»). Остальные диаграммы графитовые
  var VIZ_LIGHT = ['#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#4a3aa7'], VIZ_DARK = ['#FF9F0A', '#30D158', '#FFD60A', '#FF375F', '#7D7AFF']; // на чёрном — тёмные системные цвета Apple (индиго светлой палитры на #000 не виден)
  function vizColors() { var d = document.documentElement.getAttribute('data-theme') === 'dark'; return { list: d ? VIZ_DARK : VIZ_LIGHT, rest: d ? '#636366' : '#C7C7CC' }; }
  var SVGNS = 'http://www.w3.org/2000/svg';
  function svgEl(tag, attrs) { var n = document.createElementNS(SVGNS, tag); Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); }); return n; }
  function whole(minor) { return F.fmtDay(minor); }
  /** «1–14 сентября», «28 сентября–4 октября», «2025» — подпись отрезка для сравнения */
  function rangeText(a, b) {
    var x = a.split('-'), y = b.split('-'), yr = y[0] === F.today().slice(0, 4) ? '' : F.NB + y[0];
    if (a === b) { return (+x[2]) + F.NB + F.MONTHS_GEN[+x[1] - 1] + yr; }
    return (+x[2]) + (x[1] === y[1] ? '' : F.NB + F.MONTHS_GEN[+x[1] - 1]) + '⁠–⁠' + (+y[2]) + F.NB + F.MONTHS_GEN[+y[1] - 1] + yr; // диапазон не рвётся на строки после тире
  }
  /** с чем сравниваем: прошлый период целиком называется словами, его часть — датами */
  function prevText(P) {
    var full = F.statsPeriod(P.kind, P.prevFrom, F.today());
    if (P.prevEnd === full.to) { return P.kind === 'week' ? 'на прошлой неделе' : P.kind === 'year' ? 'в' + F.NB + P.prevFrom.slice(0, 4) : F.inMonth(P.prevFrom.slice(0, 7)); }
    if (P.kind === 'year') { return 'в' + F.NB + P.prevFrom.slice(0, 4) + ' к' + F.NB + rangeText(P.prevEnd, P.prevEnd).replace(/\u00a0\d{4}$/, ''); }
    return rangeText(P.prevFrom, P.prevEnd);
  }
  function vizBlock(title, note, inner, id) {
    var sec = el('section', 'viz'), head = el('div', 'cats__head');
    if (id) { sec.id = id; }
    add(head, el('h2', '', title), note ? el('span', '', nb(note)) : null);
    add(sec, head, inner);
    return sec;
  }
  /** круглое число для линии сетки: 1, 2 или 5 с нулями, не больше top */
  function niceStep(top) {
    var p = Math.pow(10, Math.floor(Math.log(Math.max(top, 100)) / Math.LN10)), n = top / p;
    return (n >= 5 ? 5 : n >= 2 ? 2 : 1) * p;
  }
  /** как шли траты: накопленная сумма по дням, текущий период графитом поверх прошлого серым, одна ось */
  function paceChart(P, cur, prevDays) {
    var curLen = F.daysBetween(P.from, P.end) + 1, full = F.daysBetween(P.from, P.to) + 1, pf = F.statsPeriod(P.kind, P.prevFrom, F.today()), prevLen = F.daysBetween(pf.from, pf.to) + 1;
    var now = F.cumulative(cur.days, P.from, curLen), prev = prevDays ? F.cumulative(prevDays, pf.from, prevLen) : [];
    var n = Math.max(full, prev.length), top = Math.max(1, now[now.length - 1] || 0, prev[prev.length - 1] || 0), step = niceStep(top / 2.5); // две-три линии сетки
    var w = 350, h = 150, svg = svgEl('svg', { viewBox: '0 0 ' + w + ' ' + h, 'class': 'pace', role: 'img', 'aria-label': 'Накопленные траты по дням' }), g = svgEl('g', { 'class': 'pace__grid' });
    function x(i) { return (n > 1 ? i / (n - 1) : 0) * (w - 8) + 4; }
    function y(v) { return h - v / (top * 1.08) * (h - 12); }
    for (var v = step; v < top * 1.08; v += step) {
      g.appendChild(svgEl('line', { x1: 0, x2: w, y1: y(v).toFixed(1), y2: y(v).toFixed(1) }));
      var tx = svgEl('text', { x: 0, y: (y(v) - 6).toFixed(1) });
      tx.textContent = whole(v);
      g.appendChild(tx);
    }
    g.appendChild(svgEl('line', { 'class': 'pace__base', x1: 0, x2: w, y1: h, y2: h }));
    svg.appendChild(g);
    function line(list, cls) { return svgEl('polyline', { 'class': cls, points: list.map(function (val, i) { return x(i).toFixed(1) + ',' + y(val).toFixed(1); }).join(' ') }); }
    if (prev.length) { svg.appendChild(line(prev, 'pace__prev')); }
    svg.appendChild(line(now, 'pace__now'));
    var ex = x(now.length - 1), ey = y(now[now.length - 1] || 0);
    if (P.current) { svg.appendChild(svgEl('line', { 'class': 'pace__today', x1: ex.toFixed(1), x2: ex.toFixed(1), y1: ey.toFixed(1), y2: h })); }
    if (prev.length && prev.length >= now.length) { svg.appendChild(svgEl('circle', { 'class': 'pace__dot pace__dot--prev', cx: ex.toFixed(1), cy: y(prev[now.length - 1]).toFixed(1), r: 4 })); }
    svg.appendChild(svgEl('circle', { 'class': 'pace__dot', cx: ex.toFixed(1), cy: ey.toFixed(1), r: 5 }));
    var ticks = el('div', 'pace__ticks');
    (P.kind === 'week' ? F.WEEKDAYS_SHORT : ['1', '8', '15', '22', '29']).forEach(function (s) { ticks.appendChild(el('span', '', s)); });
    var legend = el('div', 'pace__legend'), a = el('span'), b = el('span');
    add(a, el('i', 'key key--now'), document.createTextNode(P.kind === 'week' ? 'эта неделя ' : F.monthLabel(P.from.slice(0, 7)).split(F.NB)[0].toLowerCase() + ' '), el('b', '', whole(now[now.length - 1] || 0)));
    legend.appendChild(a);
    if (prev.length) {
      add(b, el('i', 'key key--prev'), document.createTextNode(prevText(P) + ' '), el('b', '', whole(prev[Math.min(prev.length, now.length) - 1] || 0)));
      legend.appendChild(b);
    }
    var box = el('div');
    box.id = 'paceChart';
    add(box, svg, ticks, legend);
    return box;
  }
  function factRows(P, cur) {
    var ul = el('ul', 'legend legend--facts'), days = F.daysBetween(P.from, P.end) + 1;
    function row(label, value, sub) { var li = el('li'), d = el('data', '', value); if (sub) { d.appendChild(el('small', '', sub)); } add(li, el('span', '', label), d); ul.appendChild(li); }
    row('Трат записано', String(cur.count));
    row('Тратите в день', F.fmt(Math.round(cur.spent / days)));
    if (cur.biggest) { row('Крупнейшая трата', F.fmt(F.bynOf(cur.biggest)), F.dict('e', cur.biggest.c).name); }
    ul.id = 'statsFacts';
    return ul;
  }
  /** что изменилось: столбики от середины — больше вправо графитом, меньше влево серым, сумма со знаком */
  function changesList(list) {
    var ul = el('ul', 'chg'), top = 1;
    ul.id = 'statsChanges';
    list.forEach(function (c) { top = Math.max(top, Math.abs(c.d)); });
    list.forEach(function (c) {
      var li = el('li', c.d > 0 ? 'is-up' : 'is-down'), name = el('span', '', c.name), track = el('div', 'chg__track'), bar = el('i');
      if (c.fresh) { name.appendChild(el('small', '', 'новая')); } else if (c.gone) { name.appendChild(el('small', '', 'не было')); }
      bar.style.width = (Math.abs(c.d) / top * 50).toFixed(1) + '%';
      track.appendChild(bar);
      add(li, name, track, el('data', '', (c.d > 0 ? '+' : '−') + F.fmt(Math.abs(c.d))));
      ul.appendChild(li);
    });
    return ul;
  }
  /** куда ушло: кольцо из пяти крупных категорий и «Остального»; цвет даётся пятёрке по их порядку в списке человека, а не по величине */
  function donutBlock(cur, P) {
    var rows = F.catRows(cur.cats), top = rows.slice(0, 5), restSum = 0, total = cur.spent || 1;
    rows.slice(5).forEach(function (r) { restSum += r.sum; });
    var order = top.slice().sort(function (a, b) { var x = F.CATS.indexOf(F.find(F.CATS, a.id)), y = F.CATS.indexOf(F.find(F.CATS, b.id)); return (x < 0 ? 99 : x) - (y < 0 ? 99 : y); });
    var vc = vizColors();
    order.forEach(function (r, i) { r.color = vc.list[i]; });
    var parts = top.concat(restSum ? [{ id: '', name: 'Остальное', sum: restSum, color: vc.rest, rest: rows.slice(5) }] : []);
    var box = el('div', 'donut'), svg = svgEl('svg', { viewBox: '0 0 180 180', role: 'img', 'aria-label': 'Доли категорий' }), r = 70, c = 2 * Math.PI * r, off = 0;
    parts.forEach(function (p) {
      var len = p.sum / total * c, arc = svgEl('circle', { r: r, cx: 90, cy: 90, fill: 'none', stroke: p.color, 'stroke-width': 24, 'stroke-dasharray': Math.max(0.1, len - (parts.length > 1 ? 2.5 : 0)).toFixed(2) + ' ' + c.toFixed(2), 'stroke-dashoffset': (-off).toFixed(2), transform: 'rotate(-90 90 90)' });
      if (p.id) { arc.addEventListener('click', function () { openStatCat(p.id, P, p.color); }); }
      svg.appendChild(arc);
      off += len;
    });
    var mid = el('p', 'donut__mid');
    var span = F.daysBetween(P.from, P.end) + 1;
    add(mid, el('b', '', whole(cur.spent)), el('span', '', 'BYN ' + (P.kind === 'year' ? (P.current ? 'с января' : 'за год') : 'за' + F.NB + span + F.NB + F.plural(span, 'день', 'дня', 'дней'))));
    add(box, svg, mid);
    var ul = el('ul', 'legend');
    ul.id = 'statsLegend';
    parts.forEach(function (p) {
      var li = el('li'), b = btn('legend__row'), key = el('i', 'key');
      key.style.background = p.color;
      if (p.id) { b.setAttribute('data-cat', p.id); }
      add(b, key, el('span', '', p.name), el('small', '', Math.round(p.sum / total * 100) + '%'), el('data', '', F.fmt(p.sum)));
      b.addEventListener('click', function () { if (p.id) { openStatCat(p.id, P, p.color); } else { openRest(p.rest, P); } });
      li.appendChild(b);
      ul.appendChild(li);
    });
    var wrap = el('div');
    add(wrap, box, ul);
    return wrap;
  }
  /** календарь месяца: оттенок по сумме дня (одна краска), сегодня обведён; нажатие — записи дня */
  function calendarBlock(P, cur) {
    var wrap = el('div', 'cal'), head = el('div', 'cal__head'), grid = el('div', 'cal__grid'), n = F.lastDay(P.from.slice(0, 7)), top = 1, today = F.today();
    F.WEEKDAYS_SHORT.forEach(function (d) { head.appendChild(el('span', '', d)); });
    Object.keys(cur.days).forEach(function (d) { top = Math.max(top, cur.days[d]); });
    for (var i = 0; i < F.dow(P.from); i++) { grid.appendChild(el('i', 'cal__pad')); }
    for (var day = 1; day <= n; day++) {
      var date = P.from.slice(0, 8) + (day < 10 ? '0' : '') + day, v = cur.days[date] || 0, future = date > today;
      var lvl = v ? 1 + Math.min(3, Math.floor(v / top * 4)) : 0, b = btn('cal__d' + (future ? ' is-future' : ' lvl-' + lvl) + (date === today ? ' is-today' : ''));
      b.setAttribute('data-date', date);
      b.setAttribute('aria-label', F.dayLabel(date) + (v ? ': ' + F.fmt(v) : ': трат нет'));
      b.appendChild(el('b', '', String(day)));
      if (v) { (function (d) { b.addEventListener('click', function () { openStatDay(d); }); })(date); } else { b.disabled = true; }
      grid.appendChild(b);
    }
    var scale = el('div', 'cal__scale');
    scale.appendChild(el('span', '', 'меньше'));
    for (var k = 1; k <= 4; k++) { scale.appendChild(el('i', 'cal__d lvl-' + k)); }
    scale.appendChild(el('span', '', 'больше'));
    add(wrap, head, grid, scale);
    wrap.id = 'statsCalendar';
    return wrap;
  }
  /** столбики: по дням недели (неделя) или средняя по дням недели (за всё время); выделен самый большой, над ним сумма */
  function barsBlock(values, labels, id, onTap) {
    var plot = el('div', 'bars'), ticks = el('div', 'bars__ticks'), top = 1, at = -1;
    values.forEach(function (v, i) { if (v > top) { top = v; at = i; } });
    values.forEach(function (v, i) {
      var col = btn('bars__col' + (i === at ? ' is-on' : '')), bar = el('b');
      bar.style.height = (v ? Math.max(3, v / top * 100) : 0).toFixed(1) + '%';
      if (i === at) { col.appendChild(el('em', '', whole(v))); }
      col.appendChild(bar);
      col.setAttribute('aria-label', labels[i] + ': ' + F.fmt(v));
      if (onTap && v) { col.addEventListener('click', function () { onTap(i); }); } else { col.disabled = true; }
      plot.appendChild(col);
      ticks.appendChild(el('span', '', labels[i]));
    });
    var box = el('div');
    box.id = id;
    add(box, plot, ticks);
    return box;
  }
  /** доходы и траты по месяцам года: пары столбиков на одной оси, только месяцы с записями, линия сетки с подписью справа */
  function pairsBlock(cur) {
    var months = Object.keys(cur.months).sort(), top = 1, box = el('div'), plot = el('div', 'pairs'), ticks = el('div', 'bars__ticks bars__ticks--pairs');
    months.forEach(function (m) { top = Math.max(top, cur.months[m].income, cur.months[m].spent); });
    var max = top * 1.1, step = niceStep(top / 1.2);
    plot.style.gridTemplateColumns = 'repeat(' + months.length + ', minmax(0, 1fr))';
    var gl = el('span', 'pairs__grid');
    gl.style.bottom = (step / max * 100).toFixed(1) + '%';
    gl.appendChild(el('b', '', whole(step)));
    plot.appendChild(gl);
    months.forEach(function (m) {
      var col = el('i', 'pair'), a = el('b', 'pair__in'), b = el('b', 'pair__out');
      a.style.height = (cur.months[m].income / max * 100).toFixed(1) + '%';
      b.style.height = (cur.months[m].spent / max * 100).toFixed(1) + '%';
      add(col, a, b);
      plot.appendChild(col);
      ticks.appendChild(el('span', '', F.monthLabel(m).slice(0, 3).toLowerCase()));
    });
    ticks.style.gridTemplateColumns = plot.style.gridTemplateColumns;
    var legend = el('div', 'pace__legend'), x = el('span'), y = el('span');
    add(x, el('i', 'key key--in'), document.createTextNode('доход'));
    add(y, el('i', 'key key--now'), document.createTextNode('траты'));
    add(legend, x, y);
    box.id = 'statsPairs';
    add(box, plot, ticks, legend);
    return box;
  }
  function notesBlock(cur, P) {
    var ul = el('ul', 'rows rows--ops rows--flat');
    ul.id = 'statsNotes';
    F.topNotes(cur.notes, 5).forEach(function (it) {
      var li = el('li'), b = btn('op op--bare op--two'), name = el('span', '', it.n);
      name.appendChild(el('small', '', F.dict('e', it.cat).name + ' · ' + it.count + F.NB + F.plural(it.count, 'раз', 'раза', 'раз')));
      add(b, name, el('data', '', F.fmt(it.sum)), icon('right', 'share__go'));
      b.addEventListener('click', function () { openStatNote(it.key, P); });
      li.appendChild(b);
      ul.appendChild(li);
    });
    return ul;
  }
  function paintStats() {
    var S0 = st.stats, now = F.today();
    if (!S0.at) { S0.at = now; }
    var P = F.statsPeriod(S0.kind, S0.at, now), first = F.firstDate(st.all), head = el('div', 'bar'), title = el('h1', 'month', 'Аналитика');
    title.id = 'statsTitle';
    add(head, title, gearBtn());
    var seg = el('div', 'seg tabseg');
    seg.setAttribute('role', 'group');
    seg.setAttribute('aria-label', 'Период');
    [['week', 'Неделя'], ['month', 'Месяц'], ['year', 'Год']].forEach(function (k) {
      var b = btn('', k[1]);
      b.setAttribute('data-kind', k[0]);
      b.setAttribute('aria-pressed', String(S0.kind === k[0]));
      b.addEventListener('click', function () { if (S0.kind === k[0]) { return; } S0.kind = k[0]; S0.at = now; haptic(); paint(true); });
      seg.appendChild(b);
    });
    var nav = el('div', 'period'), back = btn('period__go'), fwd = btn('period__go'), canBack = !!first && P.from > first, canFwd = !P.current;
    back.id = 'periodBack';
    fwd.id = 'periodNext';
    back.setAttribute('aria-label', 'Раньше');
    fwd.setAttribute('aria-label', 'Позже');
    back.appendChild(icon('left'));
    fwd.appendChild(icon('right'));
    if (!canBack) { back.className = 'period__go is-off'; back.setAttribute('aria-disabled', 'true'); }
    if (!canFwd) { fwd.className = 'period__go is-off'; fwd.setAttribute('aria-disabled', 'true'); }
    back.addEventListener('click', function () { if (canBack) { S0.at = F.periodShift(S0.kind, P.from, -1); haptic(); paint(true); } });
    fwd.addEventListener('click', function () { if (canFwd) { var next = F.periodShift(S0.kind, P.from, 1); S0.at = next > now ? now : next; haptic(); paint(true); } });
    var label = el('p', '', P.label);
    label.id = 'periodLabel';
    add(nav, back, label, fwd);

    var cur = F.rangeStats(st.all, P.from, P.end), hasPrev = !!first && first <= P.prevEnd, prev = hasPrev ? F.rangeStats(st.all, P.prevFrom, P.prevEnd) : null;
    var hero = el('section', 'spent spent--sum'), sumEl = el('p', sumClass(cur.spent)), node = { whole: el('span'), frac: el('i') }, line;
    sumEl.id = 'statsSum';
    setSum(node, cur.spent);
    add(sumEl, node.whole, node.frac, el('abbr', '', 'BYN'));
    if (!cur.spent && !cur.income) { line = 'Записей за этот период нет.'; }
    else if (prev && prev.spent) {
      var d = cur.spent - prev.spent;
      line = d ? 'на' + F.NB + F.fmt(Math.abs(d)) + (d > 0 ? ' больше' : ' меньше') + ', чем ' + prevText(P) : 'столько же, сколько ' + prevText(P);
    } else if (first) { line = 'Сравнить пока не с чем: записи начались ' + rangeText(first, first) + '.'; }
    var cmp = el('p', 'spent__day', line ? nb(line) : '');
    cmp.id = 'statsCompare';
    add(hero, el('p', 'spent__label', 'Потрачено'), sumEl, cmp);
    var sheet = el('div', 'sheet sheet--stats');
    clear(view);
    add(view, head, seg, nav, hero, sheet);
    fitSum(sumEl);
    if (!cur.spent) {
      sheet.appendChild(el('p', 'empty', nb(cur.income ? 'Трат за этот период нет, только доходы.' : 'Трат за этот период нет. Нажмите «Добавить» внизу, чтобы внести первую.')));
      return;
    }
    if (P.kind === 'year') { sheet.appendChild(vizBlock('Доходы и траты', cur.income ? 'осталось ' + whole(cur.income - cur.spent) : '', pairsBlock(cur), 'vizPairs')); }
    else {
      var pf = F.statsPeriod(P.kind, P.prevFrom, now), prevFull = first && first <= pf.to ? F.rangeStats(st.all, pf.from, pf.to) : null;
      sheet.appendChild(vizBlock('Как шли траты', prevFull ? (P.kind === 'week' ? 'к прошлой неделе' : 'к' + F.NB + rangeText(P.prevEnd, P.prevEnd)) : '', paceChart(P, cur, prevFull ? prevFull.days : null), 'vizPace'));
      if (P.kind === 'month') { var saveBlock = savingsBlock(P, now); if (saveBlock) { sheet.appendChild(saveBlock); } } // сбережения — сразу после «Как шли траты»
    }
    sheet.appendChild(vizBlock('Коротко', rangeText(P.from, P.end), factRows(P, cur), 'vizFacts'));
    if (prev) {
      var ch = F.catChanges(cur.cats, prev.cats, 6);
      if (ch.length) { sheet.appendChild(vizBlock('Что изменилось', 'сравнение: ' + prevText(P), changesList(ch), 'vizChanges')); }
    }
    sheet.appendChild(vizBlock('Куда ушло', rangeText(P.from, P.end), donutBlock(cur, P), 'vizWhere'));
    if (P.kind === 'month') { sheet.appendChild(vizBlock('По дням', rangeText(P.from, P.end), calendarBlock(P, cur), 'vizDays')); }
    if (P.kind === 'week') {
      var wv = [];
      for (var i = 0; i < 7; i++) { wv.push(cur.days[F.shiftDay(P.from, i)] || 0); }
      sheet.appendChild(vizBlock('По дням', '', barsBlock(wv, F.WEEKDAYS_SHORT, 'statsWeekDays', function (i) { openStatDay(F.shiftDay(P.from, i)); }), 'vizDays'));
    }
    var wd = P.kind === 'week' ? null : F.weekdayAvg(st.all, now);
    if (wd && wd.weeks >= 4) { sheet.appendChild(vizBlock('Когда тратите', 'в среднем, с ' + rangeText(wd.first, wd.first), barsBlock(wd.avg, F.WEEKDAYS_SHORT, 'statsWeekdays', null), 'vizWhen')); }
    if (F.topNotes(cur.notes, 1).length) {
      var nbx = el('div');
      add(nbx, notesBlock(cur, P), el('p', 'pick__info pick__info--after', nb('Нажмите на строку, чтобы увидеть эти записи. Пишите заметки к тратам, и разбор станет точнее.')));
      sheet.appendChild(vizBlock('На что чаще всего', 'по заметкам', nbx, 'vizNotes'));
    }
  }
  /** лист записей: заголовок, сумма, подпись, группы по заметкам (если есть) и сами записи с правкой */
  function openOpsSheet(title, sum, info, ops, groups, color, back) {
    haptic();
    swapModal('list', false, function (m) {
      var box = el('div', 'pick'), total = el('p', 'goal__sum'), num = el('span', 'goal__num'), parts = F.fmtParts(sum);
      total.id = 'statSheetSum';
      add(num, el('span', '', parts.whole), el('i', '', parts.frac));
      add(total, num, el('small', '', 'BYN'));  // сумма фирменным видом, как на листах цели и кредита
      var head = el('div', 'pick__head');
      if (color) { var key = el('span', 'key key--title'); key.style.background = color; head.appendChild(key); } // связь с сегментом кольца, на который нажали
      head.appendChild(el('h2', 'pick__title', title));
      add(box, head, total, el('p', 'pick__info', nb(info)));
      if (groups && groups.length) { // траты по заметкам; строка открывает свои записи — те же записи второй раз не повторяются
        var gl = el('ul', 'rows rows--ops');
        gl.id = 'statGroups';
        groups.forEach(function (g) {
          var li = el('li'), row = btn('op op--bare' + (g.plain ? ' is-plain' : '')), name = el('span', '', g.n);
          name.appendChild(document.createTextNode(' '));
          name.appendChild(el('small', '', g.count + F.NB + F.plural(g.count, 'раз', 'раза', 'раз')));
          add(row, name, el('data', '', F.fmt(g.sum)), icon('right', 'share__go'));
          row.addEventListener('click', function () { openOpsSheet(g.title || g.n, g.sum, g.count + F.NB + F.plural(g.count, 'раз', 'раза', 'раз') + '.', g.ops, null, null, function () { openOpsSheet(title, sum, info, ops, groups, color, back); }); });
          li.appendChild(row);
          gl.appendChild(li);
        });
        box.appendChild(gl);
      } else {
        var ul = el('ul', 'rows rows--ops');
        ul.id = 'statOps';
        ops.slice().sort(function (x, y) { return x.d === y.d ? (x.id < y.id ? 1 : -1) : (x.d < y.d ? 1 : -1); }).slice(0, 60).forEach(function (op) { var li = el('li'); li.appendChild(opRow(op, !!title && ops.every(function (o) { return o.c === op.c; }))); ul.appendChild(li); });
        box.appendChild(ul);
      }
      m.appendChild(box);
    }, back || null);
  }
  function periodOps(P) { return F.inRange(st.all, P.from, P.end).filter(function (op) { return op.k === 'e'; }); }
  function openStatCat(id, P, color) {
    var ops = periodOps(P).filter(function (op) { return op.c === id; }), sum = 0, notes = {}, plain = { n: 'без заметки', title: 'Без заметки', count: 0, sum: 0, plain: true, ops: [] };
    ops.forEach(function (op) {
      var b = F.bynOf(op);
      sum += b;
      if (!op.n) { plain.count++; plain.sum += b; plain.ops.push(op); return; }
      var k = op.n.toLowerCase(), g = notes[k] || (notes[k] = { n: op.n, count: 0, sum: 0, ops: [] });
      g.count++;
      g.sum += b;
      g.ops.push(op);
    });
    var groups = Object.keys(notes).map(function (k) { return notes[k]; }).sort(function (a, b) { return b.sum - a.sum; });
    if (groups.length && plain.count) { groups.push(plain); }
    var all = F.rangeStats(st.all, P.from, P.end).spent || 1, first = F.firstDate(st.all), cmp = '';
    if (first && first <= P.prevEnd) { // сравнение с тем же отрезком прошлого периода
      var was = F.rangeStats(st.all, P.prevFrom, P.prevEnd).cats[id] || 0, d = sum - was;
      cmp = !was ? ', ' + prevText(P) + ' таких трат не было' : d ? ', на' + F.NB + F.fmt(Math.abs(d)) + (d > 0 ? ' больше' : ' меньше') + ', чем ' + prevText(P) : ', столько же, сколько ' + prevText(P);
    }
    openOpsSheet(F.dict('e', id).name, sum, ops.length + ' ' + F.plural(ops.length, 'запись', 'записи', 'записей') + ', ' + Math.round(sum / all * 100) + '% трат' + cmp + (groups.length ? '. По заметкам:' : '.'), ops, groups.length ? groups : null, color || null);
  }
  function openRest(rows, P) {
    var ids = {};
    rows.forEach(function (r) { ids[r.id] = 1; });
    var ops = periodOps(P).filter(function (op) { return ids[op.c]; }), sum = 0;
    ops.forEach(function (op) { sum += F.bynOf(op); });
    openOpsSheet('Остальное', sum, rows.map(function (r) { return r.name; }).join(', ') + '.', ops, rows.map(function (r) { var mine = ops.filter(function (op) { return op.c === r.id; }); return { n: r.name, count: mine.length, sum: r.sum, ops: mine }; }), VIZ_REST);
  }
  function openStatDay(date) {
    var ops = F.inRange(st.all, date, date).filter(function (op) { return op.k === 'e'; }), sum = 0;
    ops.forEach(function (op) { sum += F.bynOf(op); });
    openOpsSheet(F.dayLabel(date), sum, ops.length + ' ' + F.plural(ops.length, 'трата', 'траты', 'трат') + '.', ops, null);
  }
  function openStatNote(key, P) {
    var ops = periodOps(P).filter(function (op) { return (op.n || '').toLowerCase() === key; }), sum = 0;
    ops.forEach(function (op) { sum += F.bynOf(op); });
    openOpsSheet(ops.length ? ops[0].n : key, sum, ops.length + F.NB + F.plural(ops.length, 'раз', 'раза', 'раз') + ' за ' + rangeText(P.from, P.end) + '.', ops, null);
  }

  function paint(animate) {
    var first = firstRun();
    syncAdd();
    stage.className = 'stage' + (first ? ' stage--first' : '');
    if (first) { paintFirst(); view.scrollTop = 0; return; }
    st.first = null;
    if (st.error) {
      clear(view);
      var box = el('div', 'fail');
      var again = btn('btn', 'Повторить');
      again.addEventListener('click', function () { reload(true); });
      add(box, el('h2', '', 'Не получилось открыть записи'), el('p', '', st.error), again);
      view.appendChild(box);
      return;
    }
    if (st.tab !== 'history') { view.classList.remove('is-find'); }
    if (st.tab === 'history') { paintHistory(); } else if (st.tab === 'goals') { paintGoals(); } else if (st.tab === 'stats') { paintStats(); } else { paintMonth(animate); }
    view.scrollTop = 0;
    if (animate && view.animate) { view.animate([{ opacity: 0.4 }, { opacity: 1 }], { duration: reduce ? 120 : 180, easing: 'ease-out' }); }
  }

  // ---------- загрузка ----------
  function reload(animate, done) {
    store.view(st.month, function (err, v) {
      st.loaded = true;
      if (err) { st.error = explain(err); paint(false); if (done) { done(err); } return; }
      st.error = '';
      st.months = v.months;
      st.ops = v.ops;
      st.carry = v.carry;
      st.partial = v.partial;
      st.all = v.all;
      st.cfg = v.cfg || {};
      F.useCfg(st.cfg); // свои категории, если заданы: до подсчёта сводок
      F.useCredits(v.credits); // кредиты — до сводок: по ним строки «Куда ушло» получают названия
      F.useDebts(v.debts); // люди — до сводок: записи долга получают имя
      st.budget = v.budget || { a: 0, off: 0 };
      st.limits = v.limits || {};
      st.pays = v.pays || { list: [], hide: '' };
      st.prev = F.summarize(v.all[F.prevMonth(st.month)] || []);
      st.balance = F.balance(v.all);
      st.sum = F.summarize(v.ops);
      if (st.cfg.goal && !st.cfg.goals && !goalMoving) { // прежняя единственная цель переводится в новый вид, затем всё читается заново
        migrateGoal(function (ok) { if (ok) { reload(animate, done); } else { paint(animate); if (done) { done(null); } } });
        return;
      }
      paint(animate);
      if (done) { done(null); }
      askGoalStart();
    });
  }

  // ---------- лист: общая механика ----------
  function setY(y) {
    ui.y = y;
    var p = ui.h ? 1 - Math.max(0, Math.min(1, y / ui.h)) : 0;
    modal.style.transform = 'translate3d(0,' + y.toFixed(1) + 'px,0)';
    scrim.style.opacity = p.toFixed(3);
    if (!reduce) { stage.style.transform = p > 0.001 ? 'scale(' + (1 - 0.04 * p).toFixed(4) + ')' : ''; }
  }
  /** пружина как в SwiftUI: response — отзывчивость в секундах, damping 1 — без отскока. Стартует с текущего места и скорости */
  function springTo(target, velocity, damping, response, done) {
    cancelAnimationFrame(ui.raf);
    if (reduce) { setY(target); if (done) { done(); } return; }
    var x = ui.y, v = velocity || 0;
    var k = Math.pow(2 * Math.PI / response, 2), c = 4 * Math.PI * damping / response, last = performance.now();
    (function step(now) {
      var dt = Math.min(0.034, Math.max(0.001, (now - last) / 1000)), h = dt / 4, n;
      last = now;
      for (n = 0; n < 4; n++) { v += (-k * (x - target) - c * v) * h; x += v * h; }
      if (Math.abs(x - target) < 0.5 && Math.abs(v) < 30) { setY(target); ui.raf = 0; if (done) { done(); } return; }
      setY(x);
      ui.raf = requestAnimationFrame(step);
    })(last);
  }

  function fillModal(kind, full, build, back) {
    ui.kind = kind;
    ui.back = back || null;
    clear(modal);
    modal.className = 'modal' + (full ? ' modal--full' : '') + ' modal--' + kind + (back && !inTg ? ' modal--back' : '');
    var grab = el('div', 'grab');
    grab.appendChild(el('i'));
    modal.appendChild(grab);
    if (back && !inTg) { // вне Telegram его кнопки «Назад» нет: своя стрелка в углу листа
      var b = btn('modal__back');
      b.id = 'backBtn';
      b.setAttribute('aria-label', 'Назад');
      b.appendChild(icon('left'));
      b.addEventListener('click', goBack);
      modal.appendChild(b);
    }
    build(modal);
    return grab;
  }
  function goBack() {
    if (ui.open && ui.back) { ui.back(); }
    else if (!ui.open && st.first && st.first.manual) { closePicker(); } // экран выбора категорий, открытый из настроек: «Назад» ничего не меняет
    else { closeModal(0); }
  }
  /** следующий лист поверх открытого (настройки → категории → правка): содержимое меняется на месте, лист не закрывается.
      Новый лист выше прежнего — доезжает на пружине, ниже — встаёт сразу; содержимое проявляется */
  function swapModal(kind, full, build, back) {
    if (!ui.open) { openModal(kind, full, build, back); return; }
    var was = modal.offsetHeight;
    cancelAnimationFrame(ui.raf);
    entry = null;
    var grab = fillModal(kind, full, build, back);
    ui.h = modal.offsetHeight;
    bindDrag(grab);
    if (ui.h > was + 1 && !reduce) { setY(ui.h - was); springTo(0, 0, 1, 0.32); } else { setY(0); }
    if (!reduce) {
      [].slice.call(modal.children).forEach(function (n) { if (n !== grab && n.animate) { n.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 180, easing: 'ease-out' }); } });
    }
  }
  function openModal(kind, full, build, back) {
    toastEl.className = 'toast'; // сообщение не должно лежать поверх клавиш листа
    var grab = fillModal(kind, full, build, back);
    modal.style.display = 'flex';
    scrim.style.display = 'block';
    modal.setAttribute('aria-hidden', 'false');
    ui.open = true;
    ui.h = modal.offsetHeight;
    setY(ui.h);
    springTo(0, 0, 1, 0.36);
    bindDrag(grab);
    tgTry(function () { tg.BackButton.show(); });
  }
  function closeModal(velocity, after) {
    if (!ui.open) { if (after) { after(); } return; }
    ui.open = false;
    ui.back = null;
    entry = null;
    modal.setAttribute('aria-hidden', 'true');
    tgTry(function () { tg.BackButton.hide(); });
    springTo(ui.h, velocity || 0, 1, 0.3, function () {
      modal.style.display = 'none';
      scrim.style.display = 'none';
      stage.style.transform = '';
      clear(modal);
      if (after) { after(); }
    });
  }
  /** лист тянется за ручку: палец ведёт 1:1, после отпускания летит туда, куда его бросили */
  function bindDrag(grab) {
    var id = null, startY = 0, startAt = 0, track = [];
    grab.addEventListener('pointerdown', function (e) {
      if (!ui.open) { return; }
      id = e.pointerId;
      try { grab.setPointerCapture(id); } catch (x) { /* без захвата тоже работает */ }
      cancelAnimationFrame(ui.raf);
      startY = e.clientY / K;
      startAt = ui.y;
      track = [{ y: e.clientY / K, t: e.timeStamp }];
    });
    grab.addEventListener('pointermove', function (e) {
      if (e.pointerId !== id) { return; }
      var y = startAt + (e.clientY / K - startY); // палец 1:1 и при крупном тексте
      if (y < 0) { y = y * 0.15; } // вверх лист упирается мягко, а не встаёт стеной
      setY(y);
      track.push({ y: e.clientY / K, t: e.timeStamp });
      if (track.length > 6) { track.shift(); }
    });
    function end(e) {
      if (e.pointerId !== id) { return; }
      id = null;
      var a = track[0], b = track[track.length - 1];
      var v = b && a && b.t > a.t ? (b.y - a.y) / (b.t - a.t) * 1000 : 0;
      var landing = ui.y + (v / 1000) * 0.998 / (1 - 0.998) * 0.5; // куда долетит по инерции
      if (landing > ui.h * 0.5) { closeModal(v); } else { springTo(0, v, 0.8, 0.3); }
    }
    grab.addEventListener('pointerup', end);
    grab.addEventListener('pointercancel', end);
  }

  // ---------- лист добавления и правки ----------
  /** preset — с чего открыть новый лист: { kind: 's' отложить | 't' снять | 'p' платёж по кредиту, cat, digits, cur, date, note } */
  function openEntry(op, preset) {
    if (!st.loaded || st.error) { return; }
    var pre = preset || {}, goalOp = !!op && F.isGoalOp(op), debtOp = !!op && F.isDebtOp(op);
    entry = {
      edit: op || null,
      kind: op ? (goalOp ? (op.k === 'e' ? 's' : 't') : debtOp ? (op.k === 'e' ? 'give' : 'get') : op.k) : pre.kind || 'e', fresh: !op && !!pre.fresh, // долг: 'give' отдано, 'get' получено; fresh — новый долг с выбором человека
      // 'e' трата, 'i' доход, 's' отложить на цель, 't' снять с цели, 'p' платёж (хранится тратой)
      digits: op ? F.fmt(op.a).replace(/\s/g, '').replace(/,00$/, '').replace(/(,\d)0$/, '$1') : pre.digits || '',
      cur: op ? op.u : pre.cur || 'BYN',
      cat: op ? op.c : pre.cat || '',
      date: op ? op.d : pre.date || F.today(),
      note: op && op.n ? op.n : pre.note || '',
      busy: false,
      series: 0, done: null, doneUntil: 0 // записи подряд: сколько записано в этом листе, последняя запись и до какого времени показывать «Записано»
    };
    haptic();
    openModal('entry', true, function (m) {
      var screen = el('div', 'screen');

      // вид записи: у новой — «Трата / Доход / Отложить»; «Снять» и правка записи цели — отдельный режим с заголовком вместо переключателя
      var mode = entry.kind === 't' ? (op ? 'Снято из накоплений' : 'Снять из накоплений') : goalOp ? 'Отложено на цель' : entry.kind === 'p' ? 'Платёж' : '';
      var debt = entry.kind === 'give' || entry.kind === 'get';
      var seg = debt ? debtTop(op) : mode ? el('p', 'entry__mode', nb(mode)) : el('div', 'seg');
      if (debt) { /* верх — имя человека */ } else if (mode) { seg.id = 'entryMode'; } else { seg.setAttribute('role', 'group'); seg.setAttribute('aria-label', 'Что добавляем'); }
      entry.segBtns = (mode || debt ? [] : [['e', 'Трата'], ['i', 'Доход']].concat(op ? [] : [['s', 'Отложить']])).map(function (k) {
        var b = btn('', k[1]);
        b.setAttribute('data-kind', k[0]);
        b.addEventListener('click', function () {
          if (!entry || entry.kind === k[0]) { return; }
          entry.kind = k[0];
          entry.cat = '';
          entry.page = 0;
          haptic();
          if (entry.more) { entry.more.hidden = k[0] === 's'; entry.more.parentNode.className = 'modal__dock' + (k[0] === 's' ? '' : ' modal__dock--duo modal__dock--series'); }
          paintChips();
          paintEntry();
        });
        seg.appendChild(b);
        return b;
      });

      var way = null;
      if (debt && entry.fresh) { // новый долг: «Дать / Получить» в строке вместо заметки — лист той же высоты, что обычный, и помещается на 320×568
        way = el('div', 'seg seg--way');
        way.setAttribute('role', 'group');
        way.setAttribute('aria-label', 'Кто кому');
        entry.segBtns = [['give', 'Дать'], ['get', 'Получить']].map(function (k) {
          var b = btn('', k[1]);
          b.setAttribute('data-kind', k[0]);
          b.addEventListener('click', function () { if (!entry || entry.kind === k[0]) { return; } entry.kind = k[0]; haptic(); paintEntry(); });
          way.appendChild(b);
          return b;
        });
      }
      var strip = el('div', 'strip' + (way ? ' strip--way' : ''));
      // заметка: обычное поле телефона. Стоит вверху листа, поэтому клавиатура телефона его не закрывает
      entry.noteInput = el('input', 'note-in');
      entry.noteInput.type = 'text';
      entry.noteInput.id = 'noteInput';
      entry.noteInput.maxLength = 40;
      entry.noteInput.placeholder = 'Заметка';
      entry.noteInput.value = entry.note;
      entry.noteInput.setAttribute('aria-label', 'Заметка');
      entry.noteInput.setAttribute('enterkeyhint', 'done');
      entry.noteInput.setAttribute('autocomplete', 'off');
      entry.noteInput.addEventListener('input', function () { if (entry) { entry.note = entry.noteInput.value; } });
      entry.noteInput.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { entry.noteInput.blur(); } });
      // дата: настоящее поле телефона под подписью. Создаётся один раз и не пересоздаётся, пока лист открыт (иначе календарь iPhone закрывается сам)
      var dateWrap = el('label', 'date');
      entry.dateText = el('span');
      entry.dateInput = el('input');
      entry.dateInput.type = 'date';
      entry.dateInput.id = 'dateInput';
      entry.dateInput.max = F.today();
      entry.dateInput.value = entry.date;
      entry.dateInput.setAttribute('aria-label', 'Дата');
      entry.dateInput.addEventListener('change', function () {
        if (!entry) { return; }
        var v = entry.dateInput.value;
        if (F.isDate(v) && v <= F.today()) { entry.date = v; } else { entry.dateInput.value = entry.date; }
        paintEntry();
      });
      dateWrap.addEventListener('click', function () { try { if (entry.dateInput.showPicker) { entry.dateInput.showPicker(); } } catch (e) { /* откроется обычным нажатием */ } });
      add(dateWrap, entry.dateText, icon('down'), entry.dateInput);
      add(strip, debt ? (way || el('span', 'strip__gap')) : entry.noteInput, dateWrap); // у долга заметки на листе нет: строка занята «Дать / Получить» или пуста

      var box = el('section', 'entry');
      entry.box = box;
      var row = el('div', 'entry__row');
      entry.sum = el('p', 'entry__sum');
      entry.sum.id = 'entrySum';
      entry.curBtn = btn('cur');
      entry.curBtn.id = 'curBtn';
      entry.curText = el('span');
      add(entry.curBtn, entry.curText, icon('down'));
      entry.curBtn.addEventListener('click', function () { // валюта меняется по кругу: BYN, USD, EUR
        if (!entry) { return; }
        entry.cur = F.CURS[(F.CURS.indexOf(entry.cur) + 1) % F.CURS.length];
        haptic();
        paintEntry();
      });
      add(row, entry.sum, entry.curBtn);
      entry.hint = el('p', 'entry__conv'); // под суммой: пересчёт валюты или сколько останется после этой записи
      entry.hint.id = 'entryHint';
      entry.hint2 = el('p', 'entry__conv'); // вторая строка у записи цели: что станет с остатком месяца
      entry.hint2.id = 'entryHint2';
      entry.hint2.hidden = true;
      entry.quick = el('div', 'quick'); // частые записи: одно касание вместо набора суммы
      entry.quick.id = 'quick';
      add(box, row, entry.hint, entry.hint2, entry.quick);

      entry.chips = el('ul', 'chips');
      var keys = el('div', 'keys');
      keys.setAttribute('aria-label', 'Сумма');
      ['1', '2', '3', '4', '5', '6', '7', '8', '9', ',', '0', 'back'].forEach(function (k) {
        var b = btn(k === ',' ? 'keys__comma' : '');
        b.setAttribute('data-key', k);
        if (k === 'back') { b.setAttribute('aria-label', 'Стереть'); b.appendChild(icon('back')); }
        else { b.textContent = k; if (k === ',') { b.setAttribute('aria-label', 'Запятая'); } }
        b.addEventListener('click', function () {
          if (!entry || entry.busy) { return; }
          var next = F.press(entry.digits, k);
          if (next !== entry.digits) { entry.digits = next; entry.done = null; haptic(); paintEntry(); }
        });
        keys.appendChild(b);
      });
      add(screen, seg, strip, box, entry.chips, keys);

      var foot = el('footer', 'modal__dock');
      entry.go = btn('btn');
      entry.go.id = 'goBtn';
      entry.go.addEventListener('click', submitEntry);
      if (!op && (entry.kind === 'e' || entry.kind === 'i')) { // записи подряд (решение разработчика 17.10.2026, вариант В): серая кнопка записывает и оставляет лист
        foot.className = 'modal__dock modal__dock--duo modal__dock--series';
        entry.more = btn('btn btn--quiet', 'Добавить и сразу ещё') // подпись разработчика 17.10.2026;
        entry.more.id = 'goMore';
        entry.more.addEventListener('click', function () { submitEntry(true); });
        foot.appendChild(entry.more);
      }
      if (op) { // правка: удаление стоит рядом с «Сохранить», а не спрятано
        entry.del = btn('btn btn--del', 'Удалить');
        entry.del.id = 'delBtn';
        entry.del.addEventListener('click', removeEntry);
        foot.appendChild(entry.del);
      }
      foot.appendChild(entry.go);
      add(m, screen, foot);
      paintChips();
      paintEntry();
    });
    paintEntry(); // лист уже на экране: теперь можно измерить, помещаются ли кнопки частых записей
  }

  /** На листе три ряда меток. Категорий может быть больше, чем мест: тогда они делятся на страницы, а последняя метка листает («Ещё», на последней странице «Назад»).
      Трата: три колонки, длинное название занимает две. Доход: две колонки. */
  function chipPages(list, cols) {
    function rows(items, nav) {
      var wide = 0, single = nav ? 1 : 0, full = 0;
      items.forEach(function (c) { if (c.full) { full++; } else if (cols === 3 && c.wide) { wide++; } else { single++; } });
      return full + (cols === 3 ? wide + Math.ceil(Math.max(0, single - wide) / 3) : Math.ceil(single / 2));
    }
    if (rows(list, false) <= 3) { return [list]; }
    var pages = [], page = [];
    list.forEach(function (c) {
      if (page.length && rows(page.concat([c]), true) > 3) { pages.push(page); page = []; }
      page.push(c);
    });
    if (page.length) { pages.push(page); }
    return pages;
  }
  function paintChips() {
    var goalKind = entry.kind === 's' || entry.kind === 't', pay = entry.kind === 'p', debt = entry.kind === 'give' || entry.kind === 'get';
    var credits = activeCredits().map(function (k) { return { id: 'k_' + k.id, name: k.name, wide: k.name.length > 11, full: k.name.length > 18 }; }); // в платеже метки по половине ряда, во весь ряд только длинные
    var list = debt ? (entry.fresh ? F.DEBTS.map(function (p) { return { id: 'd_' + p.id, name: p.name, wide: p.name.length > 11, full: p.name.length > 18 }; }).concat([{ id: '+', name: 'Человек', fresh: true, person: true }]) : []) : entry.kind === 'e' ? F.CATS.concat(credits) : entry.kind === 'i' ? F.SRCS : pay ? credits : F.GOALS.map(function (g) { return { id: 'g_' + g.id, name: g.name, wide: false, full: g.name.length > 13 }; }), cols = entry.kind === 'e' || debt ? 3 : 2; // длинное название занимает весь ряд; кредиты стоят и в конце категорий трат
    if (entry.kind === 's' && !entry.edit) { list = list.concat([{ id: '+', name: 'Новая цель', fresh: true }]); } // снять можно только из цели, которая уже есть
    if (pay) { list = list.concat([{ id: '+', name: 'Новый кредит', fresh: true, credit: true }]); }
    var pages = chipPages(list, cols);
    if (entry.page === undefined) { // при правке открыть страницу, на которой стоит категория записи
      entry.page = 0;
      pages.forEach(function (pg, n) { if (F.find(pg, entry.cat)) { entry.page = n; } });
    }
    if (entry.page >= pages.length) { entry.page = 0; }
    clear(entry.chips);
    entry.chips.className = 'chips' + (cols === 2 ? ' chips--two' : '') + (entry.segBtns.length ? '' : ' chips--fit'); // без переключателя вида высоту на три ряда держать незачем: сумма встаёт по центру, без дыры над метками
    entry.chips.setAttribute('aria-label', debt ? 'Кто' : goalKind ? 'Цель' : pay ? 'Кредит' : entry.kind === 'e' ? 'Категория' : 'Источник');
    entry.chipBtns = pages[entry.page].map(function (c) {
      if (c.fresh) { // «Новая цель» прямо с листа: набранная сумма не теряется
        var nl = el('li', 'chips__new'), nbn = btn('');
        nbn.id = c.person ? 'chipNewPerson' : c.credit ? 'chipNewCredit' : 'chipNewGoal';
        add(nbn, icon('plus'), document.createTextNode(c.name));
        nbn.addEventListener('click', function () {
          if (!entry || entry.busy) { return; }
          var keep = { kind: entry.kind, digits: entry.digits, cur: entry.cur, date: entry.date, note: entry.note, fresh: entry.fresh };
          if (c.person) { // новый человек прямо с листа долга: набранная сумма не теряется
            if (F.DEBTS.length >= F.DEBTS_MAX) { haptic('err'); toast('Людей уже сорок. Удалите того, с кем рассчитались.'); return; }
            openDebtEdit(null, function () { openEntry(null, keep); }, function (id) { keep.cat = 'd_' + id; openEntry(null, keep); });
            return;
          }
          if (c.credit) { // новый кредит прямо с листа платежа: набранная сумма не теряется
            if (F.CREDITS.length >= F.CREDITS_MAX) { haptic('err'); toast('Кредитов уже двенадцать. Удалите погашенный.'); return; }
            openCreditEdit(null, function () { openEntry(null, keep); }, function (id) {
              var k = F.find(F.CREDITS, id);
              keep.cat = 'k_' + id;
              if (!keep.digits && k && k.p) { keep.digits = digitsOf(k.p); keep.cur = F.CURS[k.u]; }
              openEntry(null, keep);
            });
            return;
          }
          if (F.GOALS.length >= F.GOALS_MAX) { haptic('err'); toast('Целей уже двенадцать. Удалите ту, что закрыта.'); return; }
          openGoalEdit(null, function () { openEntry(null, keep); }, function (id) { keep.cat = 'g_' + id; openEntry(null, keep); });
        });
        nl.appendChild(nbn);
        entry.chips.appendChild(nl);
        return nbn;
      }
      var li = el('li', (c.wide && cols === 3) || c.full ? 'chips__wide' : ''), b = btn('', c.name);
      b.setAttribute('data-cat', c.id);
      b.addEventListener('click', function () {
        if (!entry || entry.busy) { return; }
        entry.cat = entry.cat === c.id ? '' : c.id;
        var k = F.creditOf(entry.cat);
        if (k && k.p && !entry.digits && !entry.edit) { entry.digits = digitsOf(k.p); entry.cur = F.CURS[k.u]; } // сумма ещё не набрана: подставляется платёж кредита
        haptic();
        paintEntry();
      });
      li.appendChild(b);
      entry.chips.appendChild(li);
      return b;
    });
    if (pages.length > 1) {
      var last = entry.page === pages.length - 1, nav = btn('', last ? 'Назад' : 'Ещё'), navLi = el('li', 'chips__nav');
      nav.id = 'chipsNav';
      nav.setAttribute('aria-label', last ? 'К первым категориям' : 'Остальные категории');
      nav.addEventListener('click', function () {
        if (!entry || entry.busy) { return; }
        entry.page = last ? 0 : entry.page + 1;
        haptic();
        paintChips();
        paintEntry();
      });
      navLi.appendChild(nav);
      entry.chips.appendChild(navLi);
    }
  }

  /** обновляет лист на месте: поля не пересоздаются */
  function paintEntry() {
    var e = entry, minor = F.parseTyped(e.digits), byn = F.toByn(minor, e.cur, F.RATES[e.cur]);
    e.segBtns.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-kind') === e.kind)); });
    e.chipBtns.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-cat') === e.cat)); });

    var shown = F.typed(e.digits), len = shown.replace(/\s/g, '').length;
    e.sum.textContent = shown;
    e.sum.className = 'entry__sum' + (e.digits ? ' is-on' : '') + (len > 7 ? ' is-s' : len > 5 ? ' is-m' : '');
    e.curText.textContent = e.cur;
    e.curBtn.setAttribute('aria-label', 'Валюта: ' + e.cur + '. Нажмите, чтобы сменить');
    e.dateText.textContent = F.dayLabel(e.date);

    var showDone = !!e.done && !e.digits && Date.now() < e.doneUntil; // после записи в серии: строка «Записано» 6 секунд или до первого нажатия
    var often = (!showDone && !e.edit && !e.digits && !e.busy && window.innerHeight / K >= 640) ? F.frequent(st.all, e.kind, 9) : []; // на низком экране кнопкам нет места
    var shownList = e.kind === 'e' ? F.CATS : F.SRCS;
    often = often.filter(function (it) { return !!F.find(shownList, it.c); }).slice(0, 3); // скрытую категорию частая запись не предлагает
    clear(e.quick);
    e.quick.hidden = !often.length;
    e.hint.hidden = !!often.length;
    often.forEach(function (it) {
      var dict = F.dict(it.k, it.c), b = btn('quick__btn'), label = it.n || dict.name, money = F.fmtShort(it.a) + (it.u === 'BYN' ? '' : F.NB + it.u);
      b.setAttribute('aria-label', 'Добавить: ' + label + ' ' + money);
      add(b, icon('plus'), el('span', '', label), el('b', '', money));
      b.addEventListener('click', function () { quickAdd(it); });
      e.quick.appendChild(b);
    });

    if (often.length) { // пустой ноль рядом с кнопками меньше; если и так не помещается (низкий экран, полоска iPhone) — кнопок нет
      e.sum.className = 'entry__sum is-m';
      while (e.quick.children.length > 1 && e.quick.scrollWidth > e.quick.clientWidth + 1) { e.quick.removeChild(e.quick.lastChild); } // показываем столько, сколько помещается целиком
      if (e.box.scrollHeight > e.box.clientHeight + 1) { clear(e.quick); e.quick.hidden = true; e.hint.hidden = false; e.sum.className = 'entry__sum'; }
    }

    clear(e.hint);
    clear(e.hint2);
    e.hint.className = 'entry__conv';
    e.hint2.hidden = true;
    e.over = '';
    if (showDone) { seriesDone(e); }
    else if (e.kind === 'give' || e.kind === 'get') { debtHints(e, minor, byn); }
    else if (e.kind === 's' || e.kind === 't') { goalHints(e, minor, byn); }
    else if (e.kind !== 'i' && F.creditOf(e.cat)) { creditHints(e, minor, byn); }
    else if (e.cur !== 'BYN') {
      e.hint.textContent = minor ? 'это ' + F.fmt(byn) + F.NB + 'BYN по' + F.NB + 'курсу ' + F.fmtRate(F.RATES[e.cur]) : 'курс ' + F.fmtRate(F.RATES[e.cur]) + F.NB + 'BYN за' + F.NB + '1' + F.NB + e.cur;
    } else if (e.kind === 'e' && minor && st.limits[e.cat] && F.monthOf(e.date) === st.month && limitOver(e, byn) > 0) { // запись выйдет за лимит категории — предупреждение вместо «Останется»
      add(e.hint, document.createTextNode(nb('Будет больше лимита на') + F.NB), el('b', '', F.fmt(limitOver(e, byn)))); // категория уже выделена меткой ниже: длинное название не обрезает строку
      e.hint.className = 'entry__conv entry__conv--warn';
    } else if (!e.edit && F.monthOf(e.date) === st.month) { // сколько останется после этой записи
      var s = st.sum, text, val, left = budgetOn() ? monthLeft() - (minor && e.kind === 'e' ? byn : 0) : s.left + st.carry + (minor ? (e.kind === 'e' ? -byn : byn) : 0);
      if (budgetOn() && e.kind === 'i') { text = 'Бюджет'; val = st.budget.a; } // доход бюджет не меняет
      else if (!budgetOn() && !s.income && !st.carry && e.kind === 'e') { text = minor ? 'Будет потрачено' : 'Потрачено'; val = s.spent + (minor ? byn : 0); }
      else if (left < 0) { text = 'Перерасход'; val = -left; }
      else { text = minor ? (e.kind === 'e' ? 'Останется' : 'Станет') : 'Осталось'; val = left; }
      add(e.hint, document.createTextNode(text + ' '), el('b', '', F.fmt(val)));
    }

    var label, off = true;
    if (e.busy) { label = 'Сохраняем'; }
    else if (!minor && e.series) { label = 'Готово' + F.NB + '·' + F.NB + e.series + F.NB + F.plural(e.series, 'запись', 'записи', 'записей'); off = false; e.closeOnly = true; } // серия идёт, ничего не набрано: закрыть лист
    else if (!minor) { label = 'Введите сумму'; }
    else if (!e.cat) { label = e.kind === 'give' || e.kind === 'get' ? 'Выберите человека' : e.kind === 'e' ? 'Выберите категорию' : e.kind === 'i' ? 'Выберите источник' : e.kind === 'p' ? 'Выберите кредит' : 'Выберите цель'; }
    else if (e.over) { label = e.over; } // снять больше, чем есть в цели, нельзя: кнопка называет, сколько там
    else {
      var money = e.cur === 'BYN' ? F.fmt(minor) : F.fmtShort(minor) + F.NB + e.cur;
      label = e.edit ? 'Сохранить' : e.kind === 'give' || e.kind === 'get' ? 'Записать ' + money : e.kind === 'e' ? 'Добавить трату' : e.kind === 'i' ? 'Добавить доход' : (e.kind === 's' ? 'Отложить ' : e.kind === 'p' ? 'Внести ' : 'Снять ') + money;
      off = false;
    }
    if (!(!minor && e.series && !e.busy)) { e.closeOnly = false; }
    e.go.textContent = label;
    e.go.className = 'btn' + (off ? ' btn--off' : '');
    e.go.setAttribute('aria-disabled', String(off));
    if (e.more) {
      var moreOff = !!e.busy || !minor || !e.cat || !!e.over;
      e.more.className = 'btn btn--quiet' + (moreOff ? ' btn--off' : '');
      e.more.setAttribute('aria-disabled', String(moreOff));
    }
    if (e.del) { e.del.setAttribute('aria-disabled', String(!!e.busy)); }
  }

  /** на сколько запись выведет категорию за лимит (0 — не выведет); при правке прежняя сумма записи не считается */
  function limitOver(e, byn) {
    var lim = st.limits[e.cat], spent = 0;
    st.ops.forEach(function (op) { if (op.k === 'e' && op.c === e.cat && (!e.edit || op.id !== e.edit.id)) { spent += F.bynOf(op); } });
    return Math.max(0, spent + byn - lim);
  }
  /** две строки под суммой у записи цели: что станет с целью и что станет с остатком месяца (одна запись делает два дела) */
  function goalHints(e, minor, byn) {
    var g = F.goalOf(e.cat), take = e.kind === 't';
    if (!g) { if (minor && e.cur !== 'BYN') { e.hint.textContent = 'это ' + F.fmt(byn) + F.NB + 'BYN по' + F.NB + 'курсу ' + F.fmtRate(F.RATES[e.cur]); } return; }
    var was = F.goalState(g, st.all).have, cur = gcur(g), delta = F.goalAmount(g, minor, e.cur);
    if (e.edit && e.edit.c === e.cat) { was -= (e.edit.k === 'e' ? 1 : -1) * F.goalAmount(g, e.edit.a, e.edit.u, e.edit.r); } // правка: считаем так, будто прежней записи нет
    var will = was + (take ? -delta : delta), tail = g.u === 0 ? '' : F.NB + cur;
    if (take && minor && will < 0) { e.over = nb('В цели только ' + gmCur(Math.max(0, was), g)); }
    if (!minor) { add(e.hint, document.createTextNode(nb((take ? 'В цели ' : 'Сейчас накоплено ') + gm(was, g) + tail + ' из ' + gm(g.a, g)))); }
    else if (take) { add(e.hint, document.createTextNode(nb('В цели останется ')), el('b', '', gm(Math.max(0, will), g)), document.createTextNode(nb(' из ' + gm(g.a, g) + tail))); }
    else if (e.cur === cur) { add(e.hint, document.createTextNode('Сейчас ' + gm(was, g) + ', станет '), el('b', '', gm(will, g))); }
    else { // цель в одной валюте, откладывают в другой: пересчёт виден до сохранения
      var one = e.cur === 'BYN' ? cur : cur === 'BYN' ? e.cur : '';
      add(e.hint, el('b', '', gm(delta, g) + F.NB + cur), document.createTextNode(nb(one ? ' по курсу ' + F.fmtRate(F.RATES[one]) : ' по курсам приложения') + ', станет ' + gm(will, g)));
    }
    if (minor && !e.edit && F.monthOf(e.date) === st.month && window.innerHeight / K >= 640 && !budgetOn()) { // на низком экране второй строке нет места; при бюджете отложенное трат не меняет
      var s = st.sum, left = s.left + st.carry + (take ? byn : -byn);
      add(e.hint2, document.createTextNode(nb(left < 0 ? 'Перерасход месяца ' : 'На траты ' + F.inMonth(st.month) + (take ? ' станет ' : ' останется '))), el('b', '', F.fmt(Math.abs(left))));
      e.hint2.hidden = false;
    }
  }
  /** под суммой платежа: что станет с долгом и что останется на траты месяца */
  function creditHints(e, minor, byn) {
    var k = F.creditOf(e.cat), was = F.creditState(k, st.all, st.month).left, delta = F.goalAmount(k, minor, e.cur), cur = F.CURS[k.u], tail = k.u === 0 ? '' : F.NB + cur;
    if (e.edit && e.edit.c === e.cat) { was += F.goalAmount(k, e.edit.a, e.edit.u, e.edit.r); } // правка: считаем так, будто прежнего платежа нет
    var will = was - delta;
    if (!minor) { add(e.hint, document.createTextNode(was > 0 ? 'Долг ' + gm(was, k) + tail : 'Кредит погашен')); }
    else if (e.cur === cur) { add(e.hint, document.createTextNode('Долг ' + gm(Math.max(0, was), k) + ', ' + (will < 0 ? 'переплата ' : 'станет ')), el('b', '', gm(Math.abs(will), k))); }
    else { // долг в одной валюте, платят в другой: пересчёт виден до сохранения
      var one = e.cur === 'BYN' ? cur : cur === 'BYN' ? e.cur : '';
      add(e.hint, el('b', '', gm(delta, k) + F.NB + cur), document.createTextNode(nb(one ? ' по курсу ' + F.fmtRate(F.RATES[one]) : ' по курсам приложения') + ', долг станет ' + gm(Math.max(0, will), k)));
    }
    if (minor && !e.edit && F.monthOf(e.date) === st.month && window.innerHeight / K >= 640) { // на низком экране остаётся главное: что станет с долгом
      var left = monthLeft() - byn;
      add(e.hint2, document.createTextNode(nb(left < 0 ? 'Перерасход месяца ' : 'На траты ' + F.inMonth(st.month) + ' останется ')), el('b', '', F.fmt(Math.abs(left))));
      e.hint2.hidden = false;
    }
  }
  function afterWrite(err, date, said) {
    if (!entry) { return; }
    if (err) { entry.busy = false; paintEntry(); haptic('err'); toast(explain(err)); return; }
    haptic('ok');
    st.month = date ? F.monthOf(date) : st.month;
    closeModal(0);
    reload(true, said);
  }
  function undone(err) { if (err) { toast(explain(err)); } else { haptic(); reload(true); } }
  function submitEntry(more) {
    var e = entry;
    if (!e || e.busy) { return; }
    if (more !== true && e.closeOnly) { closeSeries(); return; }
    var minor = F.parseTyped(e.digits);
    if (!minor || !e.cat || e.over) { haptic('err'); return; }
    var op = F.makeOp(e.kind === 'i' || e.kind === 't' || e.kind === 'get' ? 'i' : 'e', e.cat, minor, e.cur, e.date, e.edit ? e.edit.id : null, e.note); // отложенное хранится как трата с категорией цели, снятое — как доход
    if (e.edit && e.edit.u === e.cur && e.edit.r) { op.r = e.edit.r; } // правка не меняет курс, по которому запись была внесена
    e.busy = true;
    paintEntry();
    if (e.edit) { store.update(op, F.monthOf(e.edit.d), function (err) { afterWrite(err, op.d); }); return; }
    if (more === true || e.series) { seriesAdd(op, more === true); return; } // серия: и последняя трата серии с главной кнопкой записывается так же, потом лист закрывается
    addOp(op);
  }
  /** запись в серии: лист остаётся, сумма и категория очищаются, дата и вид — те же; под суммой «Записано… Отменить», счёт на главной кнопке */
  function seriesAdd(op, stay) {
    var e = entry;
    store.add(op, function (err) {
      if (!entry || entry !== e) { return; }
      if (err) { e.busy = false; paintEntry(); haptic('err'); toast(explain(err)); return; }
      haptic('ok');
      e.series++;
      e.done = op;
      st.month = F.monthOf(op.d);
      if (!stay) { closeModal(0); reload(true, function () { toast('Записано: ' + e.series + F.NB + F.plural(e.series, 'запись', 'записи', 'записей')); }); return; }
      e.digits = '';
      e.cat = '';
      e.note = '';
      e.noteInput.value = '';
      e.doneUntil = Date.now() + 6000;
      reload(false, function () {
        if (entry !== e) { return; }
        e.busy = false;
        paintChips();
        paintEntry();
        bump(e.go);
        clearTimeout(e.doneTimer);
        e.doneTimer = setTimeout(function () { if (entry === e) { paintEntry(); } }, 6100);
      });
    });
  }
  /** «Записано: Связь 12,00» и серая «Отменить» под суммой */
  function seriesDone(e) {
    var op = e.done, d = F.dict(op.k, op.c), undo = btn('capsule entry__undo');
    undo.id = 'seriesUndo';
    undo.appendChild(el('span', '', 'Отменить'));
    undo.addEventListener('click', function () {
      if (!entry || entry !== e || e.busy) { return; }
      e.busy = true;
      store.remove(op.id, F.monthOf(op.d), function (err) {
        if (err) { e.busy = false; paintEntry(); toast(explain(err)); return; }
        e.series = Math.max(0, e.series - 1);
        e.done = null;
        reload(false, function () { if (entry === e) { e.busy = false; haptic(); paintEntry(); } });
      });
    });
    var txt = el('span', 'entry__done', nb('Записано: ' + d.name + ' ' + (op.u === 'BYN' ? F.fmt(op.a) : F.fmtShort(op.a) + F.NB + op.u)));
    e.hint.className = 'entry__conv entry__conv--done';
    add(e.hint, txt, undo);
  }
  function closeSeries() {
    var n = entry ? entry.series : 0;
    closeModal(0, function () { if (n) { toast('Записано: ' + n + F.NB + F.plural(n, 'запись', 'записи', 'записей')); } });
  }
  /** цифра счёта на кнопке перещёлкивается пружиной */
  function bump(node) {
    if (reduce || !node.animate) { return; }
    node.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.04)' }, { transform: 'scale(1)' }], { duration: 250, easing: 'cubic-bezier(.2,.8,.2,1.2)' });
  }
  function addOp(op) {
    store.add(op, function (err) {
      afterWrite(err, op.d, function () { // случайную запись можно убрать сразу, не заходя в «Историю»
        toast(F.isGoalOp(op) ? (op.k === 'e' ? 'Отложено на цель' : 'Снято из накоплений') : F.isDebtOp(op) ? (op.k === 'e' ? 'Записано: отдано' : 'Записано: получено') : F.isCreditOp(op) ? 'Платёж внесён' : op.k === 'e' ? 'Трата добавлена' : 'Доход добавлен', 'Отменить', function () { store.remove(op.id, F.monthOf(op.d), undone); });
      });
    });
  }
  function quickAdd(it) { // частая запись целиком: категория, сумма, валюта и заметка те же, дата из листа
    var e = entry;
    if (!e || e.busy) { return; }
    e.busy = true;
    paintEntry();
    var op = F.makeOp(it.k, it.c, it.a, it.u, e.date, null, it.n);
    if (e.series) { seriesAdd(op, true); return; } // серия уже идёт: частая запись тоже оставляет лист
    addOp(op);
  }
  function removeEntry() {
    var e = entry;
    if (!e || !e.edit || e.busy) { return; }
    var old = e.edit;
    function go(yes) {
      if (!yes || !entry) { return; }
      entry.busy = true;
      paintEntry();
      store.remove(old.id, F.monthOf(old.d), function (err) {
        afterWrite(err, null, function () { toast('Запись удалена', 'Вернуть', function () { store.add(old, undone); }); });
      });
    }
    if (inTg && tg.showConfirm) { try { tg.showConfirm('Удалить эту запись?', go); return; } catch (x) { /* спросим обычным окном */ } }
    go(window.confirm('Удалить эту запись?'));
  }

  // ---------- выбор месяца ----------
  function openMonths() {
    var now = F.monthOf(F.today());
    var list = st.months.slice();
    if (list.indexOf(now) < 0) { list.push(now); }
    if (list.indexOf(st.month) < 0) { list.push(st.month); }
    list.sort().reverse();
    haptic();
    openModal('list', false, function (m) {
      var box = el('div', 'pick');
      box.appendChild(el('h2', '', 'Месяц'));
      var ul = el('ul', 'pick__list');
      list.forEach(function (month) {
        var li = el('li'), b = btn('pick__row', F.monthLabel(month));
        b.setAttribute('data-month', month);
        if (month === st.month) { b.setAttribute('aria-current', 'true'); }
        b.addEventListener('click', function () {
          st.month = month;
          st.more = false;
          closeModal(0);
          reload(true);
        });
        li.appendChild(b);
        ul.appendChild(li);
      });
      box.appendChild(ul);
      m.appendChild(box);
    });
  }

  // ---------- свои категории: слова, списки, сохранение ----------
  var WORDS = {
    e: { key: 'cats', list: 'Категории трат', own: 'Своя категория', fresh: 'Новая категория', edit: 'Изменить категорию', hide: 'Скрыть категорию', hidden: 'Категория скрыта\nЗаписи на месте',
      off: 'Скрытые категории', last: 'Нужна хотя бы одна категория', kept: 'Записи останутся. Вернуть категорию можно в «Скрытых».', ph: 'Например, ремонт', full: 'Категорий уже сорок. Переименуйте одну из имеющихся' },
    i: { key: 'srcs', list: 'Источники дохода', own: 'Свой источник', fresh: 'Новый источник', edit: 'Изменить источник', hide: 'Скрыть источник', hidden: 'Источник скрыт\nЗаписи на месте',
      off: 'Скрытые источники', last: 'Нужен хотя бы один источник', kept: 'Записи останутся. Вернуть источник можно в «Скрытых».', ph: 'Например, стипендия', full: 'Источников уже сорок. Переименуйте один из имеющихся' }
  };
  // значки на выбор: четыре ряда по семь
  var PICK = ['cart', 'cup', 'bus', 'car', 'home', 'phone', 'heart', 'pill', 'star', 'shirt', 'box', 'users', 'gift', 'ticket',
    'repeat', 'book', 'paw', 'case', 'card', 'file', 'cash', 'wallet', 'drop', 'bag', 'laptop', 'plane', 'tool', 'dots'];
  var ALIAS = { spark: 'ticket' }; // прежнее имя того же значка

  /** списки в виде для хранения: видимые (on) и скрытые (off) */
  function listsOf(kind) { return { on: F.packList(kind === 'i' ? F.SRCS : F.CATS), off: F.packList(F.OFF[kind]) }; }
  function namesOf(lists, skip) {
    var out = {};
    lists.forEach(function (c) { if (c[0] !== skip) { out[c[1].toLowerCase()] = 1; } });
    return out;
  }
  function idsOf(lists) { var out = {}; lists.forEach(function (c) { out[c[0]] = 1; }); return out; }
  /** списки пишутся одной записью настроек; done(true) — сохранено и экран под листом обновлён */
  function saveLists(kind, on, off, done) {
    var patch = {};
    patch[WORDS[kind].key] = on;
    patch[WORDS[kind].key + 'Off'] = off.length ? off : null;
    store.patchCfg(patch, function (err) {
      if (err) { haptic('err'); toast(err === 'too long' ? 'Список не помещается: сократите названия.' : explain(err)); done(false); return; }
      reload(false, function (e) { done(!e); });
    });
  }

  // ---------- выбор категорий метками: первый запуск и «Выбрать из готовых» ----------
  /** Экран открывается сам один раз у того, у кого своего списка ещё нет: и у нового человека, и у того, кто начал до появления своих категорий
      (его прежние категории уже отмечены, записи не меняются). Позже его открывает строка «Выбрать из готовых» в настройках */
  function firstRun() {
    if (!st.loaded || st.error || st.partial) { return false; }
    return (!st.cfg.seen && !st.cfg.cats) || !!(st.first && st.first.manual);
  }
  /** что показать и что отметить. Новый человек: стартовый набор, первые девять отмечены. Остальные: свои видимые (отмечены), скрытые и то из набора, чего у них нет */
  function pickBase() {
    var on = {}, list;
    function mark(c) { on[c[0]] = 1; }
    if (!st.cfg.cats && !st.months.length) {
      list = F.STARTER.slice();
      list.slice(0, F.STARTER_ON).forEach(mark);
    } else {
      var l = listsOf('e'), mine = l.on.concat(l.off), ids = idsOf(mine), names = namesOf(mine);
      list = mine.concat(F.STARTER.filter(function (c) { return !ids[c[0]] && !names[c[1].toLowerCase()]; })).slice(0, F.LIST_MAX);
      l.on.forEach(mark);
    }
    return { list: list, on: on };
  }
  function openPicker() {
    closeModal(0, function () {
      st.first = { manual: true };
      tgTry(function () { tg.BackButton.show(); });
      paint(false);
    });
  }
  function closePicker() {
    st.first = null;
    tgTry(function () { tg.BackButton.hide(); });
    paint(false);
  }
  function paintFirst() {
    var f = st.first || (st.first = {});
    if (!f.base) { var base = pickBase(); f.base = base.list; f.on = base.on; f.mine = []; f.busy = false; }
    function all() { return f.base.concat(f.mine); }
    function picked() { return all().filter(function (c) { return f.on[c[0]]; }); }
    clear(view);
    var even = all().some(function (c) { return c[1].length > 9; }); // есть название длиннее «Документов»: столбцы равные (по содержимому они уже не делятся без обрезки, проверено 13.10.2026)
    var box = el('div', 'first'), ul = el('ul', 'picks' + (even ? ' picks--even' : '')), go = btn('btn');
    go.id = 'firstGo';
    function label() {
      var n = picked().length, off = !n || f.busy;
      go.textContent = f.busy ? 'Сохраняем' : (n ? 'Готово, выбрано ' + n : 'Выберите хотя бы одну');
      go.className = 'btn' + (off ? ' btn--off' : '');
      go.setAttribute('aria-disabled', String(off));
    }
    ul.setAttribute('aria-label', 'Категории трат');
    all().forEach(function (c) {
      var li = el('li', c[1].length > 11 ? 'picks__wide' : ''), b = btn(''); // длинное название занимает два столбца, как на листе добавления
      b.setAttribute('data-cat', c[0]);
      b.setAttribute('aria-pressed', String(!!f.on[c[0]]));
      add(b, icon(c[2]), el('span', '', c[1]));
      b.addEventListener('click', function () {
        if (f.busy) { return; }
        if (f.on[c[0]]) { delete f.on[c[0]]; } else { f.on[c[0]] = 1; }
        b.setAttribute('aria-pressed', String(!!f.on[c[0]]));
        haptic();
        label();
      });
      li.appendChild(b);
      ul.appendChild(li);
    });
    var ownLi = el('li', 'picks__add'), own = btn('');
    own.id = 'firstOwn';
    add(own, icon('plus'), el('span', '', 'Своя'));
    own.addEventListener('click', function () {
      if (f.busy) { return; }
      if (all().length >= F.LIST_MAX) { haptic('err'); toast(WORDS.e.full); return; }
      haptic();
      catSheet('e', null, null, function (name, ic) { // своя категория пока живёт на этом экране: запишется вместе с остальными по «Готово»
        var id = F.catId(idsOf(all()));
        f.mine.push([id, name, ic]);
        f.on[id] = 1;
        closeModal(0, function () { if (f.manual) { tgTry(function () { tg.BackButton.show(); }); } });
        paintFirst();
      }, null, namesOf(all()));
    });
    ownLi.appendChild(own);
    ul.appendChild(ownLi);
    go.addEventListener('click', function () {
      var on = picked();
      if (!on.length || f.busy) { haptic('err'); return; }
      var off = f.base.filter(function (c) { return !f.on[c[0]]; }); // неотмеченные уходят в скрытые: записи в них остаются, вернуть можно в настройках
      f.busy = true;
      label();
      store.patchCfg({ cats: on, catsOff: off.length ? off : null, seen: 1 }, function (err) {
        if (err) { f.busy = false; label(); haptic('err'); toast(err === 'too long' ? 'Список не помещается: сократите названия.' : explain(err)); return; }
        var manual = !!f.manual;
        haptic('ok');
        st.first = null;
        tgTry(function () { tg.BackButton.hide(); });
        reload(true, manual ? function () { toast('Категории обновлены'); } : gearTip);
      });
    });
    var foot = el('div', 'first__dock'), back = null;
    foot.appendChild(go);
    if (f.manual && !inTg) {
      back = btn('first__back');
      back.id = 'pickBack';
      back.setAttribute('aria-label', 'Назад');
      back.appendChild(icon('left'));
      back.addEventListener('click', closePicker);
    }
    var lead = el('p', 'first__lead', nb('Тёмные уже выбраны. Нажмите, чтобы добавить или убрать.'));
    if (!f.manual) { // настройку прислал близкий: вставить её вместо выбора. Внутри подзаголовка, а не строкой: на iPhone SE строка выталкивала метки за экран (18.10.2026)
      var code = btn('first__code', 'Есть код настройки');
      code.id = 'firstCode';
      code.addEventListener('click', function () { openImport(null, null); });
      add(lead, document.createTextNode(' '), code);
    }
    add(box, back, el('h1', 'first__title', 'На что вы тратите'), lead, ul, foot);
    view.appendChild(box);
    label();
  }

  /** подсказка-пузырь у шестерёнки: показывается один раз после первого экрана, уходит с первым касанием по экрану */
  function gearTip() {
    var tip = el('div', 'tip', nb('Категории меняются здесь'));
    tip.id = 'gearTip';
    tip.setAttribute('role', 'status');
    stage.appendChild(tip);
    function off() {
      document.removeEventListener('pointerdown', off, true);
      if (tip.parentNode) { tip.parentNode.removeChild(tip); }
    }
    setTimeout(function () { document.addEventListener('pointerdown', off, true); }, 400);
  }

  // ---------- оформление: светлое и тёмное (пункт 11, решение разработчика 18.10.2026: палитра «Чёрный», как в Telegram + своя строка) ----------
  var THEME_BG = { light: '#F5F5F7', dark: '#000000' }, THEME_BAR = { light: '#FFFFFF', dark: '#1C1C1E' };
  /** выбор на этом телефоне: auto (как в Telegram или в телефоне), light, dark */
  function themePref() { try { var v = localStorage.getItem('fin_theme'); return v === 'light' || v === 'dark' ? v : 'auto'; } catch (e) { return 'auto'; } }
  function systemDark() {
    if (inTg && tg.colorScheme) { return tg.colorScheme === 'dark'; }
    return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  }
  function themeNow() { var p = themePref(); return p === 'auto' ? (systemDark() ? 'dark' : 'light') : p; }
  /** ставит тему на <html> и красит шапку и низ Telegram в цвет фона — без шва с любой темой Telegram */
  function applyTheme(repaint) {
    var t = themeNow(), root = document.documentElement;
    if (root.getAttribute('data-theme') === t && !repaint) { return; }
    root.setAttribute('data-theme', t);
    tgTry(function () { tg.setHeaderColor(THEME_BG[t]); });
    tgTry(function () { tg.setBackgroundColor(THEME_BG[t]); });
    tgTry(function () { if (tg.setBottomBarColor) { tg.setBottomBarColor(THEME_BAR[t]); } });
    if (repaint && st.loaded && !ui.open) { paint(false); }
  }
  function themeWord(p) { return p === 'light' ? 'светлое' : p === 'dark' ? 'тёмное' : inTg ? 'как в Telegram' : 'как в телефоне'; }
  /** лист «Оформление»: три строки, выбранная с галочкой; меняется сразу */
  function openTheme(back) {
    haptic();
    swapModal('list', false, function (m) {
      var box = el('div', 'pick'), ul = el('ul', 'menu');
      ul.id = 'themeList';
      [['auto', inTg ? 'Как в Telegram' : 'Как в телефоне'], ['light', 'Светлое'], ['dark', 'Тёмное']].forEach(function (o) {
        var li = el('li'), b = btn('menu__row menu__row--pick'), name = el('span', '', o[1]), on = themePref() === o[0];
        b.setAttribute('data-theme-pick', o[0]);
        b.setAttribute('aria-pressed', String(on));
        if (o[0] === 'auto') { name.appendChild(el('small', '', 'сейчас ' + (systemDark() ? 'тёмное' : 'светлое'))); }
        add(b, name, on ? icon('check') : null);
        b.addEventListener('click', function () {
          try { if (o[0] === 'auto') { localStorage.removeItem('fin_theme'); } else { localStorage.setItem('fin_theme', o[0]); } } catch (e) { /* без памяти выбор живёт до закрытия */ }
          haptic('ok');
          applyTheme(false);
          openTheme(back);
        });
        li.appendChild(b);
        ul.appendChild(li);
      });
      add(box, el('h2', 'pick__title', 'Оформление'), el('p', 'pick__info', 'Выбор хранится на этом телефоне.'), ul);
      m.appendChild(box);
    }, back);
  }

  // ---------- размер текста (пункт 12, решение разработчика 18.10.2026: обычный и крупный) ----------
  /** выбор на этом телефоне: big — крупный; иначе обычный */
  function sizePref() { try { return localStorage.getItem('fin_size') === 'big' ? 'big' : 'normal'; } catch (e) { return 'normal'; } }
  /** крупный = всё приложение крупнее: раскладка на ширину экрана/K и scale(K) на корне. K не больше 1,22 и такой,
      чтобы раскладка была не уже 320 и не ниже 580 px (проверенные пределы): на 390×780 — 22 %, на 360 px — 12,5 % */
  function applySize() {
    var hh = inTg && tg.viewportStableHeight ? tg.viewportStableHeight : window.innerHeight;
    var k = sizePref() === 'big' ? Math.min(1.22, window.innerWidth / 320, hh / 580) : 1, html = document.documentElement; // и не ниже 580 px: на 533 сумма наезжала на «Заметку» (18.10.2026)
    if (k < 1.02) { k = 1; }
    K = Math.round(k * 1000) / 1000;
    if (K === 1) { html.removeAttribute('data-size'); html.style.removeProperty('--k'); }
    else { html.setAttribute('data-size', 'big'); html.style.setProperty('--k', String(K)); }
  }
  function openSize(back) {
    haptic();
    swapModal('list', false, function (m) {
      var box = el('div', 'pick'), ul = el('ul', 'menu');
      ul.id = 'sizeList';
      [['normal', 'Обычный', 17], ['big', 'Крупный', 20]].forEach(function (o) {
        var li = el('li'), b = btn('menu__row menu__row--pick'), name = el('span', '', o[1]), on = sizePref() === o[0];
        name.style.fontSize = o[2] + 'px'; // подпись своим размером: видно, что выбираешь
        b.setAttribute('data-size-pick', o[0]);
        b.setAttribute('aria-pressed', String(on));
        add(b, name, on ? icon('check') : null);
        b.addEventListener('click', function () {
          try { if (o[0] === 'big') { localStorage.setItem('fin_size', 'big'); } else { localStorage.removeItem('fin_size'); } } catch (e) { /* без памяти выбор живёт до закрытия */ }
          haptic('ok');
          applySize();
          fit();
          openSize(back);
        });
        li.appendChild(b);
        ul.appendChild(li);
      });
      add(box, el('h2', 'pick__title', 'Размер текста'), el('p', 'pick__info', nb('Крупнее станет всё: текст, кнопки, клавиши. Выбор хранится на этом телефоне.')), ul);
      m.appendChild(box);
    }, back);
  }

  // ---------- «Поделиться настройкой» (пункт 13, решение разработчика 18.10.2026: переключатели; кнопка-ссылка в сообщении) ----------
  var SHARE_BOT = 'umna_finance_bot';
  function shareNames(list, n) { var names = list.map(function (c) { return c.name || c[1]; }); return names.slice(0, n).join(', ') + (names.length > n ? ' и ещё ' + (names.length - n) : ''); }
  function openShare(back) {
    var parts = { c: true, s: true, b: false, l: false, p: false };
    haptic();
    swapModal('list', false, function (m) {
      var box = el('div', 'pick'), ul = el('ul', 'menu'), foot = el('footer', 'modal__dock modal__dock--duo'), copy = btn('btn btn--quiet', 'Скопировать'), send = btn('btn', 'Отправить'), area = el('textarea', 'share__area');
      ul.id = 'shareList';
      function sw(key, name, sub) {
        var li = el('li'), b = btn('switch-row'), text = el('span', '', name);
        b.setAttribute('role', 'switch');
        b.setAttribute('data-share', key);
        b.setAttribute('aria-checked', String(parts[key]));
        text.appendChild(el('small', '', sub));
        add(b, text, el('i', 'switch'));
        b.addEventListener('click', function () { parts[key] = !parts[key]; b.setAttribute('aria-checked', String(parts[key])); haptic(); state(); });
        li.appendChild(b);
        ul.appendChild(li);
      }
      sw('c', WORDS.e.list, shareNames(F.CATS, 3));
      sw('s', WORDS.i.list, shareNames(F.SRCS, 4));
      if (budgetOn()) { sw('b', 'Бюджет на месяц', 'уйдёт сумма ' + F.fmt(st.budget.a)); }
      var lim = Object.keys(st.limits || {});
      if (lim.length) { sw('l', 'Лимиты на категории', lim.slice(0, 2).map(function (id) { return F.dict('e', id).name + ' ' + F.fmt(st.limits[id]); }).join(', ') + (lim.length > 2 ? ' и ещё ' + (lim.length - 2) : '')); }
      if ((st.pays.list || []).length) { sw('p', 'Платежи месяца', 'названия и суммы, без отметок'); }
      function message() {
        var code = F.encodeShare({ cats: parts.c ? F.packList(F.CATS) : null, srcs: parts.s ? F.packList(F.SRCS) : null, budget: parts.b ? st.budget.a : 0, limits: parts.l ? st.limits : null, pays: parts.p ? st.pays.list : null });
        var fits = code.length <= 512, link = 'https://t.me/' + SHARE_BOT + '?startapp=' + code;
        return { link: fits ? link : 'https://t.me/' + SHARE_BOT, text: fits ? 'Мои настройки для «Финансов». Нажми ссылку — они добавятся сами.' : 'Мои настройки для «Финансов». Открой приложение → «Настройки» → «Вставить настройку» и вставь это сообщение.\nfinansy:' + code, fits: fits };
      }
      function any() { return parts.c || parts.s || parts.b || parts.l || parts.p; }
      function state() { [copy, send].forEach(function (b) { b.className = (b === copy ? 'btn btn--quiet' : 'btn') + (any() ? '' : ' btn--off'); b.setAttribute('aria-disabled', String(!any())); }); }
      copy.id = 'shareCopy';
      send.id = 'shareSend';
      area.setAttribute('aria-hidden', 'true');
      area.tabIndex = -1;
      copy.addEventListener('click', function () {
        if (!any()) { haptic('err'); return; }
        var msg = message();
        area.value = msg.text + '\n' + msg.link;
        if (copyText(area, area.value)) { haptic('ok'); toast('Скопировано\nОтправьте близкому в Telegram'); } else { toast('Не скопировалось. Нажмите «Отправить».'); }
      });
      send.addEventListener('click', function () {
        if (!any()) { haptic('err'); return; }
        var msg = message(), url = 'https://t.me/share/url?url=' + encodeURIComponent(msg.link) + '&text=' + encodeURIComponent(msg.text);
        haptic('ok');
        if (inTg && tg.openTelegramLink) { tgTry(function () { tg.openTelegramLink(url); }); return; } // выбор чата Telegram
        if (navigator.share) { navigator.share({ text: msg.text + '\n' + msg.link }).then(function () {}, function () {}); return; }
        area.value = msg.text + '\n' + msg.link;
        copyText(area, area.value);
        toast('Скопировано\nОтправьте близкому в Telegram');
      });
      add(foot, copy, send);
      add(box, el('h2', 'pick__title', 'Поделиться настройкой'), el('p', 'pick__info', nb('Включите, что отправить. Записи трат не отправляются никогда.')), ul, area);
      add(m, box, foot);
      state();
    }, back);
  }
  /** метки как на первом экране: новые — графитом, уже свои — светлые */
  function shareTags(list, fresh) {
    var even = list.some(function (c) { return c[1].length > 9; }), ul = el('ul', 'picks picks--show' + (even ? ' picks--even' : '')); // раскладка та же, что на первом экране: метки без обрезки
    list.forEach(function (c) {
      var li = el('li', c[1].length > 11 ? 'picks__wide' : ''), b = el('span', 'picks__tag');
      b.setAttribute('aria-pressed', String(!!fresh[c[0]]));
      add(b, icon(c[2]), el('span', '', c[1]));
      li.appendChild(b);
      ul.appendChild(li);
    });
    return ul;
  }
  /** слить присланный список со своим: совпадающие по названию не повторяются (скрытая — возвращается), новые встают в конец */
  function mergeShare(kind, incoming) {
    var l = listsOf(kind), all = l.on.concat(l.off), map = {}, fresh = {};
    incoming.forEach(function (c) {
      var key = c[1].toLowerCase(), hit = null;
      all.forEach(function (x) { if (!hit && x[1].toLowerCase() === key) { hit = x; } });
      if (hit) {
        map[c[0]] = hit[0];
        var at = l.off.indexOf(hit);
        if (at >= 0) { l.off.splice(at, 1); l.on.push(hit); }
        return;
      }
      if (all.length >= F.LIST_MAX) { return; }
      var ids = idsOf(all), id = ids[c[0]] ? F.catId(ids) : c[0], row = [id, c[1], c[2]];
      l.on.push(row);
      all.push(row);
      map[c[0]] = id;
      fresh[c[0]] = 1;
    });
    return { on: l.on, off: l.off, map: map, fresh: fresh };
  }
  function applyShare(d, done) {
    var patch = { seen: 1 }, ce = d.cats ? mergeShare('e', d.cats) : null, ci = d.srcs ? mergeShare('i', d.srcs) : null, map = ce ? ce.map : {}, steps = [];
    if (ce) { patch.cats = ce.on; patch.catsOff = ce.off.length ? ce.off : null; }
    if (ci) { patch.srcs = ci.on; patch.srcsOff = ci.off.length ? ci.off : null; }
    steps.push(function (next) { store.patchCfg(patch, next); });
    if (d.budget) { steps.push(function (next) { store.setBudget({ a: d.budget, off: st.budget.off ? 1 : 0 }, next); }); }
    if (d.limits) {
      Object.keys(d.limits).forEach(function (id) { steps.push(function (next) { store.setLimit(map[id] || id, d.limits[id], next); }); });
    }
    if (d.pays) {
      steps.push(function (next) {
        store.patchPays(function (o) {
          var names = {};
          o.list.forEach(function (x) { names[x[1].toLowerCase()] = 1; });
          d.pays.forEach(function (p) {
            if (names[p[1].toLowerCase()] || o.list.length >= 20) { return; }
            o.list.push([F.catId(idsOf(o.list.map(function (x) { return [x[0]]; }))), p[1], p[2], map[p[3]] || p[3], p[4]]);
          });
          return o;
        }, function (err) { next(err); });
      });
    }
    (function run(i) {
      if (i >= steps.length) { st.first = null; tgTry(function () { tg.BackButton.hide(); }); reload(false, function (e) { done(!e); }); return; }
      steps[i](function (err) { if (err) { haptic('err'); toast(err === 'too long' ? 'Список не помещается: сократите названия.' : explain(err)); done(false); return; } run(i + 1); });
    })(0);
  }
  /** «Вставить настройку»: d — уже найденная настройка (открыли по ссылке) или null — поле для вставки */
  function openImport(back, d) {
    var busy = false;
    haptic();
    swapModal('list', false, function (m) {
      var box = el('div', 'pick');
      box.id = 'importBox';
      box.appendChild(el('h2', 'pick__title', 'Вставить настройку'));
      if (!d) {
        var go = btn('btn btn--quiet btn--paste', 'Вставить'), area = el('textarea', 'field import__area'), err = el('p', 'import__err');
        go.id = 'importPaste';
        area.id = 'importText';
        area.rows = 3;
        area.placeholder = 'или вставьте сообщение сюда';
        err.id = 'importErr';
        var moved = false;
        function tryText(t, quiet) {
          if (moved) { return; } // лист уже перестроен: поле теряет фокус при удалении, второй раз не открывать
          var found = F.findShare(t);
          if (found) { moved = true; openImport(back, found); return; }
          if (quiet) { return; }
          haptic('err');
          err.textContent = String(t || '').trim() ? 'Это не код настройки. Скопируйте сообщение целиком.' : 'Скопированного текста нет. Скопируйте сообщение с настройкой.';
        }
        go.addEventListener('click', function () {
          var p = null;
          try { p = navigator.clipboard && navigator.clipboard.readText ? navigator.clipboard.readText() : null; } catch (e) { p = null; }
          if (!p || !p.then) { err.textContent = 'Телефон не дал прочитать скопированное. Вставьте сообщение в поле ниже.'; area.focus(); return; }
          p.then(function (t) { tryText(t, false); }, function () { err.textContent = 'Телефон не дал прочитать скопированное. Вставьте сообщение в поле ниже.'; area.focus(); });
        });
        area.addEventListener('input', function () { err.textContent = ''; tryText(area.value, true); });
        area.addEventListener('blur', function () { if (area.value.trim()) { tryText(area.value, false); } });
        add(box, el('p', 'pick__info', nb('Вставьте сообщение с настройкой, которое вам прислали. Ваши записи не изменятся.')), go, area, err);
        m.appendChild(box);
        return;
      }
      var foot = el('footer', 'modal__dock'), apply = btn('btn', 'Применить'), parts = [];
      box.appendChild(el('p', 'pick__info', nb('Новые — тёмные. Ваши категории и записи останутся, совпадающие не повторятся.'))); // наверху: внизу пояснение уходило под кнопку
      if (d.cats) { var ce = mergeShare('e', d.cats); add(box, el('p', 'lbl', WORDS.e.list), shareTags(d.cats, ce.fresh)); }
      if (d.srcs) { var ci = mergeShare('i', d.srcs); add(box, el('p', 'lbl', WORDS.i.list), shareTags(d.srcs, ci.fresh)); }
      if (d.budget) { parts.push(['Бюджет на месяц', F.fmt(d.budget)]); }
      if (d.limits) { parts.push(['Лимиты на категории', String(Object.keys(d.limits).length)]); }
      if (d.pays) { parts.push(['Платежи месяца', String(d.pays.length)]); }
      if (parts.length) {
        var ul = el('ul', 'menu');
        parts.forEach(function (r) { var li = el('li'), row = el('div', 'menu__row menu__row--plain'); add(row, el('span', '', r[0]), el('small', '', r[1])); li.appendChild(row); ul.appendChild(li); });
        box.appendChild(ul);
      }
      apply.id = 'importApply';
      apply.addEventListener('click', function () {
        if (busy) { return; }
        busy = true;
        apply.textContent = 'Применяем';
        applyShare(d, function (ok) {
          busy = false;
          apply.textContent = 'Применить';
          if (!ok) { return; }
          haptic('ok');
          closeModal(0);
          toast('Настройка добавлена');
        });
      });
      foot.appendChild(apply);
      add(m, box, foot);
    }, back);
  }
  /** открыли по ссылке из сообщения (startapp=c…): сразу лист «Вставить настройку» с тем, что добавится */
  function startShare() {
    if (startShare.done) { return; }
    startShare.done = true;
    var sp = inTg && tg.initDataUnsafe ? tg.initDataUnsafe.start_param : '';
    var d = sp ? F.decodeShare(sp) : null;
    if (d) { openImport(null, d); }
  }

  // ---------- настройки ----------
  function openSettings() {
    if (!st.loaded || st.error || firstRun()) { return; }
    haptic();
    swapModal('list', false, function (m) {
      var box = el('div', 'pick'), ul = el('ul', 'menu'), ul2 = el('ul', 'menu menu--group'), ul3 = el('ul', 'menu menu--group'), cur = ul; // группы: учёт, вид, перенос (замечание арт-директора 18.10.2026)
      function row(id, name, small, fn) {
        var li = el('li'), b = btn('menu__row');
        b.id = id;
        add(b, el('span', '', name), small ? el('small', '', small) : null, icon('right'));
        b.addEventListener('click', fn);
        li.appendChild(b);
        cur.appendChild(li);
      }
      row('setCats', WORDS.e.list, String(F.CATS.length), function () { openCats('e'); });
      row('setSrcs', WORDS.i.list, String(F.SRCS.length), function () { openCats('i'); });
      row('budgetBtn', 'Бюджет на месяц', budgetOn() ? F.fmt(st.budget.a) : 'не задан', function () { openBudget(openSettings); }); // отдельно от подсказки: задать можно, даже если её убрали
      row('paysBtn', 'Платежи месяца', (st.pays.list || []).length ? String(st.pays.list.length) : 'нет', function () { openPays(openSettings); });
      cur = ul2;
      row('themeBtn', 'Оформление', themeWord(themePref()), function () { openTheme(openSettings); });
      row('sizeBtn', 'Размер текста', sizePref() === 'big' ? 'крупный' : 'обычный', function () { openSize(openSettings); });
      cur = ul3;
      row('shareBtn', 'Поделиться настройкой', 'близкому', function () { openShare(openSettings); });
      row('pasteBtn', 'Вставить настройку', 'по коду', function () { openImport(openSettings, null); });
      row('notesBtn', 'Перенос из заметок', '', function () { openNotes(openSettings); });
      row('backupBtn', 'Копия данных', '', function () { openBackup(openSettings); });
      add(box, el('h2', '', 'Настройки'), ul, ul2, ul3);
      if (homeCan() || st.home === 'added') { // строки нет, где значок не ставится (Telegram на компьютере, старая версия)
        var solo = el('ul', 'menu menu--solo'), li = el('li'), hb = btn('menu__row menu__row--icon');
        hb.id = 'homeBtn';
        if (st.home === 'added') {
          var ok = el('small', '', 'добавлен');
          ok.appendChild(icon('check'));
          add(hb, appIcon(30), el('span', '', 'Значок на экране'), ok);
          hb.setAttribute('aria-disabled', 'true');
          hb.classList.add('is-done');
        } else {
          add(hb, appIcon(30), el('span', '', 'Значок на экране'), el('small', '', 'добавить'), icon('right'));
          hb.addEventListener('click', homeAdd);
        }
        li.appendChild(hb);
        solo.appendChild(li);
        box.appendChild(solo);
      }
      // обратная связь — последней группой: анонимно и лично (пункт 17)
      var ul5 = el('ul', 'menu menu--group'), fbLi = el('li'), auLi = el('li'), fb = btn('menu__row');
      fb.id = 'fbBtn';
      add(fb, el('span', '', 'Как улучшить приложение'), el('small', '', 'анонимно'), icon('right'));
      fb.addEventListener('click', function () { openFeedback(openSettings); });
      fbLi.appendChild(fb);
      auLi.appendChild(authorRow());
      add(ul5, fbLi, auLi);
      box.appendChild(ul5);
      m.appendChild(box);
    });
  }

  // ---------- список категорий (или источников) ----------
  function openCats(kind, toEnd) {
    var w = WORDS[kind];
    haptic();
    swapModal('cats', true, function (m) {
      var box = el('div', 'pick pick--cats'), foot = el('footer', 'modal__dock modal__dock--bar'), own = btn('btn btn--quiet');
      own.id = 'ownBtn';
      add(own, icon('plus'), document.createTextNode(w.own));
      own.addEventListener('click', function () { newCat(kind); });
      foot.appendChild(own);
      add(m, box, foot);
      box.addEventListener('scroll', function () { box.setAttribute('data-scrolled', box.scrollTop > 2 ? '1' : '0'); }); // список ушёл под верхний край: там появляется черта
      ui.cats = { kind: kind, box: box };
      fillCats(kind, box);
    }, openSettings);
    if (toEnd && ui.cats) { ui.cats.box.scrollTop = ui.cats.box.scrollHeight; }
  }
  /** список на листе перерисовывается на месте: прокрутка остаётся где была */
  function fillCats(kind, box) {
    var w = WORDS[kind], list = kind === 'i' ? F.SRCS : F.CATS, off = F.OFF[kind];
    var first = chipPages(list, kind === 'i' ? 2 : 3)[0].length, top = box.scrollTop, n = 0;
    clear(box);
    box.className = 'pick pick--cats';
    add(box, el('h2', 'pick__title', w.list), el('p', 'pick__info', nb('Нажмите на строку, чтобы изменить. Порядок меняют за две полоски.')));
    function group(label, items) {
      if (!items.length) { return; }
      var ul = el('ul', 'rows');
      items.forEach(function (c) { ul.appendChild(catRow(kind, c, n++, box)); });
      add(box, list.length > first ? el('p', 'lbl lbl--gap', label) : null, ul);
      if (list.length <= first) { ul.className = 'rows rows--gap'; }
    }
    group(nb('Первые ' + first + ' видны сразу при добавлении'), list.slice(0, first));
    group(nb('Остальные спрятаны под кнопкой «Ещё»'), list.slice(first));
    var menu = el('ul', 'menu');
    function more(id, name, small, fn) {
      var li = el('li'), b = btn('menu__row');
      b.id = id;
      add(b, el('span', '', name), small ? el('small', '', small) : null, icon('right'));
      b.addEventListener('click', fn);
      li.appendChild(b);
      menu.appendChild(li);
    }
    if (kind === 'e') { more('pickBtn', 'Выбрать из готовых', '', openPicker); } // тот же экран с метками, что при первом открытии
    if (off.length) { more('offBtn', 'Скрытые', String(off.length), function () { openHidden(kind); }); }
    if (menu.firstChild) { box.appendChild(menu); }
    box.scrollTop = top;
  }
  function refreshCats() { if (ui.open && ui.kind === 'cats' && ui.cats) { fillCats(ui.cats.kind, ui.cats.box); } }
  function catRow(kind, c, index, box) {
    var li = el('li', 'rows__li'), b = btn('row'), grip = el('span', 'row__grip');
    b.setAttribute('data-cat', c.id);
    add(b, icon(c.icon), el('span', '', c.name), icon('right', 'row__go'));
    b.addEventListener('click', function () { editCat(kind, c.id); });
    grip.setAttribute('role', 'img');
    grip.setAttribute('aria-label', 'Потяните, чтобы переместить');
    grip.appendChild(icon('grip'));
    bindReorder(grip, li, kind, index, box);
    add(li, b, grip);
    return li;
  }
  /** порядок меняется перетаскиванием за две полоски: строка идёт за пальцем, соседи расступаются, у края лист прокручивается.
      Запись одна, при отпускании. Строки двух групп считаются одним списком: подпись между ними строка перешагивает */
  function bindReorder(grip, li, kind, from, box) {
    var id = null, rows = [], tops = [], h = 0, startY = 0, lastY = 0, scroll0 = 0, to = from, raf = 0;
    function place() {
      var dy = lastY - startY + (box.scrollTop - scroll0), j, t = 0;
      dy = Math.max(tops[0] - tops[from], Math.min(tops[tops.length - 1] - tops[from], dy));
      var mid = tops[from] + dy + h / 2;
      for (j = 0; j < tops.length; j++) { if (j !== from && tops[j] + h / 2 < mid) { t++; } }
      if (t !== to) { to = t; haptic(); }
      for (j = 0; j < rows.length; j++) {
        if (j === from) { continue; }
        var nj = j < from ? (j >= to ? j + 1 : j) : (j <= to ? j - 1 : j);
        rows[j].style.transform = nj === j ? '' : 'translate3d(0,' + (tops[nj] - tops[j]).toFixed(1) + 'px,0)';
      }
      li.style.transform = 'translate3d(0,' + dy.toFixed(1) + 'px,0)';
    }
    function tick() {
      var r = box.getBoundingClientRect();
      if (lastY < r.top / K + 56) { box.scrollTop -= 8; } else if (lastY > r.bottom / K - 56) { box.scrollTop += 8; }
      place();
      raf = requestAnimationFrame(tick);
    }
    grip.addEventListener('pointerdown', function (e) {
      if (id !== null) { return; }
      id = e.pointerId;
      try { grip.setPointerCapture(id); } catch (x) { /* без захвата тоже работает */ }
      rows = [].slice.call(box.querySelectorAll('.rows__li'));
      tops = rows.map(function (r) { return r.getBoundingClientRect().top / K + box.scrollTop; });
      h = li.offsetHeight;
      startY = lastY = e.clientY / K;
      scroll0 = box.scrollTop;
      to = from;
      li.className = 'rows__li is-drag';
      box.className = 'pick pick--cats is-sorting';
      haptic();
      raf = requestAnimationFrame(tick);
      e.preventDefault();
    });
    grip.addEventListener('pointermove', function (e) { if (e.pointerId === id) { lastY = e.clientY / K; } });
    function end(e) {
      if (e.pointerId !== id) { return; }
      id = null;
      cancelAnimationFrame(raf);
      place();
      li.className = 'rows__li is-drop'; // строка доезжает на своё новое место
      li.style.transform = 'translate3d(0,' + (tops[to] - tops[from]).toFixed(1) + 'px,0)';
      if (to === from) { setTimeout(function () { fillCats(kind, box); }, reduce ? 0 : 170); return; }
      var l = listsOf(kind), item = l.on.splice(from, 1)[0];
      l.on.splice(to, 0, item);
      saveLists(kind, l.on, l.off, function () { fillCats(kind, box); });
    }
    grip.addEventListener('pointerup', end);
    grip.addEventListener('pointercancel', end);
  }

  // ---------- новая категория и правка ----------
  /** лист с названием и значком. save(название, значок, fail) — сохранить; hide — скрыть (у новой категории его нет); taken — занятые названия */
  function catSheet(kind, item, back, save, hide, taken) {
    var w = WORDS[kind], cur = item ? (ALIAS[item.icon] || item.icon) : 'box', busy = false, name = null;
    swapModal('list', false, function (m) {
      var box = el('div', 'pick pick--cat'), foot = el('footer', 'modal__dock'), go = btn('btn'), icons = el('ul', 'icons');
      name = el('input', 'field');
      name.id = 'catName';
      name.type = 'text';
      name.maxLength = 24;
      name.placeholder = w.ph;
      name.value = item ? item.name : '';
      name.setAttribute('enterkeyhint', 'done');
      name.setAttribute('autocomplete', 'off');
      var l1 = el('label', 'lbl', 'Название');
      l1.setAttribute('for', 'catName');
      go.id = 'catSave';
      function state() {
        var n = F.cleanNote(name.value).slice(0, 24).replace(/ $/, ''), dup = !!n && !!taken[n.toLowerCase()], off = !n || dup;
        go.textContent = !n ? 'Введите название' : (dup ? 'Такое название уже есть' : 'Сохранить');
        go.className = 'btn' + (off ? ' btn--off' : '');
        go.setAttribute('aria-disabled', String(off));
        return off ? '' : n;
      }
      name.addEventListener('input', state);
      name.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { name.blur(); } });
      icons.setAttribute('aria-label', 'Значок');
      var btns = PICK.map(function (ic, n) {
        var li = el('li'), b = btn('');
        b.setAttribute('data-icon', ic);
        b.setAttribute('aria-label', 'Значок ' + (n + 1));
        b.setAttribute('aria-pressed', String(ic === cur));
        b.appendChild(icon(ic));
        b.addEventListener('click', function () {
          cur = ic;
          btns.forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
          haptic();
        });
        li.appendChild(b);
        icons.appendChild(li);
        return b;
      });
      go.addEventListener('click', function () {
        var n = state();
        if (!n || busy) { haptic('err'); return; }
        busy = true;
        save(n, cur, function () { busy = false; });
      });
      var drop = null;
      if (hide) {
        drop = btn('link', w.hide);
        drop.id = 'catHide';
        drop.addEventListener('click', function () { if (!busy) { hide(); } });
      }
      add(box, el('h2', 'pick__title', item ? w.edit : w.fresh), l1, name, el('p', 'lbl', 'Значок'), icons, drop, hide ? el('p', 'pick__info pick__info--kept', nb(w.kept)) : null);
      foot.appendChild(go);
      add(m, box, foot);
      state();
    }, back);
    if (!item && name) { name.focus(); } // новая категория начинается с названия: клавиатура открывается сразу
  }
  function newCat(kind) {
    var l = listsOf(kind), every = l.on.concat(l.off);
    if (every.length >= F.LIST_MAX) { haptic('err'); toast(WORDS[kind].full); return; }
    haptic();
    catSheet(kind, null, function () { openCats(kind); }, function (name, ic, fail) {
      l.on.push([F.catId(idsOf(every)), name, ic]);
      saveLists(kind, l.on, l.off, function (ok) { if (ok) { openCats(kind, true); } else { l.on.pop(); fail(); } });
    }, null, namesOf(every));
  }
  function editCat(kind, id) {
    var w = WORDS[kind], l = listsOf(kind), idx = -1;
    l.on.forEach(function (c, n) { if (c[0] === id) { idx = n; } });
    if (idx < 0) { return; }
    var was = l.on[idx];
    haptic();
    catSheet(kind, { name: was[1], icon: was[2] }, function () { openCats(kind); }, function (name, ic, fail) {
      l.on[idx] = [id, name, ic];
      saveLists(kind, l.on, l.off, function (ok) { if (ok) { openCats(kind); } else { l.on[idx] = was; fail(); } });
    }, function () {
      if (l.on.length < 2) { haptic('err'); toast(w.last); return; }
      var on = l.on.filter(function (c) { return c[0] !== id; });
      saveLists(kind, on, l.off.concat([was]), function (ok) {
        if (!ok) { return; }
        openCats(kind);
        toast(w.hidden, 'Вернуть', function () { // возвращается на прежнее место в списке
          var now = listsOf(kind), back = now.off.filter(function (c) { return c[0] !== id; });
          if (back.length === now.off.length) { return; }
          now.on.splice(Math.min(idx, now.on.length), 0, was);
          saveLists(kind, now.on, back, function (ok2) { if (ok2) { refreshCats(); } });
        });
      });
    }, namesOf(l.on.concat(l.off), id));
  }
  // ---------- скрытые ----------
  function openHidden(kind) {
    var w = WORDS[kind];
    haptic();
    swapModal('list', false, function (m) {
      var box = el('div', 'pick');
      m.appendChild(box);
      (function fill() {
        var l = listsOf(kind), ul = el('ul', 'rows');
        clear(box);
        l.off.forEach(function (c) {
          var li = el('li', 'rows__li'), row = el('div', 'row row--off'), back = btn('row__back');
          back.appendChild(el('span', '', 'Вернуть'));
          back.setAttribute('data-cat', c[0]);
          back.setAttribute('aria-label', 'Вернуть: ' + c[1]);
          add(row, icon(c[2]), el('span', '', c[1]), back);
          back.addEventListener('click', function () {
            var now = listsOf(kind), rest = now.off.filter(function (x) { return x[0] !== c[0]; });
            if (rest.length === now.off.length) { return; }
            saveLists(kind, now.on.concat([c]), rest, function (ok) {
              if (!ok) { return; }
              haptic('ok');
              if (rest.length) { fill(); refit(); } else { openCats(kind, true); }
            });
          });
          li.appendChild(row);
          ul.appendChild(li);
        });
        add(box, el('h2', 'pick__title', w.off), el('p', 'pick__info', nb('Записи в них на месте. Возвращённая встанет в конец списка.')), ul);
      })();
    }, function () { openCats(kind); });
  }

  // ---------- перенос из заметок ----------
  var notes = null; // разобранный список, пока человек его проверяет: { items, skipped, more, back, added }. Живёт до «Добавить» или «Начать заново»: случайно закрытый лист продолжается с того же места
  function recs(n) { return n + F.NB + F.plural(n, 'запись', 'записи', 'записей'); } // число не отрывается от слова при переносе строки
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function listOf(kind) { return kind === 'i' ? F.SRCS : F.CATS; }
  function bynOf(it) { return F.toByn(it.a, it.u, F.RATES[it.u]); }
  function sumOf(items) { var s = 0; items.forEach(function (it) { s += bynOf(it); }); return s; }
  function ask(text, go) {
    if (inTg && tg.showConfirm) { try { tg.showConfirm(text, go); return; } catch (x) { /* спросим обычным окном */ } }
    go(window.confirm(text));
  }
  /** подобрать категории тем записям, у которых их ещё нет */
  function guessAll(items) {
    items.forEach(function (it) {
      if (it.cat !== undefined) { return; }
      var g = F.guessCat(it.n, it.k, listOf(it.k), st.all);
      it.cat = g.id;
      it.asked = !g.sure; // приложение не уверено: категорию выбирает человек
      it.guess = g.guess || [];
    });
  }
  function startNotes(parsed, back) {
    parsed.items.forEach(function (it, i) { it.i = i; });
    guessAll(parsed.items);
    notes = { items: parsed.items, skipped: parsed.skipped, more: parsed.more, back: back || null, added: [] };
    openReview();
  }

  /** экран вставки: примеры строк, кнопка читает скопированное сама, поле открывается второй кнопкой */
  function openNotes(back) {
    if (!st.loaded || st.error || firstRun()) { return; }
    if (notes) { notes.back = back || null; haptic(); openReview(); return; }
    haptic();
    swapModal('notes', true, function (m) {
      var box = el('div', 'pick pick--notes'), foot = el('footer', 'modal__dock modal__dock--two'), intro = el('div', 'notes__intro'), sample = el('ul', 'sample'), last = el('div', 'notes__last');
      var info = el('p', 'pick__info', nb('Скопируйте в заметках список трат и вставьте сюда. Приложение найдёт суммы и разложит записи по вашим категориям.'));
      info.id = 'notesInfo';
      [['10.10', 'дата для строк ниже'], ['магазин 62,5', 'трата'], ['60 бензин', 'сумма может стоять первой'], ['такси 14 руб', 'слова после суммы не мешают'],
        ['25 eur подписка', 'евро и доллары'], ['+1500 зарплата', 'плюс означает доход']].forEach(function (r) {
        var li = el('li');
        add(li, el('b', '', r[0]), el('span', '', nb(r[1])));
        sample.appendChild(li);
      });
      sample.setAttribute('aria-label', 'Примеры строк');
      add(intro, el('p', 'lbl lbl--gap', 'Приложение понимает такие строки'), sample, el('p', 'pick__info', nb('Без даты записи получат сегодняшнюю дату.')), last);
      var area = el('textarea', 'pick__area pick__area--notes');
      area.id = 'notesText';
      area.placeholder = 'Вставьте сюда список';
      area.setAttribute('aria-label', 'Список из заметок');
      area.setAttribute('autocapitalize', 'none');
      area.setAttribute('autocorrect', 'off');
      area.spellcheck = false;
      area.hidden = true;
      var go = btn('btn btn--off', 'Вставьте список');
      go.id = 'notesGo';
      go.hidden = true;
      var paste = btn('btn', 'Вставить скопированное'), manual = btn('btn btn--quiet', nb('Вставить в поле'));
      paste.id = 'notesPaste';
      manual.id = 'notesManual';
      var hint = '';
      function state() {
        var p = F.parseNotes(area.value), n = p.items.length, k = p.skipped.length, filled = !!area.value.replace(/\s/g, '');
        // над вставленным списком стоит итог разбора, а не подсказка, как вставлять
        info.textContent = nb(n ? (k ? (k === 1 ? 'Одна строка без суммы: её можно дописать на следующем шаге.' : 'Строк без суммы: ' + k + '. Их можно дописать на следующем шаге.') : 'Суммы нашлись во всех строках.')
          : filled ? 'В списке нет ни одной суммы. Нужны строки вида «магазин 62,5».' : hint);
        go.textContent = n ? 'Разобрать: ' + recs(n) : (filled ? 'Сумм не найдено' : 'Вставьте список');
        go.className = 'btn' + (n ? '' : ' btn--off');
        go.setAttribute('aria-disabled', String(!n));
        return p;
      }
      function showField(text, focus) {
        intro.hidden = true;
        foot.hidden = true;
        area.hidden = false;
        go.hidden = false;
        box.className = 'pick pick--notes is-field'; // поле тянется до кнопки, кнопка стоит у нижнего края листа или над клавиатурой
        if (text !== null) { area.value = text; }
        state();
        refit();
        if (focus) { area.focus(); }
      }
      var denied = nb('Телефон не дал прочитать скопированное. Вставьте список в поле ниже.');
      paste.addEventListener('click', function () {
        var p = null;
        try { p = navigator.clipboard && navigator.clipboard.readText ? navigator.clipboard.readText() : null; } catch (e) { p = null; }
        if (!p || !p.then) { hint = denied; showField(null, true); return; }
        p.then(function (raw) {
          var parsed = F.parseNotes(raw);
          if (parsed.items.length) { startNotes(parsed, back); return; }
          haptic('err');
          if (!String(raw || '').replace(/\s/g, '')) { info.textContent = nb('Скопированного текста нет. Откройте заметки, скопируйте список и нажмите кнопку ещё раз.'); return; }
          showField(raw, false);
        }, function () { hint = denied; showField(null, true); });
      });
      manual.addEventListener('click', function () {
        hint = 'Удерживайте палец в поле и выберите «Вставить».';
        showField(null, true);
      });
      area.addEventListener('input', function (ev) {
        var p = state();
        if (ev && ev.inputType === 'insertFromPaste' && p.items.length && typing()) { area.blur(); lastBlur = 0; } // список вставлен: клавиатура больше не нужна, под ней кнопку не видно
      });
      go.addEventListener('mousedown', function (ev) { ev.preventDefault(); }); // нажатие на кнопку не снимает фокус с поля: клавиатура не прячется, и кнопка не уезжает из-под пальца
      go.addEventListener('click', function () {
        var p = state();
        if (!p.items.length) { haptic('err'); return; }
        startNotes(p, back);
      });
      add(box, el('h2', 'pick__title', 'Перенос из заметок'), info, intro, area, go);
      add(foot, paste, manual);
      add(m, box, foot);
      store.lastImport(function (err, rec) { // прошлый перенос можно отменить и позже, не только из сообщения сразу после него
        if (err || !rec || !last.parentNode) { return; }
        var n = 0, undo = btn('link', 'Отменить последний перенос');
        Object.keys(rec.m).forEach(function (month) { n += rec.m[month].length; });
        undo.id = 'notesUndo';
        undo.addEventListener('click', function () { ask('Убрать ' + recs(n) + ' последнего переноса?', function (yes) { if (yes) { undoImport(rec); } }); });
        var when = el('p', 'pick__info pick__info--kept', recs(n) + ', ' + F.dayLabel(rec.at).toLowerCase());
        when.id = 'notesLast';
        add(last, undo, when);
        refit();
      });
    }, back);
  }
  function undoImport(rec) {
    var list = [];
    Object.keys(rec.m).forEach(function (month) { rec.m[month].forEach(function (id) { list.push({ id: id, m: month }); }); });
    store.removeOps(list, function (err, removed) {
      if (err) { haptic('err'); toast(explain(err)); return; }
      store.setLastImport(null, function () {
        haptic('ok');
        closeModal(0);
        reload(true, function () { toast('Перенос отменён, убрано: ' + recs(removed)); });
      });
    });
  }

  /** экран проверки: сколько записей и на какую сумму, строки без суммы, заметки без категории с двумя догадками, остальное одной строкой */
  function openReview() {
    var back = notes.back;
    swapModal('review', true, function (m) {
      var box = el('div', 'pick pick--review'), foot = el('footer', 'modal__dock modal__dock--bar'), go = btn('btn');
      go.id = 'notesAdd';
      go.addEventListener('click', addNotes);
      foot.appendChild(go);
      add(m, box, foot);
      notes.box = box;
      notes.go = go;
      paintReview();
    }, back);
  }
  /** спорные записи собраны по заметке: один выбор на все одинаковые. «Выбрать для каждой отдельно» разбирает группу (solo) */
  function askGroups(live) {
    var groups = [], byKey = {};
    live.forEach(function (it) {
      if (!it.asked) { return; }
      var key = it.k + '|' + it.n.toLowerCase() + (it.solo ? '|' + it.i : ''), g = byKey[key];
      if (!g) { g = byKey[key] = { items: [] }; groups.push(g); }
      g.items.push(it);
    });
    return groups;
  }
  /** подстрока группы: у одной записи день, у двух-трёх — их суммы (общей суммы в заметках человека нет), у большего числа — итог */
  function subOf(items) {
    if (items.length === 1) { return F.period(items[0].d, items[0].d) + (items[0].u === 'BYN' ? '' : ', ' + F.fmtShort(items[0].a) + F.NB + items[0].u); }
    if (items.length > 3) { return recs(items.length) + ' на' + F.NB + F.fmt(sumOf(items)); }
    var sums = items.map(function (it) { return F.fmt(bynOf(it)); });
    return recs(items.length) + ': ' + sums.slice(0, -1).join(', ') + ' и' + F.NB + sums[sums.length - 1];
  }
  function noteRow(it, name, sum, fn) { // строка как в «Истории»: значок и название категории, серым заметка
    var c = F.dict(it.k, it.cat), li = el('li'), b = btn('op'), text = el('span', '', c.name);
    rowNote(text, name);
    add(b, icon(c.icon), text, el('data', it.k === 'i' ? 'is-plus' : '', (it.k === 'i' ? '+' : '') + F.fmt(sum)), icon('right', 'share__go'));
    b.addEventListener('click', fn);
    li.appendChild(b);
    return li;
  }
  /** записи по дням в том порядке, в каком они шли в заметках */
  function daysList(parent, items, back) {
    var days = [], map = {};
    items.forEach(function (it) { if (!map[it.d]) { map[it.d] = []; days.push(it.d); } map[it.d].push(it); });
    days.sort().forEach(function (d) {
      var ul = el('ul', 'rows rows--ops');
      map[d].forEach(function (it) {
        var li = noteRow(it, it.n + (it.u === 'BYN' ? '' : (it.n ? ', ' : '') + F.fmtShort(it.a) + F.NB + it.u), bynOf(it), function () { openPick([it], back); });
        li.firstChild.setAttribute('data-i', String(it.i));
        ul.appendChild(li);
      });
      add(parent, el('p', 'lbl lbl--gap', F.period(d, d)), ul); // даты здесь числом, как в заметках; «Сегодня» и «Вчера» остаются «Истории»
    });
  }
  /** категории для спорной заметки: те, которыми человек пользуется чаще (по прежним записям и по этому же списку), потом по его порядку */
  function rankCats(kind, live) {
    var used = {}, list = listOf(kind);
    Object.keys(st.all).forEach(function (m) { st.all[m].forEach(function (op) { if (op.k === kind) { used[op.c] = (used[op.c] || 0) + 1; } }); });
    live.forEach(function (it) { if (it.k === kind && it.cat) { used[it.cat] = (used[it.cat] || 0) + 1; } });
    return list.map(function (c, n) { return { c: c, n: n }; }).sort(function (x, y) { return (used[y.c.id] || 0) - (used[x.c.id] || 0) || x.n - y.n; }).map(function (x) { return x.c; });
  }
  function paintReview() {
    var N = notes, box = N.box, top = box.scrollTop;
    var live = N.items.filter(function (it) { return !it.off; }), need = live.filter(function (it) { return !it.cat; });
    var earn = live.filter(function (it) { return it.k === 'i'; }), spend = live.filter(function (it) { return it.k !== 'i'; }), dates = live.map(function (it) { return it.d; }).sort();
    clear(box);
    var big = el('div', 'pick__big'), count = el('h2', '', recs(live.length)), total = el('data', '', spend.length || !earn.length ? F.fmt(sumOf(spend)) : '+' + F.fmt(sumOf(earn)));
    count.id = 'notesCount';
    total.id = 'notesSum';
    add(big, count, total);
    var text = live.length ? cap(F.period(dates[0], dates[dates.length - 1])) + '. ' : '';
    if (earn.length && spend.length) { text += 'Из них ' + F.plural(earn.length, 'доход', 'доходы', 'доходов') + ': ' + earn.length + ' на' + F.NB + F.fmt(sumOf(earn)) + '. '; }
    if (!live.length) { text += 'Переносить нечего.'; }
    else if (!need.length) { text += 'Категории подобраны, можно добавлять.'; }
    else if (need.length === live.length) { text += 'Приложение не разобрало ни одной записи: подскажите категории.'; }
    else { text += 'Категории подобраны, ' + recs(need.length) + ' приложение не разобрало.'; }
    if (N.more) { text += ' Взяты первые ' + F.NOTES_MAX + ' строк, остальные перенесите вторым заходом.'; }
    var info = el('p', 'pick__info', nb(text));
    info.id = 'reviewInfo';
    add(box, big, info);

    if (N.skipped.length) { // строки без суммы не пропадают молча: их видно сразу под итогом, сумму можно вписать
      var one = N.skipped.length === 1, menu = el('ul', 'menu menu--gap'), li = el('li'), row = btn('menu__row menu__row--two'), what = el('span', '', one ? nb('Не перенесётся: «' + N.skipped[0].raw + '»') : nb('Не перенесутся: ' + N.skipped.length + ' ' + F.plural(N.skipped.length, 'строка', 'строки', 'строк')));
      row.id = 'skipBtn';
      what.appendChild(el('small', '', nb(one ? 'в строке нет суммы' : 'в них нет суммы')));
      add(row, what, el('small', '', 'вписать'), icon('right'));
      row.addEventListener('click', function () { if (one) { openAmount(N.skipped[0], openReview); } else { openSkipped(); } });
      li.appendChild(row);
      menu.appendChild(li);
      box.appendChild(menu);
    }

    var groups = askGroups(live), open = groups.filter(function (g) { return !g.items[0].cat; }), chosen = groups.filter(function (g) { return !!g.items[0].cat; });
    var ranked = {};
    if (open.length) { box.appendChild(el('p', 'lbl lbl--gap', 'Нужна ваша подсказка')); }
    open.forEach(function (g) {
      var it = g.items[0], list = listOf(it.k), sec = el('section', 'ask'), topRow = el('p', 'ask__top'), tags = el('ul', 'tags');
      sec.setAttribute('data-note', it.n);
      add(topRow, el('b', '', it.n || 'Без подписи'), el('data', '', (it.k === 'i' ? '+' : '') + F.fmt(sumOf(g.items))));
      (ranked[it.k] || (ranked[it.k] = rankCats(it.k, live))).slice(0, list.length > 6 ? 5 : 6).forEach(function (c) {
        var id = c.id, gl = el('li', c.name.length > 11 ? 'tags__wide' : ''), gb = btn('');
        gb.setAttribute('data-cat', id);
        gb.appendChild(el('span', '', c.name));
        gb.addEventListener('click', function () { g.items.forEach(function (x) { x.cat = id; }); haptic(); paintReview(); });
        gl.appendChild(gb);
        tags.appendChild(gl);
      });
      var ml = el('li', 'tags__more'), mb = btn('');
      mb.appendChild(el('span', '', 'Ещё'));
      mb.setAttribute('aria-label', 'Остальные категории');
      mb.addEventListener('click', function () { openPick(g.items, openReview); });
      ml.appendChild(mb);
      tags.appendChild(ml);
      add(sec, topRow, el('small', '', subOf(g.items)), tags);
      box.appendChild(sec);
    });
    if (chosen.length) {
      var ul = el('ul', 'rows rows--ops');
      chosen.forEach(function (g) {
        var it = g.items[0], li2 = noteRow(it, (it.n || 'без подписи') + (g.items.length > 1 ? ', ' + recs(g.items.length) : ''), sumOf(g.items), function () { openPick(g.items, openReview); });
        li2.firstChild.setAttribute('data-note', it.n);
        ul.appendChild(li2);
      });
      add(box, el('p', 'lbl lbl--gap', 'Вы выбрали'), ul);
    }
    var sure = live.filter(function (it) { return !it.asked; });
    if (sure.length && groups.length) { // остальное одной строкой: открывает записи по дням, как в заметках
      var m2 = el('ul', 'menu menu--gap'), l2 = el('li'), r2 = btn('menu__row');
      r2.id = 'sortedBtn';
      add(r2, el('span', '', 'Разложено: ' + recs(sure.length)), el('small', '', F.fmt(sumOf(sure.filter(function (it) { return it.k !== 'i'; })))), icon('right')); // сумма трат: доходы в неё не входят, как и в итог вверху
      r2.addEventListener('click', openSorted);
      l2.appendChild(r2);
      m2.appendChild(l2);
      box.appendChild(m2);
    } else if (sure.length) { daysList(box, sure, openReview); } // спрашивать не о чем: список виден сразу
    var again = btn('link', 'Вставить другой список');
    again.id = 'notesReset';
    again.addEventListener('click', function () {
      ask('Вставить другой список? Этот список и выбранные категории сбросятся.', function (yes) { if (yes) { var b = N.back; notes = null; openNotes(b); } });
    });
    box.appendChild(again);

    var off = N.busy || !live.length || need.length > 0;
    N.go.textContent = N.busy ? 'Добавляем' : need.length ? nb('Ещё ' + recs(need.length) + ' без категории') : live.length ? 'Добавить ' + recs(live.length) : 'Нечего добавлять';
    N.go.className = 'btn' + (off ? ' btn--off' : '');
    N.go.setAttribute('aria-disabled', String(off));
    box.scrollTop = top;
  }
  function openSorted() {
    var sure = notes.items.filter(function (it) { return !it.off && !it.asked; });
    haptic();
    swapModal('sorted', true, function (m) {
      var box = el('div', 'pick pick--review');
      add(box, el('h2', 'pick__title', 'Разложено: ' + recs(sure.length)), el('p', 'pick__info', nb('Нажмите на запись, чтобы сменить категорию.')));
      daysList(box, sure, openSorted);
      m.appendChild(box);
    }, openReview);
  }
  /** выбор категории записи (или нескольких с одинаковой заметкой): все категории человека в его порядке, можно завести свою */
  function openPick(its, back) {
    var first = its[0], kind = first.k, list = listOf(kind), many = its.length > 1;
    haptic();
    swapModal('list', false, function (m) {
      var box = el('div', 'pick'), head = el('div', 'pick__big'), tags = el('ul', 'tags');
      add(head, el('h2', '', first.n || 'Без подписи'), el('data', '', (kind === 'i' ? '+' : '') + F.fmt(sumOf(its))));
      var info = el('p', 'pick__info', nb(many ? subOf(its) + '. Категория будет ' + (its.length === 2 ? 'у обеих.' : 'у всех.') : subOf(its) + '. Куда отнести эту запись?'));
      info.id = 'pickInfo';
      list.forEach(function (c) { // порядок как на листе добавления траты

        var li = el('li', c.name.length > 11 ? 'tags__wide' : ''), b = btn('');
        b.setAttribute('data-cat', c.id);
        b.setAttribute('aria-pressed', String(!!first.cat && its.every(function (x) { return x.cat === c.id; })));
        b.appendChild(el('span', '', c.name));
        b.addEventListener('click', function () { its.forEach(function (x) { x.cat = c.id; }); back(); });
        li.appendChild(b);
        tags.appendChild(li);
      });
      var ownLi = el('li', 'tags__add'), own = btn('');
      own.id = 'pickOwn';
      add(own, icon('plus'), el('span', '', kind === 'i' ? 'Свой' : 'Своя'));
      own.addEventListener('click', function () {
        var l = listsOf(kind), every = l.on.concat(l.off);
        if (every.length >= F.LIST_MAX) { haptic('err'); toast(WORDS[kind].full); return; }
        catSheet(kind, null, function () { openPick(its, back); }, function (name, ic, fail) {
          var id = F.catId(idsOf(every));
          l.on.push([id, name, ic]);
          saveLists(kind, l.on, l.off, function (ok) { if (!ok) { l.on.pop(); fail(); return; } its.forEach(function (x) { x.cat = id; }); back(); });
        }, null, namesOf(every));
      });
      ownLi.appendChild(own);
      tags.appendChild(ownLi);
      var links = el('div', 'links'), split = null, drop = btn('link', nb(many ? 'Не переносить эти записи' : 'Не переносить эту запись'));
      if (many) {
        split = btn('link', 'Выбрать для каждой отдельно');
        split.id = 'pickSplit';
        split.addEventListener('click', function () { its.forEach(function (x) { x.solo = true; }); back(); });
      }
      drop.id = 'pickDrop';
      drop.addEventListener('click', function () { its.forEach(function (x) { x.off = true; }); back(); });
      add(links, split, drop);
      add(box, head, info, tags, links, el('p', 'pick__info pick__info--kept', nb(many ? 'Они останутся в заметках, в приложение не попадут.' : 'Она останется в заметках, в приложение не попадёт.')));
      m.appendChild(box);
    }, back);
  }
  /** строки без суммы: список, из которого открывается ввод суммы */
  function openSkipped() {
    if (!notes.skipped.length) { openReview(); return; }
    haptic();
    swapModal('list', false, function (m) {
      var box = el('div', 'pick'), ul = el('ul', 'rows');
      notes.skipped.forEach(function (s) {
        var li = el('li', 'rows__li'), row = el('div', 'row row--off row--plain'), go = btn('row__back');
        go.appendChild(el('span', '', 'Вписать'));
        go.setAttribute('aria-label', 'Вписать сумму: ' + s.raw);
        go.addEventListener('click', function () { openAmount(s, openSkipped); });
        add(row, el('span', '', s.raw), go);
        li.appendChild(row);
        ul.appendChild(li);
      });
      add(box, el('h2', 'pick__title', 'Строки без суммы'), el('p', 'pick__info', nb('В приложение они не попадут. Впишите сумму, и строка встанет в список.')), ul);
      m.appendChild(box);
    }, openReview);
  }
  function openAmount(skip, back) {
    var field = null;
    haptic();
    swapModal('list', false, function (m) {
      var box = el('div', 'pick pick--cat'), foot = el('footer', 'modal__dock'), go = btn('btn', 'Добавить в список');
      var info = el('p', 'pick__info', nb(cap(F.period(skip.d, skip.d)) + '. В строке нет суммы: впишите её, и запись встанет в список.'));
      info.id = 'skipInfo';
      field = el('input', 'field');
      field.id = 'skipSum';
      field.type = 'text';
      field.maxLength = 12;
      field.placeholder = 'например, 12,50';
      field.setAttribute('inputmode', 'decimal');
      field.setAttribute('enterkeyhint', 'done');
      field.setAttribute('autocomplete', 'off');
      field.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { field.blur(); } });
      var lbl = el('label', 'lbl', 'Сумма, BYN');
      lbl.setAttribute('for', 'skipSum');
      go.id = 'skipSave';
      go.addEventListener('click', function () {
        var a = F.parseAmount(field.value);
        if (!a) { info.textContent = 'Введите сумму цифрами, например 12,50.'; haptic('err'); return; }
        var it = { d: skip.d, k: 'e', a: a, u: 'BYN', n: skip.raw, i: notes.items.length };
        notes.items.push(it);
        guessAll([it]);
        notes.skipped.splice(notes.skipped.indexOf(skip), 1);
        back();
      });
      add(box, el('h2', 'pick__title', skip.raw), info, lbl, field);
      foot.appendChild(go);
      add(m, box, foot);
    }, back);
    if (field) { field.focus(); }
  }
  /** «Добавить»: одна пачка, запись по кускам месяцев. При сбое на середине лист остаётся: повтор допишет остальное, дублей не будет */
  function addNotes() {
    var N = notes;
    if (!N || N.busy) { return; }
    var live = N.items.filter(function (it) { return !it.off; }), seen = {};
    if (!live.length || live.some(function (it) { return !it.cat; })) { haptic('err'); return; }
    var ops = live.map(function (it) {
      var key = [it.d, it.k, it.a, it.u, it.n.toLowerCase()].join('|');
      seen[key] = (seen[key] || 0) + 1;
      return F.makeOp(it.k, it.cat, it.a, it.u, it.d, F.noteId(key, seen[key] - 1), it.n);
    });
    N.busy = true;
    paintReview();
    store.addOps(ops, function (err, added) {
      N.busy = false;
      N.added = N.added.concat(added || []);
      if (err) {
        paintReview();
        haptic('err');
        toast(N.added.length ? 'Сохранилось не всё: ' + N.added.length + ' из ' + ops.length + '.\nНажмите «Добавить» ещё раз, дубли не появятся' : explain(err));
        return;
      }
      var done = N.added, months = ops.map(function (op) { return F.monthOf(op.d); }).sort();
      notes = null;
      haptic('ok');
      if (!done.length) { closeModal(0); reload(false, function () { toast('Все эти записи уже перенесены'); }); return; }
      var rec = { at: F.today(), m: {} };
      done.forEach(function (x) { (rec.m[x.m] = rec.m[x.m] || []).push(x.id); });
      store.setLastImport(rec, function () {
        if (months.indexOf(st.month) < 0) { st.month = months[months.length - 1]; } // записи не этого месяца: открываем самый свежий из перенесённых
        closeModal(0);
        reload(true, function () {
          var tail = done.length < ops.length ? 'остальные уже были перенесены' : F.monthsSpan(months[0], months[months.length - 1]);
          toast('Добавлено: ' + recs(done.length) + (tail ? '\n' + tail : ''), 'Отменить', function () { undoImport(rec); }, 20000);
        });
      });
    });
  }

  // ---------- копия данных ----------
  function refit() { if (ui.open) { ui.h = modal.offsetHeight; } }
  function copyText(area, text) { // копирование прямо в ответ на касание: иначе iPhone его не разрешает
    var ok = false;
    area.focus();
    area.select();
    try { area.setSelectionRange(0, text.length); } catch (e) { /* выделено обычным способом */ }
    try { ok = document.execCommand('copy'); } catch (e2) { ok = false; }
    try { if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(text).then(function () {}, function () {}); ok = true; } } catch (e3) { /* осталось выделение */ }
    area.blur();
    lastBlur = 0; // фокус сняла сама программа, а не касание мимо поля
    return ok;
  }
  function openBackup(back) {
    haptic();
    swapModal('list', false, function (m) {
      var box = el('div', 'pick');
      m.appendChild(box);
      backupMenu(box);
    }, back);
  }
  function backupMenu(box) {
    clear(box);
    var out = btn('btn', 'Сделать копию');
    out.id = 'exportBtn';
    var inp = btn('btn btn--quiet', 'Восстановить из копии');
    inp.id = 'importBtn';
    out.addEventListener('click', function () {
      store.exportAll(function (err, res) { if (err) { toast(explain(err)); } else { backupExport(box, res); } });
    });
    inp.addEventListener('click', function () { backupImport(box); });
    var tbl = btn('btn btn--quiet', 'Таблица для Excel');
    tbl.id = 'tableBtn';
    tbl.addEventListener('click', function () { backupTable(box); });
    add(box, el('h2', '', 'Копия данных'),
      el('p', 'pick__info', 'Записи хранятся в облаке Telegram и привязаны к этому боту. Копия — текст со всеми записями: его можно сохранить в «Избранное» или в заметки.'),
      out, inp, tbl,
      el('p', 'pick__ver', 'Версия ' + VERSION + ', ' + (store.kind === 'cloud' ? 'записи в облаке Telegram' : 'записи в этом браузере')));
    refit();
  }
  /** экран «скопировать»: сырой текст на экране ни к чему, поле появляется, только если копирование не удалось */
  function copyScreen(box, title, lead, text, label, after, extra) {
    clear(box);
    var info = el('p', 'pick__info', lead);
    info.id = 'backupInfo';
    var area = el('textarea', 'pick__area pick__area--ghost');
    area.id = 'backupText';
    area.readOnly = true;
    area.wrap = 'off';
    area.value = text;
    area.setAttribute('aria-label', title);
    var copy = btn('btn', label);
    copy.id = 'copyBtn';
    copy.addEventListener('click', function () {
      var ok = copyText(area, text);
      haptic(ok ? 'ok' : 'err');
      if (ok) { info.textContent = 'Скопировано. ' + after; }
      else { area.className = 'pick__area pick__area--table'; info.textContent = 'Не получилось скопировать. Выделите текст в поле и скопируйте его сами.'; }
      refit();
    });
    var done = btn('btn btn--quiet', 'Готово');
    done.addEventListener('click', function () { closeModal(0); });
    add(box, el('h2', '', title), info, area, copy, extra || null, done);
    refit();
  }
  function backupExport(box, res) {
    var words = res.count + ' ' + F.plural(res.count, 'запись', 'записи', 'записей');
    copyScreen(box, 'Копия данных', words + '. Скопируйте текст и сохраните его в «Избранном» или в заметках.', res.text, 'Скопировать текст', 'Вставьте текст в «Избранное» или в заметки.', null);
  }
  function backupTable(box) {
    var text = F.table(st.all, '\t'), count = text.split('\r\n').length - 1;
    var words = count + ' ' + F.plural(count, 'запись', 'записи', 'записей');
    var file = null;
    if (!inTg || /^(tdesktop|macos|web|weba|webk)$/.test(tg.platform)) { // на телефоне внутри Telegram файл не скачать, там работает только буфер
      file = btn('btn btn--quiet', 'Скачать файл для Excel');
      file.id = 'fileBtn';
      file.addEventListener('click', function () {
        try {
          var blob = new Blob(['\uFEFF' + F.table(st.all, ';')], { type: 'text/csv;charset=utf-8' }), a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = 'finansy-' + F.today() + '.csv';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
        } catch (e) { toast('Не получилось сохранить файл. Скопируйте таблицу кнопкой выше.'); }
      });
    }
    copyScreen(box, 'Таблица для Excel', words + '. Вставьте в Excel или Google Таблицы: записи встанут по столбцам.', text, 'Скопировать таблицу', 'Откройте Excel или Google Таблицы и вставьте.', file);
  }
  function backupImport(box) {
    clear(box);
    var text = '';
    var info = el('p', 'pick__info', 'Скопируйте текст копии, затем нажмите «Вставить скопированное». Существующие записи не изменятся, добавятся только недостающие.');
    info.id = 'backupInfo';
    var area = el('textarea', 'pick__area');
    area.id = 'backupText';
    area.placeholder = 'Вставьте сюда текст копии';
    area.setAttribute('aria-label', 'Текст копии');
    area.setAttribute('autocapitalize', 'none');
    area.setAttribute('autocorrect', 'off');
    area.spellcheck = false;
    area.hidden = true;
    var paste = btn('btn', 'Вставить скопированное');
    paste.id = 'pasteBtn';
    var manual = btn('btn btn--quiet', 'Вставить в поле');
    manual.id = 'manualBtn';
    var go = btn('btn', '');
    go.id = 'restoreBtn';
    go.hidden = true;
    var busy = false;

    function accept(raw, fromField) {
      var parsed = F.parseBackup(raw);
      if (parsed) {
        text = raw;
        info.textContent = 'В копии ' + parsed.count + ' ' + F.plural(parsed.count, 'запись', 'записи', 'записей') + '. Нажмите кнопку ниже.';
        go.textContent = 'Восстановить ' + parsed.count + ' ' + F.plural(parsed.count, 'запись', 'записи', 'записей');
        go.hidden = false;
        paste.hidden = true;
        manual.hidden = true;
        if (typing()) { document.activeElement.blur(); lastBlur = 0; } // убрать клавиатуру: под ней кнопку не видно
        haptic('ok');
      } else {
        text = '';
        go.hidden = true;
        var empty = !String(raw || '').replace(/\s/g, '');
        if (!(fromField && empty)) { info.textContent = empty ? 'В буфере пусто. Скопируйте текст копии целиком и нажмите ещё раз.' : 'Это не похоже на копию записей. Скопируйте текст целиком: от первой фигурной скобки до последней.'; }
        if (!fromField) { showField(false); }
      }
      refit();
    }
    function showField(focus) {
      area.hidden = false;
      manual.hidden = true;
      refit();
      if (focus) { area.focus(); }
    }
    paste.addEventListener('click', function () {
      var p = null;
      try { p = navigator.clipboard && navigator.clipboard.readText ? navigator.clipboard.readText() : null; } catch (e) { p = null; }
      if (!p || !p.then) { info.textContent = 'Телефон не дал прочитать буфер. Вставьте текст в поле: удерживайте в нём палец и выберите «Вставить».'; showField(true); return; }
      p.then(function (raw) { accept(raw, false); }, function () {
        info.textContent = 'Телефон не дал прочитать буфер. Вставьте текст в поле: удерживайте в нём палец и выберите «Вставить».';
        showField(true);
      });
    });
    manual.addEventListener('click', function () {
      info.textContent = 'Вставьте текст в поле: удерживайте в нём палец и выберите «Вставить».';
      showField(true);
    });
    area.addEventListener('input', function () { accept(area.value, true); });
    go.addEventListener('click', function () {
      if (busy || !text) { return; }
      busy = true;
      go.textContent = 'Восстанавливаем';
      go.className = 'btn btn--off';
      store.importAll(text, function (err, added) {
        if (err) {
          busy = false;
          go.className = 'btn';
          go.textContent = 'Повторить';
          info.textContent = err === 'format' ? 'Это не похоже на копию записей.' : explain(err);
          haptic('err');
          return;
        }
        haptic('ok');
        closeModal(0);
        reload(true, function () { toast(added ? 'Добавлено записей: ' + added : 'Все записи из копии уже на месте'); });
      });
    });
    add(box, el('h2', '', 'Восстановить из копии'), info, area, paste, manual, go);
    refit();
  }

  // ---------- запуск ----------
  function fail(title, text) {
    clear(root);
    var box = el('div', 'fail');
    add(box, el('h2', '', title), el('p', '', text));
    root.appendChild(box);
  }

  function boot() {
    tgTry(function () { tg.ready(); });
    tgTry(function () { tg.expand(); });
    if (bridgeOnly) { fail('Не загрузился Telegram', 'Закройте окно и откройте его ещё раз. Записи в безопасности: без связи с Telegram приложение ничего не меняет.'); return; }
    if (inTg && !(tg.isVersionAtLeast && tg.isVersionAtLeast('6.9') && tg.CloudStorage)) { fail('Нужно обновить Telegram', 'Эта версия Telegram не умеет хранить записи приложения. Обновите Telegram и откройте учёт снова.'); return; }
    applyTheme(false); // до первой отрисовки: без вспышки светлого
    applySize();
    tgTry(function () { tg.onEvent('themeChanged', function () { if (themePref() === 'auto') { applyTheme(true); } }); });
    if (window.matchMedia) { try { window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () { if (!inTg && themePref() === 'auto') { applyTheme(true); } }); } catch (e) { /* старый браузер */ } }
    tgTry(function () { if (tg.disableVerticalSwipes) { tg.disableVerticalSwipes(); } }); // иначе жест «вниз» сворачивает всё приложение вместо листа
    tgTry(function () { tg.BackButton.onClick(goBack); });
    tgTry(function () { // пункт «Настройки» в меню Telegram открывает тот же лист, что и шестерёнка
      if (!tg.SettingsButton) { return; }
      tg.SettingsButton.onClick(function () { if (!ui.open) { openSettings(); } });
      tg.SettingsButton.show();
    });
    tgTry(function () { tg.onEvent('viewportChanged', fit); });
    homeCheck();

    store = S.create(inTg ? S.cloudAdapter(tg.CloudStorage) : S.localAdapter('fin_'));

    clear(root);
    add(stage, view, dock);
    add(root, stage, scrim, modal, toastEl);
    scrim.addEventListener('click', function () {
      if (typing()) { document.activeElement.blur(); return; } // первое касание мимо поля только убирает клавиатуру, лист не закрывает
      if (Date.now() - lastBlur < 700) { return; } // телефон снимает фокус с поля раньше, чем сообщает о касании: это то же самое касание
      if (!entry || !entry.busy) { closeModal(0); }
    });
    document.addEventListener('focusout', function (e) {
      var f = e.target;
      if (f && /^(INPUT|TEXTAREA)$/.test(f.tagName) && f.type !== 'date') { lastBlur = Date.now(); }
    }, true);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', fit);
      window.visualViewport.addEventListener('scroll', fit);
    }
    window.addEventListener('resize', function () { applySize(); fit(); }); // поворот телефона: шаг крупного текста считается заново
    // пока печатают, пояснение в листе цели прячется: место нужно полям и кнопке
    document.addEventListener('focusin', function () { root.className = typing() ? 'is-typing' : ''; setTimeout(fit, 60); });
    document.addEventListener('focusout', function () { setTimeout(function () { root.className = typing() ? 'is-typing' : ''; fit(); }, 60); });
    document.addEventListener('visibilitychange', function () { if (!document.hidden && !ui.open && st.loaded) { reload(false); } }); // записи мог добавить второй телефон
    fit();
    paintDock();
    view.appendChild(el('p', 'boot', 'Открываем записи'));
    reload(true, startShare); // открыли по ссылке с настройкой — после загрузки сразу лист «Вставить настройку»
  }

  window.addEventListener('error', function (e) { // белого экрана без объяснения быть не должно
    if (!(e && e.filename) || String(e.message || '') === 'Script error.') { return; }
    if (!st.loaded) { fail('Не получилось открыть учёт', 'Закройте окно и откройте его ещё раз. Для разработчика: ' + String(e.message || '').replace(/[<>&]/g, '').slice(0, 120)); }
  });

  window.FINAPP = { state: st, reload: reload, version: VERSION, back: goBack, setKeyboard: function (px, mode) { sim = px ? { px: px, mode: mode || 'overlay' } : null; fit(); } };
  boot();
})();
