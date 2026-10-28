/* Обучение «Как пользоваться» (28.10.2026). Подключение: после app.css, перед app.js (defer). Без зависимостей, ES5, строгий CSP: только этот файл.
   window.FINTOUR.open({ manual, onClose }) — пять листов поверх приложения (внутри #root):
     0 знакомство (кошелёк) · 1 «Трата» · 2 «Цели» · 3 «Аналитика» · 4 финал (кошелёк с картами категорий).
   В телефоне проигрывается настоящий сценарий приложения: кадры app/tour/<тема>-<стиль>/<сцена>-<N>.jpg (снимает tools/tour_frames.py с работающего
   приложения на условных данных), места касаний — SCENES ниже (tools/tour_frames.py переписывает блок между метками).
   Палец идёт к месту 0,7 с, «сюда» 0,25 с, нажатие 0,16 с, новый экран проявляется 0,36 с; на шаг ≈ 1,7 с. Лист меняется каруселью (телефон уезжает и въезжает).
   manual = true (из настроек): последний лист «Вот и всё», кнопка «Готово», «Пропустить» закрывает. Иначе (первый запуск): «Выбрать категории».
   onClose(kind) — kind: 'done' (дошли до конца) или 'skip'. */
(function () {
  "use strict";
  var REV = 1;   // поднять, когда пересняты кадры или значки: имена файлов те же, кэш телефона иначе держит старые
  /*SCENES:начало*/
  var SCENES = {"add": [{"img": "add-0", "tap": [195, 718]}, {"img": "add-1", "tap": [76, 544]}, {"img": "add-2", "tap": [195, 544]}, {"img": "add-3", "tap": [76, 380]}, {"img": "add-4", "tap": [284, 782]}, {"img": "add-5", "tap": null}], "goals": [{"img": "goals-0", "tap": [239, 779]}, {"img": "goals-1", "tap": [195, 329]}, {"img": "goals-2", "tap": [106, 782]}, {"img": "goals-3", "tap": [76, 544]}, {"img": "goals-4", "tap": [195, 602]}, {"img": "goals-5", "tap": [195, 718]}, {"img": "goals-6", "tap": [195, 782]}, {"img": "goals-7", "tap": null}], "stats": [{"img": "stats-0", "tap": [326, 779]}, {"img": "stats-1", "tap": [104, 422]}, {"img": "stats-2", "tap": null}]};
  /*SCENES:конец*/
  var SCENE_OF = [null, "add", "goals", "stats", null];
  var N = 5;
  var reduce = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  function svg(d) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + d + "</svg>"; }
  var ICON_CART = svg('<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>');
  var ICON_WALLET = svg('<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>');
  var ICON_CAR = svg('<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>');
  var ICON_SHIRT = svg('<path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/>');
  var ICON_REPEAT = svg('<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>');

  function markup(manual) {
    var last = manual
      ? '<h2>Вот и всё</h2><p>Если что-то забудете, обучение всегда в настройках, в разделе «Помощь».</p>'
      : '<h2>Последний шаг</h2><p>Отметьте, на что вы тратите. Поменять можно в любой момент в настройках.</p>';
    return '' +
      '<div class="tour__top"><div class="tour__bars"><i><b></b></i><i><b></b></i><i><b></b></i><i><b></b></i><i><b></b></i></div><button type="button" class="tour__skip">Пропустить</button></div>' +
      '<div class="tour__stage">' +
        '<div class="tour__wallet" aria-hidden="true"><span class="tour__floor"></span><div class="tour__bob"><img class="tour__hero" src="tour/hero.png?r=' + REV + '" alt="" width="1400" height="1400"><img class="tour__cards" src="tour/cards-strict.png?r=' + REV + '" alt="" width="1400" height="1400"></div></div>' +
        '<div class="tour__dev" aria-hidden="true"><div class="tour__win"><div class="tour__cam"><div class="tour__shots"></div><span class="tour__aim"><i></i></span><span class="tour__finger"><i></i></span></div><span class="tour__glass"></span></div></div>' +
        '<div class="tour__pop tour__pop--add" data-pop="add"><div class="tour__prow"><span class="tour__pic" data-c="orange">' + ICON_CART + '</span><span class="tour__pt"><b>Продукты</b><small>трата добавлена</small></span><span class="tour__psum">−12<i>,00</i></span></div></div>' +
        '<div class="tour__pop tour__pop--goals" data-pop="goals"><div class="tour__prow"><span class="tour__pic" data-c="purple">' + ICON_WALLET + '</span><span class="tour__pt"><b>Подушка</b><small>1 690 из 5 000 · +150</small></span><span class="tour__psum">34<i>%</i></span></div><div class="tour__pbar"><b></b></div></div>' +
        '<div class="tour__pop tour__pop--stats" data-pop="stats"><div class="tour__phead"><span>Куда ушло</span><span>октябрь</span></div><div class="tour__plist">' +
          '<div class="tour__prow"><span class="tour__pic" data-c="indigo">' + ICON_CAR + '</span><span>Авто</span><data>200,00</data></div>' +
          '<div class="tour__prow"><span class="tour__pic" data-c="mint">' + ICON_SHIRT + '</span><span>Одежда</span><data>130,00</data></div>' +
          '<div class="tour__prow"><span class="tour__pic" data-c="blue">' + ICON_REPEAT + '</span><span>Подписки</span><data>85,75</data></div>' +
        '</div></div>' +
      '</div>' +
      '<div class="tour__copies">' +
        '<div class="tour__copy tour__copy--hero"><span class="tour__badge"><img src="appicon.png" alt="" width="22" height="22">Финансы</span><h2>Деньги под контролем за пару касаний в день</h2><p>Покажем, как всё устроено. Займёт полминуты.</p></div>' +
        '<div class="tour__copy" data-scene="add"><h2>Трата за три касания</h2><ol class="tour__steps"><li data-from="0"><b>1</b>Нажмите «Добавить»</li><li data-from="1"><b>2</b>Наберите сумму</li><li data-from="3"><b>3</b>Выберите категорию</li></ol></div>' +
        '<div class="tour__copy" data-scene="goals"><h2>Копите на свои цели</h2><ol class="tour__steps"><li data-from="0"><b>1</b>Откройте «Цели»</li><li data-from="1"><b>2</b>Нажмите на цель</li><li data-from="2"><b>3</b>Отложите сумму</li></ol></div>' +
        '<div class="tour__copy" data-scene="stats"><h2>Куда уходят деньги</h2><ol class="tour__steps"><li data-from="0"><b>1</b>Откройте «Аналитику»</li><li data-from="1"><b>2</b>Нажмите «Куда ушло»</li><li data-from="2"><b>3</b>Листайте категории за месяц</li></ol></div>' +
        '<div class="tour__copy tour__copy--hero">' + last + '</div>' +
      '</div>' +
      '<div class="tour__foot"><button type="button" class="tour__back" aria-label="Назад" hidden>‹</button><button type="button" class="tour__next"><span>Начать</span></button></div>';
  }

  function open(opts) {
    opts = opts || {};
    if (document.getElementById("tour")) { return; }
    var manual = !!opts.manual, host = document.getElementById("root") || document.body, html = document.documentElement;
    var theme = html.getAttribute("data-theme") === "dark" ? "dark" : "light", style = html.getAttribute("data-style") === "color" ? "color" : "strict";
    var LABEL = ["Начать", "Дальше", "Дальше", "Дальше", manual ? "Готово" : "Выбрать категории"];
    var root = document.createElement("div");
    root.id = "tour"; root.className = "tour";
    root.setAttribute("role", "dialog"); root.setAttribute("aria-modal", "true"); root.setAttribute("aria-label", "Как пользоваться");
    root.setAttribute("data-t", theme); root.setAttribute("data-s", style); root.setAttribute("data-cur", "0"); root.setAttribute("data-dir", "fwd");
    root.innerHTML = markup(manual);
    host.appendChild(root);
    root.querySelector(".tour__cards").src = "tour/cards-" + style + ".png?r=" + REV;

    function q(sel) { return root.querySelector(sel); }
    var cam = q(".tour__cam"), shots = q(".tour__shots"), finger = q(".tour__finger"), aim = q(".tour__aim"), dev = q(".tour__dev"), win = q(".tour__win"), stage = q(".tour__stage");
    var copies = [].slice.call(root.querySelectorAll(".tour__copy")), bars = [].slice.call(root.querySelectorAll(".tour__bars b"));
    var next = q(".tour__next"), nextTxt = q(".tour__next span"), back = q(".tour__back"), skip = q(".tour__skip");
    var cur = 0, run = 0, closed = false, WIN_W = 330, WIN_H = 439, Z = WIN_W / 390, swapDelay = 0;

    function wait(ms, id) { return new Promise(function (ok, no) { setTimeout(function () { if (id === run && !closed) { ok(); } else { no("stop"); } }, ms); }); }
    function src(name) { return "tour/" + theme + "-" + style + "/" + name + ".jpg?r=" + REV; }
    function preload(scene) { var s = SCENES[scene] || [], i, im; for (i = 0; i < s.length; i++) { im = new Image(); im.src = src(s[i].img); } }
    function place(n, x, y) { n.style.transform = "translate(" + x + "px," + y + "px)"; }

    // размеры сцены берём с самой страницы: телефон приложения бывает от 320 до 520 px шириной и от 560 px высотой
    function measure() {
      var W = root.offsetWidth, sh = stage.offsetHeight;
      root.style.setProperty("--dw", Math.min(344, W - 32) + "px");
      root.style.setProperty("--ws", Math.max(160, Math.min(420, sh - 8, W * 1.05)) + "px");
      WIN_W = win.offsetWidth; WIN_H = win.offsetHeight; Z = WIN_W / 390;
    }
    function camAt(y) {
      var ty = -(y - (WIN_H / Z) * 0.68) * Z;   // место нажатия — на 68 % высоты окна: над ним видно то, что меняется (сумма над клавишами)
      ty = Math.min(0, Math.max(WIN_H - 844 * Z, ty));
      cam.style.transform = "translate(0px," + ty.toFixed(1) + "px) scale(" + Z.toFixed(4) + ")";
    }

    // сценарий листа: палец идёт, «сюда», нажатие, новый экран; по кругу, пока лист открыт
    function play(scene, id) {
      var steps = SCENES[scene], copy = copies[cur], items = [].slice.call(copy.querySelectorAll(".tour__steps li")), bar = bars[cur], t0 = Date.now();
      var PER = reduce ? 900 : 1700, total = steps.length * PER + 2600;
      measure();
      shots.innerHTML = "";
      var imgs = [], i;
      for (i = 0; i < steps.length; i++) { var im = document.createElement("img"); im.alt = ""; im.src = src(steps[i].img); shots.appendChild(im); imgs.push(im); }
      function screen(k) { for (var j = 0; j < imgs.length; j++) { imgs[j].classList.toggle("is-on", j === k); } }
      function stepText(k) {
        for (var j = 0; j < items.length; j++) {
          var f = +items[j].getAttribute("data-from"), n = items[j].nextElementSibling ? +items[j].nextElementSibling.getAttribute("data-from") : 99;
          items[j].classList.toggle("is-on", k >= f && k < n); items[j].classList.toggle("is-done", k >= n);
        }
      }
      (function tick() { if (id !== run || closed) { return; } bar.style.setProperty("--p", Math.min(1, (Date.now() - t0) / total).toFixed(3)); window.requestAnimationFrame(tick); })();
      var k = 0, f0 = steps[0].tap || [195, 640];
      screen(0); stepText(0); aim.classList.remove("is-on"); finger.style.opacity = "0"; camAt(f0[1]);
      // палец появляется сразу у первой цели, без перелёта из прошлого места (иначе при повторе сценария он «прилетал» из ниоткуда)
      finger.style.transition = "none"; place(finger, f0[0], f0[1] + 40); place(aim, f0[0], f0[1]);
      void finger.offsetWidth; finger.style.transition = "";
      function step() {
        var s = steps[k];
        stepText(k);
        if (!s.tap) { aim.classList.remove("is-on"); return wait(1300, id).then(function () { if (k < steps.length - 1) { k++; screen(k); return wait(500, id).then(step); } }); }
        finger.style.opacity = "1";
        camAt(s.tap[1]);
        place(aim, s.tap[0], s.tap[1]);
        place(finger, s.tap[0], s.tap[1]);
        return wait(reduce ? 100 : 650, id)
          .then(function () { aim.classList.add("is-on"); return wait(reduce ? 100 : 250, id); })
          .then(function () { finger.classList.add("is-press"); return wait(reduce ? 100 : 160, id); })
          .then(function () { finger.classList.remove("is-press"); aim.classList.remove("is-on"); return wait(reduce ? 100 : 100, id); })
          .then(function () { if (k < steps.length - 1) { k++; screen(k); return wait(reduce ? 200 : 500, id).then(step); } });
      }
      var pop = q('[data-pop="' + scene + '"]');
      return wait(450, id).then(step)
        .then(function () { finger.style.opacity = "0"; if (pop) { pop.classList.add("is-on"); } return wait(2000, id); })
        .then(function () { if (pop) { pop.classList.remove("is-on"); } return wait(700, id); })
        .then(function () { return play(scene, id); });
    }

    function go(k) {
      var prev = cur, pops = root.querySelectorAll(".tour__pop"), j;
      k = Math.max(0, Math.min(N - 1, k));
      root.setAttribute("data-dir", k < prev ? "back" : "fwd");
      swapDelay = 0;
      if (k !== prev) {
        var out = copies[prev]; out.classList.add("is-out"); setTimeout(function () { out.classList.remove("is-out"); }, 520);
        if (k >= 1 && k <= 3 && prev >= 1 && prev <= 3 && !reduce) {   // телефон уезжает в сторону листания, новый въезжает уже со следующим сценарием
          dev.classList.remove("is-sheen", "swap-fwd", "swap-back"); void dev.offsetWidth;
          dev.classList.add(k > prev ? "swap-fwd" : "swap-back", "is-sheen");
          clearTimeout(dev._sw); dev._sw = setTimeout(function () { dev.classList.remove("swap-fwd", "swap-back"); }, 1050);
          swapDelay = 380;
        }
      }
      cur = k; run++;
      root.setAttribute("data-cur", String(cur));
      for (j = 0; j < pops.length; j++) { pops[j].classList.remove("is-on"); }
      for (j = 0; j < copies.length; j++) { copies[j].classList.toggle("is-cur", j === cur); }
      for (j = 0; j < bars.length; j++) { bars[j].style.setProperty("--p", j < cur ? "1" : (j === cur && !SCENE_OF[j] ? "1" : "0")); }
      back.hidden = cur === 0;
      if (nextTxt.textContent !== LABEL[cur]) { nextTxt.classList.add("is-swap"); setTimeout(function () { nextTxt.textContent = LABEL[cur]; nextTxt.classList.remove("is-swap"); }, 180); }
      var scene = SCENE_OF[cur], id = run;
      if (SCENE_OF[cur + 1]) { preload(SCENE_OF[cur + 1]); }
      if (scene) { (swapDelay ? wait(swapDelay, id) : Promise.resolve()).then(function () { return play(scene, id); }).then(null, function () {}); }
      else { finger.style.opacity = "0"; }
    }

    function close(kind) {
      if (closed) { return; }
      closed = true; run++;
      root.classList.remove("is-open");
      window.removeEventListener("resize", measure);
      document.removeEventListener("keydown", onKey);
      setTimeout(function () { if (root.parentNode) { root.parentNode.removeChild(root); } if (typeof opts.onClose === "function") { opts.onClose(kind); } }, reduce ? 0 : 330);
    }
    function onKey(e) { if (e.key === "Escape") { close("skip"); } else if (e.key === "ArrowRight") { if (cur < N - 1) { go(cur + 1); } } else if (e.key === "ArrowLeft") { go(cur - 1); } }

    next.addEventListener("click", function () { if (cur === N - 1) { close("done"); } else { go(cur + 1); } });
    back.addEventListener("click", function () { go(cur - 1); });
    skip.addEventListener("click", function () { close("skip"); });
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", measure);

    // смахивание: текст и телефон идут за пальцем, у крайних листов — сопротивление; отпустил — лист сменился или вернулся на место
    var x0 = null;
    root.addEventListener("pointerdown", function (e) { if (e.target.closest && e.target.closest("button")) { return; } x0 = e.clientX; root.classList.add("is-drag"); });
    root.addEventListener("pointermove", function (e) {
      if (x0 === null) { return; }
      var dx = e.clientX - x0, edge = (cur === 0 && dx > 0) || (cur === N - 1 && dx < 0);
      if (edge) { dx = dx * 120 / (120 + Math.abs(dx)); }
      root.style.setProperty("--dx", dx.toFixed(1) + "px");
    });
    function release(e) {
      if (x0 === null) { return; }
      var dx = e.clientX - x0; x0 = null;
      root.classList.remove("is-drag"); root.style.setProperty("--dx", "0px");
      if (Math.abs(dx) > 50) { if (dx < 0 && cur === N - 1) { return; } go(cur + (dx < 0 ? 1 : -1)); }
    }
    root.addEventListener("pointerup", release);
    root.addEventListener("pointercancel", function () { x0 = null; root.classList.remove("is-drag"); root.style.setProperty("--dx", "0px"); });   // отмену браузера (у pointercancel clientX = 0) за смахивание не считаем
    root.addEventListener("dragstart", function (e) { e.preventDefault(); });   // картинку мышью браузер тянет как своё: на компьютере это обрывало смахивание

    preload("add");   // остальные сценарии подгружаются следом, пока человек читает первый лист: на медленной сети экран телефона не пустой
    setTimeout(function () { preload("goals"); }, 900); setTimeout(function () { preload("stats"); }, 1800);
    window.requestAnimationFrame(function () { root.classList.add("is-open"); measure(); go(0); });
  }

  window.FINTOUR = { open: open, scenes: SCENES };
})();
