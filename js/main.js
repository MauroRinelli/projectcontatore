// =====================
// COUNTDOWN
// =====================

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

function setTimerStatus(msg) {
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
      setTimerStatus('Completo');
      setButtonsState({ startDisabled: false, pauseDisabled: true, resetDisabled: false });
    }
  }
}

function startTimer() {
  if (intervalId) return; // già in corso

  // Ripresa dalla pausa
  if (isPaused && remaining > 0) {
    intervalId = setInterval(tick, 1000);
    isPaused = false;
    setTimerStatus('In esecuzione (ripreso)');
    setButtonsState({ startDisabled: true, pauseDisabled: false, resetDisabled: false });
    return;
  }

  // Nuova partenza
  const raw = input.value.trim();
  const value = Number(raw);

  if (!Number.isFinite(value) || value < 0 || !Number.isInteger(value)) {
    setTimerStatus('Valore non valido. Inserisci un intero ≥ 0.');
    return;
  }

  remaining = value;
  updateDisplay();

  if (remaining === 0) {
    setTimerStatus('Nulla da contare (0 secondi).');
    setButtonsState({ startDisabled: false, pauseDisabled: true, resetDisabled: false });
    return;
  }

  intervalId = setInterval(tick, 1000);
  isPaused = false;
  setTimerStatus('In esecuzione');
  setButtonsState({ startDisabled: true, pauseDisabled: false, resetDisabled: false });
}

function pauseTimer() {
  if (!intervalId) return; // già in pausa o non avviato
  clearInterval(intervalId);
  intervalId = null;
  isPaused = true;
  setTimerStatus('In pausa');
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
  setTimerStatus('Pronto');
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


// =====================
// CALCOLATRICE AVANZATA
// =====================

const calcScreen = document.getElementById('calcScreen'); // rinominato (evita conflitto con window.screen)
const calcStatus = document.getElementById('calcStatus');
const keys = document.querySelectorAll('[data-k]');

let expr = '0';        // espressione mostrata
let lastWasEquals = false;

const setCalcStatus = m => { if (calcStatus) calcStatus.textContent = m; };
const showCalc = v => { if (calcScreen) calcScreen.value = v; };

function append(token) {
  if (!calcScreen) return;

  if (lastWasEquals && /[0-9.√(]/.test(token)) { expr = '0'; lastWasEquals = false; }
  if (expr === '0' && /[0-9.]/.test(token)) expr = '';

  switch (token) {
    case 'C':  expr = '0'; break;
    case 'CE': expr = '0'; break;
    case 'DEL': expr = expr.length > 1 ? expr.slice(0, -1) : '0'; break;
    case '±':  expr = toggleSign(expr); break;
    case '√':  expr += '√('; break;
    case 'x2': expr += '**2'; break;
    case 'inv': expr += '1/('; break;
    case 'pow': expr += '^'; break;   // xʸ
    case '×':  expr += '*'; break;
    case '÷':  expr += '/'; break;
    case '=':  return evaluate();
    default:   expr += token;
  }
  showCalc(expr);
  setCalcStatus('OK');
}

function toggleSign(s) {
  // cambia il segno dell'ultimo numero
  const m = s.match(/(-?\d*\.?\d+)(?!.*\d)/);
  if (!m) return s.startsWith('-') ? s.slice(1) : '-' + s;
  const num = m[1].startsWith('-') ? m[1].slice(1) : '-' + m[1];
  return s.slice(0, m.index) + num;
}

function normalize(exp) {
  // traduce simboli in JS sicuro
  let e = exp;

  // percento: 50% -> (50/100)
  e = e.replace(/(\d*\.?\d+)%/g, '($1/100)');

  // potenza ^ -> ** (tra qualsiasi token)
  e = e.replace(/\^/g, '**');

  // √(x) -> Math.sqrt(x
  e = e.replace(/√\(/g, 'Math.sqrt(');

  // (controllo minimo di sicurezza)
  const safe = e.replace(/Math\.sqrt/g, '');
  if (!/^[0-9+\-*/().\s]*$/.test(safe)) {
    throw new Error('Caratteri non ammessi');
  }
  return e;
}

function evaluate() {
  try {
    let e = normalize(expr);
    const result = Function('"use strict";return (' + e + ')')();
    expr = (Number.isFinite(result) ? String(result) : 'NaN');
    showCalc(expr);
    setCalcStatus('Risultato');
    lastWasEquals = true;
  } catch (err) {
    setCalcStatus('Errore');
  }
}

keys.forEach(b => b.addEventListener('click', () => append(b.dataset.k)));


// tastiera fisica — attiva SOLO quando si è sulla calcolatrice
document.addEventListener('keydown', (e) => {
  // se stai scrivendo in un input/textarea che NON è il display della calcolatrice, esci
  const isInputLike = /^(INPUT|TEXTAREA)$/.test(e.target.tagName);
  const isCalcField = (e.target === calcScreen);
  if (isInputLike && !isCalcField) return;

  const map = { '/':'÷', '*':'×', 'Enter':'=', '=':'=', 'Backspace':'DEL' };
  let k = map[e.key] || e.key;

  // accetta numeri, operazioni e tasti supportati
  if (/^[0-9().+\-]$/.test(k) || ['.','DEL','=','Enter'].includes(e.key)) {
    // preveniamo il default solo quando stiamo usando la calcolatrice
    if (!isInputLike || isCalcField) e.preventDefault();
    append(k === 'Enter' ? '=' : k);
  }
});

