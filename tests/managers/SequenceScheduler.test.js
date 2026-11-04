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
    const res = scheduler.onGiftReceived({
      user: { id: 'viewer_1', name: 'Viewer' },
      data: { giftName: 'Rose', diamondCount: 1 }
    });

    expect(res.action).toBe('below_threshold');
    expect(scheduler.giftTriggerInfo).toBeNull();
  });

  it('should resolve sequence index based on coin tiers: 5 coins random, 10, 20, 50, 100 coins fixed', () => {
    // 5 coins -> random valid index
    const s5 = new SequenceScheduler();
    const idx5 = s5.getSequenceIndexForGift(5);
    expect(idx5).toBeGreaterThanOrEqual(0);
    expect(idx5).toBeLessThan(s5.sequences.length);

    // 10 coins -> blood_tear_v1
    const s10 = new SequenceScheduler();
    const idx10 = s10.getSequenceIndexForGift(10);
    expect(s10.sequences[idx10].id).toBe('blood_tear_v1');

    // 20 coins -> blood_tear_v2
    const s20 = new SequenceScheduler();
    const idx20 = s20.getSequenceIndexForGift(20);
    expect(s20.sequences[idx20].id).toBe('blood_tear_v2');

    // 50 coins -> blood_tear_v3
    const s50 = new SequenceScheduler();
    const idx50 = s50.getSequenceIndexForGift(50);
    expect(s50.sequences[idx50].id).toBe('blood_tear_v3');

    // 100 coins -> blood_tear_v4
    const s100 = new SequenceScheduler();
    const idx100 = s100.getSequenceIndexForGift(100);
    expect(s100.sequences[idx100].id).toBe('blood_tear_v4');
  });

  it('should rotate sequence versions v1 -> v4 when gifts for the same series arrive consecutively', () => {
    const rotationScheduler = new SequenceScheduler();
    // Gift 1: 10 coins -> blood_tear_v1
    const idx1 = rotationScheduler.getSequenceIndexForGift(10);
    expect(rotationScheduler.sequences[idx1].id).toBe('blood_tear_v1');

    // Gift 2: 10 coins consecutively -> blood_tear_v2
    const idx2 = rotationScheduler.getSequenceIndexForGift(10);
    expect(rotationScheduler.sequences[idx2].id).toBe('blood_tear_v2');

    // Gift 3: 10 coins consecutively -> blood_tear_v3
    const idx3 = rotationScheduler.getSequenceIndexForGift(10);
    expect(rotationScheduler.sequences[idx3].id).toBe('blood_tear_v3');

    // Gift 4: 10 coins consecutively -> blood_tear_v4
    const idx4 = rotationScheduler.getSequenceIndexForGift(10);
    expect(rotationScheduler.sequences[idx4].id).toBe('blood_tear_v4');

    // Gift 5: loops back to blood_tear_v1
    const idx5 = rotationScheduler.getSequenceIndexForGift(10);
    expect(rotationScheduler.sequences[idx5].id).toBe('blood_tear_v1');
  });

  it('should prioritize higher coin gifts ahead of lower coin gifts in priority queue', () => {
    scheduler.startSequence(); // State is FIRING

    // User A sends 5 coins
    scheduler.onGiftReceived({
      user: { id: 'user_a', name: 'User A' },
      data: { giftName: 'Rose', diamondCount: 5 }
    });

    // User B sends 50 coins
    scheduler.onGiftReceived({
      user: { id: 'user_b', name: 'User B' },
      data: { giftName: 'Fireworks', diamondCount: 50 }
    });

    // User C sends 10 coins
    scheduler.onGiftReceived({
      user: { id: 'user_c', name: 'User C' },
      data: { giftName: 'Confetti', diamondCount: 10 }
    });

    expect(scheduler.giftQueue.length).toBe(3);
    // Highest coins (User B = 50) must be first, then C (10), then A (5)
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

    // User A sends 5 coins
    scheduler.onGiftReceived({
      user: { id: 'supporter_1', name: 'VIP Supporter' },
      data: { giftName: 'Rose', diamondCount: 5 }
    });

    // User A sends another 10 coins immediately
    const res = scheduler.onGiftReceived({
      user: { id: 'supporter_1', name: 'VIP Supporter' },
      data: { giftName: 'Confetti', diamondCount: 10 }
    });

    expect(res.action).toBe('queued');
    // Both gifts are welcomed and queued in priority order!
    expect(scheduler.giftQueue.length).toBe(2);
    // 10 coins is prioritized before 5 coins
    expect(scheduler.giftQueue[0].diamonds).toBe(10);
    expect(scheduler.giftQueue[1].diamonds).toBe(5);
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
});

