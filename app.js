let data;
const audio = document.getElementById('audio');
const vinilo = document.getElementById('vinilo');
const brazo = document.getElementById('brazo');
const galleta = document.getElementById('galleta');
const aguja = document.getElementById('aguja');
const pot = document.getElementById('potenciometro');
const marca = pot.querySelector('.marca');

let volumen = 0.8;
audio.volume = volumen;

fetch('data/volumenes.json')
  .then(r => r.json())
  .then(j => {
    data = j;
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
  const deg = min + (max - min) * (i / (data.volumenes.length - 1 || 1));
  aguja.style.transform = `rotate(${deg}deg)`;

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

function reproducir(c) {
  brazo.style.transform = 'rotate(-35deg)';

  setTimeout(() => {
    audio.src = c.audio;
    audio.play();

    galleta.src = c.galleta;
    vinilo.classList.remove('lento');
    vinilo.classList.add('rapido');
    brazo.style.transform = 'rotate(-10deg)';
  }, 350);

  cargar(c.letra, 'letra-texto');
  cargar(c.extra, 'extra-texto');
}

function cargar(url, id) {
  fetch(url)
    .then(r => r.text())
    .then(t => document.getElementById(id).textContent = t);
}

/* CONTROLES */
document.getElementById('play').onclick = () => audio.play();
document.getElementById('pause').onclick = () => audio.pause();

audio.onpause = () => {
  vinilo.classList.remove('rapido');
  vinilo.classList.add('lento');
  brazo.style.transform = 'rotate(-35deg)';
};

/* POTENCIÓMETRO */
let girando = false;

pot.addEventListener('mousedown', () => girando = true);
document.addEventListener('mouseup', () => girando = false);

document.addEventListener('mousemove', e => {
  if (!girando) return;
  const rect = pot.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const ang = Math.atan2(e.clientY - cy, e.clientX - cx) * 180 / Math.PI;
  const limitado = Math.max(-120, Math.min(120, ang));

  marca.style.transform = `translateX(-50%) rotate(${limitado}deg)`;
  volumen = (limitado + 120) / 240;
  audio.volume = volumen;
});

/* BLOQUEOS */
document.addEventListener('contextmenu', e => e.preventDefault());
