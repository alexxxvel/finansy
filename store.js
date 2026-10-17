/* Учёт финансов: хранилище. В Telegram записи лежат в его облаке (CloudStorage: до 1024 ключей на пользователя, значение до 4096 знаков),
   вне Telegram (проверка в браузере) — в памяти браузера. Месяц хранится кусками-ключами m_ГГГГ_ММ, m_ГГГГ_ММ_1, …
   Правило сохранности: любое изменение — ровно одна запись одного ключа, и перед ней кусок перечитывается из хранилища
   (вдруг его изменил второй телефон). Так прерванная связь не оставляет месяц наполовину записанным. */
(function (g) {
  'use strict';

  var F = g.FIN;
  var LIMIT = 3900; // запас до предела Telegram в 4096; считаем в байтах: заметки пишут кириллицей, а она вдвое длиннее
  var WAIT = 12000; // хранилище молчит дольше — считаем, что не сохранилось

  /** обёртка: ответ один раз, молчание = ошибка */
  function once(cb) {
    var done = false;
    var timer = setTimeout(function () { if (!done) { done = true; cb('timeout'); } }, WAIT);
    return function (err, res) { if (done) { return; } done = true; clearTimeout(timer); cb(err || null, res); };
  }

  function localAdapter(prefix) {
    function later(fn) { setTimeout(fn, 0); }
    return {
      kind: 'local',
      keys: function (cb) {
        later(function () {
          try {
            var out = [];
            for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k.indexOf(prefix) === 0) { out.push(k.slice(prefix.length)); } }
            cb(null, out);
          } catch (e) { cb('storage'); }
        });
      },
      get: function (keys, cb) {
        later(function () {
          try { var out = {}; keys.forEach(function (k) { out[k] = localStorage.getItem(prefix + k) || ''; }); cb(null, out); } catch (e) { cb('storage'); }
        });
      },
      set: function (key, value, cb) { later(function () { try { localStorage.setItem(prefix + key, value); cb(null); } catch (e) { cb('storage'); } }); },
      del: function (keys, cb) { later(function () { try { keys.forEach(function (k) { localStorage.removeItem(prefix + k); }); cb(null); } catch (e) { cb('storage'); } }); }
    };
  }

  function cloudAdapter(cs) {
    return {
      kind: 'cloud',
      keys: function (cb) { cb = once(cb); try { cs.getKeys(function (err, keys) { cb(err, keys || []); }); } catch (e) { cb('cloud'); } },
      get: function (keys, cb) {
        cb = once(cb);
        if (!keys.length) { cb(null, {}); return; }
        try { cs.getItems(keys, function (err, values) { cb(err, values || {}); }); } catch (e) { cb('cloud'); }
      },
      set: function (key, value, cb) { cb = once(cb); try { cs.setItem(key, value, function (err, ok) { cb(err || (ok === false ? 'not stored' : null)); }); } catch (e) { cb('cloud'); } },
      del: function (keys, cb) { cb = once(cb); if (!keys.length) { cb(null); return; } try { cs.removeItems(keys, function (err) { cb(err); }); } catch (e) { cb('cloud'); } }
    };
  }

  function chunkKey(month, i) { return 'm_' + month.replace('-', '_') + (i ? '_' + i : ''); }
  function parseKey(key) {
    var m = /^m_(\d{4})_(\d{2})(?:_(\d{1,3}))?$/.exec(String(key));
    return m ? { month: m[1] + '-' + m[2], i: m[3] ? +m[3] : 0 } : null;
  }
  function encode(ops) { return JSON.stringify(ops.map(F.pack)); }
  function size(ops) { return F.utf8len(encode(ops)); }
  function decode(text, month) {
    var arr;
    try { arr = JSON.parse(text || '[]'); } catch (e) { return null; } // null = кусок не читается: писать поверх него нельзя
    if (!arr || typeof arr.length !== 'number') { return null; }
    var out = [];
    for (var i = 0; i < arr.length; i++) { var op = F.unpack(arr[i], month); if (op) { out.push(op); } }
    return out;
  }

  /** настройки лежат отдельным ключом cfg: цель накопления, свои категории трат (cats) и источники дохода (srcs),
      скрытые категории и источники (catsOff, srcsOff), отметка «первый экран пройден» (seen) */
  function readCfg(text) {
    var o = null;
    try { o = JSON.parse(text || '{}'); } catch (e) { o = null; }
    var out = {};
    if (!o || typeof o !== 'object') { return out; }
    if (F.validGoal(o.goal)) { out.goal = { a: o.goal.a }; if (o.goal.n) { out.goal.n = o.goal.n; } }
    ['cats', 'srcs'].forEach(function (key) { if (F.validList(o[key])) { out[key] = F.validList(o[key]); } });
    ['cats', 'srcs'].forEach(function (key) { // скрытая категория не может одновременно стоять в списке
      var off = F.validList(o[key + 'Off']), on = {};
      if (!off) { return; }
      (out[key] || []).forEach(function (c) { on[c[0]] = 1; });
      off = off.filter(function (c) { return !on[c[0]]; });
      if (off.length) { out[key + 'Off'] = off; }
    });
    if (o.seen) { out.seen = 1; }
    if (F.validGoals(o.goals)) { out.goals = F.validGoals(o.goals); }
    if (typeof o.goalAsk === 'string' && /^[a-z0-9]{1,10}$/.test(o.goalAsk)) { out.goalAsk = o.goalAsk; } // у прежней цели ещё не спросили, сколько уже накоплено
    return out;
  }
  /** бюджет: отдельный ключ bud. Не читается — бюджета нет */
  function readBudget(text) {
    var o = null;
    try { o = JSON.parse(text || 'null'); } catch (e) { o = null; }
    return F.validBudget(o) || { a: 0, off: 0 };
  }
  /** кредиты: отдельный ключ crd. Не читается — пусто (записи от этого не страдают) */
  function readCredits(text) {
    var o = null;
    try { o = JSON.parse(text || '[]'); } catch (e) { o = null; }
    return F.validCredits(o) || [];
  }
  /** списки из копии добавляются к своим и ничего не затирают: недостающие категории дописываются, свои названия и порядок остаются.
      Своего списка ещё нет (действует встроенный) — берётся список из копии, а встроенные категории, которых в нём нет, уходят в скрытые:
      записи в них сохраняют название, вернуть их можно в настройках */
  function mergeLists(cur, inc, key, kind, used) {
    var off = key + 'Off', base = F.builtin(kind), have = {}, changed = false;
    function mark(list) { (list || []).forEach(function (c) { have[c[0]] = 1; }); }
    function addTo(name, list) {
      (list || []).forEach(function (c) {
        if (have[c[0]] || (cur[key] || []).length + (cur[off] || []).length >= F.LIST_MAX) { return; }
        have[c[0]] = 1;
        (cur[name] = cur[name] || []).push(c);
        changed = true;
      });
    }
    if (!cur[key] && !inc[key] && !inc[off]) { return false; } // и тут, и там встроенный список
    if (!cur[key]) {
      if (inc[key]) { cur[key] = inc[key].slice(); changed = true; mark(cur[key]); mark(cur[off]); addTo(off, inc[off]); addTo(off, base); return changed; }
      cur[key] = base.slice(); // в копии только скрытые: свой список становится явным
      changed = true;
    }
    mark(cur[key]);
    mark(cur[off]);
    addTo(key, inc[key]);
    addTo(off, inc[off]);
    if (!inc[key]) { addTo(off, base.filter(function (c) { return used[c[0]]; })); } // копия сделана со встроенным списком: названия его категорий нужны её записям
    return changed;
  }

  function Store(ad) {
    /** куски месяца: [{i, ops}] по возрастанию номера */
    function chunks(month, cb) {
      ad.keys(function (err, keys) {
        if (err) { cb(err); return; }
        var mine = keys.map(function (k) { var p = parseKey(k); return p && p.month === month ? { key: k, i: p.i } : null; }).filter(Boolean).sort(function (a, b) { return a.i - b.i; });
        ad.get(mine.map(function (c) { return c.key; }), function (err2, values) {
          if (err2) { cb(err2); return; }
          var out = [];
          for (var n = 0; n < mine.length; n++) {
            var ops = decode(values[mine[n].key], month);
            if (ops === null) { cb('corrupt'); return; }
            out.push({ i: mine[n].i, ops: ops });
          }
          cb(null, out);
        });
      });
    }
    function flat(list) {
      var seen = {}, out = [];
      list.forEach(function (c) { c.ops.forEach(function (op) { if (!seen[op.id]) { seen[op.id] = 1; out.push(op); } }); });
      return out;
    }
    function write(month, chunk, cb) {
      if (!chunk.ops.length) { ad.del([chunkKey(month, chunk.i)], cb); return; }
      var text = encode(chunk.ops);
      if (F.utf8len(text) > 4096) { cb('too long'); return; }
      ad.set(chunkKey(month, chunk.i), text, cb);
    }
    /** добавить записи в месяц: в последний кусок, пока помещаются, иначе в новый. Каждый шаг — одна запись одного ключа */
    function append(month, ops, cb) {
      chunks(month, function (err, list) {
        if (err) { cb(err); return; }
        var have = {};
        flat(list).forEach(function (op) { have[op.id] = 1; });
        var fresh = ops.filter(function (op) { return !have[op.id]; });
        var added = fresh.length, ids = fresh.map(function (op) { return op.id; });
        (function next() {
          if (!fresh.length) { cb(null, added, ids); return; }
          var last = list.length ? list[list.length - 1] : null;
          var target = last && size(last.ops.concat([fresh[0]])) <= LIMIT ? last : null;
          if (!target) { target = { i: last ? last.i + 1 : 0, ops: [] }; list.push(target); }
          while (fresh.length && size(target.ops.concat([fresh[0]])) <= LIMIT) { target.ops.push(fresh.shift()); }
          if (!target.ops.length) { cb('too long'); return; }
          write(month, target, function (err2) { if (err2) { cb(err2); } else { next(); } });
        })();
      });
    }
    function removeFrom(month, id, cb) {
      chunks(month, function (err, list) {
        if (err) { cb(err); return; }
        var hit = null;
        list.forEach(function (c) { if (F.find(c.ops, id)) { hit = c; } });
        if (!hit) { cb(null); return; }
        hit.ops = hit.ops.filter(function (op) { return op.id !== id; });
        write(month, hit, cb);
      });
    }

    return {
      kind: ad.kind,
      /** месяцы, в которых есть записи, свежие сверху */
      months: function (cb) {
        ad.keys(function (err, keys) {
          if (err) { cb(err); return; }
          var seen = {}, out = [];
          keys.forEach(function (k) { var p = parseKey(k); if (p && !seen[p.month]) { seen[p.month] = 1; out.push(p.month); } });
          cb(null, out.sort().reverse());
        });
      },
      load: function (month, cb) { chunks(month, function (err, list) { cb(err, err ? null : flat(list)); }); },
      /** всё для экрана месяца одним чтением: месяцы с записями, записи месяца и остаток на его начало (в копейках).
          Остаток = доходы минус траты прошлых месяцев, начиная с первого месяца, где записан доход: если человек вёл только траты,
          эти месяцы не превращаются в долг. Нечитаемый кусок чужого месяца не мешает открыть текущий: partial = true */
      view: function (month, cb) {
        ad.keys(function (err, keys) {
          if (err) { cb(err); return; }
          var mine = keys.map(function (k) { var p = parseKey(k); return p ? { key: k, month: p.month, i: p.i } : null; }).filter(Boolean)
            .sort(function (a, b) { return a.month === b.month ? a.i - b.i : (a.month < b.month ? -1 : 1); });
          ad.get(mine.map(function (c) { return c.key; }).concat(keys.indexOf('cfg') >= 0 ? ['cfg'] : [], keys.indexOf('crd') >= 0 ? ['crd'] : [], keys.indexOf('bud') >= 0 ? ['bud'] : []), function (err2, values) {
            if (err2) { cb(err2); return; }
            var months = {}, ops = [], carry = 0, partial = false, seen = {}, all = {}, net = {}, first = '';
            for (var n = 0; n < mine.length; n++) {
              var c = mine[n], list = decode(values[c.key], c.month);
              if (list === null) { if (c.month === month) { cb('corrupt'); return; } partial = true; continue; }
              for (var j = 0; j < list.length; j++) {
                var op = list[j];
                if (seen[op.id]) { continue; }
                seen[op.id] = 1;
                months[c.month] = 1;
                (all[c.month] = all[c.month] || []).push(op);
                if (c.month === month) { ops.push(op); }
                net[c.month] = (net[c.month] || 0) + (op.k === 'i' ? 1 : -1) * F.bynOf(op);
                if (op.k === 'i' && (!first || c.month < first)) { first = c.month; }
              }
            }
            Object.keys(net).forEach(function (m) { if (first && m >= first && m < month) { carry += net[m]; } });
            cb(null, { months: Object.keys(months).sort().reverse(), ops: ops, carry: carry, partial: partial, all: all, cfg: readCfg(values.cfg), credits: readCredits(values.crd), budget: readBudget(values.bud) });
          });
        });
      },
      add: function (op, cb) {
        if (!F.validOp(op)) { cb('invalid'); return; }
        append(F.monthOf(op.d), [op], function (err) { cb(err); });
      },
      /** правка записи: тот же id. Месяц сменился — сначала пишем в новый, потом убираем из старого (при сбое запись не теряется) */
      update: function (op, prevMonth, cb) {
        if (!F.validOp(op)) { cb('invalid'); return; }
        var month = F.monthOf(op.d);
        if (month !== prevMonth) {
          append(month, [op], function (err) { if (err) { cb(err); return; } removeFrom(prevMonth, op.id, cb); });
          return;
        }
        chunks(month, function (err, list) {
          if (err) { cb(err); return; }
          var hit = null;
          list.forEach(function (c) { if (F.find(c.ops, op.id)) { hit = c; } });
          if (!hit) { append(month, [op], function (e) { cb(e); }); return; }
          hit.ops = hit.ops.map(function (x) { return x.id === op.id ? op : x; });
          write(month, hit, cb);
        });
      },
      remove: function (id, month, cb) { removeFrom(month, id, cb); },
      /** добавить записи пачкой (перенос из заметок). Уже существующие id пропускаются. Отдаёт, что добавлено: [{ id, m }];
          при сбое на середине — ошибку и то, что успело сохраниться в прошлых месяцах (повтор допишет остальное, дублей не будет) */
      addOps: function (ops, cb) {
        var byMonth = {}, done = [];
        for (var i = 0; i < ops.length; i++) {
          if (!F.validOp(ops[i])) { cb('invalid', done); return; }
          var m = F.monthOf(ops[i].d);
          (byMonth[m] = byMonth[m] || []).push(ops[i]);
        }
        var months = Object.keys(byMonth).sort();
        (function next() {
          if (!months.length) { cb(null, done); return; }
          var month = months.shift();
          append(month, byMonth[month], function (err, added, ids) {
            if (err) { cb(err, done); return; }
            ids.forEach(function (id) { done.push({ id: id, m: month }); });
            next();
          });
        })();
      },
      /** убрать записи пачкой (отмена переноса): в каждом куске одна запись ключа. Отдаёт, сколько убрано */
      removeOps: function (list, cb) {
        var byMonth = {}, removed = 0;
        list.forEach(function (x) { (byMonth[x.m] = byMonth[x.m] || {})[x.id] = 1; });
        var months = Object.keys(byMonth).sort();
        (function next() {
          if (!months.length) { cb(null, removed); return; }
          var month = months.shift(), gone = byMonth[month];
          chunks(month, function (err, parts) {
            if (err) { cb(err, removed); return; }
            var dirty = parts.filter(function (c) { return c.ops.some(function (op) { return gone[op.id]; }); });
            (function step() {
              if (!dirty.length) { next(); return; }
              var c = dirty.shift(), was = c.ops.length;
              c.ops = c.ops.filter(function (op) { return !gone[op.id]; });
              write(month, c, function (err2) { if (err2) { cb(err2, removed); return; } removed += was - c.ops.length; step(); });
            })();
          });
        })();
      },
      /** последний перенос из заметок: { at: дата, m: { месяц: [id, …] } }. Лежит отдельным ключом imp, чтобы перенос можно было отменить позже */
      lastImport: function (cb) {
        ad.get(['imp'], function (err, values) {
          if (err) { cb(err); return; }
          var o = null;
          try { o = JSON.parse(values.imp || 'null'); } catch (e) { o = null; }
          if (!o || !F.isDate(o.at) || !o.m || typeof o.m !== 'object') { cb(null, null); return; }
          var out = { at: o.at, m: {} }, n = 0;
          Object.keys(o.m).forEach(function (month) {
            if (!F.isMonth(month) || !o.m[month] || typeof o.m[month].length !== 'number') { return; }
            var ids = o.m[month].filter(function (id) { return typeof id === 'string' && /^[a-z0-9]{4,24}$/.test(id); });
            if (ids.length) { out.m[month] = ids; n += ids.length; }
          });
          cb(null, n ? out : null);
        });
      },
      setLastImport: function (rec, cb) {
        if (!rec) { ad.del(['imp'], cb); return; }
        var text = JSON.stringify(rec);
        if (F.utf8len(text) > LIMIT) { ad.del(['imp'], cb); return; } // не поместилось: отмена останется только в сообщении сразу после переноса
        ad.set('imp', text, cb);
      },
      /** правка настроек: ключ перечитывается (вдруг его изменил второй телефон), меняется только названное, пишется одной записью.
          В patch значение null убирает настройку */
      patchCfg: function (patch, cb) {
        ad.get(['cfg'], function (err, values) {
          if (err) { cb(err); return; }
          var cur = readCfg(values.cfg);
          Object.keys(patch || {}).forEach(function (key) { if (patch[key] === null) { delete cur[key]; } else { cur[key] = patch[key]; } });
          var next = readCfg(JSON.stringify(cur)), text = JSON.stringify(next);
          if (F.utf8len(text) > 4096) { cb('too long'); return; }
          ad.set('cfg', text, function (err2) { cb(err2, next); });
        });
      },
      /** бюджет пишется одной записью: { a, off }; ничего не задано — ключ убирается */
      setBudget: function (b, cb) {
        var v = F.validBudget(b);
        if (!v) { cb('invalid'); return; }
        if (!v.a && !v.off) { ad.del(['bud'], function (err) { cb(err || null, v); }); return; }
        ad.set('bud', JSON.stringify(v), function (err) { cb(err, v); });
      },
      /** правка кредитов: ключ перечитывается, fn получает список для хранения и возвращает новый; пустой список убирает ключ */
      patchCredits: function (fn, cb) {
        ad.get(['crd'], function (err, values) {
          if (err) { cb(err); return; }
          var next = F.validCredits(fn(readCredits(values.crd)));
          if (!next) { cb('invalid'); return; }
          if (!next.length) { ad.del(['crd'], function (err2) { cb(err2 || null, next); }); return; }
          var text = JSON.stringify(next);
          if (F.utf8len(text) > LIMIT) { cb('too long'); return; }
          ad.set('crd', text, function (err2) { cb(err2, next); });
        });
      },
      /** копия всех записей текстом */
      exportAll: function (cb) {
        ad.keys(function (err, keys) {
          if (err) { cb(err); return; }
          var mine = keys.filter(parseKey).sort();
          ad.get(mine.concat(keys.indexOf('cfg') >= 0 ? ['cfg'] : [], keys.indexOf('crd') >= 0 ? ['crd'] : [], keys.indexOf('bud') >= 0 ? ['bud'] : []), function (err2, values) {
            if (err2) { cb(err2); return; }
            var months = {}, count = 0, bad = false;
            mine.forEach(function (k) {
              var p = parseKey(k), ops = decode(values[k], p.month);
              if (ops === null) { bad = true; return; }
              months[p.month] = (months[p.month] || []).concat(ops.map(F.pack));
              count += ops.length;
            });
            if (bad) { cb('corrupt'); return; }
            var out = { app: 'finansy', v: 1, at: new Date().toISOString(), months: months }, cfg = readCfg(values.cfg);
            delete cfg.seen; // отметка о первом экране к записям не относится
            delete cfg.goalAsk;
            if (Object.keys(cfg).length) { out.cfg = cfg; }
            var credits = readCredits(values.crd);
            if (credits.length) { out.credits = credits; }
            var budget = readBudget(values.bud);
            if (budget.a) { out.budget = { a: budget.a }; }
            cb(null, { text: JSON.stringify(out), count: count });
          });
        });
      },
      /** восстановление из копии: только добавляет недостающие записи, существующие не трогает и ничего не удаляет */
      importAll: function (text, cb) {
        var data = F.parseBackup(text);
        if (!data) { cb('format'); return; }
        var jobs = Object.keys(data.months).sort().map(function (month) { return { month: month, ops: data.months[month] }; });
        var total = 0, used = { e: {}, i: {} }; // в каких категориях у копии есть записи
        jobs.forEach(function (job) { job.ops.forEach(function (op) { used[op.k][op.c] = 1; }); });
        function goal() { // настройки из копии ничего своего не затирают: цель берётся, если своей нет, категории дописываются к своим
          ad.get(['cfg'], function (err, values) {
            if (err) { cb(null, total); return; }
            var cur = readCfg(values.cfg), inc = readCfg(JSON.stringify(data.cfg || {})), changed = false;
            if (!cur.goal && !cur.goals && !inc.goals && inc.goal) { cur.goal = inc.goal; changed = true; } // прежняя единственная цель: приложение само переведёт её в новый вид
            (inc.goals || []).forEach(function (g) { // цели из копии дописываются к своим, свои не меняются
              var mine = cur.goals || [];
              if (mine.length >= F.GOALS_MAX || mine.some(function (x) { return x[0] === g[0]; })) { return; }
              cur.goals = mine.concat([g]);
              changed = true;
            });
            if (mergeLists(cur, inc, 'cats', 'e', used.e)) { changed = true; }
            if (mergeLists(cur, inc, 'srcs', 'i', used.i)) { changed = true; }
            var text = JSON.stringify(readCfg(JSON.stringify(cur)));
            if (!changed || F.utf8len(text) > 4096) { credits(); return; }
            ad.set('cfg', text, function () { credits(); });
          });
        }
        function budget() { // бюджет из копии берётся, только если своего нет
          if (!data.budget) { cb(null, total); return; }
          ad.get(['bud'], function (err, values) {
            if (err || readBudget(values.bud).a) { cb(null, total); return; }
            ad.set('bud', JSON.stringify({ a: data.budget.a, off: 0 }), function () { cb(null, total); });
          });
        }
        function credits() { // кредиты из копии дописываются к своим, свои не меняются
          if (!data.credits) { budget(); return; }
          ad.get(['crd'], function (err, values) {
            if (err) { cb(null, total); return; }
            var mine = readCredits(values.crd), changed = false;
            data.credits.forEach(function (k) {
              if (mine.length >= F.CREDITS_MAX || mine.some(function (x) { return x[0] === k[0]; })) { return; }
              mine.push(k);
              changed = true;
            });
            var text = JSON.stringify(mine);
            if (!changed || F.utf8len(text) > LIMIT) { budget(); return; }
            ad.set('crd', text, function () { budget(); });
          });
        }
        (function next() {
          if (!jobs.length) { goal(); return; }
          var job = jobs.shift();
          append(job.month, job.ops, function (err, added) { if (err) { cb(err); return; } total += added; next(); });
        })();
      }
    };
  }

  g.STORE = { create: Store, localAdapter: localAdapter, cloudAdapter: cloudAdapter, chunkKey: chunkKey, parseKey: parseKey };
})(window);
