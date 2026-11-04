import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { ViewingDeck } from '../../src/environment/ViewingDeck.js';
import { SpectatorCrowd } from '../../src/environment/SpectatorCrowd.js';

describe('ViewingDeck and SpectatorCrowd', () => {
  it('should create ViewingDeck with deck floor, railing, and lanterns', () => {
    const deck = new ViewingDeck();
    expect(deck.group).toBeInstanceOf(THREE.Group);
    expect(deck.group.children.length).toBeGreaterThan(2);
    expect(deck.lanterns.length).toBe(4);

    // Ensure update runs cleanly
    expect(() => deck.update(0.016)).not.toThrow();
  });

  it('should initialize SpectatorCrowd with both male and female participant characters', () => {
    const crowd = new SpectatorCrowd();
    expect(crowd.group).toBeInstanceOf(THREE.Group);
    expect(crowd.characters.length).toBeGreaterThanOrEqual(8);

    const hasMale = crowd.characters.some((c) => c.gender === 'male');
    const hasFemale = crowd.characters.some((c) => c.gender === 'female');
    expect(hasMale).toBe(true);
    expect(hasFemale).toBe(true);

    const femaleChar = crowd.characters.find((c) => c.gender === 'female');
    expect(femaleChar).toBeDefined();
    expect(femaleChar.skirt).toBeDefined();

    const maleChar = crowd.characters.find((c) => c.gender === 'male');
    expect(maleChar).toBeDefined();
    expect(maleChar.skirt).toBeNull();
  });

  it('should trigger viewer celebration when onViewerAction is called', () => {
    const crowd = new SpectatorCrowd();
    const user = { name: 'linh_dan_sg', nickname: 'Linh Dan' };

    crowd.onViewerAction(user, { giftName: 'Rose' });

    // Find the character assigned to Linh Dan
    const char = crowd.characters.find((c) => c.name.toLowerCase() === 'linh dan');
    expect(char).toBeDefined();
    expect(char.cheerTimer).toBeGreaterThan(0);
  });

  it('should assign a new slot and cheer when an unfamiliar viewer joins', () => {
    const crowd = new SpectatorCrowd();
    const newViewer = { name: 'super_fan_2026', nickname: 'Super Fan' };

    crowd.onViewerAction(newViewer, { giftName: 'Fireworks' });

    const char = crowd.characters.find((c) => c.name === 'Super Fan');
    expect(char).toBeDefined();
    expect(char.cheerTimer).toBe(3.5);
  });

  it('should animate characters smoothly during update', () => {
    const crowd = new SpectatorCrowd();
    const char = crowd.characters[0];
    char.cheerTimer = 2.0;

    expect(() => crowd.update(0.016)).not.toThrow();
    // Arm rotation should be raised during celebration
    expect(char.leftArmGroup.rotation.z).toBeGreaterThan(1.0);

    // After cheerTimer expires
    crowd.update(3.0);
    expect(char.cheerTimer).toBeLessThanOrEqual(0);
    expect(char.leftArmGroup.rotation.z).toBeCloseTo(0, 1);
  });

  it('should support sitting, standing, and walking behaviors', () => {
    const crowd = new SpectatorCrowd();
    const char = crowd.characters[0];

    // Test sitting down
    crowd.sitDown(char);
    expect(char.state).toBe('sitting');
    expect(char.torso.position.y).toBeLessThan(1.0);
    expect(char.leftLegGroup.rotation.x).toBeLessThan(0);

    // Test standing back up
    crowd.standUp(char);
    expect(char.torso.position.y).toBe(1.2);
    expect(char.leftLegGroup.rotation.x).toBe(0);

    // Test walking state
    crowd.pickRandomWalkTarget(char);
    expect(char.state).toBe('walking');
    expect(char.targetPos).toBeDefined();

    // Walking animation step
    const prevX = char.group.position.x;
    crowd.update(0.1);
    expect(() => crowd.update(0.1)).not.toThrow();
  });

  it('should support speech bubble display', () => {
    const crowd = new SpectatorCrowd();
    const char = crowd.characters[0];

    crowd.showSpeech(char, 'Phao hoa dep qua!', 3.0);
    expect(char.speechTimer).toBe(3.0);

    // Speech expires
    crowd.update(3.5);
    expect(char.speechTimer).toBeLessThanOrEqual(0);
  });

  it('should constrain crowd characters within safe 9:16 vertical viewport bounds', () => {
    const crowd = new SpectatorCrowd();
    for (const char of crowd.characters) {
      expect(char.group.position.x).toBeGreaterThanOrEqual(-5.5);
      expect(char.group.position.x).toBeLessThanOrEqual(5.5);
    }
  });
});

