'use strict';

const sky = document.querySelector('.sky');
const input = document.querySelector('#file-input');
const dropZone = document.querySelector('#drop-zone');
const progressBar = document.querySelector('[role="progressbar"]');
const fill = document.querySelector('.progress-fill');
const progressLabel = document.querySelector('#progress-label');
const liveStatus = document.querySelector('#live-status');
const flight = document.querySelector('#balloon-flight');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const MAX_BYTES = 25 * 1024 * 1024;
let state = 'idle';
let progress = 0;
let runId = 0;
let frame = 0;
let visitTimeout;
let paused = reducedMotion.matches;
let dragDepth = 0;

function setState(next) {
  state = next;
  sky.dataset.state = next;
  document.querySelector('#idle-view').hidden = next !== 'idle';
  document.querySelector('#upload-view').hidden = next !== 'uploading';
  document.querySelector('#result-view').hidden = !['success', 'error'].includes(next);
  document.querySelector('#play-demo').disabled = next !== 'idle';
  document.querySelector('.balloon-hit').disabled = next !== 'idle';
}

function reset() {
  runId++;
  cancelAnimationFrame(frame);
  stopVisitor();
  input.value = '';
  progress = 0;
  fill.style.width = '0%';
  progressBar.setAttribute('aria-valuenow', '0');
  flight.style.setProperty('--flight-y', '70px');
  flight.style.setProperty('--flight-x', '0px');
  sky.classList.remove('is-dragging');
  dragDepth = 0;
  setState('idle');
}

function showResult(kind, title, description) {
  setState(kind);
  document.querySelector('#result-title').textContent = title;
  document.querySelector('#result-description').textContent = description;
  document.querySelector('#try-again').textContent = kind === 'success' ? 'Upload another' : 'Try again';
  liveStatus.textContent = `${title} ${description}`;
  document.querySelector('#try-again').focus({ preventScroll: true });
}

function acceptedFile(file) {
  return /^image\//i.test(file.type || '') || /\.(pdf|zip|png|jpe?g|gif|webp|avif|svg|bmp|tiff?|heic)$/i.test(file.name || '') || ['application/pdf', 'application/zip', 'application/x-zip-compressed'].includes(file.type);
}

function startFlight(file, heavyDemo = false) {
  if (state !== 'idle') return;
  reset();
  if (!acceptedFile(file) && !heavyDemo) {
    showResult('error', 'This one needs a different ride.', 'Choose a PDF, an image or a ZIP file.');
    return;
  }
  const overweight = file.size > MAX_BYTES;
  const currentRun = ++runId;
  setState('uploading');
  sky.classList.remove('is-visited');
  liveStatus.textContent = `Taking ${file.name} for a flight.`;
  const duration = reducedMotion.matches ? 1700 : 5800;
  let previous = performance.now();
  let elapsed = 0;
  function tick(now) {
    if (currentRun !== runId) return;
    const delta = Math.min(now - previous, 100);
    previous = now;
    if (!paused || reducedMotion.matches) elapsed += delta;
    progress = Math.min(100, Math.round(elapsed / duration * 100));
    fill.style.width = `${progress}%`;
    progressBar.setAttribute('aria-valuenow', String(progress));
    progressLabel.textContent = `Uploading ${file.name} · ${progress}%`;
    flight.style.setProperty('--flight-y', `${70 - progress * 3.25}px`);
    flight.style.setProperty('--flight-x', `${progress * .13}px`);
    if (overweight && progress >= 38) {
      showResult('error', 'Over 25 MB: too heavy for the balloon.', 'Try a lighter file.');
      return;
    }
    if (progress >= 100) {
      showResult('success', 'Done, your file has landed!', 'Demo complete. Your file stays on this device.');
      return;
    }
    frame = requestAnimationFrame(tick);
  }
  frame = requestAnimationFrame(tick);
}

function pickFile() { if (state === 'idle') input.click(); }
document.querySelector('#choose-file').addEventListener('click', pickFile);
dropZone.addEventListener('click', pickFile);
input.addEventListener('change', () => { if (input.files[0]) startFlight(input.files[0]); });
document.querySelector('#heavy-file').addEventListener('click', () => startFlight({ name: 'final-video.mov', size: 40 * 1024 * 1024 }, true));
document.querySelector('#play-demo').addEventListener('click', () => startFlight({ name: 'globo-proposal.pdf', type: 'application/pdf', size: 2.4 * 1024 * 1024 }));
document.querySelector('#cancel-upload').addEventListener('click', () => { reset(); liveStatus.textContent = 'Flight cancelled. Choose another file when you are ready.'; document.querySelector('#choose-file').focus({ preventScroll: true }); });
document.querySelector('#try-again').addEventListener('click', () => { reset(); document.querySelector('#choose-file').focus({ preventScroll: true }); });

window.addEventListener('dragenter', event => { event.preventDefault(); if (state === 'idle' && event.dataTransfer.types.includes('Files')) { dragDepth++; sky.classList.add('is-dragging'); } });
window.addEventListener('dragover', event => { event.preventDefault(); if (event.dataTransfer) event.dataTransfer.dropEffect = state === 'idle' ? 'copy' : 'none'; });
window.addEventListener('dragleave', event => { event.preventDefault(); dragDepth = Math.max(0, dragDepth - 1); if (!dragDepth) sky.classList.remove('is-dragging'); });
window.addEventListener('drop', event => {
  event.preventDefault(); dragDepth = 0; sky.classList.remove('is-dragging');
  if (state !== 'idle') return;
  const files = event.dataTransfer.files;
  if (files.length > 1) { showResult('error', 'One little parcel at a time.', 'Please choose a single file for this flight.'); return; }
  if (files[0]) startFlight(files[0]);
});

function stopVisitor() { clearTimeout(visitTimeout); sky.classList.remove('is-visited'); }
function visit() {
  if (state !== 'idle' || paused || reducedMotion.matches || sky.classList.contains('is-visited')) return;
  sky.classList.add('is-visited');
  visitTimeout = setTimeout(() => sky.classList.remove('is-visited'), 8100);
}
document.querySelector('.balloon-hit').addEventListener('click', visit);
setTimeout(visit, 18000);
setInterval(() => { if (!document.hidden) visit(); }, 42000);

window.addEventListener('pointermove', event => {
  if (reducedMotion.matches || paused) return;
  const x = (event.clientX / window.innerWidth - .5) * 10;
  const y = (event.clientY / window.innerHeight - .5) * 9;
  sky.style.setProperty('--eye-x', `${x.toFixed(1)}px`);
  sky.style.setProperty('--eye-y', `${y.toFixed(1)}px`);
}, { passive: true });

function updateMotion() {
  sky.classList.toggle('is-paused', paused);
  sky.classList.toggle('is-reduced', reducedMotion.matches);
  const toggle = document.querySelector('#motion-toggle');
  toggle.setAttribute('aria-pressed', String(paused));
  toggle.setAttribute('aria-label', paused ? 'Resume animations' : 'Pause animations');
}
document.querySelector('#motion-toggle').addEventListener('click', () => { paused = !paused; updateMotion(); });
reducedMotion.addEventListener('change', () => { paused = reducedMotion.matches; stopVisitor(); updateMotion(); });
updateMotion();

// A deterministic paper grain is drawn once, never during the animation loop.
function drawPaper() {
  const canvas = document.querySelector('#paper-texture');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const width = Math.min(window.innerWidth, 2000);
  const height = Math.min(sky.clientHeight, 1400);
  canvas.width = width; canvas.height = height;
  let seed = 118;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const grain = ctx.createImageData(width, height);
  for (let i = 0; i < grain.data.length; i += 4) {
    const v = random() > .48 ? 255 : 0;
    grain.data[i] = grain.data[i + 1] = grain.data[i + 2] = v;
    grain.data[i + 3] = random() * 22;
  }
  ctx.putImageData(grain, 0, 0);
  for (let c = 0; c < width * height / 9500; c++) {
    const cx = random() * width, cy = random() * height;
    const radius = 14 + random() * 65;
    for (let p = 0; p < 65; p++) {
      const angle = random() * Math.PI * 2, r = random() * radius;
      const x = cx + Math.cos(angle) * r, y = cy + Math.sin(angle) * r;
      ctx.fillStyle = `rgba(255,245,220,${.12 + random() * .5})`;
      ctx.fillRect(x, y, .4 + random() * 1.8, .5 + random() * 1.3);
    }
  }
}
let resizeTimeout;
window.addEventListener('resize', () => { clearTimeout(resizeTimeout); resizeTimeout = setTimeout(drawPaper, 180); });
drawPaper();
