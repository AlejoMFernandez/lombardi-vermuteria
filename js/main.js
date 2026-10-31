import { initKit } from '../kit/kit.js?v=1';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const root = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const esDesk = () => matchMedia('(min-width:1100px)').matches;
const TZ = 'America/Argentina/Buenos_Aires';

/* ---------- intro: espera fuentes + foto del hero (máx. ~2,4 s) ---------- */
const t0 = performance.now();
const heroImg = $('.hero__f--1 img');
const listo = Promise.race([
  Promise.all([document.fonts?.ready, heroImg?.decode?.().catch(() => {})]),
  new Promise(r => setTimeout(r, 2400)),
]);
function abrir() {
  root.classList.add('abierto');
  document.body.style.overflow = '';
}
if (root.classList.contains('con-intro')) {
  document.body.style.overflow = 'hidden';
  const minimo = matchMedia('(max-width:767px)').matches ? 1350 : 1750;
  listo.then(() => {
    const falta = Math.max(0, minimo - (performance.now() - t0));
    setTimeout(() => {
      root.classList.add('intro-lista');
      setTimeout(abrir, 120);
      setTimeout(() => $('#intro')?.remove(), 900);
    }, falta);
  });
} else {
  requestAnimationFrame(() => requestAnimationFrame(abrir));
}

/* ---------- hora real del local ---------- */
const DIAS = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab'];
const NOMBRES = { dom: 'domingo', lun: 'lunes', mar: 'martes', mie: 'miércoles', jue: 'jueves', vie: 'viernes', sab: 'sábado' };
const PLAN = { lun: 'promo de vermú', mar: 'copas y tapeos', mie: 'platitos calientes', jue: 'tu aperitivo favorito', vie: 'cazuelas', sab: 'cazuelas' };
const CIERRA = { lun: '00:00', mar: '00:00', mie: '00:00', jue: '00:00', vie: '01:00', sab: '01:00' };
function ahora() {
  const q = new URLSearchParams(location.search);
  const f = new Intl.DateTimeFormat('en-US', { timeZone: TZ, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
  const w = f.find(p => p.type === 'weekday').value.toLowerCase().slice(0, 3);
  let dow = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'].indexOf(w);
  let min = Number(f.find(p => p.type === 'hour').value) * 60 + Number(f.find(p => p.type === 'minute').value);
  if (q.get('dia') && DIAS.includes(q.get('dia'))) dow = DIAS.indexOf(q.get('dia'));   // ?dia=lun&hora=20:00 para mostrarla en otro momento
  if (/^\d{1,2}:\d{2}$/.test(q.get('hora') || '')) { const [h, m] = q.get('hora').split(':').map(Number); min = h * 60 + m; }
  return { dow, min };
}
function estadoLocal() {
  const { dow, min } = ahora();
  const hoy = DIAS[dow], ayer = DIAS[(dow + 6) % 7];
  // después de medianoche sigue abierto el turno de ayer
  if (min < 60 && CIERRA[ayer]) {
    const cierre = CIERRA[ayer] === '01:00' ? 60 : 0;
    if (min < cierre) return { abierto: true, dia: ayer, texto: `Abierto hasta la 01:00 hs · ${NOMBRES[ayer]} de ${PLAN[ayer]}` };
  }
  if (CIERRA[hoy] && min >= 18 * 60) return { abierto: true, dia: hoy, texto: `Abierto hasta las ${CIERRA[hoy]} hs · hoy ${NOMBRES[hoy]}: ${PLAN[hoy]}` };
  if (CIERRA[hoy]) return { abierto: false, dia: hoy, texto: `Hoy ${NOMBRES[hoy]} abre a las 18:00 hs · ${PLAN[hoy]}` };
  const prox = DIAS[(dow + 1) % 7];
  return { abierto: false, dia: prox, manana: true, texto: `Hoy cerrado · mañana ${NOMBRES[prox]} desde las 18:00 hs` };
}
function pintarEstado() {
  const e = estadoLocal();
  $$('[data-hoy]').forEach(x => (x.textContent = e.texto));
  $$('[data-punto]').forEach(x => x.classList.toggle('is-abierto', e.abierto));
  const menu = $('[data-estado]'); if (menu) menu.textContent = e.texto;
  $$('.dia').forEach(d => {
    const es = d.dataset.dia.split(' ').includes(e.dia);
    d.classList.toggle('is-hoy', es);
    if (es) d.dataset.hoy = e.manana ? 'Mañana' : 'Hoy';
  });
  return e;
}
const estado = pintarEstado();
setInterval(pintarEstado, 60000);

/* ---------- barra y menú ---------- */
const barra = $('#barra');
let ticking = false;
function onScroll() {
  if (ticking) return; ticking = true;
  requestAnimationFrame(() => { barra.classList.toggle('is-solida', scrollY > 40); ticking = false; });
}
addEventListener('scroll', onScroll, { passive: true }); onScroll();

const burger = $('.barra__burger'), menu = $('#menu');
let scrollGuardado = 0;
function cerrarMenu() {
  if (menu.hidden) return;
  menu.hidden = true; burger.setAttribute('aria-expanded', 'false'); burger.setAttribute('aria-label', 'Abrir menú');
  document.body.style.position = ''; document.body.style.top = ''; document.body.style.width = '';
  root.style.scrollBehavior = 'auto'; scrollTo(0, scrollGuardado); root.style.scrollBehavior = '';
}
burger.addEventListener('click', () => {
  if (!menu.hidden) return cerrarMenu();
  scrollGuardado = scrollY;
  menu.hidden = false; burger.setAttribute('aria-expanded', 'true'); burger.setAttribute('aria-label', 'Cerrar menú');
  barra.classList.add('is-solida');
  document.body.style.position = 'fixed'; document.body.style.top = `-${scrollGuardado}px`; document.body.style.width = '100%';
});
menu.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]'); if (!a) return;
  e.preventDefault(); cerrarMenu();
  requestAnimationFrame(() => $(a.getAttribute('href'))?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }));
});
addEventListener('keydown', (e) => { if (e.key === 'Escape') cerrarMenu(); });

// link activo en la barra (desktop)
const navLinks = $$('.barra__nav a');
const ioNav = new IntersectionObserver((es) => es.forEach(en => {
  if (!en.isIntersecting) return;
  navLinks.forEach(a => a.classList.toggle('is-activo', a.getAttribute('href') === '#' + en.target.id));
}), { rootMargin: '-45% 0px -50% 0px' });
['semana', 'historia', 'carta', 'agenda', 'llegar'].forEach(id => { const s = document.getElementById(id); s && ioNav.observe(s); });

/* ---------- entradas al hacer scroll ---------- */
const io = new IntersectionObserver((es) => es.forEach(en => {
  if (en.isIntersecting) { en.target.classList.add('visto'); io.unobserve(en.target); }
}), { threshold: .18, rootMargin: '0px 0px -6% 0px' });
function observar(sel) { $$(sel).forEach((el, i) => { if (!el.style.getPropertyValue('--d') && el.classList.contains('aparece')) el.style.setProperty('--d', i % 4); io.observe(el); }); }
observar('.aparece'); observar('.cap');
$$('.cita.aparece, .ticket.aparece').forEach((el, i) => el.style.setProperty('--d', i));

/* ---------- arrastre con mouse en filas deslizables ---------- */
function arrastrable(el) {
  let x0 = 0, s0 = 0, mov = false, activo = false, v = 0, last = 0, lt = 0, raf = 0;
  el.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || getComputedStyle(el).overflowX === 'visible') return;
    activo = true; mov = false; x0 = e.clientX; s0 = el.scrollLeft; last = e.clientX; lt = performance.now(); v = 0; cancelAnimationFrame(raf);
  });
  addEventListener('pointermove', (e) => {
    if (!activo) return;
    const dx = e.clientX - x0;
    if (!mov && Math.abs(dx) > 5) { mov = true; el.classList.add('is-arrastrando'); }
    if (mov) {
      el.scrollLeft = s0 - dx;
      const now = performance.now(); v = (e.clientX - last) / Math.max(1, now - lt); last = e.clientX; lt = now;
    }
  });
  addEventListener('pointerup', () => {
    if (!activo) return; activo = false;
    if (!mov) return;
    // inercia suave y después vuelve el snap
    let vel = -v * 16;
    const paso = () => { vel *= 0.92; el.scrollLeft += vel; if (Math.abs(vel) > .5) raf = requestAnimationFrame(paso); else el.classList.remove('is-arrastrando'); };
    raf = requestAnimationFrame(paso);
    el.addEventListener('click', (ev) => { ev.preventDefault(); ev.stopPropagation(); }, { capture: true, once: true });
  });
}
$$('.pizarra, .citas').forEach(arrastrable);

/* ---------- la semana: arranca en hoy ---------- */
const piz = $('[data-pizarra]');
requestAnimationFrame(() => {
  const hoy = $('.dia.is-hoy', piz);
  if (hoy && !esDesk()) piz.scrollLeft = hoy.offsetLeft - parseFloat(getComputedStyle(piz).paddingLeft || 0);
});

/* ---------- la historia: la foto fija cambia por capítulo (desktop) ---------- */
const caps = $$('.cap');
const capas = $$('[data-capa]'), placas = $$('[data-placa]');
function capitulo(n) {
  caps.forEach(c => c.classList.toggle('is-actual', c.dataset.cap === String(n)));
  capas.forEach(c => c.classList.toggle('is-on', c.dataset.capa === String(n)));
  placas.forEach(c => c.classList.toggle('is-on', c.dataset.placa === String(n)));
}
const ioCap = new IntersectionObserver((es) => es.forEach(en => { if (en.isIntersecting) capitulo(en.target.dataset.cap); }), { rootMargin: '-48% 0px -48% 0px' });
caps.forEach(c => ioCap.observe(c));
capitulo(0);

/* ---------- marco del cartel (esquinas hacia adentro + aros) que se adapta al tamaño ---------- */
function marco(svg) {
  const box = svg.parentElement;
  const dibujar = () => {
    const w = box.clientWidth, h = box.clientHeight; if (!w || !h) return;
    const m = 10, r = Math.min(34, w / 10, h / 10);
    const d = `M${m + r} ${m} H${w - m - r} A${r} ${r} 0 0 0 ${w - m} ${m + r} V${h - m - r} A${r} ${r} 0 0 0 ${w - m - r} ${h - m} H${m + r} A${r} ${r} 0 0 0 ${m} ${h - m - r} V${m + r} A${r} ${r} 0 0 0 ${m + r} ${m} Z`;
    const aro = (x, y) => `<circle cx="${x}" cy="${y}" r="7" fill="none" stroke="#1C1A17" stroke-width="2.5"/>`;
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    svg.innerHTML = `<path d="${d}" fill="#F7F3EC" stroke="#1C1A17" stroke-width="2.5"/>${aro(m, m)}${aro(w - m, m)}${aro(m, h - m)}${aro(w - m, h - m)}`;
  };
  new ResizeObserver(dibujar).observe(box); dibujar();
}
$$('.placa-marco').forEach(marco);

/* ---------- KIT ---------- */
const ETQ = {
  sintacc: { label: 'Sin TACC', icono: '<span class="tag-sintacc">sin TACC</span>' },
  vegano: { label: 'Vegano', icono: '<span class="tag-vegano">vegano</span>' },
};
const fmt = (n) => '$' + Number(n).toLocaleString('es-AR');
const template = (p, ctx) => {
  const foto = p.foto ? ctx.asset(p.foto) : '';
  const vars = Array.isArray(p.variantes) && p.variantes.length;
  const precio = vars
    ? `<span class="it__var">${p.variantes.map(v => `<span><em>${v.nombre}</em>${v.precio != null ? fmt(v.precio) : 'Consultar'}</span>`).join('')}</span>`
    : (p.precio != null ? fmt(p.precio) : 'Consultar');
  return `<div class="it${foto ? ' con-foto' : ''}" ${foto ? `data-photo="${foto}"` : ''} data-nombre="${p.nombre.replace(/"/g, '&quot;')}">
    ${foto ? `<button type="button" class="it__th" data-zoom aria-label="Ver foto de ${p.nombre.replace(/"/g, '&quot;')}"><img src="${foto.replace('-640.', '-240.')}" alt="" width="240" height="240" loading="lazy" decoding="async"></button>` : ''}
    <div><h4 class="it__nom">${p.nombre}${foto ? '<i class="it__dot" aria-hidden="true"></i>' : ''}${(p.etiquetas || []).map(ctx.etiquetaHTML).join('')}</h4>
    ${p.descripcion ? `<p class="it__desc">${p.descripcion}</p>` : ''}</div>
    <span class="it__pre">${precio}</span></div>`;
};

const kitP = initKit({
  config: 'cliente.json',
  carta: { template, etiquetas: ETQ, pedir: false },
  badge: true,
  imagenes: { lqip: 'img/lqip.json' },
}).catch(err => { console.error('[demo] kit', err); return null; });

/* ---------- carta: 3 partes, una sección por vez, foto del plato al costado ---------- */
const GRUPOS = {
  comer: { nombre: 'Para comer', cats: ['frios', 'calientes', 'postres'] },
  tomar: { nombre: 'Vermú y tragos', cats: ['vermu', 'aperitivos', 'cerveza', 'sinalcohol'] },
  vinos: { nombre: 'Vinos', cats: ['espumosos', 'blancos', 'naranjos', 'rosados', 'tintos-ligeros', 'tintos'] },
};
const DOS_COL = ['vermu', 'aperitivos', 'cerveza', 'sinalcohol'];
const grupoDe = (cat) => Object.keys(GRUPOS).find(g => GRUPOS[g].cats.includes(cat)) || 'comer';
const cartaEl = $('#la-carta');
let grupoActual = 'comer';
let catsInfo = {};

function pintarGrupos() {
  $$('[data-grupo]').forEach(b => { const on = b.dataset.grupo === grupoActual; b.classList.toggle('is-on', on); b.setAttribute('aria-selected', on); });
  $$('.kit-tab', cartaEl).forEach(t => t.classList.toggle('fuera', grupoDe(t.dataset.cat) !== grupoActual));
}
function tabActual() { return $('.kit-tab.is-on', cartaEl); }
function irA(cat, { scroll = false } = {}) {
  const t = $(`.kit-tab[data-cat="${cat}"]`, cartaEl); if (!t) return;
  t.click();
}
function despuesDeTab() {
  const t = tabActual(); if (!t) return;
  grupoActual = grupoDe(t.dataset.cat);
  pintarGrupos();
  // la pestaña activa siempre a la vista (fila deslizable del celu)
  const tabs = $('.kit-tabs', cartaEl);
  if (tabs && !esDesk()) tabs.scrollTo({ left: t.offsetLeft - tabs.offsetLeft - 20, behavior: reduce ? 'auto' : 'smooth' });
  // anterior / siguiente
  const orden = $$('.kit-tab', cartaEl).map(x => x.dataset.cat);
  const i = orden.indexOf(t.dataset.cat);
  const prev = $('[data-paso="-1"]'), next = $('[data-paso="1"]');
  const nom = (c) => (catsInfo[c]?.nombre || '');
  prev.disabled = i <= 0; next.disabled = i >= orden.length - 1;
  prev.style.visibility = i <= 0 ? 'hidden' : ''; next.style.visibility = i >= orden.length - 1 ? 'hidden' : '';
  $('span', prev).textContent = i > 0 ? nom(orden[i - 1]) : 'Anterior';
  $('span', next).textContent = i < orden.length - 1 ? nom(orden[i + 1]) : 'Siguiente';
  // primera foto de la sección en la caja de desktop
  const panel = $('.kit-carta__panel:not([hidden])', cartaEl);
  const conFoto = panel && $('.it[data-photo]', panel);
  if (conFoto) mostrarFoto(conFoto, false);
}
document.addEventListener('kit:carta', (e) => {
  if (e.detail.el !== cartaEl) return;
  catsInfo = Object.fromEntries(e.detail.categorias.map(c => [c.id, c]));
  const tabs = $('.kit-tabs', cartaEl);
  // rótulos de grupo en el índice (desktop) y cantidad de opciones por pestaña
  if (tabs) {
    Object.entries(GRUPOS).forEach(([g, info]) => {
      const primera = $$('.kit-tab', tabs).find(t => grupoDe(t.dataset.cat) === g);
      if (primera) primera.insertAdjacentHTML('beforebegin', `<span class="kit-carta__grupo" aria-hidden="true">${info.nombre}</span>`);
    });
  }
  $$('.kit-carta__panel', cartaEl).forEach(p => {
    const id = p.id.split('-p-')[1];
    const n = $$('.kit-item', p).length;
    const c = catsInfo[id] || {};
    p.insertAdjacentHTML('afterbegin', `<div class="sec-cab"><h3>${c.nombre || ''}</h3><span>${n} ${n === 1 ? 'opción' : 'opciones'}</span></div>${c.descripcion ? `<p class="sec-desc">${c.descripcion}</p>` : ''}`);
    p.classList.toggle('dos', DOS_COL.includes(id));
  });
  despuesDeTab();
});
cartaEl.addEventListener('click', (e) => {
  if (e.target.closest('.kit-tab')) setTimeout(despuesDeTab, 0);
  const z = e.target.closest('[data-zoom]');
  if (z) { const it = z.closest('.it'); abrirZoom(it.dataset.photo, it.dataset.nombre); }
});
$('[data-grupos]').addEventListener('click', (e) => {
  const b = e.target.closest('[data-grupo]'); if (!b) return;
  grupoActual = b.dataset.grupo; irA(GRUPOS[grupoActual].cats[0]);
  setTimeout(despuesDeTab, 0);
});
$$('[data-paso]').forEach(b => b.addEventListener('click', () => {
  const orden = $$('.kit-tab', cartaEl).map(x => x.dataset.cat);
  const i = orden.indexOf(tabActual()?.dataset.cat) + Number(b.dataset.paso);
  if (orden[i]) { irA(orden[i]); setTimeout(despuesDeTab, 0); if (!esDesk()) $('#carta .carta__grupos').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); }
}));

// foto del plato (desktop): hover sobre el renglón
const fotoImg = $('[data-foto]'), fotoCap = $('[data-foto-cap]');
let fotoRaf = 0, fotoSrc = fotoImg?.getAttribute('src');
function mostrarFoto(it, marcar = true) {
  $$('.it.is-foco', cartaEl).forEach(x => x.classList.remove('is-foco'));
  if (marcar) it.classList.add('is-foco');
  const src = it.dataset.photo; if (!src || src === fotoSrc) { fotoCap.textContent = it.dataset.nombre; return; }
  fotoSrc = src; fotoImg.classList.add('cambia');
  setTimeout(() => { fotoImg.src = src; fotoCap.textContent = it.dataset.nombre; fotoImg.onload = () => fotoImg.classList.remove('cambia'); setTimeout(() => fotoImg.classList.remove('cambia'), 400); }, 180);
}
cartaEl.addEventListener('pointerover', (e) => {
  if (e.pointerType !== 'mouse') return;
  const it = e.target.closest('.it[data-photo]'); if (!it) return;
  cancelAnimationFrame(fotoRaf); fotoRaf = requestAnimationFrame(() => mostrarFoto(it));
});

// zoom de la foto (celu)
function abrirZoom(src, nombre) {
  const z = document.createElement('div');
  z.className = 'zoom'; z.setAttribute('role', 'dialog'); z.setAttribute('aria-modal', 'true'); z.setAttribute('aria-label', nombre);
  z.innerHTML = `<figure><img src="${src}" alt="${nombre}"><figcaption>${nombre}</figcaption></figure><button type="button" aria-label="Cerrar">×</button>`;
  const cerrar = () => { z.remove(); removeEventListener('keydown', esc); };
  const esc = (e) => e.key === 'Escape' && cerrar();
  z.addEventListener('click', cerrar); addEventListener('keydown', esc);
  document.body.appendChild(z); $('button', z).focus();
}

/* ---------- armá tu vermú ---------- */
const MARIDAJE = {
  'lafuerza-rojo': ['albondiguitas', 'albondiguitas rellenas'],
  'lafuerza-blanco': ['gambas', 'gambas al ajillo'],
  'feriado-rosado': ['faina', 'fainá Castelvetere'],
  'cinzano-segundo': ['tapeo-vermutero', 'tapeo vermutero'],
  'lunfa-rosso': ['croquetas', 'croquetas de jamón serrano'],
  'carpano': ['provoleta', 'provoleta Lombardi'],
};
const st = { v: 'lafuerza-rojo', x: new Set(['naranja', 'aceituna']) };
const vaso = $('[data-vaso]');
let prods = [];
document.addEventListener('kit:carta', (e) => { if (e.detail.el === cartaEl) { prods = e.detail.productos; pintarVermu(); } });
function pintarVermu() {
  const chip = $(`[data-v="${st.v}"]`);
  vaso.style.setProperty('--liq', chip.dataset.color);
  $$('[data-v]').forEach(b => { const on = b === chip; b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', on); });
  $$('[data-x]').forEach(b => { const on = st.x.has(b.dataset.x); b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', on); });
  ['naranja', 'aceituna', 'limon'].forEach(k => $(`.g--${k}`, vaso).classList.toggle('is-on', st.x.has(k)));
  const extras = ['naranja', 'aceituna', 'limon'].filter(k => st.x.has(k)).map(k => k === 'limon' ? 'limón' : k);
  const lista = extras.length > 1 ? extras.slice(0, -1).join(', ') + ' y ' + extras.at(-1) : extras[0];
  $('[data-res-nombre]').textContent = `${chip.textContent} con soda${lista ? ', ' + lista : ''}`;
  const p = prods.find(x => x.id === st.v);
  const precio = $('[data-res-precio]');
  precio.textContent = p?.precio != null ? fmt(p.precio) : '';
  precio.hidden = p?.precio == null;
  const [id, nombre] = MARIDAJE[st.v];
  const tapa = $('[data-res-tapa]'); tapa.dataset.id = id;
  tapa.innerHTML = `Va bien con ${/^(albondiguitas|gambas|croquetas)/.test(id) ? 'las' : /^(tapeo)/.test(id) ? 'el' : 'la'} <b>${nombre}</b> <span aria-hidden="true">→</span>`;
}
function llenar() {
  vaso.style.setProperty('--nivel', '200px');
  requestAnimationFrame(() => requestAnimationFrame(() => vaso.style.setProperty('--nivel', '0px')));
}
$('[data-opc="vermu"]').addEventListener('click', (e) => { const b = e.target.closest('[data-v]'); if (!b || b.dataset.v === st.v) return; st.v = b.dataset.v; pintarVermu(); llenar(); });
$('[data-opc="extra"]').addEventListener('click', (e) => { const b = e.target.closest('[data-x]'); if (!b) return; st.x.has(b.dataset.x) ? st.x.delete(b.dataset.x) : st.x.add(b.dataset.x); pintarVermu(); });
vaso.addEventListener('click', () => { vaso.classList.remove('is-revuelto'); void vaso.offsetWidth; vaso.classList.add('is-revuelto'); });
$('[data-res-tapa]').addEventListener('click', (e) => {
  const id = e.currentTarget.dataset.id;
  const p = prods.find(x => x.id === id); if (!p) return;
  grupoActual = grupoDe(p.categoria); irA(p.categoria); setTimeout(despuesDeTab, 0);
  $('#carta').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  setTimeout(() => {
    const art = $(`.kit-item[data-id="${id}"] .it`, cartaEl);
    if (art) { art.classList.add('is-foco'); art.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' }); if (esDesk()) mostrarFoto(art); }
  }, reduce ? 0 : 700);
});
pintarVermu();
const ioVaso = new IntersectionObserver((es) => { if (es[0].isIntersecting) { llenar(); ioVaso.disconnect(); } }, { threshold: .4 });
vaso.style.setProperty('--nivel', '200px'); ioVaso.observe(vaso);

/* ---------- la mesa: mazo que se tira con el dedo (celu) ---------- */
const mazo = $('[data-mazo]');
let orden = $$('.foto', mazo);
function acomodar() {
  if (esDesk()) { orden.forEach(f => { f.style.zIndex = ''; f.style.removeProperty('--r'); f.style.removeProperty('--x'); f.style.removeProperty('--y'); }); return; }
  orden.forEach((f, i) => {
    f.style.zIndex = String(orden.length - i);
    f.style.setProperty('--r', i === 0 ? '0deg' : `${(i % 2 ? 1 : -1) * (2 + i)}deg`);
    f.style.setProperty('--x', '0px'); f.style.setProperty('--y', `${Math.min(i, 3) * 6}px`);
    f.style.opacity = i > 4 ? '0' : '1';
  });
}
acomodar(); addEventListener('resize', acomodar);
let drag = null;
mazo.addEventListener('pointerdown', (e) => {
  if (esDesk()) return;
  const f = orden[0]; if (!e.target.closest('.foto') || e.target.closest('.foto') !== f) return;
  drag = { f, x0: e.clientX, y0: e.clientY, dx: 0, dy: 0, id: e.pointerId, eje: null };
  f.classList.add('is-drag');
});
mazo.addEventListener('pointermove', (e) => {
  if (!drag || e.pointerId !== drag.id) return;
  drag.dx = e.clientX - drag.x0; drag.dy = e.clientY - drag.y0;
  if (!drag.eje && (Math.abs(drag.dx) > 6 || Math.abs(drag.dy) > 6)) {
    drag.eje = Math.abs(drag.dx) > Math.abs(drag.dy) ? 'x' : 'y';
    if (drag.eje === 'x') mazo.setPointerCapture(e.pointerId);
  }
  if (drag.eje !== 'x') return;
  drag.f.style.setProperty('--x', `${drag.dx}px`); drag.f.style.setProperty('--y', `${drag.dy * .2}px`); drag.f.style.setProperty('--r', `${drag.dx / 14}deg`);
});
function soltar() {
  if (!drag) return; const { f, dx } = drag; drag = null; f.classList.remove('is-drag');
  if (Math.abs(dx) > 80) {
    f.style.setProperty('--x', `${Math.sign(dx) * innerWidth}px`); f.style.setProperty('--r', `${Math.sign(dx) * 24}deg`);
    setTimeout(() => { orden.push(orden.shift()); f.style.transition = 'none'; acomodar(); requestAnimationFrame(() => (f.style.transition = '')); }, 300);
  } else acomodar();
}
mazo.addEventListener('pointerup', soltar); mazo.addEventListener('pointercancel', soltar);


const kit = await kitP;
window.lombardi = { kit, estado };
