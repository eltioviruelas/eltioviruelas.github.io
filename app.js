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
  crearBotones();
  seleccionarVol(0);
}
init();

function crearBotones() {
  const cont = document.getElementById('volumenes-container');
  cont.innerHTML = '';

  data.volumenes.forEach((v, i) => {
    const b = document.createElement('button');
    b.className = 'volumen-btn';
    b.textContent = v.titulo;

    b.onmouseenter = () => {
      if (!b.classList.contains('activo')) b.textContent = v.hover;
    };

    b.onmouseleave = () => {
      if (!b.classList.contains('activo')) b.textContent = v.titulo;
    };

    b.onclick = () => seleccionarVol(i);
    cont.appendChild(b);
  });
}

function seleccionarVol(i) {
  document.querySelectorAll('.volumen-btn').forEach((b, idx) => {
    const vol = data.volumenes[idx];
    const activo = idx === i;
    b.classList.toggle('activo', activo);
    b.textContent = activo ? vol.activoTexto : vol.titulo;
  });

  mostrarPortadas(data.volumenes[i]);
  aguja.style.setProperty('--base-angle', data.volumenes[i].vu + 'deg');
}

function mostrarPortadas(vol) {
  const p = document.getElementById('portadas');
  p.innerHTML = '';

  vol.canciones.forEach(c => {
    const d = document.createElement('div');
    d.className = 'portada';
    d.innerHTML = `
      <img src="${c.galleta}">
      <span>${c.titulo}</span>
    `;
    d.onclick = () => reproducir(c);
    p.appendChild(d);
  });
}

function reproducir(c) {
  audio.pause();
  audio.currentTime = 0;
  audio.src = c.audio;
  galleta.src = c.galleta;
  cargarLetra(c.letra);
  cargarExtra(c.extra);
  audio.onloadedmetadata = () => audio.play();
}

playpause.onclick = () => audio.paused ? audio.play() : audio.pause();
audio.onplay = () => playpause.textContent = '❚❚';
audio.onpause = () => playpause.textContent = '▶';

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
  while (subIndex < subtitulos.length - 1 &&
         audio.currentTime >= subtitulos[subIndex + 1].tiempo) {
    subIndex++;
  }

  letraTexto.innerHTML = `
    <div class="sub-actual">${subtitulos[subIndex]?.texto || ''}</div>
    <div class="sub-previa">${subtitulos[subIndex + 1]?.texto || ''}</div>
  `;
};

function parseLRC(texto) {
  return texto.split(/\r?\n/).map(l => {
    const m = l.match(/\[(\d+):(\d+(\.\d+)?)\](.*)/);
    if (!m) return null;
    return { tiempo: +m[1] * 60 + +m[2], texto: m[4] };
  }).filter(Boolean);
}

function cargarExtra(ruta) {
  fetch(`https://raw.githubusercontent.com/eltioviruelas/eltioviruelas.github.io/main/${ruta}`)
    .then(r => r.text())
    .then(t => extraTexto.textContent = t);
}
