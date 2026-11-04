import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AmbientFireworkManager } from '../../src/live/AmbientFireworkManager.js';

describe('AmbientFireworkManager', () => {
  let mockFireworkSystem;
  let launchedShells;

  beforeEach(() => {
    vi.useFakeTimers();
    launchedShells = [];
    mockFireworkSystem = {
      launchRandom: vi.fn((shell, opts) => {
        launchedShells.push({ shell, opts });
      })
    };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with default low-altitude configuration and enabled state', () => {
    const manager = new AmbientFireworkManager({
      fireworkSystem: mockFireworkSystem
    });

    expect(manager.enabled).toBe(true);
    expect(manager.baseRatioY).toBe(0.34);
    expect(manager.baseRatioX).toBe(0.50);
    expect(manager.minIntervalMs).toBe(4000);
    expect(manager.maxIntervalMs).toBe(7500);
    expect(manager.isRunning).toBe(false);
  });

  it('should toggle enabled state on demand and control running status', () => {
    const manager = new AmbientFireworkManager({
      fireworkSystem: mockFireworkSystem,
      enabled: true
    });

    manager.start();
    expect(manager.isRunning).toBe(true);

    // Toggle off
    const stateOff = manager.toggle();
    expect(stateOff).toBe(false);
    expect(manager.enabled).toBe(false);
    expect(manager.isRunning).toBe(false);

    // Toggle on
    const stateOn = manager.toggle();
    expect(stateOn).toBe(true);
    expect(manager.enabled).toBe(true);
    expect(manager.isRunning).toBe(true);

    manager.stop();
  });

  it('should trigger ambient bursts with small particle budget at low altitude', () => {
    const manager = new AmbientFireworkManager({
      fireworkSystem: mockFireworkSystem,
      bigShellChance: 0,
      enabled: true
    });

    manager.triggerAmbientBurst();

    // Fast-forward delay timers
    vi.advanceTimersByTime(1000);

    expect(mockFireworkSystem.launchRandom).toHaveBeenCalled();
    expect(launchedShells.length).toBeGreaterThanOrEqual(1);
    expect(launchedShells.length).toBeLessThanOrEqual(2);

    const firstLaunch = launchedShells[0];
    expect(firstLaunch.opts.sectorId).toBe('center');

    // Altitude strictly low (between 0.24 and 0.42)
    expect(firstLaunch.opts.ratioY).toBeGreaterThanOrEqual(0.24);
    expect(firstLaunch.opts.ratioY).toBeLessThanOrEqual(0.42);

    // Shell configuration is mini tier with small particle count (80-150)
    expect(firstLaunch.shell.tier).toBe('mini');
    if (firstLaunch.shell.burst && firstLaunch.shell.burst.particleCount) {
      expect(firstLaunch.shell.burst.particleCount).toBeGreaterThanOrEqual(80);
      expect(firstLaunch.shell.burst.particleCount).toBeLessThanOrEqual(150);
    }
  });

  it('should trigger grand high-altitude bursts when big shell branch rolls', () => {
    const manager = new AmbientFireworkManager({
      fireworkSystem: mockFireworkSystem,
      bigShellChance: 1.0,
      enabled: true
    });

    manager.triggerAmbientBurst();
    vi.advanceTimersByTime(2000);

    expect(mockFireworkSystem.launchRandom).toHaveBeenCalled();
    expect(launchedShells.length).toBeGreaterThanOrEqual(3);
    expect(launchedShells.length).toBeLessThanOrEqual(4);

    const firstLaunch = launchedShells[0];
    expect(firstLaunch.opts.sectorId).toBe('center');
    expect(firstLaunch.opts.ratioY).toBeGreaterThanOrEqual(0.55);
    expect(firstLaunch.opts.ratioY).toBeLessThanOrEqual(0.78);
    expect(firstLaunch.shell.tier).toBe('grand');
  });

  it('should delegate to scriptVariationEngine if provided for big shells', () => {
    const mockEngine = {
      execute: vi.fn()
    };
    const manager = new AmbientFireworkManager({
      fireworkSystem: mockFireworkSystem,
      scriptVariationEngine: mockEngine,
      bigShellChance: 1.0,
      enabled: true
    });

    manager.triggerAmbientBurst();
    expect(mockEngine.execute).toHaveBeenCalledWith('gift', {
      data: { comboCount: 1 }
    });
  });

  it('should yield and not launch ambient fireworks when interactionManager queue is active', () => {
    const mockInteractionManager = {
      queue: [{ id: 'gift_item', priority: 5 }]
    };

    const manager = new AmbientFireworkManager({
      fireworkSystem: mockFireworkSystem,
      interactionManager: mockInteractionManager,
      enabled: true
    });

    manager.tick();
    vi.advanceTimersByTime(1000);

    // Nothing should be launched because queue is occupied
    expect(mockFireworkSystem.launchRandom).not.toHaveBeenCalled();

    // Clear queue, tick should now launch
    mockInteractionManager.queue = [];
    manager.tick();
    vi.advanceTimersByTime(1000);

    expect(mockFireworkSystem.launchRandom).toHaveBeenCalled();
  });

  it('should automatically schedule subsequent bursts when started', () => {
    const manager = new AmbientFireworkManager({
      fireworkSystem: mockFireworkSystem,
      minIntervalMs: 2000,
      maxIntervalMs: 2000,
      enabled: true
    });

    manager.start();
    expect(manager.isRunning).toBe(true);

    // Fast forward through 2 intervals (4000ms)
    vi.advanceTimersByTime(2500);
    expect(mockFireworkSystem.launchRandom).toHaveBeenCalled();

    const callCountAfterFirst = mockFireworkSystem.launchRandom.mock.calls.length;

    vi.advanceTimersByTime(2500);
    expect(mockFireworkSystem.launchRandom.mock.calls.length).toBeGreaterThan(callCountAfterFirst);

    manager.stop();
    expect(manager.isRunning).toBe(false);
  });
});

