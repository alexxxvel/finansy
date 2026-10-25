/* Учёт финансов: слой iOS 26 из Apple-системы студии (_дизайн-система-apple/web/ios.js, одобрен разработчиком 24.10.2026; в приложение — 25.10.2026).
   Жидкая линза над рядом кнопок (панель вкладок, сегменты) и тумблер со стеклянной ручкой. Отличие от системы: приложение строит экраны на ходу,
   поэтому слой не ищет элементы сам, а подключается вызовом window.IOS26.liquid(el) / window.IOS26.toggle(btn); стиль ES5 — для старых браузеров Telegram.
   Движение по WWDC «Designing Fluid Interfaces»: пружины (длительность + отскок), от текущего значения и с текущей скоростью, палец ведёт 1:1,
   бросок — проекция скорости (затухание 0,998), у краёв резина; отклик — на касание. prefers-reduced-motion — всё на месте сразу.
   • liquid(el): el.ios-lq > .ios-lq__items (кнопки с aria-selected или aria-pressed) + .ios-lq__lens; событие "liquid:change" {index, value, drag}
   • toggle(btn): button[role=switch][aria-checked] > .ios-switch__knob; событие "change" */
(function () {
  'use strict';
  var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var css = getComputedStyle(document.documentElement);
  function tok(name, d) { var v = parseFloat(css.getPropertyValue(name)); return isNaN(v) ? d : v; }
  var PRESS = tok('--lg-press', 1.34), RUBBER = tok('--lg-rubber', 0.55);

  /* пружина SwiftUI: stiffness = (2π/d)², damping = (1 − b)·4π/d; прерываемая — меняется только цель */
  function Spring(x, duration, bounce, eps) {
    this.x = this.t = x; this.v = 0; this.eps = eps || 0.05;
    this.k = Math.pow(2 * Math.PI / duration, 2);
    this.c = bounce >= 0 ? (1 - bounce) * 4 * Math.PI / duration : 4 * Math.PI / (duration * (1 + bounce));
  }
  Spring.prototype.step = function (dt) {
    if (reduce) { this.x = this.t; this.v = 0; return false; }
    var n = Math.max(1, Math.ceil(dt / 0.004)), h = dt / n;
    for (var i = 0; i < n; i++) { var a = this.k * (this.t - this.x) - this.c * this.v; this.v += a * h; this.x += this.v * h; }
    if (Math.abs(this.t - this.x) < this.eps && Math.abs(this.v) < this.eps * 10) { this.x = this.t; this.v = 0; return false; }
    return true;
  };
  Spring.prototype.jump = function (x) { this.x = this.t = x; this.v = 0; };

  // общий цикл кадров: компонент в списке, пока что-то движется; отключённый от страницы выпадает сам
  var active = [], raf = 0, last = 0;
  function frame(now) {
    var dt = Math.min(1 / 30, (now - (last || now)) / 1000) || 1 / 60;
    last = now;
    active = active.filter(function (c) { return c.el.isConnected !== false && c.tick(dt); });
    raf = active.length ? requestAnimationFrame(frame) : 0;
    if (!raf) { last = 0; }
  }
  function wake(c) { if (active.indexOf(c) < 0) { active.push(c); } if (!raf) { raf = requestAnimationFrame(frame); } }
  function project(v) { var rate = 0.998; return (v / 1000) * rate / (1 - rate); } // Apple: куда «докатится» бросок
  function rubber(over, dim) { return (over * dim * RUBBER) / (dim + RUBBER * Math.abs(over)); } // чем дальше за край, тем туже
  function velocity(hist) { // px/с по последним ~80 мс
    var a = hist[hist.length - 1], b = hist[0];
    for (var i = hist.length - 1; i >= 0; i--) { b = hist[i]; if (a.t - hist[i].t > 80) { break; } }
    return a.t > b.t ? (a.x - b.x) / (a.t - b.t) * 1000 : 0;
  }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function fire(el, name, detail) {
    var e;
    try { e = new CustomEvent(name, { bubbles: true, detail: detail }); } catch (x) { e = document.createEvent('CustomEvent'); e.initCustomEvent(name, true, false, detail); }
    el.dispatchEvent(e);
  }
  function watchSize(el, fn) {
    if (typeof ResizeObserver === 'undefined') { window.addEventListener('resize', fn); return; }
    var ro = new ResizeObserver(function () { if (el.isConnected === false) { ro.disconnect(); return; } fn(); });
    ro.observe(el);
  }

  /* ---------- жидкая линза над рядом кнопок ---------- */
  function liquid(el) {
    if (!el || el.liquid) { return; }
    var items = el.querySelector('.ios-lq__items'), lens = el.querySelector('.ios-lq__lens');
    if (!items || !lens) { return; }
    var btns = [].slice.call(items.children), tabbar = el.classList.contains('ios-tabbar');
    var mag = parseFloat(el.getAttribute('data-mag') || (tabbar ? '1.24' : '1')), press = parseFloat(el.getAttribute('data-press') || (tabbar ? PRESS : 1.12));
    var copy = items.cloneNode(true); // копия ряда под линзой: увеличена вокруг центра линзы и в цвете акцента
    copy.className += ' ios-lq__items--lens';
    copy.setAttribute('aria-hidden', 'true');
    copy.removeAttribute('role');
    copy.removeAttribute('id');
    [].forEach.call(copy.querySelectorAll('*'), function (n) {
      ['id', 'role', 'aria-selected', 'aria-pressed', 'aria-controls', 'aria-label'].forEach(function (a) { n.removeAttribute(a); });
      [].slice.call(n.attributes).forEach(function (a) { if (a.name.indexOf('data-') === 0) { n.removeAttribute(a.name); } }); // копию не находят ни тесты, ни обработчики
      if (n.tagName === 'BUTTON') { n.tabIndex = -1; }
    });
    [].slice.call(copy.children).forEach(function (b) { // копия из простых блоков, не кнопок: её не находят ни экранный диктор, ни перебор кнопок
      var s = document.createElement('span');
      s.className = b.className;
      while (b.firstChild) { s.appendChild(b.firstChild); }
      copy.replaceChild(s, b);
    });
    el.appendChild(copy);
    var sel = 0;
    btns.forEach(function (b, k) { if (b.getAttribute('aria-selected') === 'true' || b.getAttribute('aria-pressed') === 'true') { sel = k; } });
    var X = new Spring(0, 0.5, 0.15, 0.2), W = new Spring(0, 0.5, 0, 0.2), P = new Spring(0, 0.35, 0.3, 0.004), self = { el: el };

    function slot(i) { var b = btns[i]; return { x: items.offsetLeft + b.offsetLeft, w: b.offsetWidth }; }
    function place() {
      copy.style.left = items.offsetLeft + 'px';
      copy.style.top = items.offsetTop + 'px';
      copy.style.width = items.offsetWidth + 'px';
      copy.style.height = items.offsetHeight + 'px';
    }
    function render() {
      var p = clamp(P.x, -0.2, 1.4), w = W.x, s = 1 + (press - 1) * p;
      var stretch = clamp(Math.abs(X.v) / 4200, 0, 0.22); // растяжение по скорости — линза «течёт»
      var sx = s * (1 + stretch), sy = s * (1 - stretch * 0.45);
      lens.style.width = w + 'px';
      lens.style.transform = 'translate3d(' + X.x.toFixed(2) + 'px,0,0) scale(' + sx.toFixed(4) + ',' + sy.toFixed(4) + ')';
      el.style.setProperty('--press', clamp(p, 0, 1).toFixed(3));
      var cx = X.x + w / 2 - items.offsetLeft, half = w * sx / 2;
      el.style.setProperty('--l', (cx - half).toFixed(1));
      el.style.setProperty('--r', (cx + half).toFixed(1));
      var lh = lens.offsetHeight, cy = lens.offsetTop + lh / 2 - items.offsetTop, vh = lh * sy / 2;
      var m = 1 + (mag - 1) * clamp(p, 0, 1); // увеличение только под нажатой линзой
      copy.style.transformOrigin = cx.toFixed(1) + 'px ' + cy.toFixed(1) + 'px';
      copy.style.transform = 'scale(' + m.toFixed(4) + ')';
      var L = cx - half / m, R = cx + half / m, T = cy - vh / m, B = cy + vh / m;
      copy.style.clipPath = 'inset(' + T.toFixed(1) + 'px ' + (items.offsetWidth - R).toFixed(1) + 'px ' + (items.offsetHeight - B).toFixed(1) + 'px ' + L.toFixed(1) + 'px round ' + (vh / m).toFixed(1) + 'px)';
    }
    self.tick = function (dt) { var a = X.step(dt), b = W.step(dt), c = P.step(dt); render(); return a || b || c; };
    function select(i, user, drag) {
      i = clamp(i, 0, btns.length - 1);
      var t = slot(i);
      X.t = t.x;
      W.t = t.w;
      if (i !== sel || user === 'force') {
        sel = i;
        btns.forEach(function (b, k) {
          if (b.hasAttribute('aria-selected')) { b.setAttribute('aria-selected', String(k === i)); }
          if (b.hasAttribute('aria-pressed')) { b.setAttribute('aria-pressed', String(k === i)); }
        });
        if (user && user !== 'force') { fire(el, 'liquid:change', { index: i, value: btns[i].getAttribute('data-value') || String(i), drag: !!drag }); }
      }
      wake(self);
    }
    // касание — линза растёт сразу; тянуть — 1:1 за пальцем (резина у краёв); отпустить — проекция скорости → ближайшая кнопка
    var drag = null;
    el.addEventListener('pointerdown', function (e) {
      if (e.button !== 0 || e.isPrimary === false) { return; }
      var r = el.getBoundingClientRect(), lx = e.clientX - r.left, under = sel, center = X.x + W.x / 2;
      btns.forEach(function (b, k) { var s = slot(k); if (lx >= s.x && lx <= s.x + s.w) { under = k; } });
      drag = { id: e.pointerId, start: lx, grab: lx - center, onLens: Math.abs(lx - center) < W.x / 2, under: under, moved: false, hist: [{ x: X.x, t: e.timeStamp }] };
      P.t = 1;
      if (!drag.onLens) { var t = slot(under); X.t = t.x; W.t = t.w; } // нажали другую кнопку — линза уже едет туда
      wake(self);
    });
    el.addEventListener('pointermove', function (e) {
      if (!drag || e.pointerId !== drag.id) { return; }
      var r = el.getBoundingClientRect(), lx = e.clientX - r.left;
      if (!drag.moved) {
        if (Math.abs(lx - drag.start) < 6) { return; }
        drag.moved = true;
        try { el.setPointerCapture(e.pointerId); } catch (z) { /* без захвата тоже работает */ }
        drag.grab = drag.onLens ? drag.grab : 0;
      }
      var min = slot(0).x, max = slot(btns.length - 1).x, x = lx - drag.grab - W.x / 2;
      if (x < min) { x = min + rubber(x - min, el.clientWidth); }
      if (x > max) { x = max + rubber(x - max, el.clientWidth); }
      var prev = drag.hist[drag.hist.length - 1], near = sel, best = 1e9;
      X.v = e.timeStamp > prev.t ? (x - prev.x) / (e.timeStamp - prev.t) * 1000 : X.v;
      X.x = X.t = x;
      btns.forEach(function (b, k) { var s = slot(k), d = Math.abs(s.x + s.w / 2 - (x + W.x / 2)); if (d < best) { best = d; near = k; } });
      W.t = slot(near).w;
      drag.hist.push({ x: x, t: e.timeStamp });
      if (drag.hist.length > 12) { drag.hist.shift(); }
      wake(self);
    });
    function end(e, cancel) {
      if (!drag || e.pointerId !== drag.id) { return; }
      P.t = 0;
      if (drag.moved && !cancel) {
        var last = drag.hist[drag.hist.length - 1], v = e.timeStamp - last.t > 120 ? 0 : velocity(drag.hist), proj = X.x + W.x / 2 + project(v), near = sel, best = 1e9; // палец замер перед отпусканием — броска нет
        btns.forEach(function (b, k) { var s = slot(k), d = Math.abs(s.x + s.w / 2 - proj); if (d < best) { best = d; near = k; } });
        X.v = v;
        select(near, true, true);
      } else if (!cancel) { select(drag.under, true, false); } else { select(sel); }
      drag = null;
      wake(self);
    }
    el.addEventListener('pointerup', function (e) { end(e, false); });
    el.addEventListener('pointercancel', function (e) { end(e, true); });
    watchSize(el, function () { place(); var t = slot(sel); X.jump(t.x); W.jump(t.w); render(); });
    // выбранное поменяло само приложение (aria-pressed / aria-selected) — линза едет туда же, без события
    if (typeof MutationObserver !== 'undefined') {
      new MutationObserver(function () {
        var now = -1;
        btns.forEach(function (b, k) { if (b.getAttribute('aria-selected') === 'true' || b.getAttribute('aria-pressed') === 'true') { now = k; } });
        if (now >= 0 && now !== sel && !drag) { select(now, false); }
      }).observe(items, { attributes: true, subtree: true, attributeFilter: ['aria-pressed', 'aria-selected'] });
    }
    place();
    var t0 = slot(sel);
    X.jump(t0.x);
    W.jump(t0.w);
    select(sel, 'force');
    P.jump(0);
    el.classList.add('is-live');
    render();
    el.liquid = { select: function (i) { select(i, false); } };
  }

  /* ---------- тумблер: ручка на касание — стекло, растёт и вытягивается; тянуть пальцем; бросок решает сторону ---------- */
  function toggle(btn) {
    if (!btn || btn.iosSwitch) { return; }
    btn.iosSwitch = true;
    var knob = btn.querySelector('.ios-switch__knob');
    if (!knob) { knob = document.createElement('span'); knob.className = 'ios-switch__knob'; btn.appendChild(knob); }
    var self = { el: btn }, X = new Spring(0, 0.5, 0.18, 0.1), P = new Spring(0, 0.3, 0.25, 0.004), drag = null;
    function track() { return btn.querySelector('.ios-switch__track') || btn; }
    function travel() { var t = track(); return t.clientWidth - knob.offsetWidth - 4; }
    function on() { return btn.getAttribute('aria-checked') === 'true'; }
    function render() {
      var p = clamp(P.x, -0.2, 1.3), st = clamp(Math.abs(X.v) / 3000, 0, 0.18);
      knob.style.transform = 'translate3d(' + X.x.toFixed(2) + 'px,0,0) scale(' + (1 + 0.42 * p + st).toFixed(4) + ',' + (1 + 0.5 * p - st * 0.4).toFixed(4) + ')';
    }
    self.tick = function (dt) { var a = X.step(dt), b = P.step(dt); render(); return a || b; };
    function set(v, user) {
      btn.setAttribute('aria-checked', String(v));
      X.t = v ? travel() : 0;
      if (user) { fire(btn, 'change', { checked: v }); }
      wake(self);
    }
    btn.addEventListener('pointerdown', function (e) {
      if (e.button !== 0) { return; }
      drag = { id: e.pointerId, sx: e.clientX, x0: X.x, moved: false, hist: [{ x: X.x, t: e.timeStamp }] };
      btn.classList.add('is-pressed');
      P.t = 1;
      wake(self);
    });
    btn.addEventListener('pointermove', function (e) {
      if (!drag || e.pointerId !== drag.id) { return; }
      var dx = e.clientX - drag.sx;
      if (!drag.moved) { if (Math.abs(dx) < 4) { return; } drag.moved = true; try { btn.setPointerCapture(e.pointerId); } catch (z) { /* без захвата */ } }
      var x = drag.x0 + dx, max = travel();
      if (x < 0) { x = rubber(x, 40); }
      if (x > max) { x = max + rubber(x - max, 40); }
      X.x = X.t = x;
      drag.hist.push({ x: x, t: e.timeStamp });
      if (drag.hist.length > 10) { drag.hist.shift(); }
      wake(self);
    });
    function end(e, cancel) {
      if (!drag || e.pointerId !== drag.id) { return; }
      btn.classList.remove('is-pressed');
      P.t = 0;
      if (cancel) { set(on()); } else if (drag.moved) { var v = velocity(drag.hist); X.v = v; set(Math.abs(v) > 300 ? v > 0 : X.x > travel() / 2, true); } else { set(!on(), true); }
      drag = null;
    }
    btn.addEventListener('pointerup', function (e) { end(e, false); });
    btn.addEventListener('pointercancel', function (e) { end(e, true); });
    btn.addEventListener('click', function (e) { if (e.detail === 0) { set(!on(), true); } }); // клавиатура и экранный диктор
    watchSize(btn, function () { X.jump(on() ? travel() : 0); render(); });
    X.jump(on() ? travel() : 0);
    render();
    btn.iosSet = function (v) { set(!!v, false); };
  }

  /* ---------- ручка тумблера в строке-переключателе: строка остаётся нажимаемой целиком (её обработчик меняет aria-checked),
     ручка на касание строки — стекло и растёт, к новому положению едет пружиной (iOS 26) ---------- */
  function knob(row) {
    if (!row || row.iosKnob) { return; }
    row.iosKnob = true;
    var sw = row.querySelector('.ios-switch'), kn = sw && sw.querySelector('.ios-switch__knob');
    if (!kn) { return; }
    var self = { el: row }, X = new Spring(0, 0.5, 0.18, 0.1), P = new Spring(0, 0.3, 0.25, 0.004), ready = false;
    function travel() { return Math.max(0, sw.clientWidth - kn.offsetWidth - 4); }
    function on() { return row.getAttribute('aria-checked') === 'true'; }
    function render() {
      var p = clamp(P.x, -0.2, 1.3), st = clamp(Math.abs(X.v) / 3000, 0, 0.18);
      kn.style.transform = 'translate3d(' + X.x.toFixed(2) + 'px,0,0) scale(' + (1 + 0.42 * p + st).toFixed(4) + ',' + (1 + 0.5 * p - st * 0.4).toFixed(4) + ')';
    }
    self.tick = function (dt) { var a = X.step(dt), b = P.step(dt); render(); return a || b; };
    function sync(jump) { if (jump || !ready) { X.jump(on() ? travel() : 0); ready = travel() > 0; render(); return; } X.t = on() ? travel() : 0; wake(self); }
    row.addEventListener('pointerdown', function (e) { if (e.button !== 0) { return; } sw.classList.add('is-pressed'); P.t = 1; wake(self); });
    function up() { sw.classList.remove('is-pressed'); P.t = 0; wake(self); }
    row.addEventListener('pointerup', up);
    row.addEventListener('pointercancel', up);
    row.addEventListener('pointerleave', up);
    if (typeof MutationObserver !== 'undefined') { new MutationObserver(function () { sync(false); }).observe(row, { attributes: true, attributeFilter: ['aria-checked'] }); }
    watchSize(sw, function () { sync(true); });
    sync(true);
  }

  window.IOS26 = { liquid: liquid, toggle: toggle, knob: knob };
})();
