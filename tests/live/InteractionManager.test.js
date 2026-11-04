import { describe, it, expect, vi } from 'vitest';
import { InteractionManager } from '../../src/live/InteractionManager.js';

describe('InteractionManager', () => {
  const customRules = [
    {
      id: 'rule_rose',
      name: 'Rose Rule',
      condition: { type: 'gift', giftName: 'Rose' },
      action: { mode: 'procedural', tier: 'mini' },
      priority: 1,
      rateLimitMs: 50
    },
    {
      id: 'rule_big_gift',
      name: 'Big Gift Rule',
      condition: { type: 'gift', minDiamonds: 1000 },
      action: { mode: 'volley', count: 3, tier: 'grand' },
      priority: 8
    },
    {
      id: 'rule_chat_heart',
      name: 'Chat Heart',
      condition: { type: 'chat', regex: '^!(tim|heart)$' },
      action: { mode: 'procedural', tier: 'mini', shape: 'heart' },
      priority: 2
    }
  ];

  it('should match gift by name and enqueue action', () => {
    const manager = new InteractionManager({ rules: customRules });
    const event = {
      type: 'gift',
      user: { name: 'viewer1' },
      data: { giftName: 'Rose', diamondCount: 1 }
    };

    manager.handleIncomingEvent(event);
    expect(manager.queue.length).toBe(1);
    expect(manager.queue[0].rule.id).toBe('rule_rose');
    expect(manager.queue[0].priority).toBe(1);
  });

  it('should match gift by diamond threshold and prioritize higher diamond gift', () => {
    const manager = new InteractionManager({ rules: customRules });
    
    // Add small gift first
    manager.handleIncomingEvent({
      type: 'gift',
      data: { giftName: 'Rose', diamondCount: 1 }
    });

    // Add big gift second
    manager.handleIncomingEvent({
      type: 'gift',
      data: { giftName: 'Dragon', diamondCount: 2000 }
    });

    expect(manager.queue.length).toBe(2);
    // Highest priority should be first in queue
    expect(manager.queue[0].rule.id).toBe('rule_big_gift');
    expect(manager.queue[1].rule.id).toBe('rule_rose');
  });

  it('should match chat command with regex', () => {
    const manager = new InteractionManager({ rules: customRules });
    manager.handleIncomingEvent({
      type: 'chat',
      data: { comment: '!tim' }
    });

    expect(manager.queue.length).toBe(1);
    expect(manager.queue[0].rule.id).toBe('rule_chat_heart');
  });

  it('should ignore non-matching chat comment', () => {
    const manager = new InteractionManager({ rules: customRules });
    manager.handleIncomingEvent({
      type: 'chat',
      data: { comment: 'Hello streamer' }
    });

    expect(manager.queue.length).toBe(0);
  });

  it('should notify HUD on gift and chat events', () => {
    const mockHud = {
      notifyGift: vi.fn(),
      notifyChat: vi.fn()
    };
    const manager = new InteractionManager({ rules: customRules, hud: mockHud });

    const giftEvent = { type: 'gift', data: { giftName: 'Rose' } };
    manager.handleIncomingEvent(giftEvent);
    expect(mockHud.notifyGift).toHaveBeenCalledWith(giftEvent);

    const chatEvent = { type: 'chat', data: { comment: '!tim' } };
    manager.handleIncomingEvent(chatEvent);
    expect(mockHud.notifyChat).toHaveBeenCalledWith(chatEvent);
  });

  it('should support dynamic rule updates', () => {
    const manager = new InteractionManager({ rules: customRules });
    expect(manager.rules).toHaveLength(3);

    manager.updateRules([{ id: 'new_rule', condition: { type: 'gift' } }]);
    expect(manager.rules).toHaveLength(1);
    expect(manager.rules[0].id).toBe('new_rule');
  });

  it('should launch shells with wide horizontal coverage and tiered burst altitudes', () => {
    let lastOptions = null;
    const mockFireworkSystem = {
      launchRandom: vi.fn((shell, opts) => {
        lastOptions = opts;
      })
    };

    const manager = new InteractionManager({ fireworkSystem: mockFireworkSystem });

    // Mini shell launch
    manager.launchGeneratedShell({ tier: 'mini' });
    expect(mockFireworkSystem.launchRandom).toHaveBeenCalled();
    expect(lastOptions.sectorId).toBe('center');
    expect(lastOptions.ratioX).toBeGreaterThanOrEqual(0.35);
    expect(lastOptions.ratioX).toBeLessThanOrEqual(0.65);
    const miniRatioY = lastOptions.ratioY;

    // Super shell launch
    manager.launchGeneratedShell({ tier: 'super' });
    const superRatioY = lastOptions.ratioY;
    expect(superRatioY).toBeGreaterThanOrEqual(0.60);
    expect(superRatioY).toBeGreaterThan(miniRatioY);
  });

  it('should normalize and process TikFinity WebSocket events', () => {
    const manager = new InteractionManager({ rules: customRules });
    
    // TikFinity gift event
    const tikFinityGift = {
      event: 'gift',
      data: {
        giftName: 'Rose',
        diamonds: 1,
        repeatCount: 1,
        uniqueId: 'tik_user',
        nickname: 'Tik Viewer'
      }
    };
    manager.handleIncomingEvent(tikFinityGift);
    expect(manager.queue.length).toBe(1);
    expect(manager.queue[0].rule.id).toBe('rule_rose');
    expect(manager.queue[0].event.user.nickname).toBe('Tik Viewer');

    // TikFinity chat event
    const tikFinityChat = {
      event: 'chat',
      data: {
        message: '!tim',
        uniqueId: 'tik_user2',
        nickname: 'Viewer 2'
      }
    };
    manager.handleIncomingEvent(tikFinityChat);
    expect(manager.queue.length).toBe(2);
    // rule_chat_heart has priority 2, rule_rose has priority 1, so index 0 is higher priority
    expect(manager.queue[0].rule.id).toBe('rule_chat_heart');
    expect(manager.queue[1].rule.id).toBe('rule_rose');
  });

  it('should handle like tap event and trigger random 1-2 firework volley', () => {
    let volleyCalls = [];
    const mockFireworkSystem = {
      launchRandom: vi.fn((shell, opts) => {
        volleyCalls.push({ shell, opts });
      })
    };

    const manager = new InteractionManager({
      fireworkSystem: mockFireworkSystem
    });

    const likeEvent = {
      type: 'like',
      user: { nickname: 'Fan1' },
      data: { likeCount: 5, totalLikes: 200 }
    };

    manager.handleIncomingEvent(likeEvent);
    expect(manager.queue.length).toBe(1);
    expect(manager.queue[0].rule.id).toBe('rule_like_tap');
    expect(manager.queue[0].rule.action.mode).toBe('random_volley');
    expect(manager.queue[0].rule.action.minCount).toBe(1);
    expect(manager.queue[0].rule.action.maxCount).toBe(2);

    // Process queue
    manager.processQueue();
    // After timeout in volley, launchRandom should be called 1 or 2 times
    // Fast-forward or check synchronous behavior
    expect(manager.queue.length).toBe(0);
  });
});

