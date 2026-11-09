const boardElement = document.getElementById('board');
const cells = [...document.querySelectorAll('.cell')];
const statusElement = document.getElementById('status');
const overlay = document.getElementById('resultOverlay');
const resultTitle = document.getElementById('resultTitle');
const resultMessage = document.getElementById('resultMessage');
const resultSymbol = document.getElementById('resultSymbol');

const mode = sessionStorage.getItem('gameMode') || 'single';
const difficulty = sessionStorage.getItem('difficulty') || 'medium';
const scores = JSON.parse(localStorage.getItem('ticTacToeScores') || '{"wins":0,"losses":0,"draws":0}');

let board = Array(9).fill('');
let currentPlayer = 'X';
let gameOver = false;
let aiThinking = false;

document.getElementById('modeBadge').textContent =
  mode === 'single' ? `IA • ${difficultyLabel(difficulty)}` : '2 jogadores';

function difficultyLabel(value) {
  return ({ easy: 'Fácil', medium: 'Médio', hard: 'Difícil' })[value] || 'Médio';
}

function saveScores() {
  localStorage.setItem('ticTacToeScores', JSON.stringify(scores));
  document.getElementById('wins').textContent = scores.wins;
  document.getElementById('losses').textContent = scores.losses;
  document.getElementById('draws').textContent = scores.draws;
}
saveScores();

function render() {
  cells.forEach((cell, index) => {
    cell.textContent = board[index];
    cell.classList.toggle('x', board[index] === 'X');
    cell.classList.toggle('o', board[index] === 'O');
    cell.disabled = gameOver || aiThinking || board[index] !== '' ||
      (mode === 'single' && currentPlayer === 'O');
  });
}

function getWinner(state) {
  const lines = [
    [0,1,2], [3,4,5], [6,7,8],
    [0,3,6], [1,4,7], [2,5,8],
    [0,4,8], [2,4,6]
  ];
  for (const [a,b,c] of lines) {
    if (state[a] && state[a] === state[b] && state[a] === state[c]) return state[a];
  }
  return null;
}

function finishGame(winner) {
  gameOver = true;
  aiThinking = false;
  if (!winner) {
    scores.draws++;
    resultSymbol.textContent = '🤝';
    resultTitle.textContent = 'Deu velha!';
    resultMessage.textContent = 'A partida terminou empatada.';
  } else {
    const playerWon = mode === 'single' ? winner === 'X' : true;
    if (winner === 'X') scores.wins++;
    else scores.losses++;

    resultSymbol.textContent = '🏆';
    if (mode === 'single') {
      resultTitle.textContent = playerWon ? 'Parabéns! Você ganhou' : 'Você perdeu';
      resultMessage.textContent = playerWon ? 'Você venceu a inteligência artificial!' : 'A inteligência artificial venceu desta vez.';
    } else {
      resultTitle.textContent = `Parabéns! Jogador ${winner} venceu`;
      resultMessage.textContent = `Jogador ${winner} ganhou a partida.`;
    }
  }
  saveScores();
  render();
  overlay.hidden = false;
}

function checkEnd() {
  const winner = getWinner(board);
  if (winner) { finishGame(winner); return true; }
  if (board.every(cell => cell !== '')) { finishGame(null); return true; }
  return false;
}

function makeMove(index) {
  if (gameOver || aiThinking || board[index] !== '') return;
  board[index] = currentPlayer;
  if (checkEnd()) return;

  if (mode === 'single') {
    currentPlayer = 'O';
    statusElement.textContent = 'A IA está pensando...';
    aiThinking = true;
    render();
    window.setTimeout(playAI, 450);
  } else {
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    statusElement.textContent = `Vez do jogador ${currentPlayer}.`;
    render();
  }
}

function playAI() {
  if (gameOver) return;
  const move = chooseAIMove();
  if (move !== undefined) board[move] = 'O';
  aiThinking = false;
  if (checkEnd()) return;
  currentPlayer = 'X';
  statusElement.textContent = 'Sua vez! Você é o X.';
  render();
}

function availableMoves(state) {
  return state.map((value, index) => value === '' ? index : null).filter(index => index !== null);
}

function chooseAIMove() {
  const moves = availableMoves(board);
  if (!moves.length) return undefined;

  if (difficulty === 'easy') return moves[Math.floor(Math.random() * moves.length)];

  if (difficulty === 'medium') {
    // No nível médio, a IA prioriza vencer e bloquear, mas também pode errar.
    if (Math.random() < 0.35) return moves[Math.floor(Math.random() * moves.length)];
    return findTacticalMove() ?? moves[Math.floor(Math.random() * moves.length)];
  }

  // Difícil: minimax, a IA não perde.
  let bestScore = -Infinity;
  let bestMove = moves[0];
  for (const move of moves) {
    board[move] = 'O';
    const score = minimax(board, 0, false);
    board[move] = '';
    if (score > bestScore) { bestScore = score; bestMove = move; }
  }
  return bestMove;
}

function findTacticalMove() {
  for (const player of ['O', 'X']) {
    for (const move of availableMoves(board)) {
      board[move] = player;
      const wins = getWinner(board) === player;
      board[move] = '';
      if (wins) return move;
    }
  }
  return undefined;
}

function minimax(state, depth, maximizing) {
  const winner = getWinner(state);
  if (winner === 'O') return 10 - depth;
  if (winner === 'X') return depth - 10;
  const moves = availableMoves(state);
  if (!moves.length) return 0;

  if (maximizing) {
    let best = -Infinity;
    for (const move of moves) {
      state[move] = 'O';
      best = Math.max(best, minimax(state, depth + 1, false));
      state[move] = '';
    }
    return best;
  } else {
    let best = Infinity;
    for (const move of moves) {
      state[move] = 'X';
      best = Math.min(best, minimax(state, depth + 1, true));
      state[move] = '';
    }
    return best;
  }
}

cells.forEach(cell => cell.addEventListener('click', () => makeMove(Number(cell.dataset.index))));

function restartGame() {
  board = Array(9).fill('');
  currentPlayer = 'X';
  gameOver = false;
  aiThinking = false;
  overlay.hidden = true;
  statusElement.textContent = mode === 'single' ? 'Sua vez! Você é o X.' : 'Vez do jogador X.';
  render();
}

function goToMenu() { window.location.href = 'index.html'; }

document.getElementById('restartBtn').addEventListener('click', restartGame);
document.getElementById('resultRestart').addEventListener('click', restartGame);
document.getElementById('backMenu').addEventListener('click', goToMenu);
document.getElementById('resultMenu').addEventListener('click', goToMenu);

statusElement.textContent = mode === 'single' ? 'Sua vez! Você é o X.' : 'Vez do jogador X.';
render();
