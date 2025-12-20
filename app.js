let data;
let indiceVolumen = 0;

fetch('data/volumenes.json')
  .then(res => res.json())
  .then(json => {
    data = json;
    renderVolumenes();
    seleccionarVolumen(0);
  });
function renderVolumenes() {
  const cont = document.getElementById('volumenes-container');
  cont.innerHTML = '';

  data.volumenes.forEach((vol, i) => {
    const btn = document.createElement('button');
    btn.className = 'volumen-btn';
    btn.textContent = vol.titulo;
    btn.onclick = () => seleccionarVolumen(i);
    cont.appendChild(btn);
  });
}
function seleccionarVolumen(i) {
  indiceVolumen = i;

  document.querySelectorAll('.volumen-btn').forEach((b, idx) => {
    b.classList.toggle('activo', idx === i);
  });

  moverAguja(i);
  renderPortadas(data.volumenes[i]);
}
function moverAguja(i) {
  const total = data.volumenes.length;
  const min = -40;
  const max = 40;
  const grados = min + (max - min) * (i / (total - 1 || 1));

  document.getElementById('aguja')
    .style.transform = `rotate(${grados}deg)`;
}
function renderPortadas(vol) {
  const cont = document.getElementById('portadas');
  cont.innerHTML = '';

  vol.canciones.forEach(c => {
    const div = document.createElement('div');
    div.className = 'portada';

    div.innerHTML = `
      <img src="${c.portada}" alt="${c.titulo}">
      <p>${c.titulo}</p>
    `;

    div.onclick = () => cargarCancion(c);
    cont.appendChild(div);
  });
}
function cargarCancion(c) {
  const audio = document.getElementById('audio');
  audio.src = c.archivo;
  audio.play();

  document.getElementById('tema-actual').textContent = c.titulo;

  cargarTexto(c.letra, 'letra-texto');
  cargarTexto(c.extra, 'extra-texto');
}

function cargarTexto(url, destino) {
  fetch(url)
    .then(r => r.text())
    .then(t => document.getElementById(destino).textContent = t)
    .catch(() => {
      document.getElementById(destino).textContent = '';
    });
}

const audio = document.getElementById('audio');
const viniloCentral = document.getElementById('vinilo-central');
const brazo = document.getElementById('brazo');

document.getElementById('play').onclick = () => audio.play();
document.getElementById('pause').onclick = () => audio.pause();

document.getElementById('volumen').oninput = e => {
  audio.volume = e.target.value;
};

audio.onplay = () => {
  viniloCentral.style.animationPlayState = 'running';
  brazo.style.transform = 'rotate(-5deg)';
};

audio.onpause = () => {
  viniloCentral.style.animationPlayState = 'paused';
  brazo.style.transform = 'rotate(-25deg)';
};
