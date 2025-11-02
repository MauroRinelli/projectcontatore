// Stato timer
let remaining = 0;       // secondi rimasti
let intervalId = null;   // riferimento setInterval
let isPaused = false;    // flag pausa

// Riferimenti DOM
const input = document.getElementById('secondsInput');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const display = document.getElementById('timerDisplay');
const statusText = document.getElementById('statusText');

// Utils
function formatTime(totalSeconds) {
  const mm = Math.floor(totalSeconds / 60);
  const ss = totalSeconds % 60;
  const mmStr = String(mm).padStart(2, '0');
  const ssStr = String(ss).padStart(2, '0');
  return `${mmStr}:${ssStr}`;
}

function updateDisplay() {
  display.textContent = formatTime(remaining);
}

function setStatus(msg) {
  statusText.textContent = msg;
}

function setButtonsState({ startDisabled, pauseDisabled, resetDisabled }) {
  startBtn.disabled = !!startDisabled;
  pauseBtn.disabled = !!pauseDisabled;
  resetBtn.disabled = !!resetDisabled;
}

// Logica countdown
function tick() {
  if (remaining > 0) {
    remaining--;
    updateDisplay();
    if (remaining === 0) {
      clearInterval(intervalId);
      intervalId = null;
      isPaused = false;
      setStatus('Completo');
      setButtonsState({ startDisabled: false, pauseDisabled: true, resetDisabled: false });
    }
  }
}

function startTimer() {
  // Se timer già in corso, non fare nulla
  if (intervalId) return;

  // Se era in pausa, riprende dai secondi rimasti
  if (isPaused && remaining > 0) {
    intervalId = setInterval(tick, 1000);
    isPaused = false;
    setStatus('In esecuzione (ripreso)');
    setButtonsState({ startDisabled: true, pauseDisabled: false, resetDisabled: false });
    return;
  }

  // Nuova partenza
  const raw = input.value.trim();
  const value = Number(raw);

  if (!Number.isFinite(value) || value < 0 || !Number.isInteger(value)) {
    setStatus('Valore non valido. Inserisci un intero ≥ 0.');
    return;
  }

  remaining = value;
  updateDisplay();

  if (remaining === 0) {
    setStatus('Nulla da contare (0 secondi).');
    setButtonsState({ startDisabled: false, pauseDisabled: true, resetDisabled: false });
    return;
  }

  intervalId = setInterval(tick, 1000);
  isPaused = false;
  setStatus('In esecuzione');
  setButtonsState({ startDisabled: true, pauseDisabled: false, resetDisabled: false });
}

function pauseTimer() {
  if (!intervalId) return; // già in pausa o non avviato
  clearInterval(intervalId);
  intervalId = null;
  isPaused = true;
  setStatus('In pausa');
  setButtonsState({ startDisabled: false, pauseDisabled: true, resetDisabled: false });
}

function resetTimer() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  input.value = '';
  remaining = 0;
  isPaused = false;
  updateDisplay();
  setStatus('Pronto');
  setButtonsState({ startDisabled: false, pauseDisabled: true, resetDisabled: true });
}

// Bind eventi
startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', pauseTimer);
resetBtn.addEventListener('click', resetTimer);

// Stato iniziale UI
updateDisplay();
setButtonsState({ startDisabled: false, pauseDisabled: true, resetDisabled: true });

// EXTRA UX: invio con Enter avvia, Esc fa reset
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') startTimer();
  if (e.key === 'Escape') resetTimer();
});
