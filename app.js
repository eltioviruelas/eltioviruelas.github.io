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

/* ================= INIT ================= */

async function init() {
  try {
    const res = await fetch('data/volumenes.json');
    data = await res.json();

    vinilo.classList.add('lento');
    wrapper.classList.add('lento');

    crearBotones();
    seleccionarVol(0);
  } catch (e) {
    console.error('INIT ERROR', e);
  }
}
init();

/* ================= BOTONES VOLUMEN ================= */

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

  const vol = data.volumenes[i];
  mostrarPortadas(vol);

  const base = vol.vu || 0;
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

/* ================= REPRODUCCIÓN ================= */

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

  audio.onloadedmetadata = () => {
    audio.play();
  };
}

/* ================= PLAY / PAUSE ================= */

playpause.onclick = () => {
  audio.paused ? audio.play() : audio.pause();
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

/* ================= SUBTÍTULOS ================= */

function cargarLetra(ruta) {
  const url = `https://raw.githubusercontent.com/eltioviruelas/eltioviruelas.github.io/main/${ruta}`;

  fetch(url)
    .then(r => r.text())
    .then(t => {
      subtitulos = parseLRC(t);
      subIndex = 0;
      console.log('SUBTITULOS CARGADOS:', subtitulos.length);
    })
    .catch(e => console.error('LETRA ERROR', e));
}

audio.ontimeupdate = () => {
  if (!subtitulos.length) return;

  const t = audio.currentTime;

  while (
    subIndex < subtitulos.length - 1 &&
    t >= subtitulos[subIndex + 1].tiempo
  ) {
    subIndex++;
  }

  letraTexto.innerHTML = `
    <div class="sub-previa">${subtitulos[subIndex - 1]?.texto || ''}</div>
    <div class="sub-actual">${subtitulos[subIndex]?.texto || ''}</div>
  `;
};

function parseLRC(texto) {
  return texto
    .split(/\r?\n/)
    .map(l => {
      const m = l.match(/\[(\d+):(\d+(\.\d+)?)\]\s*(.*)/);
      if (!m) return null;
      return {
        tiempo: parseInt(m[1]) * 60 + parseFloat(m[2]),
        texto: m[4]
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.tiempo - b.tiempo);
}

/* ================= EXTRA ================= */

function cargarExtra(ruta) {
  const url = `https://raw.githubusercontent.com/eltioviruelas/eltioviruelas.github.io/main/${ruta}`;
  fetch(url)
    .then(r => r.text())
    .then(t => extraTexto.textContent = t);
}

/* ================= SCRATCH VINILO ================= */

function getAngle(e) {
  const rect = vinilo.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  const x = e.touches ? e.touches[0].clientX : e.clientX;
  const y = e.touches ? e.touches[0].clientY : e.clientY;

  return Math.atan2(y - cy, x - cx);
}

vinilo.addEventListener('mousedown', e => {
  scratching = true;
  lastAngle = getAngle(e);
  audio.pause();
});

document.addEventListener('mouseup', () => {
  if (!scratching) return;
  scratching = false;
  audio.play();
});

document.addEventListener('mousemove', e => {
  if (!scratching) return;

  const angle = getAngle(e);
  const delta = angle - lastAngle;
  lastAngle = angle;

  audio.currentTime = Math.max(
    0,
    Math.min(audio.duration, audio.currentTime + delta * 4)
  );
});

/* TOUCH */

vinilo.addEventListener('touchstart', e => {
  scratching = true;
  lastAngle = getAngle(e);
  audio.pause();
});

document.addEventListener('touchend', () => {
  if (!scratching) return;
  scratching = false;
  audio.play();
});

document.addEventListener('touchmove', e => {
  if (!scratching) return;
  e.preventDefault();

  const angle = getAngle(e);
  const delta = angle - lastAngle;
  lastAngle = angle;

  audio.currentTime = Math.max(
    0,
    Math.min(audio.duration, audio.currentTime + delta * 4)
  );
}, { passive: false });
