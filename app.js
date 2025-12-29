let data;
let subtitulos = [];
let subIndex = 0;

/* ===== SCRATCH ===== */
let scratching = false;
let lastAngle = 0;

/* ===== ELEMENTOS ===== */
const audio = document.getElementById('audio');
const vinilo = document.getElementById('vinilo');
const wrapper = document.getElementById('viniloWrapper');
const brazo = document.getElementById('brazo');
const galleta = document.getElementById('galleta');
const aguja = document.getElementById('aguja');
const letraTexto = document.getElementById('letra-texto');
const extraTexto = document.getElementById('extra-texto');
const playpause = document.getElementById('playpause');
const pot = document.getElementById('potenciometro');
const marca = pot.querySelector('.marca');

/* ================= INIT ================= */

async function init() {
  const res = await fetch('data/volumenes.json');
  data = await res.json();

  vinilo.classList.add('lento');
  wrapper.classList.add('lento');

  crearBotones();
  seleccionarVol(0);

  // Potenciómetro según volumen real
  const angInicial = -120 + audio.volume * 240;
  marca.style.transform = `translateX(-50%) rotate(${angInicial}deg)`;
}
init();

/* ================= VOLUMENES ================= */

function crearBotones() {
  const cont = document.getElementById('volumenes-container');
  cont.innerHTML = '';

  data.volumenes.forEach((v, i) => {
    const b = document.createElement('button');
    b.className = 'volumen-btn';
    b.textContent = v.titulo;
    b.onclick = () => seleccionarVol(i);
    cont.appendChild(b);
  });
}

function seleccionarVol(i) {
  document.querySelectorAll('.volumen-btn')
    .forEach((b, idx) => b.classList.toggle('activo', idx === i));

  mostrarPortadas(data.volumenes[i]);

  const base = data.volumenes[i].vu || 0;
  aguja.style.setProperty('--base-angle', base + 'deg');
}

/* ================= PORTADAS ================= */

function mostrarPortadas(vol) {
  const p = document.getElementById('portadas');
  p.innerHTML = '';

  vol.canciones.forEach(c => {
    const d = document.createElement('div');
    d.className = 'portada';
    d.innerHTML = `<img src="${c.galleta}" draggable="false">`;
    d.onclick = () => reproducir(c);
    p.appendChild(d);
  });
}

/* ================= REPRODUCIR ================= */

function reproducir(c) {
  audio.pause();
  audio.currentTime = 0;

  subtitulos = [];
  subIndex = 0;
  letraTexto.innerHTML = '';

  audio.src = c.audio;
  galleta.src = c.galleta;

  cargarLetra(c.letra);
  cargarExtra(c.extra);

  audio.onloadedmetadata = () => audio.play();
}

/* ================= PLAY / PAUSE ================= */

playpause.onclick = () => audio.paused ? audio.play() : audio.pause();

audio.onplay = () => {
  playpause.textContent = '⏸';
  vinilo.className = 'vinilo rapido';
  wrapper.className = 'vinilo-wrapper rapido';
  brazo.style.transform = 'rotate(-10deg)';
};

audio.onpause = () => {
  playpause.textContent = '▶';
  vinilo.className = 'vinilo lento';
  wrapper.className = 'vinilo-wrapper lento';
  brazo.style.transform = 'rotate(-35deg)';
};

/* ================= SUBTÍTULOS (KARAOKE) ================= */

function cargarLetra(ruta) {
  const url = `https://raw.githubusercontent.com/eltioviruelas/eltioviruelas.github.io/main/${ruta}`;
  fetch(url)
    .then(r => r.text())
    .then(t => {
      subtitulos = parseLRC(t);
      subIndex = 0;
    });
}

audio.ontimeupdate = () => {
  if (!subtitulos.length) return;

  const t = audio.currentTime;

  while (subIndex < subtitulos.length - 1 &&
         t >= subtitulos[subIndex + 1].tiempo) {
    subIndex++;
  }

  const actual = subtitulos[subIndex]?.texto || '';
  const siguiente = subtitulos[subIndex + 1]?.texto || '';

  letraTexto.innerHTML = `
    <div class="sub-actual">${actual}</div>
    <div class="sub-previa">${siguiente}</div>
  `;
};

function parseLRC(texto) {
  return texto.split(/\r?\n/).map(l => {
    const m = l.match(/\[(\d+):(\d+(\.\d+)?)\](.*)/);
    if (!m) return null;
    return {
      tiempo: parseInt(m[1]) * 60 + parseFloat(m[2]),
      texto: m[4]
    };
  }).filter(Boolean);
}

/* ================= EXTRA ================= */

function cargarExtra(ruta) {
  const url = `https://raw.githubusercontent.com/eltioviruelas/eltioviruelas.github.io/main/${ruta}`;
  fetch(url).then(r => r.text()).then(t => extraTexto.textContent = t);
}

/* ================= SCRATCH REAL ================= */

function anguloDesdeCentro(x, y) {
  const r = vinilo.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  return Math.atan2(y - cy, x - cx) * 180 / Math.PI;
}

function iniciarScratch(e) {
  scratching = true;
  vinilo.style.animation = 'none';
  wrapper.style.animation = 'none';

  const p = e.touches ? e.touches[0] : e;
  lastAngle = anguloDesdeCentro(p.clientX, p.clientY);
}

function moverScratch(e) {
  if (!scratching) return;
  e.preventDefault();

  const p = e.touches ? e.touches[0] : e;
  const ang = anguloDesdeCentro(p.clientX, p.clientY);
  let delta = ang - lastAngle;

  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;

  audio.currentTime = Math.max(0, audio.currentTime + delta * 0.003);
  vinilo.style.transform = `rotate(${ang}deg)`;

  lastAngle = ang;
}

function finScratch() {
  scratching = false;
  vinilo.style.transform = '';
  audio.paused ? audio.onpause() : audio.onplay();
}

/* MOUSE */
vinilo.addEventListener('mousedown', iniciarScratch);
document.addEventListener('mousemove', moverScratch);
document.addEventListener('mouseup', finScratch);

/* TOUCH */
vinilo.addEventListener('touchstart', iniciarScratch, { passive: false });
document.addEventListener('touchmove', moverScratch, { passive: false });
document.addEventListener('touchend', finScratch);

/* ================= POTENCIÓMETRO ================= */

let girando = false;

pot.addEventListener('mousedown', () => girando = true);
document.addEventListener('mouseup', () => girando = false);
pot.addEventListener('touchstart', () => girando = true);
document.addEventListener('touchend', () => girando = false);

document.addEventListener('mousemove', moverPot);
document.addEventListener('touchmove', moverPot, { passive: false });

function moverPot(e) {
  if (!girando) return;

  const r = pot.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;

  const p = e.touches ? e.touches[0] : e;
  const ang = Math.atan2(p.clientY - cy, p.clientX - cx) * 180 / Math.PI;
  const limitado = Math.max(-120, Math.min(120, ang));

  marca.style.transform = `translateX(-50%) rotate(${limitado}deg)`;
  audio.volume = (limitado + 120) / 240;
}
