let data;
const audio = document.getElementById('audio');
const vinilo = document.getElementById('vinilo');
const brazo = document.getElementById('brazo');
const galleta = document.getElementById('galleta');

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
  mostrarPortadas(data.volumenes[i]);
}

function mostrarPortadas(vol) {
  const p = document.getElementById('portadas');
  p.innerHTML = '';
  vol.canciones.forEach(c => {
    const d = document.createElement('div');
    d.className = 'portada';
    d.innerHTML = `<img src="${c.galleta}">`;
    d.onclick = () => reproducir(c);
    p.appendChild(d);
  });
}

function reproducir(c) {
  audio.src = c.audio;
  audio.play();

  galleta.src = c.galleta;
  vinilo.classList.remove('lento');
  vinilo.classList.add('rapido');
  brazo.style.transform = 'rotate(-8deg)';
}

audio.onpause = () => {
  vinilo.classList.remove('rapido');
  vinilo.classList.add('lento');
  brazo.style.transform = 'rotate(-30deg)';
};
