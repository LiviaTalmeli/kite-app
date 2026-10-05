// Kite Sensory, Breathing & Hyperfocus Tools
class ToolsController {
  constructor() {
    // Timer state
    this.timerDisplay = document.getElementById('timer-display');
    this.timerStartBtn = document.getElementById('timer-start-btn');
    this.timerResetBtn = document.getElementById('timer-reset-btn');
    this.timerInterval = null;
    this.timerSeconds = 25 * 60;
    this.timerTotalSeconds = 25 * 60;
    this.isTimerRunning = false;
    this.timerMode = 'pomodoro'; // 'pomodoro' (25m), 'flow' (50m), 'free' (count up)

    // Breathing state
    this.breathingKite = document.getElementById('breathing-kite-visual');
    this.breathingLabel = document.getElementById('breathing-label');
    this.breathingCounter = document.getElementById('breathing-counter');
    this.breathingBtn = document.getElementById('breathing-toggle-btn');
    this.isBreathingActive = false;
    this.breathingInterval = null;

    // Web Audio Synthesizer
    this.audioCtx = null;
    this.activeSound = null;
    this.audioNodes = [];

    this.init();
  }

  init() {
    this.setupTimerEvents();
    this.setupBreathingEvents();
    this.setupAudioEvents();
  }

  // Timer Implementation
  setupTimerEvents() {
    document.querySelectorAll('.timer-mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.timer-mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.timerMode = btn.dataset.mode;
        this.resetTimer();
      });
    });

    if (this.timerStartBtn) {
      this.timerStartBtn.addEventListener('click', () => {
        if (this.isTimerRunning) {
          this.pauseTimer();
        } else {
          this.startTimer();
        }
      });
    }

    if (this.timerResetBtn) {
      this.timerResetBtn.addEventListener('click', () => {
        this.resetTimer();
      });
    }

    this.updateTimerDisplay();
  }

  startTimer() {
    this.isTimerRunning = true;
    this.timerStartBtn.innerText = 'Pausar';
    this.timerStartBtn.style.background = '#F59E0B';

    this.timerInterval = setInterval(() => {
      if (this.timerMode === 'free') {
        this.timerSeconds++;
      } else {
        if (this.timerSeconds > 0) {
          this.timerSeconds--;
        } else {
          this.pauseTimer();
          window.kiteApp.toast('Sessão de foco concluída com sucesso! Descanse um pouco. 🪁', 'success');
          return;
        }
      }
      this.updateTimerDisplay();
    }, 1000);
  }

  pauseTimer() {
    this.isTimerRunning = false;
    clearInterval(this.timerInterval);
    if (this.timerStartBtn) {
      this.timerStartBtn.innerText = 'Iniciar';
      this.timerStartBtn.style.background = '';
    }
  }

  resetTimer() {
    this.pauseTimer();
    if (this.timerMode === 'pomodoro') {
      this.timerSeconds = 25 * 60;
    } else if (this.timerMode === 'flow') {
      this.timerSeconds = 50 * 60;
    } else {
      this.timerSeconds = 0;
    }
    this.updateTimerDisplay();
  }

  updateTimerDisplay() {
    if (!this.timerDisplay) return;
    const mins = Math.floor(this.timerSeconds / 60);
    const secs = this.timerSeconds % 60;
    this.timerDisplay.innerText = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  // 4-7-8 Breathing Guide
  setupBreathingEvents() {
    if (this.breathingBtn) {
      this.breathingBtn.addEventListener('click', () => {
        if (this.isBreathingActive) {
          this.stopBreathing();
        } else {
          this.startBreathing();
        }
      });
    }
  }

  startBreathing() {
    this.isBreathingActive = true;
    this.breathingBtn.innerText = 'Parar Exercício';
    this.breathingBtn.style.background = '#EF4444';

    let phase = 0; // 0: inhale (4s), 1: hold (7s), 2: exhale (8s)
    let count = 4;

    const cycle = () => {
      if (!this.isBreathingActive) return;

      if (phase === 0) {
        // Inspire
        this.breathingLabel.innerText = 'Inspire suavemente pelo nariz...';
        this.breathingKite.classList.remove('contract');
        this.breathingKite.classList.add('expand');
        count = 4;
      } else if (phase === 1) {
        // Retenha
        this.breathingLabel.innerText = 'Segure o ar com calma...';
        count = 7;
      } else if (phase === 2) {
        // Expire
        this.breathingLabel.innerText = 'Solte o ar devagar pela boca...';
        this.breathingKite.classList.remove('expand');
        this.breathingKite.classList.add('contract');
        count = 8;
      }

      this.breathingCounter.innerText = count;

      const countdown = setInterval(() => {
        if (!this.isBreathingActive) {
          clearInterval(countdown);
          return;
        }
        count--;
        if (count > 0) {
          this.breathingCounter.innerText = count;
        } else {
          clearInterval(countdown);
          phase = (phase + 1) % 3;
          cycle();
        }
      }, 1000);
    };

    cycle();
  }

  stopBreathing() {
    this.isBreathingActive = false;
    this.breathingBtn.innerText = 'Começar Respiração Guiada';
    this.breathingBtn.style.background = '';
    this.breathingLabel.innerText = 'Pronto para relaxar seu sistema nervoso?';
    this.breathingCounter.innerText = '4-7-8';
    this.breathingKite.classList.remove('expand', 'contract');
  }

  // Web Audio Soundscape Generator
  setupAudioEvents() {
    document.querySelectorAll('.sound-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const soundType = btn.dataset.sound;
        if (this.activeSound === soundType) {
          this.stopSound();
          btn.classList.remove('active');
          this.activeSound = null;
        } else {
          document.querySelectorAll('.sound-btn').forEach(b => b.classList.remove('active'));
          this.playSound(soundType);
          btn.classList.add('active');
          this.activeSound = soundType;
        }
      });
    });
  }

  initAudioContext() {
    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioCtx();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  stopSound() {
    this.audioNodes.forEach(node => {
      try {
        if (node.stop) node.stop();
        if (node.disconnect) node.disconnect();
      } catch (e) {}
    });
    this.audioNodes = [];
  }

  playSound(type) {
    this.initAudioContext();
    this.stopSound();

    const ctx = this.audioCtx;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.2, ctx.currentTime);
    masterGain.connect(ctx.destination);
    this.audioNodes.push(masterGain);

    if (type === 'rain' || type === 'pink') {
      // White/Pink noise buffer
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = buffer;
      noiseSource.loop = true;

      // Filter for rain effect
      const filter = ctx.createBiquadFilter();
      filter.type = type === 'rain' ? 'lowpass' : 'bandpass';
      filter.frequency.setValueAtTime(type === 'rain' ? 800 : 400, ctx.currentTime);

      noiseSource.connect(filter);
      filter.connect(masterGain);
      noiseSource.start();
      this.audioNodes.push(noiseSource, filter);
    } else if (type === 'binaural') {
      // 40Hz Gamma Focus Frequency (180Hz Left, 220Hz Right = 40Hz binaural beat)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const pan1 = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
      const pan2 = ctx.createStereoPanner ? ctx.createStereoPanner() : null;

      osc1.frequency.setValueAtTime(180, ctx.currentTime);
      osc2.frequency.setValueAtTime(220, ctx.currentTime);

      if (pan1 && pan2) {
        pan1.pan.setValueAtTime(-1, ctx.currentTime);
        pan2.pan.setValueAtTime(1, ctx.currentTime);
        osc1.connect(pan1);
        pan1.connect(masterGain);
        osc2.connect(pan2);
        pan2.connect(masterGain);
        this.audioNodes.push(pan1, pan2);
      } else {
        osc1.connect(masterGain);
        osc2.connect(masterGain);
      }

      osc1.start();
      osc2.start();
      this.audioNodes.push(osc1, osc2);
    }
  }
}

window.ToolsController = ToolsController;
