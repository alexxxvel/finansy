/* Учёт финансов: экраны. Главная («Месяц»), «История», лист добавления, копия данных.
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
  var VERSION = 'a50f2fb344'; // при выкладке сюда подставляется версия файлов: по ней видно, не показывает ли Telegram старую страницу

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

  // ---------- состояние ----------
  var st = {
    month: F.monthOf(F.today()), months: [], ops: [], sum: F.summarize([]),
    carry: 0, partial: false, // остаток на начало месяца: доходы минус траты всех прошлых месяцев
    all: {}, cfg: {}, prev: F.summarize([]), balance: 0, // все записи по месяцам, настройки, сводка прошлого месяца, накоплено за всё время
    tab: 'month', more: false, shown: 0, loaded: false, error: ''
  };
  var store = null;
  var ui = { y: 0, h: 0, raf: 0, open: false, kind: '' };
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
  function toast(text, action, fn) {
    clear(toastEl);
    toastEl.appendChild(el('span', '', text));
    if (action) {
      var b = btn('toast__act', action);
      b.id = 'toastAct';
      b.addEventListener('click', function () { toastEl.className = 'toast'; fn(); });
      toastEl.appendChild(b);
    }
    toastEl.className = 'toast is-on' + (action ? ' toast--act' : '');
    clearTimeout(toast.t);
    toast.t = setTimeout(function () { toastEl.className = 'toast'; }, action ? 7000 : 3800);
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
    var tabs = el('nav', 'tabs');
    tabs.setAttribute('aria-label', 'Разделы');
    [['month', 'Месяц'], ['history', 'История']].forEach(function (t) {
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
    var a = btn('btn btn--add');
    a.id = 'addBtn';
    add(a, icon('plus'), document.createTextNode('Добавить'));
    a.addEventListener('click', function () { openEntry(null); });
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
    var dict = F.dict(op.k, op.c), b = btn('op' + (bare ? ' op--bare' : ''));
    b.setAttribute('data-id', op.id);
    var name = el('span', '', bare ? F.dayLabel(op.d) : dict.name);
    rowNote(name, [op.u !== 'BYN' ? F.fmtShort(op.a) + F.NB + op.u : '', op.n || ''].filter(Boolean).join(', ')); // сумма в валюте первой: длинную заметку строка обрежет, а её нет
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
  function goalCard() {
    var g = st.cfg.goal, have = Math.max(0, st.balance), pct = Math.min(100, Math.floor(have / g.a * 100));
    var sec = el('section', 'goal'), b = btn('goal__btn');
    b.id = 'goalCard';
    var head = el('span', 'cats__head');
    var pc = el('span', 'goal__pct', pct + '%');
    pc.appendChild(icon('right', 'share__go'));
    add(head, el('span', 'goal__title', g.n ? 'Цель: ' + g.n : 'Цель накопления'), pc);
    var line = el('span', 'goal__line');
    add(line, el('b', '', F.fmt(have)), document.createTextNode(' из' + F.NB + F.fmt(g.a)));
    var track = el('i', 'goal__bar'), f = el('b');
    f.style.transform = 'scaleX(' + Math.min(1, have / g.a).toFixed(4) + ')';
    track.appendChild(f);
    add(b, head, line, track, el('span', 'goal__rest', have >= g.a ? 'цель достигнута' : 'осталось накопить ' + F.fmt(g.a - have)));
    b.addEventListener('click', openGoal);
    sec.appendChild(b);
    return sec;
  }

  function paintMonth(animate) {
    var s = st.sum, was = st.shown;
    st.shown = s.spent;
    var current = st.month === F.monthOf(F.today());

    var spent = el('section', 'spent');
    var sumEl = el('p', 'spent__sum');
    var node = { whole: el('span'), frac: el('i') };
    sumEl.id = 'spentSum';
    add(sumEl, node.whole, node.frac, el('abbr', '', 'BYN'));
    add(spent, el('p', 'spent__label', 'Потрачено'), sumEl);

    // шкала: дорожка = доход (при перерасходе и без дохода — сами траты); не больше трёх сегментов
    var avail = s.income + st.carry, left = avail - s.spent; // доступно в этом месяце: доход и остаток с прошлых
    var base = Math.max(avail, s.spent, 1);
    var bar = el('div', 'spent__bar');
    bar.setAttribute('role', 'img');
    bar.setAttribute('aria-label', avail > 0 ? 'Потрачено ' + Math.round(s.spent / avail * 100) + ' процентов доступного' : 'Доход ещё не внесён');
    var segs = [];
    if (s.cats.length <= 3) { segs = s.cats.map(function (c) { return c.sum; }); }
    else { segs = [s.cats[0].sum, s.cats[1].sum, s.spent - s.cats[0].sum - s.cats[1].sum]; }
    var fill = el('div', 'spent__fill');
    segs.forEach(function (v) { var i = el('i'); i.style.width = (v / base * 100).toFixed(2) + '%'; fill.appendChild(i); });
    bar.appendChild(fill);
    var legend = el('div', 'spent__legend');
    if (!s.income && !st.carry) { add(legend, el('span', '', s.spent ? 'доход ещё не внесён' : 'записей в этом месяце нет')); }
    else {
      add(legend, el('span', '', avail > 0 ? 'из' + F.NB + F.fmt(avail) : (s.income ? 'из' + F.NB + F.fmt(s.income) : 'доход ещё не внесён')));
      add(legend, left < 0 ? el('span', 'is-over', 'перерасход ' + F.fmt(-left)) : el('span', '', 'осталось ' + F.fmt(left)));
    }
    add(spent, bar, legend);
    var days = F.daysLeft(st.month), per = F.perDay(left, days);
    if (per) { // сколько можно тратить в день, чтобы остатка хватило до конца месяца
      var dayEl = el('p', 'spent__day', days === 1 ? 'сегодня последний день месяца' : 'по' + F.NB + F.fmtDay(per) + F.NB + 'BYN в' + F.NB + 'день, ещё ' + days + F.NB + F.plural(days, 'день', 'дня', 'дней'));
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
    if (!s.srcs.length && !st.carry) {
      srcs.appendChild(el('p', 'empty', 'Доходов в этом месяце ещё нет.'));
    } else {
      var plain = el('ul', 'plain');
      if (st.carry) { // перешло с прошлых месяцев: плюсом остаток, минусом перерасход
        var cr = el('li', 'plain__carry');
        cr.id = 'carryRow';
        add(cr, icon('wallet'), el('span', '', 'Остаток на начало месяца'), el('data', '', F.fmt(st.carry)));
        plain.appendChild(cr);
      }
      s.srcs.forEach(function (c) { plain.appendChild(shareRow('i', c, null, 0)); });
      srcs.appendChild(plain);
    }
    var goalRow = null;
    if (current && !st.cfg.goal) {
      goalRow = btn('more more--copy');
      goalRow.id = 'goalBtn';
      add(goalRow, el('span', '', 'Цель накопления'), icon('right'));
      goalRow.addEventListener('click', openGoal);
    }
    var copy = btn('more more--copy');
    copy.id = 'backupBtn';
    add(copy, el('span', '', 'Копия данных'), icon('right'));
    copy.addEventListener('click', openBackup);
    add(sheet, cats, srcs, current && st.cfg.goal ? goalCard() : null, goalRow, copy);
    if (st.partial) { sheet.appendChild(el('p', 'note', 'Часть записей прошлых месяцев не читается: остаток на начало месяца может быть неточным.')); }
    if (store && store.kind === 'local') { sheet.appendChild(el('p', 'note', 'Пробный режим вне Telegram: записи хранятся только в этом браузере.')); }

    clear(view);
    var head = el('div', 'bar');
    head.appendChild(monthButton());
    add(view, head, spent, sheet);

    if (animate && !reduce) {
      tweenSum(node, was, s.spent);
      fill.className = 'spent__fill is-in';
      sheet.className = 'sheet is-in';
    } else { setSum(node, s.spent); }
  }

  // ---------- история ----------
  function paintHistory() {
    clear(view);
    var head = el('div', 'bar');
    head.appendChild(monthButton());
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

  // ---------- цель накопления ----------
  function openGoal() {
    var g = st.cfg.goal || null;
    haptic();
    openModal('list', false, function (m) {
      var box = el('div', 'pick pick--goal');
      var info = el('p', 'pick__info', 'Накоплено считается по всем записям: доходы минус траты. Сейчас это ' + F.fmt(Math.max(0, st.balance)) + F.NB + 'BYN.');
      info.id = 'goalInfo';
      var sum = el('input', 'field');
      sum.id = 'goalSum';
      sum.type = 'text';
      sum.maxLength = 14;
      sum.placeholder = 'например, 2000';
      sum.value = g ? F.fmt(g.a).replace(/,00$/, '') : '';
      sum.setAttribute('inputmode', 'decimal');
      sum.setAttribute('aria-label', 'Сумма цели');
      sum.setAttribute('enterkeyhint', 'done');
      sum.setAttribute('autocomplete', 'off');
      var name = el('input', 'field');
      name.id = 'goalName';
      name.type = 'text';
      name.maxLength = 40;
      name.placeholder = 'не обязательно';
      name.value = g && g.n ? g.n : '';
      name.setAttribute('aria-label', 'На что копите');
      name.setAttribute('enterkeyhint', 'done');
      name.setAttribute('autocomplete', 'off');
      [sum, name].forEach(function (f) { f.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { f.blur(); } }); });
      function write(goal) { // остальные настройки (свои категории) остаются как были
        var next = { cats: st.cfg.cats, srcs: st.cfg.srcs };
        if (goal) { next.goal = goal; }
        store.setCfg(next, function (err) {
          if (err) { toast(explain(err)); return; }
          haptic('ok');
          closeModal(0);
          reload(true);
        });
      }
      var go = btn('btn', 'Сохранить цель');
      go.id = 'goalSave';
      go.addEventListener('click', function () {
        var a = F.parseAmount(sum.value), n = F.cleanNote(name.value);
        if (!a) { info.textContent = 'Введите сумму цели цифрами, например 2000.'; haptic('err'); return; }
        write(n ? { a: a, n: n } : { a: a });
      });
      var drop = null;
      if (g) {
        drop = btn('btn btn--quiet', 'Убрать цель');
        drop.id = 'goalDrop';
        drop.addEventListener('click', function () { write(null); });
      }
      var l1 = el('label', 'lbl', 'Сколько накопить, BYN'), l2 = el('label', 'lbl', 'Название');
      l1.setAttribute('for', 'goalSum');
      l2.setAttribute('for', 'goalName');
      add(box, el('h2', '', 'Цель накопления'), info, l1, sum, l2, name, go, drop);
      m.appendChild(box);
    });
  }

  function paint(animate) {
    if (st.error) {
      clear(view);
      var box = el('div', 'fail');
      var again = btn('btn', 'Повторить');
      again.addEventListener('click', function () { reload(true); });
      add(box, el('h2', '', 'Не получилось открыть записи'), el('p', '', st.error), again);
      view.appendChild(box);
      return;
    }
    if (st.tab === 'history') { paintHistory(); } else { paintMonth(animate); }
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
      paint(animate);
      if (done) { done(null); }
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

  function openModal(kind, full, build) {
    ui.kind = kind;
    toastEl.className = 'toast'; // сообщение не должно лежать поверх клавиш листа
    clear(modal);
    modal.className = 'modal' + (full ? ' modal--full' : '') + ' modal--' + kind;
    var grab = el('div', 'grab');
    grab.appendChild(el('i'));
    modal.appendChild(grab);
    build(modal);
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
  function openEntry(op) {
    if (!st.loaded || st.error) { return; }
    entry = {
      edit: op || null,
      kind: op ? op.k : 'e',
      digits: op ? F.fmt(op.a).replace(/\s/g, '').replace(/,00$/, '').replace(/(,\d)0$/, '$1') : '',
      cur: op ? op.u : 'BYN',
      cat: op ? op.c : '',
      date: op ? op.d : F.today(),
      note: op && op.n ? op.n : '',
      busy: false
    };
    haptic();
    openModal('entry', true, function (m) {
      var screen = el('div', 'screen');

      var seg = el('div', 'seg');
      seg.setAttribute('role', 'group');
      seg.setAttribute('aria-label', 'Что добавляем');
      entry.segBtns = [['e', 'Трата'], ['i', 'Доход']].map(function (k) {
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
      entry.quick = el('div', 'quick'); // частые записи: одно касание вместо набора суммы
      entry.quick.id = 'quick';
      add(box, row, entry.hint, entry.quick);

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
      var wide = 0, single = nav ? 1 : 0;
      items.forEach(function (c) { if (cols === 3 && c.wide) { wide++; } else { single++; } });
      return cols === 3 ? wide + Math.ceil(Math.max(0, single - wide) / 3) : Math.ceil(single / 2);
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
    var list = entry.kind === 'e' ? F.CATS : F.SRCS, cols = entry.kind === 'i' ? 2 : 3;
    var pages = chipPages(list, cols);
    if (entry.page === undefined) { // при правке открыть страницу, на которой стоит категория записи
      entry.page = 0;
      pages.forEach(function (pg, n) { if (F.find(pg, entry.cat)) { entry.page = n; } });
    }
    if (entry.page >= pages.length) { entry.page = 0; }
    clear(entry.chips);
    entry.chips.className = 'chips' + (cols === 2 ? ' chips--two' : '');
    entry.chips.setAttribute('aria-label', entry.kind === 'e' ? 'Категория' : 'Источник');
    entry.chipBtns = pages[entry.page].map(function (c) {
      var li = el('li', c.wide && cols === 3 ? 'chips__wide' : ''), b = btn('', c.name);
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

    var often = (!e.edit && !e.digits && !e.busy && window.innerHeight >= 640) ? F.frequent(st.all, e.kind, 3) : []; // на низком экране кнопкам нет места
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
    if (e.cur !== 'BYN') {
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
    else if (!e.cat) { label = e.kind === 'e' ? 'Выберите категорию' : 'Выберите источник'; }
    else { label = e.edit ? 'Сохранить' : (e.kind === 'e' ? 'Добавить трату' : 'Добавить доход'); off = false; }
    e.go.textContent = label;
    e.go.className = 'btn' + (off ? ' btn--off' : '');
    e.go.setAttribute('aria-disabled', String(off));
    if (e.del) { e.del.setAttribute('aria-disabled', String(!!e.busy)); }
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
    if (!minor || !e.cat) { haptic('err'); return; }
    var op = F.makeOp(e.kind, e.cat, minor, e.cur, e.date, e.edit ? e.edit.id : null, e.note);
    if (e.edit && e.edit.u === e.cur && e.edit.r) { op.r = e.edit.r; } // правка не меняет курс, по которому запись была внесена
    e.busy = true;
    paintEntry();
    if (e.edit) { store.update(op, F.monthOf(e.edit.d), function (err) { afterWrite(err, op.d); }); return; }
    addOp(op);
  }
  function addOp(op) {
    store.add(op, function (err) {
      afterWrite(err, op.d, function () { // случайную запись можно убрать сразу, не заходя в «Историю»
        toast(op.k === 'e' ? 'Трата добавлена' : 'Доход добавлен', 'Отменить', function () { store.remove(op.id, F.monthOf(op.d), undone); });
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
  function openBackup() {
    haptic();
    openModal('list', false, function (m) {
      var box = el('div', 'pick');
      m.appendChild(box);
      backupMenu(box);
    });
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
    var info = el('p', 'pick__info', 'Скопируйте текст копии, затем нажмите «Вставить из буфера». Существующие записи не изменятся, добавятся только недостающие.');
    info.id = 'backupInfo';
    var area = el('textarea', 'pick__area');
    area.id = 'backupText';
    area.placeholder = 'Вставьте сюда текст копии';
    area.setAttribute('aria-label', 'Текст копии');
    area.setAttribute('autocapitalize', 'none');
    area.setAttribute('autocorrect', 'off');
    area.spellcheck = false;
    area.hidden = true;
    var paste = btn('btn', 'Вставить из буфера');
    paste.id = 'pasteBtn';
    var manual = btn('btn btn--quiet', 'Вставить вручную');
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
    tgTry(function () { tg.BackButton.onClick(function () { closeModal(0); }); });
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

  window.FINAPP = { state: st, reload: reload, version: VERSION, setKeyboard: function (px, mode) { sim = px ? { px: px, mode: mode || 'overlay' } : null; fit(); } };
  boot();
})();
