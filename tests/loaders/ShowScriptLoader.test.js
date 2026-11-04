import { describe, it, expect } from 'vitest';
import { ShowScriptLoader } from '../../src/loaders/ShowScriptLoader.js';

describe('ShowScriptLoader', () => {
  const loader = new ShowScriptLoader();

  it('should validate and sanitize array of sequence cues', () => {
    const rawCues = [
      { time: 1.5, preset: 'strobe_white', shapeType: 'sphere', count: 120 },
      { time: 0.2, preset: 'willow', shapeType: 'willow', count: 200 }
    ];

    const result = loader.validate(rawCues);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.normalizedCues).toHaveLength(2);
    // Should be sorted by time ascending
    expect(result.normalizedCues[0].time).toBe(0.2);
    expect(result.normalizedCues[1].time).toBe(1.5);
  });

  it('should validate wrapped format with sequences array', () => {
    const showObj = {
      version: '1.0.0',
      sequences: [
        { timestamp: 2.0, preset: 'crossette_ring', shapeType: 'ring' }
      ]
    };

    const result = loader.validate(showObj);
    expect(result.valid).toBe(true);
    expect(result.normalizedCues[0].time).toBe(2.0);
    expect(result.normalizedCues[0].shapeType).toBe('ring');
  });

  it('should gracefully handle empty or invalid JSON without crashing', () => {
    const nullRes = loader.validate(null);
    expect(nullRes.valid).toBe(false);
    expect(nullRes.normalizedCues).toHaveLength(0);

    const emptyRes = loader.validate({});
    expect(emptyRes.valid).toBe(false);
    expect(emptyRes.normalizedCues).toHaveLength(0);

    const invalidStringRes = loader.validate('not an object');
    expect(invalidStringRes.valid).toBe(false);
  });

  it('should register and retrieve shows in registry', () => {
    const cues = [{ time: 0, preset: 'strobe_gold', shape: 'star' }];
    const registered = loader.registerShow('celebration_test', cues);
    expect(registered).toBe(true);
    expect(loader.getShow('celebration_test')).toHaveLength(1);
    expect(loader.listShows()).toContain('celebration_test');
  });
});

