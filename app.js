// Register service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}

// ── DOM refs ──────────────────────────────────────────────
const chooseButton = document.getElementById('chooseButton');
const resultElement = document.getElementById('result');
const resultImg = document.getElementById('resultImg');
const resultImgPlaceholder = document.getElementById('resultImgPlaceholder');
const resultName = document.getElementById('resultName');
const resultDescription = document.getElementById('resultDescription');
const resultFooter = document.getElementById('resultFooter');
const loadingElement = document.getElementById('loading');
const errorElement = document.getElementById('errorMessage');

// ── State ─────────────────────────────────────────────────
let games = [];
let lastPickIndex = null;

// ── Load games.json on startup ────────────────────────────
async function loadGames() {
  try {
    const res = await fetch('games.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    games = await res.json();
    if (!Array.isArray(games) || games.length === 0) {
      throw new Error('games.json must be a non-empty array');
    }
  } catch (err) {
    showError(`FAILED TO LOAD GAMES\n${err.message}`);
    chooseButton.disabled = true;
  }
}

// ── Pick a random game (avoid repeating last pick) ────────
function pickGame() {
  if (games.length === 1) return 0;
  let idx;
  do { idx = Math.floor(Math.random() * games.length); }
  while (idx === lastPickIndex);
  return idx;
}

// ── Render the result card ────────────────────────────────
function showResult(game) {
  // Reset card animation by toggling class
  resultElement.classList.remove('visible');
  void resultElement.offsetWidth; // reflow to restart animation
  resultElement.classList.add('visible');

  resultName.textContent = game.name ?? 'UNKNOWN GAME';
  resultDescription.textContent = game.description ?? '';
  resultFooter.textContent = game.genre
    ? `GENRE: ${game.genre.toUpperCase()}`
    : `${games.length} GAMES IN THE LIST`;

  // Image handling
  if (game.image) {
    resultImg.style.display = 'block';
    resultImgPlaceholder.style.display = 'none';
    resultImg.src = game.image;
    resultImg.alt = game.name ?? '';
    resultImg.onerror = () => {
      resultImg.style.display = 'none';
      resultImgPlaceholder.style.display = 'flex';
    };
  } else {
    resultImg.style.display = 'none';
    resultImgPlaceholder.style.display = 'flex';
  }
}

// ── Error display ─────────────────────────────────────────
function showError(msg) {
  errorElement.textContent = msg;
  errorElement.classList.add('visible');
}

function clearError() {
  errorElement.textContent = '';
  errorElement.classList.remove('visible');
}

// ── Button handler ────────────────────────────────────────
chooseButton.addEventListener('click', () => {
  if (games.length === 0) return;
  clearError();

  const idx = pickGame();
  lastPickIndex = idx;
  showResult(games[idx]);
});

// ── Shake-to-choose (mobile) ──────────────────────────────
(function initShake() {
  const THRESHOLD = 15;
  let lastShake = 0;

  window.addEventListener('devicemotion', (e) => {
    const acc = e.accelerationIncludingGravity;
    if (!acc) return;
    const total = Math.abs(acc.x) + Math.abs(acc.y) + Math.abs(acc.z);
    const now = Date.now();
    if (total > THRESHOLD && now - lastShake > 1000) {
      lastShake = now;
      chooseButton.click();
    }
  });
})();

// ── Init ──────────────────────────────────────────────────
loadGames();
