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
  function project(v, rate) { rate = rate || 0.998; return (v / 1000) * rate / (1 - rate); } // Apple: куда «докатится» бросок
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

  // перенесено из _дизайн-система-apple/web/ios.js 26.10.2026 — правки делать там и переносить сюда же
  /* ---------- знакомство с приложением (онбординг, 26.10.2026): листы вбок за пальцем, параллакс иллюстраций, точки-капсулы ----------
     [data-onboard] → .ios-onboard__track > .ios-onboard__page (в листе .ios-onboard__art со слоями [data-depth="0.2…1"] и [data-in] — появляются
     по очереди), .ios-onboard__dots, [data-onboard-next] (data-last="Начать"), [data-onboard-skip]. Лист с data-auto="1400" — заставка, сама
     уходит дальше. Событие "onboard:change" {index}, в конце "onboard:done". Один лист за бросок, как в iOS.
     С 26.10 (второй круг): свет главы — data-tint="#RRGGBB" у листа, цвет перетекает за пальцем (--ob-tint); слои покачиваются в 3D;
     микросцена листа — элементы [data-step="1…"] получают .is-on по очереди (data-step-ms у листа, по умолчанию 520), [data-count-to] досчитывает
     (data-unit) — когда лист становится текущим; ушёл с листа — сцена сбрасывается и при возврате играет снова.
     С 26.10 (подборка онбордингов): листы-вопросы. data-flow у листа — он в полосе прогресса .ios-onboard__progress (деления), [data-onboard-back] — назад.
     .ios-choice[data-min][data-max] > button[data-value] — выбор списком или плитками (.ios-choice--grid), «Продолжить» не жмётся, пока не выбрано data-min;
     .ios-pick > [data-value] — выбор каруселью (центральная карточка крупнее, выбрана); .ios-swipe > .ios-swipe__card — утверждения, смахнуть «Да/Нет»
     ([data-swipe="yes|no"] — кнопками), лист готов, когда отвечено на все. Событие "onboard:answer" {page, name, value}. Внутри этих блоков лист не листается. */
  function Onboard(el) {
    var track = el.querySelector(".ios-onboard__track"), pages = [].slice.call(el.querySelectorAll(".ios-onboard__page"));
    if (!track || !pages.length) return;
    var self = this, X = new Spring(0, 0.5, 0.06, 0.4), i = 0, drag = null, touched = false;
    this.el = el;   // общий цикл кадров «Финансов» узнаёт по el, что лист ещё на странице
    var next = el.querySelector("[data-onboard-next]"), skip = el.querySelector("[data-onboard-skip]"), dotsBox = el.querySelector(".ios-onboard__dots");
    var label = next ? next.textContent : "", dots = [], timers = [], fmt = new Intl.NumberFormat("ru-RU");
    var tints = pages.map(function (p) { var h = (p.getAttribute("data-tint") || "").replace("#", ""); return h.length === 6 ? [0, 2, 4].map(function (o) { return parseInt(h.substr(o, 2), 16); }) : null; });
    if (dotsBox) pages.forEach(function () { var d = document.createElement("span"); dotsBox.appendChild(d); dots.push(d); });
    var back = el.querySelector("[data-onboard-back]"), bar = el.querySelector(".ios-onboard__progress"), flow = pages.filter(function (p) { return p.hasAttribute("data-flow"); }), segs = [];
    if (bar) flow.forEach(function () { var s = document.createElement("i"); bar.appendChild(s); segs.push(s); });
    function answer(p, name, value) { el.dispatchEvent(new CustomEvent("onboard:answer", { detail: { page: pages.indexOf(p), name: name, value: value }, bubbles: true })); gate(); }
    function ready(p) {                                                          // можно ли уйти с листа вперёд
      var c = p.querySelector(".ios-choice"); if (c && c.querySelectorAll('[aria-pressed="true"]').length < (+c.getAttribute("data-min") || 1)) return false;
      var s = p.querySelector(".ios-swipe"); if (s && s.querySelectorAll(".ios-swipe__card:not(.is-gone)").length) return false;
      return true;
    }
    function gate() { if (next) { var ok = ready(pages[i]); next.disabled = !ok; next.setAttribute("aria-disabled", String(!ok)); } }
    // выбор списком или плитками
    el.querySelectorAll(".ios-choice").forEach(function (c) {
      var max = +c.getAttribute("data-max") || 99, p = c.closest(".ios-onboard__page");
      c.querySelectorAll("button[data-value]").forEach(function (b) {
        b.setAttribute("aria-pressed", b.getAttribute("aria-pressed") || "false");
        b.addEventListener("click", function () {
          var on = b.getAttribute("aria-pressed") === "true", chosen = c.querySelectorAll('[aria-pressed="true"]');
          if (!on && max === 1) chosen.forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
          else if (!on && chosen.length >= max) { c.classList.remove("is-full"); void c.offsetWidth; c.classList.add("is-full"); return; }   // больше нельзя — короткая встряска
          b.setAttribute("aria-pressed", String(!on));
          answer(p, c.getAttribute("data-name") || "choice", [].map.call(c.querySelectorAll('[aria-pressed="true"]'), function (x) { return x.getAttribute("data-value"); }));
        });
      });
    });
    // выбор каруселью: какая карточка ближе к центру — та и выбрана
    el.querySelectorAll(".ios-pick").forEach(function (pk) {
      var items = [].slice.call(pk.querySelectorAll("[data-value]")), p = pk.closest(".ios-onboard__page"), cur = null, raf = 0;
      function upd() {
        raf = 0; var r = pk.getBoundingClientRect(), c = r.left + r.width / 2, best = null, bd = 1e9;
        items.forEach(function (n) { var q = n.getBoundingClientRect(), d = Math.abs(q.left + q.width / 2 - c), k = clamp(1 - d / (r.width * 0.6), 0, 1);
          n.style.transform = "scale(" + (0.86 + 0.14 * k).toFixed(3) + ")"; n.style.opacity = (0.45 + 0.55 * k).toFixed(2); if (d < bd) { bd = d; best = n; } });
        if (best !== cur) { cur = best; items.forEach(function (n) { n.setAttribute("aria-pressed", String(n === cur)); }); answer(p, pk.getAttribute("data-name") || "pick", cur.getAttribute("data-value")); }
      }
      pk.addEventListener("scroll", function () { if (!raf) raf = requestAnimationFrame(upd); }, { passive: true });
      items.forEach(function (n) { n.addEventListener("click", function () { n.scrollIntoView({ behavior: reduce ? "auto" : "smooth", inline: "center", block: "nearest" }); }); });
      new ResizeObserver(function () { var s = pk.querySelector('[aria-pressed="true"]') || items[Math.floor(items.length / 2)]; pk.scrollLeft = s.offsetLeft - (pk.clientWidth - s.offsetWidth) / 2; upd(); }).observe(pk);
    });
    // утверждения: карточку смахивают вправо «да», влево «нет»; кнопки делают то же
    el.querySelectorAll(".ios-swipe").forEach(function (sw) {
      var p = sw.closest(".ios-onboard__page"), d = null;
      function top() { var c = sw.querySelectorAll(".ios-swipe__card:not(.is-gone)"); return c[c.length - 1]; }
      function stackUp() { var c = [].slice.call(sw.querySelectorAll(".ios-swipe__card:not(.is-gone)")).reverse();   // верхняя, под ней две, остальные спрятаны
        sw.querySelectorAll(".ios-swipe__card").forEach(function (n) { n.classList.remove("is-top", "is-under1", "is-under2"); });
        if (c[0]) c[0].classList.add("is-top"); if (c[1]) c[1].classList.add("is-under1"); if (c[2]) c[2].classList.add("is-under2"); }
      stackUp();
      function fly(card, yes, vx) {
        card.classList.add("is-gone", yes ? "is-yes" : "is-no");
        var x = (yes ? 1 : -1) * (sw.clientWidth * 1.3), cur = card.style.transform || "none";
        card.animate([{ transform: cur }, { transform: "translate(" + x + "px, 40px) rotate(" + (yes ? 18 : -18) + "deg)", opacity: 0 }], { duration: reduce ? 1 : clamp(420 - Math.abs(vx || 0) / 8, 220, 420), easing: "cubic-bezier(0.23, 1, 0.32, 1)", fill: "forwards" });
        stackUp(); answer(p, card.getAttribute("data-name") || "swipe", yes);
      }
      p.querySelectorAll("[data-swipe]").forEach(function (b) { b.addEventListener("click", function () { var c = top(); if (c) fly(c, b.getAttribute("data-swipe") === "yes"); }); });
      sw.addEventListener("pointerdown", function (e) { var c = top(); if (!c || e.button !== 0) return; d = { c: c, id: e.pointerId, sx: e.clientX, hist: [{ x: 0, t: e.timeStamp }] }; c.setPointerCapture(e.pointerId); });
      sw.addEventListener("pointermove", function (e) {
        if (!d || e.pointerId !== d.id) return; var dx = e.clientX - d.sx; d.hist.push({ x: dx, t: e.timeStamp }); if (d.hist.length > 10) d.hist.shift();
        d.c.style.transform = "translateX(" + dx + "px) rotate(" + (dx / 18).toFixed(2) + "deg)";
        sw.style.setProperty("--swipe", clamp(dx / 120, -1, 1).toFixed(3));      // подсветка «да/нет» под карточкой
      });
      function up(e) {
        if (!d || e.pointerId !== d.id) return; var dx = e.clientX - d.sx, v = velocity(d.hist), c = d.c; d = null; sw.style.setProperty("--swipe", "0");
        if (Math.abs(dx + project(v, 0.99)) > sw.clientWidth * 0.35) fly(c, dx > 0, v);
        else c.animate([{ transform: c.style.transform }, { transform: "none" }], { duration: 420, easing: "cubic-bezier(0.23, 1, 0.32, 1)" }).onfinish = function () { c.style.transform = ""; };
      }
      sw.addEventListener("pointerup", up); sw.addEventListener("pointercancel", up);
    });
    if (back) back.addEventListener("click", function () { touched = true; go(i - 1); });
    pages.forEach(function (p, k) {
      p.setAttribute("role", "group"); p.setAttribute("aria-roledescription", "лист"); p.setAttribute("aria-label", (k + 1) + " из " + pages.length);
      p.querySelectorAll("[data-in]").forEach(function (n, j) { n.style.setProperty("--in-i", j); });
    });
    function W() { return el.clientWidth || 1; }
    function render() {
      var w = W(), pos = -X.x / w;
      track.style.transform = "translate3d(" + X.x.toFixed(2) + "px,0,0)";
      pages.forEach(function (p, k) {
        var d = k - pos;                                                      // −1 … 1: насколько лист левее или правее экрана
        p.style.visibility = Math.abs(d) >= 0.999 ? "hidden" : "";            // лист за краем не читается экранным диктором и не ловит фокус
        if (Math.abs(d) > 1.2) return;
        p.querySelectorAll("[data-depth]").forEach(function (n) {
          var z = +n.getAttribute("data-depth");
          n.style.translate = (d * w * 0.32 * z).toFixed(1) + "px 0";      // translate и rotate, не transform: не спорят с появлением [data-in]
          n.style.rotate = "y " + (-d * 22 * z).toFixed(2) + "deg";          // карточки поворачиваются вслед за листом — объём
        });
        var t = p.querySelector(".ios-onboard__copy"); if (t) t.style.opacity = clamp(1 - Math.abs(d) * 1.6, 0, 1).toFixed(3);
      });
      dots.forEach(function (d, k) { var on = clamp(1 - Math.abs(k - pos), 0, 1); d.style.width = (8 + 16 * on).toFixed(1) + "px"; d.style.opacity = (0.35 + 0.65 * on).toFixed(2); });
      var a = clamp(Math.floor(pos), 0, pages.length - 1), b = clamp(a + 1, 0, pages.length - 1), f = clamp(pos - a, 0, 1), ta = tints[a], tb = tints[b] || ta;
      if (ta) {   // свет главы: два слоя — свет листа гаснет, свет следующего загорается (без грязной середины, как при смешении цветов)
        el.style.setProperty("--ob-a", ta.join(" ")); el.style.setProperty("--ob-b", tb.join(" ")); el.style.setProperty("--ob-f", f.toFixed(3));
        el.style.setProperty("--ob-tint", (f < 0.5 ? ta : tb).join(" "));
      }
    }
    this.tick = function (dt) { var m = X.step(dt); render(); return m; };
    function go(k, v) {
      k = clamp(k, 0, pages.length - 1);
      if (k > i && !ready(pages[i])) { k = i; var c = pages[i].querySelector(".ios-choice, .ios-swipe"); if (c) { c.classList.remove("is-full"); void c.offsetWidth; c.classList.add("is-full"); } }   // вперёд — только с ответом
      var changed = k !== i || !pages[k].classList.contains("is-current");
      if (k !== i) { i = k; el.dispatchEvent(new CustomEvent("onboard:change", { detail: { index: i }, bubbles: true })); }
      pages.forEach(function (p, n) { p.classList.toggle("is-current", n === i); p.setAttribute("aria-hidden", n === i ? "false" : "true"); });
      if (changed) scene(i);
      if (next) next.textContent = i === pages.length - 1 ? (next.getAttribute("data-last") || label) : label;
      if (skip) skip.hidden = i === pages.length - 1;
      var fk = flow.indexOf(pages[i]);
      if (bar) { bar.classList.toggle("is-off", fk < 0); segs.forEach(function (s, n) { s.classList.toggle("is-on", n <= fk); }); }
      if (back) back.hidden = i === 0 || pages[i].hasAttribute("data-auto");
      gate();
      X.t = -i * W(); if (v !== undefined) X.v = v; wake(self);
      var auto = +pages[i].getAttribute("data-auto");
      if (auto && !touched) setTimeout(function () { if (i === k && !touched && !drag) go(k + 1); }, auto);
    }
    function scene(k) {                                                       // микросцена листа: шаги по очереди, счётчики
      timers.forEach(clearTimeout); timers = [];
      pages.forEach(function (p, n) {
        if (n === k) return;
        p.querySelectorAll("[data-step]").forEach(function (s) { s.classList.remove("is-on"); });
        p.querySelectorAll("[data-count-to]").forEach(function (c) { c.textContent = fmt.format(0) + (c.getAttribute("data-unit") || ""); });
      });
      var p = pages[k], ms = +p.getAttribute("data-step-ms") || 520;
      function count(c) {
        var to = +c.getAttribute("data-count-to"), u = c.getAttribute("data-unit") || "", t0 = performance.now();
        if (reduce) { c.textContent = fmt.format(to) + u; return; }
        (function f(now) { var q = clamp((now - t0) / 900, 0, 1), e = 1 - Math.pow(1 - q, 4); c.textContent = fmt.format(Math.round(to * e)) + u; if (q < 1 && pages[i] === p) requestAnimationFrame(f); })(t0);
      }
      p.querySelectorAll("[data-step]").forEach(function (s) {
        var n = +s.getAttribute("data-step");
        function on() { s.classList.add("is-on"); if (s.hasAttribute("data-count-to")) count(s); s.querySelectorAll("[data-count-to]").forEach(count); }
        reduce ? on() : timers.push(setTimeout(on, 380 + (n - 1) * ms));
      });
      p.querySelectorAll("[data-count-to]:not([data-step] [data-count-to]):not([data-step])").forEach(function (c) { reduce ? count(c) : timers.push(setTimeout(function () { count(c); }, 380)); });
    }
    function done() { touched = true; el.classList.add("is-done"); el.dispatchEvent(new CustomEvent("onboard:done", { bubbles: true })); }
    if (next) next.addEventListener("click", function () { touched = true; i === pages.length - 1 ? done() : go(i + 1); });
    if (skip) skip.addEventListener("click", done);
    track.addEventListener("pointerdown", function (e) {
      if (e.button !== 0) return; touched = true;
      if (e.target.closest(".ios-pick, .ios-swipe, [data-liquid], .ios-switch, .ios-slider, input, textarea")) return;   // внутри вопроса палец работает с вопросом
      drag = { id: e.pointerId, sx: e.clientX, sy: e.clientY, x0: X.x, k0: i, hist: [{ x: X.x, t: e.timeStamp }], on: false };
    });
    track.addEventListener("pointermove", function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      var dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
      if (!drag.on) { if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(dy)) return; drag.on = true; track.setPointerCapture(e.pointerId); }   // сначала понять, что это жест вбок
      var x = drag.x0 + dx, min = -(pages.length - 1) * W();
      if (x > 0) x = rubber(x, W()); else if (x < min) x = min + rubber(x - min, W());
      X.x = X.t = x; drag.hist.push({ x: x, t: e.timeStamp }); if (drag.hist.length > 12) drag.hist.shift(); wake(self);
    });
    function end(e) {
      if (!drag || e.pointerId !== drag.id) return;
      var was = drag; drag = null; if (!was.on) return;
      var v = velocity(was.hist), proj = -(X.x + project(v, 0.99)) / W();
      go(clamp(Math.round(proj), was.k0 - 1, was.k0 + 1), v);                // за один бросок — один лист
    }
    track.addEventListener("pointerup", end); track.addEventListener("pointercancel", end);
    el.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { touched = true; go(i + 1); e.preventDefault(); }
      if (e.key === "ArrowLeft") { touched = true; go(i - 1); e.preventDefault(); }
    });
    new ResizeObserver(function () { X.jump(-i * W()); render(); }).observe(el);
    X.jump(0); go(0); render();
    el._onboard = { go: go, index: function () { return i; }, ready: function () { return ready(pages[i]); } };
  }

  document.querySelectorAll("[data-liquid]").forEach(function (el) { new Liquid(el); });
  document.querySelectorAll(".ios-switch").forEach(function (el) { new Switch(el); });
  document.querySelectorAll(".ios-slider").forEach(function (el) { new Slider(el); });
  document.querySelectorAll(".ios-sheet-host").forEach(function (el) { new Sheet(el); });
  document.querySelectorAll(".ios-otp").forEach(function (el) { new Otp(el); });
  // статичная разметка (страница-образец); в приложении онбординг создаёт app.js при первом запуске через IOS26.onboard
  document.querySelectorAll('[data-onboard]').forEach(function (el) { if (!el._ob) { el._ob = new Onboard(el); } });

  window.IOS26 = { liquid: liquid, toggle: toggle, knob: knob, onboard: function (el) { if (!el._ob) { el._ob = new Onboard(el); } return el._ob; } };
})();
