let data;
const audio = document.getElementById('audio');
const vinilo = document.getElementById('vinilo');
const wrapper = document.getElementById('viniloWrapper');
const brazo = document.getElementById('brazo');
const galleta = document.getElementById('galleta');
const aguja = document.getElementById('aguja');
const letraTexto = document.getElementById('letra-texto');
const extraTexto = document.getElementById('extra-texto');

// Cargar JSON con async/await
async function init() {
  try {
    const res = await fetch('data/volumenes.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    data = await res.json();

    vinilo?.classList.add('lento');
    wrapper?.classList.add('lento');

    crearBotones();
    seleccionarVol(0);
  } catch (err) {
    console.error('Error cargando volumenes.json', err);
  }
}
init();

// Crear botones de volúmenes
function crearBotones() {
  const contVolumenes = document.getElementById('volumenes-container');
  contVolumenes.innerHTML = '';
  data.volumenes.forEach((v, i) => {
    const b = document.createElement('button');
    b.className = 'volumen-btn';
    b.textContent = v.titulo;
    b.onclick = () => seleccionarVol(i);
    contVolumenes.appendChild(b);
  });
}

// Seleccionar volumen (grupo)
function seleccionarVol(i) {
  document.querySelectorAll('.volumen-btn')
    .forEach((b, idx) => b.classList.toggle('activo', idx === i));

  if (!data?.volumenes?.length) return;

  const min = -40, max = 40;
  const base = min + (max - min) * (i / (data.volumenes.length - 1 || 1));
  aguja.style.setProperty('--base-angle', base + 'deg');
  aguja.style.transform = `rotate(${base}deg)`;

  mostrarPortadas(data.volumenes[i]);
}

// Mostrar portadas
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

// Reproducir canción
function reproducir(c) {
  brazo.style.transform = 'rotate(-35deg)';
  audio.src = c.audio;
  audio.play();
  galleta.src = c.galleta;
  vinilo.className = 'vinilo rapido';
  wrapper.className = 'vinilo-wrapper rapido';
  brazo.style.transform = 'rotate(-10deg)';

  cargarLetra(c.letra); // Cargar subtítulos
  cargarExtra(c.extra); // Cargar extras
}

// Cargar letra (subtítulos)
function cargarLetra(url) {
  fetch(url)
    .then(r => r.text())
    .then(t => {
      subtitulos = parseLRC(t); // Parsear los subtítulos LRC
      subIndex = 0;
      letraTexto.innerHTML = '';
    })
    .catch(err => console.error('Error cargando letra', err));
}

// Cargar extra
function cargarExtra(url) {
  fetch(url)
    .then(r => r.text())
    .then(t => extraTexto.textContent = t)
    .catch(err => console.error('Error cargando extra', err));
}

// Sincronización de subtítulos
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

// Función para parsear el formato LRC
function parseLRC(texto) {
  const lineas = texto.split(/\r?\n/);
  const subs = [];
  lineas.forEach(l => {
    const match = /\[(\d{1,2}):(\d{2}([.,]\d{1,3})?)\](.*)/.exec(l);
    if (match) {
      const min = parseInt(match[1], 10);
      const sec = parseFloat(match[2].replace(',', '.'));
      const texto = match[4];
      const tiempo = min * 60 + sec;
      subs.push({ tiempo, texto });
    }
  });
  return subs.sort((a, b) => a.tiempo - b.tiempo);
}
