/* Kavico v388 shared deferred runtime: parser-safe shared UI core. */
/* v380 deferred interaction + static locale tail */
document.addEventListener('DOMContentLoaded',function(){
/* Kavico v359 — interaction contract */
(function(){
  'use strict';
  var body=document.body;if(!body)return;
  body.setAttribute('data-v359-ready','1');
  var ticking=false;
  function syncScroll(){body.setAttribute('data-v359-scrolled',window.scrollY>20?'1':'0');ticking=false;}
  function onScroll(){if(!ticking){ticking=true;requestAnimationFrame(syncScroll);}}
  syncScroll();window.addEventListener('scroll',onScroll,{passive:true});

  var mq=window.matchMedia('(max-width:900px)');
  var details=Array.prototype.slice.call(document.querySelectorAll('#navMenu details.nav-dd'));
  details.forEach(function(d){d.addEventListener('toggle',function(){if(!mq.matches||!d.open)return;details.forEach(function(other){if(other!==d)other.open=false;});});});

  /* v456: this bar's hidden state was purely "am I near the target section"
     (IntersectionObserver). Added a second, independent reason -- scrolling
     up -- per request, without letting the two fight each other: each
     reason tracks its own boolean and the attribute is only cleared when
     BOTH say "show". The scroll-direction half reuses the same
     stable-anchor technique as v451/v452 (measure against a fixed point
     that only moves on toggle, never frame-to-frame) so it doesn't
     reintroduce the v11 momentum-scroll flicker. */
  function hideBarWhenVisible(bar,target,opts){
    if(!bar)return;
    var nearTarget=false,scrolledUp=false;
    function apply(){bar.setAttribute('data-v359-hidden',(nearTarget||scrolledUp)?'1':'0');}
    if(target&&'IntersectionObserver'in window){
      var io=new IntersectionObserver(function(entries){
        entries.forEach(function(e){nearTarget=e.isIntersecting;apply();});
      },{threshold:.2,rootMargin:'0px 0px -12% 0px'});
      io.observe(target);
    }
    if(opts&&opts.hideOnScrollUp){
      var stableY=window.scrollY,ticking=false,THRESHOLD=24;
      function sync(){
        ticking=false;
        var y=window.scrollY,delta=y-stableY;
        if(delta<-THRESHOLD){scrolledUp=true;stableY=y;apply();}
        else if(delta>THRESHOLD){scrolledUp=false;stableY=y;apply();}
      }
      window.addEventListener('scroll',function(){if(!ticking){ticking=true;requestAnimationFrame(sync);}},{passive:true});
    }
  }
  hideBarWhenVisible(document.querySelector('.v342-mobile-action'),document.querySelector('#contact'),{hideOnScrollUp:true});
  hideBarWhenVisible(document.querySelector('.service-action-bar'),document.querySelector('#cta'));
})();

/* v451: hide-on-scroll-down header for mobile, re-added after the v11 removal.
   v11 was pulled because it toggled `header--hidden` on every tiny 8-10px
   frame-to-frame delta with no debounce, so momentum/rubber-band scrolling on
   mobile made the header flicker up and down on its own. This version avoids
   that failure mode by measuring each delta against a STABLE anchor point
   that only moves when the header actually toggles (or near the top) --
   never against the previous animation frame -- so a burst of small
   back-and-forth jitter from inertial scrolling never crosses the threshold
   in either direction and the header just stays put until a real, sustained
   scroll happens. Desktop keeps the plain persistent header (mq guard), and
   the header is always shown again near the top of the page.
   #navMenu (the mobile flyout) lives INSIDE #header, and it relies on
   #header having no transform of its own -- a transform on an ancestor
   creates a new containing block for a position:fixed descendant, which is
   exactly the backdrop-filter bug this menu already went through earlier.
   `translate3d` on `.header--hidden` would reintroduce that the moment the
   menu opens while the header happens to be hidden. Guard against it: never
   apply header--hidden while body.nav-open, and drop it immediately the
   instant nav-open is set (MutationObserver, since open() lives in a
   different IIFE in this same file with no shared hook to call into
   directly).
   v452: the same treatment for .v365-section-nav (the sticky "بخش‌ها"
   in-page jump bar right under the header) -- factored the stable-anchor
   logic out into makeScrollHider() since it's now used twice verbatim.
   .v365-section-nav has no fixed-position descendants, so it skips the
   nav-open guard the header needs. */
(function(){
  var headerMQ=window.matchMedia('(max-width:720px)');
  function navOpen(){return document.body.classList.contains('nav-open');}
  function makeScrollHider(el,hiddenClass,opts){
    if(!el)return null;
    var stableY=window.scrollY,ticking=false;
    var HIDE_AFTER=(opts&&opts.hideAfter)||80,THRESHOLD=(opts&&opts.threshold)||24;
    var guardOpenNav=!!(opts&&opts.guardOpenNav);
    function sync(){
      ticking=false;
      if(!headerMQ.matches||(guardOpenNav&&navOpen())){el.classList.remove(hiddenClass);stableY=window.scrollY;return;}
      var y=window.scrollY,delta=y-stableY;
      if(y<=HIDE_AFTER){el.classList.remove(hiddenClass);stableY=y;}
      else if(delta>THRESHOLD){el.classList.add(hiddenClass);stableY=y;}
      else if(delta<-THRESHOLD){el.classList.remove(hiddenClass);stableY=y;}
    }
    function onScroll(){if(!ticking){ticking=true;requestAnimationFrame(sync);}}
    window.addEventListener('scroll',onScroll,{passive:true});
    if(headerMQ.addEventListener)headerMQ.addEventListener('change',sync);else if(headerMQ.addListener)headerMQ.addListener(sync);
    return sync;
  }
  var headerHider=makeScrollHider(document.querySelector('#header'),'header--hidden',{guardOpenNav:true});
  /* v457: this bar sits position:sticky right above a hero image slider, so
     while the default 24px threshold was protecting against the v11
     momentum-jitter flicker, it also meant a real, deliberate scroll-down
     spent its first ~24px with the bar still pinned in place, visibly
     overlapping the slider underneath before the hide caught up. A real
     scroll (wheel/touch) covers well over 6px within a single animation
     frame, so dropping the threshold this low still filters out sub-pixel
     rubber-band jitter while making the hide feel immediate for any actual
     scroll gesture -- it should never be visible mid-overlap again. */
  makeScrollHider(document.querySelector('.v365-section-nav'),'v365-section-nav--hidden',{threshold:6});
  if(headerHider&&'MutationObserver'in window){
    new MutationObserver(function(){if(navOpen())document.querySelector('#header').classList.remove('header--hidden');}).observe(document.body,{attributes:true,attributeFilter:['class']});
  }
})();

/* Kavico v363 static locale navigator. */
(function(){
  'use strict';
  var html=document.documentElement;
  var locale=(html.getAttribute('data-static-locale')||'').toLowerCase();
  if(locale!=='fa'&&locale!=='en') return;
  var routes=new Set(["/","/about/","/blog/","/blog/anodizing-aluminum-luxury-finish/","/blog/architectural-coating/","/blog/conductive-vs-insulative-for-pvd/","/blog/decor-color-match/","/blog/decorative-vs-hard-chrome/","/blog/decorative/","/blog/electrophoretic-ecoat-phoretic-guide/","/blog/electrostatic-powder-coating-guide/","/blog/industrial/","/blog/matte-vs-gloss/","/blog/mirror-vs-satin-polish/","/blog/nickel-chrome-on-zamak/","/blog/other-coating-methods-phoretic-anodizing-thermal-spray/","/blog/plating-defects-peeling-blisters/","/blog/polishing-before-pvd/","/blog/polishing-brass-parts/","/blog/pvd-care/","/blog/pvd-coating/","/blog/pvd-color-consistency-qc/","/blog/pvd-color-durability/","/blog/pvd-colors/","/blog/pvd-defects-streaks-pinhole/","/blog/pvd-door-handles-luxury-finish/","/blog/pvd-faucets/","/blog/pvd-fingerprint-cleaning/","/blog/pvd-on-abs-plastic/","/blog/pvd-on-glass-crystal/","/blog/pvd-on-pp-plastic/","/blog/pvd-on-zinc-galvanized/","/blog/pvd-quote-guide/","/blog/pvd-vs-ceramic/","/blog/quality-tests/","/blog/surface-preparation/","/blog/traditional-plating-nickel-chrome/","/compare/","/compare/pvd-vs-anodizing/","/compare/pvd-vs-plating/","/compare/pvd-vs-powder/","/contact/","/faq/","/guide/","/guides/","/guides/nickel-chrome-plating/","/guides/polishing/","/guides/pvd-coating/","/hub/","/karaj/","/portfolio/","/process/","/quality/","/services/","/services/decorative-pvd/","/services/nickel-chrome-plating/","/services/polishing/","/services/pvd-coating/","/services/pvd-faucets/","/tehran/","/tools/","/tools/pricing/"]);
  var enOverrides={
    '/tehran/pvd-coating/':'/en/tehran/',
    '/karaj/pvd-coating/':'/en/karaj/',
    '/tehran/decorative-pvd/':'/en/services/decorative-pvd/',
    '/karaj/decorative-pvd/':'/en/services/decorative-pvd/',
    '/tehran/pvd-faucets/':'/en/services/pvd-faucets/',
    '/karaj/pvd-faucets/':'/en/services/pvd-faucets/'
  };
  function cleanPath(p){ p=String(p||'/'); if(!p.startsWith('/')) p='/'+p; if(!p.endsWith('/')&&!/\.[a-z0-9]+$/i.test(p)) p+='/'; return p; }
  function toEnglishPath(p){ p=cleanPath(p); if(p==='/') return '/en/'; if(p.startsWith('/en/')) return p; if(enOverrides[p]) return enOverrides[p]; return routes.has(p)?('/en'+p):p; }
  function toPersianPath(p){ p=cleanPath(p); if(p==='/en/'||p==='/en') return '/'; if(p.startsWith('/en/')) return cleanPath(p.slice(3)); return p; }
  function targetFor(next){ var p=location.pathname||'/'; var target=(next==='en')?toEnglishPath(toPersianPath(p)):toPersianPath(p); return target+(location.search||'')+(location.hash||''); }
  function bindToggle(){
    var b=document.getElementById('langToggle')||document.querySelector('[data-lang-toggle]');
    if(!b||b.dataset.staticLocaleBound==='1') return; b.dataset.staticLocaleBound='1';
    b.addEventListener('click',function(e){ e.preventDefault(); e.stopImmediatePropagation(); var next=locale==='en'?'fa':'en'; try{localStorage.setItem('kavico:lang',next);localStorage.setItem('lang',next);}catch(_e){} location.assign(targetFor(next)); },true);
  }
  function rewriteAnchor(a){
    if(locale!=='en'||!a||!a.getAttribute) return; var raw=a.getAttribute('href');
    if(!raw||raw[0]==='#'||/^(?:mailto:|tel:|javascript:|data:)/i.test(raw)) return;
    try{ var u=new URL(raw,location.href); if(u.origin!==location.origin) return; var p=toPersianPath(u.pathname); if(routes.has(p)){ u.pathname=toEnglishPath(p); a.setAttribute('href',u.pathname+u.search+u.hash); } }catch(_e){}
  }
  function rewriteAll(root){ try{ (root||document).querySelectorAll('a[href]').forEach(rewriteAnchor); }catch(_e){} }
  function legacyQueryRedirect(){
    try{
      var u=new URL(location.href), requested=(u.searchParams.get('lang')||'').toLowerCase();
      if((locale==='fa'&&requested==='en')||(locale==='en'&&requested==='fa')){
        u.searchParams.delete('lang');
        var target=(requested==='en')?toEnglishPath(toPersianPath(u.pathname)):toPersianPath(u.pathname);
        var q=u.searchParams.toString();
        location.replace(target+(q?'?'+q:'')+(u.hash||''));
        return true;
      }
    }catch(_e){}
    return false;
  }
  function init(){ if(legacyQueryRedirect()) return; bindToggle(); rewriteAll(document); if(locale==='en'){ try{ new MutationObserver(function(ms){ms.forEach(function(m){m.addedNodes.forEach(function(n){if(n.nodeType===1){if(n.matches&&n.matches('a[href]'))rewriteAnchor(n);rewriteAll(n);}});});}).observe(document.body,{childList:true,subtree:true}); }catch(_e){} } }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
})();

},{once:true});

;(()=>{let r=0;function x(){if(r||document.readyState==='loading')return;r=1;
/* Kavico v335: CSP-safe runtime motion helpers (no element.style writes). */
(function(){
  'use strict';
  function canAnimate(el){ return !!(el && typeof el.animate === 'function'); }
  function setTransform(el, transform, opts){
    if (!canAnimate(el)) return false;
    try{
      var frame = { transform: String(transform || 'none') };
      if (opts && opts.origin) frame.transformOrigin = String(opts.origin);
      var anim = el.animate([frame, frame], { duration: 1, easing: 'linear', fill: 'forwards' });
      try{ anim.pause(); anim.currentTime = 1; }catch(_e){}
      var old = el.__kavicoTransformAnim;
      el.__kavicoTransformAnim = anim;
      try{ el.setAttribute('data-kav-motion', 'transform'); }catch(_e){}
      if (old && old.cancel){
        try{ window.requestAnimationFrame(function(){ try{ old.cancel(); }catch(_e){} }); }catch(_e){ try{ old.cancel(); }catch(_e2){} }
      }
      return true;
    }catch(_e){ return false; }
  }
  function clearTransform(el){
    if (!el) return false;
    try{
      var old = el.__kavicoTransformAnim;
      if (old && old.cancel) old.cancel();
      delete el.__kavicoTransformAnim;
      el.removeAttribute('data-kav-motion');
      return true;
    }catch(_e){ return false; }
  }
  window.KavicoMotion = window.KavicoMotion || { setTransform: setTransform, clearTransform: clearTransform };
})();


/*!
 * Kavico Utils v384 — only APIs consumed by current public tails.
 */
(function(){
  'use strict';
  if(window.KavicoUtils)return;
  function currentLang(){var l=(document.documentElement.getAttribute('lang')||'fa').toLowerCase();return l.indexOf('en')===0?'en':'fa';}
  function normalize(str){return String(str==null?'':str).toLowerCase().trim();}
  function debounce(fn,delay){var t;delay=typeof delay==='number'?delay:250;return function(){var ctx=this,args=arguments;clearTimeout(t);t=setTimeout(function(){fn.apply(ctx,args);},delay);};}
  function escapeHTML(s){var str=String(s==null?'':s);return str.replace(/[&<>"'`]/g,function(ch){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','`':'&#96;'})[ch]||ch;});}
  function safeLocalPath(path,fallback){var fb=fallback||'#',raw=String(path==null?'':path).trim();if(!raw||/[\u0000-\u001f\u007f]/.test(raw)||/^(?:javascript|data|vbscript):/i.test(raw)||/^\/\//.test(raw)||raw.indexOf('..')!==-1||/^(?:https?:)?\/\//i.test(raw))return fb;return raw.replace(/index\.html$/i,'');}
  (function(){try{var ua=navigator.userAgent||'';if(/Windows\sNT/i.test(ua))document.documentElement.classList.add('os-windows');}catch(_e){}})();
  function syncHeaderHeight(){var b=document.body;if(!b||!b.classList||!b.classList.contains('page-home'))return;var h=document.getElementById('header')||document.querySelector('.header');if(!h)return;var apply=function(){try{var n=Math.round(h.getBoundingClientRect().height||h.offsetHeight||0);if(n>40)b.setAttribute('data-header-h',String(Math.max(40,Math.min(120,n))));}catch(_e){}};apply();window.addEventListener('resize',debounce(apply,140),{passive:true});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',syncHeaderHeight,{once:true});else syncHeaderHeight();
  window.KavicoUtils={currentLang:currentLang,normalize:normalize,debounce:debounce,escapeHTML:escapeHTML,safeLocalPath:safeLocalPath};
})();


/* Kavico v384 app runtime. Authored root-safe nav links are source of truth. */

// --- Knowledge hub data moved to assets/js/articles-data.js (v62) ---


function setActiveNavLink(){
  try{
    const nav = document.getElementById('nav');
    if(!nav) return;
    const norm = (p) => {
      if(!p) return '';
      // remove query/hash and normalize trailing slash
      p = p.split('?')[0].split('#')[0];
      // convert /foo/index.html -> /foo/
      p = p.replace(/index\.html$/i,'');
      // ensure leading slash
      if(p[0] !== '/') p = '/' + p;
      // collapse multiple slashes
      p = p.replace(/\/+/g,'/');
      // remove trailing slash except root
      if(p.length > 1 && p.endsWith('/')) p = p.slice(0,-1);
      return p;
    };
    const current = norm(window.location.pathname);
    // clear previous state
    nav.querySelectorAll('a[aria-current="page"], a.is-active').forEach(a=>{
      a.removeAttribute('aria-current');
      a.classList.remove('is-active');
    });

    const links = Array.from(nav.querySelectorAll('a[href]'));
    let best = null;
    let bestLen = -1;

    links.forEach(a=>{
      const href = a.getAttribute('href') || '';
      if(!href || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('#')) return;
      let url;
      try{ url = new URL(href, window.location.href); }catch(_e){ return; }
      const p = norm(url.pathname);
      if(!p) return;
      if(current === p){
        if(p.length > bestLen){ best=a; bestLen=p.length; }
      }
    });

    // fallback: match by prefix for section index pages (e.g., /blog/anything -> /blog)
    if(!best){
      links.forEach(a=>{
        const href = a.getAttribute('href') || '';
        if(!href || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('#')) return;
        let url;
        try{ url = new URL(href, window.location.href); }catch(_e){ return; }
        const p = norm(url.pathname);
        if(!p || p === '/') return;
        if(current.startsWith(p) && p.length > bestLen){ best=a; bestLen=p.length; }
      });
    }

    if(best){
      best.classList.add('is-active');
      best.setAttribute('aria-current','page');
    }
  }catch(_e){}
}

document.addEventListener('DOMContentLoaded', setActiveNavLink);


// v326: legacy [data-bg] CSSOM lazy background loader removed; no current HTML consumers.

// v384: legacy .zoom-img runtime removed; no HTML consumers remain.

/* v3: header sync with hero (home only) */
(function(){
  try{
    const body = document.body;
    if(!body || !body.classList.contains('page-home')) return;
    const header = document.getElementById('header');
    const hero = document.getElementById('hero');
    if(!header || !hero) return;

    const setState = (inHero)=>{
      header.classList.toggle('is-hero', !!inHero);
      header.classList.toggle('is-solid', !inHero);
      // keep existing behavior consistent
      if (inHero) header.classList.remove('scrolled');
    };

    if (!('IntersectionObserver' in window)){
      // fallback: based on scroll position
      const onScroll = ()=> setState((window.scrollY||0) < (hero.offsetHeight - 120));
      window.addEventListener('scroll', onScroll, {passive:true});
      onScroll();
      return;
    }

    const io = new IntersectionObserver((entries)=>{
      entries.forEach(e=>{
        if (e.target !== hero) return;
        setState(e.isIntersecting && e.intersectionRatio > 0.35);
      });
    }, {threshold: [0.1, 0.35, 0.6]});

    io.observe(hero);
    // initial
    setState(true);
  }catch(e){}
})();


/* v11: header hide-on-scroll-direction removed (v435).
   It toggled `header--hidden` on tiny 8-10px deltas with no debounce, so normal
   momentum/inertial scrolling (mobile bounce, trackpad) made the header visibly
   flicker up and down on its own. A persistent header has no such failure mode,
   so the behavior is dropped rather than re-tuned. */

function closeAllNavDetailsSafe(){
  try{
    if (window && typeof window.closeAllNavDetails === 'function') {
      window.closeAllNavDetails();
      return;
    }
  } catch(e){}
  try{
    document.querySelectorAll('#navMenu details[open]').forEach(function(d){
      try{ d.removeAttribute('open'); }catch(e){}
    });
  } catch(e){}
}

// NOTE (v24): On mobile, closing <details> synchronously can cancel navigation
// for submenu links (because the clicked <a> becomes hidden before the browser
// runs the default navigation). We close on the next tick instead.
document.addEventListener('click', (e)=>{
  const navMenu = document.getElementById('navMenu');
  if(!navMenu) return;
  const a = e.target && e.target.closest ? e.target.closest('#navMenu a') : null;
  if(!a) return;

  // If the user is opening in a new tab/window, don't mess with it.
  try{
    if (e && (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)) return;
    if (a && a.target && String(a.target).toLowerCase() === '_blank') return;
  }catch(_e){}

  setTimeout(closeAllNavDetailsSafe, 0);
});

;
;/* v384: SEO fallback removed; canonical and og:url are authored in every static public page. */

;/* v384 static-locale + theme runtime.
   Locale is immutable per document; language switching is navigation handled by the static-locale navigator above. */
(function(){
  'use strict';
  var STORAGE_THEME='kavico:theme';
  var html=document.documentElement;
  var body=document.body;
  var themeToggle=document.getElementById('themeToggle');

  function normalizeTheme(v){ return (v==='light'||v==='nebula')?v:'dark'; }
  function rootPath(){
    var r=(html.getAttribute('data-root')||'').trim();
    return r||'./';
  }
  function ensureThemeAsset(theme){
    try{
      var id='kavico-theme-runtime';
      var old=document.getElementById(id);
      if(theme!=='nebula'){ if(old) old.remove(); return; }
      var href=rootPath()+'assets/css/bundles/theme-nebula-runtime-77ac10abcf.v385.css?v=385';
      if(old){ if(old.getAttribute('href')!==href) old.setAttribute('href',href); return; }
      var ln=document.createElement('link'); ln.rel='stylesheet'; ln.id=id; ln.href=href; document.head.appendChild(ln);
    }catch(_e){}
  }
  function syncThemeMeta(theme){
    try{
      var m=document.querySelector('meta[name="theme-color"]');
      if(!m){m=document.createElement('meta');m.name='theme-color';document.head.appendChild(m);}
      m.content=theme==='light'?'#fbfaf8':(theme==='nebula'?'#070a1a':'#0b0f18');
    }catch(_e){}
  }
  function applyTheme(value,persist){
    var t=normalizeTheme(value);
    try{html.setAttribute('data-theme',t);}catch(_e){}
    ensureThemeAsset(t); syncThemeMeta(t);
    if(body){
      body.classList.toggle('is-light',t==='light'); body.classList.toggle('is-dark',t==='dark'); body.classList.toggle('is-nebula',t==='nebula');
      body.classList.toggle('light-theme',t==='light'); body.classList.toggle('dark-theme',t==='dark'); body.classList.toggle('nebula-theme',t==='nebula');
    }
    if(themeToggle){themeToggle.setAttribute('aria-pressed',String(t==='dark'));themeToggle.setAttribute('data-theme',t);}
    if(persist!==false){try{localStorage.setItem(STORAGE_THEME,t);localStorage.setItem('theme',t);}catch(_e){}}
    return t;
  }
  function toggleTheme(){
    var cur=normalizeTheme(html.getAttribute('data-theme')||'dark');
    var next=cur==='light'?'dark':(cur==='dark'?'nebula':'light');
    applyTheme(next,true);
    try{window.dispatchEvent(new CustomEvent('kavico:theme-changed',{detail:{theme:next}}));}catch(_e){}
  }
  function wire(){
    document.addEventListener('click',function(e){
      var b=e.target&&e.target.closest?e.target.closest('#themeToggle'):null;
      if(!b)return; e.preventDefault(); toggleTheme();
    },{capture:true});
    document.addEventListener('keydown',function(e){
      if(e.key!=='Enter'&&e.key!==' ')return;
      var el=document.activeElement; if(!el||!el.closest||!el.closest('#themeToggle'))return;
      e.preventDefault(); toggleTheme();
    });
    window.addEventListener('storage',function(e){ if(e.key===STORAGE_THEME) applyTheme(e.newValue,false); });
  }
  function init(){
    var t=html.getAttribute('data-theme')||'dark';
    try{t=localStorage.getItem(STORAGE_THEME)||localStorage.getItem('theme')||t;}catch(_e){}
    applyTheme(t,false); wire();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
})();


/* Kavico v345 — lean public UI shell: navigation, header state, reveal, same-page anchors, image state. */
(function(){
  'use strict';
  function ready(fn){ if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',fn,{once:true}); else fn(); }
  function reducedMotion(){ try{return window.matchMedia('(prefers-reduced-motion: reduce)').matches;}catch(_e){return false;} }

  function initNav(){
    var header=document.getElementById('header'), btn=document.getElementById('menuBtn'), nav=document.getElementById('nav');
    if(!header||!btn||!nav) return;
    var panel=document.getElementById(btn.getAttribute('aria-controls')||'navMenu') || nav;
    var backdrop=document.querySelector('.nav-backdrop');
    var lastFocused=null;
    function focusables(){ return Array.from(panel.querySelectorAll('a[href],button:not([disabled]),summary,[tabindex]:not([tabindex="-1"])')).filter(function(el){return el.offsetParent!==null && el.getAttribute('aria-hidden')!=='true';}); }
    function sync(){
      var open=nav.classList.contains('open');
      btn.classList.toggle('active',open); btn.setAttribute('aria-expanded',open?'true':'false');
      btn.setAttribute('aria-label',open?(document.documentElement.lang==='en'?'Close main navigation':'بستن منوی اصلی'):(document.documentElement.lang==='en'?'Open main navigation':'باز کردن منوی اصلی'));
      document.body.classList.toggle('nav-open',open);
    }
    function close(restore){
      nav.classList.remove('open'); nav.querySelectorAll('details[open]').forEach(function(d){d.removeAttribute('open');}); sync();
      if(restore!==false){ try{(lastFocused&&lastFocused.focus?lastFocused:btn).focus();}catch(_e){} }
      lastFocused=null;
    }
    function open(){
      try{lastFocused=document.activeElement;}catch(_e){}
      nav.classList.add('open'); sync();
      // Force a synchronous reflow right after the position:absolute -> fixed
      // switch. Some browsers cache the containing-block association from
      // before the class toggle and never re-associate #navMenu with the
      // viewport, leaving offsetParent pointing at #nav and the panel
      // rendered off-screen even though computed styles report `fixed`.
      try{ void panel.offsetHeight; }catch(_e){}
      setTimeout(function(){var f=focusables(); if(f.length) try{f[0].focus();}catch(_e){}},0);
    }
    btn.addEventListener('click',function(ev){ev.preventDefault(); nav.classList.contains('open')?close():open();});
    if(backdrop) backdrop.addEventListener('click',function(){if(nav.classList.contains('open')) close();});
    document.addEventListener('keydown',function(ev){
      if(ev.key==='Escape'){
        if(nav.classList.contains('open')){ev.preventDefault();close();return;}
        header.querySelectorAll('details[open]').forEach(function(d){d.removeAttribute('open');});
      }
      if(ev.key==='Tab'&&nav.classList.contains('open')){
        var f=focusables(); if(!f.length)return; var first=f[0],last=f[f.length-1],active=document.activeElement;
        if(ev.shiftKey&&(active===first||!panel.contains(active))){ev.preventDefault();last.focus();}
        else if(!ev.shiftKey&&active===last){ev.preventDefault();first.focus();}
      }
    },true);
    nav.addEventListener('click',function(ev){var a=ev.target.closest&&ev.target.closest('a[href]'); if(a&&nav.classList.contains('open')) close(false);});
    nav.querySelectorAll('details').forEach(function(d){d.addEventListener('toggle',function(){if(!d.open)return; nav.querySelectorAll('details[open]').forEach(function(other){if(other!==d)other.removeAttribute('open');});});});
    document.addEventListener('pointerdown',function(ev){
      var desktop=false; try{desktop=window.matchMedia('(hover:hover) and (pointer:fine)').matches;}catch(_e){}
      if(desktop&&!header.contains(ev.target)) header.querySelectorAll('details[open]').forEach(function(d){d.removeAttribute('open');});
    },true);
    window.addEventListener('resize',function(){if((window.innerWidth||0)>900&&nav.classList.contains('open'))close(false);},{passive:true});
    sync();
  }

  function initHeader(){
    var header=document.getElementById('header'); if(!header)return; var ticking=false;
    function update(){ticking=false; header.classList.toggle('scrolled',(window.scrollY||0)>20);}
    window.addEventListener('scroll',function(){if(!ticking){ticking=true;requestAnimationFrame(update);}},{passive:true}); update();
  }

  function initReveal(){
    var els=Array.from(document.querySelectorAll('.fade-in')); if(!els.length)return;
    if(reducedMotion()||!('IntersectionObserver'in window)){els.forEach(function(el){el.classList.add('show');});return;}
    var io=new IntersectionObserver(function(entries){entries.forEach(function(e){if(e.isIntersecting){e.target.classList.add('show');io.unobserve(e.target);}});},{rootMargin:'80px 0px',threshold:.08});
    els.forEach(function(el){io.observe(el);});
  }

  function initAnchors(){
    document.addEventListener('click',function(ev){
      var a=ev.target.closest&&ev.target.closest('a[href^="#"]'); if(!a)return; var href=a.getAttribute('href'); if(!href||href==='#')return;
      var target; try{target=document.querySelector(href);}catch(_e){return;} if(!target)return;
      ev.preventDefault(); target.scrollIntoView({behavior:reducedMotion()?'auto':'smooth',block:'start'});
      if(target.hasAttribute('tabindex')) try{target.focus({preventScroll:true});}catch(_e){}
    });
  }

  function initImages(){
    document.querySelectorAll('img').forEach(function(img){
      if(!img.hasAttribute('decoding'))img.setAttribute('decoding','async');
      img.classList.add('k-img');
      function done(){img.classList.add('is-loaded');}
      img.addEventListener('load',done,{once:true}); if(img.complete)done();
    });
  }

  ready(function(){initNav();initHeader();initReveal();initAnchors();initImages();});
})();


// Service Worker (offline cache)
(function(){
  if (!('serviceWorker' in navigator)) return;

  const host = (location && location.hostname) ? location.hostname : '';
  const isLocal = (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0' || host.endsWith('.local') ||
    /^192\.168\./.test(host) || /^10\./.test(host) || /^172\.(1[6-9]|2\d|3[0-1])\./.test(host));

  async function resetSiteCaches() {
    try {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => { try { return r.unregister(); } catch(e){ return false; } }));
      }
    } catch (e) {}
    try {
      if (window.caches && caches.keys) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
    } catch (e) {}
    try {
      const url = new URL(location.href);
      url.searchParams.delete('reset');
      url.searchParams.delete('clearcache');
      url.hash = '';
      location.replace(url.toString());
    } catch (e) { location.reload(); }
  }
  window.kavicoReset = resetSiteCaches;

  try {
    const u = new URL(location.href);
    if (u.searchParams.has('reset') || u.searchParams.has('clearcache')) {
      resetSiteCaches();
      return;
    }
  } catch (e) {}

  // Register SW even on localhost; dev=396 disables production caching in local QA.
  window.addEventListener('load', () => {
    const base = 'sw.js?v=400' + (isLocal ? '&dev=400' : '');
    const swUrl = ((document.documentElement.getAttribute('data-root')||'./') + base);
    try{
      navigator.serviceWorker.register(swUrl, { updateViaCache: 'none' }).catch(()=>{});
      navigator.serviceWorker.ready.then((reg)=>{ try{ reg.update(); }catch(e){} }).catch(()=>{});
    }catch(e){}
  });
})();
;

/* Kavico v343 accessibility and interaction guard */
(function(){
  'use strict';
  function init(){
    try{
      var form=document.querySelector('form[name="project-brief"]');
      if(form){
        var status=document.getElementById('v343-form-status');
        var firstInvalid=null;
        form.addEventListener('invalid',function(ev){
          var el=ev.target; if(!el||!el.matches('input,select,textarea')) return;
          el.setAttribute('aria-invalid','true');
          if(!firstInvalid) firstInvalid=el;
          if(status) status.textContent=document.documentElement.lang==='en'?'Please review the highlighted required fields.':'لطفاً فیلدهای ضروری مشخص‌شده را بررسی کنید.';
          setTimeout(function(){ if(firstInvalid){ try{firstInvalid.focus({preventScroll:true}); firstInvalid.scrollIntoView({behavior:'smooth',block:'center'});}catch(_e){} firstInvalid=null;} },0);
        },true);
        form.addEventListener('input',function(ev){ var el=ev.target; if(el&&el.matches('input,select,textarea')&&el.checkValidity()) el.removeAttribute('aria-invalid'); },true);
        form.addEventListener('change',function(ev){ var el=ev.target; if(el&&el.matches('input,select,textarea')&&el.checkValidity()) el.removeAttribute('aria-invalid'); },true);
      }
      var main=document.getElementById('main'); if(main&&!main.hasAttribute('tabindex')) main.setAttribute('tabindex','-1');
    }catch(_e){}
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
})();


/* v344 navigation interaction hardening */
(function(){
  'use strict';
  function initNav(){
    try{
      var btn=document.getElementById('menuBtn'), nav=document.getElementById('nav');
      if(!btn||!nav) return;
      function sync(){
        var open=nav.classList.contains('open');
        btn.setAttribute('aria-expanded',open?'true':'false');
        btn.setAttribute('aria-label',open?(document.documentElement.lang==='en'?'Close main navigation':'بستن منوی اصلی'):(document.documentElement.lang==='en'?'Open main navigation':'باز کردن منوی اصلی'));
      }
      new MutationObserver(sync).observe(nav,{attributes:true,attributeFilter:['class']});
      window.addEventListener('resize',function(){
        if((window.innerWidth||0)>900 && nav.classList.contains('open')){
          nav.classList.remove('open'); btn.classList.remove('active'); document.body.classList.remove('nav-open');
          nav.querySelectorAll('details[open]').forEach(function(d){d.removeAttribute('open');});
          sync();
        }
      },{passive:true});
      sync();
    }catch(_e){}
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',initNav,{once:true}); else initNav();
})();

}if(document.readyState==='loading'){document.addEventListener('readystatechange',function q(){if(document.readyState!=='loading'){document.removeEventListener('readystatechange',q);x()}})}else x()})();


/* KAVICO v395 — unified conversion rail, source attribution and mobile navigation call shortcut. */
(function(){'use strict';
  function ready(fn){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',fn,{once:true});else fn();}
  function isEn(){return (document.documentElement.lang||'fa').toLowerCase().indexOf('en')===0;}
  function pageUrl(){var c=document.querySelector('link[rel=\"canonical\"]');try{return new URL(c&&c.href?c.href:location.href,location.href);}catch(_e){return new URL(location.href);}}function cleanPath(){var p=(pageUrl().pathname||'/').replace(/^\/en(?=\/)/,'');p=p.replace(/\/index\.html$/,'/');return p||'/';}
  function source(){var p=cleanPath().replace(/^\/+|\/+$/g,'');var s='';if(!p)s='home';else if(p.indexOf('blog/')===0)s='blog-'+p.slice(5).replace(/\//g,'-');else if(p.indexOf('guides/')===0)s='guides-'+p.slice(7).replace(/\//g,'-');else if(p.indexOf('services/')===0)s='services-'+p.slice(9).replace(/\//g,'-');else s=p.replace(/\//g,'-');return (isEn()?'en-':'')+s.replace(/-+$/,'');}
  function contactHref(src){return (isEn()?'/en/contact/':'/contact/')+'?src='+encodeURIComponent(src)+'#project-brief';}
  function normalizeContactLink(a,src){if(!a)return;var raw=a.getAttribute('href')||'';if(!raw||raw.charAt(0)==='#')return;try{var base=pageUrl();var u=new URL(raw,base.href);if(u.origin!==base.origin||u.pathname.indexOf('/contact/')<0||u.hash!=='#project-brief')return;if(!u.searchParams.get('src'))u.searchParams.set('src',src);a.setAttribute('href',u.pathname+(u.searchParams.toString()?'?'+u.searchParams.toString():'')+u.hash);a.setAttribute('data-v370-source',src);}catch(_e){}}
  function callMarkup(a){if(!a)return;a.setAttribute('aria-label',isEn()?'Call directly':'تماس مستقیم');var t=(a.textContent||'').trim();if(t==='☎'||t==='☎️')a.innerHTML='<span aria-hidden="true">☎</span><span class="v395-call-label">'+(isEn()?'Call':'تماس')+'</span>';}
  function enhanceBar(bar,src,hideSelector){if(!bar)return;bar.classList.add('v395-mobile-conversion');document.body.classList.add('has-v395-mobile-conversion');var links=bar.querySelectorAll('a[href]');links.forEach(function(a){normalizeContactLink(a,src);if((a.getAttribute('href')||'').indexOf('tel:')===0){a.setAttribute('data-v395-call','');callMarkup(a);}else if((a.getAttribute('href')||'').indexOf('#project-brief')>=0||a.classList.contains('v342-mobile-action__primary')||a.classList.contains('v341-mobile-rail__primary'))a.setAttribute('data-v395-primary','');});if(hideSelector)observeHide(bar,document.querySelector(hideSelector));}
  function observeHide(bar,target){if(!bar||!target||!('IntersectionObserver'in window))return;var io=new IntersectionObserver(function(es){es.forEach(function(e){bar.setAttribute('data-v359-hidden',e.isIntersecting?'1':'0');});},{threshold:.01,rootMargin:'0px 0px -18% 0px'});io.observe(target);}
  function makeBar(src,mode){var n=document.createElement('nav');n.className='v395-mobile-conversion';n.setAttribute('aria-label',isEn()?'Quick actions':'اقدامات سریع');var p=document.createElement('a');p.className='v395-mobile-conversion__primary';p.setAttribute('data-v395-primary','');if(mode==='contact'){p.href='#project-brief';p.textContent=isEn()?'Continue project brief':'ادامه فرم پروژه';}else{p.href=contactHref(src);p.setAttribute('data-v370-source',src);p.textContent=isEn()?'Send project details':'ارسال مشخصات پروژه';}var c=document.createElement('a');c.className='v395-mobile-conversion__call';c.setAttribute('data-v395-call','');c.href='tel:+989125460799';c.innerHTML='<span aria-hidden="true">☎</span><span class="v395-call-label">'+(isEn()?'Call':'تماس')+'</span>';c.setAttribute('aria-label',isEn()?'Call directly':'تماس مستقیم');n.appendChild(p);n.appendChild(c);document.body.appendChild(n);document.body.classList.add('has-v395-mobile-conversion');return n;}
  function addNavCall(){var nav=document.getElementById('navMenu');if(!nav||nav.querySelector('.v395-nav-call'))return;var brief=nav.querySelector('.v343-nav-brief');if(!brief)return;var a=document.createElement('a');a.className='v395-nav-call';a.href='tel:+989125460799';a.textContent=isEn()?'Call directly':'تماس مستقیم';a.setAttribute('aria-label',isEn()?'Call directly':'تماس مستقیم');brief.insertAdjacentElement('afterend',a);}
  function addDesktopCallToArticleStep(){document.querySelectorAll('.v377-next-step__actions').forEach(function(w){if(w.querySelector('a[href^="tel:"]'))return;var a=document.createElement('a');a.className='btn btn-ghost';a.href='tel:+989125460799';a.textContent=isEn()?'Call directly':'تماس مستقیم';a.setAttribute('aria-label',isEn()?'Call directly':'تماس مستقیم');w.appendChild(a);});}
  function focusGuard(){document.addEventListener('focusin',function(e){if(window.matchMedia('(max-width:900px)').matches&&e.target&&e.target.matches&&e.target.matches('input,select,textarea,[contenteditable="true"]'))document.body.setAttribute('data-v395-form-focus','1');});document.addEventListener('focusout',function(){setTimeout(function(){if(!document.activeElement||!document.activeElement.matches||!document.activeElement.matches('input,select,textarea,[contenteditable="true"]'))document.body.removeAttribute('data-v395-form-focus');},80);});}
  ready(function(){var src=source();addNavCall();addDesktopCallToArticleStep();focusGuard();var existing=document.querySelector('.service-action-bar,.v342-mobile-action,.v341-mobile-rail');if(existing){var target=existing.classList.contains('service-action-bar')?'#cta':(existing.classList.contains('v342-mobile-action')?'#contact':null);enhanceBar(existing,src,target);}else if(document.body.classList.contains('page-article')){var b=makeBar(src,'project');observeHide(b,document.querySelector('.v377-next-step'));}else if(document.body.classList.contains('page-contact')&&document.querySelector('form[name="project-brief"]')){var c=makeBar(src,'contact');observeHide(c,document.querySelector('#project-brief'));}}
  );
})();

;
/* Kavico v382 shared public content dataset — 38 records (32 Blog + 6 Guide/Compare). */
window.KAVIAN_ARTICLES=[{"path":"blog/polishing-brass-parts/index.html","imgWebp":"assets/img/blog-sample-polishing.webp","imgJpg":"assets/img/blog-sample-polishing.jpg","date":"2026-01-07","titleFa":"پرداخت‌کاری قطعات برنجی: نکات مهم برای خروجی لوکس","titleEn":"Polishing brass parts: practical tips for a premium finish","leadFa":"برنج با یک پرداخت خوب واقعاً لوکس می‌شود. با یک پرداخت بد، همان‌قدر سریع افت می‌کند.","leadEn":"Brass looks truly premium with good polishing. With poor polishing, it degrades just as fast."},{"path":"blog/mirror-vs-satin-polish/index.html","imgWebp":"assets/img/article-mirror-vs-satin-v357.webp","imgJpg":"assets/img/article-mirror-vs-satin-v357.jpg","date":"2026-01-07","titleFa":"پولیش آینه‌ای vs ساتن: کدام برای پروژه لوکس بهتر است؟","titleEn":"Mirror vs satin polish: which is better for luxury projects?","leadFa":"اگر نور محیط سخت است یا تماس زیاد دارید، ساتن معمولاً انتخاب منطقی‌تری است. اما بعضی پروژه‌ها آینه‌ای می‌خواهند.","leadEn":"If lighting is harsh or the part is high-touch, satin is often safer. But some projects truly need a mirror look."},{"path":"blog/polishing-before-pvd/index.html","imgWebp":"assets/img/article-polishing-before-pvd-v357.webp","imgJpg":"assets/img/article-polishing-before-pvd-v357.jpg","date":"2026-01-07","titleFa":"پرداخت‌کاری قبل از PVD: چرا نصف کیفیت کار همینجاست؟","titleEn":"Polishing before PVD: why half the quality is decided here","leadFa":"اگر پولیش بد باشد، بهترین پوشش هم معجزه نمی‌کند. برای فینیش لوکس، زیرکار پادشاه است.","leadEn":"If polishing is poor, even the best coating will not save it. For a premium finish, the substrate is king."},{"path":"blog/decorative-vs-hard-chrome/index.html","imgWebp":"assets/img/article-decorative-vs-hard-chrome-v357.webp","imgJpg":"assets/img/article-decorative-vs-hard-chrome-v357.jpg","date":"2026-01-07","titleFa":"کروم تزئینی vs کروم سخت: کجا کدام مناسب است؟","titleEn":"Decorative chrome vs hard chrome: which one to choose","leadFa":"هر دو اسمشان کروم است، اما هدفشان یکی نیست. اگر انتخاب اشتباه کنید، یا هزینه اضافه می‌دهید یا دوام نمی‌گیرید.","leadEn":"Same word, different goals. Pick the wrong one and you either waste budget or lose durability."},{"path":"blog/plating-defects-peeling-blisters/index.html","imgWebp":"assets/img/article-plating-defects-v357.webp","imgJpg":"assets/img/article-plating-defects-v357.jpg","date":"2026-01-07","titleFa":"عیب‌یابی آبکاری: پوسته شدن، تاول و کدرشدن کروم","titleEn":"Plating defect troubleshooting: peeling, blisters, and dull chrome","leadFa":"اگر کروم کدر شد یا آبکاری پوسته داد، قبل از تغییر وان‌ها مسیر تمیزکاری و فعال‌سازی را چک کنید.","leadEn":"If chrome turns dull or peels, check cleaning and activation before changing the entire process."},{"path":"blog/nickel-chrome-on-zamak/index.html","imgWebp":"assets/img/article-nickel-chrome-zamak-v357.webp","imgJpg":"assets/img/article-nickel-chrome-zamak-v357.jpg","date":"2026-01-07","titleFa":"نیکل-کروم روی زاماک: چالش‌ها و مسیر درست آبکاری","titleEn":"Nickel-chrome plating on zamak: challenges and a safer process","leadFa":"زاماک اگر درست آماده نشود، آبکاری را با پوسته شدن و حفره جواب می‌دهد. اینجا مسیر کم‌ریسک‌تر را می‌خوانید.","leadEn":"If zamak is not prepared properly, plating will fail with blisters and pits. Here is a lower-risk workflow."},{"path":"blog/pvd-defects-streaks-pinhole/index.html","imgWebp":"assets/img/article-pvd-defects-v357.webp","imgJpg":"assets/img/article-pvd-defects-v357.jpg","date":"2026-01-07","titleFa":"عیب‌یابی PVD: رگه، لکه و پین‌هول از کجا می‌آید؟","titleEn":"PVD defect troubleshooting: streaks, stains, and pinholes","leadFa":"قبل از اینکه همه‌چیز را گردن دستگاه بیندازید، سه چیز را چک کنید: تمیزی سطح، پولیش، و خروج گاز از قطعه.","leadEn":"Before blaming the machine, check three things: surface cleanliness, polishing, and substrate outgassing."},{"path":"blog/pvd-color-consistency-qc/index.html","imgWebp":"assets/img/article-pvd-color-consistency-v357.webp","imgJpg":"assets/img/article-pvd-color-consistency-v357.jpg","date":"2026-01-07","titleFa":"کنترل کیفیت رنگ PVD: چرا یک رنگ در دو نور متفاوت می‌شود؟","titleEn":"PVD color QC: why the same color shifts under different lighting","leadFa":"اگر مشتری زیر نور فروشگاه یک چیز می‌بیند و در خانه چیز دیگر، احتمالاً مشکل از مدیریت نور و مرجع رنگ است نه صرفاً فرآیند.","leadEn":"If the color looks different in a showroom versus a home, the issue is often lighting control and reference samples, not only the process."},{"path":"blog/pvd-door-handles-luxury-finish/index.html","imgWebp":"assets/img/blog-sample-pvd-v364.webp","imgJpg":"assets/img/blog-sample-pvd-v364.jpg","date":"2026-01-07","titleFa":"PVD برای دستگیره و یراق درب: فینیش لوکس بدون دردسر","titleEn":"PVD for door handles & hardware: a luxury finish that lasts","leadFa":"اگر قرار است هر روز لمس شود، باید هم زیبا باشد هم مقاوم. این مقاله می‌گوید چه فینیشی مناسب‌تر است و چه چیزهایی را قبل از تولید سری چک کنید.","leadEn":"Door hardware is touched every day. Here is how to choose a finish that looks premium and stays that way, plus the checks to run before mass production."},{"path":"blog/traditional-plating-nickel-chrome/index.html","imgWebp":"assets/img/blog-nickel-chrome.webp","imgJpg":"assets/img/blog-nickel-chrome.jpg","date":"2026-01-02","titleFa":"آبکاری سنتی نیکل-کروم: ظاهر، دوام و نکات مقایسه با PVD","titleEn":"Traditional nickel-chrome plating: look, durability, and comparison with PVD","leadFa":"نیکل-کروم هنوز در بسیاری کاربردها محبوب است. این مقاله تفاوت‌های کلیدی آن با PVD را از نظر ظاهر، دوام و شرایط استفاده توضیح می‌دهد.","leadEn":"Nickel-chrome is still widely used. This guide explains key differences vs PVD in look, durability, and use conditions."},{"path":"blog/pvd-on-zinc-galvanized/index.html","imgWebp":"assets/img/blog-pvd-zinc.webp","imgJpg":"assets/img/blog-pvd-zinc.jpg","date":"2026-01-02","titleFa":"PVD روی قطعات روی و گالوانیزه: چالش‌ها و راه‌حل‌های عملی","titleEn":"PVD on zinc & galvanized parts: challenges and practical solutions","leadFa":"قطعات روی/گالوانیزه به‌دلیل واکنش‌پذیری و ریسک آلودگی سطحی، نیاز به آماده‌سازی دقیق دارند تا PVD یکنواخت و بادوام شود.","leadEn":"Zinc/galvanized parts are reactive and contamination-prone, so careful prep is needed for uniform, durable PVD."},{"path":"blog/pvd-on-pp-plastic/index.html","imgWebp":"assets/img/blog-pvd-pp.webp","imgJpg":"assets/img/blog-pvd-pp.jpg","date":"2026-01-02","titleFa":"PVD روی پلاستیک PP: چرا سخت است و چه راه‌حل‌هایی وجود دارد؟","titleEn":"PVD on PP plastic: why it’s hard and workable solutions","leadFa":"PP انرژی سطحی خیلی پایینی دارد؛ برای پوشش‌دهی موفق معمولاً به فعال‌سازی سطح و لایه میانی مهندسی‌شده نیاز است.","leadEn":"PP has very low surface energy; successful coating usually needs surface activation and an engineered intermediate layer."},{"path":"blog/pvd-on-glass-crystal/index.html","imgWebp":"assets/img/article-pvd-glass-crystal-v357.webp","imgJpg":"assets/img/article-pvd-glass-crystal-v357.jpg","date":"2026-01-02","titleFa":"PVD روی شیشه و کریستال: گزینه‌ها، محدودیت‌ها و کاربردهای لوکس","titleEn":"PVD on glass & crystal: options, limits, and luxury use-cases","leadFa":"پوشش‌های PVD روی شیشه/کریستال برای جلوه‌های لوکس، رنگ‌های خاص و مقاومت سطحی استفاده می‌شوند؛ انتخاب روش به هدف (تزئینی/کارکردی) وابسته است.","leadEn":"PVD on glass/crystal is used for luxury aesthetics, special colors, and surface performance; the method depends on decorative vs functional goals."},{"path":"blog/pvd-on-abs-plastic/index.html","imgWebp":"assets/img/article-pvd-abs-v357.webp","imgJpg":"assets/img/article-pvd-abs-v357.jpg","date":"2026-01-02","titleFa":"PVD روی ABS: روش‌ها، چسبندگی، و نکات اجرایی","titleEn":"PVD on ABS: methods, adhesion, and practical notes","leadFa":"پوشش PVD روی ABS ممکن است، اما مسیر اجرا معمولاً به آماده‌سازی سطح و لایه‌های میانی نیاز دارد تا چسبندگی و دوام روی نمونه واقعی ارزیابی شود.","leadEn":"PVD on ABS can be feasible, but the process usually needs surface preparation and intermediate layers so adhesion and durability can be evaluated on a real sample."},{"path":"blog/other-coating-methods-phoretic-anodizing-thermal-spray/index.html","imgWebp":"assets/img/blog-other-methods.webp","imgJpg":"assets/img/blog-other-methods.jpg","date":"2026-01-02","titleFa":"روش‌های دیگر رنگ‌کاری و پوشش‌دهی: فورتیک (الکتروفورتیک)، آنودایز، اسپری حرارتی و…","titleEn":"Other coating methods: e-coat (cataphoresis), anodizing, thermal spray, and more","leadFa":"همه پروژه‌ها PVD نیستند. در این مقاله مسیرهای رایج مثل فورتیک/الکتروفورتیک (E-coat)، آنودایز و اسپری حرارتی را برای انتخاب بهتر مرور می‌کنیم.","leadEn":"Not every project is a PVD job. This guide reviews e-coat, anodizing, thermal spray, and common alternatives."},{"path":"blog/electrostatic-powder-coating-guide/index.html","imgWebp":"assets/img/process.webp","imgJpg":"assets/img/process.jpg","date":"2026-01-02","titleFa":"رنگ الکترواستاتیک (پودری): مزایا، محدودیت‌ها و کاربردها","titleEn":"Electrostatic powder coating: benefits, limits, and applications","leadFa":"رنگ پودری الکترواستاتیک برای مقاومت و پوشش یکنواخت در قطعات فلزی بسیار محبوب است؛ اما برای ظرافت‌های لوکس و رنگ‌های خاص، باید درست انتخاب شود.","leadEn":"Electrostatic powder coating is popular for durable, uniform metal finishes; for luxury aesthetics and special colors, selection matters."},{"path":"blog/electrophoretic-ecoat-phoretic-guide/index.html","imgWebp":"assets/img/blog-ecoat.webp","imgJpg":"assets/img/blog-ecoat.jpg","date":"2026-01-02","titleFa":"فورتیک/الکتروفورتیک (E-coat): ضدزنگ پایه برای قطعات صنعتی","titleEn":"Electrophoretic e-coat: a corrosion-protection base for industrial parts","leadFa":"الکتروفورتیک (که در بازار گاهی «فورتیک» هم گفته می‌شود) یک پوشش‌دهی یکنواخت و ضدخوردگی است که مخصوصاً برای زیرکار صنعتی و تیراژ مناسب است.","leadEn":"Electrophoretic e-coat (often called “fortic” locally) provides uniform corrosion protection and is great for industrial bases and volume production."},{"path":"blog/conductive-vs-insulative-for-pvd/index.html","imgWebp":"assets/img/article-pvd-conductive-insulative-v357.webp","imgJpg":"assets/img/article-pvd-conductive-insulative-v357.jpg","date":"2026-01-02","titleFa":"رسانا یا نارسانا بودن سطح برای PVD: چه مهم است و چطور رسانا کنیم؟","titleEn":"Conductive vs insulative surfaces for PVD: what matters & how to make conductive","leadFa":"بسیاری از پوشش‌های PVD روی سطوح نارسانا هم قابل اعمال‌اند، اما در برخی شرایط برای کنترل بار/بایاس یا یکنواختی، رساناکردن سطح یا فیکسچر اهمیت پیدا می‌کند.","leadEn":"Many PVD coatings can be deposited on insulators, but in some setups conductivity helps with charging, biasing, and uniformity control."},{"path":"blog/anodizing-aluminum-luxury-finish/index.html","imgWebp":"assets/img/blog-anodize.webp","imgJpg":"assets/img/blog-anodize.jpg","date":"2026-01-02","titleFa":"آنودایز آلومینیوم برای ظاهر لوکس: مات، ساتن و رنگ‌های خاص","titleEn":"Aluminum anodizing for luxury finishes: matte, satin, and special colors","leadFa":"آنودایز یکی از روش‌های رایج برای آلومینیوم است و می‌تواند هم حفاظت سطح و هم رنگ‌دهی/فینیش ایجاد کند؛ نتیجه به آلیاژ، آماده‌سازی و فرآیند وابسته است.","leadEn":"Anodizing is a common route for aluminum and can provide both surface protection and color/finish; results depend on alloy, preparation, and process."},{"path":"blog/surface-preparation/index.html","imgWebp":"assets/img/blog-surface-prep.webp","imgJpg":"assets/img/blog-surface-prep.jpg","date":"2026-01-01","titleFa":"آماده‌سازی سطح قبل از پوشش‌دهی (PVD و سرامیک)","titleEn":"Surface Preparation Before Coating (PVD & Ceramic)","leadFa":"بیشتر خطاهای پوشش‌دهی از خودِ پوشش نیست؛ از آماده‌سازی سطح شروع می‌شود. در این مقاله مراحل کلیدی آماده‌سازی برای نتیجه یکنواخت، براق و بادوام را توضیح می‌دهیم.","leadEn":"Most coating defects aren’t caused by the coating itself—they start with poor surface prep. This guide covers the essential steps for a uniform, durable finish."},{"path":"blog/quality-tests/index.html","imgWebp":"assets/img/blog-quality-tests.webp","imgJpg":"assets/img/blog-quality-tests.jpg","date":"2026-01-01","titleFa":"کنترل کیفیت پوشش‌ها: ضخامت، چسبندگی و مقاومت خوردگی","titleEn":"Coating Quality Control: Thickness, Adhesion & Corrosion","leadFa":"در پروژه‌های صنعتی و ساختمانی، کیفیت فقط در ظاهر خلاصه نمی‌شود. کنترل کیفیت کمک می‌کند دوام، یکنواختی و عملکرد پوشش در شرایط کاری واقعی قابل اعتماد باشد.","leadEn":"For industrial and architectural jobs, quality is more than appearance. QC ensures durability and reliable performance in real conditions."},{"path":"blog/pvd-vs-ceramic/index.html","imgWebp":"assets/img/blog-compare.webp","imgJpg":"assets/img/blog-compare.jpg","date":"2026-01-01","titleFa":"مقایسه PVD و سرامیک","titleEn":"PVD vs Ceramic Comparison","leadFa":"در انتخاب بین PVD و سرامیک، سه معیار اصلی را مقایسه کنید: ظاهر و فینیش، مقاومت و شرایط کاری، و هزینه/زمان اجرای پروژه. بهترین انتخاب همان گزینه‌ای است که با کاربری واقعی شما هم‌خوانی دارد.","leadEn":"When choosing PVD vs ceramic, compare three pillars: appearance/finish, durability vs operating conditions, and cost/lead time. The best choice is the one aligned with real use."},{"path":"blog/pvd-quote-guide/index.html","imgWebp":"assets/img/blog-quote-guide.webp","imgJpg":"assets/img/blog-quote-guide.jpg","date":"2026-01-01","titleFa":"راهنمای استعلام قیمت و ثبت سفارش PVD","titleEn":"PVD quote & order guide","leadFa":"چه اطلاعاتی بدهید تا سریع‌تر قیمت دقیق و زمان تحویل دریافت کنید.","leadEn":"What to send to get a faster, accurate quote and lead time."},{"path":"blog/pvd-fingerprint-cleaning/index.html","imgWebp":"assets/img/blog-fingerprint.webp","imgJpg":"assets/img/blog-fingerprint.jpg","date":"2026-01-01","titleFa":"اثر انگشت روی PVD: تمیزکاری بدون خط‌وخش","titleEn":"Fingerprints on PVD: scratch-free cleaning","leadFa":"روش‌های ساده و امن برای حذف لکه و اثر انگشت روی فینیش‌های لوکس.","leadEn":"Simple, safe ways to remove smudges and fingerprints on luxury finishes."},{"path":"blog/pvd-colors/index.html","imgWebp":"assets/img/article-pvd-colors-v357.webp","imgJpg":"assets/img/article-pvd-colors-v357.jpg","date":"2026-01-01","titleFa":"راهنمای رنگ‌ها و فینیش‌های PVD (طلایی، رزگلد، دودی و …)","titleEn":"PVD Colors & Finishes Guide (Gold, Rose Gold, Smoke…)","leadFa":"انتخاب رنگ و فینیش در PVD فقط موضوع زیبایی نیست؛ به جنس قطعه، کاربری (ساختمانی/صنعتی/لوکس) و نحوه نگهداری هم وابسته است. این راهنما کمک می‌کند گزینه مناسب‌تر را انتخاب کنید.","leadEn":"Choosing a PVD finish is not only about looks—it depends on substrate, application, and maintenance. This guide helps you pick the right option."},{"path":"compare/pvd-vs-plating/index.html","imgWebp":"assets/img/article-compare-pvd-plating-v357.webp","imgJpg":"assets/img/article-compare-pvd-plating-v357.jpg","date":"2026-01-07","titleFa":"PVD در برابر آبکاری سنتی (نیکل/کروم)","titleEn":"PVD vs traditional plating (nickel/chrome)","leadFa":"کدام برای ظاهر لوکس، دوام و تیراژ بهتر است؟","leadEn":"Which is better for luxury look, durability, and volume?"},{"path":"compare/pvd-vs-powder/index.html","imgWebp":"assets/img/article-compare-pvd-powder-v357.webp","imgJpg":"assets/img/article-compare-pvd-powder-v357.jpg","date":"2026-01-07","titleFa":"PVD در برابر رنگ پودری الکترواستاتیک","titleEn":"PVD vs electrostatic powder coating","leadFa":"مقایسه کاربرد دکوراتیو و صنعتی + محدودیت‌ها","leadEn":"Decorative vs industrial use + limitations"},{"path":"compare/pvd-vs-anodizing/index.html","imgWebp":"assets/img/article-compare-pvd-anodizing-v357.webp","imgJpg":"assets/img/article-compare-pvd-anodizing-v357.jpg","date":"2026-01-07","titleFa":"PVD در برابر آنودایز آلومینیوم","titleEn":"PVD vs aluminum anodizing","leadFa":"برای آلومینیوم و فینیش مات/لوکس کدام بهتر است؟","leadEn":"Which is better for aluminum and matte/lux finishes?"},{"path":"guides/pvd-coating/index.html","imgWebp":"assets/img/guide-pvd-coating-v357.webp","imgJpg":"assets/img/guide-pvd-coating-v357.jpg","date":"2026-01-07","titleFa":"راهنمای جامع پوشش PVD (لوکس + صنعتی)","titleEn":"Ultimate Guide to PVD Coating (Luxury + Industrial)","leadFa":"اگر می‌خواهید نتیجه نهایی واقعاً لوکس و بادوام باشد، این راهنما مسیر درست را به شما می‌دهد: از آماده‌سازی سطح تا انتخاب رنگ و کنترل کیفیت.","leadEn":"If you want a truly premium and durable result, this guide walks you through the right steps: from surface prep to color selection and quality control."},{"path":"guides/nickel-chrome-plating/index.html","imgWebp":"assets/img/guide-nickel-chrome-v357.webp","imgJpg":"assets/img/guide-nickel-chrome-v357.jpg","date":"2026-01-07","titleFa":"راهنمای جامع آبکاری نیکل کروم","titleEn":"Ultimate Guide to Nickel-Chrome Plating","leadFa":"از ظاهر براق کلاسیک تا جلوگیری از پوسته‌شدن و تاول. این راهنما کمک می‌کند کیفیت آبکاری را درست انتخاب و کنترل کنید.","leadEn":"From classic high gloss to preventing peeling and blisters, this guide helps you choose and control plating quality."},{"path":"guides/polishing/index.html","imgWebp":"assets/img/guide-polishing-v364.webp","imgJpg":"assets/img/guide-polishing-v364.jpg","date":"2026-01-07","titleFa":"راهنمای جامع پرداخت‌کاری و پولیش","titleEn":"Ultimate Guide to Polishing & Surface Finishing","leadFa":"پرداخت‌کاری خوب یعنی پوشش نهایی خوب. این راهنما فرق فینیش‌ها و استاندارد کار تمیز را روشن می‌کند.","leadEn":"Good polishing means a good final coating. This guide clarifies finish options and what “clean work” really means."},{"path":"blog/pvd-color-durability/index.html","imgWebp":"assets/img/blog-color-durability.webp","imgJpg":"assets/img/blog-color-durability.jpg","date":"2026-01-01","titleFa":"دوام رنگ PVD دکوراتیو: طلایی، رزگلد، دودی","titleEn":"Decorative PVD color durability: gold, rose, smoked","leadFa":"چه چیزهایی باعث ماندگاری بهتر رنگ می‌شود و چگونه انتخاب درست انجام دهیم؟","leadEn":"What improves color longevity and how to choose the right finish."},{"path":"blog/pvd-coating/index.html","imgWebp":"assets/img/article-pvd-coating-v357.webp","imgJpg":"assets/img/article-pvd-coating-v357.jpg","date":"2026-01-27","titleFa":"PVD Coating چیست؟","titleEn":"What is PVD Coating?","leadFa":"تعریف ساده، مزایا، کاربردها در صنعت، ساختمان و لوکس‌کاری.","leadEn":"A clear definition, benefits, and applications in industry, architecture, and luxury finishes."},{"path":"blog/architectural-coating/index.html","imgWebp":"assets/img/blog-architectural.webp","imgJpg":"assets/img/blog-architectural.jpg","date":"2026-01-01","titleFa":"پوشش‌دهی یراق‌آلات و قطعات ساختمانی در تهران","titleEn":"Coating Architectural Hardware in Tehran","leadFa":"راهنمای انتخاب پوشش برای دستگیره، اتصالات، پروفیل و قطعات دکوراتیو.","leadEn":"Choosing the right coating for handles, fittings, profiles, and decorative parts."},{"path":"blog/pvd-faucets/index.html","imgWebp":"assets/img/article-pvd-faucets-v357.webp","imgJpg":"assets/img/article-pvd-faucets-v357.jpg","date":"2026-01-01","titleFa":"PVD برای شیرآلات لوکس","titleEn":"PVD for luxury faucets","leadFa":"راهنمای انتخاب جنس، رنگ و فینیش برای دکوراتیو.","leadEn":"How to choose substrate, color, and finish for decorative work."},{"path":"blog/pvd-care/index.html","imgWebp":"assets/img/article-pvd-care-v357.webp","imgJpg":"assets/img/article-pvd-care-v357.jpg","date":"2026-01-01","titleFa":"نگهداری و تمیزکاری PVD","titleEn":"PVD care & cleaning","leadFa":"روش‌های درست تمیزکاری و جلوگیری از کدر شدن.","leadEn":"Proper cleaning methods to avoid dulling and scratches."},{"path":"blog/matte-vs-gloss/index.html","imgWebp":"assets/img/article-matte-vs-gloss-v357.webp","imgJpg":"assets/img/article-matte-vs-gloss-v357.jpg","date":"2026-01-01","titleFa":"مات یا براق؟","titleEn":"Matte or gloss?","leadFa":"تصمیم‌گیری سریع برای پروژه‌های پرتردد و لوکس.","leadEn":"Quick decision guide for luxury & high-touch areas."},{"path":"blog/decor-color-match/index.html","imgWebp":"assets/img/article-decor-color-match-v357.webp","imgJpg":"assets/img/article-decor-color-match-v357.jpg","date":"2026-01-01","titleFa":"هماهنگی رنگ با دکور","titleEn":"Match color to decor","leadFa":"طلایی، رزگلد، دودی، مشکی؛ چه زمانی کدام؟","leadEn":"Gold, rose, smoky, black—when to choose which?"}];

;
/* KAVICO Hub runtime v415: locale-safe routing + progressive-enhancement support. */
/* v381 article data is loaded from articles-data-42873bea12.v381.js */
try{window.KAVIAN_ARTICLES=window.KAVIAN_ARTICLES||[];}catch(_e){}



(function(){
  function norm(p){return String(p||'').replace(/index\.html$/i,'');}
  function rootBase(){
    var r = document.documentElement.getAttribute('data-root') || '';
    return r;
  }
  function join(p){
    if (!p) return '';
    if (/^https?:/i.test(p) || p.startsWith('#')) return p;
    var clean=String(p).replace(/^\/+/, '');
    // Assets always live at the public root, including on English pages.
    if (clean.startsWith('assets/')) return (rootBase() || '../') + clean;
    // Content paths are locale-aware. v391 sent English hub cards to Persian
    // URLs and left guides/ as /hub/guides/...; v415 fixes both cases.
    if (/^(blog|guides|services|compare|tools|contact|portfolio|quality|process|faq|tehran|karaj)\//.test(clean) || /^(contact|portfolio|quality|process|faq|tehran|karaj)$/.test(clean)){
      if (currentLang()==='en') return '/en/' + clean;
      return (rootBase() || '../') + clean;
    }
    return p;
  }
  function deriveTags(p){
    var s=String(p||'').toLowerCase();
    var tags=[];
    var add=function(t){ if(tags.indexOf(t)===-1) tags.push(t); };
    if (s.includes('pvd')) add('pvd');
    if (s.includes('abs') || s.includes('pp') || s.includes('plastic')) add('plastic');
    if (s.includes('glass') || s.includes('crystal')) add('glass');
    if (s.includes('powder') || s.includes('electrostatic') || s.includes('paint')) add('painting');
    if (s.includes('plating') || s.includes('nickel') || s.includes('chrome')) add('plating');
    if (s.includes('polish') || s.includes('polishing')) add('polishing');
    if (s.includes('luxury') || s.includes('decorative')) add('decorative');
    if (s.includes('quality') || s.includes('surface') || s.includes('industrial')) add('industrial');
    if (!tags.length) add('pvd');
    return tags;
  }
  function currentLang(){
    return (document.documentElement.getAttribute('lang')||'fa').toLowerCase().startsWith('en') ? 'en' : 'fa';
  }
  function formatDate(iso){
    if (typeof window.formatISODate==='function') return window.formatISODate(iso, currentLang());
    return iso||'';
  }

  function render(){
    var grid=document.getElementById('hubGrid');
    if(!grid) return;
    var list=window.KAVIAN_ARTICLES;
    if(!Array.isArray(list) || !list.length) return;

    if (!grid.querySelector('.post-card')){
      var items=list.slice().sort(function(a,b){
        var da=(a&&a.date)?String(a.date):'';
        var db=(b&&b.date)?String(b.date):'';
        return db.localeCompare(da);
      });

      var frag=document.createDocumentFragment();
      items.forEach(function(a){
        var card=document.createElement('a');
        card.className='card card-link post-card';
        card.href=join(norm(a.path||a.href||''));
        card.setAttribute('data-tags', deriveTags(a.path||a.href||'').join(' '));
        card.setAttribute('data-date', String(a.date||''));
        card.setAttribute('data-title-fa', a.titleFa||'');
        card.setAttribute('data-title-en', a.titleEn||'');
        card.setAttribute('data-lead-fa', a.leadFa||'');
        card.setAttribute('data-lead-en', a.leadEn||'');

        var media=document.createElement('div');
        media.className='card-media zoom-wrap';
        var pic=document.createElement('picture');
        if (a.imgWebp){
          var s=document.createElement('source');
          s.type='image/webp';
          var webp=join(a.imgWebp);
          s.srcset=webp.replace(/\.webp$/i,'-480w.webp')+' 480w, '+webp.replace(/\.webp$/i,'-768w.webp')+' 768w, '+webp+' 1200w';
          s.sizes='(max-width: 679px) 88vw, (max-width: 1019px) 44vw, 380px';
          pic.appendChild(s);
        }
        var img=document.createElement('img');
        img.loading='lazy';
        img.decoding='async';
        img.setAttribute('fetchpriority','low');
        img.alt=currentLang()==='en'?(a.titleEn||'Article image'):(a.titleFa||'تصویر مقاله');
        img.width=1200; img.height=675;
        img.src=join(a.imgJpg||a.imgWebp||'');
        pic.appendChild(img);
        media.appendChild(pic);

        var body=document.createElement('div');
        body.className='card-body';
        var h3=document.createElement('h3');
        var ts=document.createElement('span');
        ts.textContent=currentLang()==='en'?(a.titleEn||''):(a.titleFa||'');
        h3.appendChild(ts);
        var p=document.createElement('p');
        var ls=document.createElement('span');
        ls.textContent=currentLang()==='en'?(a.leadEn||''):(a.leadFa||'');
        p.appendChild(ls);
        var meta=document.createElement('div');
        meta.className='mini-meta';
        var d=document.createElement('span');
        d.textContent=formatDate(a.date);
        meta.appendChild(d);
        var more=document.createElement('span');
        more.className='link-more';
        more.textContent='→';
        more.setAttribute('aria-hidden','true');
        meta.appendChild(more);

        body.appendChild(h3);
        body.appendChild(p);
        body.appendChild(meta);

        card.appendChild(media);
        card.appendChild(body);
        frag.appendChild(card);
      });
      grid.appendChild(frag);
    }

    // filters
    var chips=[].slice.call(document.querySelectorAll('.hub-filters .chip'));
    var countEl=document.querySelector('[data-hub-count]');
    var emptyEl=document.querySelector('[data-hub-empty]');
    var searchInput=document.getElementById('hubSearch');
    var sortSelect=document.getElementById('hubSort');
    var sortMode=(sortSelect && sortSelect.value)||'new';
    var query='';
    var tag='all';
    var normText=(window.KavicoUtils&&window.KavicoUtils.normalize)?window.KavicoUtils.normalize:function(s){return String(s||'').toLowerCase().trim();};

    try{
      var sp=new URLSearchParams(location.search);
      tag=sp.get('tag') || (location.hash?location.hash.slice(1):'') || 'all';
      tag=String(tag||'all').toLowerCase();
    }catch(e){}
    var allowed=['all','pvd','plastic','glass','painting','plating','polishing','industrial','decorative'];
    if(allowed.indexOf(tag)===-1) tag='all';

    function getCardText(card){
      var lang=currentLang();
      var t=card.getAttribute(lang==='en'?'data-title-en':'data-title-fa')||'';
      var l=card.getAttribute(lang==='en'?'data-lead-en':'data-lead-fa')||'';
      return normText(t+' '+l);
    }
    function updateSortLabels(){
      if(!sortSelect) return;
      var l=currentLang();
      try{
        Array.prototype.slice.call(sortSelect.options).forEach(function(opt){
          var txt=opt.getAttribute(l==='en'?'data-label-en':'data-label-fa');
          if(txt) opt.textContent=txt;
        });
        var lbl=sortSelect.parentElement&&sortSelect.parentElement.querySelector('label');
        if(lbl) lbl.textContent=(l==='en'?'Sort':'مرتب‌سازی');
      }catch(e){}
    }
    function sortCards(){
      if(!sortSelect) return;
      sortMode=sortSelect.value||'new';
      var cards=[].slice.call(grid.querySelectorAll('.post-card'));
      var l=currentLang();
      function tOf(c){return(c.getAttribute(l==='en'?'data-title-en':'data-title-fa')||'').toLowerCase();}
      function dOf(c){return String(c.getAttribute('data-date')||'');}
      cards.sort(function(a,b){
        if(sortMode==='old') return dOf(a).localeCompare(dOf(b));
        if(sortMode==='az') return tOf(a).localeCompare(tOf(b));
        if(sortMode==='za') return tOf(b).localeCompare(tOf(a));
        return dOf(b).localeCompare(dOf(a));
      });
      var frag=document.createDocumentFragment();
      cards.forEach(function(c){frag.appendChild(c);});
      grid.appendChild(frag);
    }
    function apply(activeTag){
      chips.forEach(function(btn){
        var isActive=(btn.getAttribute('data-filter')===activeTag);
        btn.classList.toggle('is-active',isActive);
        btn.setAttribute('aria-pressed',isActive?'true':'false');
      });
      var cards=[].slice.call(grid.querySelectorAll('.post-card'));
      var shown=0;
      cards.forEach(function(card){
        var tags=(card.getAttribute('data-tags')||'').split(/\s+/).filter(Boolean);
        var tagOk=(activeTag==='all')||tags.indexOf(activeTag)!==-1;
        var qOk=!query||getCardText(card).indexOf(query)!==-1;
        var show=tagOk&&qOk;
        card.hidden=!show;
        if(show) shown++;
      });
      if(countEl){
        var l=currentLang();
        var tpl=countEl.getAttribute(l==='en'?'data-en-template':'data-fa-template')||'{n}';
        countEl.textContent=tpl.replace('{n}',String(shown));
      }
      if(emptyEl) emptyEl.hidden=(shown!==0);
    }

    if(searchInput){
      var __deb=(window.KavicoUtils&&window.KavicoUtils.debounce)?window.KavicoUtils.debounce:function(fn,delay){var tt;delay=(typeof delay==='number')?delay:250;return function(){var ctx=this,args=arguments;clearTimeout(tt);tt=setTimeout(function(){fn.apply(ctx,args);},delay);};};
      searchInput.addEventListener('input',__deb(function(){query=normText(this.value||'');apply(tag);},320));
    }
    if(sortSelect){
      sortSelect.addEventListener('change',function(){sortCards();apply(tag);});
    }
    chips.forEach(function(btn){
      btn.addEventListener('click',function(){tag=(btn.getAttribute('data-filter')||'all');apply(tag);});
    });
    try{
      var mo=new MutationObserver(function(){updateSortLabels();if(sortMode==='az'||sortMode==='za')sortCards();apply(tag);});
      mo.observe(document.documentElement,{attributes:true,attributeFilter:['lang','dir']});
    }catch(e){}
    updateSortLabels();
    sortCards();
    apply(tag);
  }

  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded', render);
  else render();
})();

;
/* KAVICO v434 consolidated runtime: v417 + v418 + public form abuse guard. */
;/* KAVICO v417 — lightweight public experience runtime.
   Progressive enhancement only: pages remain fully usable without JavaScript. */
(() => {
  'use strict';
  const body = document.body;
  if (!body || !body.classList.contains('v417-public')) return;

  const isArticle = body.classList.contains('page-article');
  if (isArticle) {
    const updateReadingProgress = () => {
      const doc = document.documentElement;
      const max = Math.max(1, doc.scrollHeight - innerHeight);
      const progress = Math.min(100, Math.max(0, (scrollY / max) * 100));
      doc.style.setProperty('--v417-reading-progress', `${progress.toFixed(2)}%`);
    };
    updateReadingProgress();
    addEventListener('scroll', updateReadingProgress, { passive: true });
    addEventListener('resize', updateReadingProgress, { passive: true });

    const tocLinks = [...document.querySelectorAll('.article-toc a[href^="#"]')];
    const tocMap = new Map();
    for (const link of tocLinks) {
      try {
        const id = decodeURIComponent(link.getAttribute('href').slice(1));
        const target = document.getElementById(id);
        if (target) tocMap.set(target, link);
      } catch (_) {}
    }
    if ('IntersectionObserver' in window && tocMap.size) {
      let current = null;
      const setCurrent = link => {
        if (current === link) return;
        current?.classList.remove('is-current');
        current?.removeAttribute('aria-current');
        current = link || null;
        current?.classList.add('is-current');
        current?.setAttribute('aria-current', 'location');
      };
      const observer = new IntersectionObserver(entries => {
        const visible = entries
          .filter(entry => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length) setCurrent(tocMap.get(visible[0].target));
      }, { rootMargin: '-18% 0px -68% 0px', threshold: [0, 1] });
      tocMap.forEach((_, target) => observer.observe(target));
    }
  }
})();

;/* KAVICO v418 — public shell accessibility/runtime hardening.
   Progressive enhancement only; navigation and content remain usable without JavaScript. */
(() => {
  'use strict';
  const body = document.body;
  const html = document.documentElement;
  if (!body || !body.classList.contains('v418-public')) return;
  const isEn = (html.lang || '').toLowerCase().startsWith('en');

  const header = document.getElementById('header');
  const updateHeaderMetrics = () => {
    if (!header) return;
    html.style.setProperty('--v418-header-h', `${Math.max(56, Math.round(header.getBoundingClientRect().height))}px`);
  };
  if (header) {
    let ticking = false;
    const syncScrolled = () => {
      header.classList.toggle('is-scrolled', window.scrollY > 20);
      ticking = false;
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(syncScrolled);
    };
    syncScrolled();
    updateHeaderMetrics();
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', updateHeaderMetrics, { passive: true });
    if ('ResizeObserver' in window) new ResizeObserver(updateHeaderMetrics).observe(header);
  }

  const normalizePath = value => {
    try {
      const u = new URL(value, location.href);
      if (u.origin !== location.origin) return null;
      let p = u.pathname.replace(/\/index\.html$/i, '/').replace(/\/{2,}/g, '/');
      if (!p.endsWith('/')) p += '/';
      return p;
    } catch (_) { return null; }
  };
  const navMenu = document.getElementById('navMenu');
  if (navMenu) {
    const here = normalizePath(location.href);
    const links = [...navMenu.querySelectorAll('a[href]')].filter(a => !a.classList.contains('v343-nav-brief') && !a.classList.contains('v395-nav-call'));
    let current = null;
    for (const a of links) {
      if (normalizePath(a.href) === here) { current = a; break; }
    }
    links.forEach(a => a.removeAttribute('aria-current'));
    navMenu.querySelectorAll('details[data-current]').forEach(d => d.removeAttribute('data-current'));
    if (current) {
      current.setAttribute('aria-current', 'page');
      const parent = current.closest('details.nav-dd');
      if (parent) parent.setAttribute('data-current', 'true');
    }
  }

  const themeToggle = document.getElementById('themeToggle');
  const themeNames = isEn
    ? { dark: 'Dark', light: 'Light', nebula: 'Nebula' }
    : { dark: 'تاریک', light: 'روشن', nebula: 'نبولا' };
  const syncThemeA11y = () => {
    const theme = ['dark','light','nebula'].includes(html.dataset.theme) ? html.dataset.theme : 'dark';
    html.style.colorScheme = theme === 'light' ? 'light' : 'dark';
    if (!themeToggle) return;
    const label = isEn
      ? `Current theme: ${themeNames[theme]}. Change theme`
      : `تم فعلی: ${themeNames[theme]}؛ تغییر تم`;
    themeToggle.setAttribute('aria-label', label);
    themeToggle.setAttribute('title', label);
  };
  syncThemeA11y();
  if ('MutationObserver' in window) {
    new MutationObserver(records => {
      if (records.some(r => r.attributeName === 'data-theme')) syncThemeA11y();
    }).observe(html, { attributes: true, attributeFilter: ['data-theme'] });
  }
  addEventListener('kavico:theme-changed', syncThemeA11y);

  const langToggle = document.getElementById('langToggle');
  if (langToggle) {
    const label = isEn ? 'Switch language to Persian' : 'تغییر زبان به انگلیسی';
    langToggle.setAttribute('aria-label', label);
    langToggle.setAttribute('title', label);
  }
  const scrollTop = document.getElementById('scrollTop');
  if (scrollTop && !scrollTop.getAttribute('title')) {
    scrollTop.setAttribute('title', isEn ? 'Back to top' : 'بازگشت به بالا');
  }

  // Make in-page targets keyboard-focusable only when navigated to, without changing normal tab order.
  addEventListener('hashchange', () => {
    const id = decodeURIComponent(location.hash.slice(1));
    if (!id) return;
    const target = document.getElementById(id);
    if (!target) return;
    if (!target.matches('a,button,input,select,textarea,[tabindex]')) target.setAttribute('tabindex', '-1');
    try { target.focus({ preventScroll: true }); } catch (_) {}
  });
})();



;/* KAVICO v434 — public form abuse guard.
   Advisory client scoring + accidental double-submit protection only.
   Server-side replay/dedup remains authoritative in the private ingestion bridge. */
(() => {
  'use strict';
  const ready = fn => document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', fn, { once: true }) : fn();
  const setField = (form, name, value) => { const el=form.elements[name]; if(el) el.value=String(value ?? ''); };
  const value = (form, name) => { const el=form.elements[name]; return el ? String(el.value || '').trim() : ''; };
  const nonce = () => {
    try {
      if (crypto?.randomUUID) return crypto.randomUUID();
      const a=new Uint8Array(16); crypto.getRandomValues(a); return [...a].map(x=>x.toString(16).padStart(2,'0')).join('');
    } catch (_) { return `weak-${Date.now()}-${Math.random().toString(16).slice(2)}`; }
  };
  const score = (form, elapsed) => {
    const signals=[];
    const details=value(form,'details');
    const name=value(form,'name');
    const phone=value(form,'phone').replace(/\D/g,'');
    if (value(form,'company')) signals.push(['honeypot',100]);
    if (elapsed < 1500) signals.push(['very-fast',35]);
    else if (elapsed < 3500) signals.push(['fast',15]);
    const urls=(details.match(/(?:https?:\/\/|www\.)/gi)||[]).length;
    if (urls >= 2) signals.push(['multi-url',25]);
    if (/(.)\1{7,}/u.test(details)) signals.push(['repeated-chars',15]);
    if (/(?:https?:\/\/|www\.)/i.test(name)) signals.push(['url-in-name',25]);
    if (/^(\d)\1{6,}$/.test(phone)) signals.push(['repeated-phone',20]);
    return { total: Math.min(100, signals.reduce((n,x)=>n+x[1],0)), names: signals.map(x=>x[0]) };
  };
  ready(() => {
    const form=document.querySelector('form[name="project-brief"]');
    if(!form) return;
    const status=document.getElementById('v343-form-status');
    const submit=form.querySelector('button[type="submit"]');
    const isEn=(document.documentElement.lang||'').toLowerCase().startsWith('en');
    const started=Date.now();
    let submitting=false;
    setField(form,'form_guard_version','v434');
    setField(form,'form_rendered_at',new Date(started).toISOString());
    setField(form,'form_nonce',nonce());
    const update=()=>{
      const elapsed=Math.max(0,Date.now()-started);
      const s=score(form,elapsed);
      setField(form,'form_elapsed_ms',String(elapsed));
      setField(form,'abuse_score',String(s.total));
      setField(form,'abuse_signals',s.names.join(','));
      return {elapsed,s};
    };
    form.addEventListener('input',update,{passive:true});
    form.addEventListener('change',update,{passive:true});
    form.addEventListener('submit',ev=>{
      const state=update();
      if(value(form,'company')){
        ev.preventDefault();
        if(status) status.textContent=isEn?'This submission could not be accepted.':'این ارسال قابل پذیرش نیست.';
        return;
      }
      if(submitting){
        ev.preventDefault();
        if(status) status.textContent=isEn?'This request is already being sent.':'این درخواست در حال ارسال است.';
        return;
      }
      submitting=true;
      form.dataset.v434Submitting='true';
      if(submit){
        submit.disabled=true;
        submit.setAttribute('aria-disabled','true');
        submit.dataset.v434OriginalText=submit.textContent||'';
        submit.textContent=isEn?'Sending…':'در حال ارسال…';
      }
      // Expose only non-PII abuse metadata to the form payload.
      setField(form,'form_elapsed_ms',String(state.elapsed));
    });
    addEventListener('pageshow',ev=>{
      if(!ev.persisted) return;
      submitting=false;
      delete form.dataset.v434Submitting;
      if(submit){
        submit.disabled=false;
        submit.removeAttribute('aria-disabled');
        if(submit.dataset.v434OriginalText) submit.textContent=submit.dataset.v434OriginalText;
      }
      setField(form,'form_rendered_at',new Date().toISOString());
      setField(form,'form_nonce',nonce());
    });
    update();
  });
})();
