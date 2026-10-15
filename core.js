/* Учёт финансов: расчёты без экрана и без хранилища. Деньги — целые копейки, чтобы не терять их на дробях.
   Стиль ES5 (var, function): так страница запускается и на старых встроенных браузерах Telegram. */
(function (g) {
  'use strict';

  var NB = ' ';
  var MINUS = '−';

  // категории трат и источники дохода: id хранится в записи, название можно менять без потери истории
  var CATS = [
    { id: 'food', name: 'Продукты', icon: 'cart' },
    { id: 'auto', name: 'Авто', icon: 'car' },
    { id: 'cloth', name: 'Одежда', icon: 'shirt' },
    { id: 'care', name: 'Уход', icon: 'drop' },
    { id: 'link', name: 'Связь', icon: 'phone' },
    { id: 'subs', name: 'Подписки', icon: 'repeat' },
    { id: 'shop', name: 'Покупки', icon: 'bag' },
    { id: 'fun', name: 'Развлечения и прочее', icon: 'spark', wide: true }
  ];
  var SRCS = [
    { id: 'pay', name: 'Зарплата', icon: 'case' },
    { id: 'free', name: 'Фриланс', icon: 'laptop' },
    { id: 'gift', name: 'Подарки', icon: 'gift' },
    { id: 'oth', name: 'Другое', icon: 'dots' }
  ];
  // списки можно заменить своими (настройки cfg.cats и cfg.srcs): массивы меняются на месте, поэтому ссылки F.CATS и F.SRCS остаются верными
  var BASE_CATS = CATS.slice(), BASE_SRCS = SRCS.slice();
  // скрытые категории и источники (cfg.catsOff, cfg.srcsOff): на листе добавления их нет, но записи в них сохраняют название и значок
  var OFF = { e: [], i: [] };
  // набор для первого открытия: человек отмечает свои категории сам, первые девять отмечены заранее
  var STARTER = [['food', 'Продукты', 'cart'], ['cafe', 'Кафе', 'cup'], ['trans', 'Транспорт', 'bus'], ['auto', 'Авто', 'car'], ['home', 'Жильё', 'home'], ['link', 'Связь', 'phone'],
    ['health', 'Здоровье', 'heart'], ['beauty', 'Красота', 'star'], ['cloth', 'Одежда', 'shirt'], ['house', 'Дом и быт', 'box'], ['family', 'Семья', 'users'], ['gifts', 'Подарки', 'gift'],
    ['fun', 'Досуг', 'ticket'], ['subs', 'Подписки', 'repeat'], ['study', 'Учёба', 'book'], ['pets', 'Питомцы', 'paw'], ['work', 'Работа', 'case'], ['credit', 'Кредиты', 'card'],
    ['docs', 'Документы', 'file'], ['other', 'Другое', 'dots']];
  var STARTER_ON = 9;
  var LIST_MAX = 40; // столько категорий (видимых и скрытых вместе) помещается в настройки с запасом
  var CURS = ['BYN', 'USD', 'EUR'];
  // закреплённый курс (решение 11.10.2026): в записи хранится курс на момент ввода, поэтому смена числа здесь не трогает прошлые записи
  var RATES = { BYN: 1, USD: 3.06, EUR: 3.43 };

  var MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
  var MONTHS_PRE = ['январе', 'феврале', 'марте', 'апреле', 'мае', 'июне', 'июле', 'августе', 'сентябре', 'октябре', 'ноябре', 'декабре'];
  var MONTHS_GEN = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

  function pad(n) { return n < 10 ? '0' + n : String(n); }
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function today() { return iso(new Date()); }
  function monthOf(date) { return String(date).slice(0, 7); }
  function isDate(s) { return typeof s === 'string' && /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(s); }
  function isMonth(s) { return typeof s === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(s); }
  function shiftDay(date, by) { var p = date.split('-'); return iso(new Date(+p[0], +p[1] - 1, +p[2] + by)); }

  function group(intStr) { return intStr.replace(/\B(?=(\d{3})+(?!\d))/g, NB); }
  /** копейки → «1 650,00» */
  function fmt(minor) {
    var v = Math.abs(Math.round(minor));
    return (minor < 0 ? MINUS : '') + group(String(Math.floor(v / 100))) + ',' + pad(v % 100);
  }
  /** копейки → части для крупной суммы: целое и «,40» отдельно */
  function fmtParts(minor) {
    var v = Math.abs(Math.round(minor));
    return { sign: minor < 0 ? MINUS : '', whole: group(String(Math.floor(v / 100))), frac: ',' + pad(v % 100) };
  }
  /** копейки → «300» или «25,50» (для приписки в валюте) */
  function fmtShort(minor) {
    var v = Math.abs(Math.round(minor));
    return group(String(Math.floor(v / 100))) + (v % 100 ? ',' + pad(v % 100) : '');
  }
  function fmtRate(r) { return String(r).replace('.', ','); }

  /** набранная строка «38,2» → копейки 3820 */
  function parseTyped(s) {
    s = String(s || '');
    if (!s) { return 0; }
    var p = s.split(',');
    var frac = ((p[1] || '') + '00').slice(0, 2);
    return (parseInt(p[0] || '0', 10) || 0) * 100 + (parseInt(frac, 10) || 0);
  }
  /** набранная строка для показа: «1650,5» → «1 650,5» */
  function typed(s) {
    s = String(s || '');
    if (!s) { return '0'; }
    var p = s.split(',');
    return group(p[0]) + (p.length > 1 ? ',' + p[1] : '');
  }
  /** нажатие клавиши: цифра, ',' или 'back'. Не больше 7 цифр до запятой и 2 после */
  function press(s, key) {
    s = String(s || '');
    if (key === 'back') { return s.slice(0, -1); }
    var hasComma = s.indexOf(',') >= 0;
    if (key === ',') { return hasComma ? s : (s === '' ? '0,' : s + ','); }
    if (!/^\d$/.test(key)) { return s; }
    if (hasComma) { return s.split(',')[1].length >= 2 ? s : s + key; }
    if (s === '0') { return key; }
    return s.length >= 7 ? s : s + key;
  }

  function toByn(minor, cur, rate) { return cur === 'BYN' ? minor : Math.round(minor * rate); }
  function bynOf(op) { return toByn(op.a, op.u, op.r || RATES[op.u] || 1); }

  /** заметка к записи: одна строка до 40 знаков, без переводов строк и служебных символов */
  function cleanNote(s) {
    return String(s === undefined || s === null ? '' : s).replace(/[\u0000-\u001F\u007F\u200B-\u200D\uFEFF]/g, ' ').replace(/\s+/g, ' ').replace(/^ | $/g, '').slice(0, 40);
  }
  /** длина строки в байтах UTF-8: по ней считается предел хранилища (кириллица занимает два байта) */
  function utf8len(s) {
    var n = 0, c;
    for (var i = 0; i < s.length; i++) { c = s.charCodeAt(i); n += c < 0x80 ? 1 : c < 0x800 ? 2 : (c >= 0xD800 && c <= 0xDBFF) ? (i++, 4) : 3; }
    return n;
  }

  /** свой список категорий или источников: [[id, название, значок], …], до 40 строк, id не повторяются */
  function validList(list) {
    if (!list || typeof list.length !== 'number' || !list.length || list.length > 40) { return null; }
    var out = [], seen = {};
    for (var i = 0; i < list.length; i++) {
      var c = list[i];
      if (!c || typeof c.length !== 'number' || typeof c[0] !== 'string' || !/^[a-z0-9_]{1,12}$/.test(c[0]) || seen[c[0]]) { return null; }
      var name = cleanNote(c[1]).slice(0, 24), ic = typeof c[2] === 'string' && /^[a-z-]{1,16}$/.test(c[2]) ? c[2] : 'dots';
      if (!name) { return null; }
      seen[c[0]] = 1;
      out.push([c[0], name, ic]);
    }
    return out;
  }
  function setList(target, base, packed) {
    var next = packed ? packed.map(function (c) { return { id: c[0], name: c[1], icon: c[2], wide: c[1].length > 11 }; }) : base;
    target.splice.apply(target, [0, target.length].concat(next));
  }
  // ---------- цели: накопления считаются отдельно от остатка ----------
  // Цель: id, название, сколько накопить (копейки её валюты), валюта, сколько уже было накоплено на старте.
  // Запись «Отложить» хранится как трата с категорией «g_<id цели>», «Снять» — как доход с такой же категорией:
  // старая версия страницы (если Telegram покажет её из кэша) такую запись не испортит, а новая не считает её ни тратой, ни доходом.
  var GOALS = [], GOALS_MAX = 12;
  var MONTHS_DAT = ['январю', 'февралю', 'марту', 'апрелю', 'маю', 'июню', 'июлю', 'августу', 'сентябрю', 'октябрю', 'ноябрю', 'декабрю'];
  /** список целей для хранения: [[id, название, сумма, валюта 0–2, старт], …] */
  function validGoals(list) {
    if (!list || typeof list.length !== 'number' || !list.length || list.length > GOALS_MAX) { return null; }
    var out = [], seen = {};
    for (var i = 0; i < list.length; i++) {
      var g = list[i];
      if (!g || typeof g.length !== 'number' || typeof g[0] !== 'string' || !/^[a-z0-9]{1,10}$/.test(g[0]) || seen[g[0]]) { return null; }
      var name = cleanNote(g[1]).slice(0, 24), a = g[2], u = g[3], s = g[4] === undefined ? 0 : g[4];
      if (!name || typeof a !== 'number' || a !== Math.round(a) || a <= 0 || a >= 1e12 || !CURS[u] || typeof s !== 'number' || s !== Math.round(s) || s < 0 || s >= 1e12) { return null; }
      seen[g[0]] = 1;
      out.push([g[0], name, a, u, s]);
    }
    return out;
  }
  function packGoals() { return GOALS.map(function (g) { return [g.id, g.name, g.a, g.u, g.s]; }); }
  function isGoalOp(op) { return !!op && typeof op.c === 'string' && op.c.indexOf('g_') === 0; }
  function goalOf(cat) { return typeof cat === 'string' && cat.indexOf('g_') === 0 ? find(GOALS, cat.slice(2)) : null; }
  /** сумма в валюте цели: рубли в доллары и обратно — по закреплённому курсу приложения */
  function goalAmount(g, minor, cur, rate) {
    var gc = CURS[g.u];
    if (cur === gc) { return minor; }
    var byn = toByn(minor, cur, rate || RATES[cur]);
    return gc === 'BYN' ? byn : Math.round(byn / RATES[gc]);
  }
  function goalByn(g, minor) { return CURS[g.u] === 'BYN' ? minor : Math.round(minor * RATES[CURS[g.u]]); }
  /** состояние цели: сколько накоплено (старт плюс отложенное минус снятое, в валюте цели) и её записи, свежие сверху */
  function goalState(g, all) {
    var have = g.s, ops = [], cat = 'g_' + g.id;
    Object.keys(all || {}).forEach(function (m) {
      all[m].forEach(function (op) {
        if (op.c !== cat) { return; }
        have += (op.k === 'e' ? 1 : -1) * goalAmount(g, op.a, op.u, op.r);
        ops.push(op);
      });
    });
    ops.sort(function (x, y) { return x.d === y.d ? (x.id < y.id ? 1 : -1) : (x.d < y.d ? 1 : -1); });
    return { have: have, ops: ops };
  }
  /** прогноз: средний темп по месяцам с первой записи и к какому месяцу цель наберётся. Нужны хотя бы две записи и положительный темп */
  function goalForecast(g, state, now) {
    now = now || today();
    var rest = g.a - state.have, net = state.have - g.s;
    if (state.ops.length < 2 || rest <= 0 || net <= 0) { return null; }
    var first = state.ops[state.ops.length - 1].d, months = (+now.slice(0, 4) - +first.slice(0, 4)) * 12 + (+now.slice(5, 7) - +first.slice(5, 7)) + 1;
    var avg = net / Math.max(1, months), n = Math.ceil(rest / avg);
    if (n > 240) { return null; }
    var idx = (+now.slice(5, 7) - 1) + n, year = +now.slice(0, 4) + Math.floor(idx / 12);
    return { avg: Math.round(avg), when: MONTHS_DAT[idx % 12] + NB + year };
  }

  // ---------- кредиты и рассрочки: сколько осталось погасить ----------
  // Кредит: id, название, сумма кредита (копейки его валюты), валюта, сколько было погашено до начала учёта, платёж в месяц (0 — не указан),
  // отметки: 1 — напоминать на главной, пока платёж месяца не внесён; 2 — убран в «Погашенные».
  // Платёж — обычная трата с категорией «k_<id кредита>»: входит в «Потрачено», а шкала кредита сдвигается.
  // Список лежит отдельным ключом хранилища (crd), а не в настройках: старая страница из кэша Telegram, переписывая настройки, его не потеряет.
  var CREDITS = [], CREDITS_MAX = 12, REMIND = 1, CLOSED = 2;
  function whole(v, min) { return typeof v === 'number' && v === Math.round(v) && v >= min && v < 1e12; }
  /** список кредитов для хранения: [[id, название, сумма, валюта 0–2, погашено до учёта, платёж в месяц, отметки], …] */
  function validCredits(list) {
    if (!list || typeof list.length !== 'number' || list.length > CREDITS_MAX) { return null; }
    var out = [], seen = {};
    for (var i = 0; i < list.length; i++) {
      var k = list[i];
      if (!k || typeof k.length !== 'number' || typeof k[0] !== 'string' || !/^[a-z0-9]{1,10}$/.test(k[0]) || seen[k[0]]) { return null; }
      var name = cleanNote(k[1]).slice(0, 24), s = k[4] === undefined ? 0 : k[4], p = k[5] === undefined ? 0 : k[5], f = k[6] === undefined ? 0 : k[6];
      if (!name || !whole(k[2], 1) || !CURS[k[3]] || !whole(s, 0) || !whole(p, 0) || (f !== 0 && f !== 1 && f !== 2 && f !== 3)) { return null; }
      seen[k[0]] = 1;
      out.push([k[0], name, k[2], k[3], s, p, f]);
    }
    return out;
  }
  function useCredits(list) {
    var ok = validCredits(list) || [];
    CREDITS.splice.apply(CREDITS, [0, CREDITS.length].concat(ok.map(function (k) { return { id: k[0], name: k[1], a: k[2], u: k[3], s: k[4], p: k[5], f: k[6] }; })));
  }
  function packCredits() { return CREDITS.map(function (k) { return [k.id, k.name, k.a, k.u, k.s, k.p, k.f]; }); }
  function isCreditOp(op) { return !!op && typeof op.c === 'string' && op.c.indexOf('k_') === 0; }
  function creditOf(cat) { return typeof cat === 'string' && cat.indexOf('k_') === 0 ? find(CREDITS, cat.slice(2)) : null; }
  /** состояние кредита: сколько осталось (в его валюте; меньше нуля — переплата), сколько внесено в этом месяце (в его валюте и в рублях), платежи свежие сверху */
  function creditState(k, all, month) {
    var left = k.a - k.s, inMonth = 0, inMonthByn = 0, ops = [], cat = 'k_' + k.id;
    Object.keys(all || {}).forEach(function (m) {
      all[m].forEach(function (op) {
        if (op.c !== cat || op.k !== 'e') { return; }
        var v = goalAmount(k, op.a, op.u, op.r);
        left -= v;
        if (m === month) { inMonth += v; inMonthByn += bynOf(op); }
        ops.push(op);
      });
    });
    ops.sort(function (x, y) { return x.d === y.d ? (x.id < y.id ? 1 : -1) : (x.d < y.d ? 1 : -1); });
    return { left: left, month: inMonth, monthByn: inMonthByn, ops: ops };
  }
  /** платёж этого месяца ждёт: кредит не погашен и не убран, платёж в месяц указан, в этом месяце платежей ещё не было */
  function creditDue(k, state) { return !(k.f & CLOSED) && k.p > 0 && state.left > 0 && state.month <= 0; }
  /** сколько платежей осталось, последний месяц и сумма последнего. Платёж этого месяца не внесён — он первый в счёте.
      total — число платежей всего, если кредит делится на ровные платежи (рассрочка, не больше 24): тогда пишется «3 из 6» */
  function creditPlan(k, state, now) {
    if (!k.p || state.left <= 0) { return null; }
    now = now || today();
    var n = Math.ceil(state.left / k.p), idx = (+now.slice(5, 7) - 1) + (state.month > 0 ? 1 : 0) + n - 1, year = +now.slice(0, 4) + Math.floor(idx / 12);
    var total = k.a % k.p === 0 && k.a / k.p <= 24 ? k.a / k.p : 0;
    if (total && n > total) { total = 0; }
    return { n: n, when: MONTHS_PRE[idx % 12] + (year === +now.slice(0, 4) ? '' : NB + year), last: state.left - (n - 1) * k.p, total: total };
  }

  // ---------- аналитика: период, сравнение с тем же отрезком прошлого, разбор ----------
  var WEEKDAYS_SHORT = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'];
  function lastDay(month) { var p = month.split('-'); return new Date(+p[0], +p[1], 0).getDate(); }
  function dow(date) { var p = date.split('-'); return (new Date(+p[0], +p[1] - 1, +p[2]).getDay() + 6) % 7; } // 0 — понедельник
  function daysBetween(a, b) { var x = a.split('-'), y = b.split('-'); return Math.round((Date.UTC(+y[0], +y[1] - 1, +y[2]) - Date.UTC(+x[0], +x[1] - 1, +x[2])) / 864e5); }
  /** тот же день другого месяца или года; 31-го в коротком месяце — его последний день */
  function sameDay(year, month, day) { return year + '-' + pad(month) + '-' + pad(Math.min(day, new Date(year, month, 0).getDate())); }
  /** Период аналитики. kind 'week' | 'month' | 'year', anchor — любая дата внутри него, now — сегодня (для теста).
      from–to — весь период, end — его прошедшая часть (до сегодня), prevFrom–prevEnd — тот же отрезок прошлого периода:
      неделя с понедельника по тот же день недели, месяц с 1-го по то же число, год с 1 января по тот же день */
  function statsPeriod(kind, anchor, now) {
    now = now || today();
    var p = anchor.split('-'), y = +p[0], m = +p[1], from, to, prevFrom, prevEnd, label;
    if (kind === 'week') {
      from = shiftDay(anchor, -dow(anchor));
      to = shiftDay(from, 6);
    } else if (kind === 'year') {
      from = y + '-01-01';
      to = y + '-12-31';
    } else {
      from = y + '-' + pad(m) + '-01';
      to = y + '-' + pad(m) + '-' + pad(lastDay(y + '-' + pad(m)));
    }
    var end = to < now ? to : now, e = end.split('-');
    if (kind === 'week') { prevFrom = shiftDay(from, -7); prevEnd = shiftDay(end, -7); }
    else if (kind === 'year') { prevFrom = (y - 1) + '-01-01'; prevEnd = sameDay(y - 1, +e[1], +e[2]); }
    else { var pm = prevMonth(y + '-' + pad(m)).split('-'); prevFrom = pm[0] + '-' + pm[1] + '-01'; prevEnd = sameDay(+pm[0], +pm[1], +e[2]); }
    if (kind === 'week') {
      var a = from.split('-'), b = to.split('-');
      label = (+a[2]) + (a[1] === b[1] ? '' : NB + MONTHS_GEN[+a[1] - 1]) + '–' + (+b[2]) + NB + MONTHS_GEN[+b[1] - 1] + (b[0] === now.slice(0, 4) ? '' : NB + b[0]);
    } else if (kind === 'year') { label = String(y); }
    else { label = monthLabel(y + '-' + pad(m)); }
    return { kind: kind, from: from, to: to, end: end, prevFrom: prevFrom, prevEnd: prevEnd, label: label, current: to >= now, future: from > now };
  }
  /** соседний период: by −1 назад, +1 вперёд */
  function periodShift(kind, anchor, by) {
    var p = anchor.split('-');
    if (kind === 'week') { return shiftDay(anchor, 7 * by); }
    if (kind === 'year') { return (+p[0] + by) + '-' + p[1] + '-01'; }
    var d = new Date(+p[0], +p[1] - 1 + by, 1);
    return iso(d);
  }
  /** траты и доходы в границах дат (включительно). Записи целей не траты и не доходы; платёж по кредиту — трата */
  function inRange(all, from, to) {
    var out = [];
    Object.keys(all || {}).forEach(function (m) {
      if (m < from.slice(0, 7) || m > to.slice(0, 7)) { return; }
      all[m].forEach(function (op) { if (op.d >= from && op.d <= to && !isGoalOp(op)) { out.push(op); } });
    });
    return out;
  }
  /** Сводка отрезка: траты, доходы, число трат, по дням, по категориям, крупнейшая трата, заметки (чаще всего) */
  function rangeStats(all, from, to) {
    var ops = inRange(all, from, to), s = { spent: 0, income: 0, count: 0, days: {}, cats: {}, biggest: null, notes: {}, months: {} };
    ops.forEach(function (op) {
      var b = bynOf(op), m = op.d.slice(0, 7), mo = s.months[m] || (s.months[m] = { spent: 0, income: 0 });
      if (op.k === 'i') { s.income += b; mo.income += b; return; }
      s.spent += b;
      mo.spent += b;
      s.count++;
      s.days[op.d] = (s.days[op.d] || 0) + b;
      s.cats[op.c] = (s.cats[op.c] || 0) + b;
      if (!s.biggest || b > bynOf(s.biggest)) { s.biggest = op; }
      if (op.n) {
        var key = op.n.toLowerCase(), it = s.notes[key] || (s.notes[key] = { n: op.n, count: 0, sum: 0, cats: {} });
        it.count++;
        it.sum += b;
        it.cats[op.c] = (it.cats[op.c] || 0) + 1;
      }
    });
    return s;
  }
  /** категории отрезка строками, крупные сверху: { id, name, icon, sum } */
  function catRows(map) {
    return Object.keys(map).map(function (id) { var c = dict('e', id); return { id: id, name: c.name, icon: c.icon, sum: map[id] }; }).sort(function (a, b) { return b.sum - a.sum; });
  }
  /** изменения к тому же отрезку прошлого: только категории, где разница есть; больше — сверху */
  function catChanges(now, prev, limit) {
    var ids = {}, out = [];
    Object.keys(now).concat(Object.keys(prev)).forEach(function (id) { ids[id] = 1; });
    Object.keys(ids).forEach(function (id) {
      var d = (now[id] || 0) - (prev[id] || 0);
      if (d) { out.push({ id: id, name: dict('e', id).name, d: d, fresh: !prev[id], gone: !now[id] }); }
    });
    out.sort(function (a, b) { return Math.abs(b.d) - Math.abs(a.d); });
    return out.slice(0, limit || 6).sort(function (a, b) { return b.d - a.d; });
  }
  /** заметки отрезка: чаще всего сверху, при равенстве — дороже. cat — категория, в которой эта заметка встречается чаще */
  function topNotes(notes, limit, onlyCat) {
    return Object.keys(notes).map(function (k) {
      var it = notes[k], best = '';
      Object.keys(it.cats).forEach(function (c) { if (!best || it.cats[c] > it.cats[best]) { best = c; } });
      return { key: k, n: it.n, count: it.count, sum: it.sum, cat: best };
    }).filter(function (it) { return !onlyCat || it.cat === onlyCat; }).sort(function (a, b) { return b.count - a.count || b.sum - a.sum; }).slice(0, limit || 5);
  }
  /** средняя трата по дням недели за всё время записей: сумма по дню недели делится на число таких дней от первой записи до сегодня */
  function weekdayAvg(all, now) {
    now = now || today();
    var first = '', sums = [0, 0, 0, 0, 0, 0, 0], n = [0, 0, 0, 0, 0, 0, 0];
    Object.keys(all || {}).forEach(function (m) { all[m].forEach(function (op) { if (!isGoalOp(op) && op.d <= now && (!first || op.d < first)) { first = op.d; } }); });
    if (!first) { return null; }
    inRange(all, first, now).forEach(function (op) { if (op.k === 'e') { sums[dow(op.d)] += bynOf(op); } });
    var span = daysBetween(first, now) + 1;
    for (var i = 0; i < span; i++) { n[(dow(first) + i) % 7]++; }
    return { avg: sums.map(function (v, i) { return n[i] ? Math.round(v / n[i]) : 0; }), weeks: Math.floor(span / 7), first: first };
  }
  /** накопленная сумма по дням отрезка: [сумма к 1-му дню, ко 2-му, …] */
  function cumulative(days, from, count) {
    var out = [], acc = 0;
    for (var i = 0; i < count; i++) { acc += days[shiftDay(from, i)] || 0; out.push(acc); }
    return out;
  }
  /** первая дата с записями (без записей целей) */
  function firstDate(all) {
    var first = '';
    Object.keys(all || {}).forEach(function (m) { all[m].forEach(function (op) { if (!isGoalOp(op) && (!first || op.d < first)) { first = op.d; } }); });
    return first;
  }

  /** применить настройки: свои категории и источники, если они заданы, иначе встроенные; скрытые — отдельными списками; цели */
  function useCfg(cfg) {
    var goals = cfg ? validGoals(cfg.goals) : null;
    GOALS.splice.apply(GOALS, [0, GOALS.length].concat((goals || []).map(function (g) { return { id: g[0], name: g[1], a: g[2], u: g[3], s: g[4] }; })));
    setList(CATS, BASE_CATS, cfg ? validList(cfg.cats) : null);
    setList(SRCS, BASE_SRCS, cfg ? validList(cfg.srcs) : null);
    setList(OFF.e, [], cfg ? validList(cfg.catsOff) : null);
    setList(OFF.i, [], cfg ? validList(cfg.srcsOff) : null);
  }
  /** категория записи по id: из списка или из скрытых. Записи с категорией, которой нет нигде (список сменили), не теряются: они «без категории» */
  function dict(kind, id) {
    if (typeof id === 'string' && id.indexOf('g_') === 0) { var g = goalOf(id); return { id: id, name: g ? g.name : 'Удалённая цель', icon: 'wallet', goal: true }; }
    if (typeof id === 'string' && id.indexOf('k_') === 0) { var k = creditOf(id); return { id: id, name: k ? k.name : 'Удалённый кредит', icon: 'card', credit: true }; } // платёж по кредиту — трата с названием кредита
    return find(kind === 'i' ? SRCS : CATS, id) || find(OFF[kind === 'i' ? 'i' : 'e'], id) || { id: id, name: 'Без категории', icon: 'dots' };
  }
  /** список для хранения: [[id, название, значок], …] */
  function packList(list) { return list.map(function (c) { return [c.id, c.name, c.icon]; }); }
  /** встроенный список (тот, что действует, пока своего нет) в виде для хранения */
  function builtin(kind) { return packList(kind === 'i' ? BASE_SRCS : BASE_CATS); }
  /** id для своей категории: короткий и не занятый */
  function catId(taken) {
    var id;
    do { id = 'u' + Math.random().toString(36).slice(2, 8); } while (!/^[a-z0-9]{4,12}$/.test(id) || taken[id]);
    return id;
  }

  function newId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function find(list, id) { for (var i = 0; i < list.length; i++) { if (list[i].id === id) { return list[i]; } } return null; }

  /** запись: d дата, k 'e' трата или 'i' доход, c категория или источник, a сумма в копейках исходной валюты, u валюта, r курс (если не BYN), n заметка (если есть) */
  function makeOp(kind, cat, minor, cur, date, id, note) {
    var op = { id: id || newId(), d: date, k: kind === 'i' ? 'i' : 'e', c: cat, a: Math.round(minor), u: cur };
    if (cur !== 'BYN') { op.r = RATES[cur]; }
    note = cleanNote(note);
    if (note) { op.n = note; }
    return op;
  }
  function validOp(op) {
    return !!op && typeof op.id === 'string' && /^[a-z0-9]{4,24}$/.test(op.id) && isDate(op.d) && (op.k === 'e' || op.k === 'i')
      && typeof op.c === 'string' && /^[a-z0-9_]{1,12}$/.test(op.c) && typeof op.a === 'number' && isFinite(op.a) && op.a > 0 && op.a === Math.round(op.a) && op.a < 1e11
      && CURS.indexOf(op.u) >= 0 && (op.u === 'BYN' || (typeof op.r === 'number' && op.r > 0 && op.r < 1000))
      && (op.n === undefined || (typeof op.n === 'string' && op.n.length > 0 && op.n.length <= 40));
  }
  /** запись → короткий массив для хранения (день вместо полной даты: месяц уже в ключе) */
  function pack(op) {
    var a = [op.id, +op.d.slice(8, 10), op.k === 'i' ? 1 : 0, op.c, op.a, CURS.indexOf(op.u)];
    if (op.u !== 'BYN') { a.push(op.r); }
    if (op.n) { if (op.u === 'BYN') { a.push(0); } a.push(op.n); } // заметка всегда восьмая: у рублёвой записи на месте курса ноль
    return a;
  }
  function unpack(a, month) {
    if (!a || typeof a.length !== 'number' || a.length < 6 || !isMonth(month)) { return null; }
    var op = { id: a[0], d: month + '-' + pad(+a[1] || 0), k: a[2] === 1 ? 'i' : 'e', c: a[3], a: a[4], u: CURS[a[5]] };
    if (op.u !== 'BYN') { op.r = a[6]; }
    if (typeof a[7] === 'string') { var note = cleanNote(a[7]); if (note) { op.n = note; } }
    return validOp(op) ? op : null;
  }

  /** текст копии → записи по месяцам. Терпит то, что делает с текстом телефон и мессенджеры: «умные» кавычки, невидимые символы, лишний текст вокруг */
  function parseBackup(text) {
    var s = String(text || '').replace(/[\u200B-\u200D\uFEFF]/g, ''), data = null;
    var i = s.indexOf('{'), j = s.lastIndexOf('}');
    if (i < 0 || j <= i) { return null; }
    s = s.slice(i, j + 1);
    try { data = JSON.parse(s); } catch (e) {
      // телефон или мессенджер заменил прямые кавычки «умными» и пробелы неразрывными: чиним и пробуем ещё раз
      try { data = JSON.parse(s.replace(/[\u201C\u201D\u201E\u201F\u00AB\u00BB\u2033]/g, '"').replace(/\u00A0/g, ' ')); } catch (e2) { return null; }
    }
    if (!data || data.app !== 'finansy' || !data.months || typeof data.months !== 'object') { return null; }
    var months = {}, count = 0, seen = {};
    Object.keys(data.months).forEach(function (month) {
      var arr = data.months[month];
      if (!isMonth(month) || !arr || typeof arr.length !== 'number') { return; }
      for (var n = 0; n < arr.length; n++) {
        var op = unpack(arr[n], month);
        if (op && !seen[op.id]) { seen[op.id] = 1; (months[month] = months[month] || []).push(op); count++; }
      }
    });
    var cfg = null;
    if (data.cfg && typeof data.cfg === 'object') { // вместе с записями копия несёт цель и свои списки категорий
      cfg = {};
      if (validGoal(data.cfg.goal)) { cfg.goal = data.cfg.goal; }
      if (validList(data.cfg.cats)) { cfg.cats = validList(data.cfg.cats); }
      if (validList(data.cfg.srcs)) { cfg.srcs = validList(data.cfg.srcs); }
      if (validList(data.cfg.catsOff)) { cfg.catsOff = validList(data.cfg.catsOff); }
      if (validList(data.cfg.srcsOff)) { cfg.srcsOff = validList(data.cfg.srcsOff); }
      if (validGoals(data.cfg.goals)) { cfg.goals = validGoals(data.cfg.goals); }
      if (!Object.keys(cfg).length) { cfg = null; }
    }
    var credits = validCredits(data.credits); // кредиты лежат в копии рядом с настройками: в хранилище у них свой ключ
    return count ? { months: months, count: count, cfg: cfg, credits: credits && credits.length ? credits : null } : null;
  }

  function plural(n, one, few, many) {
    var a = Math.abs(n) % 100, b = a % 10;
    if (a > 10 && a < 20) { return many; }
    if (b > 1 && b < 5) { return few; }
    return b === 1 ? one : many;
  }

  /** сводка месяца: всё в рублях (копейки). Отложенное на цели и снятое с них — не траты и не доходы: считаются отдельно (saved, taken) */
  function summarize(ops) {
    var spent = 0, income = 0, cats = {}, srcs = {}, saved = 0, taken = 0;
    ops.forEach(function (op) {
      var b = bynOf(op), bucket = op.k === 'e' ? cats : srcs;
      if (isGoalOp(op)) { if (op.k === 'e') { saved += b; } else { taken += b; } return; }
      if (op.k === 'e') { spent += b; } else { income += b; }
      var row = bucket[op.c] || (bucket[op.c] = { id: op.c, sum: 0, foreign: {} });
      row.sum += b;
      if (op.u !== 'BYN') { row.foreign[op.u] = (row.foreign[op.u] || 0) + op.a; }
    });
    function rows(bucket, kind) {
      return Object.keys(bucket).map(function (id) {
        var c = dict(kind, id), r = bucket[id];
        return { id: c.id, name: c.name, icon: c.icon, sum: r.sum, note: CURS.filter(function (u) { return r.foreign[u]; }).map(function (u) { return fmtShort(r.foreign[u]) + NB + u; }).join(', ') };
      }).sort(function (x, y) { return y.sum - x.sum; });
    }
    return { spent: spent, income: income, left: income - spent - saved + taken, saved: saved, taken: taken, cats: rows(cats, 'e'), srcs: rows(srcs, 'i') };
  }

  /** записи по дням, свежие сверху */
  function byDays(ops) {
    var map = {}, days = [];
    ops.forEach(function (op) { if (!map[op.d]) { map[op.d] = []; days.push(op.d); } map[op.d].push(op); });
    days.sort().reverse();
    return days.map(function (d) { return { date: d, ops: map[d].sort(function (x, y) { return x.id < y.id ? 1 : -1; }) }; });
  }

  function dayLabel(date) {
    var t = today();
    if (date === t) { return 'Сегодня'; }
    if (date === shiftDay(t, -1)) { return 'Вчера'; }
    var p = date.split('-');
    return (+p[2]) + NB + MONTHS_GEN[+p[1] - 1] + (p[0] === t.slice(0, 4) ? '' : NB + p[0]);
  }
  function monthLabel(month) {
    var p = month.split('-');
    return MONTHS[+p[1] - 1] + (p[0] === today().slice(0, 4) ? '' : NB + p[0]);
  }

  function prevMonth(month) { var p = month.split('-'), y = +p[0], m = +p[1] - 1; if (m < 1) { m = 12; y--; } return y + '-' + pad(m); }
  /** «в сентябре» */
  function inMonth(month) {
    var p = month.split('-');
    return 'в' + NB + MONTHS_PRE[+p[1] - 1] + (p[0] === today().slice(0, 4) ? '' : NB + p[0]);
  }
  /** сколько дней осталось в месяце, считая сегодня; для прошедших и будущих месяцев 0 */
  function daysLeft(month, now) {
    now = now || today();
    if (monthOf(now) !== month) { return 0; }
    var p = now.split('-');
    return new Date(+p[0], +p[1], 0).getDate() - (+p[2]) + 1;
  }
  /** сколько можно тратить в день (копейки), чтобы остатка хватило до конца месяца */
  function perDay(left, days) { return days > 0 && left > 0 ? Math.floor(left / days) : 0; }
  function fmtDay(minor) { return minor >= 100 ? group(String(Math.floor(minor / 100))) : fmt(minor); }

  /** частые записи за последние три месяца: одинаковые категория, сумма, валюта и заметка, внесённые хотя бы дважды */
  function frequent(all, kind, limit, now) {
    now = now || today();
    var from = shiftDay(now, -92), map = {}, list = [];
    Object.keys(all || {}).forEach(function (m) {
      all[m].forEach(function (op) {
        if (op.k !== kind || op.d < from || op.d > now || isGoalOp(op)) { return; } // отложенное на цель частой тратой не предлагается
        var key = [op.c, op.a, op.u, (op.n || '').toLowerCase()].join('|'), it = map[key];
        if (!it) { it = map[key] = { k: kind, c: op.c, a: op.a, u: op.u, n: op.n || '', count: 0, last: '' }; list.push(it); }
        it.count++;
        if (op.d > it.last) { it.last = op.d; }
      });
    });
    return list.filter(function (it) { return it.count >= 2; }).sort(function (x, y) { return y.count - x.count || (x.last < y.last ? 1 : -1); }).slice(0, limit);
  }

  /** цель накопления: a сумма в копейках, n название (не обязательно) */
  function validGoal(goal) {
    return !!goal && typeof goal.a === 'number' && goal.a === Math.round(goal.a) && goal.a > 0 && goal.a < 1e12
      && (goal.n === undefined || (typeof goal.n === 'string' && goal.n.length > 0 && goal.n.length <= 40));
  }
  /** сумма, набранная на клавиатуре телефона: «2000», «2 000,50», «2000.5» → копейки; непонятное → 0 */
  function parseAmount(text) {
    var s = String(text || '').replace(/\s/g, '').replace('.', ',');
    return /^\d{1,9}(,\d{1,2})?$/.test(s) ? parseTyped(s) : 0;
  }
  function balance(all) {
    var sum = 0;
    Object.keys(all || {}).forEach(function (m) { all[m].forEach(function (op) { sum += (op.k === 'i' ? 1 : -1) * bynOf(op); }); });
    return sum;
  }

  /** все записи таблицей: sep '\t' для вставки в Excel из буфера, ';' для файла CSV */
  function table(all, sep) {
    function num(minor) { return Math.floor(minor / 100) + ',' + pad(minor % 100); }
    var rows = [['Дата', 'Вид', 'Категория', 'Сумма', 'Валюта', 'Сумма в BYN', 'Заметка']], ops = [];
    Object.keys(all || {}).forEach(function (m) { ops = ops.concat(all[m]); });
    ops.sort(function (x, y) { return x.d === y.d ? (x.id < y.id ? -1 : 1) : (x.d < y.d ? -1 : 1); });
    ops.forEach(function (op) {
      var d = op.d.split('-'), note = op.n || '';
      if (/^[=+\-@]/.test(note)) { note = "'" + note; } // Excel принял бы такую заметку за формулу
      rows.push([d[2] + '.' + d[1] + '.' + d[0], isGoalOp(op) ? (op.k === 'e' ? 'Отложено' : 'Снято') : (op.k === 'e' ? 'Трата' : 'Доход'), dict(op.k, op.c).name, num(op.a), op.u, num(bynOf(op)), note]);
    });
    return rows.map(function (r) {
      return r.map(function (cell) {
        cell = String(cell).replace(/[\t\r\n]/g, ' ');
        return sep === ';' ? '"' + cell.replace(/"/g, '""') + '"' : cell;
      }).join(sep);
    }).join('\r\n');
  }

  // ---------- перенос из заметок: разбор списка и подбор категорий ----------
  var MONTH_RE = ['январ[ья]', 'феврал[ья]', 'марта?', 'апрел[ья]', 'ма[йя]', 'июн[ья]', 'июл[ья]', 'августа?', 'сентябр[ья]', 'октябр[ья]', 'ноябр[ья]', 'декабр[ья]'];
  var NOTES_MAX = 200; // столько записей помещается в один перенос: список их id для отмены обязан влезть в одно значение хранилища
  function monthByWord(w) {
    for (var i = 0; i < 12; i++) { if (new RegExp('^' + MONTH_RE[i] + '$').test(w)) { return i + 1; } }
    return 0;
  }
  // сумма в строке: знак, число (тысячи через пробел, копейки через запятую или точку), слово валюты
  var AMOUNT_RE = /(^|[\s(:=])([+\-−–—])?\s?(\d{1,3}(?: \d{3})+|\d+)(?:[.,](\d{1,2}))?(?!\d)\s?(руб(?:лей|ля|ль)?\.?|р\.?|byn|br|\$|usd|дол(?:ларов|лара|лар|л)?\.?|€|eur|евро)?(?=$|[\s).,;:!])/gi;
  var INCOME_RE = /(^|\s)(зарплат|аванс|преми|стипенд|пенси|зп(\s|$))/i;

  /** Список из заметок → записи. Строка: сумма и на что, в любом порядке. Дата отдельной строкой («10.10», «12 октября», «Сентябрь») относится к строкам под ней,
      дата в начале или в конце строки — только к этой строке; без даты запись получает сегодняшнюю. Плюс перед суммой или слово «зарплата» означает доход.
      Строки без суммы не теряются: они возвращаются отдельно (skipped), чтобы человек их увидел. now — сегодняшняя дата, для теста */
  function parseNotes(text, now) {
    now = now || today();
    var year = +now.slice(0, 4), cur = now, items = [], skipped = [], more = false;
    function plain(y, m, d) { // настоящая дата не позже сегодняшней, иначе это не дата
      if (m < 1 || m > 12 || d < 1 || d > new Date(y, m, 0).getDate()) { return ''; }
      var s = y + '-' + pad(m) + '-' + pad(d);
      return s > now ? '' : s;
    }
    function fix(m, d) { return plain(year, m, d) || plain(year - 1, m, d); } // без года: в будущем быть не может, значит прошлый год
    function numDate(tok) { // «12.10», «12.10.25», «12/10/2026»
      var m = /^(\d{1,2})[.\/](\d{1,2})(?:[.\/](\d{2}|\d{4}))?$/.exec(tok);
      if (!m) { return ''; }
      return m[3] ? plain(m[3].length === 2 ? 2000 + (+m[3]) : +m[3], +m[2], +m[1]) : fix(+m[2], +m[1]);
    }
    function wordDate(day, word, y) { var m = monthByWord(word); return m ? (y ? plain(+y, m, +day) : fix(m, +day)) : ''; }
    function wholeDate(s) { // вся строка — дата
      if (s === 'сегодня') { return now; }
      if (s === 'вчера') { return shiftDay(now, -1); }
      if (s === 'позавчера') { return shiftDay(now, -2); }
      var m = /^(\d{1,2}) ([а-яё]+)(?: (\d{4}))?(?: ?г)?$/.exec(s);
      if (m) { return wordDate(m[1], m[2], m[3]); }
      m = /^([а-яё]+)(?: (\d{4}))?(?: ?г)?$/.exec(s);
      if (m && monthByWord(m[1])) { return wordDate(1, m[1], m[2]); } // месяц без числа: записи встают на первое число
      return numDate(s);
    }
    String(text === undefined || text === null ? '' : text).split(/\r?\n/).forEach(function (raw) {
      var line = raw.replace(/[   \t]/g, ' ').replace(/[​-‍﻿]/g, '').replace(/\s+/g, ' ').replace(/^ | $/g, '');
      line = line.replace(/^[•*·]\s*/, '').replace(/^[-–—]\s+/, ''); // маркер списка
      if (!line) { return; }
      var head = line.toLowerCase().replace(/^(пн|вт|ср|чт|пт|сб|вс|понедельник|вторник|среда|четверг|пятница|суббота|воскресенье)[,.]? /, '').replace(/[:.,]$/, '');
      var whole = wholeDate(head);
      if (whole) { cur = whole; return; }
      var date = cur, rest = line, toks = line.split(' '), d;
      function hasNumber(s) { return /\d/.test(s); }
      if (toks.length > 1) { // дата в начале или в конце строки, если кроме неё есть число для суммы
        d = numDate(toks[0].replace(/[:.,)]$/, ''));
        if (d && hasNumber(toks.slice(1).join(' '))) { date = d; rest = toks.slice(1).join(' '); }
        else if (toks.length > 2 && /^\d{1,2}$/.test(toks[0]) && (d = wordDate(toks[0], toks[1].toLowerCase().replace(/[:.,]$/, ''))) && hasNumber(toks.slice(2).join(' '))) { date = d; rest = toks.slice(2).join(' '); }
        else {
          d = numDate(toks[toks.length - 1]);
          if (d && /[.\/]/.test(toks[toks.length - 1]) && hasNumber(toks.slice(0, -1).join(' ')) && amounts(toks.slice(0, -1).join(' ')).length) { date = d; rest = toks.slice(0, -1).join(' '); }
        }
      }
      var found = amounts(rest), pick = null;
      found.forEach(function (f) { if (f.cur || f.plus) { pick = pick || f; } });
      pick = pick || found[found.length - 1] || null; // чисел несколько: сумма та, что с валютой или плюсом, иначе последняя
      if (!pick) { skipped.push({ raw: cleanNote(line), d: cur }); return; }
      var note = cleanNote((rest.slice(0, pick.from) + ' ' + rest.slice(pick.to)).replace(/^[\s\-–—:;,=.]+|[\s\-–—:;,=.]+$/g, '').replace(/\s+/g, ' '));
      if (items.length >= NOTES_MAX) { more = true; return; }
      items.push({ d: date, k: pick.plus || INCOME_RE.test(note) ? 'i' : 'e', a: pick.minor, u: pick.cur || 'BYN', n: note });
    });
    return { items: items, skipped: skipped, more: more };
  }
  /** все суммы в строке: { minor, cur, plus, from, to } */
  function amounts(s) {
    var out = [], m, re = new RegExp(AMOUNT_RE.source, 'gi');
    while ((m = re.exec(s))) {
      var whole = m[3].replace(/ /g, ''), minor = whole.length > 7 ? 0 : (+whole) * 100 + (m[4] ? +((m[4] + '0').slice(0, 2)) : 0);
      var c = (m[5] || '').toLowerCase(), cur = !c ? '' : /^(\$|usd|дол)/.test(c) ? 'USD' : /^(€|eur|евро)/.test(c) ? 'EUR' : 'BYN';
      if (minor > 0) { out.push({ minor: minor, cur: cur, plus: m[2] === '+', from: m.index + m[1].length, to: m.index + m[0].length }); }
      if (re.lastIndex === m.index) { re.lastIndex++; }
    }
    return out;
  }

  // по каким словам заметки узнаётся категория. Названия у людей свои, а значок у категории общий: слова привязаны к значку.
  // Знак «=» в начале: слово должно совпасть целиком (короткие слова иначе ловят чужое: «газ» в «магазине»)
  var HINTS = [
    [['cart'], 'магазин продукт еда евроопт гиппо соседи корона санта грин рынок хлеб молок мясо овощ фрукт =алми виталюр'],
    [['cup'], 'кофе кафе ресторан пицц суши бургер столов обед ужин завтрак шаурм перекус доставк макдон =мак =kfc =кфс'],
    [['bus'], 'такси автобус метро проезд маршрутк троллейбус трамва электричк поезд самокат =яндекс'],
    [['car'], 'бензин заправк азс мойка шиномонтаж запчаст парковк стоянк страховк техосмотр =сто'],
    [['home'], 'квартир аренд коммунал жкх ипотек электричеств =свет =вода =газ =жировка'],
    [['phone'], 'телефон связь интернет мтс =а1 =a1 =life =лайф тариф'],
    [['heart', 'pill'], 'аптек врач лекарств анализ стоматолог зубн массаж остеопат невролог больниц поликлиник медцентр медосмотр =узи'],
    [['star', 'drop'], 'парикмахер стрижк маникюр педикюр косметик ногти салон барбер уход крем шампун'],
    [['shirt'], 'одежд обув куртк ботинк кроссовк джинс секонд плать футболк'],
    [['box'], 'хозтовар посуд бытов химия мебель =мила'],
    [['users'], 'детям ребенк сыну дочк садик'],
    [['gift'], 'подарок подарк подарил цветы букет =др'],
    [['ticket', 'spark'], 'кино театр концерт боулинг клуб развлеч бар'],
    [['repeat'], 'подписк spotify netflix youtube icloud кинопоиск'],
    [['book'], 'курс учеб книг репетитор школа'],
    [['paw'], 'корм ветеринар кошк собак =кот'],
    [['card'], 'кредит рассрочк'],
    [['plane'], 'отпуск отель билет самолет'],
    [['tool'], 'ремонт стройматериал краск инструмент'],
    [['case'], 'зарплат аванс преми оклад =зп'],
    [['laptop'], 'фриланс заказ подработ сайт']
  ];
  function wordsOf(s) { return String(s).toLowerCase().replace(/ё/g, 'е').split(/[^a-zа-я0-9]+/).filter(Boolean); }
  /** категория для заметки из списка человека (list: его видимые категории или источники). Возвращает { id, sure, guess }:
      уверенно — если он уже относил такую заметку сюда, если слово заметки известно или похоже на название категории;
      иначе id пустой, а guess — две категории, которыми он пользуется чаще всего */
  function guessCat(note, kind, list, all) {
    var key = String(note).toLowerCase(), words = wordsOf(note), count = {}, used = {}, best = '', i, j;
    Object.keys(all || {}).forEach(function (m) {
      all[m].forEach(function (op) {
        if (op.k !== kind || !find(list, op.c)) { return; }
        used[op.c] = (used[op.c] || 0) + 1;
        if (key && (op.n || '').toLowerCase() === key) { count[op.c] = (count[op.c] || 0) + 1; }
      });
    });
    Object.keys(count).forEach(function (id) { if (!best || count[id] > count[best]) { best = id; } });
    if (best) { return { id: best, sure: true }; }
    for (i = 0; i < HINTS.length; i++) {
      var hit = HINTS[i][1].split(' ').some(function (h) {
        var exact = h.charAt(0) === '=', w = exact ? h.slice(1) : h;
        return words.some(function (x) { return exact ? x === w : x.indexOf(w) === 0; });
      });
      if (!hit) { continue; }
      for (j = 0; j < list.length; j++) { if (HINTS[i][0].indexOf(list[j].icon) >= 0) { return { id: list[j].id, sure: true }; } }
    }
    for (j = 0; j < list.length; j++) { // слово заметки похоже на название категории: «подарок Лене» и «Подарки»
      var names = wordsOf(list[j].name).filter(function (w) { return w.length >= 4; });
      var same = names.some(function (w) { var stem = w.slice(0, Math.max(4, w.length - 2)); return words.some(function (x) { return x.indexOf(stem) === 0; }); });
      if (same) { return { id: list[j].id, sure: true }; }
    }
    var top = list.map(function (c) { return c.id; }).sort(function (x, y) { return (used[y] || 0) - (used[x] || 0); }).slice(0, 2);
    return { id: '', sure: false, guess: top };
  }
  /** id записи из заметок: одинаковая строка даёт тот же id, поэтому повторная вставка списка дублей не создаёт.
      seq — номер среди одинаковых строк одного переноса: две одинаковые покупки в один день не сливаются */
  function noteId(key, seq) {
    var h = 2166136261, s = String(key);
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0; }
    return 'n' + ('000000' + h.toString(36)).slice(-7) + (seq || 0).toString(36);
  }
  /** «10 октября», «с 10 по 12 октября», «с 28 сентября по 12 октября» */
  function period(a, b) {
    var t = today().slice(0, 4);
    function day(d, month) { var p = d.split('-'); return (+p[2]) + (month ? NB + MONTHS_GEN[+p[1] - 1] + (p[0] === t ? '' : NB + p[0]) : ''); }
    if (a === b) { return day(a, true); }
    return 'с' + NB + day(a, a.slice(0, 7) !== b.slice(0, 7)) + ' по' + NB + day(b, true);
  }
  /** «с августа по октябрь» для записей за несколько месяцев; один месяц — пусто */
  function monthsSpan(a, b) {
    if (a === b) { return ''; }
    return 'с' + NB + MONTHS_GEN[+a.slice(5, 7) - 1] + ' по' + NB + MONTHS[+b.slice(5, 7) - 1].toLowerCase();
  }

  g.FIN = {
    NB: NB, CATS: CATS, SRCS: SRCS, CURS: CURS, RATES: RATES,
    today: today, monthOf: monthOf, isDate: isDate, isMonth: isMonth, shiftDay: shiftDay,
    fmt: fmt, fmtParts: fmtParts, fmtShort: fmtShort, fmtRate: fmtRate, parseTyped: parseTyped, typed: typed, press: press,
    toByn: toByn, bynOf: bynOf, find: find, makeOp: makeOp, validOp: validOp, pack: pack, unpack: unpack, cleanNote: cleanNote, utf8len: utf8len, parseBackup: parseBackup,
    plural: plural, summarize: summarize, byDays: byDays, dayLabel: dayLabel, monthLabel: monthLabel,
    prevMonth: prevMonth, inMonth: inMonth, daysLeft: daysLeft, perDay: perDay, fmtDay: fmtDay, frequent: frequent, validGoal: validGoal, parseAmount: parseAmount, balance: balance, table: table,
    validList: validList, useCfg: useCfg, dict: dict, OFF: OFF, STARTER: STARTER, STARTER_ON: STARTER_ON, LIST_MAX: LIST_MAX, packList: packList, builtin: builtin, catId: catId,
    GOALS: GOALS, GOALS_MAX: GOALS_MAX, validGoals: validGoals, packGoals: packGoals, isGoalOp: isGoalOp, goalOf: goalOf, goalAmount: goalAmount, goalByn: goalByn, goalState: goalState, goalForecast: goalForecast,
    parseNotes: parseNotes, guessCat: guessCat, noteId: noteId, period: period, monthsSpan: monthsSpan, NOTES_MAX: NOTES_MAX,
    WEEKDAYS_SHORT: WEEKDAYS_SHORT, MONTHS_GEN: MONTHS_GEN, dow: dow, daysBetween: daysBetween, lastDay: lastDay, statsPeriod: statsPeriod, periodShift: periodShift, inRange: inRange, rangeStats: rangeStats,
    catRows: catRows, catChanges: catChanges, topNotes: topNotes, weekdayAvg: weekdayAvg, cumulative: cumulative, firstDate: firstDate,
    CREDITS: CREDITS, CREDITS_MAX: CREDITS_MAX, REMIND: REMIND, CLOSED: CLOSED, validCredits: validCredits, useCredits: useCredits, packCredits: packCredits,
    isCreditOp: isCreditOp, creditOf: creditOf, creditState: creditState, creditDue: creditDue, creditPlan: creditPlan
  };
})(window);
