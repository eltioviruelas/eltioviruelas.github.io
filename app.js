let data;
const audio = document.getElementById('audio');
const vinilo = document.getElementById('vinilo');
const wrapper = document.getElementById('viniloWrapper');
const brazo = document.getElementById('brazo');
const galleta = document.getElementById('galleta');
const aguja = document.getElementById('aguja');
const pot = document.getElementById('potenciometro');
const marca = document.querySelector('.marca');

let volumen = 0.8;
audio.volume = volumen;

/* sincroniza marca */
marca.style.transform = `translateX(-50%) rotate(${ -120 + volumen * 240 }deg)`;

/* JSON */
fetch('data/volumenes.json')
  .then(r => r.json())
  .then(j => {
    data = j;
    vinilo.classList.add('lento');
    wrapper.classList.add('lento');
    crearBotones();
    seleccionarVol(0);
  });

function crearBotones() {
  const c = document.getElementById('volumenes-container');
  data.volumenes.forEach((v, i) => {
    const b = document.createElement('button');
    b.className = 'volumen-btn';
    b.textContent = v.titulo;
    b.onclick = () => seleccionarVol(i);
    c.appendChild(b);
  });
}

function seleccionarVol(i) {
  document.querySelectorAll('.volumen-btn')
    .forEach((b, idx) => b.classList.toggle('activo', idx === i));

  const min = -40, max = 40;
  const base = min + (max - min) * (i / (data.volumenes.length - 1 || 1));
  aguja.style.setProperty('--base-angle', base + 'deg');
  aguja.style.transform = `rotate(${base}deg)`;

  mostrarPortadas(data.volumenes[i]);
}

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

/* ===========================
   REPRODUCIR CANCIÓN
=========================== */
function reproducir(c) {
  brazo.style.transform = 'rotate(-35deg)';

  setTimeout(() => {
    audio.src = c.audio;
    audio.play();

    galleta.src = c.galleta;
    galleta.style.objectFit = 'cover';
    galleta.style.borderRadius = '50%';

    vinilo.className = 'vinilo rapido';
    wrapper.className = 'vinilo-wrapper rapido';
    brazo.style.transform = 'rotate(-10deg)';
  }, 300);

  cargarLetra(c.letra);
  cargarExtra(c.extra);
}

/* ===========================
   CARGAR EXTRA
=========================== */
function cargarExtra(url) {
  fetch(url)
    .then(r => r.text())
    .then(t => document.getElementById('extra-texto').textContent = t);
}

/* ============================================================
   SUBTÍTULOS SINCRONIZADOS (DOBLE LÍNEA)
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
}

function parseLRC(texto) {
  const lineas = texto.split('\n');
  const subs = [];

  lineas.forEach(l => {
    const match = l.match(/

\[(\d+):(\d+\.\d+)\]

(.*)/);
    if (match) {
      const min = parseInt(match[1]);
      const sec = parseFloat(match[2]);
      const tiempo = min * 60 + sec;
      const texto = match[3].trim();
      subs.push({ tiempo, texto });
    }
  });

  return subs;
}

audio.ontimeupdate = () => {
  if (!subtitulos.length) return;

  const t = audio.currentTime;

  if (subIndex < subtitulos.length - 1 && t >= subtitulos[subIndex + 1].tiempo) {
    subIndex++;
  }

  const previa = subtitulos[subIndex - 1]?.texto || "";
  const actual = subtitulos[subIndex]?.texto || "";

  document.getElementById('letra-texto').innerHTML = `
    <div class="sub-previa">${previa}</div>
    <div class="sub-actual">${actual}</div>
  `;
};

/* ===========================
   BOTÓN ÚNICO PLAY/PAUSE
=========================== */
const playpause = document.getElementById('playpause');

playpause.onclick = () => {
  if (audio.paused) audio.play();
  else audio.pause();
};

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

/* ===========================
   POTENCIÓMETRO
=========================== */
let girando = false;

pot.addEventListener('mousedown', () => girando = true);
document.addEventListener('mouseup', () => girando = false);
document.addEventListener('mousemove', moverPot);

pot.addEventListener('touchstart', e => {
  girando = true;
  moverPot(e);
});
document.addEventListener('touchend', () => girando = false);
document.addEventListener('touchmove', moverPot, { passive: false });

function moverPot(e) {
  if (!girando) return;

  const rect = pot.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  const x = e.touches ? e.touches[0].clientX : e.clientX;
  const y = e.touches ? e.touches[0].clientY : e.clientY;

  const ang = Math.atan2(y - cy, x - cx) * 180 / Math.PI;
  const limitado = Math.max(-120, Math.min(120, ang));

  marca.style.transform = `translateX(-50%) rotate(${limitado}deg)`;
  audio.volume = (limitado + 120) / 240;
}

/* BLOQUEO DESCARGAS */
document.addEventListener('contextmenu', e => e.preventDefault());
