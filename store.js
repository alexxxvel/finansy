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
        var added = fresh.length;
        (function next() {
          if (!fresh.length) { cb(null, added); return; }
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
      /** всё для экрана месяца одним чтением: месяцы с записями, записи месяца и остаток на его начало
          (доходы минус траты всех прошлых месяцев, в копейках). Нечитаемый кусок чужого месяца не мешает открыть текущий: partial = true */
      view: function (month, cb) {
        ad.keys(function (err, keys) {
          if (err) { cb(err); return; }
          var mine = keys.map(function (k) { var p = parseKey(k); return p ? { key: k, month: p.month, i: p.i } : null; }).filter(Boolean)
            .sort(function (a, b) { return a.month === b.month ? a.i - b.i : (a.month < b.month ? -1 : 1); });
          ad.get(mine.map(function (c) { return c.key; }), function (err2, values) {
            if (err2) { cb(err2); return; }
            var months = {}, ops = [], carry = 0, partial = false, seen = {};
            for (var n = 0; n < mine.length; n++) {
              var c = mine[n], list = decode(values[c.key], c.month);
              if (list === null) { if (c.month === month) { cb('corrupt'); return; } partial = true; continue; }
              for (var j = 0; j < list.length; j++) {
                var op = list[j];
                if (seen[op.id]) { continue; }
                seen[op.id] = 1;
                months[c.month] = 1;
                if (c.month === month) { ops.push(op); }
                else if (c.month < month) { carry += (op.k === 'i' ? 1 : -1) * F.bynOf(op); }
              }
            }
            cb(null, { months: Object.keys(months).sort().reverse(), ops: ops, carry: carry, partial: partial });
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
      /** копия всех записей текстом */
      exportAll: function (cb) {
        ad.keys(function (err, keys) {
          if (err) { cb(err); return; }
          var mine = keys.filter(parseKey).sort();
          ad.get(mine, function (err2, values) {
            if (err2) { cb(err2); return; }
            var months = {}, count = 0, bad = false;
            mine.forEach(function (k) {
              var p = parseKey(k), ops = decode(values[k], p.month);
              if (ops === null) { bad = true; return; }
              months[p.month] = (months[p.month] || []).concat(ops.map(F.pack));
              count += ops.length;
            });
            if (bad) { cb('corrupt'); return; }
            cb(null, { text: JSON.stringify({ app: 'finansy', v: 1, at: new Date().toISOString(), months: months }), count: count });
          });
        });
      },
      /** восстановление из копии: только добавляет недостающие записи, существующие не трогает и ничего не удаляет */
      importAll: function (text, cb) {
        var data = F.parseBackup(text);
        if (!data) { cb('format'); return; }
        var jobs = Object.keys(data.months).sort().map(function (month) { return { month: month, ops: data.months[month] }; });
        var total = 0;
        (function next() {
          if (!jobs.length) { cb(null, total); return; }
          var job = jobs.shift();
          append(job.month, job.ops, function (err, added) { if (err) { cb(err); return; } total += added; next(); });
        })();
      }
    };
  }

  g.STORE = { create: Store, localAdapter: localAdapter, cloudAdapter: cloudAdapter, chunkKey: chunkKey, parseKey: parseKey };
})(window);
