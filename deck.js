/* Hanging card deck, shared by index.html (English) and zh.html (Chinese).
   All behaviour lives here; the two pages only differ in their text. */
(function () {
  var deck = document.getElementById('deck');
  if (!deck) return;

  var cards = Array.prototype.slice.call(deck.querySelectorAll('.card'));
  var order = cards.slice();          // current deck order
  var cur = 0;                        // index of the top card in `order`
  var busy = false;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Each card keeps its own small tilt, so the stack never lines up perfectly */
  var TILTS = [-1.1, 0.9, -0.7, 1.3, -1.5, 0.6, -0.9, 1.2, -0.5, 1.4, -1.2, 0.8];
  cards.forEach(function (c, i) {
    c._tilt = TILTS[i % TILTS.length];
    c._side = i % 2 ? 1 : -1;
    c._fall = { x: 0, r: 0 };
  });

  function stackTransform(c, depth) {
    var k = Math.min(1, window.innerWidth / 900);   // smaller offsets on narrow screens
    var t = c._tilt * (0.5 + 0.5 * k), s = c._side * k;
    if (depth <= 0) return 'translate(-50%, 0) rotate(' + (t * 0.35) + 'deg)';
    if (depth === 1) return 'translate(calc(-50% + ' + (s * 16) + 'px), 12px) rotate(' + (t * 1.3) + 'deg)';
    return 'translate(calc(-50% + ' + (-s * 12) + 'px), 22px) rotate(' + (-t * 1.6) + 'deg)';
  }
  function goneTransform(c) {
    return 'translate(calc(-50% + ' + c._fall.x + 'px), 125vh) rotate(' + c._fall.r + 'deg)';
  }

  function layout() {
    order.forEach(function (c, i) {
      var depth = i - cur;
      if (depth < 0) {
        c.style.transform = goneTransform(c);
        c.style.opacity = '0';
        c.style.zIndex = String(200 + i);
        clearTimeout(c._hideTimer);
        c._hideTimer = setTimeout(function () { if (order.indexOf(c) < cur) c.classList.add('hidden'); }, 950);
      } else {
        clearTimeout(c._hideTimer);
        c.style.transform = stackTransform(c, Math.min(depth, 2));
        c.style.opacity = depth > 2 ? '0' : '1';
        c.style.zIndex = String(100 - depth);
        c.classList.toggle('hidden', depth > 2);
      }
      var top = depth === 0;
      c.classList.toggle('is-top', top);
      c.inert = !top;
      c.setAttribute('aria-hidden', top ? 'false' : 'true');
    });
    updateProgress();
  }

  function swing(c) {
    if (reduce) return;
    c.classList.remove('swing');
    void c.offsetWidth;
    c.classList.add('swing');
  }

  function rand(a, b) { return a + Math.random() * (b - a); }

  /* Short message when there is no card further that way */
  var toastEl = document.getElementById('deckToast');
  var toastTimer = null, lastToast = 0;
  var touchUI = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  function toast(kind) {
    if (!toastEl) return;
    var now = Date.now();
    if (now - lastToast < 1200 && toastEl.classList.contains('on')) return;
    lastToast = now;
    var text = toastEl.getAttribute('data-' + kind + (touchUI ? '-touch' : ''));
    if (!text) return;
    toastEl.textContent = text;
    toastEl.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('on'); }, 2400);
  }

  function next(dir) {
    if (cur >= order.length - 1) { layout(); swing(order[cur]); toast('last'); return false; }
    var c = order[cur];
    if (dir === 'right') c._fall = { x: rand(window.innerWidth * 0.45, window.innerWidth * 0.7), r: rand(22, 34) };
    else c._fall = { x: rand(-60, 60), r: rand(-14, 14) };
    c.classList.add('falling');
    setTimeout(function () { c.classList.remove('falling'); }, 950);
    cur++;
    layout();
    swing(order[cur]);
    dismissHint();
    return true;
  }
  function prev() {
    if (cur <= 0) { layout(); swing(order[0]); toast('first'); return false; }
    cur--;
    var c = order[cur];
    c.classList.remove('falling', 'hidden');
    layout();
    setTimeout(function () { swing(c); }, 450);
    dismissHint();
    return true;
  }
  function goTo(target) {
    if (busy || target === cur) return;
    busy = true;
    var step = function () {
      var moved = target > cur ? next('down') : prev();
      if (moved && cur !== target) setTimeout(step, 110);
      else setTimeout(function () { busy = false; }, 500);
    };
    step();
  }

  /* Progress bar: fixed, centred at the bottom */
  var ticks = document.getElementById('ticks');
  var count = document.getElementById('count');
  var prevBtn = document.getElementById('prev');
  var nextBtn = document.getElementById('next');
  function buildTicks() {
    ticks.innerHTML = '';
    order.forEach(function (c, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', (i + 1) + '. ' + (c.getAttribute('data-title') || ''));
      b.appendChild(document.createElement('span'));
      b.addEventListener('click', function () { goTo(i); });
      ticks.appendChild(b);
    });
  }
  function pad(n) { return n < 10 ? '0' + n : String(n); }
  function updateProgress() {
    Array.prototype.forEach.call(ticks.children, function (b, i) {
      b.classList.toggle('on', i === cur);
      if (i === cur) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
    });
    if (count) count.textContent = pad(cur + 1) + ' / ' + pad(order.length);
    if (prevBtn) prevBtn.disabled = cur === 0;
    if (nextBtn) nextBtn.disabled = cur === order.length - 1;
  }
  if (prevBtn) prevBtn.addEventListener('click', function () { if (!busy) prev(); });
  if (nextBtn) nextBtn.addEventListener('click', function () { if (!busy) next('down'); });

  /* Floating hint: stays until the visitor presses OK or drops a card; remembered per browser */
  var hint = document.getElementById('deckHint');
  function dismissHint() {
    if (!hint) return;
    hint.classList.add('off');
    try { localStorage.setItem('deckHintSeen', '1'); } catch (e) {}
  }
  if (hint) {
    var seen = null;
    try { seen = localStorage.getItem('deckHintSeen'); } catch (e) {}
    if (seen) hint.classList.add('off');
    var ok = document.getElementById('hintOk');
    if (ok) ok.addEventListener('click', dismissHint);
  }

  function splashOpen() {
    var s = document.getElementById('splash');
    return s && !s.hasAttribute('hidden') && getComputedStyle(s).display !== 'none';
  }

  /* Let inner areas scroll first (long card text, the photo strip) */
  function canScroll(target, dir) {
    var el = target;
    while (el && el !== deck) {
      if (el.nodeType === 1) {
        var cs = getComputedStyle(el);
        if (dir === 'down' || dir === 'up') {
          if (/(auto|scroll)/.test(cs.overflowY) && el.scrollHeight > el.clientHeight + 1) {
            if (dir === 'down' && el.scrollTop + el.clientHeight < el.scrollHeight - 1) return true;
            if (dir === 'up' && el.scrollTop > 0) return true;
          }
        } else {
          if (/(auto|scroll)/.test(cs.overflowX) && el.scrollWidth > el.clientWidth + 1) {
            if (dir === 'right' && el.scrollLeft + el.clientWidth < el.scrollWidth - 1) return true;
            if (dir === 'left' && el.scrollLeft > 0) return true;
          }
        }
      }
      el = el.parentNode;
    }
    return false;
  }

  /* Wheel and trackpad: down or right drops the card, up or left brings it back */
  var acc = 0, lastWheel = 0, quietUntil = 0, needGap = false;
  window.addEventListener('wheel', function (e) {
    if (splashOpen()) return;
    var horizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY);
    var d = horizontal ? e.deltaX : e.deltaY;
    var dir = horizontal ? (d > 0 ? 'right' : 'left') : (d > 0 ? 'down' : 'up');
    if (canScroll(e.target, dir)) return;
    var strip = !horizontal && e.target.closest && e.target.closest('.strip');
    if (strip && canScroll(strip, d > 0 ? 'right' : 'left')) {
      // mouse wheel over the photos moves the strip one photo at a time, then the deck takes over
      e.preventDefault();
      var tnow = performance.now();
      if (tnow - (strip._wheelAt || 0) > 450) {
        strip._wheelAt = tnow;
        var figs = Array.prototype.slice.call(strip.children);
        var x = strip.scrollLeft, max = strip.scrollWidth - strip.clientWidth, target = null;
        if (d > 0) target = figs.filter(function (f) { return f.offsetLeft - strip.offsetLeft > x + 4; })[0];
        else target = figs.filter(function (f) { return f.offsetLeft - strip.offsetLeft < x - 4; }).pop();
        var left = target ? Math.min(max, target.offsetLeft - strip.offsetLeft) : (d > 0 ? max : 0);
        strip.scrollTo({ left: left, behavior: reduce ? 'auto' : 'smooth' });
      }
      return;
    }
    e.preventDefault();
    var now = performance.now();
    var gap = now - lastWheel;
    lastWheel = now;
    if (needGap) { if (gap > 160) needGap = false; else return; }
    if (now < quietUntil || busy) return;
    if (gap > 220) acc = 0;
    acc += Math.abs(d) * ((dir === 'down' || dir === 'right') ? 1 : -1);
    if (acc > 36) { acc = 0; next(dir); quietUntil = now + 650; needGap = true; }
    else if (acc < -36) { acc = 0; prev(); quietUntil = now + 650; needGap = true; }
  }, { passive: false });

  /* Touch: the top card follows the finger; swipe up or right drops it, down or left brings one back */
  var tStart = null;
  function cancelDrag() {
    if (tStart && tStart.dragging) {
      var c = order[cur];
      c.style.transition = '';
      layout();
    }
    tStart = null;
  }
  deck.addEventListener('touchstart', function (e) {
    if (e.touches.length !== 1 || busy) { cancelDrag(); return; }
    tStart = { x: e.touches[0].clientX, y: e.touches[0].clientY, target: e.target, axis: null, dragging: false };
  }, { passive: true });
  deck.addEventListener('touchmove', function (e) {
    if (!tStart || busy) return;
    var t = e.touches[0];
    var dx = t.clientX - tStart.x, dy = t.clientY - tStart.y;
    var target = tStart.target;
    if (!tStart.axis) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 8) return;
      if (Math.abs(dx) > Math.abs(dy)) {
        var inStrip = target.closest && target.closest('.strip');
        tStart.axis = (inStrip || (target.closest && target.closest('.dots, .gloss'))) ? 'none' : 'x';
      } else {
        tStart.axis = (canScroll(target, dy < 0 ? 'down' : 'up') || (target.closest && target.closest('.dots, .gloss'))) ? 'none' : 'y';
      }
    }
    if (tStart.axis === 'none') return;
    e.preventDefault();
    var c = order[cur];
    tStart.dragging = true;
    c.style.transition = 'none';
    var mx = tStart.axis === 'x' ? dx : 0;
    var my = tStart.axis === 'y' ? (dy < 0 ? dy * 0.6 : dy * 0.25) : Math.abs(dx) * 0.08;
    c.style.transform = 'translate(calc(-50% + ' + mx + 'px), ' + my + 'px) rotate(' + (c._tilt * 0.35 + mx / 22) + 'deg)';
  }, { passive: false });
  deck.addEventListener('touchend', function (e) {
    if (!tStart || busy) { tStart = null; return; }
    var t = e.changedTouches[0];
    var dx = t.clientX - tStart.x, dy = t.clientY - tStart.y;
    var axis = tStart.axis, dragging = tStart.dragging;
    if (dragging) order[cur].style.transition = '';
    tStart = null;
    if (!dragging) return;
    if (axis === 'x' && dx > 70) next('right');
    else if (axis === 'x' && dx < -70) prev();
    else if (axis === 'y' && dy < -70) next('down');
    else if (axis === 'y' && dy > 70) prev();
    else layout();
  }, { passive: true });
  deck.addEventListener('touchcancel', cancelDrag, { passive: true });

  /* Touch screens: every [data-touch] text swaps "cursor/鼠标" wording for "finger/手指" */
  if (window.matchMedia('(hover: none) and (pointer: coarse)').matches) {
    Array.prototype.forEach.call(document.querySelectorAll('[data-touch]'), function (el) {
      var target = el.id === 'deckHint' ? el.querySelector('span') : el;
      if (target) target.textContent = el.getAttribute('data-touch');
    });
  }

  /* Keyboard */
  window.addEventListener('keydown', function (e) {
    if (splashOpen() || e.metaKey || e.ctrlKey || e.altKey) return;
    var tag = (e.target.tagName || '').toLowerCase();
    var onControl = tag === 'button' || tag === 'a' || tag === 'input' || tag === 'textarea';
    var k = e.key;
    if (k === 'ArrowDown' || k === 'ArrowRight' || k === 'PageDown' || (k === ' ' && !onControl)) {
      if (k === 'ArrowDown' && canScroll(e.target === document.body ? order[cur] : e.target, 'down')) return;
      e.preventDefault(); if (!busy) next(k === 'ArrowRight' ? 'right' : 'down');
    } else if (k === 'ArrowUp' || k === 'ArrowLeft' || k === 'PageUp') {
      e.preventDefault(); if (!busy) prev();
    } else if (k === 'Home') { e.preventDefault(); goTo(0); }
    else if (k === 'End') { e.preventDefault(); goTo(order.length - 1); }
  });

  /* ===== Fill in the blank: picking a reader shuffles the cards ahead ===== */
  var orders = {
    none: ['teaching', 'pubs', 'talks', 'product', 'photo'],
    teaching: ['teaching', 'pubs', 'talks', 'product', 'photo'],
    'research-hire': ['pubs', 'talks', 'teaching', 'product', 'photo'],
    industry: ['product', 'pubs', 'talks', 'teaching', 'photo'],
    research: ['pubs', 'talks', 'teaching', 'product', 'photo'],
    browse: ['photo', 'teaching', 'product', 'pubs', 'talks']
  };
  var options = document.getElementById('options');
  var blank = document.getElementById('blank');
  var note = document.getElementById('note');
  var current = null;
  var flowCards = cards.filter(function (c) { return c.hasAttribute('data-key'); });
  var firstFlow = cards.indexOf(flowCards[0]);
  var lastFlow = cards.indexOf(flowCards[flowCards.length - 1]);

  /* Each card gets a title face, shown while the deck is being shuffled */
  cards.forEach(function (c) {
    var tag = document.createElement('div');
    tag.className = 'card-tag';
    tag.setAttribute('aria-hidden', 'true');
    tag.textContent = c.getAttribute('data-title') || '';
    c.querySelector('.sway').appendChild(tag);
  });

  function newOrderFor(seq) {
    var before = order.slice(0, firstFlow);
    var after = order.slice(lastFlow + 1);
    var flow = seq.map(function (k) { return deck.querySelector('.card[data-key="' + k + '"]'); });
    return before.concat(flow, after);
  }
  function reorderDeck(seq) {
    order = newOrderFor(seq);
    buildTicks();
    layout();
  }

  /* Shuffle with the real cards: fan out, gather, cut, riffle, deal, then hang back up */
  function shuffleDeck(seq, done) {
    var top = order[cur];
    var rest = order.slice(cur + 1);
    var nextOrder = newOrderFor(seq);
    if (reduce || cur !== firstFlow - 1 || !rest.length) { order = nextOrder; buildTicks(); layout(); done(); return; }
    busy = true;
    var restNew = nextOrder.slice(cur + 1);
    var n = rest.length;
    var cardW = top.offsetWidth, cardH = top.offsetHeight;
    var hang = parseFloat(getComputedStyle(top).top) || 34;
    var s = Math.min(0.3, (window.innerWidth - 48) / (cardW * (1 + 0.62 * (n - 1))));
    var step = cardW * s * 0.62;
    var cy = (deck.clientHeight - cardH * s) / 2 - hang * s - hang * 0.4;
    var T = function (x, y, r, sc) {
      return 'translate(calc(-50% + ' + x + 'px), ' + y + 'px) scale(' + (sc || s) + ') rotate(' + r + 'deg)';
    };
    var spread = function (list, stagger) {
      list.forEach(function (c, i) {
        var off = i - (n - 1) / 2;
        c.style.transitionDelay = stagger ? (i * 60) + 'ms' : '0ms';
        c.style.zIndex = String(300 + i);
        c.style.transform = T(off * step, cy + Math.abs(off) * 8, off * 3.2);
      });
    };
    deck.classList.add('shuffling');
    top.style.transform = 'translate(-50%, -2%) scale(0.96)';
    top.style.opacity = '0.18';
    rest.forEach(function (c) {
      clearTimeout(c._hideTimer);
      c.classList.remove('hidden');
      c.style.opacity = '1';
    });
    // 1. fan out in the current order
    spread(rest, false);
    // 2. gather into one pile
    setTimeout(function () {
      rest.forEach(function (c) {
        c.style.transitionDelay = '0ms';
        c.style.zIndex = String(300 + Math.floor(Math.random() * 20));
        c.style.transform = T(rand(-8, 8), cy + rand(-4, 4), rand(-8, 8));
      });
    }, 700);
    // 3. cut into two halves
    setTimeout(function () {
      rest.forEach(function (c, i) {
        var side = i % 2 ? 1 : -1;
        c.style.transform = T(side * cardW * s * 0.62, cy - 6 + i * 2, side * 8);
      });
    }, 1080);
    // 4. riffle the halves back together
    setTimeout(function () {
      restNew.slice().reverse().forEach(function (c, i) {
        c.style.zIndex = String(320 - i);
        c.style.transitionDelay = (i * 45) + 'ms';
        c.style.transform = T(rand(-4, 4), cy - (n - i) * 2, rand(-4, 4));
      });
    }, 1460);
    // 5. deal out in the new order
    setTimeout(function () { spread(restNew, true); }, 1950);
    // 6. hang the deck back up behind the current card
    setTimeout(function () {
      cards.forEach(function (c) { c.style.transitionDelay = '0ms'; });
      order = nextOrder;
      deck.classList.remove('shuffling');
      top.style.opacity = '';
      buildTicks();
      layout();
      setTimeout(function () { busy = false; done(); }, 700);
    }, 3200);
  }

  function apply(aud) {
    if (busy) return;
    current = aud;
    var seq = orders[aud || 'none'];
    var chosen = null;
    options.querySelectorAll('button').forEach(function (b) {
      var on = b.getAttribute('data-aud') === aud;
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      if (on) chosen = b;
    });
    options.classList.toggle('chosen', !!aud);
    options.classList.remove('riffle'); void options.offsetWidth; options.classList.add('riffle');
    blank.textContent = chosen ? chosen.getAttribute('data-fill') : ' ';
    blank.classList.toggle('filled', !!chosen);
    note.textContent = chosen ? note.getAttribute('data-chosen') : note.getAttribute('data-default');
    note.classList.toggle('on', !!chosen);
    shuffleDeck(seq, function () {});
  }
  if (options) {
    options.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      var aud = b.getAttribute('data-aud');
      apply(current === aud ? null : aud);
    });
  }

  /* ===== Dots: 50,000 on a canvas, lit by the pointer ===== */
  var canvas = document.getElementById('dots');
  if (canvas) {
    var ctx = canvas.getContext('2d');
    var base = document.createElement('canvas');
    var bctx = base.getContext('2d');
    /* 50,000 dots either way: wide grid on computers, taller grid on phones */
    var COLS = 400, ROWS = 125;
    var DPR = window.devicePixelRatio || 1;
    var tx = -1, ty = -1, gx = -1, gy = -1, raf = null, C = {};
    var heat = new Float32Array(COLS * ROWS);
    var pickGrid = function (w) {
      var cols = w < 600 ? 250 : 400, rows = w < 600 ? 200 : 125;
      if (cols !== COLS) { COLS = cols; ROWS = rows; heat = new Float32Array(COLS * ROWS); }
    };
    var readColors = function () {
      var cs = getComputedStyle(document.documentElement);
      C.line = cs.getPropertyValue('--line').trim() || '#D3D0CA';
      C.sage = cs.getPropertyValue('--sage').trim() || '#A9B4A4';
      C.mid = cs.getPropertyValue('--sage-mid').trim() || '#7F8A79';
      C.deep = cs.getPropertyValue('--sage-deep').trim() || '#56624F';
      C.paper = cs.getPropertyValue('--paper').trim() || '#F7F6F3';
    };
    var hash = function (x, y) {
      var h = (x * 73856093) ^ (y * 19349663);
      h = (h ^ (h >> 13)) * 1274126177;
      return ((h ^ (h >> 16)) >>> 0) / 4294967295;
    };
    var draw = function () {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(base, 0, 0, canvas.width, canvas.height);
      var cw = canvas.width / COLS, ch = canvas.height / ROWS;
      var d = Math.max(0.8, Math.min(cw, ch) * 0.8);
      for (var i = 0; i < heat.length; i++) {
        var h = heat[i];
        if (h <= 0.02) continue;
        var x = i % COLS, y = (i / COLS) | 0;
        ctx.fillStyle = h > 0.6 ? C.deep : h > 0.3 ? C.mid : C.sage;
        var rr = d * (1 + h * 0.9);
        ctx.fillRect((x + 0.5) * cw - rr / 2, (y + 0.5) * ch - rr / 2, rr, rr);
      }
    };
    var drawBase = function () {
      readColors();
      var w = base.width, h = base.height;
      bctx.fillStyle = C.paper;
      bctx.fillRect(0, 0, w, h);
      var cw = w / COLS, ch = h / ROWS;
      var d = Math.max(0.8, Math.min(cw, ch) * 0.7);
      bctx.fillStyle = C.line;
      for (var i = 0; i < COLS * ROWS; i++) {
        bctx.fillRect((i % COLS + 0.5) * cw - d / 2, (Math.floor(i / COLS) + 0.5) * ch - d / 2, d, d);
      }
      draw();
    };
    var sizeDots = function () {
      var w = canvas.clientWidth;
      if (!w) return;
      pickGrid(w);
      var h = Math.max(1, Math.round(w * ROWS / COLS));
      var pw = Math.max(1, Math.round(w * DPR)), ph = Math.max(1, Math.round(h * DPR));
      canvas.width = pw; canvas.height = ph;
      canvas.style.height = h + 'px';
      base.width = pw; base.height = ph;
      drawBase();
    };
    var addHeat = function (px, py) {
      var R = 12;
      for (var y = Math.floor(py - R); y <= Math.ceil(py + R); y++) {
        for (var x = Math.floor(px - R); x <= Math.ceil(px + R); x++) {
          if (x < 0 || y < 0 || x >= COLS || y >= ROWS) continue;
          var d = Math.hypot(x - px, y - py) + (hash(x, y) - 0.5) * 1.6;
          if (d > R) continue;
          var h = 1 - d / R, idx = y * COLS + x;
          if (h > heat[idx]) heat[idx] = h;
        }
      }
    };
    var loop = function () {
      raf = null;
      if (tx >= 0) { gx += (tx - gx) * 0.25; gy += (ty - gy) * 0.25; addHeat(gx, gy); }
      var active = false;
      for (var i = 0; i < heat.length; i++) {
        if (heat[i] > 0.01) { heat[i] *= 0.9; if (heat[i] > 0.02) active = true; } else heat[i] = 0;
      }
      draw();
      if (active || tx >= 0) raf = requestAnimationFrame(loop);
    };
    var onMove = function (e) {
      var r = canvas.getBoundingClientRect();
      // the card may be slightly rotated; this is close enough for a glow
      tx = (e.clientX - r.left) / r.width * COLS;
      ty = (e.clientY - r.top) / r.height * ROWS;
      if (gx < 0) { gx = tx; gy = ty; }
      if (!raf) raf = requestAnimationFrame(loop);
    };
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerdown', onMove);
    canvas.addEventListener('pointerleave', function () { tx = -1; ty = -1; });
    sizeDots();
    window.addEventListener('resize', sizeDots);
    new MutationObserver(drawBase).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    var mq = window.matchMedia('(prefers-color-scheme: dark)');
    if (mq.addEventListener) mq.addEventListener('change', drawBase);
  }

  /* ===== Email: assembled at runtime; click copies, falls back to mailto ===== */
  var email = document.getElementById('email');
  if (email) {
    var addr = String.fromCharCode.apply(null, [121, 97, 110, 120, 105, 110, 52, 54, 48, 56, 64, 103, 109, 97, 105, 108, 46, 99, 111, 109]);
    var label = email.getAttribute('data-label') || email.textContent;
    email.setAttribute('href', 'mailto:' + addr);
    email.addEventListener('click', function (e) {
      if (navigator.clipboard && window.isSecureContext) {
        e.preventDefault();
        navigator.clipboard.writeText(addr).then(function () {
          email.textContent = email.getAttribute('data-copied') || 'Copied';
          setTimeout(function () { email.textContent = label; }, 1600);
        }, function () { window.location.href = 'mailto:' + addr; });
      }
    });
  }

  /* ===== Gloss words dodge the pointer ===== */
  var intro = document.querySelector('.intro');
  if (intro) {
    var gwords = Array.prototype.slice.call(intro.querySelectorAll('.w, .ew'));
    var dodge = function (x, y, radius) {
      gwords.forEach(function (w) {
        var r = w.getBoundingClientRect();
        var dx = r.left + r.width / 2 - x, dy = r.top + r.height / 2 - y;
        var d = Math.hypot(dx, dy);
        if (d < radius && d > 0) {
          var f = (1 - d / radius) * 70;
          w.style.transform = 'translate(' + (dx / d * f) + 'px,' + (dy / d * f) + 'px)';
        } else w.style.transform = '';
      });
    };
    var settle = function () { gwords.forEach(function (w) { w.style.transform = ''; }); };
    var settleTimer = null;
    // Mouse: words run away from the cursor
    intro.addEventListener('pointermove', function (e) { if (e.pointerType === 'mouse') dodge(e.clientX, e.clientY, 110); });
    intro.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') settle(); });
    // Finger: words run away as the finger sweeps across them, then drift back
    var fingerDodge = function (e) {
      if (e.pointerType === 'mouse') return;
      dodge(e.clientX, e.clientY, 120);
      clearTimeout(settleTimer);
      settleTimer = setTimeout(settle, 700);
    };
    intro.addEventListener('pointerdown', fingerDodge);
    intro.addEventListener('pointermove', fingerDodge);
  }

  /* Start */
  buildTicks();
  cards.forEach(function (c) { c.style.transition = 'none'; });
  layout();
  void deck.offsetWidth;
  cards.forEach(function (c) { c.style.transition = ''; });
  window.addEventListener('resize', function () { if (!busy) layout(); });
})();
