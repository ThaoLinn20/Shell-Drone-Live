import { describe, it, expect } from 'vitest';
import {
  ProceduralShellGenerator,
  TIER_BUDGETS,
  COLOR_PALETTES
} from '../../src/factories/ProceduralShellGenerator.js';

describe('ProceduralShellGenerator', () => {
  const generator = new ProceduralShellGenerator();

  it('should generate mini tier shell within particle budget', () => {
    const shell = generator.generate({ tier: 'mini' });
    expect(shell).toBeDefined();
    expect(shell.type).toBe('firework');
    expect(shell.tier).toBe('mini');
    expect(shell.particleCount).toBeGreaterThanOrEqual(TIER_BUDGETS.mini.minParticles);
    expect(shell.particleCount).toBeLessThanOrEqual(TIER_BUDGETS.mini.maxParticles);
    expect(TIER_BUDGETS.mini.allowedShapes).toContain(shell.shape);
    expect(TIER_BUDGETS.mini.allowedDynamics).toContain(shell.effect);
  });

  it('should generate grand tier shell with pistil and active effects', () => {
    const shell = generator.generate({ tier: 'grand', pistil: true, effect: 'strobe' });
    expect(shell.tier).toBe('grand');
    expect(shell.modifiers.pistil).toBe(true);
    expect(shell.modifiers.strobe).toBe(true);
    expect(shell.effectTags).toContain('strobe');
    expect(shell.particleCount).toBeGreaterThanOrEqual(TIER_BUDGETS.grand.minParticles);
    expect(shell.particleCount).toBeLessThanOrEqual(TIER_BUDGETS.grand.maxParticles);
  });

  it('should clamp particleCount when explicitly provided outside tier budget', () => {
    const shellHigh = generator.generate({ tier: 'mini', particleCount: 9999 });
    expect(shellHigh.particleCount).toBe(TIER_BUDGETS.mini.maxParticles);

    const shellLow = generator.generate({ tier: 'mini', particleCount: 5 });
    expect(shellLow.particleCount).toBe(TIER_BUDGETS.mini.minParticles);
  });

  it('should generate coordinated multi-shell volley with sequential delays', () => {
    const volley = generator.generateVolley(4, { tier: 'medium' });
    expect(volley).toHaveLength(4);
    for (let i = 0; i < volley.length; i++) {
      expect(volley[i].shell).toBeDefined();
      expect(volley[i].shell.tier).toBe('medium');
      expect(volley[i].delay).toBeCloseTo(i * 0.25, 2);
      expect(volley[i].offsetPosition).toHaveProperty('x');
    }
  });

  it('should apply color palette correctly', () => {
    const palette = COLOR_PALETTES[0];
    const shell = generator.generate({ palette });
    expect(shell.color).toBe(palette.primary);
    expect(shell.secondaryColor).toBe(palette.secondary);
  });
});

