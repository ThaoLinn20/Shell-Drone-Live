// Ambient Firework Manager
// Autonomous background firework launcher for live streaming atmosphere

import { proceduralShellGenerator } from '../factories/ProceduralShellGenerator.js';

export class AmbientFireworkManager {
  constructor(options = {}) {
    this.fireworkSystem = options.fireworkSystem || null;
    this.interactionManager = options.interactionManager || null;
    this.scriptVariationEngine = options.scriptVariationEngine || null;
    this.enabled = options.enabled !== undefined ? options.enabled : true;

    // Timing configuration (random interval between min and max)
    this.minIntervalMs = options.minIntervalMs || 4000;
    this.maxIntervalMs = options.maxIntervalMs || 7500;

    // Big shell probability for heightened viewer excitement (50% big shells)
    this.bigShellChance = options.bigShellChance !== undefined
      ? options.bigShellChance
      : 0.50;

    // Low-altitude parameters (clamped to lower background sky)
    this.baseRatioY = options.baseRatioY || 0.34;
    this.jitterY = options.jitterY || 0.12;
    this.baseRatioX = options.baseRatioX || 0.50;
    this.spreadX = options.spreadX || 0.34;

    this.timer = null;
    this.isRunning = false;
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.scheduleNext();
  }

  stop() {
    this.isRunning = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  toggle() {
    if (this.enabled) {
      this.enabled = false;
      this.stop();
    } else {
      this.enabled = true;
      this.start();
    }
    return this.enabled;
  }

  scheduleNext() {
    if (!this.isRunning || !this.enabled) return;

    const delay = Math.floor(
      Math.random() * (this.maxIntervalMs - this.minIntervalMs) + this.minIntervalMs
    );

    this.timer = setTimeout(() => {
      this.tick();
      this.scheduleNext();
    }, delay);
  }

  tick() {
    if (!this.enabled) return;
    if (!this.fireworkSystem && !this.scriptVariationEngine) return;

    // If user gift queue is active or busy, pause ambient burst to prioritize viewer gifts
    if (
      this.interactionManager &&
      this.interactionManager.queue &&
      this.interactionManager.queue.length > 0
    ) {
      return;
    }

    this.triggerAmbientBurst();
  }

  triggerAmbientBurst() {
    if (!this.fireworkSystem && !this.scriptVariationEngine) return;

    const isBigShell = Math.random() < this.bigShellChance;

    if (isBigShell) {
      if (this.scriptVariationEngine) {
        this.scriptVariationEngine.execute('gift', {
          data: { comboCount: 1 }
        });
        return;
      }

      // Standalone grand / medium shell volley for high atmosphere excitement (3 to 4 shells)
      const count = Math.floor(Math.random() * 2 + 3);
      const grandShapes = [
        'sphere',
        'chrysanthemum',
        'willow',
        'brocade',
        'flower'
      ];

      for (let i = 0; i < count; i++) {
        const chosenShape = grandShapes[
          Math.floor(Math.random() * grandShapes.length)
        ];
        const shell = proceduralShellGenerator.generate({
          tier: 'grand',
          shape: chosenShape,
          dynamics: Math.random() < 0.5 ? 'willow' : 'standard'
        });

        const delayMs = i * Math.floor(Math.random() * 400 + 250);
        setTimeout(() => {
          this.launchHighAltitudeShell(shell);
        }, delayMs);
      }
      return;
    }

    // Low-altitude mini shell branch
    const count = Math.random() < 0.20 ? 2 : 1;
    const gentleShapes = [
      'sphere',
      'flower',
      'ring',
      'sparking',
      'heart'
    ];

    for (let i = 0; i < count; i++) {
      const chosenShape = gentleShapes[
        Math.floor(Math.random() * gentleShapes.length)
      ];
      const shell = proceduralShellGenerator.generate({
        tier: 'mini',
        shape: chosenShape,
        dynamics: Math.random() < 0.5 ? 'standard' : 'flow'
      });

      // Small particle budget for ambient subtle aesthetics
      if (shell.burst && shell.burst.particleCount) {
        shell.burst.particleCount = Math.floor(Math.random() * 70 + 80);
      }

      const delayMs = i * Math.floor(Math.random() * 400 + 250);
      setTimeout(() => {
        this.launchLowAltitudeShell(shell);
      }, delayMs);
    }
  }

  launchHighAltitudeShell(shellConfig) {
    if (!this.fireworkSystem) return;

    // Clamped strictly within mid-to-high visible sky (0.55 to 0.78 ratioY)
    const ratioY = Math.max(
      0.55,
      Math.min(
        0.78,
        0.65 + (Math.random() - 0.5) * 0.20
      )
    );

    // Natural horizontal dispersion framed strictly within camera field of view
    const ratioX = Math.max(
      0.22,
      Math.min(
        0.78,
        this.baseRatioX + (Math.random() - 0.5) * this.spreadX
      )
    );

    this.fireworkSystem.launchRandom(shellConfig, {
      sectorId: 'center',
      ratioX,
      ratioY
    });
  }

  launchLowAltitudeShell(shellConfig) {
    if (!this.fireworkSystem) return;

    // Clamped strictly to low-altitude sky (0.24 to 0.42 ratioY)
    const ratioY = Math.max(
      0.24,
      Math.min(
        0.42,
        this.baseRatioY + (Math.random() - 0.5) * this.jitterY
      )
    );

    // Natural horizontal dispersion across the central river framed within view
    const ratioX = Math.max(
      0.22,
      Math.min(
        0.78,
        this.baseRatioX + (Math.random() - 0.5) * this.spreadX
      )
    );

    this.fireworkSystem.launchRandom(shellConfig, {
      sectorId: 'center',
      ratioX,
      ratioY
    });
  }
}
