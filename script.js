(function () {
  /* ====== AJUSTES ====== */
  var SPEED = 28;   // milisegundos por letra (menor = más rápido)
  var VOLUME = 0.6; // volumen de la música, de 0 a 1
  /* ===================== */

  var intro = document.getElementById('intro');
  var bgm = document.getElementById('bgm');
  var musicBtn = document.getElementById('music');
  var skipBtn = document.getElementById('skip');
  var poem = document.getElementById('poem');
  var endEl = document.getElementById('end');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* pétalos que caen */
  var glyphs = ['🌸', '🌷', '♡', '🌹', '✿'];
  var box = document.getElementById('petals');
  if (!reduce) {
    for (var i = 0; i < 20; i++) {
      var s = document.createElement('span');
      s.className = 'petal';
      s.textContent = glyphs[i % glyphs.length];
      s.style.left = (Math.random() * 100) + 'vw';
      s.style.fontSize = (14 + Math.random() * 16) + 'px';
      s.style.animationDuration = (9 + Math.random() * 10) + 's';
      s.style.animationDelay = (-Math.random() * 18) + 's';
      box.appendChild(s);
    }
  }

  /* guardar los textos y vaciar los párrafos */
  var paras = Array.prototype.slice.call(document.querySelectorAll('.tw'));
  var texts = paras.map(function (p) { return p.textContent; });
  paras.forEach(function (p) { p.textContent = ''; });

  var cursor = document.createElement('span');
  cursor.className = 'cursor';

  var skipping = false;
  var userScrolling = false;
  var scrollTimer;

  /* si la persona hace scroll con la mano, la página deja de seguir el texto un rato */
  ['wheel', 'touchmove'].forEach(function (ev) {
    window.addEventListener(ev, function () {
      userScrolling = true;
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(function () { userScrolling = false; }, 3500);
    }, { passive: true });
  });

  function follow() {
    if (userScrolling) return;
    var r = cursor.getBoundingClientRect();
    var limit = window.innerHeight * 0.75;
    if (r.bottom > limit) {
      window.scrollBy({ top: r.bottom - limit, behavior: 'smooth' });
    }
  }

  function wait(ms) {
    return new Promise(function (r) { setTimeout(r, ms); });
  }

  function typeParagraph(p, text) {
    return new Promise(function (resolve) {
      p.appendChild(cursor);
      var i = 0;
      (function step() {
        if (skipping) { p.textContent = text; return resolve(); }
        if (i >= text.length) return resolve();
        var ch = text.charAt(i++);
        cursor.insertAdjacentText('beforebegin', ch);
        if (i % 6 === 0) follow();
        var d = SPEED;
        if (',;'.indexOf(ch) > -1) d = SPEED * 6;
        else if ('.!?:—'.indexOf(ch) > -1) d = SPEED * 12;
        setTimeout(step, d);
      })();
    });
  }

  async function run() {
    var poemShown = false;
    for (var k = 0; k < paras.length; k++) {
      if (!poemShown && poem.contains(paras[k])) {
        poemShown = true;
        if (!skipping) await wait(1200);
        poem.classList.add('show');
        if (!skipping) {
          await wait(1200);
          window.scrollTo({ top: poem.offsetTop - 20, behavior: 'smooth' });
          await wait(900);
        }
      }
      await typeParagraph(paras[k], texts[k]);
      if (!skipping) await wait(500);
    }
    if (cursor.parentNode) cursor.parentNode.removeChild(cursor);
    skipBtn.classList.remove('show');
    endEl.classList.add('in');
  }

  /* música con fade-in */
  function startMusic() {
    bgm.volume = 0;
    var p = bgm.play();
    if (p && p.catch) p.catch(function () { musicBtn.classList.remove('show'); });
    var v = 0;
    var f = setInterval(function () {
      v += 0.02;
      if (v >= VOLUME) { v = VOLUME; clearInterval(f); }
      bgm.volume = v;
    }, 100);
  }

  musicBtn.addEventListener('click', function () {
    bgm.muted = !bgm.muted;
    musicBtn.textContent = bgm.muted ? '🔇' : '🔊';
  });
  bgm.addEventListener('error', function () { musicBtn.classList.remove('show'); });
  skipBtn.addEventListener('click', function () { skipping = true; });

  var started = false;
  function open() {
    if (started) return;
    started = true;
    intro.classList.add('gone');
    window.scrollTo(0, 0);
    musicBtn.classList.add('show');
    startMusic(); // el toque en el sobre es lo que permite reproducir audio
    if (reduce) { skipping = true; } else { skipBtn.classList.add('show'); }
    setTimeout(run, 900);
  }

  intro.addEventListener('click', open);
  intro.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
  });
})();