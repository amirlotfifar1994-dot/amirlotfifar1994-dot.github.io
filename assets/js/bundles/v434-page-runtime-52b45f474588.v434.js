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

;
/* Kavico v380 interaction + static locale runtime. */
/* Kavico v359 — interaction contract */
(function(){
  'use strict';
  var body=document.body;if(!body)return;
  body.setAttribute('data-v359-ready','1');
  var ticking=false;
  function syncScroll(){body.setAttribute('data-v359-scrolled',window.scrollY>18?'1':'0');ticking=false;}
  function onScroll(){if(!ticking){ticking=true;requestAnimationFrame(syncScroll);}}
  syncScroll();window.addEventListener('scroll',onScroll,{passive:true});

  var mq=window.matchMedia('(max-width:900px)');
  var details=Array.prototype.slice.call(document.querySelectorAll('#navMenu details.nav-dd'));
  details.forEach(function(d){d.addEventListener('toggle',function(){if(!mq.matches||!d.open)return;details.forEach(function(other){if(other!==d)other.open=false;});});});

  function hideBarWhenVisible(bar,target){
    if(!bar||!target||!('IntersectionObserver'in window))return;
    var io=new IntersectionObserver(function(entries){
      entries.forEach(function(e){bar.setAttribute('data-v359-hidden',e.isIntersecting?'1':'0');});
    },{threshold:.2,rootMargin:'0px 0px -12% 0px'});
    io.observe(target);
  }
  hideBarWhenVisible(document.querySelector('.v342-mobile-action'),document.querySelector('#contact'));
  hideBarWhenVisible(document.querySelector('.service-action-bar'),document.querySelector('#cta'));
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

