/* Leader Tyre & Automotive — design preview. Visuals only: nothing here talks to a server. */
(function () {
  'use strict';

  var d = document;
  var root = d.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function $(s, c) { return (c || d).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); }
  function store(k, v) { try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch (e) { return null; } }

  /* ---------- intro (roller door) ---------- */
  var intro = $('#intro');
  if (intro && root.classList.contains('has-intro')) {
    var done = false;
    var endIntro = function (skipped) {
      if (done) return;
      done = true;
      if (skipped) { root.classList.remove('has-intro'); root.classList.add('no-intro'); }
      root.classList.remove('intro-lock');
      if (intro.parentNode) intro.parentNode.removeChild(intro);
    };
    var skip = $('.intro-skip', intro);
    if (skip) skip.addEventListener('click', function () { endIntro(true); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape') endIntro(true); });
    setTimeout(function () { root.classList.remove('intro-lock'); }, 2300);
    setTimeout(function () { endIntro(false); }, 3200);
  } else if (intro && intro.parentNode) {
    intro.parentNode.removeChild(intro);
    root.classList.remove('intro-lock');
  }

  /* ---------- page-to-page wipe ---------- */
  if (root.classList.contains('wipe-in')) {
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { root.classList.add('wipe-go'); });
    });
    setTimeout(function () { root.classList.remove('wipe-in', 'wipe-go'); }, 700);
  }
  window.addEventListener('pageshow', function (e) { if (e.persisted) root.classList.remove('wipe-out', 'wipe-in', 'wipe-go'); });
  if (!reduce) {
    d.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest ? e.target.closest('a[href]') : null;
      if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
      var href = a.getAttribute('href');
      if (!href || href.charAt(0) === '#' || /^(tel:|mailto:|https?:)/i.test(href)) return;
      var url;
      try { url = new URL(a.href); } catch (err) { return; }
      if (url.pathname === location.pathname && url.search === location.search) return; // same page, just a jump
      e.preventDefault();
      store('lt-nav', '1'); // tells the next page this was a move inside the site, so no intro
      root.classList.add('wipe-out');
      setTimeout(function () { location.href = a.href; }, 330);
    });
  }

  /* ---------- header + mobile menu ---------- */
  var hdr = $('.hdr');
  var burger = $('.burger');
  var mnav = $('#mnav');
  function setMenu(open) {
    if (!burger || !mnav) return;
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    mnav.classList.toggle('is-open', open);
    root.classList.toggle('nav-lock', open);
  }
  if (burger && mnav) {
    burger.addEventListener('click', function () { setMenu(burger.getAttribute('aria-expanded') !== 'true'); });
    mnav.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
    window.addEventListener('resize', function () { if (window.innerWidth >= 980) setMenu(false); });
  }

  /* ---------- scroll: sticky state + tyre rotation ---------- */
  var rots = $$('.tyre-rot');
  var ticking = false;
  function onScroll() {
    ticking = false;
    var y = window.scrollY || window.pageYOffset || 0;
    if (hdr) hdr.classList.toggle('is-stuck', y > 24);
    if (!reduce) for (var i = 0; i < rots.length; i++) rots[i].style.setProperty('--sr', (y * 0.14).toFixed(2));
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  /* ---------- reveal on scroll ---------- */
  var rv = $$('.rv');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        io.unobserve(en.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    rv.forEach(function (el) { io.observe(el); });
  } else {
    rv.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- sidewall lettering: space the text to close the circle ---------- */
  function fitSidewall() {
    $$('text[data-fit]').forEach(function (t) {
      var tp = t.querySelector('textPath');
      var path = tp ? d.getElementById((tp.getAttribute('href') || '').slice(1)) : null;
      if (!path || !t.getComputedTextLength) return;
      t.style.letterSpacing = '0px';
      var n = (tp.textContent || '').length;
      var gap = path.getTotalLength() - t.getComputedTextLength() - 2;
      if (n > 0) t.style.letterSpacing = Math.max(0, gap / n).toFixed(3) + 'px';
    });
  }
  if (d.fonts && d.fonts.ready) d.fonts.ready.then(fitSidewall); else window.addEventListener('load', fitSidewall);

  /* ---------- porthole slideshow ---------- */
  $$('.port').forEach(function (port) {
    var imgs = $$('img', port);
    var tag = $('.port-tag', port.parentNode);
    if (imgs.length < 2 || reduce) return;
    var i = 0;
    setInterval(function () {
      imgs[i].classList.remove('is-on');
      i = (i + 1) % imgs.length;
      imgs[i].classList.add('is-on');
      if (tag && imgs[i].dataset.cap) tag.textContent = imgs[i].dataset.cap;
    }, 4800);
  });

  /* ---------- count-up numbers ---------- */
  var counts = $$('[data-count]');
  if (counts.length && 'IntersectionObserver' in window && !reduce) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        cio.unobserve(en.target);
        var el = en.target;
        var to = parseFloat(el.dataset.count);
        var dec = (el.dataset.count.split('.')[1] || '').length;
        var t0 = null;
        var step = function (ts) {
          if (t0 === null) t0 = ts;
          var p = Math.min(1, (ts - t0) / 1300);
          var e = 1 - Math.pow(1 - p, 3);
          el.textContent = (to * e).toFixed(dec);
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    }, { threshold: 0.6 });
    counts.forEach(function (el) { cio.observe(el); });
  }

  /* ---------- services: symptom checker ---------- */
  var SYMPTOMS = {
    pull: { title: 'Wheel alignment', text: 'A car that drifts or pulls on a straight road usually needs its alignment measured and set.', service: 'alignment' },
    wheel: { title: 'Wheel alignment', text: 'If the steering wheel sits off-centre while you drive straight, the alignment is the first thing to check.', service: 'alignment' },
    edge: { title: 'Wheel alignment', text: 'Tyres wearing on one edge are often a sign the wheels are not pointing where they should.', service: 'alignment' },
    shake: { title: 'Wheel balancing', text: 'A shake through the steering wheel at speed often points to a wheel that is out of balance.', service: 'balancing' },
    air: { title: 'Puncture repair', text: 'A tyre that keeps going soft may have a nail or a slow leak. We will inspect it and tell you whether it can be safely repaired.', service: 'repair' },
    worn: { title: 'New tyres', text: 'If the tread is down near the wear bars it is time to look at a new set. Pirelli is our specialty, with other options on the racks.', service: 'tyres' },
    other: { title: 'Call the workshop', text: 'Noises, warning lights or something you can not put your finger on? Tell us the make, model and what you have noticed.', service: 'mechanical' }
  };
  var symOut = $('#sym-out');
  if (symOut) {
    var symChips = $$('.chip[data-sym]');
    var showSym = function (key) {
      var s = SYMPTOMS[key];
      if (!s) return;
      symChips.forEach(function (c) { c.setAttribute('aria-pressed', c.dataset.sym === key ? 'true' : 'false'); });
      $('.h3', symOut).textContent = s.title;
      $('.sym-text', symOut).textContent = s.text;
      var cta = $('a.btn', symOut);
      cta.href = 'contact.html?service=' + s.service + '#book';
      $('span', cta).textContent = key === 'other' ? 'Ask the workshop' : 'Book ' + s.title.toLowerCase();
      symOut.classList.remove('swap');
      void symOut.offsetWidth;
      symOut.classList.add('swap');
    };
    symChips.forEach(function (c) { c.addEventListener('click', function () { showSym(c.dataset.sym); }); });
  }

  /* ---------- tyres: sidewall decoder + size picker ---------- */
  var swCode = $('#sw-code');
  if (swCode) {
    var PARTS = {
      width: { label: 'Tyre width', text: 'How wide the tyre is across the tread, in millimetres.' },
      profile: { label: 'Profile', text: 'The height of the sidewall as a percentage of the width. A lower number means a lower, sportier sidewall.' },
      build: { label: 'Construction', text: 'R stands for radial, the way almost every modern car tyre is built.' },
      rim: { label: 'Rim size', text: 'The diameter of the wheel the tyre fits, in inches.' },
      load: { label: 'Load index', text: 'A code for how much weight each tyre can carry. 94 means 670 kg per tyre.' },
      speed: { label: 'Speed rating', text: 'A letter for the top speed the tyre is rated to. W means up to 270 km/h.' }
    };
    var swBtns = $$('button[data-k]', swCode);
    var expLabel = $('#sw-exp small');
    var expTitle = $('#sw-exp b');
    var expText = $('#sw-exp p');
    var showPart = function (k) {
      swBtns.forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.k === k ? 'true' : 'false'); });
      var btn = swBtns.filter(function (b) { return b.dataset.k === k; })[0];
      expLabel.textContent = PARTS[k].label;
      expTitle.textContent = btn ? btn.textContent : '';
      expText.textContent = PARTS[k].text;
    };
    swBtns.forEach(function (b) { b.addEventListener('click', function () { showPart(b.dataset.k); }); });

    var selW = $('#sz-w'), selP = $('#sz-p'), selR = $('#sz-r');
    var quote = $('#sz-quote');
    var subText = $('#sw2-text');
    var fill = function (sel, from, to, stepBy, picked) {
      for (var v = from; v <= to; v += stepBy) {
        var o = d.createElement('option');
        o.value = String(v); o.textContent = String(v);
        if (v === picked) o.selected = true;
        sel.appendChild(o);
      }
    };
    if (selW && selP && selR) {
      fill(selW, 155, 335, 10, 225);
      fill(selP, 25, 80, 5, 45);
      fill(selR, 13, 23, 1, 17);
      var syncSize = function () {
        var w = selW.value, p = selP.value, r = selR.value;
        $('[data-k="width"]', swCode).textContent = w;
        $('[data-k="profile"]', swCode).textContent = p;
        $('[data-k="rim"]', swCode).textContent = r;
        var size = w + '/' + p + ' R' + r;
        if (quote) {
          $('span', quote).textContent = 'Quote me on ' + size;
          quote.href = 'contact.html?service=tyres&size=' + encodeURIComponent(w + '/' + p + 'R' + r) + '#book';
        }
        if (subText) {
          subText.textContent = (size + ' • RADIAL • TUBELESS • ').repeat(4);
          fitSidewall();
        }
        var on = swBtns.filter(function (b) { return b.getAttribute('aria-pressed') === 'true'; })[0];
        if (on) showPart(on.dataset.k);
      };
      [selW, selP, selR].forEach(function (s) { s.addEventListener('change', syncSize); });
      syncSize();
    }
    showPart('width');
  }

  /* ---------- workshop: gallery lightbox ---------- */
  var lb = $('#lb');
  if (lb && lb.showModal) {
    var shots = $$('.gal button');
    var lbImg = $('img', lb);
    var lbCap = $('figcaption', lb);
    var at = 0;
    var show = function (i) {
      at = (i + shots.length) % shots.length;
      var img = $('img', shots[at]);
      lbImg.src = img.getAttribute('src');
      lbImg.alt = img.alt;
      lbCap.textContent = (at + 1) + ' / ' + shots.length + '  ·  ' + img.alt;
      lb.classList.toggle('lb--wide', img.naturalWidth >= 1100);
    };
    shots.forEach(function (b, i) { b.addEventListener('click', function () { show(i); lb.showModal(); }); });
    $('[data-lb="prev"]', lb).addEventListener('click', function () { show(at - 1); });
    $('[data-lb="next"]', lb).addEventListener('click', function () { show(at + 1); });
    $('[data-lb="close"]', lb).addEventListener('click', function () { lb.close(); });
    lb.addEventListener('click', function (e) { if (e.target === lb) lb.close(); });
    lb.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') show(at - 1);
      if (e.key === 'ArrowRight') show(at + 1);
    });
  }

  /* ---------- contact: booking request (preview only, nothing is sent) ---------- */
  var form = $('#book-form');
  if (form) {
    var LABELS = { tyres: 'New tyres', alignment: 'Wheel alignment', balancing: 'Wheel balancing', repair: 'Puncture repair', mechanical: 'Auto repairs', trade: 'Trade or wholesale' };
    var q = new URLSearchParams(location.search);
    var svc = q.get('service');
    if (svc && LABELS[svc]) {
      var radio = $('input[name="service"][value="' + svc + '"]', form);
      if (radio) radio.checked = true;
    }
    var size = q.get('size');
    if (size && /^[0-9]{3}\/[0-9]{2}R[0-9]{2}$/.test(size)) form.elements.size.value = size.replace('R', ' R');
    var day = form.elements.day;
    if (day) {
      var now = new Date();
      day.min = now.getFullYear() + '-' + ('0' + (now.getMonth() + 1)).slice(-2) + '-' + ('0' + now.getDate()).slice(-2);
    }
    var sent = $('#sent');
    var check = function (name, ok) {
      var f = form.elements[name].closest('.fld');
      f.classList.toggle('bad', !ok);
      form.elements[name].setAttribute('aria-invalid', ok ? 'false' : 'true');
      return ok;
    };
    ['name', 'phone'].forEach(function (n) {
      form.elements[n].addEventListener('input', function () {
        var f = form.elements[n].closest('.fld');
        if (f.classList.contains('bad')) validate();
      });
    });
    var validate = function () {
      var a = check('name', form.elements.name.value.trim().length > 1);
      var b = check('phone', form.elements.phone.value.replace(/\D/g, '').length >= 8);
      return a && b;
    };
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validate()) {
        var bad = $('.fld.bad .inp', form);
        if (bad) bad.focus();
        return;
      }
      var picked = $('input[name="service"]:checked', form);
      var rows = [
        ['Service', picked ? LABELS[picked.value] : 'Not chosen'],
        ['Name', form.elements.name.value.trim()],
        ['Mobile', form.elements.phone.value.trim()],
        ['Vehicle', form.elements.car.value.trim()],
        ['Tyre size', form.elements.size.value.trim()],
        ['Preferred day', form.elements.day.value],
        ['Time', form.elements.time.value]
      ];
      var dl = $('dl', sent);
      while (dl.firstChild) dl.removeChild(dl.firstChild);
      rows.forEach(function (r) {
        if (!r[1]) return;
        var dt = d.createElement('dt'); dt.textContent = r[0];
        var dd = d.createElement('dd'); dd.textContent = r[1];
        dl.appendChild(dt); dl.appendChild(dd);
      });
      form.hidden = true;
      sent.classList.add('is-on');
      var h = $('.h2', sent);
      h.setAttribute('tabindex', '-1');
      h.focus({ preventScroll: true });
      sent.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    });
    $('#sent-again').addEventListener('click', function () {
      sent.classList.remove('is-on');
      form.hidden = false;
      form.elements.name.focus();
    });
  }
})();
