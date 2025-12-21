let data;
const audio = document.getElementById('audio');
const vinilo = document.getElementById('vinilo');
const wrapper = document.getElementById('viniloWrapper');
const brazo = document.getElementById('brazo');
const galleta = document.getElementById('galleta');
const aguja = document.getElementById('aguja');
const pot = document.getElementById('potenciometro');
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

/* sincroniza marca */
marca.style.transform = `translateX(-50%) rotate(${ -120 + volumen * 240 }deg)`;

/* JSON */
fetch('data/volumenes.json')
  .then(r => {
    console.log('fetch status', r.status, r.statusText);
    return r.json();
  })
  .then(j => {
    console.log('JSON cargado', j);
    data = j;
    vinilo.classList.add('lento');
    wrapper.classList.add('lento');
    crearBotones();
    seleccionarVol(0);
  })
  .catch(err => {
    console.error('Error fetch volumenes.json', err);
  });
  } catch (err) {
    console.error('Error cargando volumenes.json', err);
    // mostrar mensaje al usuario si hace falta
  }
}
init();

// Crear botones de volúmenes
function crearBotones() {
  const c = document.getElementById('volumenes-container');
  c.innerHTML = '';
  if (!contVolumenes || !data?.volumenes) return;
  contVolumenes.innerHTML = '';
  data.volumenes.forEach((v, i) => {
    const b = document.createElement('button');
    b.className = 'volumen-btn';
    b.textContent = v.titulo;
    b.onclick = () => seleccionarVol(i);
    c.appendChild(b);
    b.type = 'button';
    b.textContent = v.titulo || `Vol ${i+1}`;
    b.addEventListener('click', () => seleccionarVol(i));
    contVolumenes.appendChild(b);
  });
}

// Seleccionar volumen (grupo)
function seleccionarVol(i) {
  document.querySelectorAll('.volumen-btn')
    .forEach((b, idx) => b.classList.toggle('activo', idx === i));
  const botones = document.querySelectorAll('.volumen-btn');
  botones.forEach((b, idx) => b.classList.toggle('activo', idx === i));

  if (!data?.volumenes?.length) return;
  const min = -40, max = 40;
  const base = min + (max - min) * (i / (data.volumenes.length - 1 || 1));
  aguja.style.setProperty('--base-angle', base + 'deg');
  aguja.style.transform = `rotate(${base}deg)`;
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
  const p = document.getElementById('portadas');
  p.innerHTML = '';
  if (!portadas) return;
  portadas.innerHTML = '';
  if (!vol?.canciones) return;

  vol.canciones.forEach(c => {
    const d = document.createElement('div');
    d.className = 'portada';
    d.innerHTML = `<img src="${c.galleta}" draggable="false">`;
    d.onclick = () => reproducir(c);
    p.appendChild(d);
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
  brazo.style.transform = 'rotate(-35deg)';
  if (!c) return;
  brazo?.style.setProperty('transition', 'transform 300ms');
  brazo?.style.transform = 'rotate(-35deg)';

  setTimeout(() => {
    audio.src = c.audio;
    audio.play();

    galleta.src = c.galleta;
    galleta.style.objectFit = 'cover';
    galleta.style.borderRadius = '50%';

    vinilo.className = 'vinilo rapido';
    wrapper.className = 'vinilo-wrapper rapido';
    brazo.style.transform = 'rotate(-10deg)';
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

  cargarLetra(c.letra);
  cargarExtra(c.extra);
  if (c.letra) cargarLetra(c.letra);
  if (c.extra) cargarExtra(c.extra);
}

/* ===========================
   CARGAR EXTRA
=========================== */
function cargarExtra(url) {
  fetch(url)
    .then(r => r.text())
    .then(t => document.getElementById('extra-texto').textContent = t);
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
   SUBTÍTULOS SINCRONIZADOS (DOBLE LÍNEA)
   SUBTÍTULOS SINCRONIZADOS
============================================================ */
let subtitulos = [];
let subIndex = 0;

function cargarLetra(url) {
  fetch(url)
    .then(r => r.text())
    .then(t => {
      subtitulos = parseLRC(t);
      subIndex = 0;
      document.getElementById('letra-texto').innerHTML = "";
    });
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
  const lineas = texto.split(/\r?\n/);
  if (!texto) return [];
  const lines = texto.split(/\r?\n/);
  const subs = [];
  const timeRegex = /

  lineas.forEach(l => {
    // eliminar espacios al inicio y final
    const linea = l.trim();
    if (!linea) return;
\[(\d{1,2}):(\d{2}(?:[.,]\d{1,3})?)\]

    // buscar primer ']' que cierre el timestamp
    const cierre = linea.indexOf(']');
    if (linea[0] !== '[' || cierre === -1) return;
/g;

    const timePart = linea.slice(1, cierre); // mm:ss or mm:ss.xx
    const textoPart = linea.slice(cierre + 1).trim();
    if (!textoPart) return;
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    // separar minutos y segundos
    const parts = timePart.split(':');
    if (parts.length !== 2) return;
    const min = parseInt(parts[0], 10);
    const sec = parseFloat(parts[1].replace(',', '.'));
    if (isNaN(min) || isNaN(sec)) return;
    // extraer todos los timestamps
    let match;
    const times = [];
    while ((match = timeRegex.exec(line)) !== null) {
      const min = parseInt(match[1], 10);
      const sec = parseFloat(match[2].replace(',', '.'));
      if (!isNaN(min) && !isNaN(sec)) times.push(min * 60 + sec);
    }

    const tiempo = min * 60 + sec;
    subs.push({ tiempo, texto: textoPart });
  });
    // texto después del último ]
    const lastBracket = line.lastIndexOf(']');
    const textPart = lastBracket !== -1 ? line.slice(lastBracket + 1).trim() : '';
    if (!times.length || !textPart) continue;

    times.forEach(t => subs.push({ tiempo: t, texto: textPart }));
  }

  // ordenar por tiempo por si acaso
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

  if (subIndex < subtitulos.length - 1 && t >= subtitulos[subIndex + 1].tiempo) {
    subIndex++;
  }
  actualizarSubIndexPorTiempo(t);

  const previa = subtitulos[subIndex - 1]?.texto || "";
  const actual = subtitulos[subIndex]?.texto || "";

  document.getElementById('letra-texto').innerHTML = `
    <div class="sub-previa">${previa}</div>
    <div class="sub-actual">${actual}</div>
  `;
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
   BOTÓN ÚNICO PLAY/PAUSE
   BOTÓN PLAY/PAUSE Y ESTADOS
=========================== */
const playpause = document.getElementById('playpause');
if (playpause) {
  playpause.addEventListener('click', () => {
    if (audio.paused) audio.play().catch(()=>{});
    else audio.pause();
  });
}

playpause.onclick = () => {
  if (audio.paused) audio.play();
  else audio.pause();
};
// estados visuales
audio.addEventListener('play', () => {
  if (playpause) playpause.textContent = '⏸';
  vinilo && (vinilo.className = 'vinilo rapido');
  wrapper && (wrapper.className = 'vinilo-wrapper rapido');
  brazo && (brazo.style.transform = 'rotate(-10deg)');
});

audio.onplay = () => {
  playpause.textContent = '⏸';
  vinilo.className = 'vinilo rapido';
  wrapper.className = 'vinilo-wrapper rapido';
  brazo.style.transform = 'rotate(-10deg)';
};
audio.addEventListener('pause', () => {
  if (playpause) playpause.textContent = '▶';
  vinilo && (vinilo.className = 'vinilo lento');
  wrapper && (wrapper.className = 'vinilo-wrapper lento');
  brazo && (brazo.style.transform = 'rotate(-35deg)');
});

audio.onpause = () => {
  playpause.textContent = '▶';
  vinilo.className = 'vinilo lento';
  wrapper.className = 'vinilo-wrapper lento';
  brazo.style.transform = 'rotate(-35deg)';
};
// tecla espacio para play/pause (accesible)
document.addEventListener('keydown', e => {
  if (e.code === 'Space' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
    e.preventDefault();
    if (audio.paused) audio.play().catch(()=>{});
    else audio.pause();
  }
});

/* ===========================
   POTENCIÓMETRO
   POTENCIÓMETRO (pointer events si disponibles)
=========================== */
let girando = false;

pot.addEventListener('mousedown', () => girando = true);
document.addEventListener('mouseup', () => girando = false);
document.addEventListener('mousemove', moverPot);

pot.addEventListener('touchstart', e => {
function startPot(e) {
  girando = true;
  moverPot(e);
});
document.addEventListener('touchend', () => girando = false);
document.addEventListener('touchmove', moverPot, { passive: false });
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
  if (!girando) return;
  if (!girando || !pot || !marca || !audio) return;

  const rect = pot.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  const x = e.touches ? e.touches[0].clientX : e.clientX;
  const y = e.touches ? e.touches[0].clientY : e.clientY;
  const clientX = (e.touches && e.touches[0]) ? e.touches[0].clientX : (e.clientX ?? (e.pageX - window.scrollX));
  const clientY = (e.touches && e.touches[0]) ? e.touches[0].clientY : (e.clientY ?? (e.pageY - window.scrollY));

  const ang = Math.atan2(y - cy, x - cx) * 180 / Math.PI;
  const ang = Math.atan2(clientY - cy, clientX - cx) * 180 / Math.PI;
  const limitado = Math.max(-120, Math.min(120, ang));

  marca.style.transform = `translateX(-50%) rotate(${limitado}deg)`;
  audio.volume = (limitado + 120) / 240;
  volumen = (limitado + 120) / 240;
  audio.volume = Math.max(0, Math.min(1, volumen));
}

/* BLOQUEO DESCARGAS */
document.addEventListener('contextmenu', e => e.preventDefault());
