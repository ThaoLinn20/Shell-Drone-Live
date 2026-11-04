import bloodTearV1 from '../../shell-scripts/sequences/blood-tear-v1.json';
import bloodTearV2 from '../../shell-scripts/sequences/blood-tear-v2.json';
import bloodTearV3 from '../../shell-scripts/sequences/blood-tear-v3.json';
import bloodTearV4 from '../../shell-scripts/sequences/blood-tear-v4.json';
import snowSequence from '../../shell-scripts/sequences/snow.json';

export const SCHEDULER_STATES = {
  IDLE: 'IDLE',
  COUNTDOWN: 'COUNTDOWN',
  FIRING: 'FIRING',
  COOLDOWN: 'COOLDOWN'
};

export const DEFAULT_SEQUENCES = [
  {
    id: 'blood_tear_v1',
    title: 'Blood Tear - Part 1: First Drop',
    category: 'Vocal EDM Hanabi Sequence',
    audioTrack: 'blood_tear_full.mp3',
    duration: 25.0,
    interval: 60.0,
    cues: bloodTearV1
  },
  {
    id: 'blood_tear_v2',
    title: 'Blood Tear - Part 2: Melodic Bridge',
    category: 'Vocal EDM Hanabi Sequence',
    audioTrack: 'blood_tear_full.mp3',
    duration: 45.0,
    interval: 60.0,
    cues: bloodTearV2
  },
  {
    id: 'blood_tear_v3',
    title: 'Blood Tear - Part 3: Build-up Surge',
    category: 'Vocal EDM Hanabi Sequence',
    audioTrack: 'blood_tear_full.mp3',
    duration: 25.0,
    interval: 60.0,
    cues: bloodTearV3
  },
  {
    id: 'blood_tear_v4',
    title: 'Blood Tear - Part 4: Grand Finale Drop',
    category: 'Vocal EDM Hanabi Sequence',
    audioTrack: 'blood_tear_full.mp3',
    duration: 45.0,
    interval: 60.0,
    cues: bloodTearV4
  },
  {
    id: 'snow',
    title: 'Snow Storm Spectacular',
    category: 'Winter Hanabi Sequence',
    audioTrack: null,
    duration: 12.0,
    interval: 60.0,
    cues: snowSequence
  }
];

export const GIFT_TIER_MAPPING = [
  { minCoins: 100, sequenceId: 'blood_tear_v4', title: 'Grand Finale Drop' },
  { minCoins: 50, sequenceId: 'blood_tear_v3', title: 'Build-up Surge' },
  { minCoins: 20, sequenceId: 'blood_tear_v2', title: 'Melodic Bridge' },
  { minCoins: 10, sequenceId: 'blood_tear_v1', title: 'First Drop' },
  { minCoins: 5, mode: 'random', title: 'Random Sequence' }
];

export class SequenceScheduler {
  constructor(options = {}) {
    this.showDirector = options.showDirector || null;
    this.ambientFireworkManager = options.ambientFireworkManager || null;
    this.eventBus = options.eventBus || null;

    this.sequences = options.sequences && options.sequences.length > 0
      ? [...options.sequences]
      : [...DEFAULT_SEQUENCES];

    this.currentIndex = 0;
    this.defaultInterval = options.interval !== undefined ? options.interval : 60.0;
    this.cooldownDuration = options.cooldownDuration !== undefined ? options.cooldownDuration : 8.0;

    this.state = SCHEDULER_STATES.COUNTDOWN;
    this.countdownTimer = this.defaultInterval;
    this.firingTimer = 0;
    this.firingDuration = 15.0;
    this.activeStartTime = 0;
    this.cooldownTimer = 0;
    this.isPaused = false;
    this.ambientWasEnabled = false;

    // Gift Priority Queue (unlimited dedication, no per-user cooldown)
    this.giftTriggerInfo = null;
    this.giftQueue = [];
    this.maxQueueSize = 15;
    this.giftCountdownInterval = 3.0;

    // Consecutive series version rotation (e.g. blood_tear v1 -> v4)
    this.lastSeriesVersion = new Map();
    this.seriesRotationTimeout = 90000; // 90 seconds consecutive window

    // Listeners for UI / laptop screen
    this.listeners = [];

    // Preload current sequence info
    this._prepareCurrentSequence();
  }

  _prepareCurrentSequence() {
    const seq = this.getCurrentSequence();
    this.activeStartTime = 0;
    this.firingDuration = 15.0;

    if (seq && seq.cues && Array.isArray(seq.cues) && seq.cues.length > 0) {
      const fireworkCues = seq.cues.filter(c => c.type !== 'audio');

      if (fireworkCues.length > 0) {
        const firstTime = Math.min(...fireworkCues.map(c => Number(c.time) || 0));
        const lastTime = Math.max(...fireworkCues.map(c => Number(c.time) || 0));

        // Smart Active Window: if fireworks start at an offset (e.g. drop at 86.3s, 109.7s, 169.7s, 192.2s),
        // seek audio directly to 0.6s before the drop for immediate high-impact delivery!
        if (firstTime > 5.0) {
          this.activeStartTime = Math.max(0, firstTime - 0.6);
          this.firingDuration = (lastTime - this.activeStartTime) + 4.5;
        } else {
          this.activeStartTime = 0;
          this.firingDuration = Math.max(seq.duration || 0, lastTime + 3.0);
        }
      } else {
        this.firingDuration = seq.duration || 15.0;
      }
    }
  }

  getCurrentSequence() {
    if (this.sequences.length === 0) return null;
    return this.sequences[this.currentIndex % this.sequences.length];
  }

  getNextSequence() {
    if (this.sequences.length === 0) return null;
    return this.sequences[(this.currentIndex + 1) % this.sequences.length];
  }

  addSequence(seqConfig) {
    if (!seqConfig) return;
    this.sequences.push(seqConfig);
    this._notifyListeners();
  }

  selectSequence(indexOrId) {
    if (typeof indexOrId === 'number') {
      this.currentIndex = Math.max(0, Math.min(indexOrId, this.sequences.length - 1));
    } else if (typeof indexOrId === 'string') {
      const idx = this.sequences.findIndex(s => s.id === indexOrId);
      if (idx !== -1) {
        this.currentIndex = idx;
      }
    }
    this._prepareCurrentSequence();
    const seq = this.getCurrentSequence();
    this.countdownTimer = seq && seq.interval ? seq.interval : this.defaultInterval;
    this.state = SCHEDULER_STATES.COUNTDOWN;
    this._notifyListeners();
  }

  nextSequence() {
    this.startNextCountdown();
  }

  get queuedGift() {
    return this.giftQueue.length > 0 ? this.giftQueue[0].giftEvent : null;
  }

  set queuedGift(val) {
    if (val) {
      this._enqueueGift(val);
    } else {
      this.giftQueue = [];
    }
  }

  /**
   * Parse series name and version number from a sequence ID
   * e.g. "blood_tear_v1" -> { series: "blood_tear", version: 1 }
   * e.g. "snow" -> { series: "snow", version: 1 }
   */
  parseSeriesInfo(seqId = '') {
    const match = String(seqId).match(/^(.*)_v(\d+)$/i);
    if (match) {
      return {
        series: match[1].toLowerCase(),
        version: parseInt(match[2], 10)
      };
    }
    return {
      series: String(seqId).toLowerCase(),
      version: 1
    };
  }

  /**
   * Find all sequences belonging to the same series, sorted by version number ascending
   */
  getSeriesSequences(seriesName) {
    if (!seriesName) return [];
    const cleanSeries = seriesName.toLowerCase();
    return this.sequences
      .map((seq, idx) => ({ seq, idx, info: this.parseSeriesInfo(seq.id) }))
      .filter(item => item.info.series === cleanSeries)
      .sort((a, b) => a.info.version - b.info.version);
  }

  /**
   * Resolve sequence index based on coin tier and consecutive series rotation:
   * 5 - 9 coins: random sequence
   * 10 coins: blood_tear_v1 (First Drop)
   * 20 coins: blood_tear_v2 (Melodic Bridge)
   * 50 coins: blood_tear_v3 (Build-up Surge)
   * 100+ coins: blood_tear_v4 (Grand Finale Drop)
   *
   * If gifts for the same series arrive consecutively within 90s,
   * automatically rotates version: v1 -> v2 -> v3 -> v4 -> v1...
   */
  getSequenceIndexForGift(coins = 5) {
    if (this.sequences.length === 0) return 0;
    const numCoins = Number(coins) || 5;

    let baseTargetSeqId = null;

    // 5 to 9 Coins: Pick a random sequence
    if (numCoins < 10) {
      let randomIndex = Math.floor(Math.random() * this.sequences.length);
      if (this.sequences.length > 1 && randomIndex === this.currentIndex) {
        randomIndex = (randomIndex + 1) % this.sequences.length;
      }
      baseTargetSeqId = this.sequences[randomIndex]?.id;
    } else {
      // 10 Coins or more: select fixed sequence based on tier mapping
      const matchedTier = GIFT_TIER_MAPPING.find(
        tier => tier.sequenceId && numCoins >= tier.minCoins
      );
      baseTargetSeqId = matchedTier ? matchedTier.sequenceId : this.sequences[0]?.id;
    }

    if (!baseTargetSeqId) {
      return 0;
    }

    // Check consecutive series rotation (e.g. blood_tear v1 -> v2 -> v3 -> v4)
    const { series } = this.parseSeriesInfo(baseTargetSeqId);
    const seriesList = this.getSeriesSequences(series);

    // If this series only has 1 sequence (like snow), return directly
    if (seriesList.length <= 1) {
      const foundIdx = this.sequences.findIndex(s => s.id === baseTargetSeqId);
      return foundIdx !== -1 ? foundIdx : 0;
    }

    // Check if this is a consecutive gift for this series within rotation timeout
    const now = Date.now();
    const lastState = this.lastSeriesVersion.get(series);

    let targetSeqItem = null;
    if (lastState && (now - lastState.timestamp) < this.seriesRotationTimeout) {
      // Consecutively sent: advance to next version!
      const nextVersionIndex = (lastState.versionIndex + 1) % seriesList.length;
      targetSeqItem = seriesList[nextVersionIndex];
      this.lastSeriesVersion.set(series, {
        versionIndex: nextVersionIndex,
        version: targetSeqItem.info.version,
        timestamp: now
      });
    } else {
      // Fresh series start: start with the base tier's sequence or v1
      const baseIdx = seriesList.findIndex(item => item.seq.id === baseTargetSeqId);
      const startVersionIndex = baseIdx !== -1 ? baseIdx : 0;
      targetSeqItem = seriesList[startVersionIndex];
      this.lastSeriesVersion.set(series, {
        versionIndex: startVersionIndex,
        version: targetSeqItem.info.version,
        timestamp: now
      });
    }

    return targetSeqItem ? targetSeqItem.idx : 0;
  }

  /**
   * Handle TikTok Gift Event with Priority Queue & Per-User Rate Limiting:
   * Only gifts with 5+ coins trigger/queue grand sequences (1 coin only holds camera).
   */
  onGiftReceived(giftEvent = {}) {
    const user = giftEvent.user || {};
    const data = giftEvent.data || {};
    const userId = String(user.id || user.name || 'viewer').toLowerCase().trim();
    const userName = user.nickname || user.name || 'VIP Supporter';
    const giftName = data.giftName || 'Special Gift';
    const diamonds = Number(data.diamondCount || data.diamonds || 1);

    // Only 5 coins or higher trigger a grand sequence
    if (diamonds < 5) {
      return { success: false, action: 'below_threshold', diamonds };
    }

    // If currently firing, queue the gift for when the current sequence ends
    if (this.state === SCHEDULER_STATES.FIRING) {
      return this._enqueueGift(giftEvent, userId, userName, giftName, diamonds);
    }

    // If another gift is already in COUNTDOWN, queue this new gift
    if (this.state === SCHEDULER_STATES.COUNTDOWN && this.giftTriggerInfo) {
      return this._enqueueGift(giftEvent, userId, userName, giftName, diamonds);
    }

    // Trigger immediately
    this._activateGiftSequence(giftEvent, userId, userName, giftName, diamonds);
    return { success: true, action: 'started' };
  }

  _enqueueGift(giftEvent, userId, userName, giftName, diamonds) {
    if (!userId) {
      const user = giftEvent.user || {};
      const data = giftEvent.data || {};
      userId = String(user.id || user.name || 'viewer').toLowerCase().trim();
      userName = user.nickname || user.name || 'VIP Supporter';
      giftName = data.giftName || 'Special Gift';
      diamonds = Number(data.diamondCount || data.diamonds || 1);
    }

    // Resolve target sequence index at enqueue time to lock in consecutive series rotation
    const targetSequenceIndex = this.getSequenceIndexForGift(diamonds);

    const newItem = {
      giftEvent,
      userId,
      userName,
      giftName,
      diamonds,
      targetSequenceIndex,
      enqueuedAt: Date.now()
    };

    if (this.giftQueue.length >= this.maxQueueSize) {
      this._sortGiftQueue();
      const lowestItem = this.giftQueue[this.giftQueue.length - 1];
      if (diamonds > lowestItem.diamonds) {
        // Drop lowest value item to make room for higher tier gift
        this.giftQueue.pop();
        this.giftQueue.push(newItem);
        this._sortGiftQueue();
      } else {
        return { success: false, action: 'queue_full' };
      }
    } else {
      this.giftQueue.push(newItem);
      this._sortGiftQueue();
    }

    this._notifyListeners();
    return {
      success: true,
      action: 'queued',
      position: this.giftQueue.indexOf(newItem) + 1
    };
  }

  _sortGiftQueue() {
    this.giftQueue.sort((a, b) => {
      // 1. Diamonds descending (higher value first)
      if (b.diamonds !== a.diamonds) {
        return b.diamonds - a.diamonds;
      }
      // 2. FIFO if diamond values are equal
      return a.enqueuedAt - b.enqueuedAt;
    });
  }

  _activateGiftSequence(giftEvent, userId, userName, giftName, diamonds, targetSequenceIndex = null) {
    const targetIndex = targetSequenceIndex !== null
      ? targetSequenceIndex
      : this.getSequenceIndexForGift(diamonds);
    this.currentIndex = targetIndex;
    this._prepareCurrentSequence();

    this.countdownTimer = this.giftCountdownInterval;
    this.state = SCHEDULER_STATES.COUNTDOWN;
    this.isPaused = false;

    this.giftTriggerInfo = {
      userId,
      userName,
      giftName,
      diamonds,
      countdownTotal: this.giftCountdownInterval
    };

    if (this.eventBus && typeof this.eventBus.emit === 'function') {
      this.eventBus.emit('sequence:gift_scheduled', {
        sequence: this.getCurrentSequence(),
        giftInfo: this.giftTriggerInfo,
        countdown: this.giftCountdownInterval
      });
    }

    this._notifyListeners();
  }

  addListener(callback) {
    if (typeof callback === 'function') {
      this.listeners.push(callback);
    }
  }

  removeListener(callback) {
    this.listeners = this.listeners.filter(cb => cb !== callback);
  }

  _notifyListeners() {
    const info = this.getInfo();
    for (const listener of this.listeners) {
      try {
        listener(info);
      } catch (err) {
        console.warn('SequenceScheduler listener error:', err);
      }
    }
  }

  update(deltaTime) {
    if (this.isPaused) return;

    if (this.state === SCHEDULER_STATES.COUNTDOWN) {
      this.countdownTimer -= deltaTime;
      if (this.countdownTimer <= 0) {
        this.startSequence();
      }
    } else if (this.state === SCHEDULER_STATES.FIRING) {
      this.firingTimer += deltaTime;

      // Check if sequence is complete
      const isDirectorFinished = this.showDirector && !this.showDirector.isPlaying && this.firingTimer > 2.0;
      const isTimeFinished = this.firingTimer >= this.firingDuration;

      if (isDirectorFinished || isTimeFinished) {
        this.endSequence();
      }
    } else if (this.state === SCHEDULER_STATES.COOLDOWN) {
      this.cooldownTimer -= deltaTime;
      if (this.cooldownTimer <= 0) {
        this.startNextCountdown();
      }
    }

    this._notifyListeners();
  }

  startSequence() {
    const seq = this.getCurrentSequence();
    if (!seq || !seq.cues) {
      this.startNextCountdown();
      return;
    }

    this.state = SCHEDULER_STATES.FIRING;
    this.firingTimer = 0;
    this._prepareCurrentSequence();

    // Quiet ambient fireworks during the grand sequence
    if (this.ambientFireworkManager) {
      this.ambientWasEnabled = Boolean(this.ambientFireworkManager.enabled);
      this.ambientFireworkManager.stop();
    }

    // Load and fire through ShowDirector with Smart Active Window Seeking
    if (this.showDirector) {
      try {
        this.showDirector.loadScript(seq.cues);
        if (this.activeStartTime > 0) {
          this.showDirector.seek(this.activeStartTime);
        }
        this.showDirector.play();
      } catch (err) {
        console.error('Failed to play scheduled sequence:', err);
      }
    }

    if (this.eventBus && typeof this.eventBus.emit === 'function') {
      this.eventBus.emit('sequence:started', {
        sequence: seq,
        index: this.currentIndex,
        startTime: this.activeStartTime,
        giftInfo: this.giftTriggerInfo
      });
    }

    this._notifyListeners();
  }

  endSequence() {
    const seq = this.getCurrentSequence();
    this.state = SCHEDULER_STATES.COOLDOWN;
    this.cooldownTimer = this.cooldownDuration;

    // Cleanly stop ShowDirector and audio
    if (this.showDirector) {
      this.showDirector.pause();
    }

    // Restore ambient fireworks if previously enabled
    if (this.ambientFireworkManager && this.ambientWasEnabled) {
      this.ambientFireworkManager.start();
    }

    if (this.eventBus && typeof this.eventBus.emit === 'function') {
      this.eventBus.emit('sequence:ended', {
        sequence: seq,
        index: this.currentIndex
      });
    }

    // If another gift is waiting in priority queue, launch the highest priority one next!
    if (this.giftQueue.length > 0) {
      this._sortGiftQueue();
      const nextItem = this.giftQueue.shift();
      this.giftTriggerInfo = null;
      this._activateGiftSequence(
        nextItem.giftEvent,
        nextItem.userId,
        nextItem.userName,
        nextItem.giftName,
        nextItem.diamonds,
        nextItem.targetSequenceIndex
      );
      return;
    } else {
      this.giftTriggerInfo = null;
    }

    this._notifyListeners();
  }

  startNextCountdown() {
    this.currentIndex = (this.currentIndex + 1) % this.sequences.length;
    this.giftTriggerInfo = null;
    this._prepareCurrentSequence();
    const seq = this.getCurrentSequence();
    this.countdownTimer = seq && seq.interval ? seq.interval : this.defaultInterval;
    this.state = SCHEDULER_STATES.COUNTDOWN;
    this._notifyListeners();
  }

  triggerNow() {
    if (this.state === SCHEDULER_STATES.FIRING) return;
    this.countdownTimer = 0;
    this.startSequence();
  }

  pause() {
    this.isPaused = true;
  }

  resume() {
    this.isPaused = false;
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    return this.isPaused;
  }

  getInfo() {
    const seq = this.getCurrentSequence();
    let timeFormatted = '00:00.0';
    let progress = 0;

    if (this.state === SCHEDULER_STATES.COUNTDOWN) {
      const clamped = Math.max(0, this.countdownTimer);
      const minutes = Math.floor(clamped / 60);
      const seconds = Math.floor(clamped % 60);
      const deciseconds = Math.floor((clamped % 1) * 10);
      timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${deciseconds}`;

      const totalInterval = this.giftTriggerInfo
        ? this.giftTriggerInfo.countdownTotal
        : (seq && seq.interval ? seq.interval : this.defaultInterval);
      progress = Math.min(1.0, Math.max(0.0, 1.0 - clamped / Math.max(0.1, totalInterval)));
    } else if (this.state === SCHEDULER_STATES.FIRING) {
      const elapsed = Math.min(this.firingTimer, this.firingDuration);
      const minutes = Math.floor(elapsed / 60);
      const seconds = Math.floor(elapsed % 60);
      const deciseconds = Math.floor((elapsed % 1) * 10);
      timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${deciseconds}`;

      progress = Math.min(1.0, Math.max(0.0, elapsed / Math.max(0.1, this.firingDuration)));
    } else if (this.state === SCHEDULER_STATES.COOLDOWN) {
      const rem = Math.max(0, this.cooldownTimer);
      timeFormatted = `00:${String(Math.ceil(rem)).padStart(2, '0')}.0`;
      progress = 1.0 - (rem / Math.max(0.1, this.cooldownDuration));
    }

    const audioCue = seq && seq.cues ? seq.cues.find(c => c.type === 'audio') : null;
    const audioTrackName = seq ? (seq.audioTrack || (audioCue ? audioCue.name : null)) : null;
    const fireworkCuesCount = seq && seq.cues ? seq.cues.filter(c => c.type !== 'audio').length : 0;

    return {
      state: this.state,
      isPaused: this.isPaused,
      sequenceName: seq ? seq.title : 'Sequence',
      category: seq ? seq.category : 'Grand Finale',
      cueCount: fireworkCuesCount,
      audioTrack: audioTrackName,
      activeStartTime: this.activeStartTime,
      countdownTimer: this.countdownTimer,
      timeFormatted: timeFormatted,
      firingTimer: this.firingTimer,
      firingDuration: this.firingDuration,
      progress: progress,
      giftTriggerInfo: this.giftTriggerInfo,
      queueLength: this.giftQueue.length,
      currentIndex: this.currentIndex,
      totalSequences: this.sequences.length
    };
  }
}
