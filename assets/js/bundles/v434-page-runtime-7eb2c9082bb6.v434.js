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
/* Kavico v345 — lazy map embed, only bundled on pages with #map. */
(function(){'use strict';
  function start(){var el=document.getElementById('map');if(!el||el.dataset.mapInit==='1')return;el.dataset.mapInit='1';var lat=(el.dataset.lat||'35.692132').trim(),lng=(el.dataset.lng||'50.997906').trim();var iframe=document.createElement('iframe');iframe.title=document.documentElement.lang==='en'?'Kavico workshop map':'نقشه کارگاه کاویان';iframe.loading='lazy';iframe.referrerPolicy='no-referrer-when-downgrade';iframe.className='kavico-map-iframe';iframe.allowFullscreen=true;iframe.src='https://www.google.com/maps?q='+encodeURIComponent(lat+','+lng)+'&output=embed';el.replaceChildren(iframe);el.classList.add('map-embed-ready');}
  function init(){var el=document.getElementById('map');if(!el)return;if('IntersectionObserver'in window){var io=new IntersectionObserver(function(es){if(es.some(function(e){return e.isIntersecting;})){io.disconnect();start();}},{rootMargin:'300px 0px',threshold:.01});io.observe(el);}else setTimeout(start,700);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();


/* Kavico v352 — service + part-aware brief with non-blocking guidance and non-PII routing. */
(function(){'use strict';
  function ready(fn){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',fn,{once:true});else fn();}
  function lng(){return document.documentElement.lang==='en'?'en':'fa';}
  var labels={fa:{low:'برای بررسی دقیق‌تر، چند مشخصه دیگر اضافه کنید.',mid:'برای بررسی اولیه اطلاعات خوبی دارید.',high:'Brief شما برای ارجاع فنی کامل است.',need:'تکمیل پیشنهادی: '},en:{low:'Add a few more project details for a sharper review.',mid:'You have enough detail for an initial review.',high:'Your brief is well prepared for technical routing.',need:'Recommended next: '}};
  var fieldNames={fa:{material:'جنس قطعه',dimensions:'ابعاد',quantity:'تیراژ',finish:'فینیش هدف',city:'شهر',service:'خدمت مشخص'},en:{material:'material',dimensions:'dimensions',quantity:'quantity',finish:'target finish',city:'city',service:'specific service'}};
  var profiles={
    unsure:{focus:'substrate+use+surface+target',copy:{fa:'اگر هنوز خدمت را نمی‌دانید، جنس قطعه، کاربرد، وضعیت سطح و نتیجه مورد انتظار را بنویسید.',en:'If you are unsure about the service, provide part material, use case, surface condition and the result you need.'},prompts:{fa:['جنس و کاربرد واقعی قطعه','وضعیت فعلی سطح یا پوشش قبلی','نتیجه‌ای که باید در پایان پذیرفته شود'],en:['Actual part material and use case','Current surface or previous coating','The result that must be accepted at the end']},placeholder:{fa:'کاربرد قطعه، جنس و وضعیت سطح فعلی، نتیجه مورد انتظار و هر محدودیت مهم را بنویسید.',en:'Describe part use, material/current surface, target outcome and any important constraint.'}},
    'pvd-industrial':{focus:'substrate+service-condition+masking+acceptance',copy:{fa:'برای PVD صنعتی: جنس/آلیاژ دقیق، شرایط کار، ناحیه‌های ماسک یا تلرانسی و معیار عملکرد یا آزمون مهم‌اند.',en:'For industrial PVD: exact substrate/alloy, service conditions, masked/tolerance areas and the important performance/test criterion matter most.'},prompts:{fa:['آلیاژ/زیرکار و شرایط کارکرد','نواحی ماسک، تلرانس یا تماس مکانیکی','معیار آزمون یا پذیرش عملکردی'],en:['Alloy/substrate and service conditions','Masked, tolerance or mechanical-contact areas','Performance test or acceptance criterion']},placeholder:{fa:'آلیاژ، شرایط کار، نواحی ماسک/تلرانس و معیار آزمون یا پذیرش را توضیح دهید.',en:'Describe alloy, service conditions, masked/tolerance areas and the test or acceptance criterion.'}},
    'pvd-decorative':{focus:'substrate+finish-reference+visible-surface+batch',copy:{fa:'برای PVD تزئینی: جنس و زیرسازی، نمونه مرجع رنگ/فینیش، سطح قابل‌دید و تیراژ را مشخص کنید.',en:'For decorative PVD: substrate/preparation, finish reference, visible surfaces and batch size are the key inputs.'},prompts:{fa:['مرجع رنگ/فینیش و سطح قابل‌دید','زیرکار و وضعیت پولیش/پوشش قبلی','تیراژ و میزان حساسیت به اختلاف رنگ'],en:['Color/finish reference and visible surface','Substrate and polishing/previous coating state','Batch size and sensitivity to color variation']},placeholder:{fa:'مرجع رنگ/فینیش، سطح قابل‌دید، وضعیت زیرسازی و حساسیت به اختلاف رنگ را بنویسید.',en:'Describe finish reference, visible surface, substrate preparation and sensitivity to color variation.'}},
    'pvd-faucets':{focus:'base-metal+sealing+finish-reference+cleaner',copy:{fa:'برای شیرآلات و یراق: فلز پایه و پوشش قبلی، رزوه/سطوح آب‌بندی، مرجع فینیش و شرایط شوینده/رطوبت مهم‌اند.',en:'For faucets and hardware: base metal/previous coating, threads/sealing areas, finish reference and cleaner/moisture exposure matter.'},prompts:{fa:['فلز پایه و پوشش قبلی','رزوه، آب‌بندی و نواحی غیرقابل پوشش','مرجع فینیش و شرایط رطوبت/شوینده'],en:['Base metal and previous coating','Threads, sealing and no-coat areas','Finish reference and moisture/cleaner exposure']},placeholder:{fa:'فلز پایه، پوشش قبلی، رزوه/آب‌بندی، مرجع فینیش و شرایط رطوبت یا شوینده را توضیح دهید.',en:'Describe base metal, previous coating, threads/sealing, finish reference and moisture/cleaner exposure.'}},
    'nickel-chrome':{focus:'base-metal+corrosion+previous-plating+surface-target',copy:{fa:'برای نیکل‌کروم: فلز پایه، خوردگی یا آبکاری قبلی، کیفیت سطح هدف و ابعاد/هندسه قطعه را مشخص کنید.',en:'For nickel-chrome: base metal, corrosion/previous plating, target surface quality and part geometry/dimensions are useful.'},prompts:{fa:['فلز پایه، خوردگی یا لایه قبلی','کیفیت سطح و براقیت هدف','هندسه، حفره‌ها و نقاط حساس'],en:['Base metal, corrosion or prior layer','Target surface quality and gloss','Geometry, recesses and sensitive areas']},placeholder:{fa:'فلز پایه، خوردگی/آبکاری قبلی، براقیت هدف و نقاط هندسی حساس را توضیح دهید.',en:'Describe base metal, corrosion/prior plating, target gloss and geometry-sensitive areas.'}},
    polishing:{focus:'material+defect-depth+target-finish+sensitive-edge',copy:{fa:'برای پولیش: جنس، عمق و محل عیب، فینیش هدف، لبه‌ها/نوشته‌های حساس و محدودیت برداشت ماده مهم‌اند.',en:'For polishing: material, defect depth/location, target finish, sensitive edges/markings and material-removal limits matter.'},prompts:{fa:['جنس و عمق/محل عیب سطح','فینیش هدف: آینه‌ای، ساتن یا آماده‌سازی','لبه، نوشته یا تلرانس حساس به برداشت ماده'],en:['Material and defect depth/location','Target finish: mirror, satin or preparation','Edges, markings or tolerances sensitive to material removal']},placeholder:{fa:'جنس، محل و عمق عیب، فینیش هدف و هر لبه/تلرانس حساس به برداشت ماده را بنویسید.',en:'Describe material, defect location/depth, target finish and any edge/tolerance sensitive to material removal.'}}
  };
  var priorityFields={
    unsure:['material','surface_state','project_priority'],
    'pvd-industrial':['material','surface_state','project_priority','dimensions'],
    'pvd-decorative':['material','finish','quantity','surface_state'],
    'pvd-faucets':['material','finish','surface_state','dimensions'],
    'nickel-chrome':['material','surface_state','finish','dimensions'],
    polishing:['material','surface_state','finish','dimensions']
  };
  function fieldWrap(form,name){var el=form.elements[name];return el&&el.closest?el.closest('.field'):null;}
  var routeLabels={fa:{'service-discovery':'تشخیص خدمت مناسب','repeat-production':'بررسی تکرار تولید','sample-validation':'نمونه‌سازی و اعتبارسنجی','production-quote':'بررسی استعلام تولید','engineering-review':'بررسی مهندسی','technical-feasibility':'امکان‌سنجی فنی'},en:{'service-discovery':'Service discovery','repeat-production':'Repeat-production review','sample-validation':'Sample validation','production-quote':'Production quotation review','engineering-review':'Engineering review','technical-feasibility':'Technical feasibility'}};
  ready(function(){
    var form=document.querySelector('form[name="project-brief"]');if(!form)return;var service=form.elements.service,details=form.elements.details,params;try{params=new URLSearchParams(location.search||'');}catch(_e){params=null;}var requested=params?(params.get('service')||''):'';if(service&&requested&&profiles[requested])service.value=requested;
    function hidden(name,val){var el=form.querySelector('input[name="'+name+'"]');if(el)el.value=String(val||'').slice(0,240);}var src=params?(params.get('src')||''):'';var ref='',refSafe='';try{ref=document.referrer||'';}catch(_e){}if(ref){try{var ru=new URL(ref,location.href);refSafe=(ru.origin===location.origin?ru.pathname:ru.origin);if(!src)src=(ru.origin===location.origin?ru.pathname:'external-referrer');}catch(_e){refSafe='referrer';if(!src)src='referrer';}}if(!src)src='direct';hidden('source_path',src+(requested?'?service='+encodeURIComponent(requested):''));hidden('origin_url',refSafe);hidden('origin_label',src);if(params){hidden('utm_source',params.get('utm_source')||'');hidden('utm_medium',params.get('utm_medium')||'');hidden('utm_campaign',params.get('utm_campaign')||'');}
    var meter=document.getElementById('v345-brief-meter'),bar=document.getElementById('v345-brief-bar'),status=document.getElementById('v345-brief-quality'),missing=document.getElementById('v345-brief-missing'),scoreInput=form.elements.brief_score,qualityInput=form.elements.brief_quality,routeInput=form.elements.lead_route,focusInput=form.elements.review_focus;
    var ctxBox=form.querySelector('[data-v348-service-context]'),ctxTitle=form.querySelector('[data-v348-context-title]'),ctxCopy=form.querySelector('[data-v348-context-copy]'),promptList=form.querySelector('[data-v349-prompt-list]'),routePreview=form.querySelector('[data-v349-route-preview]'),partType=form.elements.part_type,partBox=form.querySelector('[data-v351-part-context]'),partCopy=form.querySelector('[data-v351-part-copy]');
    var partHelp={unknown:{fa:'اگر هندسه مشخص نیست، عکس از چند زاویه و ابعاد کلی قطعه معمولاً برای شروع کافی است.',en:'If geometry is unclear, photos from several angles plus overall dimensions are usually enough to start.'},flat:{fa:'طول، عرض، ضخامت و سطوح هدف پوشش/پرداخت را مشخص کنید.',en:'Provide length, width, thickness and the target coated/finished faces.'},cylindrical:{fa:'قطر، طول، سطح داخلی/خارجی و نواحی رزوه یا آب‌بندی را مشخص کنید.',en:'Provide diameter, length, inside/outside target surface and any threads or sealing areas.'},'faucet-hardware':{fa:'نقاط مونتاژ، رزوه، آب‌بندی، ناحیه بدون پوشش و وضعیت پوشش قبلی مهم‌اند.',en:'Assembly points, threads, sealing/no-coat areas and previous coating state matter.'},complex:{fa:'عکس چندزاویه، حفره/شیار، نواحی سایه‌دار و نقاط حساس فیکسچر یا ماسک‌کاری را اضافه کنید.',en:'Add multi-angle photos, recesses/slots, shadowed areas and fixture/masking-sensitive points.'},ceramic:{fa:'نوع لعاب، وضعیت سطح، سطح قابل‌دید و کاربرد نهایی باید پیش از نمونه‌سازی بررسی شود.',en:'Glaze type, surface state, visible area and end use should be reviewed before sampling.'},other:{fa:'ابعاد کلی، جنس، کاربرد و عکس چندزاویه را اضافه کنید.',en:'Add overall dimensions, material, use case and multi-angle photos.'}};
    var partPriority={flat:['dimensions'],cylindrical:['dimensions','material'],'faucet-hardware':['surface_state','finish','dimensions'],complex:['dimensions','surface_state'],ceramic:['material','surface_state','finish'],other:['dimensions','material'],unknown:[]};
    var weighted=[['material',15],['dimensions',10],['quantity',15],['finish',15],['city',5],['service',10],['part_type',5],['surface_state',10],['project_priority',10],['timeline',5]];
    function has(name){var el=form.elements[name];if(!el)return false;var v=String(el.value||'').trim();if(name==='service')return v&&v!=='unsure';if(name==='surface_state')return v&&v!=='unknown';if(name==='timeline')return v&&v!=='flexible';if(name==='part_type')return v&&v!=='unknown';return!!v;}
    function route(){var svc=String((service&&service.value)||'unsure'),stage=String((form.elements.project_stage&&form.elements.project_stage.value)||''),priority=String((form.elements.project_priority&&form.elements.project_priority.value)||'');if(svc==='unsure')return'service-discovery';if(stage==='repeat')return'repeat-production';if(stage==='prototype')return'sample-validation';if(stage==='quote')return'production-quote';if(priority==='wear'||priority==='corrosion')return'engineering-review';return'technical-feasibility';}
    function updateProfile(){var key=String((service&&service.value)||'unsure'),p=profiles[key]||profiles.unsure,la=lng();if(focusInput)focusInput.value=p.focus;if(ctxTitle)ctxTitle.textContent=service&&service.selectedIndex>=0?String(service.options[service.selectedIndex].textContent||'').trim():'';if(ctxCopy){ctxCopy.textContent=p.copy[la];}if(ctxBox)ctxBox.dataset.profile=key;if(promptList){var lis=promptList.querySelectorAll('li');p.prompts[la].forEach(function(t,i){if(lis[i])lis[i].textContent=t;});}form.querySelectorAll('.v350-priority-badge,.v351-geometry-badge').forEach(function(b){b.remove();});form.querySelectorAll('.field[data-v350-priority],.field[data-v351-geometry-priority]').forEach(function(w){delete w.dataset.v350Priority;delete w.dataset.v351GeometryPriority;});(priorityFields[key]||priorityFields.unsure).forEach(function(name){var w=fieldWrap(form,name),el=form.elements[name];if(!w||!el)return;w.dataset.v350Priority='true';var lab=w.querySelector('label');if(lab){var badge=document.createElement('span');badge.className='v350-priority-badge';badge.textContent=la==='en'?'Helpful for this service':'مهم برای این خدمت';lab.appendChild(badge);}});var pt=String((partType&&partType.value)||'unknown'),ph=partHelp[pt]||partHelp.unknown;if(partCopy)partCopy.textContent=ph[la];if(partBox)partBox.dataset.partType=pt;(partPriority[pt]||[]).forEach(function(name){var w=fieldWrap(form,name),el=form.elements[name];if(!w||!el)return;w.dataset.v351GeometryPriority='true';var lab=w.querySelector('label');if(lab&&!lab.querySelector('.v351-geometry-badge')){var badge=document.createElement('span');badge.className='v351-geometry-badge';badge.textContent=la==='en'?'Helpful for this geometry':'مهم برای این هندسه';lab.appendChild(badge);}});if(focusInput)focusInput.value=p.focus+'+part:'+pt;if(details)details.placeholder=p.placeholder[la];}
    function update(){var score=0,miss=[];weighted.forEach(function(x){if(has(x[0]))score+=x[1];else if(fieldNames[lng()][x[0]])miss.push(fieldNames[lng()][x[0]]);});var q=score>=75?'high':score>=45?'mid':'low',r=route();if(scoreInput)scoreInput.value=String(score);if(qualityInput)qualityInput.value=q;if(routeInput)routeInput.value=r;if(meter){meter.setAttribute('aria-valuenow',String(score));meter.dataset.quality=q;}if(bar)bar.value=score;if(status)status.textContent=labels[lng()][q];if(missing)missing.textContent=miss.length?labels[lng()].need+miss.slice(0,3).join(lng()==='fa'?'، ':', '):'';if(routePreview)routePreview.textContent=routeLabels[lng()][r]||r;updateProfile();}
    form.addEventListener('input',update);form.addEventListener('change',update);window.addEventListener('kavico:langchange',update);window.addEventListener('kavico:lang-changed',update);
    form.addEventListener('submit',function(){update();try{function selectedCode(name){var el=form.elements[name];return el?String(el.value||'').trim():'';}var ctx={service:selectedCode('service'),part:selectedCode('part_type'),stage:selectedCode('project_stage'),quality:String((qualityInput&&qualityInput.value)||''),score:String((scoreInput&&scoreInput.value)||''),route:String((routeInput&&routeInput.value)||route()),source:String((form.elements.source_path&&form.elements.source_path.value)||''),readiness:String((form.elements.lead_readiness&&form.elements.lead_readiness.value)||''),followupPriority:String((form.elements.followup_priority&&form.elements.followup_priority.value)||''),followupLane:String((form.elements.followup_lane&&form.elements.followup_lane.value)||''),qualificationBasis:String((form.elements.qualification_basis&&form.elements.qualification_basis.value)||'')};var extra=window.KAVICO_V371_BRIEF_CONTEXT;if(extra&&typeof extra==='object'){Object.keys(extra).forEach(function(k){ctx[k]=extra[k];});}sessionStorage.setItem('kavico:lastBriefContext',JSON.stringify(ctx));}catch(_e){}});update();
  });
})();


/* v352: preferred response-method validity. Email becomes required only when the user explicitly asks for an email reply. */
(function(){'use strict';
  function ready(fn){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',fn,{once:true});else fn();}
  function isEn(){return (document.documentElement.lang||'fa').toLowerCase().indexOf('en')===0;}
  ready(function(){
    var form=document.querySelector('form[name="project-brief"]'); if(!form)return;
    var pref=form.elements.preferred_contact, email=form.elements.email, help=document.getElementById('brief_email_help');
    if(!pref||!email)return;
    function sync(){
      var need=String(pref.value||'')==='email';
      email.required=need;
      if(need) email.setAttribute('aria-required','true'); else email.removeAttribute('aria-required');
      if(help){
        help.textContent=need?(isEn()?'Because “Email” is selected as the response method, enter a valid email address.':'چون روش پاسخ «ایمیل» انتخاب شده، یک ایمیل معتبر وارد کنید.'):(isEn()?'Email is optional. If you choose “Email” as the response method, this field becomes required.':'ایمیل اختیاری است؛ اگر روش پاسخ «ایمیل» را انتخاب کنید، همین فیلد لازم می‌شود.');
      }
      if(!need && email.validity && email.validity.valueMissing) email.removeAttribute('aria-invalid');
    }
    pref.addEventListener('change',sync); window.addEventListener('kavico:langchange',sync); window.addEventListener('kavico:lang-changed',sync); sync();
  });
})();



/* Kavico v371 — source-aware prefill, low-information soft gate, and non-PII follow-up context. */
(function(){'use strict';
  function ready(fn){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',fn,{once:true});else fn();}
  function isEn(){return (document.documentElement.lang||'fa').toLowerCase().indexOf('en')===0;}
  function cleanSource(v){return String(v||'').trim().toLowerCase().replace(/^en-/,'').slice(0,120);}
  function sourceGroup(src){src=cleanSource(src);if(src.indexOf('thanks-')===0)return'followup';if(src.indexOf('services-')===0)return'service';if(src.indexOf('blog-')===0)return'article';if(src.indexOf('guides-')===0||src==='guide'||src==='guides')return'guide';if(src.indexOf('compare-')===0||src==='compare')return'compare';if(src.indexOf('tools-pricing')===0)return'pricing';if(src.indexOf('portfolio')===0)return'portfolio';if(src.indexOf('tehran')>=0||src.indexOf('karaj')>=0)return'local';return'general';}
  function inferService(src){src=cleanSource(src);var rules=[
    ['pvd-industrial',/(services-pvd-coating|guides-pvd-coating|blog-pvd-coating$|blog-pvd-on-zinc|blog-conductive-vs-insulative|blog-pvd-defects)/],
    ['pvd-decorative',/(services-decorative-pvd|blog-pvd-colors|blog-decor-color-match|blog-matte-vs-gloss|blog-pvd-care|blog-fingerprint|blog-pvd-color-consistency|blog-pvd-color-durability)/],
    ['pvd-faucets',/(services-pvd-faucets|blog-pvd-faucets)/],
    ['nickel-chrome',/(services-nickel-chrome-plating|guides-nickel-chrome-plating|blog-traditional-plating-nickel-chrome|blog-plating-defects-peeling-blisters)/],
    ['polishing',/(services-polishing|guides-polishing|blog-polishing-before-pvd|blog-mirror-vs-satin-polish|blog-polishing-brass-parts)/]
  ];for(var i=0;i<rules.length;i++)if(rules[i][1].test(src))return rules[i][0];return'';}
  var groupLabels={fa:{followup:'پیگیری Brief قبلی',service:'صفحه خدمت',article:'مقاله فنی',guide:'راهنمای فنی',compare:'صفحه مقایسه',pricing:'برآورد اولیه',portfolio:'نمونه‌کار',local:'صفحه خدمات منطقه‌ای',general:'صفحه قبلی'},en:{followup:'previous brief follow-up',service:'service page',article:'technical article',guide:'technical guide',compare:'comparison page',pricing:'initial estimate',portfolio:'portfolio',local:'local service page',general:'previous page'}};
  var gapLabels={fa:{material:'جنس قطعه',dimensions:'ابعاد تقریبی',quantity:'تیراژ',finish:'فینیش هدف',surface_state:'وضعیت فعلی سطح',part_type:'نوع/هندسه قطعه',project_priority:'اولویت اصلی',details:'شرح روشن‌تر پروژه'},en:{material:'part material',dimensions:'approximate dimensions',quantity:'batch size',finish:'target finish',surface_state:'current surface state',part_type:'part geometry',project_priority:'main priority',details:'a clearer project description'}};
  ready(function(){
    var form=document.querySelector('form[name="project-brief"]');if(!form)return;var params;try{params=new URLSearchParams(location.search||'');}catch(_e){params=null;}
    var service=form.elements.service,stage=form.elements.project_stage,details=form.elements.details,src=cleanSource(params?(params.get('src')||''):'');var explicit=String(params?(params.get('service')||''):'').trim(),stageParam=String(params?(params.get('stage')||''):'').trim(), inferred=!explicit?inferService(src):'';var prefilled=!!(explicit&&service&&String(service.value||'')===explicit);
    if(service&&!explicit&&inferred&&String(service.value||'unsure')==='unsure'){service.value=inferred;prefilled=true;service.dispatchEvent(new Event('change',{bubbles:true}));}
    if(stage&&String(stage.value||'')===''&&/^(evaluation|prototype|quote|repeat)$/.test(stageParam)){stage.value=stageParam;prefilled=true;stage.dispatchEvent(new Event('change',{bubbles:true}));}
    else if(stage&&String(stage.value||'')===''&&((params&&params.get('from')==='pricing')||sourceGroup(src)==='pricing')){stage.value='quote';prefilled=true;stage.dispatchEvent(new Event('change',{bubbles:true}));}
    var origin=document.querySelector('[data-v371-origin-context]'),originCopy=document.querySelector('[data-v371-origin-copy]');
    function renderOrigin(){if(!origin||!src){if(origin)origin.hidden=true;return;}var en=isEn(),g=sourceGroup(src),lab=(groupLabels[en?'en':'fa']||groupLabels.fa)[g]||src;origin.hidden=false;if(originCopy)originCopy.textContent=en?('This brief was opened from a '+lab+'. Relevant fields may be preselected, and you can change every selection before sending.'):('این Brief از '+lab+' باز شده است. بعضی انتخاب‌های مرتبط ممکن است از قبل تنظیم شوند و همه آن‌ها قبل از ارسال قابل تغییرند.');}
    renderOrigin();window.addEventListener('kavico:langchange',renderOrigin);window.addEventListener('kavico:lang-changed',renderOrigin);
    function hidden396(name,val){var el=form.elements[name];if(el)el.value=String(val||'').slice(0,120);}hidden396('source_group',sourceGroup(src));hidden396('source_prefilled',prefilled?'1':'0');hidden396('conversion_locale',isEn()?'en':'fa');
    if(details){details.minLength=20;details.setAttribute('aria-describedby',((details.getAttribute('aria-describedby')||'')+' v371-details-help').trim());}
    var gate=document.getElementById('v371-submit-gate'),gateCopy=document.getElementById('v371-submit-gate-copy'),completeBtn=gate&&gate.querySelector('[data-v371-complete]'),sendBtn=gate&&gate.querySelector('[data-v371-send-anyway]'),submitBtn=form.querySelector('button[type="submit"]');var allowLow=false;
    function meaningful(name){var el=form.elements[name];if(!el)return false;var v=String(el.value||'').trim();if(name==='surface_state'||name==='part_type')return v&&v!=='unknown';return!!v;}
    function gapCodes(){var a=[];['material','dimensions','quantity','finish','surface_state','part_type','project_priority'].forEach(function(n){if(!meaningful(n))a.push(n);});if(!details||String(details.value||'').trim().length<40)a.push('details');return a;}
    function factCount(){var c=0;['material','dimensions','quantity','finish','surface_state','part_type','project_priority'].forEach(function(n){if(meaningful(n))c++;});if(details&&String(details.value||'').trim().length>=40)c++;return c;}
    function quality(){var s=parseInt(String((form.elements.brief_score&&form.elements.brief_score.value)||'0'),10)||0,c=factCount();return c>=5&&s>=65?'high':c>=2&&s>=25?'mid':'low';}
    function firstGap(){var gs=gapCodes();for(var i=0;i<gs.length;i++){var el=gs[i]==='details'?details:form.elements[gs[i]];if(el)return el;}return details||service;}
    function extraContext(){return{v:'371',gaps:gapCodes().slice(0,5),facts:String(factCount()),quality371:quality(),sourceGroup:sourceGroup(src),prefilled:prefilled?'1':'0',preferred:String((form.elements.preferred_contact&&form.elements.preferred_contact.value)||'').slice(0,24)};}
    function syncContext(){window.KAVICO_V371_BRIEF_CONTEXT=extraContext();}
    function renderGate(){if(!gateCopy)return;var gs=gapCodes(),names=gapLabels[isEn()?'en':'fa'],top=gs.slice(0,3).map(function(x){return names[x]||x;});gateCopy.textContent=isEn()?('The brief is still light on project facts. Adding '+top.join(', ')+' can reduce follow-up. You can complete those fields now or send the current information for an initial review.'):('Brief هنوز اطلاعات فنی کمی دارد. افزودن '+top.join('، ')+' معمولاً رفت‌وبرگشت بررسی را کمتر می‌کند. می‌توانید همین حالا تکمیل کنید یا اطلاعات فعلی را برای بررسی اولیه بفرستید.');}
    function validateDetails(){if(!details)return true;var n=String(details.value||'').trim().length,txt=n>=20?'':(isEn()?'Please add at least 20 characters describing the part, project goal, or current surface.':'حداقل ۲۰ کاراکتر درباره قطعه، هدف پروژه یا وضعیت فعلی سطح بنویسید.');details.setCustomValidity(txt);return!txt;}
    form.addEventListener('input',function(){allowLow=false;if(gate)gate.hidden=true;validateDetails();syncContext();});form.addEventListener('change',function(){allowLow=false;if(gate)gate.hidden=true;syncContext();});
    if(completeBtn)completeBtn.addEventListener('click',function(){if(gate)gate.hidden=true;var el=firstGap();if(el){try{el.scrollIntoView({behavior:'smooth',block:'center'});}catch(_e){}setTimeout(function(){try{el.focus({preventScroll:true});}catch(_e){}},220);}});
    if(sendBtn)sendBtn.addEventListener('click',function(){allowLow=true;if(gate)gate.hidden=true;syncContext();if(form.requestSubmit)form.requestSubmit(submitBtn);else submitBtn.click();});
    form.addEventListener('submit',function(ev){validateDetails();syncContext();if(!details.checkValidity())return;var low=quality()==='low';if(low&&!allowLow){ev.preventDefault();ev.stopImmediatePropagation();renderGate();if(gate){gate.hidden=false;try{gate.scrollIntoView({behavior:'smooth',block:'center'});}catch(_e){}gate.focus&&gate.focus();}return;}},true);
    syncContext();
  });
})();


/* KAVICO v395 — essential brief progress. Non-blocking: mirrors only the four existing required fields. */
(function(){'use strict';
  function ready(fn){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',fn,{once:true});else fn();}
  function en(){return (document.documentElement.lang||'fa').toLowerCase().indexOf('en')===0;}
  ready(function(){
    var form=document.querySelector('form[name="project-brief"]');if(!form)return;form.setAttribute('data-brief-version','395');
    var names=['name','phone','project_stage','details'];var labels=en()?['Name','Phone','Project stage','Project details']:['نام','شماره تماس','مرحله پروژه','توضیحات پروژه'];
    var minNote=form.querySelector('.v370-minimum-note');if(!minNote)return;
    var box=document.createElement('div');box.className='v395-essential-progress';box.setAttribute('data-v395-essential-progress','');
    box.innerHTML='<div class="v395-essential-progress__head"><span>'+(en()?'Essential details':'اطلاعات ضروری')+'</span><strong data-v395-progress-text aria-live="polite"></strong></div><progress max="4" value="0" aria-label="'+(en()?'Essential project brief completion':'تکمیل اطلاعات ضروری پروژه')+'"></progress><div class="v395-essential-progress__items"></div><div class="v395-essential-progress__foot"><p class="v395-essential-progress__status" data-v395-progress-status></p><button class="btn btn-ghost btn-sm v395-essential-progress__next" type="button" data-v395-next-required></button></div>';
    minNote.insertAdjacentElement('afterend',box);
    var items=box.querySelector('.v395-essential-progress__items');names.forEach(function(n,i){var sp=document.createElement('span');sp.className='v395-essential-progress__item';sp.setAttribute('data-v395-field',n);sp.textContent=labels[i];items.appendChild(sp);var el=form.elements[n];if(el)el.setAttribute('data-v395-essential','1');});
    var progress=box.querySelector('progress'),text=box.querySelector('[data-v395-progress-text]'),status=box.querySelector('[data-v395-progress-status]'),next=box.querySelector('[data-v395-next-required]');
    function ok(name){var el=form.elements[name];if(!el)return false;var v=String(el.value||'').trim();if(name==='details')return v.length>=20;if(name==='phone')return v.length>=7;if(name==='name')return v.length>=2;if(name==='project_stage')return !!v;return el.checkValidity?el.checkValidity():!!v;}
    function sync(){var done=0,first=null;names.forEach(function(n){var yes=ok(n);if(yes)done++;else if(!first)first=form.elements[n];var chip=box.querySelector('[data-v395-field="'+n+'"]');if(chip)chip.classList.toggle('is-complete',yes);});progress.value=done;text.textContent=en()?(done+' of 4 ready'):(done+' از ۴ تکمیل');var all=done===4;status.textContent=all?(en()?'Minimum information is ready. Optional details can still improve the technical review.':'حداقل اطلاعات آماده است؛ فیلدهای اختیاری می‌توانند بررسی فنی را دقیق‌تر کنند.'):(en()?'Complete the required items first; optional fields can be added afterwards.':'ابتدا موارد ضروری را کامل کنید؛ جزئیات تکمیلی را می‌توانید بعد از آن اضافه کنید.');next.disabled=all;next.textContent=all?(en()?'Essential details ready':'اطلاعات ضروری کامل است'):(en()?'Go to next required item':'ادامه با مورد ضروری بعدی');next.dataset.target=first&&first.name?first.name:'';}
    next.addEventListener('click',function(){var n=next.dataset.target,el=n&&form.elements[n];if(!el)return;try{el.scrollIntoView({behavior:'smooth',block:'center'});}catch(_e){el.scrollIntoView();}setTimeout(function(){try{el.focus({preventScroll:true});}catch(_e){el.focus();}},260);});
    form.addEventListener('input',sync);form.addEventListener('change',sync);sync();
  });
})();


/* KAVICO v396 — source-aware channel handoff. No PII is written to the URL or session context. */
(function(){'use strict';
  function ready(fn){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',fn,{once:true});else fn();}
  function en(){return (document.documentElement.lang||'fa').toLowerCase().indexOf('en')===0;}
  function clean(v){return String(v||'').trim().toLowerCase().replace(/^en-/,'').slice(0,120);}
  function group(src){src=clean(src);if(src.indexOf('thanks-')===0)return'followup';if(src.indexOf('services-')===0)return'service';if(src.indexOf('blog-')===0)return'article';if(src.indexOf('guides-')===0)return'guide';if(src.indexOf('compare')===0)return'compare';if(src.indexOf('portfolio')===0)return'portfolio';if(src.indexOf('tehran')>=0||src.indexOf('karaj')>=0)return'local';return'general';}
  var faService={unsure:'نیاز به راهنمایی','pvd-industrial':'PVD صنعتی','pvd-decorative':'PVD تزئینی / لوکس','pvd-faucets':'PVD شیرآلات و یراق','nickel-chrome':'آبکاری نیکل‌کروم',polishing:'پولیش و پرداخت سطح'};
  var enService={unsure:'service guidance','pvd-industrial':'industrial PVD','pvd-decorative':'decorative PVD','pvd-faucets':'PVD for faucets / hardware','nickel-chrome':'nickel-chrome plating',polishing:'polishing / surface finishing'};
  var faStage={evaluation:'امکان‌سنجی',prototype:'نمونه‌سازی / نمونه رنگ',quote:'استعلام تولید',repeat:'تیراژ تکراری'};
  var enStage={evaluation:'feasibility review',prototype:'sample / finish validation',quote:'production quotation',repeat:'repeat production'};
  var faGroup={followup:'پیگیری Brief قبلی',service:'صفحه خدمت',article:'مقاله فنی',guide:'راهنمای فنی',compare:'مقایسه',portfolio:'نمونه‌کار',local:'صفحه منطقه‌ای',general:'وب‌سایت'};
  var enGroup={followup:'a previous brief follow-up',service:'a service page',article:'a technical article',guide:'a technical guide',compare:'a comparison page',portfolio:'the portfolio',local:'a local service page',general:'the website'};
  ready(function(){var form=document.querySelector('form[name="project-brief"]');if(!form)return;var params;try{params=new URLSearchParams(location.search||'');}catch(_e){params=null;}var src=clean(params?(params.get('src')||''):'');
    function label(map,val,fallback){return map[val]||fallback||val||'';}
    function sync(){var service=String((form.elements.service&&form.elements.service.value)||'unsure'),stage=String((form.elements.project_stage&&form.elements.project_stage.value)||''),g=group(src),isEn=en();var msg;if(isEn){msg='Hello, I would like to send project photos/details for '+label(enService,service,'technical review')+'.';if(stage)msg+=' Project stage: '+label(enStage,stage,stage)+'.';msg+=' I opened the brief from '+label(enGroup,g,'the website')+'.';}else{msg='سلام، می‌خواهم عکس و مشخصات پروژه برای '+label(faService,service,'بررسی فنی')+' را ارسال کنم.';if(stage)msg+=' مرحله پروژه: '+label(faStage,stage,stage)+'.';msg+=' مسیر ورود: '+label(faGroup,g,'وب‌سایت')+'.';}var href='https://wa.me/989125460799?text='+encodeURIComponent(msg);form.querySelectorAll('a.v370-form-whatsapp,a[data-v370-channel="whatsapp"]').forEach(function(a){a.href=href;});}
    form.addEventListener('change',sync);sync();
  });
})();


/* KAVICO v396 — mobile Quick Brief. Optional technical fields collapse only with JS; desktop and no-JS remain fully visible. */
(function(){'use strict';
  function ready(fn){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',fn,{once:true});else fn();}
  function en(){return (document.documentElement.lang||'fa').toLowerCase().indexOf('en')===0;}
  ready(function(){var form=document.querySelector('form[name="project-brief"]');if(!form)return;var names=['material','dimensions','part_type','quantity','city','surface_state','project_priority','timeline','finish'];var marked=[];
    names.forEach(function(n){var el=form.elements[n];if(!el)return;var wrap=el.closest('.field');if(wrap){wrap.classList.add('v396-optional-detail');marked.push(wrap);}});
    ['.v349-brief-guidance','.v350-brief-priority-help','.v351-part-context'].forEach(function(sel){var el=form.querySelector(sel);if(el){el.classList.add('v396-optional-detail');marked.push(el);}});
    if(!marked.length)return;var anchor=form.querySelector('[data-v395-essential-progress]')||form.querySelector('.v370-minimum-note');if(!anchor)return;var row=document.createElement('div');row.className='v396-quick-brief';row.innerHTML='<button class="btn btn-ghost btn-sm v396-optional-toggle" type="button" aria-expanded="false"><span data-v396-toggle-label></span><small></small></button><p></p>';anchor.insertAdjacentElement('afterend',row);var btn=row.querySelector('button'),lab=row.querySelector('[data-v396-toggle-label]'),small=row.querySelector('small'),note=row.querySelector('p');var expanded=false;
    function copy(){lab.textContent=expanded?(en()?'Hide optional technical details':'پنهان‌کردن جزئیات فنی اختیاری'):(en()?'Add optional technical details':'افزودن جزئیات فنی اختیاری');small.textContent=en()?'9 optional fields':'۹ فیلد اختیاری';note.textContent=en()?'The four essential fields remain visible. Expand this section when material, dimensions, batch size or finish details are available.':'چهار مورد ضروری همیشه دیده می‌شوند. اگر جنس، ابعاد، تیراژ یا فینیش را می‌دانید این بخش را باز کنید.';}
    function set(v){expanded=!!v;form.classList.toggle('v396-optional-expanded',expanded);form.classList.toggle('v396-optional-collapsed',!expanded);btn.setAttribute('aria-expanded',expanded?'true':'false');copy();}
    btn.addEventListener('click',function(){set(!expanded);if(expanded){var first=form.querySelector('.v396-optional-detail input,.v396-optional-detail select,.v396-optional-detail textarea');if(first)setTimeout(function(){try{first.focus({preventScroll:true});}catch(_e){}},80);}});
    var complete=form.querySelector('[data-v371-complete]');if(complete)complete.addEventListener('click',function(){set(true);},true);
    form.addEventListener('invalid',function(ev){if(ev.target&&ev.target.closest&&ev.target.closest('.v396-optional-detail'))set(true);},true);
    set(false);window.addEventListener('kavico:langchange',copy);window.addEventListener('kavico:lang-changed',copy);
  });
})();

/* KAVICO v397 — project-only lead qualification metadata for future CRM/admin routing. No personal fields affect the score. */
(function(){'use strict';
  function ready(fn){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',fn,{once:true});else fn();}
  function val(form,name){var el=form.elements[name];return el?String(el.value||'').trim():'';}
  function set(form,name,value){var el=form.elements[name];if(el)el.value=String(value||'').slice(0,80);}
  ready(function(){
    var form=document.querySelector('form[name="project-brief"]');if(!form)return;
    function qualify(){
      var projectWeights=[['material',15],['dimensions',10],['quantity',15],['finish',15],['service',10],['part_type',5],['surface_state',10],['project_priority',10],['timeline',5],['details',5]],score=0;
      function projectHas(name){var v=val(form,name);if(name==='service')return!!v&&v!=='unsure';if(name==='surface_state')return!!v&&v!=='unknown';if(name==='timeline')return!!v&&v!=='flexible';if(name==='part_type')return!!v&&v!=='unknown';return!!v;}
      projectWeights.forEach(function(x){if(projectHas(x[0]))score+=x[1];});
      var service=val(form,'service'),stage=val(form,'project_stage'),timeline=val(form,'timeline'),risk=val(form,'project_priority'),route=val(form,'lead_route');
      var readiness=(score>=75&&service&&service!=='unsure'&&stage)?'ready':((score>=45&&stage)?'reviewable':'discovery');
      var q=score;
      if(stage==='repeat')q+=25;else if(stage==='quote')q+=20;else if(stage==='prototype')q+=10;
      if(timeline==='under-2w')q+=15;else if(timeline==='2-4w')q+=8;
      if(risk==='wear'||risk==='corrosion')q+=5;
      if(!service||service==='unsure')q-=10;
      var priority=q>=105?'p1':q>=75?'p2':'p3';
      var lane={'service-discovery':'discovery','repeat-production':'repeat-production','sample-validation':'sample-validation','production-quote':'production-quote','engineering-review':'engineering-review','technical-feasibility':'technical-feasibility'}[route]||'technical-review';
      set(form,'lead_readiness',readiness);set(form,'followup_priority',priority);set(form,'followup_lane',lane);set(form,'qualification_basis','project-context-v398');set(form,'qualification_score',String(Math.max(0,q)));
      return {readiness:readiness,followupPriority:priority,followupLane:lane,qualificationBasis:'project-context-v398',qualificationScore:String(Math.max(0,q))};
    }
    form.addEventListener('input',qualify);form.addEventListener('change',qualify);
    form.addEventListener('submit',function(){var meta=qualify();try{var ctx=JSON.parse(sessionStorage.getItem('kavico:lastBriefContext')||'null');if(ctx&&typeof ctx==='object'){Object.keys(meta).forEach(function(k){ctx[k]=meta[k];});sessionStorage.setItem('kavico:lastBriefContext',JSON.stringify(ctx));}}catch(_e){}});
    qualify();
  });
})();



/* KAVICO v398 — versioned non-PII conversion event contract for Netlify/CRM/analytics adapters. */
(function(){'use strict';
  function ready(fn){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',fn,{once:true});else fn();}
  function val(form,name){var el=form.elements[name];return el?String(el.value||'').trim():'';}
  function set(form,name,value,max){var el=form.elements[name];if(el)el.value=String(value==null?'':value).slice(0,max||2000);}
  function uuid(){try{if(window.crypto&&typeof window.crypto.randomUUID==='function')return window.crypto.randomUUID();}catch(_e){}var a=[];for(var i=0;i<32;i++)a.push(Math.floor(Math.random()*16).toString(16));return a.slice(0,8).join('')+'-'+a.slice(8,12).join('')+'-4'+a.slice(13,16).join('')+'-a'+a.slice(17,20).join('')+'-'+a.slice(20,32).join('');}
  function makeRef(){var x=uuid().replace(/[^a-f0-9]/gi,'').toUpperCase().slice(0,12).padEnd(12,'0');return 'KVC-'+x.slice(0,4)+'-'+x.slice(4,8)+'-'+x.slice(8,12);}
  function validRef(v){return /^KVC-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/.test(String(v||''));}
  function safeEnum(v,allowed,fallback){v=String(v||'');return allowed.indexOf(v)>=0?v:fallback;}
  ready(function(){
    var form=document.querySelector('form[name="project-brief"]');if(!form)return;
    var CONTRACT='kavico.lead-conversion.v1',SCHEMA='/assets/contracts/lead-conversion.v1.schema.json';
    var params;try{params=new URLSearchParams(location.search||'');}catch(_e){params=null;}
    var ref=params?String(params.get('ref')||''):'';var src=params?String(params.get('src')||''):'';
    if(!(src.indexOf('thanks-followup')===0&&validRef(ref)))ref='';
    if(!ref){try{var r=JSON.parse(sessionStorage.getItem('kavico:lastBriefReceipt')||'null');if(src.indexOf('thanks-followup')===0&&r&&validRef(r.leadReference))ref=r.leadReference;}catch(_e){}}
    if(!ref)ref=makeRef();
    set(form,'event_contract_version',CONTRACT,80);set(form,'event_schema',SCHEMA,160);set(form,'event_name','project_brief_submitted',80);set(form,'lead_reference',ref,40);
    function buildEvent(){
      var id='evt_'+uuid(),occurred=new Date().toISOString();
      var payload={
        contract_version:CONTRACT,event_name:'project_brief_submitted',event_id:id,lead_reference:ref,occurred_at:occurred,
        locale:safeEnum(val(form,'conversion_locale'),['fa','en'],document.documentElement.lang&&document.documentElement.lang.toLowerCase().indexOf('en')===0?'en':'fa'),
        service:safeEnum(val(form,'service'),['unsure','pvd-industrial','pvd-decorative','pvd-faucets','nickel-chrome','polishing'],'unsure'),
        stage:safeEnum(val(form,'project_stage'),['evaluation','prototype','quote','repeat'],'evaluation'),
        route:safeEnum(val(form,'lead_route'),['service-discovery','repeat-production','sample-validation','production-quote','engineering-review','technical-feasibility'],'service-discovery'),
        readiness:safeEnum(val(form,'lead_readiness'),['ready','reviewable','discovery'],'discovery'),
        priority:safeEnum(val(form,'followup_priority'),['p1','p2','p3'],'p3'),
        lane:safeEnum(val(form,'followup_lane'),['discovery','repeat-production','sample-validation','production-quote','engineering-review','technical-feasibility','technical-review'],'technical-review'),
        qualification_basis:String(val(form,'qualification_basis')||'project-context-v398').slice(0,48),
        qualification_score:Math.max(0,Math.min(200,parseInt(val(form,'qualification_score')||'0',10)||0)),
        source_group:safeEnum(val(form,'source_group'),['followup','service','article','guide','compare','pricing','portfolio','local','general'],'general'),
        source_prefilled:val(form,'source_prefilled')==='1',preferred_response:safeEnum(val(form,'preferred_contact'),['phone','whatsapp','email'],'phone')
      };
      set(form,'event_id',id,80);set(form,'event_occurred_at',occurred,40);set(form,'conversion_event',JSON.stringify(payload),2000);
      try{var ctx=JSON.parse(sessionStorage.getItem('kavico:lastBriefContext')||'null');if(!ctx||typeof ctx!=='object')ctx={};ctx.leadReference=ref;ctx.eventId=id;ctx.contractVersion=CONTRACT;ctx.eventName=payload.event_name;ctx.eventOccurredAt=occurred;ctx.qualificationScore=String(payload.qualification_score);sessionStorage.setItem('kavico:lastBriefContext',JSON.stringify(ctx));}catch(_e){}
      try{window.dispatchEvent(new CustomEvent('kavico:conversion',{detail:payload}));}catch(_e){}
      return payload;
    }
    window.KAVICO_LEAD_CONTRACT={version:CONTRACT,schema:SCHEMA,leadReference:ref,buildEvent:buildEvent};
    form.addEventListener('submit',buildEvent);
  });
})();


/* KAVICO v399 — non-PII CRM/admin export mapping. Public site emits only the initial submitted/queued state. */
(function(){'use strict';
  function ready(fn){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',fn,{once:true});else fn();}
  function val(form,name){var el=form.elements[name];return el?String(el.value||'').trim():'';}
  function set(form,name,value,max){var el=form.elements[name];if(el)el.value=String(value==null?'':value).slice(0,max||2400);}
  function safe(v,allowed,fallback){v=String(v||'');return allowed.indexOf(v)>=0?v:fallback;}
  ready(function(){
    var form=document.querySelector('form[name="project-brief"]');if(!form)return;
    var CONTRACT='kavico.lead-admin-export.v1',SCHEMA='/assets/contracts/lead-admin-export.v1.schema.json',MAPPING='kavico.lead-lifecycle.v1';
    set(form,'admin_contract_version',CONTRACT,80);set(form,'admin_export_schema',SCHEMA,160);set(form,'lifecycle_mapping_version',MAPPING,80);set(form,'lifecycle_status','submitted',32);set(form,'followup_state','queued',32);
    function derive(base){
      base=base&&typeof base==='object'?base:{};
      var lane=safe(base.lane||val(form,'followup_lane'),['discovery','repeat-production','sample-validation','production-quote','engineering-review','technical-feasibility','technical-review'],'technical-review');
      var priority=safe(base.priority||val(form,'followup_priority'),['p1','p2','p3'],'p3');
      var readiness=safe(base.readiness||val(form,'lead_readiness'),['ready','reviewable','discovery'],'discovery');
      var queue={'discovery':'lead-discovery','repeat-production':'repeat-production','sample-validation':'sample-validation','production-quote':'commercial-estimation','engineering-review':'technical-engineering','technical-feasibility':'technical-engineering','technical-review':'technical-engineering'}[lane]||'technical-engineering';
      var sla={'p1':'priority-review','p2':'standard-review','p3':'discovery-review'}[priority]||'discovery-review';
      var action=readiness==='discovery'?'request-project-context':({'repeat-production':'review-repeat-production','sample-validation':'review-sample-requirements','production-quote':'prepare-commercial-review','engineering-review':'review-technical-feasibility','technical-feasibility':'review-technical-feasibility','technical-review':'review-technical-feasibility','discovery':'triage-brief'}[lane]||'triage-brief');
      return {lane:lane,priority:priority,readiness:readiness,assignmentQueue:queue,slaPolicyKey:sla,nextAction:action};
    }
    function build(base){
      var d=derive(base),score=parseInt(base&&base.qualification_score!=null?base.qualification_score:val(form,'qualification_score')||'0',10)||0;
      var payload={
        contract_version:CONTRACT,event_name:'lead_submitted',source_contract_version:'kavico.lead-conversion.v1',mapping_version:MAPPING,
        event_id:String((base&&base.event_id)||val(form,'event_id')||'').slice(0,80),lead_reference:String((base&&base.lead_reference)||val(form,'lead_reference')||'').slice(0,40),occurred_at:String((base&&base.occurred_at)||val(form,'event_occurred_at')||new Date().toISOString()).slice(0,40),
        lifecycle_status:'submitted',followup_state:'queued',assignment_queue:d.assignmentQueue,sla_policy_key:d.slaPolicyKey,next_action:d.nextAction,
        readiness:d.readiness,priority:d.priority,lane:d.lane,
        route:safe((base&&base.route)||val(form,'lead_route'),['service-discovery','repeat-production','sample-validation','production-quote','engineering-review','technical-feasibility'],'service-discovery'),
        service:safe((base&&base.service)||val(form,'service'),['unsure','pvd-industrial','pvd-decorative','pvd-faucets','nickel-chrome','polishing'],'unsure'),
        stage:safe((base&&base.stage)||val(form,'project_stage'),['evaluation','prototype','quote','repeat'],'evaluation'),
        qualification_score:Math.max(0,Math.min(200,score)),
        source_group:safe((base&&base.source_group)||val(form,'source_group'),['followup','service','article','guide','compare','pricing','portfolio','local','general'],'general'),
        preferred_response:safe((base&&base.preferred_response)||val(form,'preferred_contact'),['phone','whatsapp','email'],'phone'),
        export_basis:'lead-conversion-v1+project-context-v398+admin-routing-v399'
      };
      set(form,'lifecycle_status',payload.lifecycle_status,32);set(form,'followup_state',payload.followup_state,32);set(form,'assignment_queue',payload.assignment_queue,48);set(form,'sla_policy_key',payload.sla_policy_key,48);set(form,'next_action',payload.next_action,64);set(form,'admin_export',JSON.stringify(payload),2400);
      try{var ctx=JSON.parse(sessionStorage.getItem('kavico:lastBriefContext')||'null');if(!ctx||typeof ctx!=='object')ctx={};ctx.adminContractVersion=CONTRACT;ctx.adminMappingVersion=MAPPING;ctx.lifecycleStatus=payload.lifecycle_status;ctx.followupState=payload.followup_state;ctx.assignmentQueue=payload.assignment_queue;ctx.slaPolicyKey=payload.sla_policy_key;ctx.nextAction=payload.next_action;sessionStorage.setItem('kavico:lastBriefContext',JSON.stringify(ctx));}catch(_e){}
      try{window.dispatchEvent(new CustomEvent('kavico:lead-admin-export',{detail:payload}));}catch(_e){}
      return payload;
    }
    window.KAVICO_ADMIN_EXPORT={version:CONTRACT,schema:SCHEMA,mapping:MAPPING,build:build};
    window.addEventListener('kavico:conversion',function(ev){build(ev&&ev.detail);});
    form.addEventListener('submit',function(){if(!val(form,'admin_export')){var base=null;try{base=JSON.parse(val(form,'conversion_event')||'null');}catch(_e){}build(base);}});
  });
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
