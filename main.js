// Central main.js: menu, intro (index only), smooth nav, buy handler
(function(){
  // Menu - robust toggle and outside-click handling
  (function(){
    const menuButton = document.getElementById('menu-button');
    const menuPanel = document.getElementById('menu-panel');
    if(!menuButton || !menuPanel) return;
    function closeMenu(){ menuPanel.classList.remove('show'); menuPanel.setAttribute('aria-hidden','true'); menuButton.setAttribute('aria-expanded','false'); }
    function openMenu(){ menuPanel.classList.add('show'); menuPanel.setAttribute('aria-hidden','false'); menuButton.setAttribute('aria-expanded','true'); }

    menuButton.addEventListener('click', (e)=>{
      e.stopPropagation(); // prevent document click handler
      const isOpen = menuPanel.classList.contains('show');
      if(isOpen) closeMenu(); else openMenu();
    });

    // Close when clicking outside BOTH the menu button and the panel (handles clicks on child elements)
    document.addEventListener('click', (e)=>{
      if(menuPanel.classList.contains('show')){
        const target = e.target;
        if(!menuPanel.contains(target) && !menuButton.contains(target)) closeMenu();
      }
    });

    // Close on Escape
    document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape') closeMenu(); });

    // Open/close by hover on devices that support hover (desktop mice)
    try{
      const canHover = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
      if(canHover){
        let openTimer = null, closeTimer = null;
        const OPEN_DELAY = 120; // ms
        const CLOSE_DELAY = 220; // ms

        function scheduleOpen(){ clearTimeout(closeTimer); openTimer = setTimeout(()=>{ openMenu(); }, OPEN_DELAY); }
        function scheduleClose(){ clearTimeout(openTimer); closeTimer = setTimeout(()=>{ closeMenu(); }, CLOSE_DELAY); }

        menuButton.addEventListener('mouseenter', scheduleOpen);
        menuButton.addEventListener('mouseleave', scheduleClose);
        menuPanel.addEventListener('mouseenter', ()=>{ clearTimeout(closeTimer); });
        menuPanel.addEventListener('mouseleave', scheduleClose);
      }
    }catch(e){}

    // Close when clicking a menu item (anchor)
    menuPanel.querySelectorAll('a').forEach(a=>a.addEventListener('click', ()=>closeMenu()));

    // Inject a compact products preview into the menu: show unique products that have prices, limit list
    try{
      const products = [
        {id:'p1', img:'1.jpeg', price:14.5},
        {id:'p2', img:'2.jpeg', price:9.9},
        {id:'p3', img:'3.jpeg', price:22.0},
        {id:'p4', img:'4.jpeg', price:6.75},
        {id:'p5', img:'5.jpeg', price:22.5},
        {id:'p6', img:'6.jpeg', price:16.8},
        {id:'p7', img:'7.jpeg', price:7.95},
        {id:'p8', img:'1.jpeg', price:24.9}
      ];
      // Keep order but ensure uniqueness by id and only those with a numeric price
      const seen = new Set();
      // don't inject preview if there is already a static preview in the panel
      if(menuPanel.querySelector('.products-preview')){
        // already present in the markup (e.g. index.html), skip dynamic injection
      } else {
        const preview = document.createElement('div'); preview.className = 'products-preview';
      let added = 0; const MAX_ITEMS = 5;
      for(const p of products){
        if(added >= MAX_ITEMS) break;
        if(!p || !p.id || typeof p.price !== 'number') continue;
        if(seen.has(p.id)) continue; seen.add(p.id);
        const a = document.createElement('a');
        a.className = 'product-link';
        a.href = 'productos.html#' + p.id;
        a.setAttribute('data-anchor', '#' + p.id);
        a.setAttribute('data-no-fade','1');
        a.innerHTML = `<div class="product-item"><img src="imaganes/${p.img}" alt=""><div class="meta"><h4 data-i18n="${p.id}.name"></h4><p class="meta-desc" data-i18n="${p.id}.desc"></p><span class="preview-price">€${p.price.toFixed(2)}</span></div></div>`;
        preview.appendChild(a);
        added++;
      }
        if(preview.children.length) menuPanel.appendChild(preview);

        // Delegate clicks inside menuPanel for .product-link so we can scroll when already on productos
        menuPanel.addEventListener('click', function(e){
          const a = e.target.closest('.product-link'); if(!a) return;
          e.preventDefault(); const anchor = a.getAttribute('data-anchor'); closeMenu();
          const onProductsPage = location.pathname && location.pathname.toLowerCase().includes('productos');
          if(onProductsPage){ const el = document.querySelector(anchor); if(el){ setTimeout(()=> el.scrollIntoView({behavior:'smooth', block:'start'}), 80); return; } }
          // otherwise navigate to productos page with anchor
          location.href = a.href;
        });
      }
    }catch(e){}
  })();

  // Mark loaded for reveals
  window.addEventListener('load', ()=>{ document.querySelector('.site')?.classList.add('is-loaded'); });

  // Intro (only on index page)
  if(document.getElementById('intro-overlay')){
    const intro = document.getElementById('intro-overlay');
    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(prefersReduced){ try{ intro.remove(); }catch(e){} }
    else {
      function getNavType(){ try{ const entries = performance.getEntriesByType('navigation'); if(entries && entries.length) return entries[0].type; if(performance.navigation && typeof performance.navigation.type === 'number'){ return performance.navigation.type === 1 ? 'reload' : 'navigate'; } }catch(e){} return 'navigate'; }
      const navType = getNavType(); const sessionKey = 'plaerIntroShown_v1'; const shownInSession = (()=>{ try{ return !!sessionStorage.getItem(sessionKey) }catch(e){ return false } })();
      const shouldShow = (navType !== 'reload') && !shownInSession;
      if(!shouldShow){ try{ intro.remove(); }catch(e){} }
      else {
        try{ sessionStorage.setItem(sessionKey, '1'); }catch(e){}
        const INTRO_DELAY = 1500; const INTRO_DURATION = 25000;
          // Ensure a minimum intro duration (ms)
          const MIN_INTRO_DURATION = 15000;
          const EFFECTIVE_INTRO_DURATION = Math.max(INTRO_DURATION, MIN_INTRO_DURATION);
          // Sync CSS transition duration via CSS variable (seconds)
          try{ intro.style.setProperty('--intro-duration', (EFFECTIVE_INTRO_DURATION/1000) + 's'); }catch(e){}
          setTimeout(()=>{
            requestAnimationFrame(()=>{ requestAnimationFrame(()=>{ void intro.offsetWidth; intro.classList.add('fade-out'); }); });
            let removed = false; const removeIntro = ()=>{ if(removed) return; removed = true; try{ intro.remove(); }catch(e){} };
            intro.addEventListener('transitionend', function onEnd(ev){ if(ev.propertyName==='opacity'){ intro.removeEventListener('transitionend', onEnd); removeIntro(); } });
            setTimeout(removeIntro, EFFECTIVE_INTRO_DURATION + 2000);
          }, INTRO_DELAY);
      }
    }
  }

  // Smooth navigation: intercept internal links and fade before navigating
  (function(){
    const DURATION = 360;
    function isInternal(href){ return href && !href.startsWith('http') && !href.startsWith('mailto:') && !href.startsWith('tel:') && !href.startsWith('javascript:'); }
    document.querySelectorAll('a[href]').forEach(a=>{
      const href = a.getAttribute('href'); if(!isInternal(href)) return; if(href.startsWith('#')) return;
      if(a.dataset && a.dataset.noFade) return; // allow some links (menu product previews) to bypass fade
      a.addEventListener('click', function(e){ e.preventDefault(); document.querySelector('.site')?.classList.add('fade-out'); setTimeout(()=> location.href = href, DURATION); });
    });
  })();

  // Buy handler (modal + toast), delegated
  (function(){
    function createModal(){ const backdrop = document.createElement('div'); backdrop.className='modal-backdrop'; const modal = document.createElement('div'); modal.className='modal'; modal.innerHTML = '<h3 id="modal-title"></h3><p id="modal-desc"></p><div class="actions"><button id="cancel">Cancelar</button><button id="confirm" class="buy-btn">Confirmar compra</button></div>' ; backdrop.appendChild(modal); backdrop.style.display='none'; document.body.appendChild(backdrop); return backdrop; }
    const modal = createModal();
    function showModal(title,desc,cb){ modal.style.display='flex'; modal.querySelector('#modal-title').textContent=title; modal.querySelector('#modal-desc').textContent=desc; const confirm = modal.querySelector('#confirm'); const cancel = modal.querySelector('#cancel'); function clean(){ modal.style.display='none'; confirm.removeEventListener('click', onConfirm); cancel.removeEventListener('click', onCancel); } function onConfirm(){ clean(); cb && cb(true); } function onCancel(){ clean(); cb && cb(false); } confirm.addEventListener('click', onConfirm); cancel.addEventListener('click', onCancel); }
    function showToast(msg){ const t = document.createElement('div'); t.className='toast'; t.textContent = msg; document.body.appendChild(t); setTimeout(()=> t.remove(), 2800); }
    document.addEventListener('click', function(e){ const b = e.target.closest('.buy-btn'); if(!b) return; e.preventDefault(); const id = b.dataset.id; const name = b.dataset.name; const price = parseFloat(b.dataset.price); const title = (window.__plaer_translate ? window.__plaer_translate('modal.title_buy') : 'Comprar: ') + name; const desc = (window.__plaer_translate ? window.__plaer_translate('modal.price_prefix') : 'Precio: €') + price.toFixed(2) + '. ' + (window.__plaer_translate ? window.__plaer_translate('modal.confirm_question') : '¿Deseas añadirlo al carrito?'); showModal(title, desc, function(ok){ if(!ok) return; try{ const cart = JSON.parse(localStorage.getItem('plaerCart')||'[]'); cart.push({id,name,price,qty:1}); localStorage.setItem('plaerCart', JSON.stringify(cart)); const addedText = (window.__plaer_translate ? window.__plaer_translate('toast.added') : 'añadido al carrito'); showToast(name + ' ' + addedText); }catch(e){ showToast(window.__plaer_translate ? window.__plaer_translate('toast.error') : 'Error al añadir al carrito'); }}); });
  })();

  // Image focus: allow per-image data-focus to set object-position
  document.querySelectorAll('img[data-focus]').forEach(img=>{ img.style.objectPosition = img.getAttribute('data-focus'); });

})();

// --- Translations (i18n) ---
(function(){
  const LANG_KEY = 'plaerLang_v1';
  const translations = {
    es: {
      'nav.specialties':'Especialidades', 'nav.about':'Nosotros', 'nav.contact':'Contacto',
      'buy':'Comprar', 'see_specialties':'Ver especialidades',
      'hero.title':'Auténtica pastelería francesa artesanal', 'hero.blurb':'Mousse delicados, tartas de limón equilibradas y tartas de frutas frescas elaboradas cada día con técnicas tradicionales francesas.',
      'products.title':'Especialidades',
      'p1.name':'Mousse de Chocolate','p1.desc':'Textura sedosa y sabor profundo.',
      'p2.name':'Tarta de Limón','p2.desc':'Crema de limón sedosa y base crujiente.',
      'p3.name':'Tarta de Frutas','p3.desc':'Frutas de temporada y crema ligera.',
      'p4.name':'Selección del Chef','p4.desc':'Selección variada y personalizada.',
      'p5.name':'Tarta Clásica','p5.desc':'Receta tradicional con toque moderno.',
      'p6.name':'Pack Surtido','p6.desc':'Cuatro porciones surtidas.',
      'p7.name':'Mini Tartas','p7.desc':'Presentación individual para eventos.',
      'p8.name':'Postre Gourmet','p8.desc':'Edición limitada, textura aterciopelada.',
      'about.title':'Nuestra Historia y Filosofía','about.p1':'PLAER DOLÇ nace de la pasión por la pastelería tradicional francesa y del respeto por la materia prima.','about.t1':'Obrador y Técnica','about.p2':'Nuestro obrador combina técnicas artesanales con procesos controlados para garantizar consistencia y frescura.','about.t2':'Ingredientes Seleccionados','about.p3':'Trabajamos con ingredientes cuidadosamente seleccionados: frutas de temporada y mantequillas de alta calidad.','about.t3':'Presentación y Experiencia','about.p4':'La presentación es parte de la experiencia.', 'about.t4':'Compromiso con la Sostenibilidad','about.p5':'Nos comprometemos con prácticas responsables.' ,
      'contact.title':'Contacto','contact.address_label':'Dirección:','contact.address':'Calle Principal 123','contact.phone_label':'Teléfono:','contact.phone':'+34 600 000 000','contact.email_label':'Email:','contact.email':'contacto@placerdolc.example','contact.hours':'Abierto de martes a domingo.',
      'footer.copy':'© 2026 PLAER DOLÇ · Pastelería francesa artesanal','footer.follow':'Síguenos en Instagram para ver creaciones diarias',
      'modal.cancel':'Cancelar','modal.confirm':'Confirmar compra','modal.title_buy':'Comprar: ','modal.price_prefix':'Precio: €','modal.confirm_question':'¿Deseas añadirlo al carrito?','toast.added':'añadido al carrito','toast.error':'Error al añadir al carrito'
    },
    ca: {
      'nav.specialties':'Especialitats','nav.about':'Nosaltres','nav.contact':'Contacte',
      'buy':'Comprar','see_specialties':'Veure especialitats',
      'hero.title':'Autèntica pastisseria francesa artesanal','hero.blurb':'Mousses suaus, pastissos de llimona equilibrats i pastissos de fruita fresca fets cada dia amb tècniques franceses tradicionals.',
      'products.title':'Especialitats',
      'p1.name':'Mousse de Xocolata','p1.desc':'Textura sedosa i sabor profund.',
      'p2.name':'Pastís de Llimona','p2.desc':'Crema de llimona sedosa i base cruixent.',
      'p3.name':'Pastís de Fruites','p3.desc':'Fruites de temporada i crema lleugera.',
      'p4.name':'Selecció del Xef','p4.desc':'Selecció variada i personalitzada.',
      'p5.name':'Pastís Clàssic','p5.desc':'Recepta tradicional amb un toc modern.',
      'p6.name':'Pack Surtit','p6.desc':'Quatre porcions assortides.',
      'p7.name':'Mini Pastissos','p7.desc':'Presentació individual per a esdeveniments.',
      'p8.name':'Postre Gourmet','p8.desc':'Edició limitada, textura aterciopelada.',
      'about.title':'La nostra història i filosofia','about.p1':'PLAER DOLÇ neix de la passió per la pastisseria francesa i el respecte per la matèria primera.','about.t1':'Obrador i Tècnica','about.p2':'El nostre obrador combina tècniques artesanals amb processos controlats per garantir consistència i frescor.','about.t2':'Ingredients Seleccionats','about.p3':'Treballem amb ingredients seleccionats: fruites de temporada i mantegues d’alta qualitat.','about.t3':'Presentació i Experiència','about.p4':'La presentació forma part de l’experiència.','about.t4':'Compromís amb la Sostenibilitat','about.p5':'Ens comprometem amb pràctiques responsables.',
      'contact.title':'Contacte','contact.address_label':'Adreça:','contact.address':'C/ Principal 123','contact.phone_label':'Telèfon:','contact.phone':'+34 600 000 000','contact.email_label':'Correu:','contact.email':'contacto@placerdolc.example','contact.hours':'Obert de dimarts a diumenge.',
      'footer.copy':'© 2026 PLAER DOLÇ · Pastisseria francesa artesanal','footer.follow':'Segueix-nos a Instagram per veure creacions diàries',
      'modal.cancel':'Cancelar','modal.confirm':'Confirmar compra','modal.title_buy':'Comprar: ','modal.price_prefix':'Preu: €','modal.confirm_question':'Vols afegir-ho a la cistella?','toast.added':'afegit a la cistella','toast.error':'Error en afegir a la cistella'
    },
    fr: {
      'nav.specialties':'Spécialités','nav.about':'À propos','nav.contact':'Contact',
      'buy':'Acheter','see_specialties':'Voir les spécialités',
      'hero.title':'Pâtisserie française artisanale authentique','hero.blurb':'Mousses délicates, tartes au citron équilibrées et tartes aux fruits fraîches préparées chaque jour selon les techniques traditionnelles françaises.',
      'products.title':'Spécialités',
      'p1.name':'Mousse au Chocolat','p1.desc':'Texture soyeuse et goût profond.',
      'p2.name':'Tarte au Citron','p2.desc':'Crème de citron soyeuse et base croustillante.',
      'p3.name':'Tarte aux Fruits','p3.desc':'Fruits de saison et crème légère.',
      'p4.name':'Sélection du Chef','p4.desc':'Sélection variée et personnalisée.',
      'p5.name':'Tarte Classique','p5.desc':'Recette traditionnelle avec une touche moderne.',
      'p6.name':'Pack Assorti','p6.desc':'Quatre portions assorties.',
      'p7.name':'Mini Tartes','p7.desc':'Présentation individuelle pour événements.',
      'p8.name':'Dessert Gourmet','p8.desc':'Édition limitée, texture veloutée.',
      'about.title':'Notre histoire et philosophie','about.p1':'PLAER DOLÇ naît de la passion pour la pâtisserie française traditionnelle et du respect des ingrédients.','about.t1':'Atelier et Technique','about.p2':'Notre atelier combine techniques artisanales et processus contrôlés pour garantir fraîcheur et régularité.','about.t2':'Ingrédients Sélectionnés','about.p3':'Nous travaillons avec des ingrédients soigneusement sélectionnés: fruits de saison et beurres de haute qualité.','about.t3':'Présentation et Expérience','about.p4':'La présentation fait partie de l’expérience.','about.t4':'Engagement pour la Durabilité','about.p5':'Nous nous engageons à des pratiques responsables.',
      'contact.title':'Contact','contact.address_label':'Adresse:','contact.address':'Calle Principal 123','contact.phone_label':'Téléphone:','contact.phone':'+34 600 000 000','contact.email_label':'Email:','contact.email':'contacto@placerdolc.example','contact.hours':'Ouvert du mardi au dimanche.',
      'footer.copy':'© 2026 PLAER DOLÇ · Pâtisserie française artisanale','footer.follow':'Suivez-nous sur Instagram pour voir nos créations quotidiennes',
      'modal.cancel':'Annuler','modal.confirm':'Confirmer l\'achat','modal.title_buy':'Acheter: ','modal.price_prefix':'Prix: €','modal.confirm_question':'Souhaitez-vous l\'ajouter au panier?','toast.added':'ajouté au panier','toast.error':'Erreur lors de l\'ajout au panier'
    },
    en: {
      'nav.specialties':'Specialties','nav.about':'About','nav.contact':'Contact',
      'buy':'Buy','see_specialties':'See specialties',
      'hero.title':'Authentic French artisanal pastry','hero.blurb':'Delicate mousses, balanced lemon tarts and fresh fruit tarts made daily using traditional French techniques.',
      'products.title':'Specialties',
      'p1.name':'Chocolate Mousse','p1.desc':'Silky texture and deep flavor.',
      'p2.name':'Lemon Tart','p2.desc':'Silky lemon cream and crispy base.',
      'p3.name':'Fruit Tart','p3.desc':'Seasonal fruits and light pastry cream.',
      'p4.name':'Chef’s Selection','p4.desc':'Varied, personalized selection.',
      'p5.name':'Classic Tart','p5.desc':'Traditional recipe with a modern touch.',
      'p6.name':'Assorted Pack','p6.desc':'Four assorted portions.',
      'p7.name':'Mini Tarts','p7.desc':'Individual presentation for events.',
      'p8.name':'Gourmet Dessert','p8.desc':'Limited edition, velvety texture.',
      'about.title':'Our history and philosophy','about.p1':'PLAER DOLÇ was born from a passion for traditional French pastry and respect for ingredients.','about.t1':'Bakery & Technique','about.p2':'Our bakery combines artisanal techniques with controlled processes to guarantee freshness and consistency.','about.t2':'Selected Ingredients','about.p3':'We work with carefully selected ingredients: seasonal fruits and high-quality butters.','about.t3':'Presentation & Experience','about.p4':'Presentation is part of the experience.','about.t4':'Commitment to Sustainability','about.p5':'We commit to responsible practices.',
      'contact.title':'Contact','contact.address_label':'Address:','contact.address':'Calle Principal 123','contact.phone_label':'Phone:','contact.phone':'+34 600 000 000','contact.email_label':'Email:','contact.email':'contacto@placerdolc.example','contact.hours':'Open Tuesday to Sunday.',
      'footer.copy':'© 2026 PLAER DOLÇ · French artisanal pastry','footer.follow':'Follow us on Instagram to see daily creations',
      'modal.cancel':'Cancel','modal.confirm':'Confirm purchase','modal.title_buy':'Buy: ','modal.price_prefix':'Price: €','modal.confirm_question':'Do you want to add this to the cart?','toast.added':'added to cart','toast.error':'Error adding to cart'
    }
  };

  function applyTranslations(lang){
    const map = translations[lang] || translations['es'];
    document.querySelectorAll('[data-i18n]').forEach(el=>{
      const key = el.getAttribute('data-i18n');
      const val = map[key] || translations['es'][key] || '';
      el.textContent = val;
    });
    document.documentElement.lang = lang;
    const cur = document.getElementById('lang-current'); if(cur) cur.textContent = (lang||'es').toUpperCase();
  }

  // language selector UI
  function initLangSelector(){
    const btn = document.getElementById('lang-button');
    const menu = document.getElementById('lang-menu');
    if(!btn || !menu) return;
    btn.addEventListener('click', (e)=>{ e.stopPropagation(); const open = menu.classList.toggle('show'); btn.setAttribute('aria-expanded', open? 'true':'false'); menu.setAttribute('aria-hidden', open? 'false':'true'); });
    menu.querySelectorAll('button[data-lang]').forEach(b=>{
      b.addEventListener('click', (e)=>{ const l = b.getAttribute('data-lang'); setLang(l); menu.classList.remove('show'); btn.setAttribute('aria-expanded','false'); menu.setAttribute('aria-hidden','true'); });
    });
    document.addEventListener('click', ()=>{ if(menu.classList.contains('show')){ menu.classList.remove('show'); btn.setAttribute('aria-expanded','false'); menu.setAttribute('aria-hidden','true'); } });
    document.addEventListener('keydown', (e)=>{ if(e.key==='Escape'){ if(menu.classList.contains('show')){ menu.classList.remove('show'); btn.setAttribute('aria-expanded','false'); menu.setAttribute('aria-hidden','true'); } } });
  }

  function setLang(lang){ try{ localStorage.setItem(LANG_KEY, lang); }catch(e){} applyTranslations(lang); }

  // init on load
  window.addEventListener('DOMContentLoaded', ()=>{
    initLangSelector();
    const stored = (()=>{ try{return localStorage.getItem(LANG_KEY);}catch(e){return null}})();
    let lang = stored || (navigator.language||navigator.userLanguage||'es').slice(0,2);
    if(!['es','ca','fr','en'].includes(lang)) lang = 'es';
    applyTranslations(lang);
  });

})();
