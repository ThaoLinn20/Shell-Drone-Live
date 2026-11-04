// Ambient Firework Manager
// Autonomous low-altitude background firework launcher for live streaming atmosphere

import { proceduralShellGenerator } from '../factories/ProceduralShellGenerator.js';

export class AmbientFireworkManager {
  constructor(options = {}) {
    this.fireworkSystem = options.fireworkSystem || null;
    this.interactionManager = options.interactionManager || null;
    this.enabled = options.enabled !== undefined ? options.enabled : true;

    // Timing configuration (random interval between min and max)
    this.minIntervalMs = options.minIntervalMs || 4000;
    this.maxIntervalMs = options.maxIntervalMs || 7500;

    // Low-altitude parameters (strictly clamped to lower background sky)
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
    if (!this.enabled || !this.fireworkSystem) return;

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
    if (!this.fireworkSystem) return;

    // 80% chance of 1 single mini shell, 20% chance of a gentle twin volley
    const count = Math.random() < 0.20 ? 2 : 1;

    // Curated gentle shapes for subtle ambient aesthetic
    const gentleShapes = ['sphere', 'flower', 'ring', 'sparking', 'heart'];

    for (let i = 0; i < count; i++) {
      const chosenShape = gentleShapes[Math.floor(Math.random() * gentleShapes.length)];
      const shell = proceduralShellGenerator.generate({
        tier: 'mini',
        shape: chosenShape,
        dynamics: Math.random() < 0.5 ? 'standard' : 'flow'
      });

      // Scale to small, elegant particle budget (80-150 particles)
      if (shell.burst && shell.burst.particleCount) {
        shell.burst.particleCount = Math.floor(Math.random() * 70 + 80);
      }

      const delayMs = i * Math.floor(Math.random() * 400 + 250);
      setTimeout(() => {
        this.launchLowAltitudeShell(shell);
      }, delayMs);
    }
  }

  launchLowAltitudeShell(shellConfig) {
    if (!this.fireworkSystem) return;

    // Clamped strictly to low-altitude sky (0.24 to 0.42 ratioY)
    const ratioY = Math.max(
      0.24,
      Math.min(0.42, this.baseRatioY + (Math.random() - 0.5) * this.jitterY)
    );

    // Natural horizontal dispersion across the central river
    const ratioX = this.baseRatioX + (Math.random() - 0.5) * this.spreadX;

    this.fireworkSystem.launchRandom(shellConfig, {
      sectorId: 'center',
      ratioX,
      ratioY
    });
  }
}

