/* Ранняя загрузка записей (16.11.2026, точка роста 2 разбора ноября: 43 % открытий дольше 1,5 с).
   Замер в настоящем Telegram с процессором ×4: между «страница готова» и первым запросом в облако — 0,25–0,33 с запуска кода приложения.
   Этот файл идёт сразу после моста Telegram и сам просит у облака все ключи и записи; хранилище (store.js, cloudAdapter) при первом показе
   берёт уже полученное и ждёт, если ответ ещё в пути. Не вышло — первый показ идёт в облако как раньше. Записи — только в памяти страницы,
   в память браузера (localStorage) ничего не пишется. Вне Telegram (нет подписи) файл ничего не делает. */
(function () {
  'use strict';
  var W = window.Telegram && window.Telegram.WebApp;
  if (!W || !W.initData || !W.CloudStorage) { return; }
  var pre = { keys: null, values: null, err: null, done: false, wait: [], k: 0, g: 0 };
  function fin() { pre.done = true; var w = pre.wait; pre.wait = []; for (var i = 0; i < w.length; i++) { try { w[i](); } catch (e) { /* ждущий сам решит */ } } }
  pre.then = function (f) { if (pre.done) { f(); } else { pre.wait.push(f); } };
  window.__finPre = pre;
  try {
    W.CloudStorage.getKeys(function (err, keys) {
      if (err || !keys) { pre.err = err || 'keys'; fin(); return; }
      pre.keys = keys;
      if (!keys.length) { pre.values = {}; fin(); return; }
      W.CloudStorage.getItems(keys, function (e2, values) { if (e2 || !values) { pre.err = e2 || 'items'; } else { pre.values = values; } fin(); });
    });
  } catch (e) { pre.err = 'cloud'; fin(); }
})();
