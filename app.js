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

async function init() {
  const res = await fetch('data/volumenes.json');
  data = await res.json();

  vinilo.classList.add('lento');
  wrapper.classList.add('lento');

  crearBotones();
  seleccionarVol(0);
}
init();

/* BOTONES */
function crearBotones() {
  const cont = document.getElementById('volumenes-container');
  cont.innerHTML = '';

  data.volumenes.forEach((v, i) => {
    const b = document.createElement('button');
    b.className = 'volumen-btn';
    b.textContent = v.titulo;

    b.addEventListener('mouseenter', () => {
      if (!b.classList.contains('activo')) b.textContent = v.label;
    });

    b.addEventListener('mouseleave', () => {
      if (!b.classList.contains('activo')) b.textContent = v.titulo;
    });

    b.onclick = () => seleccionarVol(i);
    cont.appendChild(b);
  });
}

function seleccionarVol(i) {
  document.querySelectorAll('.volumen-btn').forEach((b, idx) => {
    b.classList.toggle('activo', idx === i);
    b.textContent = idx === i
      ? data.volumenes[i].label
      : data.volumenes[idx].titulo;
  });

  mostrarPortadas(data.volumenes[i]);
  aguja.style.setProperty('--base-angle', (data.volumenes[i].vu || 0) + 'deg');
}

/* PORTADAS */
function mostrarPortadas(vol) {
  const p = document.getElementById('portadas');
  p.innerHTML = '';

  vol.canciones.forEach(c => {
    const d = document.createElement('div');
    d.className = 'portada';

    const titulo = c.titulo;

    d.innerHTML = `
      <img src="${c.galleta}" draggable="false">
      <div class="portada-titulo">${titulo}</div>
    `;

    d.onclick = () => reproducir(c);
    p.appendChild(d);
  });
}

/* REPRODUCIR */
function reproducir(c) {
  audio.pause();
  audio.currentTime = 0;
  audio.src = c.audio;

  galleta.src = c.galleta;

  cargarLetra(c.letra);
  cargarExtra(c.extra);

  audio.onloadedmetadata = () => audio.play();
}

/* PLAY / PAUSE */
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

/* SUBTÍTULOS */
function cargarLetra(ruta) {
  fetch(`https://raw.githubusercontent.com/eltioviruelas/eltioviruelas.github.io/main/${ruta}`)
    .then(r => r.text())
    .then(t => {
      subtitulos = parseLRC(t);
      subIndex = 0;
    });
}

audio.ontimeupdate = () => {
  if (!subtitulos.length) return;

  const t = audio.currentTime;
  while (subIndex < subtitulos.length - 1 && t >= subtitulos[subIndex + 1].tiempo) {
    subIndex++;
  }

  letraTexto.innerHTML = `
    <div class="sub-actual">${subtitulos[subIndex]?.texto || ''}</div>
    <div class="sub-previa">${subtitulos[subIndex + 1]?.texto || ''}</div>
  `;
};

function parseLRC(texto) {
  return texto.split(/\r?\n/)
    .map(l => {
      const m = l.match(/\[(\d+):(\d+(\.\d+)?)\](.*)/);
      if (!m) return null;
      return { tiempo: parseInt(m[1]) * 60 + parseFloat(m[2]), texto: m[4] };
    })
    .filter(Boolean);
}

/* EXTRA */
function cargarExtra(ruta) {
  fetch(`https://raw.githubusercontent.com/eltioviruelas/eltioviruelas.github.io/main/${ruta}`)
    .then(r => r.text())
    .then(t => extraTexto.textContent = t);
}
