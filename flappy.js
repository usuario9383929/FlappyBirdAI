import { pipes } from "./pipes.js";
import { DQN } from "./nt.js";

export const birdState = {
  x: 100,
  y: 200,
  width: 40,
  height: 30,
  velocity: 0
};

let nn;
let epsilon = 1.0;
const epsilon_min = 0.05;  // Aumentado para manter exploração
const epsilon_decay = 0.999;  // Mais lento
let lastState = null;
let lastAction = null;
let lastPipeIndex = -1;
let pipesPassed = 0;
const replayMemory = [];
const MEMORY_CAPACITY = 500;
let consecutiveJumps = 0;
let lastJumpTime = 0;
const JUMP_COOLDOWN = 200; // ms entre pulos

// Expor epsilon globalmente
window.epsilon = epsilon;

export function renderFlappy(container) {
  const bird = document.createElement("div");
  bird.id = "bird";
  bird.style.position = "absolute";
  bird.style.width = birdState.width + "px";
  bird.style.height = birdState.height + "px";
  bird.style.left = birdState.x + "px";
  bird.style.top = birdState.y + "px";
  bird.style.background = "yellow";
  bird.style.borderRadius = "6px";

  const eye = document.createElement("div");
  eye.style.position = "absolute";
  eye.style.width = "8px";
  eye.style.height = "8px";
  eye.style.borderRadius = "50%";
  eye.style.background = "black";
  eye.style.left = "25px";
  eye.style.top = "6px";
  bird.appendChild(eye);

  container.appendChild(bird);

  // DQN com mais neurônios na hidden
  nn = new DQN(5, 24, 2, 0.0005, 0.9);  // LR menor, gamma menor
}

export function jump() {
  const now = Date.now();
  if (now - lastJumpTime < JUMP_COOLDOWN) {
    return; // Cooldown
  }
  
  birdState.velocity = -8;
  consecutiveJumps++;
  lastJumpTime = now;
}

// Estado melhorado com mais informações
function getState() {
  const nextPipe = pipes.find(p => p.x + p.width > birdState.x);
  if (!nextPipe || pipes.length === 0) {
    return [0.5, 0.5, 1, 0, 0];
  }
  
  const gapCenter = (nextPipe.gapTop + nextPipe.gapBottom) / 2;
  const containerHeight = 700; // Altura fixa
  
  return [
    birdState.y / containerHeight,  // Posição Y
    (birdState.velocity + 15) / 30, // Velocidade (-15 a 15)
    Math.min(1, (nextPipe.x - birdState.x) / 400), // Distância ao cano
    (gapCenter - birdState.y) / 250,  // Distância vertical ao centro
    consecutiveJumps > 3 ? 1 : consecutiveJumps / 3  // Penalidade por muitos pulos
  ];
}

// Recompensa melhorada para evitar spam
function calculateReward() {
  let reward = 0.001; // Pequena recompensa por sobreviver
  
  // Penalidade por spam de pulos
  if (consecutiveJumps > 2) {
    reward -= 0.01 * (consecutiveJumps - 2);
  }
  
  // Recompensa por estar em boa altura (centro da tela)
  const centerY = 350;
  const distanceFromCenter = Math.abs(birdState.y - centerY);
  reward += 0.005 * (1 - distanceFromCenter / 350);
  
  // Recompensa por estar próximo do centro do gap
  const nextPipe = pipes.find(p => p.x + p.width > birdState.x);
  if (nextPipe) {
    const gapCenter = (nextPipe.gapTop + nextPipe.gapBottom) / 2;
    const gapDistance = Math.abs(birdState.y - gapCenter);
    if (gapDistance < 100) {
      reward += 0.01 * (1 - gapDistance / 100);
    }
  }
  
  return reward;
}

// IA com anti-spam e decisão mais inteligente
export function runFlappyAI() {
  if (!nn) return;
  
  const state = getState();
  let action = 0; // Default: não pula
  
  // ε-greedy com ajuste baseado na situação
  let currentEpsilon = epsilon;
  
  // Se está descendo muito rápido, aumenta chance de pular
  if (birdState.velocity > 10) {
    currentEpsilon *= 0.5; // Mais exploração quando caindo rápido
  }
  
  if (Math.random() < currentEpsilon) {
    // Explorar: 30% chance de pular, não 50%
    action = Math.random() < 0.3 ? 1 : 0;
  } else {
    // Explotar: usa rede neural com threshold
    const q_values = nn.predict(state);
    const jumpAdvantage = q_values[1] - q_values[0];
    
    // Só pula se a vantagem for significativa E não estiver em cooldown
    if (jumpAdvantage > 0.1 && Date.now() - lastJumpTime > JUMP_COOLDOWN / 2) {
      action = 1;
    }
  }
  
  // Executar ação com verificação adicional
  if (action === 1) {
    // Só pula se estiver abaixo do topo da tela
    if (birdState.y > 50) {
      jump();
    } else {
      action = 0; // Não pula se já está no topo
    }
  } else {
    // Resetar contador de pulos consecutivos
    consecutiveJumps = 0;
  }
  
  // Treinar com experiência anterior
  if (lastState !== null && lastAction !== null) {
    const reward = calculateReward();
    replayMemory.push({
      state: [...lastState],
      action: lastAction,
      reward: reward,
      next_state: [...state],
      done: false
    });
    
    // Manter tamanho da memória
    if (replayMemory.length > MEMORY_CAPACITY) {
      replayMemory.shift();
    }
    
    // Treinar com mini-batch
    if (replayMemory.length >= 32) {
      const batch = [];
      for (let i = 0; i < 16; i++) {
        const idx = Math.floor(Math.random() * replayMemory.length);
        batch.push(replayMemory[idx]);
      }
      
      batch.forEach(exp => {
        nn.trainSingle(exp.state, exp.action, exp.reward, exp.next_state, exp.done);
      });
    }
  }
  
  // Atualizar para próxima iteração
  lastState = state;
  lastAction = action;
  
  // Decair epsilon gradualmente
  if (epsilon > epsilon_min) {
    epsilon *= epsilon_decay;
    window.epsilon = epsilon; // Atualizar global
  }
}

// Reiniciar estado da IA (sem resetar a rede)
export function resetAIGame() {
  lastState = null;
  lastAction = null;
  lastPipeIndex = -1;
  pipesPassed = 0;
  consecutiveJumps = 0;
  lastJumpTime = 0;
  birdState.y = 200;
  birdState.velocity = 0;
  
  // Limpar memória antiga
  while (replayMemory.length > 100) {
    replayMemory.shift();
  }
  
  console.log(`Reiniciando... ε=${epsilon.toFixed(4)}`);
}

// Chamado quando colide
export function gameOver(reason = "colisão") {
  if (lastState !== null && lastAction !== null) {
    // Punir fortemente
    const penalty = -1.0;
    
    // Punir extra por spam de pulos
    if (consecutiveJumps > 3) {
      penalty -= 0.2 * (consecutiveJumps - 3);
    }
    
    replayMemory.push({
      state: [...lastState],
      action: lastAction,
      reward: penalty,
      next_state: getState(),
      done: true
    });
    
    // Treinar com a experiência ruim várias vezes
    for (let i = 0; i < 3; i++) {
      if (replayMemory.length >= 8) {
        for (let j = 0; j < 4; j++) {
          const idx = Math.floor(Math.random() * Math.min(50, replayMemory.length));
          const exp = replayMemory[idx];
          nn.trainSingle(exp.state, exp.action, exp.reward, exp.next_state, exp.done);
        }
      }
    }
  }
  
  resetAIGame();
  return true; // Sinaliza que pode reiniciar
}