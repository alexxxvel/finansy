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
  Spring.prototype.tune = function (duration, bounce) { // другая пружина с того же места и с той же скоростью
    this.k = Math.pow(2 * Math.PI / duration, 2);
    this.c = bounce >= 0 ? (1 - bounce) * 4 * Math.PI / duration : 4 * Math.PI / (duration * (1 + bounce));
  };

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

  /* ---------- жидкая линза над рядом кнопок (версия 3, 06.11.2026 — по покадровому замеру записей iPhone разработчика: Telegram и «Телефон», iOS 26/27) ----------
     Замер 30 кадров/с (центр цвета акцента под линзой, кадр за кадром):
     • переезд к соседней вкладке — на записи 98 % пути за ≈ 0,13 с, довод ≈ 1 %; на телефоне разработчику «даже слишком быстро» — пружина 0,28 с, отскок 0,15 (по замерам UIKit Codename One было 0,4 с — на живом айфоне вдвое быстрее);
     • в пути линза растягивается почти вдвое и накрывает обе вкладки, к приезду собирается обратно (≈ 0,1 с) — растяжение по скорости через короткую пружину;
     • касание — линза сразу становится поднятым стеклом (≈ 0,1 с, без отскока) и держится им ≈ 0,28 с от касания, даже если палец уже отпустили; потом за ≈ 0,15 с
       оседает в серую подложку (без отскока: в версии 1 был отскок 0,3 — линза проседала ниже покоя и «прыгала»);
     • версия 3.3 (08.11.2026): перемер по краям самого стекла — растяжение в пути ≈ 15 %, а не вдвое (синий под линзой убегал вперёд), переезд 0,34 с / 0,12,
       за пальцем 0,26 с; «рыбий глаз»: середина ×1,3, у кромки то, что снаружи, втянуто внутрь — сжато по ширине ×0,78 и вытянуто по высоте ×1,15, как изгиб у края стекла; поднятая шире на 14 px и почти вровень с панелью;
     • (3.2) поднятая линза выше панели на 5 px сверху и снизу и шире вкладки на 20 px; у краёв — полоса преломления: то, что под линзой, там крупнее и с радужной каймой,
       внутри — ровно и чуть крупнее (×1,18), цвет под ней чуть светлее;
     • вся панель на касание чуть растёт — до ×1,03 пружиной ω 17,6, ζ 0,59 (замер UIKit), свой сдвиг панели сохраняется;
     • за пальцем линза идёт своей пружиной 0,196 с, отскок 0,1; отпустили — вкладка ПОД ПАЛЬЦЕМ (быстрый бросок — соседняя по ходу), скорость не сбрасывается;
     • протянули линзу через вкладку — лёгкий щелчок (Telegram HapticFeedback), как в iOS. */
  var LQ = { travel: [0.46, 0.12], follow: [0.32, 0.06], lift: 0.12, drop: 0.24, hold: 0.36, swell: [0.357, 0.41], gel: 0.1, gelK: 4000, gelMax: 0.15, fling: 800, rim: [0.78, 1.15], band: [12, 5] };
  function hapticTick() {
    try {
      var w = window.Telegram && window.Telegram.WebApp, h = w && w.HapticFeedback;
      if (h && (!w.isVersionAtLeast || w.isVersionAtLeast('6.1'))) { h.selectionChanged(); }
    } catch (e) { /* без отклика — не страшно */ }
  }
  /* линзовое преломление поднятой линзы — WebGL (версия 4.0, 08.11.2026). Почему не SVG-фильтр: Telegram на iPhone не рисует CSS filter: url(#svg) с картой
     смещения — разработчик видел на телефоне «старую линзу» при новой версии страницы, хотя Edge и WebKit под Windows рисовали. WebGL в WebView iOS и Android есть всегда.
     • Ряд вкладок (копия под линзой, в цвете акцента) один раз рисуется в картинку: значки — их же контурами (path, circle, rect, line, use → symbol), подписи — текстом
       тем же шрифтом; картинка уходит в текстуру. Перерисовка — при смене размеров, темы, цвета акцента и после загрузки шрифтов.
     • Каждый кадр поднятой линзы шейдер считает «толстую линзу» (подобрана на модели рядом со снимками Apple и Telegram): по эллиптическому радиусу u
       s(u) = s0·u − (s0 − d1)·u^(q+1)/(q+1) — середина почти как есть, к краю всё крупнее, у кромки мазок до края.
     • Радуга — пять выборок с чуть разной силой преломления (красный → фиолетовый), веса цветов в сумме дают белый: посередине выборки совпадают и цвет чистый,
       у кромки расходятся веером — как пламя бейджа «43» на снимке Telegram. У кромки — дымка цвета панели. */
  var FX = { s0: 1.0, q: 1.7, d1: 0.06, rim: 0.62, frost: 0.38, M: 18, V: 16, gw: 0.14, gh: 20, disp: [1.2, 1.1, 1.0, 0.91, 0.83] };
  var GL_VS = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
  var GL_FS = [
    'precision mediump float;',
    'uniform sampler2D tex;uniform vec2 res;uniform vec2 c;uniform vec2 hs;uniform float R;uniform float lift;',
    'uniform float s0;uniform float q;uniform float d1;uniform float rim;uniform vec3 frost;uniform float frostA;uniform float dsp[5];',
    'vec4 at(vec2 p){return texture2D(tex,vec2(p.x/res.x,1.-p.y/res.y));}',
    'void main(){',
    ' vec2 p=vec2(gl_FragCoord.x,res.y-gl_FragCoord.y);vec2 d=p-c;',
    ' float ex=max(abs(d.x)-(hs.x-R),0.);if(length(vec2(ex,d.y))>R){discard;}',
    ' float u=clamp(length(d/hs),.0001,1.);',
    ' float s=s0*u-(s0-d1)*pow(u,q+1.)/(q+1.);float k=(s/u-1.)*lift;',
    ' vec4 t0=at(c+d*(1.+k*dsp[0]));vec4 t1=at(c+d*(1.+k*dsp[1]));vec4 t2=at(c+d*(1.+k*dsp[2]));vec4 t3=at(c+d*(1.+k*dsp[3]));vec4 t4=at(c+d*(1.+k*dsp[4]));',
    // веса пяти цветов спектра; суммы по R, G, B — по единице: где выборки совпадают, цвет не меняется
    ' vec3 col=t0.rgb*vec3(.5,0.,0.)+t1.rgb*vec3(.35,.3,0.)+t2.rgb*vec3(.15,.4,.1)+t3.rgb*vec3(0.,.3,.45)+t4.rgb*vec3(0.,0.,.45);',
    ' float al=t0.a*.167+t1.a*.217+t2.a*.217+t3.a*.25+t4.a*.149;',
    ' float e=clamp((u-rim)/(1.-rim),0.,1.);e=e*e*(3.-2.*e);float fa=e*e*frostA*lift;',
    ' gl_FragColor=vec4(col*(1.-fa)+frost*fa,al*(1.-fa)+fa);',
    '}'
  ].join('\n');
  function svgShapes(node, out) { // фигуры значка, включая use → symbol
    var kids = node.children || [];
    for (var i = 0; i < kids.length; i++) {
      var n = kids[i], tag = (n.tagName || '').toLowerCase();
      if (tag === 'use') {
        var ref = n.getAttribute('href') || n.getAttribute('xlink:href'), sym = ref && ref.charAt(0) === '#' ? document.getElementById(ref.slice(1)) : null;
        if (sym) { svgShapes(sym, out); }
      } else if (tag === 'g' || tag === 'symbol') { svgShapes(n, out); } else { out.push(n); }
    }
    return out;
  }
  function shapePath(n) {
    var tag = n.tagName.toLowerCase(), p = new Path2D(), a = function (k) { return parseFloat(n.getAttribute(k)) || 0; };
    if (tag === 'path') { return new Path2D(n.getAttribute('d') || ''); }
    if (tag === 'circle') { p.arc(a('cx'), a('cy'), a('r'), 0, Math.PI * 2); return p; }
    if (tag === 'ellipse') { p.ellipse(a('cx'), a('cy'), a('rx'), a('ry'), 0, 0, Math.PI * 2); return p; }
    if (tag === 'rect') { p.rect(a('x'), a('y'), a('width'), a('height')); return p; }
    if (tag === 'line') { p.moveTo(a('x1'), a('y1')); p.lineTo(a('x2'), a('y2')); return p; }
    if (tag === 'polyline' || tag === 'polygon') {
      var pts = (n.getAttribute('points') || '').trim().split(/[\s,]+/).map(parseFloat);
      for (var i = 0; i + 1 < pts.length; i += 2) { if (i) { p.lineTo(pts[i], pts[i + 1]); } else { p.moveTo(pts[i], pts[i + 1]); } }
      if (tag === 'polygon') { p.closePath(); }
      return p;
    }
    return null;
  }
  function drawRow(ctx, copy, ox, oy, hole) { // ряд-копия → картинка: значки контурами, подписи текстом
    var base = copy.getBoundingClientRect();
    [].forEach.call(copy.querySelectorAll('svg'), function (svg) {
      var r = svg.getBoundingClientRect(), cs = getComputedStyle(svg), vb = (svg.getAttribute('viewBox') || '0 0 24 24').split(/[\s,]+/).map(parseFloat);
      var uses = svg.querySelector('use'), sym = uses && document.getElementById((uses.getAttribute('href') || uses.getAttribute('xlink:href') || '').slice(1));
      if (sym && sym.getAttribute('viewBox')) { vb = sym.getAttribute('viewBox').split(/[\s,]+/).map(parseFloat); }
      if (!r.width || !vb[2]) { return; }
      ctx.save();
      ctx.translate(ox + r.left - base.left, oy + r.top - base.top);
      ctx.scale(r.width / vb[2], r.height / vb[3]);
      ctx.translate(-vb[0], -vb[1]);
      svgShapes(svg, []).forEach(function (n) {
        var p = shapePath(n);
        if (!p) { return; }
        var own = n.ownerSVGElement === svg ? getComputedStyle(n) : null;
        var fill = n.getAttribute('fill') || (own ? own.fill : cs.fill), stroke = n.getAttribute('stroke') || (own ? own.stroke : cs.stroke);
        var sw = parseFloat(n.getAttribute('stroke-width') || (own ? own.strokeWidth : cs.strokeWidth)) || 1;
        if (/(^|\s)hole(\s|$)/.test(n.getAttribute('class') || '')) { fill = hole; stroke = 'none'; }
        if (fill === 'currentColor') { fill = cs.color; }
        if (stroke === 'currentColor') { stroke = cs.color; }
        if (fill && fill !== 'none' && !/rgba\(0, 0, 0, 0\)/.test(fill)) { ctx.fillStyle = fill; ctx.fill(p); }
        if (stroke && stroke !== 'none' && !/rgba\(0, 0, 0, 0\)/.test(stroke)) {
          ctx.strokeStyle = stroke;
          ctx.lineWidth = sw;
          ctx.lineCap = (own || cs).strokeLinecap || 'round';
          ctx.lineJoin = (own || cs).strokeLinejoin || 'round';
          ctx.stroke(p);
        }
      });
      ctx.restore();
    });
    var walk = document.createTreeWalker(copy, NodeFilter.SHOW_TEXT, null, false), t;
    while ((t = walk.nextNode())) {
      if (!t.nodeValue.trim() || (t.parentNode.closest && t.parentNode.closest('svg'))) { continue; }
      var rg = document.createRange();
      rg.selectNodeContents(t);
      var rr = rg.getBoundingClientRect(), pcs = getComputedStyle(t.parentNode);
      if (!rr.width) { continue; }
      ctx.font = pcs.fontStyle + ' ' + pcs.fontWeight + ' ' + pcs.fontSize + ' ' + pcs.fontFamily;
      ctx.fillStyle = pcs.color;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      ctx.fillText(t.nodeValue.trim(), ox + rr.left - base.left + rr.width / 2, oy + rr.top - base.top + rr.height / 2);
    }
  }
  function makeGl(host) {
    var cv = document.createElement('canvas'), gl = null;
    try { gl = cv.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false }) || cv.getContext('experimental-webgl'); } catch (e) { gl = null; }
    if (!gl || typeof Path2D === 'undefined') { return null; }
    var sh = function (type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null; };
    var vs = sh(gl.VERTEX_SHADER, GL_VS), fs = sh(gl.FRAGMENT_SHADER, GL_FS);
    if (!vs || !fs) { return null; }
    var pr = gl.createProgram();
    gl.attachShader(pr, vs);
    gl.attachShader(pr, fs);
    gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { return null; }
    gl.useProgram(pr);
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(pr, 'a');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T].forEach(function (k) { gl.texParameteri(gl.TEXTURE_2D, k, gl.CLAMP_TO_EDGE); });
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    var u = {};
    ['res', 'c', 'hs', 'R', 'lift', 's0', 'q', 'd1', 'rim', 'frost', 'frostA', 'dsp'].forEach(function (k) { u[k] = gl.getUniformLocation(pr, k); });
    gl.uniform1f(u.s0, FX.s0);
    gl.uniform1f(u.q, FX.q);
    gl.uniform1f(u.d1, FX.d1);
    gl.uniform1f(u.rim, FX.rim);
    gl.uniform1f(u.frostA, FX.frost);
    gl.uniform1fv(u.dsp, new Float32Array(FX.disp));
    cv.className = 'ios-lq__gl';
    cv.setAttribute('aria-hidden', 'true');
    cv.style.cssText = 'position:absolute;z-index:3;left:0;top:0;pointer-events:none;visibility:hidden';
    host.appendChild(cv);
    return { cv: cv, gl: gl, u: u, tex: tex, dpr: 1, w: 0, h: 0 };
  }
  function glRaster(g, copy, RW, RH, ox, oy, hole) { // перерисовать картинку ряда и отдать в текстуру
    var dpr = Math.min(3, window.devicePixelRatio || 1), W = Math.max(1, Math.round(RW * dpr)), H = Math.max(1, Math.round(RH * dpr));
    var oc = document.createElement('canvas'), ctx;
    oc.width = W;
    oc.height = H;
    ctx = oc.getContext('2d');
    ctx.scale(dpr, dpr);
    drawRow(ctx, copy, ox, oy, hole);
    g.cv.width = W;
    g.cv.height = H;
    g.cv.style.width = RW + 'px';
    g.cv.style.height = RH + 'px';
    g.dpr = dpr;
    g.w = W;
    g.h = H;
    var gl = g.gl;
    gl.viewport(0, 0, W, H);
    gl.bindTexture(gl.TEXTURE_2D, g.tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, oc);
    gl.uniform2f(g.u.res, W, H);
  }
  function glDraw(g, cx, cy, hw, hh, lift, frost) {
    var gl = g.gl, d = g.dpr;
    gl.uniform2f(g.u.c, cx * d, cy * d);
    gl.uniform2f(g.u.hs, hw * d, hh * d);
    gl.uniform1f(g.u.R, hh * d);
    gl.uniform1f(g.u.lift, lift);
    gl.uniform3f(g.u.frost, frost[0], frost[1], frost[2]);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
  function liquid(el) {
    if (!el || el.liquid) { return; }
    var items = el.querySelector('.ios-lq__items'), lens = el.querySelector('.ios-lq__lens');
    if (!items || !lens) { return; }
    var btns = [].slice.call(items.children), tabbar = el.classList.contains('ios-tabbar');
    var mag = parseFloat(el.getAttribute('data-mag') || (tabbar ? '1.3' : '1'));
    var press = parseFloat(el.getAttribute('data-press') || '1.12'); // сегменты: линза растёт в долю своего размера; у панели вкладок — на 16 px и за края
    var swell = parseFloat(el.getAttribute('data-swell') || (tabbar ? '1.03' : '1'));
    var copy = items.cloneNode(true); // копия ряда под линзой: увеличена вокруг центра линзы и в цвете акцента
    copy.className += ' ios-lq__items--lens';
    copy.setAttribute('aria-hidden', 'true');
    copy.removeAttribute('role');
    copy.removeAttribute('id');
    [].forEach.call(copy.querySelectorAll('*'), function (n) {
      ['id', 'role', 'aria-selected', 'aria-pressed', 'aria-controls', 'aria-label', 'aria-current'].forEach(function (a) { n.removeAttribute(a); });
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
    var rim = null; // полоса преломления у краёв поднятой линзы: та же копия крупнее, с радужной каймой, видна только кольцом у кромки
    if (tabbar && el.getAttribute('data-rim') !== 'off') {
      rim = copy.cloneNode(true);
      rim.className += ' ios-lq__items--rim';
      el.insertBefore(rim, copy);
    }
    var gl = tabbar && el.getAttribute('data-fx') !== 'off' ? makeGl(el) : null; // настоящее стекло (WebGL); без него — прежняя полоса rim
    if (gl && rim) { el.removeChild(rim); rim = null; }
    var RW = 0, RH = 0, pm = 0, frostRGB = [1, 1, 1], rasterKey = ''; // холст — ряд с запасом сбоку (не шире панели) и сверху/снизу
    var sel = 0;
    btns.forEach(function (b, k) { if (b.getAttribute('aria-selected') === 'true' || b.getAttribute('aria-pressed') === 'true') { sel = k; } });
    var X = new Spring(0, LQ.travel[0], LQ.travel[1], 0.2), W = new Spring(0, LQ.travel[0], 0, 0.2);
    var L = new Spring(0, LQ.lift, 0, 0.004), B = new Spring(0, LQ.swell[0], LQ.swell[1], 0.003), G = new Spring(0, LQ.gel, 0, 0.002);
    var baseT = '', rest = { top: 0, h: 0 }, self = { el: el }, dropTimer = 0;

    function slot(i) { var b = btns[i]; return { x: items.offsetLeft + b.offsetLeft, w: b.offsetWidth }; }
    function slotAt(lx, d) { var i = d; btns.forEach(function (b, k) { var s = slot(k); if (lx >= s.x && lx <= s.x + s.w) { i = k; } }); return i; }
    function nearest(cx) { var near = sel, best = 1e9; btns.forEach(function (b, k) { var s = slot(k), d = Math.abs(s.x + s.w / 2 - cx); if (d < best) { best = d; near = k; } }); return near; }
    function local(e) { var r = el.getBoundingClientRect(), sc = r.width / (el.offsetWidth || r.width || 1); return (e.clientX - r.left) / (sc || 1); } // панель может быть чуть увеличена касанием
    function place() {
      lens.style.height = '';
      if (gl) { pm = Math.min(FX.M, parseFloat(getComputedStyle(el).paddingLeft) || 0); } // сбоку окошко не шире панели: иначе у неё прокрутка вбок (e2e «крупно»)
      el.style.transform = '';   // свой сдвиг панели (например translateX(-50%)) сохраняется, разбухание — поверх него
      var bt = getComputedStyle(el).transform; baseT = bt && bt !== 'none' ? bt + ' ' : '';
      rest.top = lens.offsetTop;
      rest.h = lens.offsetHeight;
      copy.style.left = items.offsetLeft + 'px';
      copy.style.top = items.offsetTop + 'px';
      copy.style.width = items.offsetWidth + 'px';
      copy.style.height = items.offsetHeight + 'px';
      if (gl) {
        RW = items.offsetWidth + 2 * pm;
        RH = items.offsetHeight + 2 * FX.V;
        gl.cv.style.left = (items.offsetLeft - pm) + 'px';
        gl.cv.style.top = (items.offsetTop - FX.V) + 'px';
        var bg = getComputedStyle(el).backgroundColor, mm = /rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)/.exec(bg) || [0, 255, 255, 255];
        frostRGB = [mm[1] / 255, mm[2] / 255, mm[3] / 255]; // дымка у кромки — цвета панели (светлая или тёмная)
        rasterKey = '';
        raster();
      }
      if (rim) { rim.style.cssText = copy.style.cssText; }
    }
    function raster() { // картинка ряда для стекла: по копии под линзой (цвет акцента), перерисовывается при смене размеров, темы, цвета
      if (!gl) { return; }
      var key = [RW, RH, getComputedStyle(copy).color, getComputedStyle(el).backgroundColor, document.documentElement.className, document.documentElement.getAttribute('data-theme'), document.documentElement.getAttribute('data-accent')].join('|');
      if (key === rasterKey) { return; }
      rasterKey = key;
      var vis = copy.style.visibility, cp = copy.style.clipPath, tr = copy.style.transform;
      copy.style.clipPath = 'none';
      copy.style.transform = 'none';
      glRaster(gl, copy, RW, RH, pm, FX.V, getComputedStyle(el).backgroundColor);
      copy.style.clipPath = cp;
      copy.style.transform = tr;
      copy.style.visibility = vis;
    }
    function ringMask(x0, x1, t0, b0, rx, ry, bx, by) { // кольцо по кромке капсулы: у концов толщина bx (там главное преломление), сверху и снизу — by
      var cy = (t0 + b0) / 2, H = items.offsetHeight, mid = Math.max(0, x1 - x0 - 2 * rx), ex = Math.max(0.1, rx - bx), ey = Math.max(0.1, ry - by);
      var end = function (at) { return 'radial-gradient(' + ex.toFixed(1) + 'px ' + ey.toFixed(1) + 'px at ' + at + 'px ' + cy.toFixed(1) + 'px, transparent 97%, #000 100%)'; };
      return {
        img: end(rx.toFixed(1)) + ', ' + end(0) + ', linear-gradient(#000 ' + (t0 + by).toFixed(1) + 'px, transparent ' + (t0 + by + 0.6).toFixed(1) + 'px, transparent ' + (b0 - by - 0.6).toFixed(1) + 'px, #000 ' + (b0 - by).toFixed(1) + 'px)',
        pos: x0.toFixed(1) + 'px 0, ' + (x1 - rx).toFixed(1) + 'px 0, ' + (x0 + rx).toFixed(1) + 'px 0',
        size: rx.toFixed(1) + 'px ' + H + 'px, ' + rx.toFixed(1) + 'px ' + H + 'px, ' + mid.toFixed(1) + 'px ' + H + 'px'
      };
    }
    function render() {
      var l = clamp(L.x, 0, 1), g = clamp(G.x, 0, LQ.gelMax);
      var gx = tabbar ? W.x * FX.gw : W.x * (press - 1), gy = tabbar ? FX.gh : rest.h * (press - 1); // как у Apple и Telegram: выше панели (выходит сверху и снизу), шире своей высоты ≈ ×1,35
      var w = (W.x + gx * l) * (1 + g), h = (rest.h + gy * l) * (1 - g * 0.12); // поднятая — шире и выше панели; в пути вытягивается по ходу
      lens.style.width = w.toFixed(2) + 'px';
      lens.style.height = h.toFixed(2) + 'px';
      lens.style.transform = 'translate3d(' + (X.x + (W.x - w) / 2).toFixed(2) + 'px,' + ((rest.h - h) / 2).toFixed(2) + 'px,0)';
      var b = clamp(B.x, -0.3, 1.3);
      el.style.transform = Math.abs(b) > 0.002 ? baseT + 'scale(' + (1 + (swell - 1) * b).toFixed(4) + ')' : '';
      el.style.setProperty('--press', l.toFixed(3));
      var cx = X.x + W.x / 2 - items.offsetLeft, half = w / 2, cy = rest.top + rest.h / 2 - items.offsetTop, vh = h / 2;
      el.style.setProperty('--l', (cx - half).toFixed(1));
      el.style.setProperty('--r', (cx + half).toFixed(1));
      if (gl) { // стекло считает WebGL: копия ряда видна только в покое (серая подложка), поднятая линза — холст
        var on = l > 0.01;
        copy.style.transform = 'none';
        copy.style.clipPath = 'inset(' + (cy - vh).toFixed(1) + 'px ' + (items.offsetWidth - cx - half).toFixed(1) + 'px ' + (items.offsetHeight - cy - vh).toFixed(1) + 'px ' + (cx - half).toFixed(1) + 'px round ' + vh.toFixed(1) + 'px)';
        copy.style.visibility = on ? 'hidden' : '';
        gl.cv.style.visibility = on ? '' : 'hidden';
        if (on) { glDraw(gl, cx + pm, cy + FX.V, half, vh, l, frostRGB); }
        return;
      }
      var m = 1 + (mag - 1) * l; // увеличение только под поднятой линзой
      copy.style.transformOrigin = cx.toFixed(1) + 'px ' + cy.toFixed(1) + 'px';
      copy.style.transform = 'scale(' + m.toFixed(4) + ')';
      var bx = rim ? Math.min(LQ.band[0] * l, vh * 0.5) : 0, by = rim ? LQ.band[1] * l : 0, ih = half - bx, iv = vh - by; // внутри кольца — ровная копия; кольцо — у rim
      var Lc = cx - ih / m, Rc = cx + ih / m, Tc = cy - iv / m, Bc = cy + iv / m;
      copy.style.clipPath = 'inset(' + Tc.toFixed(1) + 'px ' + (items.offsetWidth - Rc).toFixed(1) + 'px ' + (items.offsetHeight - Bc).toFixed(1) + 'px ' + Lc.toFixed(1) + 'px round ' + ((vh - bx) / m).toFixed(1) + 'px / ' + (iv / m).toFixed(1) + 'px)';
      if (rim) {
        if (bx < 0.3) { rim.style.visibility = 'hidden'; } else {
          var mx = 1 + (LQ.rim[0] - 1) * l, my = 1 + (LQ.rim[1] - 1) * l; // у концов стекло тянет то, что под ним, вбок — копия шире, почти не выше
          var x0 = cx - half / mx, x1 = cx + half / mx, t0 = cy - vh / my, b0 = cy + vh / my, ring = ringMask(x0, x1, t0, b0, vh / mx, vh / my, bx / mx, by / my);
          rim.style.visibility = '';
          rim.style.transformOrigin = copy.style.transformOrigin;
          rim.style.transform = 'scale(' + mx.toFixed(4) + ',' + my.toFixed(4) + ')';
          rim.style.clipPath = 'inset(' + t0.toFixed(1) + 'px ' + (items.offsetWidth - x1).toFixed(1) + 'px ' + (items.offsetHeight - b0).toFixed(1) + 'px ' + x0.toFixed(1) + 'px round ' + (vh / mx).toFixed(1) + 'px / ' + (vh / my).toFixed(1) + 'px)';
          rim.style.webkitMaskImage = rim.style.maskImage = ring.img;
          rim.style.webkitMaskPosition = rim.style.maskPosition = ring.pos;
          rim.style.webkitMaskSize = rim.style.maskSize = ring.size;
          rim.style.webkitMaskRepeat = rim.style.maskRepeat = 'no-repeat';
        }
      }
    }
    self.tick = function (dt) {
      var a = X.step(dt), b = W.step(dt), c = L.step(dt), d = B.step(dt);
      G.t = reduce ? 0 : clamp(Math.abs(X.v) / LQ.gelK, 0, LQ.gelMax);
      var e = G.step(dt);
      render();
      return a || b || c || d || e || !!drag;
    };
    function select(i, user, dragged) {
      i = clamp(i, 0, btns.length - 1);
      var t = slot(i);
      X.tune(LQ.travel[0], LQ.travel[1]);
      X.t = t.x;
      W.t = t.w;
      if (i !== sel || user === 'force') {
        sel = i;
        btns.forEach(function (b, k) {
          if (b.hasAttribute('aria-selected')) { b.setAttribute('aria-selected', String(k === i)); }
          if (b.hasAttribute('aria-pressed')) { b.setAttribute('aria-pressed', String(k === i)); }
        });
        if (user && user !== 'force') { fire(el, 'liquid:change', { index: i, value: btns[i].getAttribute('data-value') || String(i), drag: !!dragged }); }
      }
      wake(self);
    }
    // касание: линза сразу едет к вкладке под пальцем и поднимается, панель чуть растёт; тянуть — линза идёт за пальцем своей пружиной;
    // отпустить — вкладка под пальцем (быстрый бросок — соседняя по ходу)
    var drag = null;
    el.addEventListener('pointerdown', function (e) {
      if (e.button !== 0 || e.isPrimary === false) { return; }
      var lx = local(e), center = X.x + W.x / 2, under = slotAt(lx, sel);
      drag = { id: e.pointerId, start: lx, grab: lx - center, onLens: Math.abs(lx - center) < W.x / 2, under: under, near: under, moved: false, t0: e.timeStamp, hist: [{ x: lx, t: e.timeStamp }] };
      clearTimeout(dropTimer);
      L.tune(LQ.lift, 0);
      L.t = 1;
      B.t = 1;
      if (!drag.onLens) { var t = slot(under); X.tune(LQ.travel[0], LQ.travel[1]); X.t = t.x; W.t = t.w; }
      wake(self);
    });
    el.addEventListener('pointermove', function (e) {
      if (!drag || e.pointerId !== drag.id) { return; }
      var lx = local(e);
      if (!drag.moved) {
        if (Math.abs(lx - drag.start) < 6) { return; }
        drag.moved = true;
        try { el.setPointerCapture(e.pointerId); } catch (z) { /* без захвата тоже работает */ }
        drag.grab = drag.onLens ? clamp(drag.grab, -W.x / 2, W.x / 2) : 0;
        X.tune(LQ.follow[0], LQ.follow[1]);
      }
      var min = slot(0).x, max = slot(btns.length - 1).x, x = lx - drag.grab - W.x / 2;
      if (x < min) { x = min + rubber(x - min, el.clientWidth); }
      if (x > max) { x = max + rubber(x - max, el.clientWidth); }
      X.t = x;
      var near = nearest(x + W.x / 2);
      if (near !== drag.near) { drag.near = near; hapticTick(); }
      W.t = slot(near).w;
      drag.hist.push({ x: lx, t: e.timeStamp });
      if (drag.hist.length > 12) { drag.hist.shift(); }
      wake(self);
    });
    function end(e, cancel) {
      if (!drag || e.pointerId !== drag.id) { return; }
      var d = drag;
      drag = null;
      L.tune(LQ.drop, 0);
      var hold = reduce ? 0 : LQ.hold * 1000 - (e.timeStamp - d.t0); // короткое касание: стекло держится до ≈ 0,28 с от касания, как на айфоне
      clearTimeout(dropTimer);
      if (hold > 16) { dropTimer = setTimeout(function () { if (!drag) { L.t = 0; B.t = 0; wake(self); } }, hold); } else { L.t = 0; B.t = 0; }
      if (d.moved) { // протягивание перехватила система (pointercancel) — вкладка под последним положением пальца, без прыжка
        var last = d.hist[d.hist.length - 1], real = e.type === 'pointerup' && (e.clientX || e.clientY), lx = real ? local(e) : last.x; // iOS при перехвате касания шлёт clientX = 0 — берём последнее настоящее положение пальца
        var v = cancel || e.timeStamp - last.t > 120 ? 0 : velocity(d.hist); // палец замер перед отпусканием — броска нет
        var i = nearest(clamp(lx - d.grab, slot(0).x, slot(btns.length - 1).x + slot(btns.length - 1).w));
        if (Math.abs(v) > LQ.fling) { var s = slot(i), mid = s.x + s.w / 2, ahead = v > 0 ? lx - d.grab > mid - s.w * 0.1 : lx - d.grab < mid + s.w * 0.1; if (ahead) { i += v > 0 ? 1 : -1; } }
        select(i, true, true); // скорость линзы не сбрасывается: доезжает с того места и с той скоростью, что была
      } else if (!cancel) {
        select(d.under, true, false);
        if (owned && e.pointerType === 'touch') { owned = false; btns[d.under].click(); } // касание забрали у системы — родного click не будет, нажимаем сами
      } else { select(sel); }
      wake(self);
    }
    // iOS (Telegram): долгое касание иначе забирает системный жест — линзу не поводить. Касание панели вкладок целиком наше, нажатие вкладки — наш click
    var owned = false;
    if (tabbar) {
      el.addEventListener('touchstart', function (e) { owned = e.touches.length === 1; if (owned && e.cancelable) { e.preventDefault(); } }, { passive: false });
      el.addEventListener('touchmove', function (e) { if (owned && e.cancelable) { e.preventDefault(); } }, { passive: false });
    }
    el.addEventListener('pointerup', function (e) { end(e, false); });
    el.addEventListener('pointercancel', function (e) { end(e, true); });
    el.addEventListener('lostpointercapture', function (e) { if (e.target === el && drag && drag.moved) { end(e, true); } }); // только своё: кнопка теряет касание, когда его забирает панель, — это не конец жеста
    watchSize(el, function () { place(); var t = slot(sel); X.jump(t.x); W.jump(t.w); render(); });
    // выбранное поменяло само приложение (aria-pressed / aria-selected) — линза едет туда же, без события
    if (typeof MutationObserver !== 'undefined') {
      new MutationObserver(function () {
        var now = -1;
        btns.forEach(function (b, k) { if (b.getAttribute('aria-selected') === 'true' || b.getAttribute('aria-pressed') === 'true') { now = k; } });
        if (now >= 0 && now !== sel && !drag) { select(now, false); }
      }).observe(items, { attributes: true, subtree: true, attributeFilter: ['aria-pressed', 'aria-selected'] });
    }
    if (gl && typeof MutationObserver !== 'undefined') { new MutationObserver(function () { if (el.isConnected !== false) { raster(); } }).observe(document.documentElement, { attributes: true }); }
    if (gl && document.fonts && document.fonts.ready) { document.fonts.ready.then(function () { rasterKey = ''; raster(); }); }
    place();
    var t0 = slot(sel);
    X.jump(t0.x);
    W.jump(t0.w);
    select(sel, 'force');
    L.jump(0);
    B.jump(0);
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
