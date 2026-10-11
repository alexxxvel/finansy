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
  var CURS = ['BYN', 'USD', 'EUR'];
  // закреплённый курс (решение 11.10.2026): в записи хранится курс на момент ввода, поэтому смена числа здесь не трогает прошлые записи
  var RATES = { BYN: 1, USD: 3.06, EUR: 3.43 };

  var MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
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

  function newId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function find(list, id) { for (var i = 0; i < list.length; i++) { if (list[i].id === id) { return list[i]; } } return null; }

  /** запись: d дата, k 'e' трата или 'i' доход, c категория или источник, a сумма в копейках исходной валюты, u валюта, r курс (если не BYN) */
  function makeOp(kind, cat, minor, cur, date, id) {
    var op = { id: id || newId(), d: date, k: kind === 'i' ? 'i' : 'e', c: cat, a: Math.round(minor), u: cur };
    if (cur !== 'BYN') { op.r = RATES[cur]; }
    return op;
  }
  function validOp(op) {
    return !!op && typeof op.id === 'string' && /^[a-z0-9]{4,24}$/.test(op.id) && isDate(op.d) && (op.k === 'e' || op.k === 'i')
      && !!find(op.k === 'e' ? CATS : SRCS, op.c) && typeof op.a === 'number' && isFinite(op.a) && op.a > 0 && op.a === Math.round(op.a) && op.a < 1e11
      && CURS.indexOf(op.u) >= 0 && (op.u === 'BYN' || (typeof op.r === 'number' && op.r > 0 && op.r < 1000));
  }
  /** запись → короткий массив для хранения (день вместо полной даты: месяц уже в ключе) */
  function pack(op) {
    var a = [op.id, +op.d.slice(8, 10), op.k === 'i' ? 1 : 0, op.c, op.a, CURS.indexOf(op.u)];
    if (op.u !== 'BYN') { a.push(op.r); }
    return a;
  }
  function unpack(a, month) {
    if (!a || typeof a.length !== 'number' || a.length < 6 || !isMonth(month)) { return null; }
    var op = { id: a[0], d: month + '-' + pad(+a[1] || 0), k: a[2] === 1 ? 'i' : 'e', c: a[3], a: a[4], u: CURS[a[5]] };
    if (op.u !== 'BYN') { op.r = a[6]; }
    return validOp(op) ? op : null;
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
    function rows(bucket, dict) {
      return dict.filter(function (c) { return bucket[c.id]; }).map(function (c) {
        var r = bucket[c.id];
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

  g.FIN = {
    NB: NB, CATS: CATS, SRCS: SRCS, CURS: CURS, RATES: RATES,
    today: today, monthOf: monthOf, isDate: isDate, isMonth: isMonth, shiftDay: shiftDay,
    fmt: fmt, fmtParts: fmtParts, fmtShort: fmtShort, fmtRate: fmtRate, parseTyped: parseTyped, typed: typed, press: press,
    toByn: toByn, bynOf: bynOf, find: find, makeOp: makeOp, validOp: validOp, pack: pack, unpack: unpack,
    plural: plural, summarize: summarize, byDays: byDays, dayLabel: dayLabel, monthLabel: monthLabel
  };
})(window);
