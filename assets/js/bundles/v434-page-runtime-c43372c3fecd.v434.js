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
/* v343 compact home article dataset */
window.KAVIAN_ARTICLES=[{"path":"blog/polishing-brass-parts/index.html","imgWebp":"assets/img/blog-sample-polishing.webp","imgJpg":"assets/img/blog-sample-polishing.jpg","date":"2026-01-07","titleFa":"پرداخت‌کاری قطعات برنجی: نکات مهم برای خروجی لوکس","titleEn":"Polishing brass parts: practical tips for a premium finish","leadFa":"برنج با یک پرداخت خوب واقعاً لوکس می‌شود. با یک پرداخت بد، همان‌قدر سریع افت می‌کند.","leadEn":"Brass looks truly premium with good polishing. With poor polishing, it degrades just as fast."},{"path":"blog/mirror-vs-satin-polish/index.html","imgWebp":"assets/img/article-mirror-vs-satin-v357.webp","imgJpg":"assets/img/article-mirror-vs-satin-v357.jpg","date":"2026-01-07","titleFa":"پولیش آینه‌ای vs ساتن: کدام برای پروژه لوکس بهتر است؟","titleEn":"Mirror vs satin polish: which is better for luxury projects?","leadFa":"اگر نور محیط سخت است یا تماس زیاد دارید، ساتن معمولاً انتخاب منطقی‌تری است. اما بعضی پروژه‌ها آینه‌ای می‌خواهند.","leadEn":"If lighting is harsh or the part is high-touch, satin is often safer. But some projects truly need a mirror look."},{"path":"blog/polishing-before-pvd/index.html","imgWebp":"assets/img/article-polishing-before-pvd-v357.webp","imgJpg":"assets/img/article-polishing-before-pvd-v357.jpg","date":"2026-01-07","titleFa":"پرداخت‌کاری قبل از PVD: چرا نصف کیفیت کار همینجاست؟","titleEn":"Polishing before PVD: why half the quality is decided here","leadFa":"اگر پولیش بد باشد، بهترین پوشش هم معجزه نمی‌کند. برای فینیش لوکس، زیرکار پادشاه است.","leadEn":"If polishing is poor, even the best coating will not save it. For a premium finish, the substrate is king."},{"path":"blog/decorative-vs-hard-chrome/index.html","imgWebp":"assets/img/article-decorative-vs-hard-chrome-v357.webp","imgJpg":"assets/img/article-decorative-vs-hard-chrome-v357.jpg","date":"2026-01-07","titleFa":"کروم تزئینی vs کروم سخت: کجا کدام مناسب است؟","titleEn":"Decorative chrome vs hard chrome: which one to choose","leadFa":"هر دو اسمشان کروم است، اما هدفشان یکی نیست. اگر انتخاب اشتباه کنید، یا هزینه اضافه می‌دهید یا دوام نمی‌گیرید.","leadEn":"Same word, different goals. Pick the wrong one and you either waste budget or lose durability."},{"path":"blog/plating-defects-peeling-blisters/index.html","imgWebp":"assets/img/article-plating-defects-v357.webp","imgJpg":"assets/img/article-plating-defects-v357.jpg","date":"2026-01-07","titleFa":"عیب‌یابی آبکاری: پوسته شدن، تاول و کدرشدن کروم","titleEn":"Plating defect troubleshooting: peeling, blisters, and dull chrome","leadFa":"اگر کروم کدر شد یا آبکاری پوسته داد، قبل از تغییر وان‌ها مسیر تمیزکاری و فعال‌سازی را چک کنید.","leadEn":"If chrome turns dull or peels, check cleaning and activation before changing the entire process."},{"path":"blog/nickel-chrome-on-zamak/index.html","imgWebp":"assets/img/article-nickel-chrome-zamak-v357.webp","imgJpg":"assets/img/article-nickel-chrome-zamak-v357.jpg","date":"2026-01-07","titleFa":"نیکل-کروم روی زاماک: چالش‌ها و مسیر درست آبکاری","titleEn":"Nickel-chrome plating on zamak: challenges and a safer process","leadFa":"زاماک اگر درست آماده نشود، آبکاری را با پوسته شدن و حفره جواب می‌دهد. اینجا مسیر کم‌ریسک‌تر را می‌خوانید.","leadEn":"If zamak is not prepared properly, plating will fail with blisters and pits. Here is a lower-risk workflow."},{"path":"blog/pvd-defects-streaks-pinhole/index.html","imgWebp":"assets/img/article-pvd-defects-v357.webp","imgJpg":"assets/img/article-pvd-defects-v357.jpg","date":"2026-01-07","titleFa":"عیب‌یابی PVD: رگه، لکه و پین‌هول از کجا می‌آید؟","titleEn":"PVD defect troubleshooting: streaks, stains, and pinholes","leadFa":"قبل از اینکه همه‌چیز را گردن دستگاه بیندازید، سه چیز را چک کنید: تمیزی سطح، پولیش، و خروج گاز از قطعه.","leadEn":"Before blaming the machine, check three things: surface cleanliness, polishing, and substrate outgassing."},{"path":"blog/pvd-color-consistency-qc/index.html","imgWebp":"assets/img/article-pvd-color-consistency-v357.webp","imgJpg":"assets/img/article-pvd-color-consistency-v357.jpg","date":"2026-01-07","titleFa":"کنترل کیفیت رنگ PVD: چرا یک رنگ در دو نور متفاوت می‌شود؟","titleEn":"PVD color QC: why the same color shifts under different lighting","leadFa":"اگر مشتری زیر نور فروشگاه یک چیز می‌بیند و در خانه چیز دیگر، احتمالاً مشکل از مدیریت نور و مرجع رنگ است نه صرفاً فرآیند.","leadEn":"If the color looks different in a showroom versus a home, the issue is often lighting control and reference samples, not only the process."}];


/* Kavico v341 — homepage-only features extracted from app.features.js */
// === v64: Page features chunk (loaded only where needed) ===
// --- Homepage: latest articles carousel ---
(function(){
  // Fallback: ensure kavicoJoin exists even if core bundle failed to load
  window.kavicoJoin = window.kavicoJoin || function(p){
    try{
      const dr = document.documentElement.getAttribute('data-root') || './';
      const root = new URL(dr, location.href).toString();
      return new URL(String(p||''), root).toString();
    }catch(e){
      return String(p||'');
    }
	  };
	  var kavicoJoin = window.kavicoJoin;
	  function safeLocalPath(p){
	    return (window.KavicoUtils && window.KavicoUtils.safeLocalPath) ? window.KavicoUtils.safeLocalPath(p, '#') : String(p||'').replace(/index\.html$/i,'');
	  }
	  function safeAssetPath(p){
	    var s = safeLocalPath(p);
	    if (s === '#') return '';
	    /* Asset paths in the article data are root-relative-without-slash
	       ("assets/img/x.webp"). On /en/ they resolved against /en/ and 404'd
	       (image gaps in the English slider); join against data-root instead. */
	    try{ if (!/^(?:\/|[a-z][a-z0-9+.-]*:)/i.test(s)) s = kavicoJoin(s); }catch(_e){}
	    return s;
	  }
	  function escHTML(s){
	    return (window.KavicoUtils && window.KavicoUtils.escapeHTML) ? window.KavicoUtils.escapeHTML(s) : String(s||'').replace(/[&<>"'`]/g, function(ch){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','`':'&#96;'})[ch] || ch; });
	  }


  // ---- Price estimator moved to assets/js/pricing-page.js (v62) ----
// ---- Removed in v62: Knowledge hub filters (handled by hub-page.js) ----
// --- Homepage: render latest articles (carousel) ---
(function(){
  function normalizePath(p){
    if (!p) return '#';
	    return safeLocalPath(p);
  }

  // Only run on pages that have the track
  var trackEl = document.getElementById('latestArticlesGrid');
  if (!trackEl) return;

  function currentLang(){
    var lang = (document.documentElement.getAttribute('lang') || 'fa').toLowerCase();
    return (lang.indexOf('en') === 0) ? 'en' : 'fa';
  }

  function pickText(item, kind, lang){
    try{
      if (!item) return '';
      if (kind === 'title') return (lang === 'en' ? (item.titleEn || '') : (item.titleFa || ''));
      if (kind === 'lead')  return (lang === 'en' ? (item.leadEn  || '') : (item.leadFa  || ''));
      return '';
    }catch(_e){ return ''; }
  }

  function buildDots(dotsEl, count){
    if (!dotsEl) return [];
    dotsEl.innerHTML = '';
    var btns = [];
    for (var i=0;i<count;i++){
      var b = document.createElement('button');
      b.className = 'articlesDot' + (i===0 ? ' is-active' : '');
      b.type = 'button';
      b.setAttribute('data-slide', String(i));
      b.setAttribute('role','tab');
      b.setAttribute('aria-current', i===0 ? 'true' : 'false');
      b.setAttribute('tabindex', i===0 ? '0' : '-1');
      // a11y label is updated after i18n runs; keep a safe default
      b.setAttribute('aria-label', (currentLang()==='en' ? ('Slide ' + (i+1)) : ('اسلاید ' + (i+1))));
      dotsEl.appendChild(b);
      btns.push(b);
    }
    return btns;
  }

  function initCarousel(){
    var wrap = document.querySelector('.articlesCarousel[data-carousel="latestArticles"]');
    if (!wrap) return;

    // If this carousel is re-initialized (e.g., on language change), clean up old timers/listeners first
    try{
      if (wrap.__latestArticlesCleanup) wrap.__latestArticlesCleanup();
    }catch(_e){}
    wrap.__latestArticlesCleanup = null;


    var prev = wrap.querySelector('.articlesNav.prev');
    var next = wrap.querySelector('.articlesNav.next');
    var dotsEl = document.getElementById('latestArticlesDots');

    var slides = Array.prototype.slice.call(trackEl.children);
    var count = slides.length;
    if (!count) return;

    var idx = 0;               // page index
    var pages = 1;
    var perView = 1;
	    var stepPx = 0;

    var timer = null;
    var autoplayMs = 6500;
    var prefersReduced = false;

    try{
      prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }catch(_e){}

    function getPerView(){
      try{
        if (window.matchMedia && window.matchMedia('(min-width: 1020px)').matches) return 3;
        if (window.matchMedia && window.matchMedia('(min-width: 680px)').matches) return 2;
      }catch(_e){}
      return 1;
    }

    function recalc(){
      perView = getPerView();
      pages = Math.max(1, Math.ceil(count / perView));
    }

    function markActive(){
      slides.forEach(function(s,k){
        var start = idx * perView;
        var end = start + perView - 1;
        s.classList.toggle('is-active', (k >= start && k <= end));
      });
    }

    function rebuildDots(){
      recalc();
      var dots = buildDots(dotsEl, pages);
      // overwrite labels for "page" semantics
      dots.forEach(function(d,k){
        try{
          var l = (document.documentElement.getAttribute('lang')||'fa').toLowerCase();
          var isEn = l.indexOf('en')===0;
          d.setAttribute('aria-label', isEn ? ('Page ' + (k+1) + ' of ' + pages) : ('صفحه ' + (k+1) + ' از ' + pages));
        }catch(_e){}
      });
      return dots;
    }

    var dots = rebuildDots();

	    function measureStep(){
	      try{
	        if (!slides || !slides.length) return 0;
	        var first = slides[0];
	        var cs = window.getComputedStyle ? window.getComputedStyle(trackEl) : null;
	        var gap = 0;
	        if (cs){
	          gap = parseFloat(cs.gap || cs.columnGap || cs.rowGap || '0') || 0;
	        }
	        var w = (first.getBoundingClientRect && first.getBoundingClientRect().width) || first.offsetWidth || 0;
	        stepPx = (w + gap) || 0;
	      }catch(_e){ stepPx = 0; }
	      return stepPx;
	    }

	    function setActive(i){
	      recalc();
	      idx = Math.max(0, Math.min(pages - 1, i));
	      measureStep();

	      // Track shift direction must respect document direction.
	      // In RTL, advancing pages should move the track to the right (positive translate),
	      // while in LTR it should move left (negative translate).
	      var dir = (document.documentElement.getAttribute('dir') || 'rtl').toLowerCase();
	      var sign = (dir === 'rtl') ? 1 : -1;
	      // Move by full "pages" (perView cards). Using px avoids drift with gap/padding.
	      if (stepPx > 0){
	        var offset = idx * perView * stepPx * sign;
	        if (window.KavicoMotion) window.KavicoMotion.setTransform(trackEl, 'translate3d(' + offset + 'px,0,0)');
	      }else{
	        var x = sign * (idx * 100);
	        if (window.KavicoMotion) window.KavicoMotion.setTransform(trackEl, 'translateX(' + x + '%)');
	      }

      markActive();

      dots.forEach(function(d,k){
        var active = (k === idx);
        d.classList.toggle('is-active', active);
        d.setAttribute('aria-current', active ? 'true' : 'false');
        d.setAttribute('tabindex', active ? '0' : '-1');
      });
    }

    function go(delta){ setActive(idx + delta); }

    function stop(){
      if (timer){ clearInterval(timer); timer=null; }
    }
    function start(){
      if (prefersReduced) return;
      stop();
      timer = setInterval(function(){ go(1); }, autoplayMs);
    }

    // controls (named handlers so we can safely remove them on re-init)
    function onPrevClick(){ stop(); go(-1); start(); }
    function onNextClick(){ stop(); go(1); start(); }

    // In RTL, some browsers can retarget click when a parent uses pointer capture.
    // Stop swipe handlers from ever seeing pointerdown from the controls.
    function onControlPointerDown(e){
      try{ if (e && e.stopPropagation) e.stopPropagation(); }catch(_e){}
    }

    if (prev) prev.addEventListener('click', onPrevClick);
    if (next) next.addEventListener('click', onNextClick);
    if (prev) prev.addEventListener('pointerdown', onControlPointerDown);
    if (next) next.addEventListener('pointerdown', onControlPointerDown);

    function onDotsClick(e){
      var t = e.target && e.target.closest ? e.target.closest('button[data-slide]') : null;
      if (!t) return;
      var n = parseInt(t.getAttribute('data-slide') || '0', 10);
      stop(); setActive(n); start();
    }
    if (dotsEl){
      dotsEl.addEventListener('click', onDotsClick);
      dotsEl.addEventListener('pointerdown', onControlPointerDown);
    }

    // Keyboard on wrapper
    function onKeydown(e){
      var k = e.key;
      if (k !== 'ArrowLeft' && k !== 'ArrowRight' && k !== 'Home' && k !== 'End') return;
      e.preventDefault();

      var dir = (document.documentElement.getAttribute('dir') || 'rtl').toLowerCase();
      var leftIsPrev = (dir === 'rtl') ? false : true; // rtl reverses semantics

      if (k === 'Home') { stop(); setActive(0); start(); return; }
      if (k === 'End')  { stop(); setActive(pages-1); start(); return; }

      if (k === 'ArrowLeft')  { stop(); go(leftIsPrev ? -1 : 1); start(); }
      if (k === 'ArrowRight') { stop(); go(leftIsPrev ? 1 : -1); start(); }
    }
    wrap.addEventListener('keydown', onKeydown);

    // Swipe / drag
    var down = false, startX = 0, lastX = 0;
    var pointerId = null;

    function isControlTarget(e){
      try{
        var t = e && e.target;
        if (!t) return false;
        if (t.closest) return !!t.closest('.articlesNav, .articlesDots, .articlesDot');
      }catch(_e){}
      return false;
    }

    function onDown(e){
      // Clicking nav/dots should never be hijacked by the swipe handler.
      // On some browsers (and more often in RTL), pointer capture can cause
      // button clicks to be retargeted to the wrapper, making the buttons feel
      // "dead". We simply skip swipe handling for control targets.
      if (isControlTarget(e)) return;
      /* Do NOT capture on pointerdown: with capture set, Chromium retargets the
         eventual click to `wrap`, so article links inside the cards never
         navigate. Capture only once the gesture is clearly a drag (onMove). */
      pointerId = e.pointerId;
      captured = false;
      dragged = false;
      down = true;
      startX = e.clientX || 0;
      lastX = startX;
      stop();
    }
    var captured = false, dragged = false;
    function onMove(e){
      if (!down) return;
      lastX = e.clientX || lastX;
      if (!captured && Math.abs(lastX - startX) > 10){
        captured = true; dragged = true;
        try{ wrap.setPointerCapture(pointerId); }catch(_e){}
      }
    }
    wrap.addEventListener('click', function(e){
      if (dragged){ e.preventDefault(); e.stopPropagation(); dragged = false; }
    }, true);
    function onUp(){
      if (!down) return;
      down = false;
      var dx = (lastX - startX);
	      if (Math.abs(dx) > 42){
	        // Keep physical gesture consistent in both directions:
	        // swipe right => previous, swipe left => next.
	        go(dx > 0 ? -1 : 1);
	      }
      start();
      try{
        if (pointerId != null) wrap.releasePointerCapture(pointerId);
      }catch(_e){}
      pointerId = null;
    }

    wrap.addEventListener('pointerdown', onDown, { passive: true });
    wrap.addEventListener('pointermove', onMove, { passive: true });
    wrap.addEventListener('pointerup', onUp, { passive: true });
    wrap.addEventListener('pointercancel', onUp, { passive: true });

    // Pause on hover/focus
    wrap.addEventListener('mouseenter', stop);
    wrap.addEventListener('mouseleave', start);
    wrap.addEventListener('focusin', stop);
    wrap.addEventListener('focusout', start);

    // Update dots/pages on resize (named handler so we can remove it on re-init)
    var rAF = 0;
    function onResize(){
      cancelAnimationFrame(rAF);
      rAF = requestAnimationFrame(function(){
        var oldPages = pages;
        dots = rebuildDots();
        if (idx >= pages) idx = pages - 1;
        // keep active page clamped
        setActive(idx);
      });
    }
    window.addEventListener('resize', onResize, { passive: true });

    // Cleanup hook (used when carousel re-renders)
    wrap.__latestArticlesCleanup = function(){
      try{ stop(); }catch(_e){}
      try{ cancelAnimationFrame(rAF); }catch(_e){}
      try{ if (prev) prev.removeEventListener('click', onPrevClick); }catch(_e){}
      try{ if (next) next.removeEventListener('click', onNextClick); }catch(_e){}
      try{ if (prev) prev.removeEventListener('pointerdown', onControlPointerDown); }catch(_e){}
      try{ if (next) next.removeEventListener('pointerdown', onControlPointerDown); }catch(_e){}
      try{ if (dotsEl) dotsEl.removeEventListener('click', onDotsClick); }catch(_e){}
      try{ if (dotsEl) dotsEl.removeEventListener('pointerdown', onControlPointerDown); }catch(_e){}
      try{ wrap.removeEventListener('keydown', onKeydown); }catch(_e){}

      try{ wrap.removeEventListener('pointerdown', onDown); }catch(_e){}
      try{ wrap.removeEventListener('pointermove', onMove); }catch(_e){}
      try{ wrap.removeEventListener('pointerup', onUp); }catch(_e){}
      try{ wrap.removeEventListener('pointercancel', onUp); }catch(_e){}

      try{ wrap.removeEventListener('mouseenter', stop); }catch(_e){}
      try{ wrap.removeEventListener('mouseleave', start); }catch(_e){}
      try{ wrap.removeEventListener('focusin', stop); }catch(_e){}
      try{ wrap.removeEventListener('focusout', start); }catch(_e){}

      try{ window.removeEventListener('resize', onResize); }catch(_e){}
      wrap.__latestArticlesCleanup = null;
    };

    // Hide controls if not needed
    recalc();
    if (pages <= 1){
      if (prev) prev.setAttribute('hidden','');
      if (next) next.setAttribute('hidden','');
      if (dotsEl) dotsEl.setAttribute('hidden','');
    }

    setActive(0);
    start();
  }

  function renderLatestArticles(){
    // If articles data hasn't loaded yet, retry briefly (order differs across pages)
    if (!Array.isArray(window.KAVIAN_ARTICLES) || !window.KAVIAN_ARTICLES.length){
      // In FA (RTL) the i18n payload can be heavier, and on slower devices deferred
      // scripts might not hydrate instantly. Be a little more patient before giving up.
      renderLatestArticles.__tries = (renderLatestArticles.__tries||0) + 1;
      if (renderLatestArticles.__tries <= 80){
        setTimeout(renderLatestArticles, 120);
      } else {
        try{ var emptyEl = document.getElementById('latestArticlesEmpty'); if (emptyEl) emptyEl.hidden = false; }catch(e){}
      }
      return;
    }
    var list = window.KAVIAN_ARTICLES;
    var emptyEl = document.getElementById('latestArticlesEmpty');

    if (!Array.isArray(list) || !list.length){
      if (emptyEl) emptyEl.hidden = false;
      return;
    }
    if (emptyEl) emptyEl.hidden = true;

    var lang = currentLang();

    var items = list.slice().sort(function(a,b){
      var da = (a && a.date) ? String(a.date) : '';
      var db = (b && b.date) ? String(b.date) : '';
      return db.localeCompare(da);
    }).slice(0,6); // more slides => feels like a real slider

    trackEl.innerHTML = '';
    trackEl.classList.add('articlesTrack--js');

    items.forEach(function(item){
	      var href = normalizePath(item.path);

      var slide = document.createElement('article');
      slide.className = 'article-card article-slide';
      slide.setAttribute('role','listitem');

      var link = document.createElement('a');
      link.href = href;
      link.className = 'article-link';

      var media = document.createElement('div');
      media.className = 'article-media';

      var picture = document.createElement('picture');
	      if (safeAssetPath(item.imgWebp)){
	        var srcW = document.createElement('source');
	        srcW.type = 'image/webp';
	        var webpPath = safeAssetPath(item.imgWebp);
	        srcW.srcset = webpPath.replace(/\.webp$/i,'-480w.webp') + ' 480w, ' + webpPath.replace(/\.webp$/i,'-768w.webp') + ' 768w, ' + webpPath + ' 1200w';
	        srcW.sizes = '(max-width: 679px) 88vw, (max-width: 1019px) 44vw, 380px';
	        picture.appendChild(srcW);
	      }
      var img = document.createElement('img');
      img.loading = 'lazy';
      img.decoding = 'async';
      img.setAttribute('fetchpriority','low');
      img.alt = pickText(item,'title',lang) || (lang==='en' ? 'Article' : 'مقاله');
	      img.src = safeAssetPath(item.imgJpg) || safeAssetPath(item.imgWebp) || '';
      picture.appendChild(img);
      media.appendChild(picture);

      var body = document.createElement('div');
      body.className = 'article-body';

      var h3 = document.createElement('h3');
      h3.className = 'article-title';
      var tSpan = document.createElement('span');
      tSpan.textContent = pickText(item,'title',lang);
      h3.appendChild(tSpan);

      var p = document.createElement('p');
      p.className = 'article-lead';
      var lSpan = document.createElement('span');
      lSpan.textContent = pickText(item,'lead',lang);
      p.appendChild(lSpan);

      var meta = document.createElement('div');
      meta.className = 'article-meta';
      var more = document.createElement('span');
      more.className = 'article-more';
      more.textContent = (lang==='en' ? 'Read' : 'مطالعه');
      meta.appendChild(more);
      var arrow = document.createElement('span');
      arrow.textContent = '↗';
      arrow.setAttribute('aria-hidden','true');
      meta.appendChild(arrow);

      body.appendChild(h3);
      body.appendChild(p);
      body.appendChild(meta);

      link.appendChild(media);
      link.appendChild(body);
      slide.appendChild(link);

      trackEl.appendChild(slide);
    });

    // translate injected nodes
    initCarousel();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderLatestArticles, { once: true });
  } else {
    renderLatestArticles();
  }

  // Extra safety: if something delayed article hydration, try once more after full load.
  try{
    window.addEventListener('load', function(){
      try{
        if (trackEl && (!trackEl.children || trackEl.children.length === 0)){
          renderLatestArticles.__tries = 0;
          renderLatestArticles();
        }
      }catch(_e){}
    }, { once: true });
  }catch(_e){}

  // Re-render on language toggle so titles/descriptions update
  try{ window.addEventListener('kavico:langchange', function(){ try{ renderLatestArticles.__tries = 0; renderLatestArticles(); }catch(e){} }); }catch(e){}
})();
})();


// v382: client-side public dictionaries retired; static FA/EN HTML is authoritative.

/* ===== Kavico v28: Draggable Before/After (split reveal via clip-path + subtle wavy divider) ===== */
(() => {
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  const wavePath = (xPct) => {
    const x = xPct;
    const A = 2.2;   // subtle wave amplitude (a bit more visible)
    const steps = 44;
    let d = `M ${x} 0`;
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const y = 100 * t;
      const w = Math.sin(t * Math.PI * 4) * A;
      d += ` L ${x + w} ${y}`;
    }
    return d;
  };

  const init = (el) => {
    const fxPath = el.querySelector(".ba__wavePath");
    const handle = el.querySelector(".ba__handle");
    if (!fxPath) return;

    
// v48: Shared stage so both images pan/zoom together (and always fill)
const beforeImg = el.querySelector(".ba__img--before");
const afterWrap = el.querySelector(".ba__after");
if (beforeImg && afterWrap) {
  let stage = el.querySelector(".ba__stage");
  if (!stage) {
    stage = document.createElement("div");
    stage.className = "ba__stage";
    // Put stage behind FX/handle
    el.insertBefore(stage, el.firstChild);
    stage.appendChild(beforeImg);
    stage.appendChild(afterWrap);
  }
}

let isDown = false;
    let pos = 50;

    const render = () => {
      el.setAttribute("data-ba-pos", String(Math.round(pos)));
      fxPath.setAttribute("d", wavePath(pos));
      if (handle) handle.setAttribute("aria-valuenow", String(Math.round(pos)));
    };

    const setFromEvent = (e) => {
      const r = el.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 100;
      pos = clamp(x, 0, 100);
      render();
    };

    const onDown = (e) => { window.dispatchEvent(new Event('ba:active'));
      isDown = true;
      el.classList.add("is-dragging");
      try { if (el.setPointerCapture) el.setPointerCapture(e.pointerId); } catch (_) {}
      setFromEvent(e);
      if (e.cancelable) e.preventDefault();
    };

    const onMove = (e) => {
      if (!isDown) return;
      setFromEvent(e);
      if (e.cancelable) e.preventDefault();
    };

    const onUp = () => { window.dispatchEvent(new Event('ba:idle'));
      isDown = false;
      el.classList.remove("is-dragging");
    };

    const onKey = (e) => {
      const step = e.shiftKey ? 10 : 2;
      const k = e.key;
      if (k === "ArrowLeft" || k === "ArrowDown") pos = clamp(pos - step, 0, 100);
      if (k === "ArrowRight" || k === "ArrowUp") pos = clamp(pos + step, 0, 100);
      if (k === "Home") pos = 0;
      if (k === "End") pos = 100;
      if (k === "ArrowLeft" || k === "ArrowRight" || k === "ArrowUp" || k === "ArrowDown" || k === "Home" || k === "End") {
        e.preventDefault();
        e.stopPropagation();
      }
      render();
    };

    el.addEventListener("pointerdown", onDown, { passive: false });
    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onUp, { passive: true });
    window.addEventListener("pointercancel", onUp, { passive: true });
    if (handle) handle.addEventListener("keydown", onKey);

    el.addEventListener("click", (e) => {
      if (isDown) return;
      setFromEvent(e);
    });

    render();
  };

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".ba").forEach(init);
  });
})();


/* home-coatings-compare.v2.js - Kavico Home A/B Coatings Compare (bilingual) */
(function(){
  const root = document.getElementById('coatingsCompare');
  if(!root) return;

  const currentLang = () => {
    const l = (document.documentElement.getAttribute('lang') || 'fa').toLowerCase();
    return l.startsWith('en') ? 'en' : 'fa';
  };
  const t = (fa, en) => (currentLang()==='en' ? en : fa);

  
  function pill(text, color){
    const span = document.createElement('span');
    span.className = 'cmp-pill';
    if(color){ span.setAttribute('data-pill-tone', color); }
    const dot = document.createElement('span');
    dot.className = 'dot';
    span.appendChild(dot);
    const t = document.createElement('span');
    t.textContent = text;
    span.appendChild(t);
    return span;
  }
const data = {
    gold: {
      key: 'gold',
      titleFa: 'طلایی (PVD)',        titleEn: 'Gold (PVD)',
      badgeFa: 'فینیش دکوراتیو گرم',
      accent: '#f7d26a',      badgeEn: 'Warm decorative finish',
      gradient: 'linear-gradient(135deg,#8a6b17,#f7d26a 45%,#b18a2a)',
      image: 'url("../../img/article-pvd-colors-v357.webp")',
      bestForFa: 'شیرآلات، یراق‌آلات دکوراتیو، قطعات نمایشی',
      bestForEn: 'Faucets, decorative hardware, showcase parts',
      feelFa: 'درخشان و چشمگیر، مناسب سبک‌های لوکس',
      feelEn: 'Bright, eye‑catching, luxury vibe',
      durabilityFa: 'وابسته به زیرکار، آماده‌سازی و شرایط استفاده',
      durabilityEn: 'Depends on substrate, preparation, and service conditions',
      careFa: 'دستمال نرم + شوینده ملایم، پرهیز از اسکاچ زبر',
      careEn: 'Soft cloth + mild cleaner; avoid abrasive pads',
      leadTimeFa: 'پس از بررسی قطعه و تیراژ',
      leadTimeEn: 'Confirmed after reviewing the part and batch size',
      ctaPrimary: { href: 'services/decorative-pvd/', labelFa: 'جزئیات PVD', labelEn: 'PVD details' },
      ctaSecondary:{ href: 'portfolio/', labelFa: 'مشاهده نمونه‌کارها', labelEn: 'View portfolio' }
    },
    smoke: {
      key: 'smoke',
      titleFa: 'دودی (PVD)',        titleEn: 'Smoke / gunmetal (PVD)',
      badgeFa: 'فینیش تیره و مدرن',
      accent: '#7d8790',        badgeEn: 'Dark modern finish',
      gradient: 'linear-gradient(135deg,#111827,#6b7280 45%,#0b1220)',
      image: 'url("../../img/blog-compare.webp")',
      bestForFa: 'شیرآلات مدرن، فضاهای مینیمال، اکسسوری‌های تیره',
      bestForEn: 'Modern faucets, minimal spaces, dark accessories',
      feelFa: 'کنتراست بالا، ظاهر مدرن و صنعتی',
      feelEn: 'High contrast, modern/industrial look',
      durabilityFa: 'وابسته به زیرکار، آماده‌سازی و شرایط استفاده',
      durabilityEn: 'Depends on substrate, preparation, and service conditions',
      careFa: 'تمیزکاری منظم برای جلوگیری از لکه آب',
      careEn: 'Regular wipe to prevent water spots',
      leadTimeFa: 'پس از بررسی قطعه و تیراژ',
      leadTimeEn: 'Confirmed after reviewing the part and batch size',
      ctaPrimary: { href: 'services/decorative-pvd/', labelFa: 'جزئیات PVD', labelEn: 'PVD details' },
      ctaSecondary:{ href: 'contact/#project-brief', labelFa: 'ارسال مشخصات', labelEn: 'Send project details' }
    },
    rosegold: {
      key: 'rosegold',
      titleFa: 'رزگلد (PVD)',       titleEn: 'Rose gold (PVD)',
      badgeFa: 'فینیش گرم دکوراتیو',
      accent: '#ffb4a1',       badgeEn: 'Warm decorative finish',
      gradient: 'linear-gradient(135deg,#7a2d2c,#ffb4a1 45%,#8b3a3a)',
      image: 'url("../../img/blog-luxury-pvd.webp")',
      bestForFa: 'اکسسوری حمام و آشپزخانه، دستگیره‌ها، دکور',
      bestForEn: 'Bath/kitchen accessories, handles, décor',
      feelFa: 'گرم و ترند، مناسب ترکیب با سنگ و چوب',
      feelEn: 'Warm & trendy; pairs well with stone/wood',
      durabilityFa: 'وابسته به زیرکار، آماده‌سازی و شرایط استفاده',
      durabilityEn: 'Depends on substrate, preparation, and service conditions',
      careFa: 'پرهیز از مواد اسیدی قوی و سفیدکننده‌ها',
      careEn: 'Avoid strong acids and bleach',
      leadTimeFa: 'پس از بررسی قطعه و تیراژ',
      leadTimeEn: 'Confirmed after reviewing the part and batch size',
      ctaPrimary: { href: 'services/decorative-pvd/', labelFa: 'جزئیات PVD', labelEn: 'PVD details' },
      ctaSecondary:{ href: 'portfolio/', labelFa: 'مشاهده نمونه‌کارها', labelEn: 'View portfolio' }
    },
    silver: {
      key: 'silver',
      titleFa: 'نقره‌ای (نیکل/کروم)', titleEn: 'Silver (Nickel/Chrome)',
      badgeFa: 'فینیش فلزی کلاسیک',
      accent: '#cbd5e1',    badgeEn: 'Classic metallic finish',
      gradient: 'linear-gradient(135deg,#9ca3af,#f3f4f6 45%,#6b7280)',
      image: 'url("../../img/blog-nickel-chrome.webp")',
      bestForFa: 'قطعات مصرفی، شیرآلات کلاسیک، قطعات صنعتی',
      bestForEn: 'Everyday parts, classic faucets, industrial parts',
      feelFa: 'تمیز و کلاسیک، هماهنگ با اکثر فضاها',
      feelEn: 'Clean & classic; matches most spaces',
      durabilityFa: 'وابسته به زیرکار، ساختار آبکاری و شرایط استفاده',
      durabilityEn: 'Depends on substrate, plating stack, and service conditions',
      careFa: 'شوینده ملایم، خشک‌کردن بعد از شستشو',
      careEn: 'Mild cleaner; dry after washing',
      leadTimeFa: 'پس از بررسی قطعه و تیراژ',
      leadTimeEn: 'Confirmed after reviewing the part and batch size',
      ctaPrimary: { href: 'services/nickel-chrome-plating/', labelFa: 'جزئیات نیکل/کروم', labelEn: 'Nickel/Chrome details' },
      ctaSecondary:{ href: 'contact/#project-brief', labelFa: 'ارسال مشخصات', labelEn: 'Send project details' }
    }
  };

  const selectA = root.querySelector('#coatA');
  const selectB = root.querySelector('#coatB');
  const cardA = root.querySelector('[data-card="A"]');
  const cardB = root.querySelector('[data-card="B"]');
  const table = root.querySelector('#coatCompareTable');
  const tableWrap = table.closest('.compareTableWrap') || root.querySelector('.compareTableWrap');

  if(!selectA || !selectB || !cardA || !cardB || !table) return;

  const getText = (item, key) => item[(currentLang()==='en' ? key + 'En' : key + 'Fa')] || '';

  function fillCard(el, item){
    el.setAttribute('data-coat', item.key || '');

    const titleEl = el.querySelector('[data-title]');
    const badgeEl = el.querySelector('[data-badge]');
    const bestEl  = el.querySelector('[data-bestfor]');
    const feelEl  = el.querySelector('[data-feel]');

    if(titleEl) titleEl.textContent = getText(item,'title');
    if(badgeEl) badgeEl.textContent = getText(item,'badge');
    if(bestEl)  bestEl.textContent  = getText(item,'bestFor');
    if(feelEl)  feelEl.textContent  = getText(item,'feel');

    const pills = el.querySelector('[data-pills]');
    if(pills){
      pills.innerHTML = '';
      const pill = (txt) => {
        const s = document.createElement('span');
        s.className = 'comparePill';
        s.textContent = txt;
        return s;
      };
      pills.appendChild(pill(t('دوام: ','Durability: ') + getText(item,'durability')));
      pills.appendChild(pill(t('نگهداری: ','Care: ') + getText(item,'care')));
      pills.appendChild(pill(t('زمان تحویل: ','Lead time: ') + getText(item,'leadTime')));
    }

    const cta1 = el.querySelector('[data-cta-primary]');
    const cta2 = el.querySelector('[data-cta-secondary]');
    if(cta1){
      cta1.setAttribute('href', item.ctaPrimary.href);
      cta1.textContent = t(item.ctaPrimary.labelFa, item.ctaPrimary.labelEn);
    }
    if(cta2){
      cta2.setAttribute('href', item.ctaSecondary.href);
      cta2.textContent = t(item.ctaSecondary.labelFa, item.ctaSecondary.labelEn);
    }

    // short preview swap animation (CSS-driven)
    try{
      el.classList.remove('is-switching');
      void el.offsetWidth;
      el.classList.add('is-switching');
      clearTimeout(el.__swT);
      el.__swT = setTimeout(function(){ el.classList.remove('is-switching'); }, 520);
    }catch(e){}
  }

  function updateTable(a,b){
    const rows = [
      [t('بهترین کاربرد','Best for'), getText(a,'bestFor'), getText(b,'bestFor')],
      [t('حس ظاهری','Look & feel'), getText(a,'feel'), getText(b,'feel')],
      [t('دوام','Durability'), getText(a,'durability'), getText(b,'durability')],
      [t('نگهداری','Care'), getText(a,'care'), getText(b,'care')],
      [t('زمان تحویل','Lead time'), getText(a,'leadTime'), getText(b,'leadTime')]
    ];
    const tbody = table.querySelector('tbody');
    if(!tbody) return;
    tbody.innerHTML = '';

    
    if (tableWrap) { tableWrap.classList.add('is-ready'); }
rows.forEach(r => {
      const tr = document.createElement('tr');
      const th = document.createElement('th'); th.textContent = r[0];
      const td1 = document.createElement('td'); td1.appendChild(pill(String(r[1]||''), a.key));
      const td2 = document.createElement('td'); td2.appendChild(pill(String(r[2]||''), b.key));

      if(String(r[1]).trim() !== String(r[2]).trim()){
        td1.classList.add('is-diff');
        td2.classList.add('is-diff');
      }

      tr.appendChild(th); tr.appendChild(td1); tr.appendChild(td2);
      tbody.appendChild(tr);
    });
  }

  function apply(){
    const a = data[selectA.value] || data.gold;
    const b = data[selectB.value] || data.smoke;
    fillCard(cardA, a);
    fillCard(cardB, b);
    updateTable(a,b);
  }

  selectA.addEventListener('change', apply);
  selectB.addEventListener('change', apply);

  // Re-apply on language toggle (app.min dispatches a custom event)
  window.addEventListener('kavico:langchange', apply);
  window.addEventListener('kavico:i18n-applied', apply);

  apply();
})();

/* home-animations.v1.js - Quick Start + Coatings Compare micro-animations */
(function(){
  'use strict';
  var body = document.body;
  if(!body || body.getAttribute('data-page') !== 'home') return;

  var reduce = false;
  try{ reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){}

  var targets = [];
  try{
    targets = targets
      .concat([].slice.call(document.querySelectorAll('#start .start-card')))
      .concat([].slice.call(document.querySelectorAll('#coatingsCompare .compareCard')))
      .concat([].slice.call(document.querySelectorAll('#coatingsCompare .compareTableWrap')));
  }catch(e){}

  if(!targets.length) return;

  // mark + stagger delays
  targets.forEach(function(el, i){
    el.classList.add('reveal-item');
    var d = Math.min(i, 8);
    el.classList.add('reveal-delay-' + d);
  });

  if(reduce || !('IntersectionObserver' in window)){
    targets.forEach(function(el){ el.classList.add('is-visible'); });
    return;
  }

  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(ent){
      if(ent.isIntersecting){
        ent.target.classList.add('is-visible');
        io.unobserve(ent.target);
      }
    });
  }, { threshold: 0.14, rootMargin: '0px 0px -10% 0px' });

  targets.forEach(function(el){ io.observe(el); });
})();


/* Kavico v345 — carousel runtime loaded only on pages that contain slider markup. */
(function(){'use strict';
  function ready(fn){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',fn,{once:true});else fn();}
  function reduced(){try{return matchMedia('(prefers-reduced-motion: reduce)').matches;}catch(_e){return false;}}
  function init(container){
    var track=container.querySelector('.slider-track'); if(!track)return;
    var slides=Array.from(track.querySelectorAll('.slide')); if(!slides.length)return;
    var prev=container.querySelector('.slider-nav.prev'),next=container.querySelector('.slider-nav.next');
    function rtl(){try{return getComputedStyle(track).direction==='rtl';}catch(_e){return document.documentElement.dir==='rtl';}}
    function firstIndex(){var r=track.getBoundingClientRect(),edge=rtl()?r.right:r.left,best=0,dist=Infinity;slides.forEach(function(s,i){var x=s.getBoundingClientRect(),e=rtl()?x.right:x.left,d=Math.abs(e-edge);if(d<dist){dist=d;best=i;}});return best;}
    function disabled(btn,val){if(!btn)return;btn.disabled=!!val;btn.classList.toggle('is-disabled',!!val);btn.setAttribute('aria-disabled',val?'true':'false');}
    function sync(){var i=firstIndex();disabled(prev,i<=0);disabled(next,i>=slides.length-1);slides.forEach(function(s,n){s.classList.toggle('is-center',n===i);});}
    function go(step){var i=Math.max(0,Math.min(slides.length-1,firstIndex()+step));try{track.scrollTo({left:slides[i].offsetLeft,behavior:reduced()?'auto':'smooth'});}catch(_e){track.scrollLeft=slides[i].offsetLeft;}track.dataset.pauseUntil=String(Date.now()+4500);setTimeout(sync,180);}
    if(prev)prev.addEventListener('click',function(e){e.preventDefault();if(!prev.disabled)go(-1);});
    if(next)next.addEventListener('click',function(e){e.preventDefault();if(!next.disabled)go(1);});
    var raf=0;track.addEventListener('scroll',function(){if(!raf)raf=requestAnimationFrame(function(){raf=0;sync();});},{passive:true});window.addEventListener('resize',sync,{passive:true});
    var down=false,startX=0,startScroll=0;
    track.addEventListener('pointerdown',function(e){if(e.pointerType==='mouse'&&e.button!==0)return;down=true;startX=e.clientX;startScroll=track.scrollLeft;track.classList.add('active');track.dataset.pauseUntil=String(Date.now()+5000);try{track.setPointerCapture(e.pointerId);}catch(_e){};});
    track.addEventListener('pointermove',function(e){if(!down)return;var dx=e.clientX-startX;if(Math.abs(dx)>4)track.scrollLeft=startScroll-dx;});
    function end(){down=false;track.classList.remove('active');} track.addEventListener('pointerup',end);track.addEventListener('pointercancel',end);
    sync();setTimeout(sync,300);
    if(track.classList.contains('ceramic-slider')&&!reduced()&&window.matchMedia&&window.matchMedia('(hover:hover) and (pointer:fine)').matches){
      var timer=setInterval(function(){if(document.hidden||Date.now()<Number(track.dataset.pauseUntil||0))return;var i=firstIndex();go(i>=slides.length-1?-i:1);},6500);
      window.addEventListener('pagehide',function(){clearInterval(timer);},{once:true});
    }
  }
  ready(function(){document.querySelectorAll('.slider-container').forEach(init);});
})();


/* Kavico v345 — lazy map embed, only bundled on pages with #map. */
(function(){'use strict';
  function start(){var el=document.getElementById('map');if(!el||el.dataset.mapInit==='1')return;el.dataset.mapInit='1';var lat=(el.dataset.lat||'35.692132').trim(),lng=(el.dataset.lng||'50.997906').trim();var iframe=document.createElement('iframe');iframe.title=document.documentElement.lang==='en'?'Kavico workshop map':'نقشه کارگاه کاویان';iframe.loading='lazy';iframe.referrerPolicy='no-referrer-when-downgrade';iframe.className='kavico-map-iframe';iframe.allowFullscreen=true;iframe.src='https://www.google.com/maps?q='+encodeURIComponent(lat+','+lng)+'&output=embed';el.replaceChildren(iframe);el.classList.add('map-embed-ready');}
  function init(){var el=document.getElementById('map');if(!el)return;if('IntersectionObserver'in window){var io=new IntersectionObserver(function(es){if(es.some(function(e){return e.isIntersecting;})){io.disconnect();start();}},{rootMargin:'300px 0px',threshold:.01});io.observe(el);}else setTimeout(start,700);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();


/* Kavico v345 — home stats only. */
(function(){'use strict';function init(){var stats=Array.from(document.querySelectorAll('.stat-num[data-target]'));if(!stats.length)return;var reduced=false;try{reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;}catch(_e){}function fa(n){if(document.documentElement.lang==='en')return String(n);return String(n).replace(/\d/g,function(x){return '۰۱۲۳۴۵۶۷۸۹'[Number(x)];});}function run(){stats.forEach(function(el){var target=parseInt(el.dataset.target||'0',10);if(reduced){el.textContent=fa(target);return;}var start=performance.now(),dur=900;function tick(now){var p=Math.min(1,(now-start)/dur),v=Math.round(target*(1-Math.pow(1-p,3)));el.textContent=fa(v);if(p<1)requestAnimationFrame(tick);}requestAnimationFrame(tick);});}var section=document.getElementById('stats');if(section&&'IntersectionObserver'in window){var io=new IntersectionObserver(function(es){if(es.some(function(e){return e.isIntersecting;})){io.disconnect();run();}},{threshold:.2});io.observe(section);}else run();}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();})();


/* Kavico v345 — scroll-to-top only where the control exists. */
(function(){'use strict';function init(){var b=document.getElementById('scrollTop');if(!b)return;var tick=false;function sync(){tick=false;b.classList.toggle('hide',(window.scrollY||0)<=500);}window.addEventListener('scroll',function(){if(!tick){tick=true;requestAnimationFrame(sync);}},{passive:true});b.addEventListener('click',function(){var r=false;try{r=matchMedia('(prefers-reduced-motion: reduce)').matches;}catch(_e){}window.scrollTo({top:0,behavior:r?'auto':'smooth'});});sync();}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();})();


/* Kavico v353 — FAQ accordion/search with category-group visibility. */
(function(){'use strict';function init(){var items=Array.from(document.querySelectorAll('.faq-item'));if(!items.length)return;items.forEach(function(item){var q=item.querySelector('.faq-q');if(!q)return;q.setAttribute('aria-expanded',item.classList.contains('open')?'true':'false');q.addEventListener('click',function(){var will=!item.classList.contains('open');items.forEach(function(i){i.classList.remove('open');var b=i.querySelector('.faq-q');if(b)b.setAttribute('aria-expanded','false');});if(will){item.classList.add('open');q.setAttribute('aria-expanded','true');}});});}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();})();

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
