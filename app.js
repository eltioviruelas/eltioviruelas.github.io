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
const pot = document.getElementById('potenciometro');
const marca = pot.querySelector('.marca');

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
    console.error('Error cargando JSON', e);
  }
}
init();

/* ================= VOLUMENES ================= */

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

  mostrarPortadas(data.volumenes[i]);
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

  audio.src = c.audio;
  galleta.src = c.galleta;

  vinilo.className = 'vinilo rapido';
  wrapper.className = 'vinilo-wrapper rapido';

  brazo.style.transform = 'rotate(-35deg)';

  cargarLetra(c.letra);
  cargarExtra(c.extra);

  audio.currentTime = 0;
  audio.play();
}

/* ================= LETRAS ================= */

function cargarLetra(url) {
  const raw = `https://raw.githubusercontent.com/eltioviruelas/eltioviruelas.github.io/main/${url}`;

  fetch(raw)
    .then(r => r.text())
    .then(t => {
      subtitulos = parseLRC(t);
      subIndex = 0;
      letraTexto.innerHTML = '';
    })
    .catch(e => console.error('Error letra', e));
}

function parseLRC(texto) {
  return texto
    .split(/\r?\n/)
    .map(l => {
      const m = /\[(\d{2}):(\d{2}\.\d{2})\](.*)/.exec(l);
      if (!m) return null;
      return {
        tiempo: parseInt(m[1]) * 60 + parseFloat(m[2]),
        texto: m[3].trim()
      };
    })
    .filter(Boolean);
}

/* ================= EXTRA ================= */

function cargarExtra(url) {
  const raw = `https://raw.githubusercontent.com/eltioviruelas/eltioviruelas.github.io/main/${url}`;
  fetch(raw)
    .then(r => r.text())
    .then(t => extraTexto.textContent = t);
}

/* ================= SUBTÍTULOS ================= */

audio.addEventListener('timeupdate', () => {
  if (!subtitulos.length) return;

  const t = audio.currentTime;

  if (subIndex < subtitulos.length - 1 &&
      t >= subtitulos[subIndex + 1].tiempo) {
    subIndex++;
  }

  const prev = subtitulos[subIndex - 1]?.texto || '';
  const cur = subtitulos[subIndex]?.texto || '';

  letraTexto.innerHTML = `
    <div class="sub-previa">${prev}</div>
    <div class="sub-actual">${cur}</div>
  `;
});

/* ================= PLAY / PAUSE ================= */

playpause.addEventListener('click', () => {
  if (audio.paused) audio.play();
  else audio.pause();
});

audio.addEventListener('play', () => {
  playpause.textContent = '⏸';
  brazo.style.transform = 'rotate(-10deg)';
});

audio.addEventListener('pause', () => {
  playpause.textContent = '▶';
  brazo.style.transform = 'rotate(-35deg)';
});

/* ================= POTENCIÓMETRO ================= */

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

  const r = pot.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;

  const x = e.touches ? e.touches[0].clientX : e.clientX;
  const y = e.touches ? e.touches[0].clientY : e.clientY;

  const ang = Math.atan2(y - cy, x - cx) * 180 / Math.PI;
  const limitado = Math.max(-120, Math.min(120, ang));

  marca.style.transform = `translateX(-50%) rotate(${limitado}deg)`;
  audio.volume = (limitado + 120) / 240;
}
