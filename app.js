/* Учёт финансов: экраны. Главная («Месяц»), «История», «Цели», лист добавления, первый запуск, настройки (свои категории, перенос из заметок, копия данных).
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
  var VERSION = '4ced52667a'; // при выкладке сюда подставляется версия файлов: по ней видно, не показывает ли Telegram старую страницу

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
    s.innerHTML = ICONS[name] || ICONS.dots;
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
    tab: 'month', more: false, shown: 0, loaded: false, error: ''
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
    if (!typing()) { root.style.setProperty('--full', (h - 10) + 'px'); }
    var kb = Math.max(0, Math.round(root.getBoundingClientRect().top + h - visible));
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
    if (ar.bottom > bottom - 12 || ar.top < pr.top + 4) { pick.scrollTop += ar.top - pr.top - Math.max(8, (bottom - pr.top - ar.height) / 3); }
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
  function paintDock() {
    clear(dock);
    var tabs = el('nav', 'tabs tabs--3');
    tabs.setAttribute('aria-label', 'Разделы');
    [['month', 'Месяц'], ['history', 'История'], ['goals', 'Цели']].forEach(function (t) {
      var b = btn('', t[1]);
      b.setAttribute('data-tab', t[0]);
      if (st.tab === t[0]) { b.setAttribute('aria-current', 'page'); }
      b.addEventListener('click', function () {
        if (st.tab === t[0]) { return; }
        st.tab = t[0];
        haptic();
        paintDock();
        paint(true);
      });
      tabs.appendChild(b);
    });
    var a = btn('btn btn--plus'); // при трёх вкладках подпись «Добавить» не помещается: остаётся круглый плюс
    a.id = 'addBtn';
    a.setAttribute('aria-label', 'Добавить');
    a.appendChild(icon('plus'));
    a.addEventListener('click', function () {
      if (st.tab !== 'goals') { openEntry(null); return; }
      // на вкладке «Цели» плюс сразу откладывает; целей нет — заводит первую
      if (!F.GOALS.length) { openGoalEdit(null, null, null); } else { openEntry(null, { kind: 's', cat: F.GOALS.length === 1 ? 'g_' + F.GOALS[0].id : '' }); }
    });
    add(dock, tabs, a);
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

  /** размер крупной суммы по числу цифр до запятой: до четырёх — 68 px, пять — 52, шесть и больше — 44 */
  function sumClass(minor) {
    var n = String(Math.floor(Math.abs(minor) / 100)).length;
    return 'spent__sum' + (n >= 6 ? ' is-s' : n === 5 ? ' is-m' : '');
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
    var dict = F.dict(op.k, op.c), b = btn('op' + (bare ? ' op--bare' : '')), goal = F.isGoalOp(op);
    b.setAttribute('data-id', op.id);
    // запись цели: «Отложено» или «Снято», название цели серым; в «Потрачено» и в доходы она не входит
    var name = el('span', '', bare ? F.dayLabel(op.d) : goal ? (op.k === 'e' ? 'Отложено' : 'Снято') : dict.name);
    rowNote(name, [goal && !bare ? dict.name : '', op.u !== 'BYN' ? F.fmtShort(op.a) + F.NB + op.u : '', op.n || ''].filter(Boolean).join(', ')); // сумма в валюте первой: длинную заметку строка обрежет, а её нет
    add(b, bare ? null : icon(dict.icon), name, el('data', op.k === 'i' ? 'is-plus' : '', (op.k === 'i' ? '+' : '') + F.fmt(F.bynOf(op))), icon('right', 'share__go'));
    b.addEventListener('click', function () { openEntry(op); });
    return b;
  }
  /** строка категории или источника: нажатие открывает её записи */
  function shareRow(kind, c, share, n) {
    var li = el('li'), b = btn('share');
    b.setAttribute('data-cat', c.id);
    var name = el('span', '', c.name);
    rowNote(name, c.note);
    add(b, icon(c.icon), name, el('data', '', F.fmt(c.sum)), icon('right', 'share__go'));
    if (share !== null) {
      var track = el('i'), f = el('b');
      f.style.transform = 'scaleX(' + share.toFixed(4) + ')';
      f.style.opacity = String([1, 0.76, 0.56][n] || 0.45);
      track.appendChild(f);
      b.appendChild(track);
    }
    b.addEventListener('click', function () { openCategory(kind, c.id); });
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
    var back = Math.max(0, s.taken - s.saved), put = Math.max(0, s.saved - s.taken);
    var avail = s.income + st.carry + back, left = avail - s.spent - put; // доступно в этом месяце: доход, остаток с прошлых и снятое из накоплений
    var base = Math.max(avail, s.spent + put, 1);
    var bar = el('div', 'spent__bar');
    bar.setAttribute('role', 'img');
    bar.setAttribute('aria-label', avail > 0 ? 'Потрачено ' + Math.round(s.spent / avail * 100) + ' процентов доступного' : 'Доход ещё не внесён');
    var segs = [];
    if (s.cats.length <= 3) { segs = s.cats.map(function (c) { return c.sum; }); }
    else { segs = [s.cats[0].sum, s.cats[1].sum, s.spent - s.cats[0].sum - s.cats[1].sum]; }
    var fill = el('div', 'spent__fill');
    segs.forEach(function (v) { var i = el('i'); i.style.width = (v / base * 100).toFixed(2) + '%'; fill.appendChild(i); });
    bar.appendChild(fill);
    if (put > 0) { // траты растут слева, отложенное отнимает доступное справа контурным отрезком: «осталось» — промежуток между ними
      var sv = el('i', 'spent__saved');
      sv.style.width = Math.max(3, put / base * 100).toFixed(2) + '%';
      bar.className = 'spent__bar spent__bar--saved';
      bar.appendChild(sv);
    }
    var legend = el('div', 'spent__legend');
    if (!s.income && !st.carry && !back) { add(legend, el('span', '', s.spent || put ? 'доход ещё не внесён' : 'записей в этом месяце нет')); }
    else {
      add(legend, el('span', '', avail > 0 ? 'из' + F.NB + F.fmt(avail) : (s.income ? 'из' + F.NB + F.fmt(s.income) : 'доход ещё не внесён')));
      add(legend, left < 0 ? el('span', 'is-over', 'перерасход ' + F.fmt(-left)) : el('span', 'is-left', 'осталось ' + F.fmt(left)));
    }
    add(spent, bar, legend);
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
      cats.appendChild(el('p', 'empty', 'Трат пока нет. Нажмите «Добавить», чтобы внести первую.'));
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

    if (animate && !reduce) {
      tweenSum(node, was, s.spent);
      fill.className = 'spent__fill is-in';
      sheet.className = 'sheet is-in';
    } else { setSum(node, s.spent); }
  }

  // ---------- история ----------
  function paintHistory() {
    clear(view);
    var head = monthBar();
    var sheet = el('div', 'sheet sheet--full');
    var days = F.byDays(st.ops);
    if (!days.length) { sheet.appendChild(el('p', 'empty', 'В этом месяце записей нет.')); }
    else { sheet.appendChild(el('p', 'hint', 'Нажмите на запись, чтобы изменить или удалить её.')); }
    days.forEach(function (day) {
      var sec = el('section', 'day');
      sec.appendChild(el('h2', '', F.dayLabel(day.date)));
      var list = el('ul', 'ops');
      day.ops.forEach(function (op) { var li = el('li'); li.appendChild(opRow(op, false)); list.appendChild(li); });
      sec.appendChild(list);
      sheet.appendChild(sec);
    });
    add(view, head, sheet);
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
    haptic();
    openModal('list', false, function (m) {
      var box = el('div', 'pick');
      var head = el('div', 'pick__big');
      var total = el('data', '', F.fmt(sum));
      total.id = 'catSum';
      add(head, el('h2', '', dict.name), total);
      var info = el('p', 'pick__info', text);
      info.id = 'catInfo';
      var ul = el('ul', 'ops');
      ops.forEach(function (op) { var li = el('li'); li.appendChild(opRow(op, true)); ul.appendChild(li); });
      add(box, head, info, ul);
      m.appendChild(box);
    });
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
  function paintGoals() {
    var goals = F.GOALS, now = F.monthOf(F.today()), head = el('div', 'bar'), title = el('h1', 'month', 'Цели');
    title.id = 'goalsTitle';
    add(head, title, gearBtn());
    clear(view);
    if (!goals.length) {
      var empty = el('div', 'sheet sheet--top');
      add(empty, el('p', 'empty', nb('Целей пока нет. Заведите первую: подушку, отпуск, технику. Приложение покажет, сколько накоплено и сколько ещё нужно.')), newGoalBtn(null));
      add(view, head, empty);
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
    add(view, head, hero, sheet);
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

  function paint(animate) {
    var first = firstRun();
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
    if (st.tab === 'history') { paintHistory(); } else if (st.tab === 'goals') { paintGoals(); } else { paintMonth(animate); }
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
      startY = e.clientY;
      startAt = ui.y;
      track = [{ y: e.clientY, t: e.timeStamp }];
    });
    grab.addEventListener('pointermove', function (e) {
      if (e.pointerId !== id) { return; }
      var y = startAt + (e.clientY - startY);
      if (y < 0) { y = y * 0.15; } // вверх лист упирается мягко, а не встаёт стеной
      setY(y);
      track.push({ y: e.clientY, t: e.timeStamp });
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
  /** preset — с чего открыть новый лист: { kind: 's' отложить | 't' снять, cat, digits, cur, date, note } */
  function openEntry(op, preset) {
    if (!st.loaded || st.error) { return; }
    var pre = preset || {}, goalOp = !!op && F.isGoalOp(op);
    entry = {
      edit: op || null,
      kind: op ? (goalOp ? (op.k === 'e' ? 's' : 't') : op.k) : pre.kind || 'e', // 'e' трата, 'i' доход, 's' отложить на цель, 't' снять с цели
      digits: op ? F.fmt(op.a).replace(/\s/g, '').replace(/,00$/, '').replace(/(,\d)0$/, '$1') : pre.digits || '',
      cur: op ? op.u : pre.cur || 'BYN',
      cat: op ? op.c : pre.cat || '',
      date: op ? op.d : pre.date || F.today(),
      note: op && op.n ? op.n : pre.note || '',
      busy: false
    };
    haptic();
    openModal('entry', true, function (m) {
      var screen = el('div', 'screen');

      // вид записи: у новой — «Трата / Доход / Отложить»; «Снять» и правка записи цели — отдельный режим с заголовком вместо переключателя
      var mode = entry.kind === 't' ? (op ? 'Снято из накоплений' : 'Снять из накоплений') : goalOp ? 'Отложено на цель' : '';
      var seg = mode ? el('p', 'entry__mode', nb(mode)) : el('div', 'seg');
      if (mode) { seg.id = 'entryMode'; } else { seg.setAttribute('role', 'group'); seg.setAttribute('aria-label', 'Что добавляем'); }
      entry.segBtns = (mode ? [] : [['e', 'Трата'], ['i', 'Доход']].concat(op ? [] : [['s', 'Отложить']])).map(function (k) {
        var b = btn('', k[1]);
        b.setAttribute('data-kind', k[0]);
        b.addEventListener('click', function () {
          if (!entry || entry.kind === k[0]) { return; }
          entry.kind = k[0];
          entry.cat = '';
          entry.page = 0;
          haptic();
          paintChips();
          paintEntry();
        });
        seg.appendChild(b);
        return b;
      });

      var strip = el('div', 'strip');
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
      add(strip, entry.noteInput, dateWrap);

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
          if (next !== entry.digits) { entry.digits = next; haptic(); paintEntry(); }
        });
        keys.appendChild(b);
      });
      add(screen, seg, strip, box, entry.chips, keys);

      var foot = el('footer', 'modal__dock');
      entry.go = btn('btn');
      entry.go.id = 'goBtn';
      entry.go.addEventListener('click', submitEntry);
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
    var goalKind = entry.kind === 's' || entry.kind === 't';
    var list = entry.kind === 'e' ? F.CATS : entry.kind === 'i' ? F.SRCS : F.GOALS.map(function (g) { return { id: 'g_' + g.id, name: g.name, wide: false, full: g.name.length > 13 }; }), cols = entry.kind === 'e' ? 3 : 2; // длинное название цели занимает весь ряд
    if (entry.kind === 's' && !entry.edit) { list = list.concat([{ id: '+', name: 'Новая цель', fresh: true }]); } // снять можно только из цели, которая уже есть
    var pages = chipPages(list, cols);
    if (entry.page === undefined) { // при правке открыть страницу, на которой стоит категория записи
      entry.page = 0;
      pages.forEach(function (pg, n) { if (F.find(pg, entry.cat)) { entry.page = n; } });
    }
    if (entry.page >= pages.length) { entry.page = 0; }
    clear(entry.chips);
    entry.chips.className = 'chips' + (cols === 2 ? ' chips--two' : '');
    entry.chips.setAttribute('aria-label', goalKind ? 'Цель' : entry.kind === 'e' ? 'Категория' : 'Источник');
    entry.chipBtns = pages[entry.page].map(function (c) {
      if (c.fresh) { // «Новая цель» прямо с листа: набранная сумма не теряется
        var nl = el('li', 'chips__new'), nbn = btn('');
        nbn.id = 'chipNewGoal';
        add(nbn, icon('plus'), document.createTextNode(c.name));
        nbn.addEventListener('click', function () {
          if (!entry || entry.busy) { return; }
          if (F.GOALS.length >= F.GOALS_MAX) { haptic('err'); toast('Целей уже двенадцать. Удалите ту, что закрыта.'); return; }
          var keep = { kind: 's', digits: entry.digits, cur: entry.cur, date: entry.date, note: entry.note };
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

    var often = (!e.edit && !e.digits && !e.busy && window.innerHeight >= 640) ? F.frequent(st.all, e.kind, 9) : []; // на низком экране кнопкам нет места
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
    e.hint2.hidden = true;
    e.over = '';
    if (e.kind === 's' || e.kind === 't') { goalHints(e, minor, byn); }
    else if (e.cur !== 'BYN') {
      e.hint.textContent = minor ? 'это ' + F.fmt(byn) + F.NB + 'BYN по' + F.NB + 'курсу ' + F.fmtRate(F.RATES[e.cur]) : 'курс ' + F.fmtRate(F.RATES[e.cur]) + F.NB + 'BYN за' + F.NB + '1' + F.NB + e.cur;
    } else if (!e.edit && F.monthOf(e.date) === st.month) { // сколько останется после этой записи
      var s = st.sum, text, val, left = s.left + st.carry + (minor ? (e.kind === 'e' ? -byn : byn) : 0);
      if (!s.income && !st.carry && e.kind === 'e') { text = minor ? 'Будет потрачено' : 'Потрачено'; val = s.spent + (minor ? byn : 0); }
      else if (left < 0) { text = 'Перерасход'; val = -left; }
      else { text = minor ? (e.kind === 'e' ? 'Останется' : 'Станет') : 'Осталось'; val = left; }
      add(e.hint, document.createTextNode(text + ' '), el('b', '', F.fmt(val)));
    }

    var label, off = true;
    if (e.busy) { label = 'Сохраняем'; }
    else if (!minor) { label = 'Введите сумму'; }
    else if (!e.cat) { label = e.kind === 'e' ? 'Выберите категорию' : e.kind === 'i' ? 'Выберите источник' : 'Выберите цель'; }
    else if (e.over) { label = e.over; } // снять больше, чем есть в цели, нельзя: кнопка называет, сколько там
    else {
      var money = e.cur === 'BYN' ? F.fmt(minor) : F.fmtShort(minor) + F.NB + e.cur;
      label = e.edit ? 'Сохранить' : e.kind === 'e' ? 'Добавить трату' : e.kind === 'i' ? 'Добавить доход' : (e.kind === 's' ? 'Отложить ' : 'Снять ') + money;
      off = false;
    }
    e.go.textContent = label;
    e.go.className = 'btn' + (off ? ' btn--off' : '');
    e.go.setAttribute('aria-disabled', String(off));
    if (e.del) { e.del.setAttribute('aria-disabled', String(!!e.busy)); }
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
    if (minor && !e.edit && F.monthOf(e.date) === st.month && window.innerHeight >= 640) { // на низком экране второй строке нет места: остаётся главное, что станет с целью
      var s = st.sum, left = s.left + st.carry + (take ? byn : -byn);
      add(e.hint2, document.createTextNode(nb(left < 0 ? 'Перерасход месяца ' : 'На траты ' + F.inMonth(st.month) + (take ? ' станет ' : ' останется '))), el('b', '', F.fmt(Math.abs(left))));
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
  function submitEntry() {
    var e = entry;
    if (!e || e.busy) { return; }
    var minor = F.parseTyped(e.digits);
    if (!minor || !e.cat || e.over) { haptic('err'); return; }
    var op = F.makeOp(e.kind === 'i' || e.kind === 't' ? 'i' : 'e', e.cat, minor, e.cur, e.date, e.edit ? e.edit.id : null, e.note); // отложенное хранится как трата с категорией цели, снятое — как доход
    if (e.edit && e.edit.u === e.cur && e.edit.r) { op.r = e.edit.r; } // правка не меняет курс, по которому запись была внесена
    e.busy = true;
    paintEntry();
    if (e.edit) { store.update(op, F.monthOf(e.edit.d), function (err) { afterWrite(err, op.d); }); return; }
    addOp(op);
  }
  function addOp(op) {
    store.add(op, function (err) {
      afterWrite(err, op.d, function () { // случайную запись можно убрать сразу, не заходя в «Историю»
        toast(F.isGoalOp(op) ? (op.k === 'e' ? 'Отложено на цель' : 'Снято из накоплений') : op.k === 'e' ? 'Трата добавлена' : 'Доход добавлен', 'Отменить', function () { store.remove(op.id, F.monthOf(op.d), undone); });
      });
    });
  }
  function quickAdd(it) { // частая запись целиком: категория, сумма, валюта и заметка те же, дата из листа
    var e = entry;
    if (!e || e.busy) { return; }
    e.busy = true;
    paintEntry();
    addOp(F.makeOp(it.k, it.c, it.a, it.u, e.date, null, it.n));
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
    add(box, back, el('h1', 'first__title', 'На что вы тратите'), el('p', 'first__lead', nb('Тёмные уже выбраны. Нажмите, чтобы добавить или убрать.')), ul, foot);
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

  // ---------- настройки ----------
  function openSettings() {
    if (!st.loaded || st.error || firstRun()) { return; }
    haptic();
    swapModal('list', false, function (m) {
      var box = el('div', 'pick'), ul = el('ul', 'menu');
      function row(id, name, small, fn) {
        var li = el('li'), b = btn('menu__row');
        b.id = id;
        add(b, el('span', '', name), small ? el('small', '', small) : null, icon('right'));
        b.addEventListener('click', fn);
        li.appendChild(b);
        ul.appendChild(li);
      }
      row('setCats', WORDS.e.list, String(F.CATS.length), function () { openCats('e'); });
      row('setSrcs', WORDS.i.list, String(F.SRCS.length), function () { openCats('i'); });
      row('notesBtn', 'Перенос из заметок', '', function () { openNotes(openSettings); });
      row('backupBtn', 'Копия данных', '', function () { openBackup(openSettings); });
      add(box, el('h2', '', 'Настройки'), ul);
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
      if (lastY < r.top + 56) { box.scrollTop -= 8; } else if (lastY > r.bottom - 56) { box.scrollTop += 8; }
      place();
      raf = requestAnimationFrame(tick);
    }
    grip.addEventListener('pointerdown', function (e) {
      if (id !== null) { return; }
      id = e.pointerId;
      try { grip.setPointerCapture(id); } catch (x) { /* без захвата тоже работает */ }
      rows = [].slice.call(box.querySelectorAll('.rows__li'));
      tops = rows.map(function (r) { return r.getBoundingClientRect().top + box.scrollTop; });
      h = li.offsetHeight;
      startY = lastY = e.clientY;
      scroll0 = box.scrollTop;
      to = from;
      li.className = 'rows__li is-drag';
      box.className = 'pick pick--cats is-sorting';
      haptic();
      raf = requestAnimationFrame(tick);
      e.preventDefault();
    });
    grip.addEventListener('pointermove', function (e) { if (e.pointerId === id) { lastY = e.clientY; } });
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
    tgTry(function () { tg.setHeaderColor('#F5F5F7'); });
    tgTry(function () { tg.setBackgroundColor('#F5F5F7'); });
    tgTry(function () { if (tg.setBottomBarColor) { tg.setBottomBarColor('#FFFFFF'); } });
    tgTry(function () { if (tg.disableVerticalSwipes) { tg.disableVerticalSwipes(); } }); // иначе жест «вниз» сворачивает всё приложение вместо листа
    tgTry(function () { tg.BackButton.onClick(goBack); });
    tgTry(function () { // пункт «Настройки» в меню Telegram открывает тот же лист, что и шестерёнка
      if (!tg.SettingsButton) { return; }
      tg.SettingsButton.onClick(function () { if (!ui.open) { openSettings(); } });
      tg.SettingsButton.show();
    });
    tgTry(function () { tg.onEvent('viewportChanged', fit); });

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
    window.addEventListener('resize', fit);
    // пока печатают, пояснение в листе цели прячется: место нужно полям и кнопке
    document.addEventListener('focusin', function () { root.className = typing() ? 'is-typing' : ''; setTimeout(fit, 60); });
    document.addEventListener('focusout', function () { setTimeout(function () { root.className = typing() ? 'is-typing' : ''; fit(); }, 60); });
    document.addEventListener('visibilitychange', function () { if (!document.hidden && !ui.open && st.loaded) { reload(false); } }); // записи мог добавить второй телефон
    fit();
    paintDock();
    view.appendChild(el('p', 'boot', 'Открываем записи'));
    reload(true);
  }

  window.addEventListener('error', function (e) { // белого экрана без объяснения быть не должно
    if (!(e && e.filename) || String(e.message || '') === 'Script error.') { return; }
    if (!st.loaded) { fail('Не получилось открыть учёт', 'Закройте окно и откройте его ещё раз. Для разработчика: ' + String(e.message || '').replace(/[<>&]/g, '').slice(0, 120)); }
  });

  window.FINAPP = { state: st, reload: reload, version: VERSION, back: goBack, setKeyboard: function (px, mode) { sim = px ? { px: px, mode: mode || 'overlay' } : null; fit(); } };
  boot();
})();
