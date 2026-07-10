"use strict";

// Ötödölő (amőba / gomoku) – két játékos egy gépen, felváltva.
// Cél: öt egyforma jel egy sorban (vízszintes, függőleges vagy átlós).

const WIN_LENGTH = 5;

const el = {
  board: document.getElementById("board"),
  sizeSelect: document.getElementById("sizeSelect"),
  undoBtn: document.getElementById("undoBtn"),
  newRoundBtn: document.getElementById("newRoundBtn"),
  resetScoreBtn: document.getElementById("resetScoreBtn"),
  nameX: document.getElementById("nameX"),
  nameO: document.getElementById("nameO"),
  scoreX: document.getElementById("scoreX"),
  scoreO: document.getElementById("scoreO"),
  cardX: document.getElementById("cardX"),
  cardO: document.getElementById("cardO"),
  overlay: document.getElementById("overlay"),
  modalMark: document.getElementById("modalMark"),
  modalTitle: document.getElementById("modalTitle"),
  modalText: document.getElementById("modalText"),
  modalBtn: document.getElementById("modalBtn"),
};

const MARKS = { X: "✕", O: "◯" };

const state = {
  size: 15,
  cells: [],          // 1D tömb: null | "X" | "O"
  current: "X",
  moves: [],          // lépés-index history az undóhoz
  over: false,
  scores: { X: 0, O: 0 },
  winTimer: null,     // a 3 mp-es késleltetés a győztes ablak előtt
};

const WIN_DELAY_MS = 3000; // ennyit várunk a vonal után, mielőtt feljön a győztes ablak

function clearWinTimer() {
  if (state.winTimer) {
    clearTimeout(state.winTimer);
    state.winTimer = null;
  }
}

function nameOf(player) {
  return (player === "X" ? el.nameX.value : el.nameO.value).trim() || (player === "X" ? "Játékos 1" : "Játékos 2");
}

function buildBoard(size) {
  clearWinTimer();
  state.size = size;
  state.cells = new Array(size * size).fill(null);
  state.current = "X";
  state.moves = [];
  state.over = false;

  el.board.style.setProperty("--n", String(size));
  el.board.innerHTML = ""; // ez a győztes vonalat (SVG) is eltávolítja

  const frag = document.createDocumentFragment();
  for (let i = 0; i < size * size; i++) {
    const btn = document.createElement("button");
    btn.className = "cell";
    btn.type = "button";
    btn.dataset.i = String(i);
    btn.setAttribute("role", "gridcell");
    btn.addEventListener("click", onCellClick);
    frag.appendChild(btn);
  }
  el.board.appendChild(frag);
  updateTurnUI();
}

function onCellClick(e) {
  if (state.over) return;
  const i = Number(e.currentTarget.dataset.i);
  if (state.cells[i] !== null) return;

  const player = state.current;
  state.cells[i] = player;
  state.moves.push(i);

  const cell = e.currentTarget;
  cell.textContent = MARKS[player];
  cell.classList.add(player.toLowerCase());

  const line = findWinningLine(i, player);
  if (line) {
    endRound(player, line);
    return;
  }
  if (state.moves.length === state.cells.length) {
    endRound(null, null); // döntetlen
    return;
  }

  state.current = player === "X" ? "O" : "X";
  updateTurnUI();
}

// Az utolsó lerakott jelből kiindulva keresünk 5 hosszú sort mind a 4 irányban.
function findWinningLine(index, player) {
  const size = state.size;
  const row = Math.floor(index / size);
  const col = index % size;
  const dirs = [
    [0, 1],   // vízszintes
    [1, 0],   // függőleges
    [1, 1],   // átló ↘
    [1, -1],  // átló ↗
  ];

  for (const [dr, dc] of dirs) {
    const line = [index];
    // egyik irány
    for (let s = 1; s < WIN_LENGTH; s++) {
      const r = row + dr * s, c = col + dc * s;
      if (r < 0 || r >= size || c < 0 || c >= size || state.cells[r * size + c] !== player) break;
      line.push(r * size + c);
    }
    // ellenirány
    for (let s = 1; s < WIN_LENGTH; s++) {
      const r = row - dr * s, c = col - dc * s;
      if (r < 0 || r >= size || c < 0 || c >= size || state.cells[r * size + c] !== player) break;
      line.unshift(r * size + c);
    }
    if (line.length >= WIN_LENGTH) return line;
  }
  return null;
}

function endRound(winner, line) {
  state.over = true;
  el.board.classList.add("locked");

  if (winner) {
    state.scores[winner]++;
    (winner === "X" ? el.scoreX : el.scoreO).textContent = String(state.scores[winner]);
    if (line) {
      for (const idx of line) {
        el.board.children[idx].classList.add("win");
      }
      drawWinLine(line, winner);
    }
    const name = nameOf(winner);
    // Előbb a vonal látszik, csak 3 mp múlva ugrik fel a győztes ablak.
    state.winTimer = setTimeout(() => {
      state.winTimer = null;
      showModal(winner, `${name} nyert!`, "Győzelem!");
    }, WIN_DELAY_MS);
  } else {
    state.winTimer = setTimeout(() => {
      state.winTimer = null;
      showModal(null, "Nem fért el több jel a táblán.", "Döntetlen");
    }, WIN_DELAY_MS);
  }
  el.cardX.classList.remove("active");
  el.cardO.classList.remove("active");
}

// Egy vonalat húz az 5 nyerő jelen keresztül, kirajzolódó animációval.
function drawWinLine(line, winner) {
  const first = el.board.children[line[0]];
  const last = el.board.children[line[line.length - 1]];
  if (!first || !last) return;

  const b = el.board.getBoundingClientRect();
  const f = first.getBoundingClientRect();
  const l = last.getBoundingClientRect();
  const x1 = f.left + f.width / 2 - b.left;
  const y1 = f.top + f.height / 2 - b.top;
  const x2 = l.left + l.width / 2 - b.left;
  const y2 = l.top + l.height / 2 - b.top;

  const W = el.board.clientWidth;
  const H = el.board.clientHeight;
  const strokeW = Math.max(3, f.width * 0.18);
  const NS = "http://www.w3.org/2000/svg";

  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("class", "winline");
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.setAttribute("preserveAspectRatio", "none");

  const ln = document.createElementNS(NS, "line");
  ln.setAttribute("x1", x1);
  ln.setAttribute("y1", y1);
  ln.setAttribute("x2", x2);
  ln.setAttribute("y2", y2);
  ln.setAttribute("stroke-width", strokeW);
  const color = winner === "X" ? "var(--x)" : "var(--o)";
  ln.style.stroke = color;

  const len = Math.hypot(x2 - x1, y2 - y1);
  ln.style.strokeDasharray = String(len);
  ln.style.strokeDashoffset = String(len);

  svg.appendChild(ln);
  el.board.appendChild(svg);

  // A következő frame-ben indul a kirajzolódás (CSS transition).
  requestAnimationFrame(() => { ln.style.strokeDashoffset = "0"; });
}

function updateTurnUI() {
  el.board.classList.toggle("turn-x", state.current === "X");
  el.board.classList.toggle("turn-o", state.current === "O");
  el.cardX.classList.toggle("active", state.current === "X");
  el.cardO.classList.toggle("active", state.current === "O");
}

function undo() {
  if (state.moves.length === 0) return;
  const wasOver = state.over;
  const last = state.moves.pop();
  const player = state.cells[last];
  state.cells[last] = null;

  const cell = el.board.children[last];
  cell.textContent = "";
  cell.classList.remove("x", "o");

  if (wasOver) {
    // győzelem visszavonása: pont vissza, kiemelés + vonal törlése, folytatható a játszma
    clearWinTimer();
    if (player) {
      state.scores[player] = Math.max(0, state.scores[player] - 1);
      (player === "X" ? el.scoreX : el.scoreO).textContent = String(state.scores[player]);
    }
    for (const c of el.board.querySelectorAll(".cell.win")) c.classList.remove("win");
    for (const s of el.board.querySelectorAll(".winline")) s.remove();
    el.board.classList.remove("locked");
    state.over = false;
    hideModal();
  }
  state.current = player; // az visszakerül, aki lépett
  updateTurnUI();
}

function showModal(winner, text, title) {
  el.modalMark.textContent = winner ? MARKS[winner] : "🤝";
  el.modalMark.style.color = winner === "X" ? "var(--x)" : winner === "O" ? "var(--o)" : "var(--muted)";
  el.modalTitle.textContent = title;
  el.modalText.textContent = text;
  el.overlay.hidden = false;
}
function hideModal() { el.overlay.hidden = true; }

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (ch) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]
  ));
}

// Eseménykezelők
el.sizeSelect.addEventListener("change", () => buildBoard(Number(el.sizeSelect.value)));
el.newRoundBtn.addEventListener("click", () => { hideModal(); buildBoard(state.size); });
el.modalBtn.addEventListener("click", () => { hideModal(); buildBoard(state.size); });
el.undoBtn.addEventListener("click", undo);
el.resetScoreBtn.addEventListener("click", () => {
  state.scores = { X: 0, O: 0 };
  el.scoreX.textContent = "0";
  el.scoreO.textContent = "0";
});
el.nameX.addEventListener("input", () => { if (!state.over) updateTurnUI(); });
el.nameO.addEventListener("input", () => { if (!state.over) updateTurnUI(); });

// Indítás
buildBoard(15);
