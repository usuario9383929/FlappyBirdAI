import { pipes } from "./pipes.js";

export const birdState = {
  x: 100,
  y: 200,
  width: 40,
  height: 30,
  velocity: 0
};

// CONFIGURAÇÃO DO ALGORITMO GENÉTICO
const POPULATION_SIZE = 50;
const MUTATION_RATE = 0.15;
const MUTATION_STRENGTH = 0.5;
const ELITISM = 3;

let population = [];
let currentBirdIndex = 0;
let currentBird = null;
let generation = 1;
let bestScore = 0;
let bestBrain = null;

window.generation = generation;
window.bestScore = bestScore;

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

  initPopulation();
  console.log(`🧬 Geração ${generation}: ${POPULATION_SIZE} pássaros`);
}

// ========== CÉREBRO (REDE NEURAL SIMPLES) ==========
class Brain {
  constructor() {
    // 2 inputs → 4 hidden → 1 output
    this.weights1 = this.randomMatrix(4, 2);
    this.weights2 = this.randomMatrix(1, 4);
    this.bias1 = this.randomArray(4);
    this.bias2 = this.randomArray(1);
    
    this.score = 0;
    this.fitness = 0;
    this.alive = true;
  }
  
  randomMatrix(rows, cols) {
    return Array.from({length: rows}, () =>
      Array.from({length: cols}, () => (Math.random() * 2 - 1))
    );
  }
  
  randomArray(size) {
    return Array.from({length: size}, () => (Math.random() * 2 - 1));
  }
  
  // Ativação tanh (melhor que sigmoid para este caso)
  tanh(x) {
    return Math.tanh(x);
  }
  
  // Forward pass: decide se pula
  think(distX, diffY) {
    const inputs = [distX, diffY];
    
    // Hidden layer
    const hidden = [];
    for (let i = 0; i < 4; i++) {
      let sum = this.bias1[i];
      for (let j = 0; j < 2; j++) {
        sum += this.weights1[i][j] * inputs[j];
      }
      hidden[i] = this.tanh(sum);
    }
    
    // Output layer
    let output = this.bias2[0];
    for (let i = 0; i < 4; i++) {
      output += this.weights2[0][i] * hidden[i];
    }
    
    // Tanh: > 0 = pula, <= 0 = não pula
    return this.tanh(output) > 0;
  }
  
  // Crossover (reprodução)
  crossover(partner) {
    const child = new Brain();
    
    // Cruzamento uniforme
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 2; j++) {
        child.weights1[i][j] = Math.random() < 0.5 ? 
          this.weights1[i][j] : partner.weights1[i][j];
      }
      child.bias1[i] = Math.random() < 0.5 ? this.bias1[i] : partner.bias1[i];
    }
    
    for (let i = 0; i < 1; i++) {
      for (let j = 0; j < 4; j++) {
        child.weights2[i][j] = Math.random() < 0.5 ? 
          this.weights2[i][j] : partner.weights2[i][j];
      }
      child.bias2[i] = Math.random() < 0.5 ? this.bias2[i] : partner.bias2[i];
    }
    
    return child;
  }
  
  // Mutação
  mutate() {
    const mutateValue = (val) => {
      if (Math.random() < MUTATION_RATE) {
        return val + (Math.random() * 2 - 1) * MUTATION_STRENGTH;
      }
      return val;
    };
    
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 2; j++) {
        this.weights1[i][j] = mutateValue(this.weights1[i][j]);
      }
      this.bias1[i] = mutateValue(this.bias1[i]);
    }
    
    for (let i = 0; i < 1; i++) {
      for (let j = 0; j < 4; j++) {
        this.weights2[i][j] = mutateValue(this.weights2[i][j]);
      }
      this.bias2[i] = mutateValue(this.bias2[i]);
    }
  }
  
  copy() {
    const copy = new Brain();
    copy.weights1 = this.weights1.map(row => [...row]);
    copy.weights2 = this.weights2.map(row => [...row]);
    copy.bias1 = [...this.bias1];
    copy.bias2 = [...this.bias2];
    return copy;
  }
}

// ========== ALGORITMO GENÉTICO ==========
function initPopulation() {
  population = [];
  for (let i = 0; i < POPULATION_SIZE; i++) {
    population.push(new Brain());
  }
  currentBirdIndex = 0;
  currentBird = population[0];
  resetBirdPosition();
}

function nextBird() {
  currentBirdIndex++;
  if (currentBirdIndex < population.length) {
    currentBird = population[currentBirdIndex];
    resetBirdPosition();
    return true;
  }
  return false;
}

function resetBirdPosition() {
  birdState.y = Math.random() * 300 + 150;
  birdState.velocity = 0;
}

function calculateFitness() {
  let total = 0;
  
  // Fitness = score² (favorece muito os melhores)
  for (const bird of population) {
    bird.fitness = Math.pow(bird.score, 2) + 0.1; // +0.1 para evitar 0
    total += bird.fitness;
  }
  
  // Normalizar para probabilidades
  for (const bird of population) {
    bird.fitness /= total;
  }
}

function selectParent() {
  let r = Math.random();
  let index = 0;
  
  while (r > 0 && index < population.length) {
    r -= population[index].fitness;
    index++;
  }
  
  return population[Math.max(0, index - 1)];
}

function newGeneration() {
  // Calcular fitness
  calculateFitness();
  
  // Ordenar por score
  population.sort((a, b) => b.score - a.score);
  
  // Salvar melhor
  if (population[0].score > bestScore) {
    bestScore = population[0].score;
    bestBrain = population[0].copy();
    console.log(`🏆 NOVO RECORDE: ${bestScore} canos!`);
  }
  
  // Nova população
  const newPopulation = [];
  
  // Elitismo
  for (let i = 0; i < ELITISM; i++) {
    newPopulation.push(population[i].copy());
  }
  
  // Reprodução
  while (newPopulation.length < POPULATION_SIZE) {
    const parentA = selectParent();
    const parentB = selectParent();
    const child = parentA.crossover(parentB);
    child.mutate();
    newPopulation.push(child);
  }
  
  // Atualizar
  population = newPopulation;
  currentBirdIndex = 0;
  currentBird = population[0];
  generation++;
  
  window.generation = generation;
  window.bestScore = bestScore;
  
  console.log(`🧬 Geração ${generation} | Melhor: ${bestScore} canos`);
}

// ========== LÓGICA DO JOGO ==========
function getState() {
  const nextPipe = pipes.find(p => p.x + p.width > birdState.x);
  if (!nextPipe) return [0.5, 0];
  
  const gapCenter = (nextPipe.gapTop + nextPipe.gapBottom) / 2;
  
  return [
    Math.min(1, (nextPipe.x - birdState.x) / 600), // Distância horizontal
    (gapCenter - birdState.y) / 250 // Diferença vertical
  ];
}

export function jump() {
  birdState.velocity = -8;
}

export function runFlappyAI() {
  if (!currentBird || !currentBird.alive) return;
  
  const [distX, diffY] = getState();
  const shouldJump = currentBird.think(distX, diffY);
  
  if (shouldJump) {
    jump();
  }
  
  // Contar canos passados
  const passedPipe = pipes.find(p => p.x + p.width < birdState.x && !p.counted);
  if (passedPipe) {
    passedPipe.counted = true;
    currentBird.score++;
    window.lastScore = currentBird.score;
  }
}

export function gameOver(reason = "cano") {
  if (currentBird) {
    currentBird.alive = false;
    
    // Penalidade por bater no chão
    if (reason === "chão") {
      currentBird.score = Math.max(0, currentBird.score - 1);
    }
    
    // Próximo pássaro ou nova geração
    if (nextBird()) {
      return false; // Continua geração
    } else {
      newGeneration();
      resetBirdPosition();
      return true; // Nova geração
    }
  }
  return true;
}

export function resetAIGame() {
  resetBirdPosition();
}

// Exportar funções para debug
window.nextGeneration = newGeneration;
window.showBestBrain = () => bestBrain;