// Mejoras: comprobaciones DOM, async/await, parse LRC robusto, sync volumen, pointer events

let data = null;
const $ = id => document.getElementById(id);

// Elementos (comprobación)
const audio = $('audio');
const vinilo = $('vinilo');
const wrapper = $('viniloWrapper');
const brazo = $('brazo');
const galleta = $('galleta');
const aguja = $('aguja');
const pot = $('potenciometro');
const marca = document.querySelector('.marca');
const contVolumenes = $('volumenes-container');
const portadas = $('portadas');
const letraTexto = $('letra-texto');
const extraTexto = $('extra-texto');
const playpause = $('playpause');

if (!audio) throw new Error('Elemento audio no encontrado en el DOM');

// Estado inicial
let volumen = 0.8;
audio.volume = volumen;
if (marca) marca.style.transform = `translateX(-50%) rotate(${ -120 + volumen * 240 }deg)`;

// Cargar JSON con async/await
async function init() {
  try {
    const res = await fetch('data/volumenes.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    data = await res.json();

    // estado visual inicial
    vinilo?.classList.add('lento');
    wrapper?.classList.add('lento');

    crearBotones();
    seleccionarVol(0);
  } catch (err) {
    console.error('Error cargando volumenes.json', err);
    // mostrar mensaje al usuario si hace falta
  }
}
init();

// Crear botones de volúmenes
function crearBotones() {
  if (!contVolumenes || !data?.volumenes) return;
  contVolumenes.innerHTML = '';
  data.volumenes.forEach((v, i) => {
    const b = document.createElement('button');
    b.className = 'volumen-btn';
    b.type = 'button';
    b.textContent = v.titulo || `Vol ${i+1}`;
    b.addEventListener('click', () => seleccionarVol(i));
    contVolumenes.appendChild(b);
  });
}

// Seleccionar volumen (grupo)
function seleccionarVol(i) {
  const botones = document.querySelectorAll('.volumen-btn');
  botones.forEach((b, idx) => b.classList.toggle('activo', idx === i));

  if (!data?.volumenes?.length) return;
  const min = -40, max = 40;
  const denom = (data.volumenes.length - 1) || 1;
  const base = min + (max - min) * (i / denom);

  if (aguja) {
    aguja.style.setProperty('--base-angle', base + 'deg');
    aguja.style.transform = `rotate(${base}deg)`;
  }

  mostrarPortadas(data.volumenes[i]);
}

// Mostrar portadas
function mostrarPortadas(vol) {
  if (!portadas) return;
  portadas.innerHTML = '';
  if (!vol?.canciones) return;

  vol.canciones.forEach(c => {
    const d = document.createElement('div');
    d.className = 'portada';
    d.tabIndex = 0; // accesible por teclado
    d.innerHTML = `<img src="${c.galleta}" draggable="false" alt="${c.titulo || 'Portada'}">`;
    d.addEventListener('click', () => reproducir(c));
    d.addEventListener('keydown', e => { if (e.key === 'Enter') reproducir(c); });
    portadas.appendChild(d);
  });
}

/* ===========================
   REPRODUCIR CANCIÓN
=========================== */
function reproducir(c) {
  if (!c) return;
  brazo?.style.setProperty('transition', 'transform 300ms');
  brazo?.style.transform = 'rotate(-35deg)';

  setTimeout(() => {
    audio.src = c.audio || '';
    audio.play().catch(err => console.warn('No se pudo reproducir automáticamente', err));

    if (galleta) {
      galleta.src = c.galleta || '';
      galleta.style.objectFit = 'cover';
      galleta.style.borderRadius = '50%';
    }

    vinilo && (vinilo.className = 'vinilo rapido');
    wrapper && (wrapper.className = 'vinilo-wrapper rapido');
    brazo && (brazo.style.transform = 'rotate(-10deg)');
  }, 300);

  if (c.letra) cargarLetra(c.letra);
  if (c.extra) cargarExtra(c.extra);
}

/* ===========================
   CARGAR EXTRA
=========================== */
async function cargarExtra(url) {
  if (!extraTexto || !url) return;
  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const t = await r.text();
    extraTexto.textContent = t;
  } catch (err) {
    console.error('Error cargando extra', err);
    extraTexto.textContent = '';
  }
}

/* ============================================================
   SUBTÍTULOS SINCRONIZADOS
============================================================ */
let subtitulos = [];
let subIndex = 0;

async function cargarLetra(url) {
  if (!letraTexto || !url) return;
  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const t = await r.text();
    subtitulos = parseLRC(t);
    subIndex = 0;
    letraTexto.innerHTML = '';
  } catch (err) {
    console.error('Error cargando letra', err);
    subtitulos = [];
    letraTexto.innerHTML = '';
  }
}

// parse LRC: admite múltiples timestamps por línea [mm:ss.xx][mm:ss] Texto
function parseLRC(texto) {
  if (!texto) return [];
  const lines = texto.split(/\r?\n/);
  const subs = [];
  const timeRegex = /

\[(\d{1,2}):(\d{2}(?:[.,]\d{1,3})?)\]

/g;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    // extraer todos los timestamps
    let match;
    const times = [];
    while ((match = timeRegex.exec(line)) !== null) {
      const min = parseInt(match[1], 10);
      const sec = parseFloat(match[2].replace(',', '.'));
      if (!isNaN(min) && !isNaN(sec)) times.push(min * 60 + sec);
    }

    // texto después del último ]
    const lastBracket = line.lastIndexOf(']');
    const textPart = lastBracket !== -1 ? line.slice(lastBracket + 1).trim() : '';
    if (!times.length || !textPart) continue;

    times.forEach(t => subs.push({ tiempo: t, texto: textPart }));
  }

  subs.sort((a, b) => a.tiempo - b.tiempo);
  return subs;
}

// sincronización robusta: recalcula subIndex según currentTime (soporta seek)
function actualizarSubIndexPorTiempo(t) {
  if (!subtitulos.length) { subIndex = 0; return; }
  // búsqueda binaria para eficiencia
  let lo = 0, hi = subtitulos.length - 1, mid;
  while (lo <= hi) {
    mid = Math.floor((lo + hi) / 2);
    if (subtitulos[mid].tiempo <= t) lo = mid + 1;
    else hi = mid - 1;
  }
  subIndex = Math.max(0, lo - 1);
}

audio.ontimeupdate = () => {
  if (!subtitulos.length) return;
  const t = audio.currentTime;
  actualizarSubIndexPorTiempo(t);

  const previa = subtitulos[subIndex - 1]?.texto || "";
  const actual = subtitulos[subIndex]?.texto || "";

  if (letraTexto) {
    letraTexto.innerHTML = `
      <div class="sub-previa">${escapeHtml(previa)}</div>
      <div class="sub-actual">${escapeHtml(actual)}</div>
    `;
  }
};

// escapar texto para evitar inyección
function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}

/* ===========================
   BOTÓN PLAY/PAUSE Y ESTADOS
=========================== */
if (playpause) {
  playpause.addEventListener('click', () => {
    if (audio.paused) audio.play().catch(()=>{});
    else audio.pause();
  });
}

// estados visuales
audio.addEventListener('play', () => {
  if (playpause) playpause.textContent = '⏸';
  vinilo && (vinilo.className = 'vinilo rapido');
  wrapper && (wrapper.className = 'vinilo-wrapper rapido');
  brazo && (brazo.style.transform = 'rotate(-10deg)');
});

audio.addEventListener('pause', () => {
  if (playpause) playpause.textContent = '▶';
  vinilo && (vinilo.className = 'vinilo lento');
  wrapper && (wrapper.className = 'vinilo-wrapper lento');
  brazo && (brazo.style.transform = 'rotate(-35deg)');
});

// tecla espacio para play/pause (accesible)
document.addEventListener('keydown', e => {
  if (e.code === 'Space' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
    e.preventDefault();
    if (audio.paused) audio.play().catch(()=>{});
    else audio.pause();
  }
});

/* ===========================
   POTENCIÓMETRO (pointer events si disponibles)
=========================== */
let girando = false;

function startPot(e) {
  girando = true;
  moverPot(e);
  // evitar scroll en touch
  if (e.cancelable) e.preventDefault();
}
function endPot() { girando = false; }
function movePot(e) {
  if (!girando) return;
  moverPot(e);
  if (e.cancelable) e.preventDefault();
}

if (pot) {
  // pointer events preferidos
  if (window.PointerEvent) {
    pot.addEventListener('pointerdown', startPot);
    document.addEventListener('pointerup', endPot);
    document.addEventListener('pointermove', movePot);
  } else {
    pot.addEventListener('mousedown', startPot);
    document.addEventListener('mouseup', endPot);
    document.addEventListener('mousemove', movePot);
    pot.addEventListener('touchstart', startPot, { passive: false });
    document.addEventListener('touchend', endPot);
    document.addEventListener('touchmove', movePot, { passive: false });
  }
}

function moverPot(e) {
  if (!girando || !pot || !marca || !audio) return;

  const rect = pot.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  const clientX = (e.touches && e.touches[0]) ? e.touches[0].clientX : (e.clientX ?? (e.pageX - window.scrollX));
  const clientY = (e.touches && e.touches[0]) ? e.touches[0].clientY : (e.clientY ?? (e.pageY - window.scrollY));

  const ang = Math.atan2(clientY - cy, clientX - cx) * 180 / Math.PI;
  const limitado = Math.max(-120, Math.min(120, ang));

  marca.style.transform = `translateX(-50%) rotate(${limitado}deg)`;
  volumen = (limitado + 120) / 240;
  audio.volume = Math.max(0, Math.min(1, volumen));
}

/* BLOQUEO DESCARGAS */
document.addEventListener('contextmenu', e => e.preventDefault());
