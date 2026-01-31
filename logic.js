import { movePipes, pipes } from "./pipes.js";
import { birdState, runFlappyAI, gameOver, resetAIGame } from "./flappy.js";

const SCROLL_SPEED = 2.5;
let running = false;
let score = 0;
let highScore = 0;
let autoRestart = true;
let restartDelay = 500; // ms para reiniciar

export function startGameLoop(container) {
  if (running) return;
  running = true;
  score = 0;
  resetAIGame();
  loop(container);
}

function loop(container) {
  if (!running) return;

  // Mover canos
  movePipes(SCROLL_SPEED, container);

  // Atualizar pontuação
  updateScore();

  // Física do pássaro
  birdState.velocity += 0.5;
  birdState.y += birdState.velocity;

  // Limites
  const groundY = container.clientHeight - 110;
  if (birdState.y + birdState.height > groundY) {
    birdState.y = groundY - birdState.height;
    if (running) {
      handleGameOver(container, "chão");
      return;
    }
  }
  if (birdState.y < 0) birdState.y = 0;

  // Atualizar DOM
  const birdDiv = document.getElementById("bird");
  if (birdDiv) birdDiv.style.top = birdState.y + "px";

  // IA decide
  runFlappyAI();

  // Verificar colisão
  if (checkCollision(container)) {
    handleGameOver(container, "cano");
    return;
  }

  requestAnimationFrame(() => loop(container));
}

function updateScore() {
  // Verificar se passou por um cano
  const birdRight = birdState.x + birdState.width;
  for (const pipe of pipes) {
    if (!pipe.counted && pipe.x + pipe.width < birdState.x) {
      pipe.counted = true;
      score++;
      
      // Atualizar high score
      if (score > highScore) {
        highScore = score;
        updateHighScoreDisplay();
      }
      
      updateScoreDisplay();
    }
  }
}

function updateScoreDisplay() {
  let scoreDisplay = document.getElementById("score-display");
  if (!scoreDisplay) {
    scoreDisplay = document.createElement("div");
    scoreDisplay.id = "score-display";
    scoreDisplay.style.position = "absolute";
    scoreDisplay.style.top = "20px";
    scoreDisplay.style.right = "20px";
    scoreDisplay.style.fontSize = "32px";
    scoreDisplay.style.fontWeight = "bold";
    scoreDisplay.style.color = "white";
    scoreDisplay.style.textShadow = "2px 2px 4px black";
    scoreDisplay.style.zIndex = "100";
    document.getElementById("game").appendChild(scoreDisplay);
  }
  scoreDisplay.textContent = score;
}

function updateHighScoreDisplay() {
  let hsDisplay = document.getElementById("high-score-display");
  if (!hsDisplay) {
    hsDisplay = document.createElement("div");
    hsDisplay.id = "high-score-display";
    hsDisplay.style.position = "absolute";
    hsDisplay.style.top = "60px";
    hsDisplay.style.right = "20px";
    hsDisplay.style.fontSize = "16px";
    hsDisplay.style.color = "white";
    hsDisplay.style.textShadow = "1px 1px 2px black";
    hsDisplay.style.zIndex = "100";
    document.getElementById("game").appendChild(hsDisplay);
  }
  hsDisplay.textContent = `Recorde: ${highScore}`;
}

function checkCollision(container) {
  const bx = birdState.x;
  const by = birdState.y;
  const bw = birdState.width;
  const bh = birdState.height;
  const groundY = container.clientHeight - 110;

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
  
  // Mostrar mensagem de game over
  showGameOverMessage(reason);
  
  // Treinar IA com a experiência ruim
  gameOver(reason);
  
  // Auto-restart
  if (autoRestart) {
    console.log(`Reiniciando em ${restartDelay}ms... (${reason})`);
    
    setTimeout(() => {
      // Limpar canos
      document.querySelectorAll('.pipe').forEach(p => p.remove());
      pipes.length = 0;
      
      // Recriar canos
      const createPipes = window.createPipes;
      if (createPipes) {
        createPipes(container);
      }
      
      // Resetar contagem de canos
      pipes.forEach(p => p.counted = false);
      
      // Iniciar novo jogo
      startGameLoop(container);
      
      // Remover mensagem
      const gameOverMsg = document.getElementById("game-over-msg");
      if (gameOverMsg) gameOverMsg.remove();
      
    }, restartDelay);
  }
}

function showGameOverMessage(reason) {
  let gameOverMsg = document.getElementById("game-over-msg");
  if (!gameOverMsg) {
    gameOverMsg = document.createElement("div");
    gameOverMsg.id = "game-over-msg";
    gameOverMsg.style.position = "absolute";
    gameOverMsg.style.top = "50%";
    gameOverMsg.style.left = "50%";
    gameOverMsg.style.transform = "translate(-50%, -50%)";
    gameOverMsg.style.background = "rgba(0,0,0,0.8)";
    gameOverMsg.style.color = "white";
    gameOverMsg.style.padding = "20px";
    gameOverMsg.style.borderRadius = "10px";
    gameOverMsg.style.textAlign = "center";
    gameOverMsg.style.zIndex = "1000";
    document.getElementById("game").appendChild(gameOverMsg);
  }
  
  gameOverMsg.innerHTML = `
    <div style="font-size: 24px; margin-bottom: 10px;">💀 Game Over 💀</div>
    <div style="margin-bottom: 5px;">Motivo: ${reason}</div>
    <div style="margin-bottom: 5px;">Pontuação: ${score}</div>
    <div style="margin-bottom: 10px;">Recorde: ${highScore}</div>
    <div style="font-size: 12px; opacity: 0.8;">Reiniciando automaticamente...</div>
    <div style="font-size: 10px; opacity: 0.6; margin-top: 5px;">
      ε: ${window.epsilon ? window.epsilon.toFixed(4) : "1.0000"}
    </div>
  `;
}

// Expor controle de restart
window.toggleAutoRestart = function() {
  autoRestart = !autoRestart;
  console.log(`Auto-restart: ${autoRestart ? "ON" : "OFF"}`);
  return autoRestart;
};