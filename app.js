let data;
let subtitulos = [];
let subIndex = 0;

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
    if (!res.ok) throw new Error('No se pudo cargar el JSON');

    data = await res.json();

    vinilo.classList.add('lento');
    wrapper.classList.add('lento');

    crearBotones();
    seleccionarVol(0);

  } catch (e) {
    console.error('ERROR INIT:', e);
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
  audio.src = c.audio;
  audio.play();

  galleta.src = c.galleta;

  vinilo.className = 'vinilo rapido';
  wrapper.className = 'vinilo-wrapper rapido';
  brazo.style.transform = 'rotate(-10deg)';

  cargarLetra(c.letra);
  cargarExtra(c.extra);
}

/* ================= PLAY / PAUSE ================= */

playpause.onclick = () => {
  if (audio.paused) {
    audio.play();
  } else {
    audio.pause();
  }
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
      letraTexto.innerHTML = '';
    })
    .catch(e => console.error('Error letra:', e));
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

  const prev = subtitulos[subIndex - 1]?.texto || '';
  const act = subtitulos[subIndex]?.texto || '';

  letraTexto.innerHTML = `
    <div class="sub-previa">${prev}</div>
    <div class="sub-actual">${act}</div>
  `;
};

function parseLRC(texto) {
  return texto
    .split(/\r?\n/)
    .map(l => {
      const m = l.match(/\[(\d+):(\d+\.\d+|\d+)\](.*)/);
      if (!m) return null;
      return {
        tiempo: parseInt(m[1]) * 60 + parseFloat(m[2]),
        texto: m[3].trim()
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
