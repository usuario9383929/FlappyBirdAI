export const pipes = [];

const PIPE_WIDTH = 100;
const GAP_SIZE = 220;
const SPAWN_X = 1200;  // Mais longe para tela maior
const DISTANCE = 500;  // Mais distância entre canos

// ALTURAS FIXAS para evitar atravessar grama
const MIN_GAP_Y = 320;  // Mínimo Y do centro do gap
const MAX_GAP_Y = 550;  // Máximo Y do centro do gap
const GROUND_HEIGHT = 120;  // Altura da grama

export function createPipes(container) {
  pipes.length = 0;
  spawnPipe(container, SPAWN_X);
  spawnPipe(container, SPAWN_X + DISTANCE);
}

export function movePipes(speed, container) {
  for (const p of pipes) {
    p.x -= speed;
    p.top.style.left = p.x + "px";
    p.bottom.style.left = p.x + "px";
  }

  if (pipes.length && pipes[0].x + PIPE_WIDTH < -50) {
    pipes[0].top.remove();
    pipes[0].bottom.remove();
    pipes.shift();
  }

  const last = pipes[pipes.length - 1];
  if (last && last.x < SPAWN_X) {
    spawnPipe(container, last.x + DISTANCE);
  }
}

function spawnPipe(container, x) {
  // GARANTIR que o cano não atravesse a grama
  const containerHeight = container.clientHeight;
  const maxGapY = containerHeight - GROUND_HEIGHT - (GAP_SIZE / 2) - 20;
  const minGapY = GAP_SIZE / 2 + 50;
  
  const gapY = rand(minGapY, maxGapY);
  const topHeight = gapY - GAP_SIZE/2;
  const bottomTop = gapY + GAP_SIZE/2;

  // Cano de cima
  const top = document.createElement("div");
  top.className = "pipe";
  top.style.position = "absolute";
  top.style.left = x + "px";
  top.style.top = "0px";
  top.style.width = PIPE_WIDTH + "px";
  top.style.height = topHeight + "px";
  top.style.background = "#4caf50";
  top.style.border = "4px solid #2e7d32";
  top.style.borderBottom = "none";

  // Cano de baixo - GARANTIR que para na grama
  const bottom = document.createElement("div");
  bottom.className = "pipe";
  bottom.style.position = "absolute";
  bottom.style.left = x + "px";
  bottom.style.top = bottomTop + "px";
  bottom.style.width = PIPE_WIDTH + "px";
  // Altura calculada para parar na grama
  bottom.style.height = (containerHeight - bottomTop - GROUND_HEIGHT) + "px";
  bottom.style.background = "#4caf50";
  bottom.style.border = "4px solid #2e7d32";
  bottom.style.borderTop = "none";

  container.appendChild(top);
  container.appendChild(bottom);

  pipes.push({
    x,
    width: PIPE_WIDTH,
    gapTop: topHeight,
    gapBottom: bottomTop,
    top,
    bottom,
    counted: false
  });
}

function rand(a,b) {
  return Math.floor(Math.random()*(b-a)+a);
}

window.createPipes = createPipes;
window.pipes = pipes;