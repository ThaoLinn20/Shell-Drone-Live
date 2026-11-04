import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { CameraManager } from '../../src/core/CameraManager.js';
import { EventBus } from '../../src/core/EventBus.js';

describe('CameraManager', () => {
  let eventBus;
  let cameraManager;

  beforeEach(() => {
    eventBus = new EventBus();
    cameraManager = new CameraManager(eventBus);
  });

  it('should initialize with perspective camera at default position', () => {
    expect(cameraManager.instance).toBeDefined();
    expect(cameraManager.instance.position.z).toBe(420);
    expect(cameraManager.trauma).toBe(0);
  });

  it('should increase trauma when firework:burst event is emitted', () => {
    eventBus.emit('firework:burst', {
      intensity: 0.8,
      position: {
        x: 0,
        y: 120,
        z: 0
      }
    });

    expect(cameraManager.trauma).toBeGreaterThan(0);
  });

  it('should compute shake offsets during update and decay trauma', () => {
    cameraManager.addImpulse(0.5);
    expect(cameraManager.trauma).toBe(0.5);

    cameraManager.update(0.016);
    expect(cameraManager.shakeOffset.lengthSq()).toBeGreaterThan(0);
    expect(cameraManager.trauma).toBeLessThan(0.5);
  });

  it('should cleanly apply and restore shake offset without position drift', () => {
    cameraManager.addImpulse(0.5);
    cameraManager.update(0.016);

    const initialY = cameraManager.instance.position.y;
    cameraManager.applyShake();
    expect(cameraManager.isShakingApplied).toBe(true);

    cameraManager.restoreShake();
    expect(cameraManager.isShakingApplied).toBe(false);
    expect(cameraManager.instance.position.y).toBeCloseTo(initialY, 5);
  });

  it('should handle burst with distance attenuation correctly', () => {
    cameraManager.onBurst({
      intensity: 1.0,
      position: {
        x: 0,
        y: 6,
        z: 300
      }
    });
    const closeTrauma = cameraManager.trauma;

    cameraManager.trauma = 0;
    cameraManager.onBurst({
      intensity: 1.0,
      position: {
        x: 0,
        y: 6,
        z: -1000
      }
    });
    const farTrauma = cameraManager.trauma;

    expect(closeTrauma).toBeGreaterThan(farTrauma);
  });

  it('should switch between camera modes and update position accordingly', () => {
    // Free mode initial
    expect(cameraManager.mode).toBe('free');

    // Switch to boat mode with a mock sceneManager
    cameraManager.sceneManager = {
      setBoatPassengerPos: () => {},
      getBoatTransform: () => ({
        x: 100,
        y: 4.3,
        z: 150,
        dir: 1
      })
    };

    cameraManager.setMode('boat');
    expect(cameraManager.mode).toBe('boat');

    cameraManager.update(0.016);
    expect(cameraManager.instance.position.x).toBeCloseTo(100);
    expect(cameraManager.instance.position.y).toBeCloseTo(4.3);
    expect(cameraManager.instance.position.z).toBeCloseTo(150);

    // Switch to birds_eye mode
    cameraManager.setMode('birds_eye');
    expect(cameraManager.mode).toBe('birds_eye');

    const initialX = cameraManager.birdsEyePos.x;
    cameraManager.update(0.5);
    // Drifts along heading
    expect(cameraManager.instance.position.x).not.toBe(initialX);
    expect(cameraManager.instance.position.y).toBeCloseTo(220);

    // Test WASD steering in birds_eye mode
    cameraManager.handleWasdInput(-1, 0, false, 0.1);
    expect(cameraManager.birdsEyeDriftHeading.x).toBeCloseTo(-1);

    // Switch back to free mode
    cameraManager.setMode('free');
    expect(cameraManager.mode).toBe('free');
  });

  it('should adjust speed multiplier correctly', () => {
    expect(cameraManager.speedMultiplier).toBe(1.0);
    cameraManager.setSpeedMultiplier(2.5);
    expect(cameraManager.speedMultiplier).toBe(2.5);

    cameraManager.setSpeedMultiplier(-1);
    expect(cameraManager.speedMultiplier).toBe(0.1);
  });

  it('should reset position and orientation correctly on resetPosition call', () => {
    // 1. Free mode reset
    cameraManager.instance.position.set(50, 100, 200);
    cameraManager.resetPosition();
    expect(cameraManager.instance.position.x).toBe(0);
    expect(cameraManager.instance.position.y).toBe(6);
    expect(cameraManager.instance.position.z).toBe(420);

    // 2. Boat mode reset
    cameraManager.setMode('boat');
    cameraManager.userBoatOffset.set(5, 2, -3);
    cameraManager.resetPosition();
    expect(cameraManager.userBoatOffset.x).toBe(0);
    expect(cameraManager.userBoatOffset.y).toBe(0);
    expect(cameraManager.userBoatOffset.z).toBe(0);

    // 3. Birds eye mode reset
    cameraManager.setMode('birds_eye');
    cameraManager.birdsEyePos.set(100, 300, 100);
    cameraManager.resetPosition();
    expect(cameraManager.birdsEyePos.x).toBe(0);
    expect(cameraManager.birdsEyePos.y).toBe(220);
    expect(cameraManager.birdsEyePos.z).toBe(380);
  });

  it('should steer boat when shift is held in boat mode', () => {
    let steered = false;
    cameraManager.sceneManager = {
      getBoatTransform: () => ({ x: 0, y: 0, z: 100, dir: 1 }),
      steerBoat: (dx, dz) => {
        steered = true;
      }
    };
    cameraManager.setMode('boat');

    // Without shift: adjusts user vantage offset
    cameraManager.handleWasdInput(1, 0, false, 0.1);
    expect(cameraManager.userBoatOffset.x).toBeGreaterThan(0);

    // With shift: calls steerBoat
    cameraManager.handleWasdInput(1, 0, true, 0.1);
    expect(steered).toBe(true);
  });

  it('should reverse heading when hitting spatial boundaries in birds_eye mode', () => {
    cameraManager.setMode('birds_eye');
    cameraManager.birdsEyePos.set(499, 220, 380);
    cameraManager.birdsEyeDriftHeading.set(1, 0, 0);

    // Update will push it past 500
    cameraManager.update(0.5);

    expect(cameraManager.birdsEyePos.x).toBe(500);
    expect(cameraManager.birdsEyeDriftHeading.x).toBeLessThan(0);
  });

  it('should lock broadcast view and prevent position or orientation changes', () => {
    const fixedPos = new THREE.Vector3(0, 7.2, 424);
    const fixedTarget = new THREE.Vector3(0, 85, 0);

    cameraManager.lockBroadcastView(fixedPos, fixedTarget);
    expect(cameraManager.isBroadcastLocked).toBe(true);
    expect(cameraManager.instance.position.x).toBe(0);
    expect(cameraManager.instance.position.y).toBe(7.2);
    expect(cameraManager.instance.position.z).toBe(424);

    // WASD input ignored
    cameraManager.handleWasdInput(1, 1, false, 0.1);
    cameraManager.update(0.016);
    expect(cameraManager.instance.position.x).toBe(0);
    expect(cameraManager.instance.position.y).toBe(7.2);
    expect(cameraManager.instance.position.z).toBe(424);
  });

  it('should focus in third-person view behind character when gifted and smoothly return', () => {
    const fixedPos = new THREE.Vector3(0, 6.2, 421.5);
    const fixedTarget = new THREE.Vector3(0, 90, 0);
    cameraManager.lockBroadcastView(fixedPos, fixedTarget);

    const charGroup = new THREE.Group();
    charGroup.position.set(-2.0, 4.0, 401.0);
    const mockChar = { group: charGroup };

    cameraManager.focusThirdPersonOnCharacter(mockChar, 2.0);

    expect(cameraManager.thirdPersonState).toBeDefined();
    expect(cameraManager.thirdPersonState.phase).toBe('entering');

    // Entering transition
    cameraManager.update(0.6);
    expect(cameraManager.instance.position.z).toBeLessThan(421.5);

    // Complete entrance to holding phase
    cameraManager.update(0.7);
    expect(cameraManager.thirdPersonState.phase).toBe('holding');
    // Position should be behind spectator (Z around 401.0 + 2.2 = 403.2)
    expect(cameraManager.instance.position.z).toBeCloseTo(403.2, 0);
    expect(cameraManager.instance.position.x).toBeLessThan(0);

    // Holding for duration
    cameraManager.update(2.1);
    expect(cameraManager.thirdPersonState.phase).toBe('returning');

    // Return to broadcast tripod
    cameraManager.update(1.5);
    expect(cameraManager.thirdPersonState).toBeNull();
    expect(cameraManager.instance.position.z).toBeCloseTo(421.5, 1);
  });

  it('should support spectator:focus_third_person eventBus trigger', () => {
    const charGroup = new THREE.Group();
    charGroup.position.set(1.5, 4.0, 405.0);
    const mockChar = { group: charGroup };

    eventBus.emit('spectator:focus_third_person', {
      character: mockChar,
      duration: 3.0
    });

    expect(cameraManager.thirdPersonState).toBeDefined();
    expect(cameraManager.thirdPersonState.character).toBe(mockChar);
    expect(cameraManager.thirdPersonState.holdDuration).toBe(3.0);
  });

  it('should cancel third-person view when cancelThirdPersonView is called', () => {
    const charGroup = new THREE.Group();
    charGroup.position.set(0, 4.0, 405.0);
    cameraManager.focusThirdPersonOnCharacter({ group: charGroup });

    expect(cameraManager.thirdPersonState).not.toBeNull();
    cameraManager.cancelThirdPersonView();
    expect(cameraManager.thirdPersonState).toBeNull();
  });

  it('should isolate spectator crowd during third-person view and restore when finished', () => {
    const focusCalls = [];
    cameraManager.sceneManager = {
      spectatorCrowd: {
        setThirdPersonFocus: (char) => {
          focusCalls.push(char);
        }
      }
    };

    const mockChar = { group: new THREE.Group() };
    cameraManager.focusThirdPersonOnCharacter(mockChar, 1.0);

    expect(focusCalls[0]).toBe(mockChar);

    cameraManager.cancelThirdPersonView();
    expect(focusCalls[focusCalls.length - 1]).toBeNull();
  });
});
