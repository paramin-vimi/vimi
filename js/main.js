/* ============================================================
   VIMI homepage — behavior layer
   Everything here is progressive enhancement: the page is fully
   usable with JS disabled (reveals default to visible, FAQ uses
   native <details>, nav links are plain anchors).
   ============================================================ */
(function () {
  'use strict';

  document.documentElement.classList.add('js');

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- GA4 event stub ----------
     Wire to your analytics: every conversion element carries data-ga.
     With gtag.js installed this fires automatically; otherwise it no-ops. */
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-ga]');
    if (!el) return;
    if (typeof window.gtag === 'function') {
      window.gtag('event', el.getAttribute('data-ga'), { transport_type: 'beacon' });
    }
  });

  /* ---------- nav scrolled state ---------- */
  var nav = document.querySelector('.nav');
  function onScrollNav() {
    nav.classList.toggle('is-scrolled', window.scrollY > 8);
  }
  window.addEventListener('scroll', onScrollNav, { passive: true });
  onScrollNav();

  /* ---------- reading progress bar (rAF-throttled, transform-only) ---------- */
  var progress = document.getElementById('progress');
  if (progress) {
    var progressQueued = false;
    var updateProgress = function () {
      progressQueued = false;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var p = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
      progress.style.transform = 'scaleX(' + p + ')';
    };
    window.addEventListener('scroll', function () {
      if (!progressQueued) { progressQueued = true; requestAnimationFrame(updateProgress); }
    }, { passive: true });
    window.addEventListener('resize', updateProgress);
    updateProgress();
  }

  /* ---------- services mega menu (click + hover, ARIA kept in sync) ----------
     Hover is handled in JS (not CSS :hover) so aria-expanded never desyncs and
     Escape/outside-click always close. A short grace delay bridges the pointer's
     travel from the button down to the panel. */
  var dropBtn = document.querySelector('.nav__drop-btn');
  var dropdown = document.querySelector('.nav__dropdown');
  if (dropBtn && dropdown) {
    var dropWrap = dropBtn.closest('.nav__item--dropdown');
    var dropCloseTimer = null;

    function setDrop(open) {
      clearTimeout(dropCloseTimer);
      dropdown.classList.toggle('is-open', open);
      dropBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    dropBtn.addEventListener('click', function () {
      setDrop(!dropdown.classList.contains('is-open'));
    });
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.nav__item--dropdown')) setDrop(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setDrop(false);
    });

    // hover open/close only where a real hover pointer exists (not touch)
    if (window.matchMedia('(hover: hover)').matches) {
      dropWrap.addEventListener('mouseenter', function () { setDrop(true); });
      dropWrap.addEventListener('mouseleave', function () {
        clearTimeout(dropCloseTimer);
        dropCloseTimer = setTimeout(function () {
          dropdown.classList.remove('is-open');
          dropBtn.setAttribute('aria-expanded', 'false');
        }, 220);
      });
    }
  }

  /* ---------- mobile menu ---------- */
  var burger = document.querySelector('.nav__burger');
  var mmenu = document.getElementById('mobileMenu');
  var menuInertTargets = ['main', 'footer.footer', '#mbar', '#toTop'];
  function setMenuInert(on) {
    menuInertTargets.forEach(function (sel) {
      var el = document.querySelector(sel);
      if (el) { if (on) el.setAttribute('inert', ''); else el.removeAttribute('inert'); }
    });
  }
  function closeMenu() {
    mmenu.hidden = true;
    burger.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Open menu');
    document.body.style.overflow = '';
    setMenuInert(false);
    burger.focus();
  }
  if (burger && mmenu) {
    burger.addEventListener('click', function () {
      var opening = mmenu.hidden;
      mmenu.hidden = !opening;
      burger.classList.toggle('is-open', opening);
      burger.setAttribute('aria-expanded', opening ? 'true' : 'false');
      burger.setAttribute('aria-label', opening ? 'Close menu' : 'Open menu');
      document.body.style.overflow = opening ? 'hidden' : '';
      setMenuInert(opening);
      if (opening) {
        var first = mmenu.querySelector('a');
        if (first) first.focus();
      }
    });
    /* close if the viewport grows past the burger breakpoint (tablet rotation) */
    var burgerMq = window.matchMedia('(max-width: 900px)');
    var onMq = function (e) { if (!e.matches && !mmenu.hidden) closeMenu(); };
    if (burgerMq.addEventListener) burgerMq.addEventListener('change', onMq);
    else if (burgerMq.addListener) burgerMq.addListener(onMq);
    mmenu.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeMenu();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !mmenu.hidden) closeMenu();
    });
  }

  /* ---------- scroll reveals (once) ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var ro = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          ro.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });
    revealEls.forEach(function (el) { ro.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- stat count-up (once per stat) ---------- */
  var stats = document.querySelectorAll('.stat[data-count]');
  function animateStat(el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    var suffix = el.getAttribute('data-suffix') || '';
    var t0 = null;
    var DURATION = 1100;
    function tick(ts) {
      if (!t0) t0 = ts;
      var p = Math.min((ts - t0) / DURATION, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  if ('IntersectionObserver' in window && !reduceMotion) {
    var so = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateStat(entry.target);
          so.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });
    stats.forEach(function (el) { so.observe(el); });
  }
  /* (no-JS / reduced-motion: markup already contains the final values) */

  /* ---------- click-to-play brand film ---------- */
  var film = document.getElementById('film');
  if (film) {
    var play = film.querySelector('.film__play');
    function startFilm() {
      if (film.classList.contains('is-playing')) return;
      var id = film.getAttribute('data-video-id');
      var iframe = document.createElement('iframe');
      iframe.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0';
      iframe.title = 'Learn About Us in 61 Seconds';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      iframe.setAttribute('allowfullscreen', '');
      film.appendChild(iframe);
      film.classList.add('is-playing');
    }
    play.addEventListener('click', startFilm);
  }

  /* ---------- testimonial scroller arrows ---------- */
  var vScroller = document.querySelector('.voices__scroller');
  if (vScroller) {
    var arrows = document.querySelectorAll('.voices__arrow');
    var updateArrows = function () {
      /* 8px tolerance: scroll-snap rests a few px in because of the scroller's inline padding */
      var max = vScroller.scrollWidth - vScroller.clientWidth - 8;
      arrows.forEach(function (btn) {
        var dir = parseInt(btn.getAttribute('data-dir'), 10);
        btn.disabled = dir < 0 ? vScroller.scrollLeft <= 8 : vScroller.scrollLeft >= max;
      });
    };
    arrows.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var card = vScroller.querySelector('.vcard');
        var step = (card ? card.getBoundingClientRect().width : 380) + 18;
        vScroller.scrollBy({
          left: step * parseInt(btn.getAttribute('data-dir'), 10),
          behavior: reduceMotion ? 'auto' : 'smooth'
        });
      });
    });
    vScroller.addEventListener('scroll', updateArrows, { passive: true });
    window.addEventListener('resize', updateArrows);
    updateArrows();
  }

  /* ---------- back to top ---------- */
  var toTop = document.getElementById('toTop');
  if (toTop) {
    var toTopShown = false;
    window.addEventListener('scroll', function () {
      var show = window.scrollY > 700;
      if (show !== toTopShown) {
        toTopShown = show;
        toTop.classList.toggle('is-visible', show);
      }
    }, { passive: true });
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  /* ---------- newsletter form ----------
     ⚠ FRONT-END ONLY: connect to your email platform before launch. */
  var newsForm = document.getElementById('newsForm');
  if (newsForm) {
    var newsStatus = newsForm.querySelector('.nform__status');
    var newsEmail = newsForm.querySelector('input[type="email"]');
    newsForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = newsEmail.checkValidity();
      newsEmail.classList.toggle('is-invalid', !ok);
      newsEmail.setAttribute('aria-invalid', ok ? 'false' : 'true');
      if (!ok) {
        newsStatus.textContent = 'Please enter a valid email address.';
        newsStatus.style.color = '#E08A6F';
        newsEmail.focus();
        return;
      }
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'newsletter_signup', { transport_type: 'beacon' });
      }
      newsForm.reset();
      newsStatus.style.color = '';
      newsStatus.textContent = 'Thank you for subscribing.';
    });
  }

  /* ---------- sticky mobile action bar ---------- */
  var mbar = document.getElementById('mbar');
  if (mbar) {
    var shown = false;
    function onScrollBar() {
      var pastQuarter = window.scrollY > document.documentElement.scrollHeight * 0.18;
      // hide while the contact form is on screen (redundant there)
      var contact = document.getElementById('contact');
      var rect = contact.getBoundingClientRect();
      var overContact = rect.top < window.innerHeight && rect.bottom > 0;
      var visible = pastQuarter && !overContact;
      if (visible !== shown) {
        shown = visible;
        mbar.classList.toggle('is-visible', visible);
        mbar.setAttribute('aria-hidden', visible ? 'false' : 'true');
        document.body.classList.toggle('mbar-open', visible);
      }
    }
    window.addEventListener('scroll', onScrollBar, { passive: true });
    onScrollBar();
  }

  /* ---------- contact form ----------
     ⚠ FRONT-END ONLY. Before launch, point this at a real handler:
     e.g. a WordPress form plugin endpoint, or a POST to your CRM.
     The per-service thank-you pages on the live site should be used
     as redirect targets for conversion tracking. */
  var form = document.getElementById('contactForm');
  if (form) {
    // eslint-disable-next-line no-console
    console.warn('contactForm is NOT wired to a backend — connect a form handler before launch (see README).');
    var status = form.querySelector('.cform__status');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var fields = form.querySelectorAll('input, select, textarea');
      var valid = true;
      fields.forEach(function (f) {
        var fieldValid = f.checkValidity();
        f.classList.toggle('is-invalid', !fieldValid);
        f.setAttribute('aria-invalid', fieldValid ? 'false' : 'true');
        if (!fieldValid) valid = false;
      });
      if (!valid) {
        status.textContent = 'Please complete the highlighted fields.';
        status.style.color = '#B4372A';
        form.querySelector(':invalid').focus();
        return;
      }
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'generate_lead', { transport_type: 'beacon' });
      }
      form.reset();
      status.style.color = '';
      status.textContent = 'Thank you — we’ll be in touch.';
    });
  }
})();
