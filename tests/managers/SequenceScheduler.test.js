import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SequenceScheduler, SCHEDULER_STATES } from '../../src/managers/SequenceScheduler.js';
import { DirectorLaptop } from '../../src/environment/DirectorLaptop.js';

describe('SequenceScheduler', () => {
  let mockShowDirector;
  let mockAmbientManager;
  let mockEventBus;
  let scheduler;

  const testSequences = [
    {
      id: 'test_seq_1',
      title: 'Grand Test 1',
      category: 'Finale',
      duration: 5.0,
      interval: 30.0,
      cues: [
        { time: 0, type: 'sequence', preset: 'crysanthemum' },
        { time: 2, type: 'sequence', preset: 'willow' }
      ]
    },
    {
      id: 'test_seq_2',
      title: 'Grand Test 2',
      category: 'Mid Show',
      duration: 6.0,
      interval: 40.0,
      cues: [
        { time: 0, type: 'sequence', preset: 'heart' }
      ]
    }
  ];

  beforeEach(() => {
    mockShowDirector = {
      loadScript: vi.fn(),
      seek: vi.fn(),
      play: vi.fn(),
      pause: vi.fn(),
      stop: vi.fn(),
      isPlaying: false
    };

    mockAmbientManager = {
      enabled: true,
      start: vi.fn(),
      stop: vi.fn()
    };

    mockEventBus = {
      emit: vi.fn()
    };

    scheduler = new SequenceScheduler({
      showDirector: mockShowDirector,
      ambientFireworkManager: mockAmbientManager,
      eventBus: mockEventBus,
      sequences: testSequences,
      interval: 30.0,
      cooldownDuration: 5.0
    });
  });

  it('should initialize with COUNTDOWN state and first sequence', () => {
    expect(scheduler.state).toBe(SCHEDULER_STATES.COUNTDOWN);
    expect(scheduler.countdownTimer).toBe(30.0);

    const info = scheduler.getInfo();
    expect(info.sequenceName).toBe('Grand Test 1');
    expect(info.timeFormatted).toBe('00:30.0');
    expect(info.cueCount).toBe(2);
  });

  it('should count down as deltaTime elapses', () => {
    scheduler.update(10.0);
    expect(scheduler.countdownTimer).toBeCloseTo(20.0);
    expect(scheduler.state).toBe(SCHEDULER_STATES.COUNTDOWN);

    const info = scheduler.getInfo();
    expect(info.timeFormatted).toBe('00:20.0');
  });

  it('should fire sequence when countdown reaches 0 and pause ambient fireworks', () => {
    scheduler.update(30.5);

    expect(scheduler.state).toBe(SCHEDULER_STATES.FIRING);
    expect(mockAmbientManager.stop).toHaveBeenCalled();
    expect(mockShowDirector.loadScript).toHaveBeenCalledWith(testSequences[0].cues);
    expect(mockShowDirector.play).toHaveBeenCalled();
    expect(mockEventBus.emit).toHaveBeenCalledWith('sequence:started', expect.any(Object));
  });

  it('should support triggerNow() to immediately launch sequence', () => {
    scheduler.triggerNow();

    expect(scheduler.state).toBe(SCHEDULER_STATES.FIRING);
    expect(mockShowDirector.loadScript).toHaveBeenCalled();
    expect(mockShowDirector.play).toHaveBeenCalled();
  });

  it('should transition to COOLDOWN and restore ambient fireworks when sequence ends', () => {
    scheduler.startSequence();
    expect(scheduler.state).toBe(SCHEDULER_STATES.FIRING);

    // Update through firing duration
    scheduler.update(scheduler.firingDuration + 0.5);

    expect(scheduler.state).toBe(SCHEDULER_STATES.COOLDOWN);
    expect(mockAmbientManager.start).toHaveBeenCalled();
    expect(mockEventBus.emit).toHaveBeenCalledWith('sequence:ended', expect.any(Object));
  });

  it('should loop to next sequence after cooldown expires', () => {
    scheduler.startSequence();
    scheduler.update(scheduler.firingDuration + 0.5); // Moves to COOLDOWN
    expect(scheduler.state).toBe(SCHEDULER_STATES.COOLDOWN);

    scheduler.update(scheduler.cooldownDuration + 0.5); // Moves to COUNTDOWN with seq 2
    expect(scheduler.state).toBe(SCHEDULER_STATES.COUNTDOWN);
    expect(scheduler.currentIndex).toBe(1);

    const info = scheduler.getInfo();
    expect(info.sequenceName).toBe('Grand Test 2');
  });

  it('should allow pausing and resuming scheduler', () => {
    scheduler.pause();
    scheduler.update(10.0);
    expect(scheduler.countdownTimer).toBe(30.0);

    scheduler.resume();
    scheduler.update(5.0);
    expect(scheduler.countdownTimer).toBeCloseTo(25.0);
  });

  it('should auto-seek ShowDirector to active firework window when sequence has offset audio', () => {
    const sequenceWithAudio = {
      id: 'blood_tear',
      title: 'Blood Tear Climax',
      category: 'EDM',
      cues: [
        { time: 0, type: 'audio', name: 'blood_tear_full.mp3', url: 'blood_tear_full.mp3' },
        { time: 86.3, type: 'sequence', preset: 'crysanthemum' },
        { time: 88.0, type: 'sequence', preset: 'willow' }
      ]
    };

    const audioScheduler = new SequenceScheduler({
      showDirector: mockShowDirector,
      ambientFireworkManager: mockAmbientManager,
      sequences: [sequenceWithAudio],
      interval: 10.0
    });

    const info = audioScheduler.getInfo();
    expect(info.audioTrack).toBe('blood_tear_full.mp3');
    expect(info.cueCount).toBe(2);
    expect(info.activeStartTime).toBeCloseTo(85.7, 1);

    audioScheduler.triggerNow();

    expect(mockShowDirector.loadScript).toHaveBeenCalledWith(sequenceWithAudio.cues);
    expect(mockShowDirector.seek).toHaveBeenCalledWith(expect.closeTo(85.7, 1));
    expect(mockShowDirector.play).toHaveBeenCalled();
  });

  it('should handle onGiftReceived by preloading sequence and setting 3s countdown', () => {
    scheduler.onGiftReceived({
      user: {
        name: 'thao_linh_vip',
        nickname: 'Thao Linh'
      },
      data: {
        giftName: 'Universe',
        diamondCount: 500
      }
    });

    expect(scheduler.state).toBe(SCHEDULER_STATES.COUNTDOWN);
    expect(scheduler.countdownTimer).toBe(3.0);
    expect(mockEventBus.emit).toHaveBeenCalledWith('sequence:gift_scheduled', expect.any(Object));

    const info = scheduler.getInfo();
    expect(info.giftTriggerInfo).toBeDefined();
    expect(info.giftTriggerInfo.userName).toBe('Thao Linh');
    expect(info.giftTriggerInfo.giftName).toBe('Universe');
    expect(info.giftTriggerInfo.diamonds).toBe(500);
  });

  it('should queue gift when received during FIRING and trigger after sequence ends', () => {
    scheduler.startSequence();
    expect(scheduler.state).toBe(SCHEDULER_STATES.FIRING);

    // Gift arrives while show is live
    scheduler.onGiftReceived({
      user: { name: 'viewer123', nickname: 'Top Fan' },
      data: { giftName: 'Dragon', diamondCount: 1000 }
    });

    // Should not interrupt live firing
    expect(scheduler.state).toBe(SCHEDULER_STATES.FIRING);
    expect(scheduler.queuedGift).toBeDefined();

    // Finish current sequence
    scheduler.endSequence();

    // Now queued gift should activate with 3s countdown
    expect(scheduler.state).toBe(SCHEDULER_STATES.COUNTDOWN);
    expect(scheduler.countdownTimer).toBe(3.0);
    expect(scheduler.getInfo().giftTriggerInfo.giftName).toBe('Dragon');
    expect(scheduler.queuedGift).toBeNull();
  });

  it('should ignore gifts under 5 coins from triggering a grand sequence', () => {
    const res1 = scheduler.onGiftReceived({
      user: { id: 'viewer_1', name: 'Viewer' },
      data: { giftName: 'Rose', diamondCount: 1 }
    });
    expect(res1.action).toBe('below_threshold');

    const res4 = scheduler.onGiftReceived({
      user: { id: 'viewer_4', name: 'Viewer 4' },
      data: { giftName: 'Heart', diamondCount: 4 }
    });
    expect(res4.action).toBe('below_threshold');
    expect(scheduler.giftTriggerInfo).toBeNull();
  });

  it('should trigger random sequence for 5 to 9 coins', () => {
    const res5 = scheduler.onGiftReceived({
      user: { id: 'viewer_5', name: 'Viewer 5' },
      data: { giftName: 'Panda', diamondCount: 5 }
    });
    expect(res5.action).toBe('started');
    expect(scheduler.giftTriggerInfo).toBeDefined();
    expect(scheduler.giftTriggerInfo.diamonds).toBe(5);

    const s = new SequenceScheduler();
    const idx5 = s.getSequenceIndexForGift(5);
    expect(idx5).toBeGreaterThanOrEqual(0);
    expect(idx5).toBeLessThan(s.sequences.length);
  });

  it('should resolve sequence index based purely on coin amount (10 to 199+ coins)', () => {
    const s = new SequenceScheduler();

    const idx10 = s.getSequenceIndexForGift(10);
    expect(s.sequences[idx10].id).toBe('monody_v1');

    const idx20 = s.getSequenceIndexForGift(20);
    expect(s.sequences[idx20].id).toBe('your_name_v1');

    const idx30 = s.getSequenceIndexForGift(30);
    expect(s.sequences[idx30].id).toBe('hanabi_v1');

    const idx88 = s.getSequenceIndexForGift(88);
    expect(s.sequences[idx88].id).toBe('kiepsauvanlanguoivietnam_v1');

    const idx100 = s.getSequenceIndexForGift(100);
    expect(s.sequences[idx100].id).toBe('empress_v1');

    const idx149 = s.getSequenceIndexForGift(149);
    expect(s.sequences[idx149].id).toBe('blood_tear_v3');

    const idx199 = s.getSequenceIndexForGift(199);
    expect(s.sequences[idx199].id).toBe('blood_tear_v4');
  });

  it('should rotate sequence versions v1 -> v4 when gifts for the same series arrive consecutively', () => {
    const rotationScheduler = new SequenceScheduler();
    // Gift 1: 199 coins -> blood_tear_v4
    const idx1 = rotationScheduler.getSequenceIndexForGift(199);
    expect(rotationScheduler.sequences[idx1].id).toBe('blood_tear_v4');

    // Gift 2: consecutively arrives within timeout -> advances to blood_tear_v1
    const idx2 = rotationScheduler.getSequenceIndexForGift(199);
    expect(rotationScheduler.sequences[idx2].id).toBe('blood_tear_v1');

    // Gift 3: consecutively arrives -> advances to blood_tear_v2
    const idx3 = rotationScheduler.getSequenceIndexForGift(199);
    expect(rotationScheduler.sequences[idx3].id).toBe('blood_tear_v2');

    // Gift 4: consecutively arrives -> advances to blood_tear_v3
    const idx4 = rotationScheduler.getSequenceIndexForGift(199);
    expect(rotationScheduler.sequences[idx4].id).toBe('blood_tear_v3');

    // Gift 5: loops back to blood_tear_v4
    const idx5 = rotationScheduler.getSequenceIndexForGift(199);
    expect(rotationScheduler.sequences[idx5].id).toBe('blood_tear_v4');
  });

  it('should prioritize higher coin gifts ahead of lower coin gifts in priority queue', () => {
    scheduler.startSequence(); // State is FIRING

    // User A sends 10 coins
    scheduler.onGiftReceived({
      user: { id: 'user_a', name: 'User A' },
      data: { giftName: 'Gamepad', diamondCount: 10 }
    });

    // User B sends 50 coins
    scheduler.onGiftReceived({
      user: { id: 'user_b', name: 'User B' },
      data: { giftName: 'Butterfly', diamondCount: 50 }
    });

    // User C sends 20 coins
    scheduler.onGiftReceived({
      user: { id: 'user_c', name: 'User C' },
      data: { giftName: 'Perfume', diamondCount: 20 }
    });

    expect(scheduler.giftQueue.length).toBe(3);
    // Highest coins (User B = 50) must be first, then C (20), then A (10)
    expect(scheduler.giftQueue[0].userId).toBe('user_b');
    expect(scheduler.giftQueue[1].userId).toBe('user_c');
    expect(scheduler.giftQueue[2].userId).toBe('user_a');

    // End current sequence, User B should launch first
    scheduler.endSequence();
    expect(scheduler.state).toBe(SCHEDULER_STATES.COUNTDOWN);
    expect(scheduler.getInfo().giftTriggerInfo.userName).toBe('User B');
    expect(scheduler.getInfo().giftTriggerInfo.diamonds).toBe(50);
  });

  it('should allow enthusiastic supporters to queue multiple sequences without arbitrary cooldown restrictions', () => {
    scheduler.startSequence();

    // User A sends 10 coins
    scheduler.onGiftReceived({
      user: { id: 'supporter_1', name: 'VIP Supporter' },
      data: { giftName: 'Gamepad', diamondCount: 10 }
    });

    // User A sends another 20 coins immediately
    const res = scheduler.onGiftReceived({
      user: { id: 'supporter_1', name: 'VIP Supporter' },
      data: { giftName: 'Perfume', diamondCount: 20 }
    });

    expect(res.action).toBe('queued');
    // Both gifts are welcomed and queued in priority order!
    expect(scheduler.giftQueue.length).toBe(2);
    // 20 coins is prioritized before 10 coins
    expect(scheduler.giftQueue[0].diamonds).toBe(20);
    expect(scheduler.giftQueue[1].diamonds).toBe(10);
  });
});

describe('DirectorLaptop Component', () => {
  it('should instantiate 3D group and materials without crashing', () => {
    const laptop = new DirectorLaptop();
    expect(laptop.group).toBeDefined();
    expect(laptop.group.name).toBe('DirectorLaptopGroup');

    // Should have meshes attached
    expect(laptop.group.children.length).toBeGreaterThan(0);

    // Should update cleanly
    laptop.update(0.1);

    // Should dispose without error
    laptop.dispose();
    expect(laptop.disposables.length).toBe(0);
  });

  it('should render screen with scheduler information', () => {
    const scheduler = new SequenceScheduler();
    const laptop = new DirectorLaptop({ scheduler });

    laptop.renderScreen();
    expect(laptop.screenTexture).toBeDefined();

    laptop.dispose();
  });

  it('should render screen properly when gift sponsor alert is active', () => {
    const scheduler = new SequenceScheduler();
    scheduler.onGiftReceived({
      user: { name: 'Donor01', nickname: 'Alice' },
      data: { giftName: 'Super Star', diamondCount: 200 }
    });

    const laptop = new DirectorLaptop({ scheduler });
    laptop.renderScreen();
    expect(laptop.screenTexture).toBeDefined();

    laptop.dispose();
  });

  it('should render signature branding for ThaoLinn20 and (By FWA Community) on screen', () => {
    const laptop = new DirectorLaptop();
    if (laptop.ctx) {
      const fillTextSpy = vi.spyOn(laptop.ctx, 'fillText');
      laptop.renderScreen();

      const calls = fillTextSpy.mock.calls.map((c) => c[0]);
      expect(calls.some((str) => typeof str === 'string' && str.includes('ThaoLinn20'))).toBe(true);
      expect(calls.some((str) => typeof str === 'string' && str.includes('(By FWA Community)'))).toBe(true);
      expect(calls.some((str) => typeof str === 'string' && str.includes('FDShowStudio'))).toBe(true);
    }
    laptop.dispose();
  });
});

