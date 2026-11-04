import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  ScriptVariationEngine,
  ALTITUDE_BOUNDS,
  PROBABILITY_MATRIX,
  CURATED_COLOR_PALETTES
} from '../../src/live/ScriptVariationEngine.js';

describe('ScriptVariationEngine', () => {
  let engine;
  let mockFireworkSystem;
  let mockSequencer;

  const mockScripts = {
    '/shell-scripts/heart/shell1.json': [
      {
        type: 'sequence',
        pattern: 'sweep',
        count: 2,
        preset: 'heart',
        shapeType: 'heart',
        color: '#ff4081',
        ratioY: 0.5
      }
    ],
    '/shell-scripts/small-shell/shell1.json': [
      {
        type: 'sequence',
        pattern: 'random',
        count: 2,
        preset: 'crysanthemum',
        shapeType: 'sphere',
        color: 'gold',
        ratioY: 0.6
      }
    ],
    '/shell-scripts/big-shell/shell1.json': [
      {
        type: 'sequence',
        pattern: 'sweep-custom-curve',
        count: 4,
        preset: 'multi_nested',
        shapeType: 'sphere',
        color: 'cyan',
        ratioY: 0.8
      }
    ],
    '/shell-scripts/sequences/snow.json': [
      {
        type: 'sequence',
        pattern: 'random',
        count: 3,
        preset: 'snow',
        shapeType: 'sphere',
        color: 'gold',
        ratioY: 0.7
      }
    ]
  };

  beforeEach(() => {
    vi.useFakeTimers();

    mockFireworkSystem = {
      launchRandom: vi.fn()
    };

    mockSequencer = {
      playPattern: vi.fn()
    };

    engine = new ScriptVariationEngine({
      fireworkSystem: mockFireworkSystem,
      fireworkSequencer: mockSequencer,
      scripts: mockScripts
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should categorize and index templates correctly', () => {
    expect(engine.catalog.heart.length).toBe(1);
    expect(engine.catalog.small_shell.length).toBe(1);
    expect(engine.catalog.big_shell.length).toBe(1);
    expect(engine.catalog.sequence.length).toBe(1);

    const defaultEngine = new ScriptVariationEngine({
      fireworkSystem: mockFireworkSystem,
      fireworkSequencer: mockSequencer
    });
    console.log('DEFAULT ENGINE CATALOG COUNTS:', {
      heart: defaultEngine.catalog.heart.length,
      small_shell: defaultEngine.catalog.small_shell.length,
      big_shell: defaultEngine.catalog.big_shell.length,
      sequence: defaultEngine.catalog.sequence.length
    });
  });

  it('should guarantee template immutability through deepFreeze', () => {
    const originalHeart = engine.catalog.heart[0][0];
    expect(Object.isFrozen(originalHeart)).toBe(true);

    // Attempting to mutate a cloned result should never affect catalog
    const mutated = engine.mutateTemplate(
      engine.catalog.heart[0],
      'heart',
      'like',
      1
    );
    mutated[0].ratioY = 0.999;
    mutated[0].count = 99;

    expect(engine.catalog.heart[0][0].ratioY).toBe(0.5);
    expect(engine.catalog.heart[0][0].count).toBe(2);
  });

  it('should roll variants according to probability weights', () => {
    const rollCounts = {
      heart: 0,
      small_shell: 0,
      big_shell: 0,
      sequence: 0
    };

    for (let i = 0; i < 500; i++) {
      const variant = engine.rollVariant('like', 'single');
      rollCounts[variant] += 1;
    }

    // For like: heart has highest probability (0.75)
    expect(rollCounts.heart).toBeGreaterThan(rollCounts.small_shell);
    expect(rollCounts.small_shell).toBeGreaterThan(rollCounts.big_shell);
  });

  it('should calculate shot count adaptively based on tier and combo', () => {
    // Single tap like: 2 - 4 shots
    for (let i = 0; i < 20; i++) {
      const singleCount = engine.resolveShotCount('heart', 'like', 1);
      expect(singleCount).toBeGreaterThanOrEqual(2);
      expect(singleCount).toBeLessThanOrEqual(4);
    }

    // Combo tap like: 4 - 8 shots
    for (let i = 0; i < 20; i++) {
      const comboCount = engine.resolveShotCount('heart', 'like', 6);
      expect(comboCount).toBeGreaterThanOrEqual(4);
      expect(comboCount).toBeLessThanOrEqual(8);
    }

    // Gift count: 5 - 15 shots
    for (let i = 0; i < 20; i++) {
      const giftCount = engine.resolveShotCount('big_shell', 'gift', 1);
      expect(giftCount).toBeGreaterThanOrEqual(5);
      expect(giftCount).toBeLessThanOrEqual(8);
    }
  });

  it('should constrain altitude strictly within defined layer bounds', () => {
    for (let i = 0; i < 50; i++) {
      const heartAlt = engine.resolveAltitude('heart');
      expect(heartAlt).toBeGreaterThanOrEqual(0.24);
      expect(heartAlt).toBeLessThanOrEqual(0.65);

      const smallAlt = engine.resolveAltitude('small_shell');
      expect(smallAlt).toBeGreaterThanOrEqual(0.40);
      expect(smallAlt).toBeLessThanOrEqual(0.78);

      const bigAlt = engine.resolveAltitude('big_shell');
      expect(bigAlt).toBeGreaterThanOrEqual(0.65);
      expect(bigAlt).toBeLessThanOrEqual(0.95);
    }
  });

  it('should execute and dispatch mutated sequence via FireworkSequencer', () => {
    engine.execute('like', { data: { comboCount: 1 } });

    expect(engine.diagnostics.totalExecuted).toBe(1);

    // Fast forward fake timer to allow micro-stagger to trigger
    vi.advanceTimersByTime(250);

    expect(mockSequencer.playPattern).toHaveBeenCalled();
    const [pattern, item] = mockSequencer.playPattern.mock.calls[0];
    expect(pattern).toBeDefined();
    expect(item.ratioY).toBeDefined();
    expect(item.count).toBeDefined();
  });

  it('should fallback to procedural launch when no script is available', () => {
    const emptyEngine = new ScriptVariationEngine({
      fireworkSystem: mockFireworkSystem,
      scripts: {}
    });

    emptyEngine.execute('like');
    expect(mockFireworkSystem.launchRandom).toHaveBeenCalled();
  });
});

