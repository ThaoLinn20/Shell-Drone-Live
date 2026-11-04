// Interaction Manager
// Handles WebSocket connection with TikTok Bridge, rule evaluation, and event queuing

import defaultRules from '../config/interaction_rules.json';
import { proceduralShellGenerator } from '../factories/ProceduralShellGenerator.js';

export class InteractionManager {
  constructor(options = {}) {
    this.wsUrl = options.wsUrl || 'ws://127.0.0.1:21213';
    this.rules = options.rules || defaultRules.rules || [];
    this.settings = options.settings || defaultRules.settings || {
      queueIntervalMs: 250,
      maxConcurrentShells: 6
    };

    this.fireworkSystem = options.fireworkSystem || null;
    this.cometSystem = options.cometSystem || null;
    this.sceneManager = options.sceneManager || null;
    this.cameraManager = options.cameraManager || options.sceneManager?.cameraManager || null;
    this.hud = options.hud || null;
    this.scriptVariationEngine = options.scriptVariationEngine || null;
    this.useScriptVariation = options.useScriptVariation !== undefined ? options.useScriptVariation : true;

    this.socket = null;
    this.status = 'disconnected'; // 'disconnected' | 'connecting' | 'connected'
    this.queue = [];
    this.listeners = new Map();
    this.reconnectTimer = null;
    this.queueProcessorTimer = null;
    this.lastTriggerTime = new Map();

    // Honorary Leaderboard tracking (Top Gifter, Top Liker, Top Commenter)
    this.userStats = new Map();
    this.leaderboard = {
      gifter: { name: 'Anh Tuan VIP', score: 1000, user: null },
      liker: { name: 'Linh Dan Top', score: 350, user: null },
      commenter: { name: 'Quoc Huy Chat', score: 45, user: null }
    };

    // Start queue processor immediately so actions execute even in offline/test/mock mode
    this.startQueueProcessor();
  }

  // Subscribe to internal interaction events (status, gift, chat)
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (!this.listeners.has(event)) return;
    this.listeners.set(
      event,
      this.listeners.get(event).filter((cb) => cb !== callback)
    );
  }

  emit(event, data) {
    const handlers = this.listeners.get(event);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(data);
        } catch (err) {
          console.error('[InteractionManager] Handler error for ' + event + ':', err);
        }
      }
    }
  }

  connect() {
    if (this.socket && (this.socket.readyState === 0 || this.socket.readyState === 1)) {
      return;
    }

    this.status = 'connecting';
    this.emit('status', this.status);

    try {
      this.socket = new WebSocket(this.wsUrl);

      this.socket.onopen = () => {
        this.status = 'connected';
        this.emit('status', this.status);
        console.log('[InteractionManager] Connected to TikTok Bridge at ' + this.wsUrl);
        this.startQueueProcessor();
      };

      this.socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          this.handleIncomingEvent(payload);
        } catch (err) {
          console.warn('[InteractionManager] Failed to parse message:', err);
        }
      };

      this.socket.onclose = () => {
        this.status = 'disconnected';
        this.emit('status', this.status);
        this.scheduleReconnect();
      };

      this.socket.onerror = () => {
        if (this.socket) {
          this.socket.close();
        }
      };
    } catch (err) {
      console.warn('[InteractionManager] Connection error:', err.message);
      this.status = 'disconnected';
      this.emit('status', this.status);
      this.scheduleReconnect();
    }
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.queueProcessorTimer) {
      clearInterval(this.queueProcessorTimer);
      this.queueProcessorTimer = null;
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.status = 'disconnected';
    this.emit('status', this.status);
  }

  scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 4000);
  }

  // Request bridge to connect to a specific TikTok Live username
  setTargetUsername(username) {
    if (!username) return;
    const cleanUser = username.replace(/^@/, '').trim();
    if (this.socket && this.socket.readyState === 1) {
      this.socket.send(JSON.stringify({
        action: 'connect',
        username: cleanUser
      }));
    }
  }

  // Handle incoming normalized events from Bridge, TikFinity, or Mock injector
  handleIncomingEvent(rawEvent) {
    if (!rawEvent) return;

    const eventType = (rawEvent.type || rawEvent.event || '').toLowerCase();
    if (!eventType) return;

    // Handle room connection state events
    if (eventType === 'tiktok_room_status') {
      this.emit('tiktok_room_status', rawEvent);
      if (this.hud && typeof this.hud.updateRoomStatus === 'function') {
        this.hud.updateRoomStatus(rawEvent);
      }
      return;
    }

    if (eventType === 'system') {
      this.emit('system', rawEvent);
      if (rawEvent.roomState && this.hud && typeof this.hud.updateRoomStatus === 'function') {
        this.hud.updateRoomStatus(rawEvent.roomState);
      }
      return;
    }

    const event = rawEvent;
    if (!event.type) {
      event.type = eventType;
    }

    // Normalize user object if missing
    if (!event.user) {
      const rawData = event.data || {};
      event.user = {
        id: rawData.userId || rawData.uniqueId || 'viewer',
        name: rawData.uniqueId || rawData.name || 'viewer',
        nickname: rawData.nickname || rawData.displayName || rawData.name || 'Viewer',
        avatar: rawData.profilePictureUrl || rawData.avatar || ''
      };
    }

    // Normalize TikFinity gift / chat data properties
    if (event.data) {
      if (event.data.diamondCount === undefined && event.data.diamonds !== undefined) {
        event.data.diamondCount = event.data.diamonds;
      }
      if (event.data.comment === undefined && event.data.message !== undefined) {
        event.data.comment = event.data.message;
      }
    }

    const isGift = eventType === 'gift' || Boolean(event.data?.giftName || event.data?.giftId);
    const isChat = eventType === 'chat' || Boolean(event.data?.comment || event.data?.message);
    const isLike = eventType === 'like'
      || eventType === 'likes'
      || eventType === 'heart'
      || Boolean(
        event.data?.likeCount !== undefined ||
        event.data?.totalLikes !== undefined ||
        event.data?.totalLikeCount !== undefined
      );

    if (isGift) {
      event.type = 'gift';
      this.emit('gift', event);
      if (this.hud && typeof this.hud.notifyGift === 'function') {
        this.hud.notifyGift(event);
      }
      if (this.sceneManager && this.sceneManager.spectatorCrowd) {
        const char = this.sceneManager.spectatorCrowd.onViewerAction(event.user, event.data);
        if (
          char &&
          this.cameraManager &&
          typeof this.cameraManager.focusThirdPersonOnCharacter === 'function'
        ) {
          this.cameraManager.focusThirdPersonOnCharacter(char, 6.5);
        }
      }

      // Track Gifter diamond score for Honorary Leaderboard
      const diamonds = Number(event.data?.diamondCount || event.data?.diamonds || 0) * (event.data?.repeatCount || 1);
      const stats = this.getUserStats(event.user);
      stats.diamonds += diamonds;
      if (stats.diamonds > this.leaderboard.gifter.score) {
        this.leaderboard.gifter = {
          name: event.user.nickname || event.user.name,
          score: stats.diamonds,
          user: event.user
        };
        if (this.sceneManager?.spectatorCrowd) {
          this.sceneManager.spectatorCrowd.updateHonoraryLeader(
            'gifter',
            event.user,
            stats.diamonds
          );
        }
      }

      this.evaluateGiftRules(event);
    } else if (isChat) {
      event.type = 'chat';
      this.emit('chat', event);
      if (this.hud && typeof this.hud.notifyChat === 'function') {
        this.hud.notifyChat(event);
      }
      if (this.sceneManager && this.sceneManager.spectatorCrowd) {
        this.sceneManager.spectatorCrowd.onViewerAction(event.user, event.data);
      }

      // Track Comment count for Honorary Leaderboard
      const stats = this.getUserStats(event.user);
      stats.comments += 1;
      if (stats.comments > this.leaderboard.commenter.score) {
        this.leaderboard.commenter = {
          name: event.user.nickname || event.user.name,
          score: stats.comments,
          user: event.user
        };
        if (this.sceneManager?.spectatorCrowd) {
          this.sceneManager.spectatorCrowd.updateHonoraryLeader(
            'commenter',
            event.user,
            stats.comments
          );
        }
      }

      this.evaluateChatRules(event);
    } else if (isLike) {
      event.type = 'like';
      this.emit('like', event);
      if (this.hud && typeof this.hud.notifyLike === 'function') {
        this.hud.notifyLike(event);
      }
      if (this.sceneManager && this.sceneManager.spectatorCrowd) {
        this.sceneManager.spectatorCrowd.onViewerAction(event.user, event.data);
      }

      // Track Likes count for Honorary Leaderboard
      const likeDelta = Number(event.data?.likeCount || 1);
      const stats = this.getUserStats(event.user);
      stats.likes += likeDelta;
      if (stats.likes > this.leaderboard.liker.score) {
        this.leaderboard.liker = {
          name: event.user.nickname || event.user.name,
          score: stats.likes,
          user: event.user
        };
        if (this.sceneManager?.spectatorCrowd) {
          this.sceneManager.spectatorCrowd.updateHonoraryLeader(
            'liker',
            event.user,
            stats.likes
          );
        }
      }

      this.evaluateLikeRules(event);
    }
  }

  getUserStats(user) {
    const rawKey = user?.id || user?.uniqueId || user?.name || 'viewer';
    const key = String(rawKey).toLowerCase();
    if (!this.userStats.has(key)) {
      this.userStats.set(key, {
        diamonds: 0,
        likes: 0,
        comments: 0,
        user
      });
    }
    const stats = this.userStats.get(key);
    stats.user = user;
    return stats;
  }

  evaluateLikeRules(event) {
    let matchedRule = null;
    for (const rule of this.rules) {
      if (rule.condition.type === 'like') {
        matchedRule = rule;
        break;
      }
    }

    if (!matchedRule) {
      matchedRule = {
        id: 'rule_like_default',
        name: 'Default Like Rule',
        condition: { type: 'like' },
        action: this.scriptVariationEngine && this.useScriptVariation
          ? { mode: 'script_variation', eventType: 'like' }
          : {
              mode: 'random_volley',
              minCount: 1,
              maxCount: 2,
              tier: 'mini',
              shapes: ['heart', 'sphere', 'star']
            },
        priority: 1,
        rateLimitMs: 300
      };
    }

    this.enqueueAction(matchedRule, event, 1);
  }

  evaluateGiftRules(event) {
    const giftName = event.data?.giftName || '';
    const diamondCount = event.data?.diamondCount || 1;
    const repeatCount = event.data?.repeatCount || 1;

    let matchedRule = null;
    for (const rule of this.rules) {
      if (rule.condition.type !== 'gift') continue;

      if (rule.condition.giftName && rule.condition.giftName.toLowerCase() === giftName.toLowerCase()) {
        matchedRule = rule;
        break;
      }
      if (rule.condition.minDiamonds && diamondCount >= rule.condition.minDiamonds) {
        matchedRule = rule;
        break;
      }
    }

    // Default fallback rule if not explicitly mapped
    if (!matchedRule) {
      matchedRule = {
        id: 'fallback_gift',
        priority: diamondCount >= 500 ? 5 : 2,
        action: this.scriptVariationEngine && this.useScriptVariation
          ? { mode: 'script_variation', eventType: 'gift', diamondCount }
          : {
              mode: 'procedural',
              tier: diamondCount >= 1000 ? 'grand' : diamondCount >= 100 ? 'medium' : 'mini'
            }
      };
    }

    this.enqueueAction(matchedRule, event, repeatCount);
  }

  evaluateChatRules(event) {
    const comment = (event.data?.comment || '').trim();
    if (!comment) return;

    let matched = false;
    for (const rule of this.rules) {
      if (rule.condition.type !== 'chat') continue;

      if (rule.condition.regex) {
        const reg = new RegExp(rule.condition.regex, 'i');
        if (reg.test(comment)) {
          this.enqueueAction(rule, event, 1);
          matched = true;
          break;
        }
      }
    }

    if (!matched && this.scriptVariationEngine && this.useScriptVariation) {
      const defaultChatRule = {
        id: 'rule_chat_default_variation',
        name: 'Default Chat Variation',
        condition: { type: 'chat' },
        action: { mode: 'script_variation', eventType: 'comment' },
        priority: 2,
        rateLimitMs: 350
      };
      this.enqueueAction(defaultChatRule, event, 1);
    }
  }

  enqueueAction(rule, sourceEvent, count = 1) {
    this.startQueueProcessor();
    // Check rate limit if defined
    if (rule.rateLimitMs) {
      const now = Date.now();
      const last = this.lastTriggerTime.get(rule.id) || 0;
      if (now - last < rule.rateLimitMs) {
        return; // Dropped by rate limit
      }
      this.lastTriggerTime.set(rule.id, now);
    }

    const priority = rule.priority || 1;
    const actionItem = {
      rule: rule,
      event: sourceEvent,
      count: Math.min(count, 20),
      priority: priority,
      queuedAt: Date.now()
    };

    // Insert sorted by priority descending
    let inserted = false;
    for (let i = 0; i < this.queue.length; i++) {
      if (actionItem.priority > this.queue[i].priority) {
        this.queue.splice(i, 0, actionItem);
        inserted = true;
        break;
      }
    }
    if (!inserted) {
      this.queue.push(actionItem);
    }
  }

  startQueueProcessor() {
    if (this.queueProcessorTimer) return;
    this.queueProcessorTimer = setInterval(() => {
      this.processQueue();
    }, this.settings.queueIntervalMs || 250);
  }

  processQueue() {
    if (this.queue.length === 0) return;

    const item = this.queue.shift();
    if (!item) return;

    this.executeAction(item.rule.action, item.event, item.count);
  }

  executeAction(action, event, count = 1) {
    if (!this.fireworkSystem) return;

    if (this.scriptVariationEngine && (action.mode === 'script_variation' || this.useScriptVariation)) {
      const eventType = action.eventType || (event?.type === 'chat' ? 'comment' : (event?.type || 'like'));
      this.scriptVariationEngine.execute(eventType, event, action);
      return;
    }

    if (action.mode === 'random_volley') {
      const minCount = action.minCount || 1;
      const maxCount = action.maxCount || 2;
      const volleyCount = Math.floor(Math.random() * (maxCount - minCount + 1)) + minCount;
      const shapes = action.shapes || ['heart', 'sphere', 'star'];
      const chosenShape = action.shape || shapes[Math.floor(Math.random() * shapes.length)];
      const volley = proceduralShellGenerator.generateVolley(volleyCount, {
        tier: action.tier || 'mini',
        dynamics: action.dynamics,
        shape: chosenShape,
        color: action.color
      });

      for (const item of volley) {
        setTimeout(() => {
          this.launchGeneratedShell(item.shell, item.offsetPosition);
        }, item.delay * 1000);
      }
      return;
    }

    if (action.mode === 'volley') {
      const volleyCount = action.count || count || 2;
      const volley = proceduralShellGenerator.generateVolley(volleyCount, {
        tier: action.tier || 'medium',
        dynamics: action.dynamics,
        shape: action.shape,
        color: action.color
      });

      for (const item of volley) {
        setTimeout(() => {
          this.launchGeneratedShell(item.shell, item.offsetPosition);
        }, item.delay * 1000);
      }
    } else {
      // Single procedural shell
      const shell = proceduralShellGenerator.generate({
        tier: action.tier || 'mini',
        shape: action.shape,
        dynamics: action.dynamics,
        color: action.color,
        speed: action.speed
      });
      this.launchGeneratedShell(shell);
    }
  }

  launchGeneratedShell(shellConfig, offsetPosition = null) {
    if (!this.fireworkSystem) return;

    // Dynamically scale burst altitude based on shell tier (higher tier reaches higher sky)
    const tier = shellConfig?.tier || 'medium';
    let baseRatioY = 0.48;
    let jitterY = 0.26;

    if (tier === 'mini') {
      baseRatioY = 0.38;
      jitterY = 0.20;
    } else if (tier === 'medium') {
      baseRatioY = 0.52;
      jitterY = 0.24;
    } else if (tier === 'grand') {
      baseRatioY = 0.65;
      jitterY = 0.22;
    } else if (tier === 'super') {
      baseRatioY = 0.74;
      jitterY = 0.16;
    }

    const calculatedRatioY = Math.max(0.24, Math.min(0.82, baseRatioY + (Math.random() - 0.5) * jitterY));

    // Wider horizontal launch area across the central sky (centered at 0.50)
    const calculatedRatioX = 0.50 + (Math.random() - 0.5) * 0.28;

    const options = {
      sectorId: 'center',
      ratioX: calculatedRatioX,
      ratioY: calculatedRatioY,
      effectOverrides: {
        instantBurst: false
      }
    };

    if (offsetPosition) {
      options.offset = offsetPosition;
    }

    // Launch via centralized FireworkSystem
    this.fireworkSystem.launchRandom(shellConfig, options);
  }

  // Update rule set dynamically without re-initializing
  updateRules(newRules) {
    this.rules = Array.isArray(newRules) ? newRules : this.rules;
    console.log('[InteractionManager] Rules updated. Total rules: ' + this.rules.length);
  }
}

