export class DQN {
  constructor(input_nodes=3, hidden_nodes=16, output_nodes=2, lr=0.001, gamma=0.95) {
    this.input_nodes = input_nodes;
    this.hidden_nodes = hidden_nodes;
    this.output_nodes = output_nodes;
    this.lr = lr;
    this.gamma = gamma;

    // Inicialização de Xavier/He melhorada
    this.weights_ih = Array.from({length: hidden_nodes}, () =>
      Array.from({length: input_nodes}, () => (Math.random() * 2 - 1) * Math.sqrt(2 / input_nodes))
    );
    this.weights_ho = Array.from({length: output_nodes}, () =>
      Array.from({length: hidden_nodes}, () => (Math.random() * 2 - 1) * Math.sqrt(2 / hidden_nodes))
    );
    this.bias_h = Array.from({length: hidden_nodes}, () => 0);
    this.bias_o = Array.from({length: output_nodes}, () => 0);
  }

  // ReLU e derivada
  static relu(x) { return Math.max(0, x); }
  static drelu(x) { return x > 0 ? 1 : 0; }

  predict(inputs) {
    // Camada oculta com ReLU
    this.hidden_inputs = [];
    this.hidden = [];
    
    for (let i = 0; i < this.hidden_nodes; i++) {
      let sum = this.bias_h[i];
      for (let j = 0; j < this.input_nodes; j++) {
        sum += this.weights_ih[i][j] * inputs[j];
      }
      this.hidden_inputs[i] = sum;
      this.hidden[i] = DQN.relu(sum);
    }

    // Camada de saída (linear, sem ativação)
    this.output = [];
    for (let i = 0; i < this.output_nodes; i++) {
      let sum = this.bias_o[i];
      for (let j = 0; j < this.hidden_nodes; j++) {
        sum += this.weights_ho[i][j] * this.hidden[j];
      }
      this.output[i] = sum;
    }

    return [...this.output];
  }

  // Treino DQN com Temporal Difference
  trainSingle(state, action, reward, next_state, done) {
    // Q-values atuais
    const current_q = this.predict(state);
    
    // Q-values do próximo estado
    const next_q = this.predict(next_state);
    const max_next_q = Math.max(...next_q);
    
    // Target Q-value (Temporal Difference)
    const target = [...current_q];
    if (done) {
      target[action] = reward;
    } else {
      target[action] = reward + this.gamma * max_next_q;
    }

    // Erros da saída
    const output_errors = [];
    for (let i = 0; i < this.output_nodes; i++) {
      output_errors[i] = target[i] - current_q[i];
    }

    // Backpropagation: output -> hidden
    for (let i = 0; i < this.output_nodes; i++) {
      for (let j = 0; j < this.hidden_nodes; j++) {
        this.weights_ho[i][j] += this.lr * output_errors[i] * this.hidden[j];
      }
      this.bias_o[i] += this.lr * output_errors[i];
    }

    // Erros da camada oculta
    const hidden_errors = Array(this.hidden_nodes).fill(0);
    for (let i = 0; i < this.hidden_nodes; i++) {
      for (let j = 0; j < this.output_nodes; j++) {
        hidden_errors[i] += output_errors[j] * this.weights_ho[j][i];
      }
      // Aplicar derivada da ReLU
      hidden_errors[i] *= DQN.drelu(this.hidden_inputs[i]);
    }

    // Backpropagation: hidden -> input
    for (let i = 0; i < this.hidden_nodes; i++) {
      for (let j = 0; j < this.input_nodes; j++) {
        this.weights_ih[i][j] += this.lr * hidden_errors[i] * state[j];
      }
      this.bias_h[i] += this.lr * hidden_errors[i];
    }
  }

  // Cópia da rede (para target network futuro)
  copy() {
    const newNet = new DQN(this.input_nodes, this.hidden_nodes, this.output_nodes, this.lr, this.gamma);
    newNet.weights_ih = this.weights_ih.map(row => [...row]);
    newNet.weights_ho = this.weights_ho.map(row => [...row]);
    newNet.bias_h = [...this.bias_h];
    newNet.bias_o = [...this.bias_o];
    return newNet;
  }
}