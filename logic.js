import { movePipes, pipes } from "./pipes.js";
import { birdState, runFlappyAI, gameOver, resetAIGame } from "./flappy.js";

const SCROLL_SPEED = 3.0;  // Mais rápido para tela maior
let running = false;
let score = 0;
let highScore = 0;
let autoRestart = true;

export function startGameLoop(container) {
  if (running) return;
  running = true;
  score = 0;
  resetAIGame();
  loop(container);
}

function loop(container) {
  if (!running) return;

  movePipes(SCROLL_SPEED, container);
  updateScore();

  // Física
  birdState.velocity += 0.5;
  birdState.y += birdState.velocity;

  // Limites - usar altura real do container
  const groundY = container.clientHeight - 120;  // Grama mais alta
  const ceiling = 0;
  
  if (birdState.y + birdState.height > groundY) {
    birdState.y = groundY - birdState.height;
    if (running) {
      handleGameOver(container, "chão");
      return;
    }
  }
  
  if (birdState.y < ceiling) {
    birdState.y = ceiling;
    if (running) {
      handleGameOver(container, "teto");
      return;
    }
  }

  // Atualizar pássaro
  const birdDiv = document.getElementById("bird");
  if (birdDiv) birdDiv.style.top = birdState.y + "px";

  // IA
  runFlappyAI();

  // Colisão
  if (checkCollision(container)) {
    handleGameOver(container, "cano");
    return;
  }

  requestAnimationFrame(() => loop(container));
}

function updateScore() {
  const birdRight = birdState.x + birdState.width;
  for (const pipe of pipes) {
    if (!pipe.counted && pipe.x + pipe.width < birdState.x) {
      pipe.counted = true;
      score++;
      
      if (score > highScore) {
        highScore = score;
      }
      
      // Atualizar display
      document.getElementById("score").textContent = score;
    }
  }
}

function checkCollision(container) {
  const bx = birdState.x;
  const by = birdState.y;
  const bw = birdState.width;
  const bh = birdState.height;
  const groundY = container.clientHeight - 120;

  // Chão (já verificado)
  if (by + bh >= groundY) return false;

  // Canos
  for (const p of pipes) {
    const px = p.x;
    const pw = p.width;
    const overlapX = bx + bw > px && bx < px + pw;
    if (!overlapX) continue;

    const hitTop = by < p.gapTop;
    const hitBottom = by + bh > p.gapBottom;
    if (hitTop || hitBottom) return true;
  }

  return false;
}

function handleGameOver(container, reason) {
  running = false;
  
  // Treinar IA
  gameOver(reason);
  
  // Auto-restart
  if (autoRestart) {
    setTimeout(() => {
      // Limpar canos
      document.querySelectorAll('.pipe').forEach(p => p.remove());
      pipes.length = 0;
      
      // Recriar canos
      const createPipes = window.createPipes;
      if (createPipes) {
        createPipes(container);
      }
      
      // Resetar
      pipes.forEach(p => p.counted = false);
      startGameLoop(container);
      
    }, 500);
  }
}

window.toggleAutoRestart = function() {
  autoRestart = !autoRestart;
  return autoRestart;
};