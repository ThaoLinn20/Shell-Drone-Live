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
    this.hud = options.hud || null;

    this.socket = null;
    this.status = 'disconnected'; // 'disconnected' | 'connecting' | 'connected'
    this.queue = [];
    this.listeners = new Map();
    this.reconnectTimer = null;
    this.queueProcessorTimer = null;
    this.lastTriggerTime = new Map();
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

  // Handle incoming normalized events from Bridge or Mock injector
  handleIncomingEvent(event) {
    if (!event || !event.type) return;

    if (event.type === 'system') {
      this.emit('system', event);
      return;
    }

    if (event.type === 'gift') {
      this.emit('gift', event);
      if (this.hud && typeof this.hud.notifyGift === 'function') {
        this.hud.notifyGift(event);
      }
      if (this.sceneManager && this.sceneManager.spectatorCrowd) {
        this.sceneManager.spectatorCrowd.onViewerAction(event.user, event.data);
      }
      this.evaluateGiftRules(event);
    } else if (event.type === 'chat') {
      this.emit('chat', event);
      if (this.hud && typeof this.hud.notifyChat === 'function') {
        this.hud.notifyChat(event);
      }
      if (this.sceneManager && this.sceneManager.spectatorCrowd) {
        this.sceneManager.spectatorCrowd.onViewerAction(event.user, event.data);
      }
      this.evaluateChatRules(event);
    }
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
        action: {
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

    for (const rule of this.rules) {
      if (rule.condition.type !== 'chat') continue;

      if (rule.condition.regex) {
        const reg = new RegExp(rule.condition.regex, 'i');
        if (reg.test(comment)) {
          this.enqueueAction(rule, event, 1);
          break;
        }
      }
    }
  }

  enqueueAction(rule, sourceEvent, count = 1) {
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
      count: Math.min(count, 5),
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

    // Viewport-constrained parameters for 9:16 broadcast framing
    const options = {
      sectorId: 'center',
      ratioX: 0.46 + (Math.random() - 0.5) * 0.08,
      ratioY: 0.20 + (Math.random() - 0.5) * 0.12,
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

