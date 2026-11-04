import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { BeachShoreline } from '../../src/environment/BeachShoreline.js';

describe('BeachShoreline', () => {
  let shoreline;

  beforeEach(() => {
    shoreline = new BeachShoreline();
  });

  it('should initialize with default parameters, position, and meshes', () => {
    expect(shoreline.group).toBeDefined();
    expect(shoreline.position.z).toBe(415);
    expect(shoreline.width).toBe(92);
    expect(shoreline.depth).toBe(64);
    expect(shoreline.group.children.length).toBeGreaterThan(5);
    expect(shoreline.mats.length).toBe(9);
    expect(shoreline.lanterns.length).toBe(10);
    expect(shoreline.foamMesh).toBeDefined();
  });

  it('should accept custom constructor options', () => {
    const custom = new BeachShoreline({
      position: new THREE.Vector3(10, 1.5, 430),
      width: 90,
      depth: 50
    });

    expect(custom.position.x).toBe(10);
    expect(custom.position.y).toBe(1.5);
    expect(custom.position.z).toBe(430);
    expect(custom.width).toBe(90);
    expect(custom.depth).toBe(50);
  });

  it('should update wave foam opacity over time during update cycle', () => {
    expect(shoreline.foamMesh).toBeDefined();
    shoreline.update(0.1);
    expect(shoreline.foamPhase).toBeCloseTo(0.18, 2);
    expect(shoreline.foamMesh.material.opacity).toBeGreaterThan(0);
    expect(shoreline.foamMesh.material.opacity).toBeLessThanOrEqual(1.0);
  });

  it('should cleanly dispose of geometries and materials on dispose call', () => {
    expect(shoreline.disposables.length).toBeGreaterThan(0);
    shoreline.dispose();
    expect(shoreline.disposables.length).toBe(0);
    expect(shoreline.lanterns.length).toBe(0);
    expect(shoreline.mats.length).toBe(0);
  });
});

