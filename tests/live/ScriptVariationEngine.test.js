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

    // For like: big_shell (0.50) and heart (0.45) have the highest probabilities
    expect(rollCounts.big_shell).toBeGreaterThan(150);
    expect(rollCounts.heart).toBeGreaterThan(150);
    expect(rollCounts.sequence).toBeGreaterThan(0);
  });

  it('should calculate shot count adaptively based on tier and combo', () => {
    // Big shell count: strictly 3 - 4 shots regardless of event type
    for (let i = 0; i < 20; i++) {
      const bigLike = engine.resolveShotCount('big_shell', 'like', 1);
      expect(bigLike).toBeGreaterThanOrEqual(3);
      expect(bigLike).toBeLessThanOrEqual(4);

      const bigGift = engine.resolveShotCount('big_shell', 'gift', 5);
      expect(bigGift).toBeGreaterThanOrEqual(3);
      expect(bigGift).toBeLessThanOrEqual(4);
    }

    // Sequence count: strictly 1 time
    const seqCount = engine.resolveShotCount('sequence', 'like', 1);
    expect(seqCount).toBe(1);

    // Single tap like: 3 - 6 shots
    for (let i = 0; i < 20; i++) {
      const singleCount = engine.resolveShotCount('heart', 'like', 1);
      expect(singleCount).toBeGreaterThanOrEqual(3);
      expect(singleCount).toBeLessThanOrEqual(6);
    }

    // Combo tap like: 6 - 12 shots
    for (let i = 0; i < 20; i++) {
      const comboCount = engine.resolveShotCount('heart', 'like', 6);
      expect(comboCount).toBeGreaterThanOrEqual(6);
      expect(comboCount).toBeLessThanOrEqual(12);
    }

    // Gift count with general shells: single (6 - 10 shots), combo (10 - 18 shots)
    for (let i = 0; i < 20; i++) {
      const giftCount = engine.resolveShotCount('small_shell', 'gift', 1);
      expect(giftCount).toBeGreaterThanOrEqual(6);
      expect(giftCount).toBeLessThanOrEqual(10);

      const giftComboCount = engine.resolveShotCount('small_shell', 'gift', 5);
      expect(giftComboCount).toBeGreaterThanOrEqual(10);
      expect(giftComboCount).toBeLessThanOrEqual(18);
    }
  });

  it('should mutate sequence templates to exactly 1 cue entry with count 1', () => {
    const multiCueSequence = [
      { type: 'sequence', pattern: 'random', count: 3, preset: 'snow' },
      { type: 'sequence', pattern: 'random', count: 3, preset: 'snow' },
      { type: 'sequence', pattern: 'random', count: 3, preset: 'snow' }
    ];

    const mutated = engine.mutateTemplate(
      multiCueSequence,
      'sequence',
      'like',
      1
    );

    expect(mutated.length).toBe(1);
    expect(mutated[0].count).toBe(1);
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

  it('should dynamically vary colors for big shells, stages, and small shells', () => {
    const multiStageBigShell = [
      {
        type: 'sequence',
        pattern: 'sweep',
        count: 4,
        preset: 'multi_nested',
        color: '#ffffff',
        stages: [
          { color: '#111111' },
          { color: '#222222' },
          { color: '#333333' }
        ],
        secondBurst: {
          childShells: [
            { color: '#444444' }
          ]
        }
      }
    ];

    const mutatedBig = engine.mutateTemplate(
      multiStageBigShell,
      'big_shell',
      'gift',
      1
    );

    // Primary color should be assigned from harmonic palettes
    expect(mutatedBig[0].color).toBeDefined();
    expect(mutatedBig[0].color).not.toBe('#ffffff');

    // Stages must be assigned varied colors
    expect(mutatedBig[0].stages[0].color).not.toBe('#111111');
    expect(mutatedBig[0].stages[1].color).not.toBe('#222222');
    expect(mutatedBig[0].stages[2].color).not.toBe('#333333');

    // Child shells in second burst should also receive varied color
    expect(mutatedBig[0].secondBurst.childShells[0].color).not.toBe('#444444');

    // Small shell dynamic color variations across multiple mutations
    const staticSmallShell = [
      {
        type: 'sequence',
        pattern: 'random',
        count: 3,
        preset: 'chrysanthemum',
        color: 'gold'
      }
    ];

    const observedColors = new Set();
    for (let i = 0; i < 20; i++) {
      const mutatedSmall = engine.mutateTemplate(
        staticSmallShell,
        'small_shell',
        'like',
        1
      );
      observedColors.add(mutatedSmall[0].color);
    }
    // Should produce multiple diverse vibrant colors instead of static gold
    expect(observedColors.size).toBeGreaterThan(1);
    expect(observedColors.has('gold')).toBe(false);
  });

  it('should dynamically randomize size, lifetime, effects, and dynamics for small shells', () => {
    const rawSmallShell = [
      {
        type: 'sequence',
        pattern: 'random',
        count: 2,
        preset: 'crysanthemum',
        shapeType: 'sphere',
        dynamicsType: 'crysanthemum-trail',
        effects: ['burst-smoke']
      }
    ];

    const observedSizes = new Set();
    const observedLifetimes = new Set();
    const observedShapes = new Set();
    const observedDynamics = new Set();
    const observedEffects = new Set();

    for (let i = 0; i < 30; i++) {
      const mutated = engine.mutateTemplate(
        rawSmallShell,
        'small_shell',
        'like',
        1
      );
      const item = mutated[0];

      expect(item.shellSize).toBeGreaterThanOrEqual(0.85);
      expect(item.shellSize).toBeLessThanOrEqual(1.35);
      observedSizes.add(item.shellSize);

      expect(item.starLifeMultiplier).toBeGreaterThanOrEqual(0.85);
      expect(item.starLifeMultiplier).toBeLessThanOrEqual(2.0);
      observedLifetimes.add(item.starLifeMultiplier);

      observedShapes.add(item.shapeType);
      observedDynamics.add(item.dynamicsType);

      if (Array.isArray(item.effects)) {
        for (const eff of item.effects) {
          observedEffects.add(eff);
        }
      }
    }

    // Must exhibit diverse random variations across runs
    expect(observedSizes.size).toBeGreaterThan(1);
    expect(observedLifetimes.size).toBeGreaterThan(1);
    expect(observedShapes.size).toBeGreaterThan(1);
    expect(observedDynamics.size).toBeGreaterThan(1);
    expect(observedEffects.size).toBeGreaterThan(1);
  });

  it('should cap single salvos at 3-4 shells and split large counts into multiple waves', () => {
    // 1. Check splitIntoSalvos
    const salvo3 = engine.splitIntoSalvos(3, 'small_shell');
    expect(salvo3).toEqual([3]);

    const salvo4 = engine.splitIntoSalvos(4, 'small_shell');
    expect(salvo4).toEqual([4]);

    const salvo8 = engine.splitIntoSalvos(8, 'small_shell');
    expect(salvo8.length).toBe(2);
    for (const count of salvo8) {
      expect(count).toBeGreaterThanOrEqual(3);
      expect(count).toBeLessThanOrEqual(4);
    }

    const salvo12 = engine.splitIntoSalvos(12, 'small_shell');
    expect(salvo12.length).toBe(3);
    for (const count of salvo12) {
      expect(count).toBeGreaterThanOrEqual(3);
      expect(count).toBeLessThanOrEqual(4);
    }

    // 2. Check mutateTemplate produces multiple waves for combo/gift
    const sampleTemplate = [
      {
        type: 'sequence',
        pattern: 'random',
        count: 2,
        preset: 'crysanthemum',
        shapeType: 'sphere'
      }
    ];

    // combo gift (comboCount = 6) -> shot count between 10 and 18
    const comboWaves = engine.mutateTemplate(
      sampleTemplate,
      'small_shell',
      'gift',
      6
    );

    expect(comboWaves.length).toBeGreaterThanOrEqual(3);
    for (const wave of comboWaves) {
      expect(wave.count).toBeLessThanOrEqual(4);
      expect(wave.count).toBeGreaterThanOrEqual(2);
      expect(wave._waveIndex).toBeDefined();
    }
  });

  it('should enforce inverse physical coupling between size, lifetime, and particle count', () => {
    const sample = [
      {
        type: 'sequence',
        pattern: 'random',
        count: 2,
        preset: 'crysanthemum',
        shapeType: 'sphere'
      }
    ];

    let highLifeLowParticleCount = 0;
    let highSizeLowParticleCount = 0;

    for (let i = 0; i < 50; i++) {
      const [item] = engine.mutateTemplate(
        sample,
        'small_shell',
        'like',
        1
      );

      // When starLifeMultiplier is high (> 1.5), particleCountMultiplier should decrease (< 0.95)
      if (item.starLifeMultiplier > 1.5) {
        expect(item.particleCountMultiplier).toBeLessThanOrEqual(0.95);
        highLifeLowParticleCount++;
      }

      // When shellSize is high (> 1.25), particleCountMultiplier should decrease (< 0.95)
      if (item.shellSize > 1.25) {
        expect(item.particleCountMultiplier).toBeLessThanOrEqual(0.95);
        highSizeLowParticleCount++;
      }
    }

    expect(highLifeLowParticleCount).toBeGreaterThan(0);
    expect(highSizeLowParticleCount).toBeGreaterThan(0);
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

