export const pipes = [];

const PIPE_WIDTH = 100;
const GAP_SIZE = 220;
const SPAWN_X = 1000;
const DISTANCE = 420;

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
  const gapY = rand(260, 520);
  const topHeight = gapY - GAP_SIZE/2;
  const bottomTop = gapY + GAP_SIZE/2;

  const top = div({
    left: x + "px",
    top: "0px",
    width: PIPE_WIDTH + "px",
    height: topHeight + "px",
    background: "#4caf50",
    border: "4px solid #2e7d32"
  });
  top.className = "pipe";

  const bottom = div({
    left: x + "px",
    top: bottomTop + "px",
    width: PIPE_WIDTH + "px",
    bottom: "110px",
    background: "#4caf50",
    border: "4px solid #2e7d32"
  });
  bottom.className = "pipe";

  container.appendChild(top);
  container.appendChild(bottom);

  pipes.push({
    x,
    width: PIPE_WIDTH,
    gapTop: topHeight,
    gapBottom: bottomTop,
    top,
    bottom
  });
}

function div(styleObj) {
  const d = document.createElement("div");
  d.style.position = "absolute";
  for (const k in styleObj) d.style[k] = styleObj[k];
  return d;
}

function rand(a,b) {
  return Math.floor(Math.random()*(b-a)+a);
}

// Exportar para acesso global
window.createPipes = createPipes;
window.pipes = pipes;