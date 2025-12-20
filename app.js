let data;
let audio = document.getElementById('audio');
let vinilo = document.getElementById('vinilo-central');
let brazo = document.getElementById('brazo');

fetch('data/volumenes.json')
  .then(r => r.json())
  .then(j => {
    data = j;
    crearBotones();
    seleccionarVol(0);
  });

function crearBotones() {
  const c = document.getElementById('volumenes-container');
  c.innerHTML = '';
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

  moverAguja(i);
  mostrarPortadas(data.volumenes[i]);
}

function moverAguja(i) {
  const min = -40, max = 40;
  const deg = min + (max - min) * (i / (data.volumenes.length - 1 || 1));
  document.getElementById('aguja').style.transform = `rotate(${deg}deg)`;
}

function mostrarPortadas(vol) {
  const p = document.getElementById('portadas');
  p.innerHTML = '';
  vol.canciones.forEach(c => {
    const d = document.createElement('div');
    d.className = 'portada';
    d.innerHTML = `<img src="${c.galleta}"><p>${c.titulo}</p>`;
    d.onclick = () => reproducir(c);
    p.appendChild(d);
  });
}

function reproducir(c) {
  audio.src = c.audio;
  audio.play();

  vinilo.style.animationPlayState = 'running';
  brazo.style.transform = 'rotate(-5deg)';

  cargar(c.letra, 'letra-texto');
  cargar(c.extra, 'extra-texto');
}

function cargar(url, id) {
  fetch(url)
    .then(r => r.text())
    .then(t => document.getElementById(id).textContent = t)
    .catch(() => document.getElementById(id).textContent = '');
}

document.getElementById('play').onclick = () => audio.play();
document.getElementById('pause').onclick = () => audio.pause();

audio.onpause = () => {
  vinilo.style.animationPlayState = 'paused';
  brazo.style.transform = 'rotate(-25deg)';
};
