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
  /** применить настройки: свои категории и источники, если они заданы, иначе встроенные */
  function useCfg(cfg) {
    setList(CATS, BASE_CATS, cfg ? validList(cfg.cats) : null);
    setList(SRCS, BASE_SRCS, cfg ? validList(cfg.srcs) : null);
  }
  /** категория записи по id. Записи с категорией, которой нет в списке (список сменили), не теряются: они «без категории» */
  function dict(kind, id) {
    return find(kind === 'i' ? SRCS : CATS, id) || { id: id, name: 'Без категории', icon: 'dots' };
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
      if (!cfg.goal && !cfg.cats && !cfg.srcs) { cfg = null; }
    }
    return count ? { months: months, count: count, cfg: cfg } : null;
  }

  function plural(n, one, few, many) {
    var a = Math.abs(n) % 100, b = a % 10;
    if (a > 10 && a < 20) { return many; }
    if (b > 1 && b < 5) { return few; }
    return b === 1 ? one : many;
  }

  /** сводка месяца: всё в рублях (копейки) */
  function summarize(ops) {
    var spent = 0, income = 0, cats = {}, srcs = {};
    ops.forEach(function (op) {
      var b = bynOf(op), bucket = op.k === 'e' ? cats : srcs;
      if (op.k === 'e') { spent += b; } else { income += b; }
      var row = bucket[op.c] || (bucket[op.c] = { id: op.c, sum: 0, foreign: {} });
      row.sum += b;
      if (op.u !== 'BYN') { row.foreign[op.u] = (row.foreign[op.u] || 0) + op.a; }
    });
    function rows(bucket, list) {
      return Object.keys(bucket).map(function (id) {
        var c = find(list, id) || { id: id, name: 'Без категории', icon: 'dots' }, r = bucket[id];
        return { id: c.id, name: c.name, icon: c.icon, sum: r.sum, note: CURS.filter(function (u) { return r.foreign[u]; }).map(function (u) { return fmtShort(r.foreign[u]) + NB + u; }).join(', ') };
      }).sort(function (x, y) { return y.sum - x.sum; });
    }
    return { spent: spent, income: income, left: income - spent, cats: rows(cats, CATS), srcs: rows(srcs, SRCS) };
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
        if (op.k !== kind || op.d < from || op.d > now) { return; }
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
      rows.push([d[2] + '.' + d[1] + '.' + d[0], op.k === 'e' ? 'Трата' : 'Доход', dict(op.k, op.c).name, num(op.a), op.u, num(bynOf(op)), note]);
    });
    return rows.map(function (r) {
      return r.map(function (cell) {
        cell = String(cell).replace(/[\t\r\n]/g, ' ');
        return sep === ';' ? '"' + cell.replace(/"/g, '""') + '"' : cell;
      }).join(sep);
    }).join('\r\n');
  }

  g.FIN = {
    NB: NB, CATS: CATS, SRCS: SRCS, CURS: CURS, RATES: RATES,
    today: today, monthOf: monthOf, isDate: isDate, isMonth: isMonth, shiftDay: shiftDay,
    fmt: fmt, fmtParts: fmtParts, fmtShort: fmtShort, fmtRate: fmtRate, parseTyped: parseTyped, typed: typed, press: press,
    toByn: toByn, bynOf: bynOf, find: find, makeOp: makeOp, validOp: validOp, pack: pack, unpack: unpack, cleanNote: cleanNote, utf8len: utf8len, parseBackup: parseBackup,
    plural: plural, summarize: summarize, byDays: byDays, dayLabel: dayLabel, monthLabel: monthLabel,
    prevMonth: prevMonth, inMonth: inMonth, daysLeft: daysLeft, perDay: perDay, fmtDay: fmtDay, frequent: frequent, validGoal: validGoal, parseAmount: parseAmount, balance: balance, table: table,
    validList: validList, useCfg: useCfg, dict: dict
  };
})(window);
