import { describe, it, expect, vi } from 'vitest';
import * as THREE from 'three';
import { ViewingDeck } from '../../src/environment/ViewingDeck.js';
import {
  SpectatorCrowd,
  SYSTEM_SPEECH_PHRASES,
  SYSTEM_SPEECH_AUDIO
} from '../../src/environment/SpectatorCrowd.js';

describe('ViewingDeck and SpectatorCrowd', () => {
  it('should create ViewingDeck with deck floor, railing, and lanterns', () => {
    const deck = new ViewingDeck();
    expect(deck.group).toBeInstanceOf(THREE.Group);
    expect(deck.group.children.length).toBeGreaterThan(2);
    expect(deck.lanterns.length).toBeGreaterThanOrEqual(4);

    // Ensure update runs cleanly
    expect(() => deck.update(0.016)).not.toThrow();
  });

  it('should initialize SpectatorCrowd with both male and female participant characters', () => {
    const crowd = new SpectatorCrowd();
    expect(crowd.group).toBeInstanceOf(THREE.Group);
    expect(crowd.characters.length).toBeGreaterThanOrEqual(2);

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

    // Verify back-of-shirt jersey plate exists on all characters
    for (const char of crowd.characters) {
      expect(char.shirtPlate).toBeDefined();
      expect(char.torso.children).toContain(char.shirtPlate);
    }
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
    const char = crowd.characters.find((c) => !c.isHonorary) || crowd.characters[0];

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

  it('should support uncluttered crowd and custom slotCount', () => {
    const crowdDefault = new SpectatorCrowd();
    expect(crowdDefault.characters.length).toBe(10);

    const crowdCustom = new SpectatorCrowd({ slotCount: 4 });
    expect(crowdCustom.characters.length).toBe(4);
  });

  it('should distribute crowd across multi-depth rows from front railing to foreground deck', () => {
    const crowd = new SpectatorCrowd();
    expect(crowd.characters.length).toBe(10);

    const zPositions = crowd.characters.map((c) => c.group.position.z);
    expect(Math.min(...zPositions)).toBeLessThanOrEqual(-13.0);
    expect(Math.max(...zPositions)).toBeGreaterThanOrEqual(-6.0);
  });

  it('should support prominent speech bubbles with sender name', () => {
    const crowd = new SpectatorCrowd();
    const char = crowd.characters[0];

    crowd.showSpeech(char, 'Xin chao ca nha!', 6.0, 'ThaoLinh');
    expect(char.speechTimer).toBe(6.0);
  });

  it('should isolate focused spectator and hide other characters and tags in third-person view', () => {
    const crowd = new SpectatorCrowd();
    const targetChar = crowd.characters[2];

    crowd.setThirdPersonFocus(targetChar);

    expect(targetChar.group.visible).toBe(false);
    expect(targetChar.nameTag.visible).toBe(false);
    expect(targetChar.speechBubble.visible).toBe(false);

    // Other characters should remain visible but made translucent (mờ đi) with hidden tags
    for (const char of crowd.characters) {
      if (char !== targetChar) {
        expect(char.group.visible).toBe(true);
        expect(char.nameTag.visible).toBe(false);
      }
    }

    // Restore focus
    crowd.setThirdPersonFocus(null);
    for (const char of crowd.characters) {
      expect(char.group.visible).toBe(true);
      if (char.isHonorary) {
        expect(char.nameTag.visible).toBe(true);
      }
    }
  });

  it('should prioritize front-row railing slots when a new viewer sends a gift', () => {
    const crowd = new SpectatorCrowd();
    const gifterUser = { name: 'super_gifter_123', nickname: 'Super Gifter' };

    const char = crowd.onViewerAction(gifterUser, {
      giftName: 'Universe',
      diamondCount: 34999
    });

    expect(char).toBeDefined();
    // Should be at front railing (Z <= -13.0)
    expect(char.group.position.z).toBeLessThanOrEqual(-13.0);
  });

  it('should initialize 3 foreground VIP honorary podiums and update leader dynamically', () => {
    const crowd = new SpectatorCrowd();

    expect(crowd.honoraryCharacters.gifter).toBeDefined();
    expect(crowd.honoraryCharacters.liker).toBeDefined();
    expect(crowd.honoraryCharacters.commenter).toBeDefined();

    const gifter = crowd.honoraryCharacters.gifter;
    expect(gifter.isHonorary).toBe(true);
    expect(gifter.honoraryType).toBe('gifter');
    expect(gifter.nameTag.visible).toBe(true);
    expect(gifter.state).toBe('sitting');
    expect(crowd.vipTableGroup).toBeDefined();
    expect(gifter.group.position.z).toBeGreaterThan(-4.0);

    // Dynamic leadership overtake
    crowd.updateHonoraryLeader('gifter', { name: 'VIP_Tycoon_99', nickname: 'Tycoon 99' }, 25000);
    expect(gifter.name).toBe('Tycoon 99');
    expect(gifter.honoraryScore).toBe(25000);
    expect(gifter.state).toBe('cheering');
  });

  it('should initialize all spectators in seated posture and support seat swapping', () => {
    const crowd = new SpectatorCrowd();
    // All characters must be sitting by default
    for (const char of crowd.characters) {
      expect(char.state).toBe('sitting');
    }

    // Trigger seat swap
    crowd.triggerRandomSeatSwap();
    const walkingChar = crowd.characters.find((c) => c.state === 'walking');
    expect(walkingChar).toBeDefined();
    expect(walkingChar.isHonorary).toBeFalsy();

    // Advance update until walking completes
    walkingChar.group.position.copy(walkingChar.targetPos);
    crowd.update(0.1);
    expect(walkingChar.state).toBe('sitting');
  });

  it('should map SYSTEM_SPEECH_PHRASES to audio files in SYSTEM_SPEECH_AUDIO correctly', () => {
    expect(SYSTEM_SPEECH_AUDIO).toBeDefined();
    for (const phrase of SYSTEM_SPEECH_PHRASES) {
      expect(SYSTEM_SPEECH_AUDIO).toHaveProperty(phrase);
    }

    expect(SYSTEM_SPEECH_AUDIO['Pháo hoa đẹp quá!']).toBe('01-phao-hoa-dep-qua.mp3');
    expect(SYSTEM_SPEECH_AUDIO['Tim để bắn pháo!']).toBe('02-tim-de-ban-phao.mp3');
    expect(SYSTEM_SPEECH_AUDIO['FWA Community!']).toBeNull();
  });

  it('should play and pool speech audio when Audio global exists', () => {
    const playMock = vi.fn().mockResolvedValue(undefined);
    const pauseMock = vi.fn();

    class MockAudio {
      constructor(src) {
        this.src = src;
        this.volume = 1.0;
        this.currentTime = 0;
        this.play = playMock;
        this.pause = pauseMock;
      }
    }

    const originalAudio = global.Audio;
    global.Audio = MockAudio;

    try {
      const crowd = new SpectatorCrowd({
        speechVolume: 0.7
      });

      // Show speech with a valid audio phrase
      const char = crowd.characters[0];
      crowd.showSpeech(char, 'Pháo hoa đẹp quá!');

      expect(crowd.audioPool.has('01-phao-hoa-dep-qua.mp3')).toBe(true);
      const audioInstance = crowd.audioPool.get('01-phao-hoa-dep-qua.mp3');
      expect(audioInstance.src).toContain('01-phao-hoa-dep-qua.mp3');
      expect(audioInstance.volume).toBe(0.7);
      expect(playMock).toHaveBeenCalled();

      // Trigger second phrase to verify previous audio is paused
      crowd.showSpeech(char, 'Tim để bắn pháo!');
      expect(pauseMock).toHaveBeenCalled();
      expect(crowd.audioPool.has('02-tim-de-ban-phao.mp3')).toBe(true);

      // Trigger phrase with null audio
      crowd.showSpeech(char, 'FWA Community!');
      // Should not throw or crash

      // Verify dispose cleans up audio
      crowd.dispose();
      expect(crowd.audioPool.size).toBe(0);
      expect(crowd.currentSpeechAudio).toBeNull();
    } finally {
      global.Audio = originalAudio;
    }
  });

  it('should return prioritized tour candidates with sponsor and honorary characters first', () => {
    const crowd = new SpectatorCrowd();
    const sponsorUser = {
      id: 'sponsor_99',
      name: 'sponsor_fan',
      nickname: 'Sponsor Fan'
    };

    // User sends gift to get their character active
    crowd.onViewerAction(sponsorUser, { giftName: 'Heart' });

    const candidates = crowd.getTourCandidates('sponsor_99', 5);
    expect(candidates).toBeInstanceOf(Array);
    expect(candidates.length).toBeGreaterThanOrEqual(1);
    expect(candidates.length).toBeLessThanOrEqual(5);

    // First candidate should be the sponsor
    expect(candidates[0].userId).toBe('sponsor_99');

    // All candidates must have a valid 3D group
    for (const c of candidates) {
      expect(c.group).toBeDefined();
    }
  });
});

