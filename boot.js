/* Учёт финансов: до первой отрисовки (решение разработчика 26.10.2026, экран загрузки).
   Ставит на <html> тему и стиль раньше, чем нарисуется экран загрузки: чёрно-белый стиль — значок и бегущая линия (вариант А),
   цветной — значок и растущая шкала «Потрачено» (вариант В); фон — цвет приложения в этой теме, без белой вспышки.
   Крошечный и без зависимостей: Telegram и стили приложения ещё не загружены. Тему потом подтверждает app.js (applyTheme). */
(function () {
  var root = document.documentElement, theme = 'light';
  try {
    var pref = localStorage.getItem('fin_theme');
    if (pref === 'light' || pref === 'dark') { theme = pref; }
    else {
      // «как в Telegram»: Telegram передаёт тему в адресе (tgWebAppThemeParams) — по яркости фона; вне Telegram — тема телефона
      var m = /tgWebAppThemeParams=([^&]*)/.exec(location.hash), bg = '';
      if (m) { try { bg = (JSON.parse(decodeURIComponent(m[1])) || {}).bg_color || ''; } catch (e) { bg = ''; } }
      if (/^#[0-9a-f]{6}$/i.test(bg)) {
        var n = parseInt(bg.slice(1), 16), lum = 0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255);
        theme = lum < 128 ? 'dark' : 'light';
      } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) { theme = 'dark'; }
    }
    if (localStorage.getItem('fin_style') === 'color') { root.setAttribute('data-style', 'color'); }
  } catch (e) { /* без памяти — светлая и строгий стиль */ }
  root.setAttribute('data-theme', theme);
})();
