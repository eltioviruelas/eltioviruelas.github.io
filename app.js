let data;
const audio = document.getElementById('audio');
const vinilo = document.getElementById('vinilo');
const wrapper = document.getElementById('viniloWrapper');
const brazo = document.getElementById('brazo');
const galleta = document.getElementById('galleta');
const aguja = document.getElementById('aguja');
const letraTexto = document.getElementById('letra-texto');
const extraTexto = document.getElementById('extra-texto');
const playpause = document.getElementById('playpause');

// ===============================
// CARGAR JSON PRINCIPAL
// ===============================
async function init() {
  try {
    const res = await fetch('data/volumenes.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    data = await res.json();

    vinilo.classList.add('lento');
    wrapper.classList.add('lento');

    crearBotones();
    seleccionarVol(0);
  } catch (err) {
    console.error('Error cargando volumenes.json', err);
  }
}
init();

// ===============================
// BOTONES DE VOLÚMENES
// ===============================
function crearBotones() {
  const cont = document.getElementById('volumenes-container');
  cont.innerHTML = '';

  data.volumenes.forEach((v, i) => {
    const b = document.createElement('button');
    b.className = 'volumen-btn';
    b.textContent = `Volumen ${i + 1}`;
    b.onclick = () => seleccionarVol(i);
    cont.appendChild(b);
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

// ===============================
// PORTADAS
// ===============================
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

// ===============================
// REPRODUCIR CANCIÓN
// ===============================
function reproducir(c) {
  brazo.style.transform = 'rotate(-35deg)';
  audio.src = c.audio;
  audio.play();

  galleta.src = c.galleta;
  vinilo.className = 'vinilo rapido';
  wrapper.className = 'vinilo-wrapper rapido';
  brazo.style.transform = 'rotate(-10deg)';

  cargarLetra(c.letra);
  cargarExtra(c.extra);
}

// ===============================
// CARGAR LETRA (SUBTÍTULOS)
// ===============================
function cargarLetra(url) {
  fetch(url)
    .then(r => r.text())
    .then(t => {
      console.log("LETRA CARGADA:", t.slice(0,200));
      subtitulos = parseLRC(t);
      subIndex = 0;
      letraTexto.innerHTML = '';
    })
    .catch(err => console.error('Error cargando letra', err));
}

// ===============================
// CARGAR EXTRA
// ===============================
function cargarExtra(url) {
  fetch(url)
    .then(r => r.text())
    .then(t => extraTexto.textContent = t)
    .catch(err => console.error('Error cargando extra', err));
}

// ===============================
// SUBTÍTULOS SINCRONIZADOS
// ===============================
let subtitulos = [];
let subIndex = 0;

audio.ontimeupdate = () => {
  if (!subtitulos.length) return;

  const t = audio.currentTime;

  if (subIndex < subtitulos.length - 1 && t >= subtitulos[subIndex + 1].tiempo) {
    subIndex++;
  }

  const previa = subtitulos[subIndex - 1]?.texto || "";
  const actual = subtitulos[subIndex]?.texto || "";

  letraTexto.innerHTML = `
    <div class="sub-previa">${previa}</div>
    <div class="sub-actual">${actual}</div>
  `;
};

// ===============================
// PARSEADOR LRC
// ===============================
function parseLRC(texto) {
  const lineas = texto.split(/\r?\n/);
  const subs = [];

  lineas.forEach(l => {
    const match = /

\[(\d{1,2}):(\d{2}(?:[.,]\d{1,3})?)\]

(.*)/.exec(l);
    if (match) {
      const min = parseInt(match[1], 10);
      const sec = parseFloat(match[2].replace(',', '.'));
      const texto = match[3].trim();
      const tiempo = min * 60 + sec;
      subs.push({ tiempo, texto });
    }
  });

  return subs.sort((a, b) => a.tiempo - b.tiempo);
}

// ===============================
// PLAY / PAUSE
// ===============================
playpause.addEventListener('click', () => {
  if (audio.paused) audio.play();
  else audio.pause();
});

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

// ===============================
// POTENCIÓMETRO
// ===============================
let girando = false;
const pot = document.getElementById('potenciometro');
const marca = pot.querySelector('.marca');

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
